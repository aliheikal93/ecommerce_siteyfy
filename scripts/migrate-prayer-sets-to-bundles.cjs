#!/usr/bin/env node
const Database = require('better-sqlite3');
const crypto = require('node:crypto');

const dbFile = process.env.DB_PATH || '/app/data/slyrah.sqlite';
const shouldApply = process.argv.includes('--apply');
const db = new Database(dbFile, { readonly: !shouldApply, fileMustExist: true });
db.pragma('busy_timeout = 15000');

const clean = value => String(value || '').trim();
const key = value => clean(value).normalize('NFC').toLocaleLowerCase('ar').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[.،,\-–—_\s]+/g, '');
const rows = entity => db.prepare('SELECT id, payload, created_at, updated_at FROM records WHERE entity = ? AND is_deleted = 0 ORDER BY id').all(entity).map(row => ({ id: Number(row.id), ...JSON.parse(row.payload), created_at: row.created_at, updated_at: row.updated_at }));
const byId = (list, id, label) => { const row = list.find(item => Number(item.id) === Number(id)); if (!row) throw new Error(`${label} ${id} was not found`); return row; };
const activeVariants = product => (product.variants || []).filter(variant => variant.is_active !== false);
const exactVariant = (product, color, option = '') => {
  const matches = activeVariants(product).filter(variant => key(variant.color) === key(color) && (!option || key(variant.value || variant.option) === key(option)));
  if (matches.length !== 1) throw new Error(`Expected one exact variant in product ${product.id} for ${color} / ${option || 'color only'}, found ${matches.length}`);
  return matches[0];
};
const optionPart = (group, value) => /شرشف/.test(clean(group)) ? `شرشف ${clean(value)}` : [clean(group).replace(/^(?:أختر|اختر|اختار)\s*/u, '').replace(/^نوع\s*/u, ''), clean(value)].filter(Boolean).join(' ');
const componentPrice = (product, variant) => Number(variant?.price ?? product.sale_price ?? product.price ?? 0);

const products = rows('products');
const bundles = rows('bundles');
const colors = rows('colors');
const options = rows('options');
const categories = rows('categories');

const migrationSpecs = [
  {
    legacyProductId: 135,
    rugProductId: 144,
    sheetProductIdForColor: () => 138,
    mappingPolicy: 'single_sheet_product_exact_color_and_option'
  },
  {
    legacyProductId: 134,
    rugProductId: 133,
    sheetProductIdForColor: color => ({
      [key('تيفني')]: 138,
      [key('روز')]: 20434,
      [key('رمادي')]: 140,
      [key('زيتي')]: 140,
      [key('كحلي')]: 140,
      [key('نبيتي')]: 140
    })[key(color)],
    mappingPolicy: 'exact_color_and_option_with_color_specific_sheet_product'
  }
];

