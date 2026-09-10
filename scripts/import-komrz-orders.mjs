import crypto from "node:crypto";
import fs from "node:fs";
import Database from "better-sqlite3";

const args = new Set(process.argv.slice(2));
const commit = args.has("--commit");
const sourcePath = process.env.KOMRZ_ORDERS_FILE || "/root/hst_backups/komrz-orders-20260827/orders.json";
const dbPath = process.env.DB_PATH || "/var/lib/docker/volumes/slyrah-clone_slyrah_data/_data/slyrah.sqlite";
const sourceDocument = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const sourceOrders = Array.isArray(sourceDocument.orders) ? sourceDocument.orders : [];
const db = new Database(dbPath, { readonly: !commit });

function rows(entity) {
  return db.prepare("SELECT id, payload, created_at, updated_at FROM records WHERE entity = ? AND is_deleted = 0 ORDER BY id ASC")
    .all(entity)
    .map((row) => ({ id: row.id, ...JSON.parse(row.payload), created_at: row.created_at, updated_at: row.updated_at }));
}

function compactSku(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function sourceTimestamp(value, fallback = new Date().toISOString()) {
  if (!value) return fallback;
  const normalized = /(?:z|[+-]\d\d:\d\d)$/i.test(String(value)) ? String(value) : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function valueOfMeta(entries = [], key) {
  return entries.find((entry) => String(entry.key || "") === key)?.value ?? "";
}

function publicAttributes(entries = []) {
  return entries
    .filter((entry) => entry?.key && !String(entry.key).startsWith("_") && entry.value !== "")
    .map((entry) => ({ key: String(entry.display_key || entry.key), value: String(entry.display_value ?? entry.value) }));
}

function orderStatus(status = "") {
  if (status === "completed") return "delivered";
  if (status === "processing") return "processing";
  if (status === "pending") return "pending";
  return "cancelled";
}

function paymentMethod(method = "") {
  return method === "cod" ? "cod" : "prepaid";
}

const products = rows("products");
const productBySourceId = new Map(products.filter((product) => product.source_id).map((product) => [Number(product.source_id), product]));
const productBySku = new Map(products.filter((product) => product.sku).map((product) => [compactSku(product.sku), product]));
const variantsBySourceId = new Map();
const variantsBySku = new Map();
for (const product of products) {
  for (const variant of product.variants || []) {
    const legacyId = String(variant.id || "").match(/^wc-(\d+)$/)?.[1] || variant.source_id || variant.legacy_id;
    if (legacyId) variantsBySourceId.set(Number(legacyId), { product, variant });
    if (variant.sku) variantsBySku.set(compactSku(variant.sku), { product, variant });
  }
}

function matchLine(line) {
  const directVariant = Number(line.variation_id) ? variantsBySourceId.get(Number(line.variation_id)) : null;
  if (directVariant) return { ...directVariant, confidence: "variation_source_id" };
  const product = productBySourceId.get(Number(line.product_id)) || productBySku.get(compactSku(line.sku));
  if (!product) return { product: null, variant: null, confidence: "unmatched" };
  const skuVariant = variantsBySku.get(compactSku(line.sku));
  if (skuVariant?.product?.id === product.id) return { ...skuVariant, confidence: "variant_sku" };
  const color = String(valueOfMeta(line.meta_data, "pa_color") || "").trim();
  const option = publicAttributes(line.meta_data).find((attribute) => attribute.key !== "اللون" && attribute.key.toLowerCase() !== "color")?.value || "";
  const candidates = (product.variants || []).filter((variant) => {
    const colorMatches = !color || String(variant.color || "").trim() === color;
    const optionMatches = !option || [variant.option, variant.value].some((value) => String(value || "").trim() === option);
    return colorMatches && optionMatches;
  });
  return { product, variant: candidates.length === 1 ? candidates[0] : null, confidence: candidates.length === 1 ? "attributes" : "product_source_id" };
}

function shippingAddress(order) {
  const billing = order.billing || {};
  const shipping = order.shipping || {};
  const firstName = shipping.first_name || billing.first_name || "";
  const lastName = shipping.last_name || billing.last_name || "";
  return {
    full_name: [firstName, lastName].filter(Boolean).join(" ").trim(),
    first_name: firstName,
    last_name: lastName,
    email: billing.email || "",
    phone: shipping.phone || billing.phone || "",
    company: shipping.company || billing.company || "",
    country_code: shipping.country || billing.country || "SA",
    province: shipping.state || billing.state || "",
    city: shipping.city || billing.city || "",
    district: "",
    street: shipping.address_1 || billing.address_1 || "",
    address_2: shipping.address_2 || billing.address_2 || "",
    postal_code: shipping.postcode || billing.postcode || "",
    short_address: String(valueOfMeta(order.meta_data, "_billing_national_address_id") || ""),
    address_verification: { status: "legacy_import", source: "komrz_woocommerce" }
  };
}

function mappedOrder(order) {
  const address = shippingAddress(order);
  const items = (order.line_items || []).map((line) => {
    const match = matchLine(line);
    const quantity = Math.max(1, Number(line.quantity || 1));
    const subtotal = money(line.subtotal);
    const finalSubtotal = money(line.total);
    const attributes = publicAttributes(line.meta_data);
    return {
      key: `legacy:${order.id}:${line.id}`,
      legacy_line_item_id: Number(line.id),
      legacy_product_id: Number(line.product_id || 0),
      legacy_variation_id: Number(line.variation_id || 0),
      product_id: match.product ? Number(match.product.id) : null,
      variant_id: match.variant?.id || null,
      product_match_confidence: match.confidence,
      sku: String(line.sku || match.variant?.sku || match.product?.sku || ""),
      name_ar: String(line.name || match.product?.name_ar || ""),
      name_en: String(match.product?.name_en || line.name || ""),
      image_url: line.image?.src || match.variant?.image_url || match.product?.main_photo_url || match.product?.image_url || "",
      variant_label: attributes.map((attribute) => attribute.value).filter(Boolean).join(" / "),
      attributes,
      quantity,
      unit_price: money(line.price || (quantity ? finalSubtotal / quantity : 0)),
      price: money(line.price || (quantity ? finalSubtotal / quantity : 0)),
      subtotal,
      discount_amount: money(subtotal - finalSubtotal),
      final_subtotal: finalSubtotal,
      total_tax: money(line.total_tax)
    };
  });
  const status = orderStatus(order.status);
  const method = paymentMethod(order.payment_method);
  const paid = Boolean(order.date_paid) || ["completed"].includes(order.status) || (order.status === "processing" && method === "prepaid");
  const productWeights = items.reduce((sum, item) => {
    const product = products.find((candidate) => Number(candidate.id) === Number(item.product_id));
    return sum + Number(product?.shipping?.weight || product?.weight || 0) * Number(item.quantity || 1);
  }, 0);
  const coupons = (order.coupon_lines || []).map((coupon) => ({
    legacy_id: Number(coupon.id), code: String(coupon.code || "").toUpperCase(), discount: money(coupon.discount),
    discount_type: coupon.discount_type || "", nominal_amount: Number(coupon.nominal_amount || 0), free_shipping: coupon.free_shipping === true
  }));
  const sourceHash = crypto.createHash("sha256").update(JSON.stringify(order)).digest("hex");
  return {
    source: "komrz_woocommerce",
    is_historical: true,
    suppress_side_effects: true,
    inventory_adjusted: false,
    fulfillment_imported: true,
    legacy_order_id: Number(order.id),
    legacy_order_number: String(order.number || order.id),
    legacy_order_key: String(order.order_key || ""),
    legacy_source_status: String(order.status || ""),
    legacy_payload_hash: sourceHash,
    legacy_source_payload: order,
    status,
    customer: address,
    shipping_address: address,
    customer_identity: { legacy_customer_id: Number(order.customer_id || 0) || null },
    market_snapshot: { country_code: address.country_code || "SA", timezone: "Asia/Riyadh" },
    currency_snapshot: { code: order.currency || "SAR", symbol: order.currency_symbol || "ر.س" },
    payment: {
      method,
      provider_method: String(order.payment_method || ""),
      provider_title: String(order.payment_method_title || ""),
      status: paid ? "paid" : status === "cancelled" ? "failed" : "pending",
      transaction_id: String(order.transaction_id || ""),
      paid_at: order.date_paid_gmt ? sourceTimestamp(order.date_paid_gmt) : null,
      cod_amount: method === "cod" ? money(order.total) : 0,
      currency: order.currency || "SAR"
    },
    items,
    subtotal: money(items.reduce((sum, item) => sum + item.subtotal, 0)),
    discount_amount: money(order.discount_total),
    discount_codes: coupons.map((coupon) => coupon.code),
    imported_coupons: coupons,
    shipping_amount: money(order.shipping_total),
    shipping_lines: order.shipping_lines || [],
    fee_lines: order.fee_lines || [],
    tax_lines: order.tax_lines || [],
    total_tax: money(order.total_tax),
    total: money(order.total),
    customer_note: String(order.customer_note || ""),
    shipping_package: {
      total_count: items.reduce((sum, item) => sum + item.quantity, 0),
      gross_weight: money(productWeights),
      requires_shipping: true,
      weight_source: productWeights > 0 ? "current_catalog_profiles" : "unknown"
    },
    legacy_dates: {
      created_at: order.date_created_gmt ? sourceTimestamp(order.date_created_gmt) : sourceTimestamp(order.date_created),
      modified_at: order.date_modified_gmt ? sourceTimestamp(order.date_modified_gmt) : sourceTimestamp(order.date_modified),
      paid_at: order.date_paid_gmt ? sourceTimestamp(order.date_paid_gmt) : null,
      completed_at: order.date_completed_gmt ? sourceTimestamp(order.date_completed_gmt) : null
    }
  };
}

const mapped = sourceOrders.map(mappedOrder);
const existingOrders = rows("orders");
const existingByLegacyId = new Map(existingOrders.filter((order) => order.source === "komrz_woocommerce").map((order) => [Number(order.legacy_order_id), order]));
const shipments = rows("shipping_shipments");
const shipmentsByOrder = new Map(shipments.filter((shipment) => /^\d+$/.test(String(shipment.client_order_no || ""))).map((shipment) => [String(Number(shipment.client_order_no)), shipment]));
const evidenceRows = rows("legacy_sales_evidence");
const stats = { mode: commit ? "commit" : "dry_run", source_orders: mapped.length, inserted: 0, updated: 0, unchanged: 0, matched_lines: 0, unmatched_lines: 0, linked_shipments: 0, linked_evidence: 0, source_statuses: {} };
for (const order of mapped) {
  stats.source_statuses[order.legacy_source_status] = (stats.source_statuses[order.legacy_source_status] || 0) + 1;
  for (const item of order.items) item.product_id ? stats.matched_lines++ : stats.unmatched_lines++;
  const existing = existingByLegacyId.get(order.legacy_order_id);
  if (!existing) stats.inserted++;
  else if (existing.legacy_payload_hash === order.legacy_payload_hash) stats.unchanged++;
  else stats.updated++;
  if (shipmentsByOrder.has(String(Number(order.legacy_order_number)))) stats.linked_shipments++;
}

if (commit) {
  const insert = db.prepare("INSERT INTO records (entity, payload, created_at, updated_at) VALUES ('orders', ?, ?, ?)");
  const update = db.prepare("UPDATE records SET payload = ?, created_at = ?, updated_at = ?, is_deleted = 0 WHERE entity = 'orders' AND id = ?");
  const updateEntity = db.prepare("UPDATE records SET payload = ?, updated_at = ? WHERE entity = ? AND id = ?");
  const insertRun = db.prepare("INSERT INTO records (entity, payload, created_at, updated_at) VALUES ('legacy_order_import_runs', ?, ?, ?)");
  const transaction = db.transaction(() => {
    const importedIds = new Map();
    for (const order of mapped) {
      const existing = existingByLegacyId.get(order.legacy_order_id);
      const createdAt = order.legacy_dates.created_at;
      const updatedAt = order.legacy_dates.modified_at || createdAt;
      let recordId;
      if (existing) {
        recordId = existing.id;
        if (existing.legacy_payload_hash !== order.legacy_payload_hash) update.run(JSON.stringify(order), createdAt, updatedAt, existing.id);
      } else {
        recordId = Number(insert.run(JSON.stringify(order), createdAt, updatedAt).lastInsertRowid);
      }
      importedIds.set(String(Number(order.legacy_order_number)), recordId);
    }
    for (const [legacyNumber, recordId] of importedIds) {
      const shipment = shipmentsByOrder.get(legacyNumber);
      if (shipment && !shipment.store_order_id) {
        const { id, created_at, updated_at, ...payload } = shipment;
        updateEntity.run(JSON.stringify({ ...payload, store_order_id: recordId, order_link_source: "legacy_order_number", order_linked_at: new Date().toISOString() }), new Date().toISOString(), "shipping_shipments", id);
      }
    }
    for (const evidence of evidenceRows) {
      const recordId = importedIds.get(String(Number(evidence.legacy_order_no)));
      if (!recordId || Number(evidence.legacy_order_record_id) === Number(recordId)) continue;
      const { id, created_at, updated_at, ...payload } = evidence;
      updateEntity.run(JSON.stringify({ ...payload, legacy_order_record_id: recordId }), new Date().toISOString(), "legacy_sales_evidence", id);
      stats.linked_evidence++;
    }
    const now = new Date().toISOString();
    insertRun.run(JSON.stringify({ ...stats, source: "redaa-alhishma.com", source_file: sourcePath, source_sha256: sourceDocument?.sha256 || crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex"), completed_at: now }), now, now);
  });
  transaction();
}

console.log(JSON.stringify(stats, null, 2));
db.close();
