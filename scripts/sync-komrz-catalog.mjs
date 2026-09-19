import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import Database from "better-sqlite3";
import sharp from "sharp";

const args = Object.fromEntries(process.argv.slice(2).map((entry) => {
  const [key, ...value] = entry.replace(/^--/, "").split("=");
  return [key, value.length ? value.join("=") : true];
}));

const sourceFile = path.resolve(String(args.source || "/root/hst_backups/komrz-catalog-source-20260919/woocommerce-products-full.json"));
const dbFile = path.resolve(String(args.db || "data/slyrah.sqlite"));
const uploadsRoot = path.resolve(String(args.uploads || "public/uploads"));
const reportDir = path.resolve(String(args.reports || path.dirname(sourceFile)));
const shouldApply = args.apply === true || args.apply === "true";
const shouldDownload = args.download === true || args.download === "true" || shouldApply;

const sourceRows = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const db = new Database(dbFile, { readonly: !shouldApply, fileMustExist: true });
db.pragma("busy_timeout = 15000");

const clean = (value) => String(value || "").trim();
const numberOrNull = (value) => clean(value) === "" || !Number.isFinite(Number(value)) ? null : Number(value);
const splitList = (value) => clean(value).split(/,\s*/).map(clean).filter(Boolean);
const unique = (values) => [...new Set(values.filter(Boolean))];
const normalizeKey = (value) => clean(value).toLocaleLowerCase("ar").replace(/[إأآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[.،,\-–—_\s]+/g, "");
const slugify = (value) => clean(value).toLocaleLowerCase("ar").replace(/[إأآ]/g, "ا").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
const plainText = (html) => clean(html).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ");

function rowsFor(entity) {
  return db.prepare("SELECT id, payload, created_at, updated_at FROM records WHERE entity = ? AND is_deleted = 0 ORDER BY id").all(entity).map((row) => ({
    id: row.id,
    ...JSON.parse(row.payload),
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

const currentProducts = rowsFor("products");
const categories = rowsFor("categories");
const brands = rowsFor("brands");
const colors = rowsFor("colors");
const options = rowsFor("options");
const defaultBrand = brands.find((brand) => normalizeKey(brand.name_ar) === normalizeKey("رداء الحشمة")) || brands[0] || null;

const parentRows = sourceRows.filter((row) => row["النوع"] !== "variation");
const parentByReference = new Map();
for (const parent of parentRows) {
  parentByReference.set(`id:${parent["المعرف"]}`, parent);
  parentByReference.set(parent["المعرف"], parent);
  if (clean(parent["رمز المنتج (SKU)"])) parentByReference.set(clean(parent["رمز المنتج (SKU)"]).toLocaleLowerCase("en"), parent);
}

const variationsByParentId = new Map(parentRows.map((parent) => [clean(parent["المعرف"]), []]));
for (const variation of sourceRows.filter((row) => row["النوع"] === "variation")) {
  const reference = clean(variation["الأب"]);
  const parent = parentByReference.get(reference) || parentByReference.get(reference.toLocaleLowerCase("en"));
  if (parent) variationsByParentId.get(clean(parent["المعرف"])).push(variation);
}

function categoryFor(parent) {
  const sourceNames = splitList(parent["التصنيفات"]);
  const preferred = sourceNames.find((name) => !normalizeKey(name).includes(normalizeKey("الأكثر مبيع"))) || sourceNames[0] || "";
  return categories.find((category) => [category.name_ar, category.name_en, category.slug].some((value) => normalizeKey(value) === normalizeKey(preferred))) || null;
}

function currentMatch(parent, claimedIds) {
  const sourceId = Number(parent["المعرف"]);
  const sku = clean(parent["رمز المنتج (SKU)"]).toLocaleUpperCase("en");
  const nameKey = normalizeKey(parent["الاسم"]);
  const candidates = currentProducts.filter((product) => !claimedIds.has(product.id));
  return candidates.find((product) => Number(product.source_id) === sourceId)
    || candidates.find((product) => sku && clean(product.sku).toLocaleUpperCase("en") === sku)
    || candidates.find((product) => [product.image_url, product.main_photo_url, ...(product.side_photos || [])].some((url) => String(url || "").includes(`/products/${sourceId}/`)))
    || candidates.find((product) => normalizeKey(product.name_ar) === nameKey)
    || null;
}

function attributePair(row) {
  return [1, 2].map((index) => ({
    name: clean(row[`اسم السمة ${index}`]),
    value: clean(row[`قيمة/قيم السمة ${index}`])
  })).filter((attribute) => attribute.name && attribute.value);
}

function sourceImageUrls(parent, variations) {
  return unique([
    ...splitList(parent["الصور"]),
    ...variations.flatMap((variation) => splitList(variation["الصور"]))
  ]);
}

const allImageUrls = unique(parentRows.flatMap((parent) => sourceImageUrls(parent, variationsByParentId.get(clean(parent["المعرف"])) || [])));
const imagePathByUrl = new Map();

async function downloadImages() {
  if (!shouldDownload) return { downloaded: 0, reused: 0, failed: [] };
  const target = path.join(uploadsRoot, "komrz-sync");
  fs.mkdirSync(target, { recursive: true });
  let cursor = 0;
  let downloaded = 0;
  let reused = 0;
  const failed = [];

  async function worker() {
    while (cursor < allImageUrls.length) {
      const index = cursor++;
      const url = allImageUrls[index];
      const digest = crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
      const filename = `${String(index + 1).padStart(3, "0")}-${digest}.webp`;
      const diskPath = path.join(target, filename);
      const publicPath = `/uploads/komrz-sync/${filename}`;
      imagePathByUrl.set(url, publicPath);
      if (fs.existsSync(diskPath) && fs.statSync(diskPath).size > 0) {
        reused += 1;
        continue;
      }
      try {
        const response = await fetch(url, { headers: { "user-agent": "SITEYFY catalog migration/1.0", accept: "image/avif,image/webp,image/*,*/*;q=0.8" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const input = Buffer.from(await response.arrayBuffer());
        await sharp(input, { failOn: "none" }).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 86, effort: 4 }).toFile(diskPath);
        downloaded += 1;
      } catch (error) {
        imagePathByUrl.delete(url);
        failed.push({ url, error: error.message });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, allImageUrls.length || 1) }, worker));
  return { downloaded, reused, failed };
}

function localImage(url) {
  return imagePathByUrl.get(url) || clean(url);
}

function colorHex(name) {
  const row = colors.find((item) => [item.nameAr, item.name_ar, item.nameEn, item.name_en, item.slug].some((value) => normalizeKey(value) === normalizeKey(name)));
  return clean(row?.hex_code || row?.color || row?.hex);
}

function productPayload(parent, current) {
  const sourceId = Number(parent["المعرف"]);
  const variationRows = variationsByParentId.get(clean(parent["المعرف"])) || [];
  const category = categoryFor(parent);
  const parentImages = splitList(parent["الصور"]).map(localImage);
  const imageByColor = new Map();
  for (const row of variationRows) {
    const color = attributePair(row).find((attribute) => normalizeKey(attribute.name) === normalizeKey("اللون"))?.value;
    const image = splitList(row["الصور"])[0];
    if (color && image && !imageByColor.has(normalizeKey(color))) imageByColor.set(normalizeKey(color), localImage(image));
  }

  const variants = variationRows.map((row, index) => {
    const attributes = attributePair(row);
    const color = attributes.find((attribute) => normalizeKey(attribute.name) === normalizeKey("اللون"))?.value || "";
    const optionAttribute = attributes.find((attribute) => normalizeKey(attribute.name) !== normalizeKey("اللون"));
    const regular = numberOrNull(row["السعر الافتراضي"]);
    const sale = numberOrNull(row["سعر التخفيض"]);
    const available = clean(row["متوفر؟"]) === "1";
    const stock = numberOrNull(row["المخزون"]);
    const inventoryMode = !available ? "out_of_stock" : stock !== null && stock > 0 ? "tracked" : "unlimited";
    const directImage = splitList(row["الصور"])[0];
    return {
      id: `komrz-${row["المعرف"]}`,
      source_id: Number(row["المعرف"]),
      type: color && optionAttribute ? "color_option" : color ? "color" : "option",
      color,
      color_id: null,
      hex_code: colorHex(color),
      option: optionAttribute?.name || "",
      value: optionAttribute?.value || "",
      sku: clean(row["رمز المنتج (SKU)"]).toLocaleUpperCase("en"),
      barcode: clean(row["GTIN، أو UPC، أو EAN، أو ISBN"]),
      image_url: directImage ? localImage(directImage) : imageByColor.get(normalizeKey(color)) || parentImages[0] || "",
      price: sale ?? regular ?? 0,
      compare_at_price: sale !== null && regular !== null && regular > sale ? regular : null,
      cost: Number(current?.variants?.find((item) => Number(item.source_id) === Number(row["المعرف"]))?.cost || 0),
      price_adjustment: 0,
      weight: numberOrNull(row["الوزن (كيلوجرام)"]) ?? numberOrNull(parent["الوزن (كيلوجرام)"]),
      inventory_mode: inventoryMode,
      stock: inventoryMode === "tracked" ? stock : inventoryMode === "out_of_stock" ? 0 : null,
      is_in_stock: available,
      stock_status: available ? "in_stock" : "out_of_stock",
      is_active: clean(row["تم النشر"]) === "1",
      sort_order: index
    };
  });

  const salePrices = variants.map((variant) => variant.price).filter((value) => Number.isFinite(value) && value >= 0);
  const regularPrices = variants.map((variant) => variant.compare_at_price ?? variant.price).filter((value) => Number.isFinite(value) && value >= 0);
  const firstSale = salePrices.length ? Math.min(...salePrices) : numberOrNull(parent["سعر التخفيض"]) ?? numberOrNull(parent["السعر الافتراضي"]) ?? Number(current?.sale_price || current?.price || 0);
  const firstRegular = regularPrices.length ? Math.min(...regularPrices) : numberOrNull(parent["السعر الافتراضي"]) ?? Number(current?.price || firstSale);
  const shortHtml = clean(parent["وصف قصير"]);
  const descriptionHtml = clean(parent["الوصف"]);
  const name = clean(parent["الاسم"]);
  const allImages = unique([...parentImages, ...variants.map((variant) => variant.image_url)]);
  const mainImage = parentImages[0] || allImages[0] || current?.image_url || "";
  const activeVariants = variants.filter((variant) => variant.is_active !== false);
  const attributes = [1, 2].map((index) => ({ name: clean(parent[`اسم السمة ${index}`]), values: splitList(parent[`قيمة/قيم السمة ${index}`]) })).filter((attribute) => attribute.name && attribute.values.length).map((attribute, index) => ({
    id: index + 1,
    name: attribute.name,
    taxonomy: normalizeKey(attribute.name) === normalizeKey("اللون") ? "pa_color" : "pa_al-sharshaf-type",
    has_variations: true,
    terms: attribute.values.map((value, termIndex) => ({ id: termIndex + 1, name: value, slug: slugify(value) }))
  }));

  return {
    ...(current || {}),
    source: "komrz",
    source_id: sourceId,
    source_synced_at: new Date().toISOString(),
    sku: clean(parent["رمز المنتج (SKU)"]).toLocaleUpperCase("en") || clean(current?.sku) || `KOMRZ-${sourceId}`,
    barcode: clean(parent["GTIN، أو UPC، أو EAN، أو ISBN"]) || clean(current?.barcode),
    name_ar: name,
    name_en: current?.name_en || name,
    slug: current?.slug || slugify(name),
    short_description_ar: plainText(shortHtml),
    short_description_en: current?.short_description_en || plainText(shortHtml),
    description_ar: descriptionHtml || shortHtml,
    description_en: current?.description_en || plainText(descriptionHtml || shortHtml),
    meta_title_ar: clean(parent["بيانات ميتا: _seopress_titles_title"]) || name,
    meta_title_en: current?.meta_title_en || name,
    meta_description_ar: clean(parent["بيانات ميتا: _seopress_titles_desc"]) || plainText(shortHtml),
    meta_description_en: current?.meta_description_en || plainText(shortHtml),
    category_id: category?.id || current?.category_id || null,
    category_slug: category?.slug || current?.category_slug || "",
    category_name_ar: category?.name_ar || current?.category_name_ar || "",
    category_name_en: category?.name_en || current?.category_name_en || "",
    category: category ? { id: category.id, slug: category.slug, name_ar: category.name_ar, name_en: category.name_en, image_url: category.image_url } : current?.category,
    brand_id: defaultBrand?.id || current?.brand_id || null,
    brand_slug: defaultBrand?.slug || current?.brand_slug || "",
    brand_ar: defaultBrand?.name_ar || current?.brand_ar || "",
    brand_en: defaultBrand?.name_en || current?.brand_en || "",
    brand: defaultBrand ? { id: defaultBrand.id, slug: defaultBrand.slug, name_ar: defaultBrand.name_ar, name_en: defaultBrand.name_en, logo_url: defaultBrand.logo_url } : current?.brand,
    main_photo_url: mainImage,
    image_url: mainImage,
    side_photos: allImages.slice(1),
    gallery: allImages,
    images: allImages,
    price: firstRegular,
    sale_price: firstSale,
    price_before: firstRegular,
    stock: null,
    inventory_mode: "unlimited",
    attributes,
    variants,
    active_variants: activeVariants,
    is_active: clean(parent["تم النشر"]) === "1",
    labels: unique([...(current?.labels || []), ...(splitList(parent["التصنيفات"]).some((name) => normalizeKey(name).includes(normalizeKey("الأكثر مبيع"))) ? ["الأكثر مبيعاً"] : []), ...(firstRegular > firstSale ? ["تخفيض"] : [])]),
    weight: numberOrNull(parent["الوزن (كيلوجرام)"]) ?? current?.weight ?? null,
    length: numberOrNull(parent["الطول (سنتيميتر)"]) ?? current?.length ?? null,
    width: numberOrNull(parent["العرض (سنتيميتر)"]) ?? current?.width ?? null,
    height: numberOrNull(parent["الارتفاع (سنتيميتر)"]) ?? current?.height ?? null,
    requires_shipping: true,
    origin_country_code: current?.origin_country_code || "SA",
    goods_type_id: current?.goods_type_id || "normal",
    shipping_profile_id: current?.shipping_profile_id || (normalizeKey(category?.name_ar).includes(normalizeKey("سجاد")) ? "prayer-mat" : "apparel-light"),
    shipping_data_source: numberOrNull(parent["الوزن (كيلوجرام)"]) ? "imported" : current?.shipping_data_source || "estimated"
  };
}

const imageResult = await downloadImages();
const claimedIds = new Set();
const normalizedProducts = [];
const comparison = [];
for (const parent of parentRows) {
  const match = currentMatch(parent, claimedIds);
  if (match) claimedIds.add(match.id);
  const payload = productPayload(parent, match);
  normalizedProducts.push({ current_id: match?.id || null, payload });
  comparison.push({
    source_id: payload.source_id,
    source_sku: clean(parent["رمز المنتج (SKU)"]),
    name: payload.name_ar,
    action: match ? "update" : "create",
    current_id: match?.id || null,
    published: payload.is_active,
    variants_before: match?.variants?.length || 0,
    variants_after: payload.variants.length,
    price_before: match?.sale_price ?? match?.price ?? null,
    price_after: payload.sale_price,
    regular_price_after: payload.price,
    images_after: payload.images.length
  });
}

const sourceColorNames = unique(normalizedProducts.flatMap(({ payload }) => payload.variants.map((variant) => variant.color).filter(Boolean)));
const missingColors = sourceColorNames.filter((name) => !colors.some((color) => [color.nameAr, color.name_ar, color.nameEn, color.name_en, color.slug].some((value) => normalizeKey(value) === normalizeKey(name))));
const colorDefaults = { "عودي": "#6B2D3E", "كشمير": "#C58B8B", "وردي طوبي": "#B96B67", "عنابي": "#6D162C" };

const report = {
  generated_at: new Date().toISOString(),
  source_file: sourceFile,
  source_rows: sourceRows.length,
  source_products: parentRows.length,
  source_variations: sourceRows.length - parentRows.length,
  current_products: currentProducts.length,
  updates: comparison.filter((item) => item.action === "update").length,
  creates: comparison.filter((item) => item.action === "create").length,
  untouched_current: currentProducts.filter((product) => !claimedIds.has(product.id)).map((product) => ({ id: product.id, sku: product.sku, name_ar: product.name_ar })),
  missing_colors: missingColors,
  images: { total_unique: allImageUrls.length, ...imageResult },
  products: comparison
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "normalized-products.json"), `${JSON.stringify(normalizedProducts, null, 2)}\n`);
fs.writeFileSync(path.join(reportDir, "comparison-report.json"), `${JSON.stringify(report, null, 2)}\n`);

if (shouldApply) {
  const now = new Date().toISOString();
  const insert = db.prepare("INSERT INTO records (entity, payload, created_at, updated_at) VALUES ('products', ?, ?, ?)");
  const update = db.prepare("UPDATE records SET payload = ?, updated_at = ?, is_deleted = 0 WHERE entity = 'products' AND id = ?");
  const insertColor = db.prepare("INSERT INTO records (entity, payload, created_at, updated_at) VALUES ('colors', ?, ?, ?)");
  db.transaction(() => {
    for (const item of normalizedProducts) {
      const payload = { ...item.payload };
      delete payload.created_at;
      delete payload.updated_at;
      if (item.current_id) {
        payload.id = item.current_id;
        update.run(JSON.stringify(payload), now, item.current_id);
      } else {
        delete payload.id;
        const result = insert.run(JSON.stringify(payload), now, now);
        payload.id = Number(result.lastInsertRowid);
        update.run(JSON.stringify(payload), now, payload.id);
      }
    }
    for (const name of missingColors) {
      const hex = colorDefaults[name] || "#8A7F79";
      insertColor.run(JSON.stringify({ nameAr: name, nameEn: name, slug: slugify(name), color: hex, hex_code: hex, isActive: true, is_active: true, source: "komrz" }), now, now);
    }
  })();
  db.pragma("wal_checkpoint(PASSIVE)");
}

db.close();
console.log(JSON.stringify({ applied: shouldApply, report: path.join(reportDir, "comparison-report.json"), ...report }, null, 2));
