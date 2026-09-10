import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const SOURCE = "https://redaa-alhishma.com";
const TARGET = process.env.TARGET_URL || "http://127.0.0.1:3010";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@slyrah.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";
const ROOT = path.resolve(import.meta.dirname, "..");
const ASSET_ROOT = path.join(ROOT, "public", "uploads", "redaa");
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36";

const heroSources = [
  "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/05/25131303/ChatGPT-Image-May-25-2026-02_51_06-PM.webp",
  "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/07/01161727/ChatGPT-Image-Jul-1-2026-07_01_45-PM.png",
  "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/07/01161732/ChatGPT-Image-Jul-1-2026-06_32_07-PM.png"
];

const identitySources = {
  logo: "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/01/01072422/LOGO-Font-Edit-2.webp",
  logoLight: "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/01/01072554/LOGO-White.png",
  favicon: "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/01/04101912/FAV-ICON-2-200x200.png?tr=q-80&sig=2b843036a2eb64cc7a2e54a8a9576146",
  businessCenter: "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/03/24125036/%D8%B4%D8%B9%D8%A7%D8%B1-%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D9%84%D9%84%D8%A3%D8%B9%D9%85%D8%A7%D9%84-%E2%80%93-Saudi-Business-Center-Logo-%E2%80%93-PNG-%E2%80%93-SVG-1.png",
  paymentMethods: "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/03/24124221/payment-2.png"
};

const mobileHeroSources = [
  "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/05/25132759/ChatGPT-Image-May-25-2026-02_57_41-PM.webp",
  "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/07/01161719/ChatGPT-Image-Jul-1-2026-07_03_32-PM.png",
  "https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/07/01161736/ChatGPT-Image-Jul-1-2026-06_31_58-PM.png"
];

const colorHex = new Map(Object.entries({
  "أبيض":"#FFFFFF", "أحمر":"#F50000", "أخضر":"#488E2C", "أزرق":"#1E73BE", "أسود":"#000000",
  "أصفر":"#EEEE22", "ازرق سماوي":"#76C8DE", "بنفسجي":"#8224E3", "بني":"#87291B", "بيج":"#AF853C",
  "تيفني":"#A0EEE8", "رمادي":"#A3A3A3", "رمادي غامق":"#3F3F3F", "رمادي فاتح":"#CBC8C8", "روز":"#E004AD",
  "زيتي":"#8A9904", "كحلي":"#04186B", "نبيتي":"#851E1E", "وردي":"#DD7E7E"
}));

function sourceHeaders() {
  return { "User-Agent": USER_AGENT, Accept: "application/json", Referer: `${SOURCE}/shop/` };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...sourceHeaders(), ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

function cleanUrl(value = "") {
  return String(value).replaceAll("&amp;", "&").replaceAll("&#038;", "&");
}

function decodeSlug(value = "") {
  try { return decodeURIComponent(value); } catch { return value; }
}

function slugify(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "");
}