const reports = [];
const prepared = migrationSpecs.map(spec => {
  const legacy = byId(products, spec.legacyProductId, 'Legacy product');
  const rug = byId(products, spec.rugProductId, 'Rug product');
  const sourceVariants = activeVariants(legacy);
  if (!sourceVariants.length) throw new Error(`Legacy product ${legacy.id} has no active variants`);
  const bundleVariants = sourceVariants.map((source, index) => {
    const color = clean(source.color);
    const optionValue = clean(source.value || source.option);
    const sheetProductId = spec.sheetProductIdForColor(color);
    if (!sheetProductId) throw new Error(`No sheet product policy for ${legacy.id}: ${color}`);
    const sheet = byId(products, sheetProductId, 'Sheet product');
    const rugVariant = exactVariant(rug, color);
    const sheetVariant = exactVariant(sheet, color, optionValue);
    const masterColor = colors.find(item => key(item.name_ar || item.nameAr || item.name_en || item.nameEn) === key(color));
    const masterOption = options.find(item => key(item.name_ar || item.nameAr || item.name_en || item.nameEn) === key(optionValue));
    if (!masterColor) throw new Error(`Master color missing: ${color}`);
    if (!masterOption) throw new Error(`Master option missing: ${optionValue}`);
    const groupAr = clean(masterOption.group_ar || masterOption.groupAr || source.option);
    const groupEn = clean(masterOption.group_en || masterOption.groupEn || groupAr);
    const nameAr = clean(masterOption.name_ar || masterOption.nameAr || optionValue);
    const nameEn = clean(masterOption.name_en || masterOption.nameEn || nameAr);
    const items = [
      { product_id: rug.id, variant_id: rugVariant.id, quantity: 1 },
      { product_id: sheet.id, variant_id: sheetVariant.id, quantity: 1 }
    ];
    return {
      id: `bundle-migrated-${legacy.id}-${crypto.createHash('sha1').update(String(source.id)).digest('hex').slice(0, 10)}`,
      label_ar: `${color} · ${optionPart(groupAr, nameAr)}`,
      label_en: `${color} · ${optionPart(groupEn, nameEn)}`,
      color_id: masterColor.id,
      color,
      color_name_ar: clean(masterColor.name_ar || masterColor.nameAr || color),
      color_name_en: clean(masterColor.name_en || masterColor.nameEn || color),
      hex_code: clean(masterColor.hex_code || masterColor.color || masterColor.hex),
      option_id: masterOption.id,
      option: groupAr,
      value: nameAr,
      option_name_ar: nameAr,
      option_name_en: nameEn,
      sku: clean(source.sku || `${legacy.sku || `BUNDLE-${legacy.id}`}-${index + 1}`).toUpperCase(),
      barcode: clean(source.barcode),
      image_url: clean(source.image_url || legacy.main_photo_url),
      price: Number(source.price ?? legacy.sale_price ?? legacy.price ?? 0),
      compare_at_price: Number(source.compare_at_price ?? legacy.price_before ?? legacy.price ?? 0),
      cost: Number(source.cost || 0),
      use_own_stock: false,
      stock: null,
      items,
      is_active: source.is_active !== false,
      sort_order: index,
      migration_source_variant_id: source.id,
      component_regular_total: Number((componentPrice(rug, rugVariant) + componentPrice(sheet, sheetVariant)).toFixed(2))
    };
  });
  const first = bundleVariants[0];
  const payload = {
    product_type: 'bundle',
    name_ar: legacy.name_ar,
    name_en: legacy.name_en,
    slug: `${clean(legacy.slug) || `legacy-product-${legacy.id}`}-bundle`,
    main_photo_url: clean(legacy.main_photo_url || legacy.image_url),
    description_ar: clean(legacy.description_ar),
    description_en: clean(legacy.description_en),
    price: first.price,
    compare_at_price: first.compare_at_price,
    cost: first.cost,
    use_own_stock: false,
    stock: null,
    items: first.items,
    bundle_variants: bundleVariants,
    is_active: true,
    legacy_product_id: legacy.id,
    legacy_product_slug: legacy.slug,
    migration: {
      type: 'legacy_prayer_set_to_bundle',
      version: 1,
      source_category_id: legacy.category_id || null,
      rug_product_id: rug.id,
      mapping_policy: spec.mappingPolicy,
      migrated_at: new Date().toISOString()
    }
  };
  const existing = bundles.find(bundle => Number(bundle.legacy_product_id) === legacy.id);
  reports.push({ legacy_product_id: legacy.id, legacy_name: legacy.name_ar, bundle_id: existing?.id || null, options: bundleVariants.length, colors: [...new Set(bundleVariants.map(item => item.color))], sheet_products: [...new Set(bundleVariants.flatMap(item => item.items.slice(1).map(component => component.product_id)))], labels: bundleVariants.map(item => item.label_ar), status: existing ? 'update' : 'create' });
  return { legacy, existing, payload };
});

console.log(JSON.stringify({ mode: shouldApply ? 'apply' : 'preview', migrations: reports }, null, 2));
if (!shouldApply) { db.close(); process.exit(0); }

const now = new Date().toISOString();
const insertRecord = db.prepare('INSERT INTO records (entity, payload, created_at, updated_at) VALUES (?, ?, ?, ?)');
const updateRecord = db.prepare('UPDATE records SET payload = ?, updated_at = ? WHERE entity = ? AND id = ?');
const getPayload = db.prepare('SELECT payload FROM records WHERE entity = ? AND id = ? AND is_deleted = 0');
const saveMerged = (entity, id, changes) => {
  const row = getPayload.get(entity, id);
  if (!row) throw new Error(`${entity} ${id} no longer exists`);
  const merged = { ...JSON.parse(row.payload), ...changes };
  updateRecord.run(JSON.stringify(merged), now, entity, id);
  return merged;
};

const result = db.transaction(() => {
  const created = [];
  for (const entry of prepared) {
    let bundleId;
    if (entry.existing) {
      saveMerged('bundles', entry.existing.id, entry.payload);
      bundleId = entry.existing.id;
    } else {
      const inserted = insertRecord.run('bundles', JSON.stringify(entry.payload), now, now);
      bundleId = Number(inserted.lastInsertRowid);
    }
    saveMerged('products', entry.legacy.id, {
      is_active: false,
      migrated_bundle_id: bundleId,
      migration_status: 'migrated_to_bundle',
      migrated_at: now
    });
    created.push({ legacy_product_id: entry.legacy.id, bundle_id: bundleId, options: entry.payload.bundle_variants.length });
  }
  const sourceCategory = categories.find(category => Number(category.id) === 105);
  if (sourceCategory) {
    const remainingActive = products.filter(product => Number(product.category_id) === 105 && !migrationSpecs.some(spec => spec.legacyProductId === Number(product.id)) && product.is_active !== false);
    if (!remainingActive.length) saveMerged('categories', sourceCategory.id, { is_active: false, migration_status: 'replaced_by_bundles', migrated_at: now });
  }
  return created;
})();

console.log(JSON.stringify({ applied: true, result }, null, 2));
db.close();