function plainText(value = "") {
  return String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function amount(prices = {}, field = "price") {
  const minor = Number(prices.currency_minor_unit || 0);
  return Number(prices[field] || 0) / (10 ** minor);
}

async function pooled(items, limit, worker) {
  const result = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      result[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return result;
}

function localUrl(relativePath) {
  return `/uploads/redaa/${relativePath.split(path.sep).join("/")}`;
}

async function downloadImage(url, relativePath, format = "webp") {
  const destination = path.join(ASSET_ROOT, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive:true });
  const response = await fetch(cleanUrl(url), { headers:{ "User-Agent":USER_AGENT, Accept:"image/avif,image/webp,image/apng,image/*,*/*;q=0.8" } });
  if (!response.ok) throw new Error(`Image ${response.status}: ${url}`);
  const input = Buffer.from(await response.arrayBuffer());
  const pipeline = sharp(input).rotate().resize({ width:1800, height:1800, fit:"inside", withoutEnlargement:true });
  if (format === "png") await pipeline.png({ compressionLevel:9 }).toFile(destination);
  else await pipeline.webp({ quality:84, effort:4 }).toFile(destination);
  return localUrl(relativePath);
}

function imageKey(url) {
  return crypto.createHash("sha1").update(cleanUrl(url)).digest("hex").slice(0, 14);
}

async function targetApi(endpoint, { token, method = "GET", body } = {}) {
  const response = await fetch(`${TARGET}${endpoint}`, {
    method,
    headers:{ Accept:"application/json", ...(body ? { "Content-Type":"application/json" } : {}), ...(token ? { Authorization:`Bearer ${token}` } : {}) },
    body:body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error(payload?.error?.message || `${response.status}: ${endpoint}`);
  return payload?.data ?? payload;
}

async function main() {
  console.log("Fetching source catalog...");
  const [products, categories, brands, attributes] = await Promise.all([
    fetchJson(`${SOURCE}/wp-json/wc/store/v1/products?per_page=100`),
    fetchJson(`${SOURCE}/wp-json/wc/store/v1/products/categories?per_page=100`),
    fetchJson(`${SOURCE}/wp-json/wc/store/v1/products/brands?per_page=100`),
    fetchJson(`${SOURCE}/wp-json/wc/store/v1/products/attributes`)
  ]);

  const attributeTerms = new Map();
  await pooled(attributes, 4, async (attribute) => {
    const terms = await fetchJson(`${SOURCE}/wp-json/wc/store/v1/products/attributes/${attribute.id}/terms?per_page=100`);
    attributeTerms.set(attribute.id, terms);
  });

  const variantRefs = products.flatMap((product) => product.variations.map((variation) => ({ productId:product.id, ...variation })));
  console.log(`Fetching ${variantRefs.length} product variations...`);
  const variantDetails = await pooled(variantRefs, 8, async (variation) => {
    try { return await fetchJson(`${SOURCE}/wp-json/wc/store/v1/products/${variation.id}`); }
    catch (error) { console.warn(`Skipped variation ${variation.id}: ${error.message}`); return null; }
  });
  const variantById = new Map(variantDetails.filter(Boolean).map((variant) => [variant.id, variant]));

  await fs.rm(ASSET_ROOT, { recursive:true, force:true });
  await fs.mkdir(ASSET_ROOT, { recursive:true });
  const assets = new Map();
  const requests = [];
  const queueImage = (url, folder, label, format = "webp") => {
    if (!url) return "";
    const key = cleanUrl(url);
    if (!assets.has(key)) {
      const extension = format === "png" ? "png" : "webp";
      const relative = `${folder}/${slugify(label) || imageKey(key)}-${imageKey(key)}.${extension}`;
      assets.set(key, localUrl(relative));
      requests.push({ url:key, relative, format });
    }
    return assets.get(key);
  };

  const logoUrl = queueImage(identitySources.logo, "brand", "logo", "webp");
  const logoLightUrl = queueImage(identitySources.logoLight, "brand", "logo-light", "png");
  const faviconUrl = queueImage(identitySources.favicon, "brand", "favicon", "png");
  const businessCenterLogoUrl = queueImage(identitySources.businessCenter, "brand", "saudi-business-center", "png");
  const paymentMethodsImageUrl = queueImage(identitySources.paymentMethods, "brand", "payment-methods", "png");
  const heroUrls = heroSources.map((url, index) => queueImage(url, "home", `hero-${index + 1}`));
  const mobileHeroUrls = mobileHeroSources.map((url, index) => queueImage(url, "home", `hero-mobile-${index + 1}`));
  categories.forEach((category) => queueImage(category.image?.src, "categories", category.name));
  products.forEach((product) => product.images.forEach((image, index) => queueImage(image.src, `products/${product.id}`, `gallery-${index + 1}`)));
  variantDetails.filter(Boolean).forEach((variant) => variant.images?.forEach((image, index) => queueImage(image.src, "variants", `${variant.id}-${index + 1}`)));
  console.log(`Downloading and optimizing ${requests.length} unique images...`);
  await pooled(requests, 6, async (request, index) => {
    await downloadImage(request.url, request.relative, request.format);
    if ((index + 1) % 20 === 0 || index + 1 === requests.length) console.log(`Images ${index + 1}/${requests.length}`);
  });

  const login = await targetApi("/api/admin/auth/login", { method:"POST", body:{ email:ADMIN_EMAIL, password:ADMIN_PASSWORD } });
  const token = login.token;
  console.log("Replacing existing catalog...");
  await targetApi("/api/admin/catalog/reset", { token, method:"POST", body:{} });

  const categoryBySourceId = new Map();
  for (const category of categories) {
    const created = await targetApi("/api/admin/categories", { token, method:"POST", body:{
      source_id:category.id,
      name_ar:category.name,
      name_en:category.name,
      slug:decodeSlug(category.slug) || slugify(category.name),
      description_ar:plainText(category.description),
      description_en:plainText(category.description),
      image_url:assets.get(cleanUrl(category.image?.src || "")) || "",
      is_active:true
    }});
    categoryBySourceId.set(category.id, created.category || created);
  }

  const brand = brands[0] || { id:98, name:"رداء الحشمة", slug:"رداء-الحشمة" };
  const createdBrandPayload = await targetApi("/api/admin/brands", { token, method:"POST", body:{
    source_id:brand.id,
    name_ar:brand.name,
    name_en:"Redaa Alhishma",
    slug:decodeSlug(brand.slug) || "رداء-الحشمة",
    description_ar:"رداء الحشمة، منتجات صلاة مصممة بأيدٍ سعودية.",
    description_en:"Redaa Alhishma prayer wear, designed in Saudi Arabia.",
    logo_url:logoUrl,
    is_active:true
  }});
  const createdBrand = createdBrandPayload.brand || createdBrandPayload;

  const colorTerms = attributeTerms.get(10) || [];
  for (const color of colorTerms) {
    await targetApi("/api/admin/colors", { token, method:"POST", body:{ source_id:color.id, nameAr:color.name, nameEn:color.name, slug:decodeSlug(color.slug), color:colorHex.get(color.name) || "#777777", isActive:true, is_active:true } });
  }
  const optionAttributes = attributes.filter((attribute) => attribute.id !== 10);
  for (const attribute of optionAttributes) {
    for (const term of attributeTerms.get(attribute.id) || []) {
      await targetApi("/api/admin/options", { token, method:"POST", body:{ source_id:term.id, group_id:attribute.id, groupAr:attribute.name, groupEn:attribute.name, nameAr:term.name, nameEn:term.name, slug:decodeSlug(term.slug), isActive:true, is_active:true } });
    }
  }

  const termNames = new Map();
  for (const attribute of attributes) for (const term of attributeTerms.get(attribute.id) || []) termNames.set(`${attribute.id}:${term.slug}`, term.name);
  let importedProducts = 0;
  for (const product of products) {
    const primarySourceCategory = product.categories.find((category) => category.id !== 99) || product.categories[0];
    const category = categoryBySourceId.get(primarySourceCategory?.id) || categoryBySourceId.values().next().value;
    const productImages = product.images.map((image) => assets.get(cleanUrl(image.src))).filter(Boolean);
    const variants = product.variations.map((reference, index) => {
      const details = variantById.get(reference.id);
      if (!details) return null;
      const selected = reference.attributes.map((attribute) => ({ ...attribute, display:termNames.get(`${product.attributes.find((item) => item.name === attribute.name)?.id}:${attribute.value}`) || decodeSlug(attribute.value) }));
      const color = selected.find((attribute) => attribute.name === "اللون")?.display || "";
      const optionValues = selected.filter((attribute) => attribute.name !== "اللون");
      const option = optionValues.map((attribute) => attribute.name).join(" / ");
      const value = optionValues.map((attribute) => attribute.display).join(" / ");
      const salePrice = amount(details.prices, "sale_price") || amount(details.prices, "price");
      const regularPrice = amount(details.prices, "regular_price") || salePrice;
      return {
        id:`wc-${reference.id}`,
        source_id:reference.id,
        type:color && value ? "color_option" : color ? "color" : "option",
        color,
        hex_code:colorHex.get(color) || "#777777",
        option,
        value,
        image_url:assets.get(cleanUrl(details.images?.[0]?.src || "")) || productImages[0] || "",
        price:salePrice,
        compare_at_price:regularPrice > salePrice ? regularPrice : null,
        cost:0,
        stock:null,
        is_active:details.is_purchasable !== false && details.is_in_stock !== false,
        sort_order:index
      };
    }).filter(Boolean);
    const salePrice = amount(product.prices, "sale_price") || amount(product.prices, "price");
    const regularPrice = amount(product.prices, "regular_price") || salePrice;
    const description = plainText(product.description);
    const shortDescription = plainText(product.short_description) || description.slice(0, 220);
    await targetApi("/api/admin/products", { token, method:"POST", body:{
      source_id:product.id,
      source_url:product.permalink,
      sku:product.sku || "",
      name_ar:product.name,
      name_en:product.name,
      slug:decodeSlug(product.slug) || slugify(product.name),
      short_description_ar:shortDescription,
      short_description_en:shortDescription,
      description_ar:description,
      description_en:description,
      meta_title_ar:product.name,
      meta_title_en:product.name,
      meta_description_ar:shortDescription,
      meta_description_en:shortDescription,
      category_id:category?.id || 0,
      category_slug:category?.slug || "",
      category_name_ar:category?.name_ar || "",
      category_name_en:category?.name_en || "",
      category:{ id:category?.id || 0, slug:category?.slug || "", name_ar:category?.name_ar || "", name_en:category?.name_en || "", image_url:category?.image_url || "" },
      brand_id:createdBrand.id,
      brand_slug:createdBrand.slug,
      brand_ar:createdBrand.name_ar,
      brand_en:createdBrand.name_en,
      brand:{ id:createdBrand.id, slug:createdBrand.slug, name_ar:createdBrand.name_ar, name_en:createdBrand.name_en, logo_url:logoUrl },
      main_photo_url:productImages[0] || "",
      image_url:productImages[0] || "",
      side_photos:productImages.slice(1),
      gallery:productImages,
      images:productImages,
      price:regularPrice,
      sale_price:salePrice,
      price_before:regularPrice > salePrice ? regularPrice : null,
      cost:0,
      stock:null,
      labels:[...(product.categories.some((item) => item.id === 99) ? ["الأكثر مبيعاً"] : []), ...(regularPrice > salePrice ? ["تخفيض"] : [])],
      attributes:product.attributes,
      variants,
      is_active:product.is_purchasable !== false && product.is_in_stock !== false
    }});
    importedProducts += 1;
    console.log(`Products ${importedProducts}/${products.length}`);
  }

  const company = {
    site_name_ar:"رداء الحشمة",
    site_name_en:"Redaa Alhishma",
    tagline_ar:"حشمة تليق بك",
    tagline_en:"Modesty made for you",
    description_ar:"رداء الحشمة مخصصة للنساء، مصممة بأيدٍ سعودية ومحملة بالأماني. نصل لجميع مناطق المملكة.",
    description_en:"Redaa Alhishma is designed for women by Saudi hands and delivered across the Kingdom.",
    logo_url:logoUrl,
    logo_light_url:logoLightUrl,
    favicon_url:faviconUrl,
    business_center_logo_url:businessCenterLogoUrl,
    payment_methods_image_url:paymentMethodsImageUrl,
    phone:"+966 55 084 5195",
    whatsapp:"+966550845195",
    address_ar:"الرياض، السعودية",
    address_en:"Riyadh, Saudi Arabia",
    commercial_registration:"7031508596",
    business_document:"0000207385",
    facebook_url:"https://www.facebook.com/profile.php?id=61582363293229",
    instagram_url:"https://www.instagram.com/redaa_elhishma/",
    tiktok_url:"https://www.tiktok.com/@redaa.alhishma"
  };
  await targetApi("/api/admin/company-info", { token, method:"PUT", body:company });
  await targetApi("/api/admin/brand-identity", { token, method:"PUT", body:{
    primary_color:"#583A80", primary_dark_color:"#3B215D", sale_color:"#D51F26", footer_color:"#23190E",
    surface_color:"#FFFFFF", header_color:"#FFFFFF", text_color:"#2A2430", muted_color:"#777277",
    font_ar:"Jannah LT, Noto Kufi Arabic, sans-serif", font_en:"Inter, sans-serif", heading_weight:700, body_weight:400,
    card_radius:10, button_radius:100, input_radius:4, product_image_ratio:"1 / 1", shadow_style:"soft"
  }});
  const currencySettings = await targetApi("/api/admin/currencies", { token });
  currencySettings.base_currency = "SAR";
  currencySettings.display_mode = "fixed";
  currencySettings.currencies = currencySettings.currencies.map((currency) => ({ ...currency, is_active:currency.code === "SAR" ? true : currency.is_active, exchange_rate:currency.code === "SAR" ? 1 : currency.exchange_rate }));
  await targetApi("/api/admin/currencies", { token, method:"PUT", body:currencySettings });
  await targetApi("/api/admin/storefront-layout", { token, method:"PUT", body:{
    announcement:{ is_active:true, messages:[{ id:"free-shipping", text_ar:"شحن مجاني داخل المملكة عند شرائك قطعتين أو أكثر", text_en:"Free shipping across the Kingdom when buying two items or more", link_label_ar:"تسوق الآن", link_label_en:"Shop now", link_url:"/products", is_active:true }] },
    header:{ sticky:true, show_search:true, show_account:true, show_wishlist:true, show_cart:true, show_category_strip:true },
    footer:{ show_description:true, show_business_info:true, show_contact:true, show_social:true, show_policies:true, copyright_ar:"جميع الحقوق محفوظة © رداء الحشمة", copyright_en:"All rights reserved © Redaa Alhishma" }
  }});
  await targetApi("/api/admin/home-builder", { token, method:"PUT", body:{
    slides:heroUrls.map((url, index) => ({ id:`redaa-hero-${index + 1}`, title_ar:"", title_en:"", subtitle_ar:"", subtitle_en:"", cta_ar:"", cta_en:"", link_url:"/products", desktop_image_url:url, mobile_image_url:mobileHeroUrls[index], is_active:true })),
    sections:[
      { id:"best-offers", type:"products", title_ar:"أفضل عروض رداء الحشمة", title_en:"Best offers", source:"sale", order:1, is_active:true },
      { id:"shop-categories", type:"categories", title_ar:"تسوق التصنيفات", title_en:"Shop categories", source:"categories", order:2, is_active:true },
      { id:"latest", type:"products", title_ar:"وصل حديثاً", title_en:"New arrivals", source:"latest", order:3, is_active:true }
    ]
  }});
  await targetApi("/api/admin/image-gallery/sync", { token, method:"POST", body:{} });

  console.log(JSON.stringify({ products:products.length, categories:categories.length, brands:1, colors:colorTerms.length, options:optionAttributes.reduce((sum, attribute) => sum + (attributeTerms.get(attribute.id)?.length || 0), 0), variants:variantDetails.filter(Boolean).length, images:requests.length }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
