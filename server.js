import cors from "cors";
import compression from "compression";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import express from "express";
import fs from "node:fs";
import lighthouse from "lighthouse";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "node:path";
import sharp from "sharp";
import { launch } from "chrome-launcher";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1);
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || "dev-secret";
const dbPath = process.env.DB_PATH || path.join(__dirname, "data", "slyrah.sqlite");

if (process.env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-this-secret-before-production") throw new Error("A strong JWT_SECRET is required in production");
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "admin12345") throw new Error("A strong ADMIN_PASSWORD is required in production");
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(path.join(__dirname, "public", "uploads"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "public", "image-cache"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "public", "lighthouse-reports"), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const defaultPublicDomain = process.env.PUBLIC_DOMAIN || "ecommerce.siteyfy.com";
const defaultRobotsTxt = `User-agent: *
Allow: /
Sitemap: https://${defaultPublicDomain}/sitemap.xml`;

const defaultAiModels = [
  { id: "gpt-5.6", module: "text", input_per_1m: 1.25, cached_input_per_1m: 0.125, output_per_1m: 10, currency: "USD", is_enabled: true },
  { id: "gpt-5.6-mini", module: "text", input_per_1m: 0.25, cached_input_per_1m: 0.025, output_per_1m: 2, currency: "USD", is_enabled: true },
  { id: "gpt-5.6-nano", module: "text", input_per_1m: 0.05, cached_input_per_1m: 0.005, output_per_1m: 0.4, currency: "USD", is_enabled: true },
  { id: "gpt-image-2", module: "image", input_per_1m: 4, cached_input_per_1m: 1, output_per_1m: 15, currency: "USD", is_enabled: true },
  { id: "gpt-image-1.5", module: "image", input_per_1m: 4, cached_input_per_1m: 1, output_per_1m: 16, currency: "USD", is_enabled: true },
  { id: "text-embedding-3-large", module: "embeddings", input_per_1m: 0.13, cached_input_per_1m: 0, output_per_1m: 0, currency: "USD", is_enabled: true },
  { id: "text-embedding-3-small", module: "embeddings", input_per_1m: 0.02, cached_input_per_1m: 0, output_per_1m: 0, currency: "USD", is_enabled: true },
  { id: "sora-2", module: "video", input_per_1m: 0, cached_input_per_1m: 0, output_per_1m: 0, currency: "USD", unit_note: "Configure per job/second pricing manually", is_enabled: false },
  { id: "gpt-realtime", module: "audio", input_per_1m: 0, cached_input_per_1m: 0, output_per_1m: 0, currency: "USD", unit_note: "Configure audio token pricing manually", is_enabled: false }
];

const defaultCurrencies = [
  { code: "SAR", name_en: "Saudi Riyal", name_ar: "الريال السعودي", symbol_en: "SAR", symbol_ar: "ر.س", locale: "ar-SA", decimal_digits: 2, symbol_position: "after", exchange_rate: 1, is_active: true },
  { code: "AED", name_en: "UAE Dirham", name_ar: "الدرهم الإماراتي", symbol_en: "AED", symbol_ar: "د.إ", locale: "ar-AE", decimal_digits: 2, symbol_position: "after", exchange_rate: 1, is_active: true },
  { code: "EGP", name_en: "Egyptian Pound", name_ar: "الجنيه المصري", symbol_en: "EGP", symbol_ar: "ج.م", locale: "ar-EG", decimal_digits: 2, symbol_position: "after", exchange_rate: 1, is_active: true },
  { code: "KWD", name_en: "Kuwaiti Dinar", name_ar: "الدينار الكويتي", symbol_en: "KWD", symbol_ar: "د.ك", locale: "ar-KW", decimal_digits: 3, symbol_position: "after", exchange_rate: 1, is_active: true },
  { code: "BHD", name_en: "Bahraini Dinar", name_ar: "الدينار البحريني", symbol_en: "BHD", symbol_ar: "د.ب", locale: "ar-BH", decimal_digits: 3, symbol_position: "after", exchange_rate: 1, is_active: true },
  { code: "OMR", name_en: "Omani Rial", name_ar: "الريال العماني", symbol_en: "OMR", symbol_ar: "ر.ع", locale: "ar-OM", decimal_digits: 3, symbol_position: "after", exchange_rate: 1, is_active: true },
  { code: "QAR", name_en: "Qatari Riyal", name_ar: "الريال القطري", symbol_en: "QAR", symbol_ar: "ر.ق", locale: "ar-QA", decimal_digits: 2, symbol_position: "after", exchange_rate: 1, is_active: true }
];

const defaultCountries = [
  { code: "SA", code3: "SAU", name_en: "Saudi Arabia", name_ar: "المملكة العربية السعودية", calling_code: "+966", currency_code: "SAR", locale: "ar-SA", timezone: "Asia/Riyadh", flag: "SA", is_active: true },
  { code: "AE", code3: "ARE", name_en: "United Arab Emirates", name_ar: "الإمارات العربية المتحدة", calling_code: "+971", currency_code: "AED", locale: "ar-AE", timezone: "Asia/Dubai", flag: "AE", is_active: false },
  { code: "KW", code3: "KWT", name_en: "Kuwait", name_ar: "الكويت", calling_code: "+965", currency_code: "KWD", locale: "ar-KW", timezone: "Asia/Kuwait", flag: "KW", is_active: false },
  { code: "BH", code3: "BHR", name_en: "Bahrain", name_ar: "البحرين", calling_code: "+973", currency_code: "BHD", locale: "ar-BH", timezone: "Asia/Bahrain", flag: "BH", is_active: false },
  { code: "OM", code3: "OMN", name_en: "Oman", name_ar: "عُمان", calling_code: "+968", currency_code: "OMR", locale: "ar-OM", timezone: "Asia/Muscat", flag: "OM", is_active: false },
  { code: "QA", code3: "QAT", name_en: "Qatar", name_ar: "قطر", calling_code: "+974", currency_code: "QAR", locale: "ar-QA", timezone: "Asia/Qatar", flag: "QA", is_active: false },
  { code: "EG", code3: "EGY", name_en: "Egypt", name_ar: "مصر", calling_code: "+20", currency_code: "EGP", locale: "ar-EG", timezone: "Africa/Cairo", flag: "EG", is_active: false }
];

const defaultGoodsTypes = [
  { id: "normal", code: "NORMAL", name_en: "Normal goods", name_ar: "بضائع عادية", description_en: "Clothing, textiles, prayer garments and products without batteries or restricted materials.", description_ar: "الملابس والمنسوجات وشراشف الصلاة والمنتجات التي لا تحتوي بطاريات أو مواد مقيدة.", provider_mapping: { imile: "Normal" }, is_active: true, is_default: true },
  { id: "sensitive", code: "SENSITIVE", name_en: "Sensitive goods", name_ar: "بضائع حساسة", description_en: "Cosmetics, liquids and goods that require special handling.", description_ar: "مستحضرات التجميل والسوائل والبضائع التي تحتاج تعاملًا خاصًا.", provider_mapping: { imile: "Sensitive" }, is_active: true, is_default: false },
  { id: "battery", code: "BATTERY", name_en: "Contains battery", name_ar: "يحتوي على بطارية", description_en: "A product that includes a battery inside it.", description_ar: "منتج يحتوي على بطارية بداخله.", provider_mapping: { imile: "Battery" }, is_active: true, is_default: false },
  { id: "pure-battery", code: "PURE_BATTERY", name_en: "Standalone battery", name_ar: "بطارية مستقلة", description_en: "Standalone batteries and power banks.", description_ar: "البطاريات المستقلة وأجهزة الشحن المتنقلة.", provider_mapping: { imile: "PureBattery" }, is_active: true, is_default: false }
];

const defaultShippingProfiles = [
  { id: "apparel-light", name_en: "Light apparel", name_ar: "ملابس ومنسوجات خفيفة", goods_type_id: "normal", weight: 0.6, length: 30, width: 25, height: 6, origin_country_code: "SA", requires_shipping: true, is_active: true, is_default: true },
  { id: "prayer-mat", name_en: "Prayer mat", name_ar: "سجادة صلاة", goods_type_id: "normal", weight: 1.5, length: 45, width: 35, height: 12, origin_country_code: "SA", requires_shipping: true, is_active: true, is_default: false },
  { id: "prayer-set", name_en: "Prayer set", name_ar: "طقم صلاة", goods_type_id: "normal", weight: 2, length: 45, width: 35, height: 15, origin_country_code: "SA", requires_shipping: true, is_active: true, is_default: false }
];

const defaultMarketSettings = {
  default_country_code: "SA",
  enabled_country_codes: ["SA"],
  timezone: "Asia/Riyadh",
  weight_unit: "kg",
  dimension_unit: "cm",
  default_goods_type_id: "normal",
  default_shipping_profile_id: "apparel-light",
  mixed_goods_policy: "review",
  updated_at: null
};

const defaultShippingIntegrationSettings = {
  active_provider: "internal",
  default_provider: "internal",
  spl_address: {
    is_enabled: false,
    api_key_encrypted: "",
    base_url: "https://apina.address.gov.sa/NationalAddress/NationalAddressByShortAddress/NationalAddressByShortAddress",
    language: "A",
    require_verified_checkout: true,
    allow_manual_fallback: true,
    cache_days: 30,
    timeout_ms: 10000
  },
  imile: {
    is_enabled: false,
    show_at_checkout: true,
    checkout_label_en: "iMile delivery",
    checkout_label_ar: "توصيل iMile",
    sort_order: 10,
    environment: "production",
    customer_id: "",
    secret_key_encrypted: "",
    sign_method: "SHA256",
    time_zone: "+3",
    version: "1.0.0",
    auto_create_orders: false,
    auto_sync_tracking: true,
    sync_interval_minutes: 60,
    order_type: "100",
    logistics_product_code: "",
    payment_method: "PPD",
    default_goods_type: "Normal",
    webhook_enabled: true,
    webhook_token_encrypted: "",
    sender: {
      country: "KSA",
      province: "",
      city: "",
      area: "",
      zip_code: "",
      contacts: "",
      phone: "",
      address: ""
    }
  },
  oto: {
    is_enabled: false,
    show_at_checkout: true,
    checkout_label_en: "OTO delivery",
    checkout_label_ar: "توصيل OTO",
    sort_order: 20,
    environment: "production",
    live_base_url: "https://api.tryoto.com",
    sandbox_base_url: "https://staging-api.tryoto.com",
    refresh_token_encrypted: "",
    quote_mode: "oto_rates",
    max_checkout_options: 4,
    auto_create_orders: true,
    auto_create_shipments: false,
    pickup_location_code: "",
    order_prefix: "SFY-",
    exclude_imile_when_direct: true,
    markup_fixed: 0,
    markup_percent: 0,
    fallback_amount: 0,
    timeout_ms: 15000,
    webhook_secret_encrypted: "",
    webhook_authorization_encrypted: "",
    webhook_id: "",
    webhook_ids: {},
    webhook_url: "",
    webhook_registered_at: null,
    last_test_at: null,
    last_test_status: "not_tested",
    last_test_message: ""
  },
  oms_connector: {
    is_enabled: false,
    environment: "production",
    username: "",
    password_encrypted: "",
    auto_sync_on_open: true,
    lookback_days: 30,
    last_sync_at: null,
    last_success_at: null,
    last_error: "",
    last_report_date: null,
    last_report_summary: null,
    last_range: null,
    incremental_cursor: null,
    sync_overlap_days: 2,
    sync_interval_minutes: 15
  },
  customer_pricing: {
    strategy: "fixed",
    fixed_amount: 20,
    markup_fixed: 0,
    markup_percent: 0,
    subsidy_fixed: 0,
    minimum_charge: 0,
    maximum_charge: null,
    fallback_amount: 0,
    estimate_profiles: [{
      id: "sa-sar-default",
      country_code: "SA",
      currency: "SAR",
      base_delivery_fee: 18,
      cod_fixed_fee: 2,
      pos_percent: 2,
      vat_percent: 15,
      pos_basis: "collectable_amount",
      tax_mode: "add",
      minimum_estimate: 0,
      maximum_estimate: null,
      is_active: true
    }]
  },
  updated_at: null
};

const defaultPaymentGatewaySettings = {
  active_provider: "none",
  redirect_policy: {
    max_automatic_redirects: 1,
    attempt_ttl_minutes: 30,
    require_https: true
  },
  cash_on_delivery: {
    is_enabled: true,
    title_en: "Cash on delivery",
    title_ar: "الدفع عند الاستلام",
    sort_order: 10
  },
  providers: {
    tamara: {
      is_enabled: false,
      environment: "production",
      live_base_url: "https://api.tamara.co",
      sandbox_base_url: "https://api-sandbox.tamara.co",
      api_token_encrypted: "",
      notification_token_encrypted: "",
      public_key_encrypted: "",
      payment_type: "PAY_BY_INSTALMENTS",
      instalments: 3,
      supported_countries: ["SA", "AE", "BH", "KW", "OM"],
      supported_currencies: ["SAR", "AED", "BHD", "KWD", "OMR"],
      minimum_amount: 0,
      maximum_amount: null,
      auto_authorise: true,
      auto_capture: false,
      show_product_widget: true,
      show_at_checkout: true,
      allowed_redirect_hosts: ["tamara.co"],
      webhook_id: "",
      webhook_url: "",
      webhook_registered_at: null,
      last_test_at: null,
      last_test_status: "not_tested",
      last_test_message: ""
    },
    edfapay: {
      is_enabled: false,
      show_at_checkout: true,
      environment: "production",
      live_base_url: "https://api.edfapay.com",
      sandbox_base_url: "https://sandbox.edfapay.com",
      merchant_id_encrypted: "",
      merchant_password_encrypted: "",
      webhook_secret_encrypted: "",
      callback_path_secret_encrypted: "",
      supported_countries: ["SA"],
      supported_currencies: ["SAR"],
      minimum_amount: 0,
      maximum_amount: null,
      allowed_redirect_hosts: ["edfapay.com"],
      last_test_at: null,
      last_test_status: "not_tested",
      last_test_message: ""
    },
    tabby: {
      is_enabled: false,
      show_at_checkout: true,
      environment: "production",
      base_url: "https://api.tabby.sa",
      public_key_encrypted: "",
      secret_key_encrypted: "",
      merchant_code: "SA",
      webhook_auth_encrypted: "",
      supported_countries: ["SA"],
      supported_currencies: ["SAR"],
      minimum_amount: 0,
      maximum_amount: null,
      auto_capture: true,
      allowed_redirect_hosts: ["tabby.sa", "tabby.ai"],
      webhook_id: "",
      webhook_url: "",
      webhook_registered_at: null,
      last_test_at: null,
      last_test_status: "not_tested",
      last_test_message: ""
    }
  },
  updated_at: null
};

const defaultShippingAuditSettings = {
  enabled: true,
  auto_run_after_sync: true,
  currency: "SAR",
  weight: { enabled: true, tolerance_kg: 0.5, tolerance_percent: 20, require_expected_weight: true },
  cancellation: { enabled: true, allowed_fee: 0, require_timeline_evidence: true },
  duplicates: { enabled: true, amount_tolerance: 0.01 },
  payment: {
    enabled: true,
    requested_prepaid_codes: ["100", "PPD", "PREPAID"],
    requested_collect_codes: ["200", "COD", "CASH"],
    actual_prepaid_codes: ["100"],
    actual_cash_codes: ["200"],
    actual_pos_codes: ["300", "700"],
    pos_fee_tokens: ["POS"],
    cod_fee_tokens: ["COD"]
  },
  settlement: { enabled: true, overdue_days: 7, require_completed_bill_for_financial_findings: true },
  pricing: { enabled: true, base_fee: 18, included_weight_kg: 5, extra_started_kg_fee: 1, vat_percent: 15, tolerance_amount: 0.5 },
  updated_at: null,
  version: 1
};

const defaultBrandIdentity = {
  primary_color: "#583A80",
  primary_dark_color: "#3B215D",
  sale_color: "#C62828",
  footer_color: "#23190E",
  surface_color: "#FFFFFF",
  header_color: "#FCFCFC",
  text_color: "#222222",
  muted_color: "#777777",
  font_ar: "'jannah Lt', Jannah, sans-serif",
  font_en: "'jannah Lt', Jannah, sans-serif",
  heading_weight: 700,
  body_weight: 400,
  card_radius: 20,
  button_radius: 100,
  input_radius: 8,
  product_image_ratio: "1 / 1",
  shadow_style: "soft",
  updated_at: null
};

const defaultStorefrontLayout = {
  announcement: {
    is_active: true,
    rotation_interval_seconds: 5,
    transition: "fade",
    pause_on_hover: true,
    messages: [
      { id: "shipping", text_ar: "شحن مجاني داخل المملكة عند شرائك قطعتين أو أكثر", text_en: "Free shipping when you buy two items or more", link_label_ar: "تسوق الآن", link_label_en: "Shop now", link_url: "/shop", is_active: true },
      { id: "welcome", text_ar: "خصم لأول طلب لك معنا - استخدم الكود WELCOME10", text_en: "First order discount - use WELCOME10", link_label_ar: "", link_label_en: "", link_url: "", is_active: true }
    ]
  },
  header: { sticky: true, show_search: true, show_account: true, show_wishlist: true, show_cart: true, show_category_strip: true },
  footer: { show_description: true, show_business_info: true, show_contact: true, show_social: true, show_policies: true, copyright_en: "All rights reserved.", copyright_ar: "جميع الحقوق محفوظة." },
  updated_at: null
};

const defaultHomeBuilder = {
  slides: [],
  sections: [
    { id: "best-offers", type: "products", title_ar: "أفضل العروض", title_en: "Best offers", source: "sale", order: 1, is_active: true },
    { id: "shop-categories", type: "categories", title_ar: "تسوق التصنيفات", title_en: "Shop categories", source: "categories", order: 2, is_active: true },
    { id: "seasonal", type: "banner", title_ar: "عروض موسمية", title_en: "Seasonal offers", source: "manual", order: 3, is_active: true },
    { id: "latest", type: "products", title_ar: "وصل حديثاً", title_en: "New arrivals", source: "latest", order: 4, is_active: true }
  ],
  updated_at: null
};

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    entity TEXT NOT NULL,
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_records_entity ON records(entity, is_deleted);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promo_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discount_id INTEGER NOT NULL,
    discount_code TEXT NOT NULL,
    guest_hash TEXT,
    user_id TEXT,
    email_hash TEXT,
    phone_hash TEXT,
    payment_hash TEXT,
    order_id INTEGER,
    status TEXT NOT NULL DEFAULT 'reserved',
    reserved_until TEXT,
    rejection_reason TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_promo_redemptions_discount ON promo_redemptions(discount_id, status);
  CREATE INDEX IF NOT EXISTS idx_promo_redemptions_guest ON promo_redemptions(guest_hash, status);
  CREATE INDEX IF NOT EXISTS idx_promo_redemptions_email ON promo_redemptions(email_hash, status);
  CREATE INDEX IF NOT EXISTS idx_promo_redemptions_phone ON promo_redemptions(phone_hash, status);
`);

if (!db.prepare("PRAGMA table_info(promo_redemptions)").all().some((column) => column.name === "payment_hash")) {
  db.exec("ALTER TABLE promo_redemptions ADD COLUMN payment_hash TEXT");
}
db.exec("CREATE INDEX IF NOT EXISTS idx_promo_redemptions_payment ON promo_redemptions(payment_hash, status)");

const defaults = {
  companyInfo: {
    id: 1,
    site_name_en: "Slyrah",
    site_name_ar: "سليراه",
    description_en: "Premium watches and accessories.",
    description_ar: "ساعات وإكسسوارات فاخرة.",
    email: "",
    phone: "",
    whatsapp: "",
    address_en: "",
    address_ar: "",
    facebook_url: "",
    instagram_url: "",
    logo_url: "/uploads/gallery-1766405641942-789801406.png",
    favicon_url: "",
    primary_color: "#b20000",
    secondary_color: "#111111",
    background_color: "#ffffff"
  },
  homeSections: {
    topViewed: true,
    latestArrivals: true,
    joinOurWorld: true,
    headerCategoryBanners: true
  },
  settings: {
    website_domain: defaultPublicDomain,
    shipping_active: true,
    default_shipping_cost: 20,
    free_shipping_threshold: 0
  },
  brandIdentity: defaultBrandIdentity,
  currencies: { base_currency: "SAR", display_mode: "fixed", auto_exchange: false, rounding_mode: "none", currencies: defaultCurrencies, updated_at: null },
  marketSettings: defaultMarketSettings,
  countries: defaultCountries,
  goodsTypes: defaultGoodsTypes,
  shippingProfiles: defaultShippingProfiles,
  shippingIntegrations: defaultShippingIntegrationSettings,
  paymentGateways: defaultPaymentGatewaySettings,
  shippingAuditSettings: defaultShippingAuditSettings,
  storefrontLayout: defaultStorefrontLayout,
  homeBuilder: defaultHomeBuilder,
  promotionPolicy: {
    enabled: true,
    max_manual_codes: 1,
    max_automatic_promotions: 1,
    allow_shipping_benefit: true,
    max_financial_discount_percent: 30,
    max_financial_discount_amount: null,
    never_below_cost: false,
    reservation_minutes: 30,
    bundle_extra_discounts: false,
    default_stacking_policy: "same_group_blocked",
    group_order: ["bundle", "product", "order", "shipping", "gift"],
    updated_at: null
  },
  robotsTxt: {
    content: defaultRobotsTxt,
    updated_at: null
  },
  aiSetup: {
    providers: {
      openai: {
        enabled: false,
        api_key: "",
        organization: "",
        project: "",
        default_text_model: "gpt-5.6-mini",
        default_image_model: "gpt-image-2",
        default_video_model: "sora-2",
        synced_at: null
      }
    },
    models: defaultAiModels,
    updated_at: null
  }
};

for (const [key, value] of Object.entries(defaults)) {
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, JSON.stringify(value));
}

const savedSettings = getSetting("settings") || {};
if (!savedSettings.website_domain) {
  setSetting("settings", { ...savedSettings, website_domain: defaultPublicDomain });
}
if (savedSettings.shipping_active === undefined) {
  setSetting("settings", {
    ...getSetting("settings"),
    shipping_active: Boolean(savedSettings.shippingActive || false),
    default_shipping_cost: Number(savedSettings.default_shipping_cost || 0),
    free_shipping_threshold: Number(savedSettings.free_shipping_threshold || 0)
  });
}

const savedShippingIntegrations = getSetting("shippingIntegrations") || {};
if (!savedShippingIntegrations.imile?.customer_id) {
  setSetting("shippingIntegrations", {
    ...defaultShippingIntegrationSettings,
    ...savedShippingIntegrations,
    active_provider: "internal",
    imile: {
      ...defaultShippingIntegrationSettings.imile,
      ...(savedShippingIntegrations.imile || {}),
      customer_id: "C2104229101",
      sender: {
        ...defaultShippingIntegrationSettings.imile.sender,
        ...(savedShippingIntegrations.imile?.sender || {}),
        country: "KSA",
        province: "Southern Region",
        city: "Wadi al Dawasir",
        area: "Mukhatat Al Khamasin",
        zip_code: "18413",
        contacts: "Redaa Alhishma Store",
        phone: "966550845195"
      }
    }
  });
}

if (!activeRows("brands").some((brand) => String(brand.slug || brand.name_en || "").toLowerCase() === "others")) {
  createRecord("brands", {
    name_en: "Others",
    name_ar: "أخرى",
    slug: "others",
    description_en: "Fallback brand for products without a clear brand.",
    description_ar: "علامة افتراضية للمنتجات التي لا تظهر لها علامة واضحة.",
    is_active: true
  });
}

app.use(compression());
app.use(cors({ origin: true, credentials: true }));
const captureRawBody = (req, _res, buffer) => { req.rawBody = Buffer.from(buffer || ""); };
app.use(express.text({ type: "text/plain", limit: "2mb", verify: captureRawBody }));
app.use(express.json({ limit: "20mb", verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, "public", "uploads"),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      cb(null, `upload-${Date.now()}-${crypto.randomInt(100000000, 999999999)}${ext}`);
    }
  })
});

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

function ok(data = {}) {
  return { success: true, data };
}

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || "").split(";").map((item) => item.trim());
  const found = cookies.find((item) => item.startsWith(`${name}=`));
  if (!found) return "";
  try {
    return decodeURIComponent(found.slice(name.length + 1));
  } catch {
    return "";
  }
}

function cartFromRequest(req) {
  try {
    const parsed = JSON.parse(cookieValue(req, "slyrah_cart_server") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistCart(res, items = []) {
  res.cookie("slyrah_cart_server", JSON.stringify(items.slice(0, 80)), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30
  });
}

function identityHash(value) {
  const clean = String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  return clean ? crypto.createHmac("sha256", jwtSecret).update(clean).digest("hex") : null;
}

function signedGuestToken(id) {
  const signature = crypto.createHmac("sha256", jwtSecret).update(id).digest("base64url");
  return `${id}.${signature}`;
}

function guestIdentity(req, res) {
  const raw = cookieValue(req, "slyrah_guest");
  const [id, signature] = raw.split(".");
  const expected = id ? signedGuestToken(id).split(".")[1] : "";
  const valid = Boolean(id && signature && expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)));
  const guestId = valid ? id : crypto.randomUUID();
  if (!valid) {
    res.cookie("slyrah_guest", signedGuestToken(guestId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
  }
  return { guest_id: guestId, guest_hash: identityHash(guestId) };
}

function publicCartItem(body = {}) {
  if (body.bundle_id || body.bundleId || body.item_type === "bundle") {
    const bundle = findBundle(body.bundle_id || body.bundleId || body.id);
    if (!bundle) fail("Bundle was not found", 404);
    const quantity = Math.max(1, Number(body.quantity || 1));
    if (bundle.available_stock !== null && quantity > bundle.available_stock) fail("Bundle quantity is out of stock");
    return {
      key: String(body.key || `bundle:${bundle.id}`),
      item_type: "bundle",
      bundle_id: Number(bundle.id),
      product_id: 0,
      slug: bundle.slug || "",
      category_slug: "bundles",
      name_ar: bundle.name_ar || "باقة منتجات",
      name_en: bundle.name_en || "Product bundle",
      image_url: bundle.main_photo_url || bundle.items[0]?.image_url || "/uploads/catalog/gift.png",
      bundle_items: bundle.items,
      bundle_main_photo_url: bundle.main_photo_url || "",
      variant_id: null,
      variant_label: `${bundle.items.length} منتجات`,
      price: Number(bundle.price || 0),
      quantity
    };
  }
  const product = findProduct(body.product_id || body.productId || body.id || body.product?.id);
  if (!product) fail("Product was not found", 404);
  const variantId = body.variant_id || body.variantId || null;
  const variant = variantId ? (product?.variants || []).find((item) => String(item.id) === String(variantId)) : null;
  if (variantId && !variant) fail("Product option was not found or is inactive", 404);
  if (variant && variant.in_stock === false) fail("Product option is out of stock", 409);
  const price = Number(body.price || variant?.price || product?.sale_price || product?.price || 0);
  return {
    key: String(body.key || `${product?.id || body.product_id || body.id || Date.now()}:${variantId || "base"}`),
    product_id: Number(product?.id || body.product_id || body.productId || body.id || 0),
    slug: product?.slug || body.slug || "",
    category_slug: product?.category_slug || product?.category?.slug || body.category_slug || body.categorySlug || "",
    name_ar: product?.name_ar || body.name_ar || body.name || "منتج",
    name_en: product?.name_en || body.name_en || body.name || "Product",
    image_url: variant?.image_url || product?.main_photo_url || product?.image_url || body.image_url || "/uploads/catalog/gift.png",
    variant_id: variantId,
    variant_label: body.variant_label || [variant?.color, variant?.option, variant?.value].filter(Boolean).join(" / "),
    price,
    quantity: Math.max(1, Number(body.quantity || 1))
  };
}

function cartSummary(items = []) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const shipping = shippingSettings();
  const quote = shippingQuote(items, subtotal, shipping);
  return { cart: { items }, items, subtotal, shipping, shipping_rule: quote.rule, shipping_cost: quote.amount, total: subtotal + quote.amount };
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function entityRows(entity, includeDeleted = false) {
  const rows = db
    .prepare(`SELECT id, payload, created_at, updated_at FROM records WHERE entity = ? ${includeDeleted ? "" : "AND is_deleted = 0"} ORDER BY id DESC`)
    .all(entity);
  return rows.map((row) => ({
    id: row.id,
    ...JSON.parse(row.payload),
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

function getRecord(entity, id) {
  const row = db.prepare("SELECT id, payload, created_at, updated_at FROM records WHERE entity = ? AND id = ?").get(entity, id);
  if (!row) return null;
  return { id: row.id, ...JSON.parse(row.payload), created_at: row.created_at, updated_at: row.updated_at };
}

function createRecord(entity, payload) {
  const now = new Date().toISOString();
  const result = db
    .prepare("INSERT INTO records (entity, payload, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .run(entity, JSON.stringify(payload || {}), now, now);
  return getRecord(entity, result.lastInsertRowid);
}

function updateRecord(entity, id, payload) {
  const existing = getRecord(entity, id);
  if (!existing) return createRecord(entity, { ...payload, id: Number(id) });
  const merged = { ...existing, ...payload };
  delete merged.created_at;
  delete merged.updated_at;
  db.prepare("UPDATE records SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE entity = ? AND id = ?").run(JSON.stringify(merged), entity, id);
  return getRecord(entity, id);
}

function updateProductRecord(id, payload = {}) {
  const existing = getRecord("products", id);
  const merged = existing ? { ...existing, ...payload } : { ...payload, id: Number(id) };
  delete merged.created_at;
  delete merged.updated_at;
  return existing ? updateRecord("products", id, normalizeProductPayload(merged)) : createRecord("products", normalizeProductPayload(merged));
}

function softDelete(entity, id) {
  db.prepare("UPDATE records SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE entity = ? AND id = ?").run(entity, id);
}

function getSetting(key) {
  return JSON.parse(db.prepare("SELECT value FROM settings WHERE key = ?").get(key)?.value || "null");
}

function setSetting(key, value) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, JSON.stringify(value));
  return value;
}

function normalizeWebsiteDomain(value) {
  const raw = String(value || "").trim() || process.env.PUBLIC_DOMAIN || `127.0.0.1:${port}`;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function publicStoreUrl(pathname = "/") {
  const settings = getSetting("settings") || {};
  const configured = normalizeWebsiteDomain(settings.website_domain);
  return new URL(pathname, configured.endsWith("/") ? configured : `${configured}/`).toString();
}

function shippingSettings() {
  const settings = getSetting("settings") || {};
  return {
    is_active: Boolean(settings.shipping_active || settings.shippingActive || false),
    default_cost: Number(settings.default_shipping_cost || settings.defaultShippingCost || 0),
    free_shipping_threshold: Number(settings.free_shipping_threshold || settings.freeShippingThreshold || 0),
    free_shipping_rules: normalizeFreeShippingRules(settings.free_shipping_rules)
  };
}

function normalizeFreeShippingRules(rules) {
  if (!Array.isArray(rules)) return [];
  const types = new Set(["any_quantity", "selected_products_quantity", "product_bundle", "selected_categories_quantity", "order_subtotal"]);
  const actions = new Set(["free_shipping", "fixed_shipping", "shipping_discount_percentage", "shipping_discount_fixed"]);
  return rules.map((rule, index) => ({
    id: String(rule?.id || `shipping-rule-${index + 1}`),
    name_ar: String(rule?.name_ar || "قاعدة شحن مجاني"),
    name_en: String(rule?.name_en || "Free shipping rule"),
    condition_type: types.has(rule?.condition_type) ? rule.condition_type : "any_quantity",
    minimum_quantity: Math.max(1, Number(rule?.minimum_quantity || 2)),
    minimum_subtotal: Math.max(0, Number(rule?.minimum_subtotal || 0)),
    action_type: actions.has(rule?.action_type) ? rule.action_type : "free_shipping",
    action_value: Math.max(0, Number(rule?.action_value || 0)),
    product_ids: Array.isArray(rule?.product_ids) ? [...new Set(rule.product_ids.map(Number).filter(Boolean))] : [],
    category_slugs: Array.isArray(rule?.category_slugs) ? [...new Set(rule.category_slugs.map(String).filter(Boolean))] : [],
    is_active: rule?.is_active !== false
  }));
}

function applyShippingRuleAction(rule, defaultCost = 0) {
  const base = Math.max(0, Number(defaultCost || 0));
  if (!rule) return base;
  if (!rule.action_type || rule.action_type === "free_shipping") return 0;
  if (rule.action_type === "fixed_shipping") return Math.max(0, Number(rule.action_value || 0));
  if (rule.action_type === "shipping_discount_percentage") {
    return Math.max(0, base * (1 - Math.min(100, Number(rule.action_value || 0)) / 100));
  }
  if (rule.action_type === "shipping_discount_fixed") return Math.max(0, base - Number(rule.action_value || 0));
  return base;
}

function matchingFreeShippingRule(items = [], subtotal = 0, shipping = shippingSettings()) {
  const quantity = (rows) => rows.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
  return shipping.free_shipping_rules.find((rule) => {
    if (rule.is_active === false) return false;
    if (rule.condition_type === "order_subtotal") return subtotal >= rule.minimum_subtotal;
    if (rule.condition_type === "any_quantity") return quantity(items) >= rule.minimum_quantity;
    if (rule.condition_type === "selected_products_quantity") {
      return rule.product_ids.length > 0 && quantity(items.filter((item) => rule.product_ids.includes(Number(item.product_id)))) >= rule.minimum_quantity;
    }
    if (rule.condition_type === "product_bundle") {
      return rule.product_ids.length > 0 && rule.product_ids.every((id) => items.some((item) => Number(item.product_id) === id));
    }
    if (rule.condition_type === "selected_categories_quantity") {
      return rule.category_slugs.length > 0 && quantity(items.filter((item) => rule.category_slugs.includes(String(item.category_slug || "")))) >= rule.minimum_quantity;
    }
    return false;
  }) || null;
}

function shippingQuote(items = [], subtotal = 0, shipping = shippingSettings()) {
  if (!shipping.is_active) return { amount: 0, rule: null };
  const rule = matchingFreeShippingRule(items, subtotal, shipping);
  const legacyThresholdMatches = shipping.free_shipping_threshold > 0 && subtotal >= shipping.free_shipping_threshold;
  const amount = legacyThresholdMatches ? 0 : applyShippingRuleAction(rule, shipping.default_cost);
  return { amount: Math.round(amount * 100) / 100, rule };
}

const imileTokenCache = new Map();
const otoTokenCache = new Map();
const imileOmsTokenCache = new Map();
let imileOmsSyncPromise = null;
let imileTrackingSyncPromise = null;
const shippingPricingStrategies = new Set(["internal_rules", "free", "fixed", "carrier_estimate", "estimate_plus_fixed", "estimate_plus_percent", "subsidized_fixed"]);

function integrationEncryptionKey() {
  return crypto.createHash("sha256").update(process.env.INTEGRATION_ENCRYPTION_KEY || jwtSecret).digest();
}

function encryptIntegrationSecret(value) {
  const clean = String(value || "");
  if (!clean) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", integrationEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(clean, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decryptIntegrationSecret(value) {
  if (!value) return "";
  try {
    const [version, iv, tag, encrypted] = String(value).split(".");
    if (version !== "v1") return "";
    const decipher = crypto.createDecipheriv("aes-256-gcm", integrationEncryptionKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

function normalizeShippingIntegrations(payload = {}, preserveSecrets = true) {
  const saved = getSetting("shippingIntegrations") || {};
  const current = { ...defaultShippingIntegrationSettings, ...saved };
  const requestedImile = { ...defaultShippingIntegrationSettings.imile, ...(current.imile || {}), ...(payload.imile || {}) };
  const requestedOto = { ...defaultShippingIntegrationSettings.oto, ...(current.oto || {}), ...(payload.oto || {}) };
  const requestedOms = { ...defaultShippingIntegrationSettings.oms_connector, ...(current.oms_connector || {}), ...(payload.oms_connector || {}) };
  const requestedPricing = { ...defaultShippingIntegrationSettings.customer_pricing, ...(current.customer_pricing || {}), ...(payload.customer_pricing || {}) };
  const requestedSpl = { ...defaultShippingIntegrationSettings.spl_address, ...(current.spl_address || {}), ...(payload.spl_address || {}) };
  const incomingSecret = String(payload.imile?.secret_key || "").trim();
  const incomingWebhookToken = String(payload.imile?.webhook_token || "").trim();
  const incomingOmsPassword = String(payload.oms_connector?.password || "");
  const incomingSplApiKey = String(payload.spl_address?.api_key || "").trim();
  const incomingOtoRefreshToken = String(payload.oto?.refresh_token || "").trim();
  const incomingOtoWebhookSecret = String(payload.oto?.webhook_secret || "").trim();
  const incomingOtoWebhookAuthorization = String(payload.oto?.webhook_authorization || "").trim();
  const secretKeyEncrypted = incomingSecret
    ? encryptIntegrationSecret(incomingSecret)
    : preserveSecrets ? String(current.imile?.secret_key_encrypted || "") : "";
  const webhookTokenEncrypted = incomingWebhookToken
    ? encryptIntegrationSecret(incomingWebhookToken)
    : preserveSecrets ? String(current.imile?.webhook_token_encrypted || "") : "";
  const omsPasswordEncrypted = incomingOmsPassword
    ? encryptIntegrationSecret(incomingOmsPassword)
    : preserveSecrets ? String(current.oms_connector?.password_encrypted || "") : "";
  const splApiKeyEncrypted = incomingSplApiKey
    ? encryptIntegrationSecret(incomingSplApiKey)
    : preserveSecrets ? String(current.spl_address?.api_key_encrypted || "") : "";
  const otoRefreshTokenEncrypted = incomingOtoRefreshToken
    ? encryptIntegrationSecret(incomingOtoRefreshToken)
    : preserveSecrets ? String(current.oto?.refresh_token_encrypted || "") : "";
  const otoWebhookSecretEncrypted = incomingOtoWebhookSecret
    ? encryptIntegrationSecret(incomingOtoWebhookSecret)
    : preserveSecrets ? String(current.oto?.webhook_secret_encrypted || "") : "";
  const otoWebhookAuthorizationEncrypted = incomingOtoWebhookAuthorization
    ? encryptIntegrationSecret(incomingOtoWebhookAuthorization)
    : preserveSecrets ? String(current.oto?.webhook_authorization_encrypted || "") : "";
  const strategy = shippingPricingStrategies.has(requestedPricing.strategy) ? requestedPricing.strategy : "internal_rules";
  const numberOrNull = (value) => value === "" || value === null || value === undefined ? null : Math.max(0, Number(value || 0));
  const isEnabled = requestedImile.is_enabled === true || requestedImile.is_enabled === "true";
  const otoEnabled = requestedOto.is_enabled === true || requestedOto.is_enabled === "true";
  const customerId = String(requestedImile.customer_id || "").trim();
  const requestedProvider = payload.default_provider ?? payload.active_provider ?? current.default_provider ?? current.active_provider;
  const providerReady = requestedProvider === "oto"
    ? otoEnabled && Boolean(otoRefreshTokenEncrypted)
    : requestedProvider === "imile"
      ? isEnabled && Boolean(customerId) && Boolean(secretKeyEncrypted)
      : true;
  const defaultProvider = providerReady && ["internal", "imile", "oto"].includes(requestedProvider) ? requestedProvider : "internal";
  const estimateProfiles = (Array.isArray(requestedPricing.estimate_profiles) && requestedPricing.estimate_profiles.length
    ? requestedPricing.estimate_profiles
    : defaultShippingIntegrationSettings.customer_pricing.estimate_profiles).slice(0, 50).map((profile, index) => ({
      id: String(profile.id || `shipping-estimate-${index + 1}`),
      country_code: String(profile.country_code || "SA").toUpperCase(),
      currency: String(profile.currency || "SAR").toUpperCase(),
      base_delivery_fee: Math.max(0, Number(profile.base_delivery_fee || 0)),
      cod_fixed_fee: Math.max(0, Number(profile.cod_fixed_fee || 0)),
      pos_percent: Math.min(100, Math.max(0, Number(profile.pos_percent || 0))),
      vat_percent: Math.min(100, Math.max(0, Number(profile.vat_percent || 0))),
      pos_basis: profile.pos_basis === "order_subtotal" ? "order_subtotal" : "collectable_amount",
      tax_mode: profile.tax_mode === "included" ? "included" : profile.tax_mode === "none" ? "none" : "add",
      minimum_estimate: Math.max(0, Number(profile.minimum_estimate || 0)),
      maximum_estimate: numberOrNull(profile.maximum_estimate),
      is_active: profile.is_active !== false && profile.is_active !== "false"
    }));
  return {
    active_provider: defaultProvider,
    default_provider: defaultProvider,
    spl_address: {
      ...requestedSpl,
      api_key: undefined,
      is_enabled: requestedSpl.is_enabled === true || requestedSpl.is_enabled === "true",
      api_key_encrypted: splApiKeyEncrypted,
      base_url: String(requestedSpl.base_url || defaultShippingIntegrationSettings.spl_address.base_url).trim(),
      language: requestedSpl.language === "E" ? "E" : "A",
      require_verified_checkout: requestedSpl.require_verified_checkout !== false && requestedSpl.require_verified_checkout !== "false",
      allow_manual_fallback: requestedSpl.allow_manual_fallback !== false && requestedSpl.allow_manual_fallback !== "false",
      cache_days: Math.min(365, Math.max(1, Number(requestedSpl.cache_days || 30))),
      timeout_ms: Math.min(30000, Math.max(3000, Number(requestedSpl.timeout_ms || 10000)))
    },
    imile: {
      ...requestedImile,
      secret_key: undefined,
      webhook_token: undefined,
      is_enabled: isEnabled,
      show_at_checkout: requestedImile.show_at_checkout !== false && requestedImile.show_at_checkout !== "false",
      checkout_label_en: String(requestedImile.checkout_label_en || "iMile delivery").slice(0, 80),
      checkout_label_ar: String(requestedImile.checkout_label_ar || "توصيل iMile").slice(0, 80),
      sort_order: Number(requestedImile.sort_order || 10),
      environment: requestedImile.environment === "sandbox" ? "sandbox" : "production",
      customer_id: customerId,
      secret_key_encrypted: secretKeyEncrypted,
      webhook_token_encrypted: webhookTokenEncrypted,
      sign_method: requestedImile.sign_method === "MD5" ? "MD5" : "SHA256",
      time_zone: String(requestedImile.time_zone || "+3"),
      version: "1.0.0",
      auto_create_orders: requestedImile.auto_create_orders === true || requestedImile.auto_create_orders === "true",
      auto_sync_tracking: requestedImile.auto_sync_tracking !== false && requestedImile.auto_sync_tracking !== "false",
      sync_interval_minutes: Math.max(15, Number(requestedImile.sync_interval_minutes || 60)),
      webhook_enabled: requestedImile.webhook_enabled !== false && requestedImile.webhook_enabled !== "false",
      sender: {
        ...defaultShippingIntegrationSettings.imile.sender,
        ...(requestedImile.sender || {})
      }
    },
    oto: {
      ...requestedOto,
      refresh_token: undefined,
      webhook_secret: undefined,
      webhook_authorization: undefined,
      is_enabled: otoEnabled,
      show_at_checkout: requestedOto.show_at_checkout !== false && requestedOto.show_at_checkout !== "false",
      checkout_label_en: String(requestedOto.checkout_label_en || "OTO delivery").slice(0, 80),
      checkout_label_ar: String(requestedOto.checkout_label_ar || "توصيل OTO").slice(0, 80),
      sort_order: Number(requestedOto.sort_order || 20),
      environment: requestedOto.environment === "sandbox" ? "sandbox" : "production",
      live_base_url: String(requestedOto.live_base_url || defaultShippingIntegrationSettings.oto.live_base_url).replace(/\/$/, ""),
      sandbox_base_url: String(requestedOto.sandbox_base_url || defaultShippingIntegrationSettings.oto.sandbox_base_url).replace(/\/$/, ""),
      refresh_token_encrypted: otoRefreshTokenEncrypted,
      quote_mode: ["oto_rates", "own_contracts", "both"].includes(requestedOto.quote_mode) ? requestedOto.quote_mode : "oto_rates",
      max_checkout_options: Math.min(10, Math.max(1, Number(requestedOto.max_checkout_options || 4))),
      auto_create_orders: requestedOto.auto_create_orders === true || requestedOto.auto_create_orders === "true",
      auto_create_shipments: requestedOto.auto_create_shipments === true || requestedOto.auto_create_shipments === "true",
      pickup_location_code: String(requestedOto.pickup_location_code || "").trim().slice(0, 100),
      order_prefix: String(requestedOto.order_prefix || "SFY-").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20),
      exclude_imile_when_direct: requestedOto.exclude_imile_when_direct !== false && requestedOto.exclude_imile_when_direct !== "false",
      markup_fixed: Math.max(0, Number(requestedOto.markup_fixed || 0)),
      markup_percent: Math.max(0, Number(requestedOto.markup_percent || 0)),
      fallback_amount: Math.max(0, Number(requestedOto.fallback_amount || 0)),
      timeout_ms: Math.min(30000, Math.max(3000, Number(requestedOto.timeout_ms || 15000))),
      webhook_secret_encrypted: otoWebhookSecretEncrypted,
      webhook_authorization_encrypted: otoWebhookAuthorizationEncrypted
    },
    oms_connector: {
      ...requestedOms,
      password: undefined,
      is_enabled: requestedOms.is_enabled === true || requestedOms.is_enabled === "true",
      environment: requestedOms.environment === "sandbox" ? "sandbox" : "production",
      username: String(requestedOms.username || "").trim(),
      password_encrypted: omsPasswordEncrypted,
      auto_sync_on_open: requestedOms.auto_sync_on_open !== false && requestedOms.auto_sync_on_open !== "false",
      lookback_days: Math.min(90, Math.max(7, Number(requestedOms.lookback_days || 30))),
      sync_overlap_days: Math.min(7, Math.max(1, Number(requestedOms.sync_overlap_days || 2))),
      sync_interval_minutes: Math.min(1440, Math.max(15, Number(requestedOms.sync_interval_minutes || 15))),
      last_error: String(requestedOms.last_error || "").slice(0, 500)
    },
    customer_pricing: {
      strategy,
      fixed_amount: Math.max(0, Number(requestedPricing.fixed_amount || 0)),
      markup_fixed: Math.max(0, Number(requestedPricing.markup_fixed || 0)),
      markup_percent: Math.max(0, Number(requestedPricing.markup_percent || 0)),
      subsidy_fixed: Math.max(0, Number(requestedPricing.subsidy_fixed || 0)),
      minimum_charge: Math.max(0, Number(requestedPricing.minimum_charge || 0)),
      maximum_charge: numberOrNull(requestedPricing.maximum_charge),
      fallback_amount: Math.max(0, Number(requestedPricing.fallback_amount || 0)),
      estimate_profiles: estimateProfiles
    },
    updated_at: payload.updated_at || current.updated_at || null
  };
}

function publicShippingIntegrations() {
  const settings = normalizeShippingIntegrations();
  return {
    ...settings,
    spl_address: {
      ...settings.spl_address,
      has_api_key: Boolean(decryptIntegrationSecret(settings.spl_address.api_key_encrypted)),
      api_key_encrypted: undefined
    },
    imile: {
      ...settings.imile,
      has_secret_key: Boolean(decryptIntegrationSecret(settings.imile.secret_key_encrypted)),
      has_webhook_token: Boolean(decryptIntegrationSecret(settings.imile.webhook_token_encrypted)),
      secret_key_encrypted: undefined,
      webhook_token_encrypted: undefined
    },
    oto: {
      ...settings.oto,
      has_refresh_token: Boolean(decryptIntegrationSecret(settings.oto.refresh_token_encrypted)),
      has_webhook_secret: Boolean(decryptIntegrationSecret(settings.oto.webhook_secret_encrypted)),
      has_webhook_authorization: Boolean(decryptIntegrationSecret(settings.oto.webhook_authorization_encrypted)),
      refresh_token_encrypted: undefined,
      webhook_secret_encrypted: undefined,
      webhook_authorization_encrypted: undefined
    },
    oms_connector: {
      ...settings.oms_connector,
      has_password: Boolean(decryptIntegrationSecret(settings.oms_connector.password_encrypted)),
      password_encrypted: undefined
    }
  };
}

function normalizePaymentGateways(payload = {}, preserveSecrets = true) {
  const saved = getSetting("paymentGateways") || {};
  const current = {
    ...defaultPaymentGatewaySettings,
    ...saved,
    cash_on_delivery: { ...defaultPaymentGatewaySettings.cash_on_delivery, ...(saved.cash_on_delivery || {}) },
    providers: {
      ...defaultPaymentGatewaySettings.providers,
      ...(saved.providers || {}),
      tamara: { ...defaultPaymentGatewaySettings.providers.tamara, ...(saved.providers?.tamara || {}) },
      edfapay: { ...defaultPaymentGatewaySettings.providers.edfapay, ...(saved.providers?.edfapay || {}) },
      tabby: { ...defaultPaymentGatewaySettings.providers.tabby, ...(saved.providers?.tabby || {}) }
    }
  };
  const requestedCod = { ...current.cash_on_delivery, ...(payload.cash_on_delivery || {}) };
  const requestedRedirectPolicy = { ...defaultPaymentGatewaySettings.redirect_policy, ...(current.redirect_policy || {}), ...(payload.redirect_policy || {}) };
  const requestedTamara = { ...current.providers.tamara, ...(payload.providers?.tamara || payload.tamara || {}) };
  const requestedEdfaPay = { ...current.providers.edfapay, ...(payload.providers?.edfapay || payload.edfapay || {}) };
  const requestedTabby = { ...current.providers.tabby, ...(payload.providers?.tabby || payload.tabby || {}) };
  const incomingApiToken = String(payload.providers?.tamara?.api_token || payload.tamara?.api_token || "").trim();
  const incomingNotificationToken = String(payload.providers?.tamara?.notification_token || payload.tamara?.notification_token || "").trim();
  const incomingPublicKey = String(payload.providers?.tamara?.public_key || payload.tamara?.public_key || "").trim();
  const apiTokenEncrypted = incomingApiToken
    ? encryptIntegrationSecret(incomingApiToken)
    : preserveSecrets ? String(current.providers.tamara.api_token_encrypted || "") : "";
  const notificationTokenEncrypted = incomingNotificationToken
    ? encryptIntegrationSecret(incomingNotificationToken)
    : preserveSecrets ? String(current.providers.tamara.notification_token_encrypted || "") : "";
  const publicKeyEncrypted = incomingPublicKey
    ? encryptIntegrationSecret(incomingPublicKey)
    : preserveSecrets ? String(current.providers.tamara.public_key_encrypted || "") : "";
  const incomingMerchantId = String(payload.providers?.edfapay?.merchant_id || payload.edfapay?.merchant_id || "").trim();
  const incomingMerchantPassword = String(payload.providers?.edfapay?.merchant_password || payload.edfapay?.merchant_password || "").trim();
  const incomingWebhookSecret = String(payload.providers?.edfapay?.webhook_secret || payload.edfapay?.webhook_secret || "").trim();
  const merchantIdEncrypted = incomingMerchantId ? encryptIntegrationSecret(incomingMerchantId) : preserveSecrets ? String(current.providers.edfapay.merchant_id_encrypted || "") : "";
  const merchantPasswordEncrypted = incomingMerchantPassword ? encryptIntegrationSecret(incomingMerchantPassword) : preserveSecrets ? String(current.providers.edfapay.merchant_password_encrypted || "") : "";
  const webhookSecretEncrypted = incomingWebhookSecret ? encryptIntegrationSecret(incomingWebhookSecret) : preserveSecrets ? String(current.providers.edfapay.webhook_secret_encrypted || "") : "";
  const callbackPathSecretEncrypted = String(current.providers.edfapay.callback_path_secret_encrypted || "") || encryptIntegrationSecret(crypto.randomBytes(24).toString("hex"));
  const incomingTabbyPublicKey = String(payload.providers?.tabby?.public_key || payload.tabby?.public_key || "").trim();
  const incomingTabbySecretKey = String(payload.providers?.tabby?.secret_key || payload.tabby?.secret_key || "").trim();
  const tabbyPublicKeyEncrypted = incomingTabbyPublicKey ? encryptIntegrationSecret(incomingTabbyPublicKey) : preserveSecrets ? String(current.providers.tabby.public_key_encrypted || "") : "";
  const tabbySecretKeyEncrypted = incomingTabbySecretKey ? encryptIntegrationSecret(incomingTabbySecretKey) : preserveSecrets ? String(current.providers.tabby.secret_key_encrypted || "") : "";
  const tabbyWebhookAuthEncrypted = String(current.providers.tabby.webhook_auth_encrypted || "") || encryptIntegrationSecret(crypto.randomBytes(32).toString("hex"));
  const numberOrNull = (value) => value === "" || value === null || value === undefined ? null : Math.max(0, Number(value || 0));
  const supportedCountries = [...new Set(asArray(requestedTamara.supported_countries).map((value) => String(value || "").toUpperCase()).filter((value) => ["SA", "AE", "BH", "KW", "OM"].includes(value)))];
  const supportedCurrencies = [...new Set(asArray(requestedTamara.supported_currencies).map((value) => String(value || "").toUpperCase()).filter((value) => ["SAR", "AED", "BHD", "KWD", "OMR"].includes(value)))];
  const isEnabled = requestedTamara.is_enabled === true || requestedTamara.is_enabled === "true";
  const isConfigured = Boolean(apiTokenEncrypted && notificationTokenEncrypted && publicKeyEncrypted);
  const isEdfaPayEnabled = requestedEdfaPay.is_enabled === true || requestedEdfaPay.is_enabled === "true";
  const isEdfaPayConfigured = Boolean(merchantIdEncrypted && merchantPasswordEncrypted);
  const isTabbyEnabled = requestedTabby.is_enabled === true || requestedTabby.is_enabled === "true";
  const isTabbyConfigured = Boolean(tabbyPublicKeyEncrypted && tabbySecretKeyEncrypted && String(requestedTabby.merchant_code || "").trim());
  const requestedProvider = payload.active_provider ?? current.active_provider;
  const preferredProvider = requestedProvider === "tabby" && isTabbyEnabled && isTabbyConfigured
    ? "tabby"
    : requestedProvider === "edfapay" && isEdfaPayEnabled && isEdfaPayConfigured
    ? "edfapay"
    : requestedProvider === "tamara" && isEnabled && isConfigured ? "tamara" : "none";
  return {
    active_provider: preferredProvider,
    redirect_policy: {
      max_automatic_redirects: Math.min(2, Math.max(0, Number(requestedRedirectPolicy.max_automatic_redirects ?? 1))),
      attempt_ttl_minutes: Math.min(120, Math.max(5, Number(requestedRedirectPolicy.attempt_ttl_minutes || 30))),
      require_https: requestedRedirectPolicy.require_https !== false && requestedRedirectPolicy.require_https !== "false"
    },
    cash_on_delivery: {
      is_enabled: requestedCod.is_enabled !== false && requestedCod.is_enabled !== "false",
      title_en: String(requestedCod.title_en || defaultPaymentGatewaySettings.cash_on_delivery.title_en).slice(0, 80),
      title_ar: String(requestedCod.title_ar || defaultPaymentGatewaySettings.cash_on_delivery.title_ar).slice(0, 80),
      sort_order: Number(requestedCod.sort_order || 10)
    },
    providers: {
      tamara: {
        ...requestedTamara,
        api_token: undefined,
        notification_token: undefined,
        public_key: undefined,
        is_enabled: isEnabled,
        environment: requestedTamara.environment === "sandbox" ? "sandbox" : "production",
        live_base_url: String(requestedTamara.live_base_url || defaultPaymentGatewaySettings.providers.tamara.live_base_url).replace(/\/+$/, ""),
        sandbox_base_url: String(requestedTamara.sandbox_base_url || defaultPaymentGatewaySettings.providers.tamara.sandbox_base_url).replace(/\/+$/, ""),
        api_token_encrypted: apiTokenEncrypted,
        notification_token_encrypted: notificationTokenEncrypted,
        public_key_encrypted: publicKeyEncrypted,
        payment_type: requestedTamara.payment_type === "PAY_NOW" ? "PAY_NOW" : "PAY_BY_INSTALMENTS",
        instalments: Math.min(12, Math.max(2, Number(requestedTamara.instalments || 3))),
        supported_countries: supportedCountries.length ? supportedCountries : ["SA"],
        supported_currencies: supportedCurrencies.length ? supportedCurrencies : ["SAR"],
        minimum_amount: Math.max(0, Number(requestedTamara.minimum_amount || 0)),
        maximum_amount: numberOrNull(requestedTamara.maximum_amount),
        auto_authorise: requestedTamara.auto_authorise !== false && requestedTamara.auto_authorise !== "false",
        auto_capture: requestedTamara.auto_capture === true || requestedTamara.auto_capture === "true",
        show_product_widget: requestedTamara.show_product_widget !== false && requestedTamara.show_product_widget !== "false",
        show_at_checkout: requestedTamara.show_at_checkout !== false && requestedTamara.show_at_checkout !== "false",
        allowed_redirect_hosts: [...new Set(asArray(requestedTamara.allowed_redirect_hosts).map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))].slice(0, 20),
        webhook_id: String(requestedTamara.webhook_id || "").slice(0, 100),
        webhook_url: String(requestedTamara.webhook_url || "").slice(0, 500),
        webhook_registered_at: requestedTamara.webhook_registered_at || null,
        last_test_at: requestedTamara.last_test_at || null,
        last_test_status: ["not_tested", "connected", "failed"].includes(requestedTamara.last_test_status) ? requestedTamara.last_test_status : "not_tested",
        last_test_message: String(requestedTamara.last_test_message || "").slice(0, 500)
      },
      edfapay: {
        ...requestedEdfaPay,
        merchant_id: undefined,
        merchant_password: undefined,
        webhook_secret: undefined,
        is_enabled: isEdfaPayEnabled,
        show_at_checkout: requestedEdfaPay.show_at_checkout !== false && requestedEdfaPay.show_at_checkout !== "false",
        environment: requestedEdfaPay.environment === "sandbox" ? "sandbox" : "production",
        live_base_url: String(requestedEdfaPay.live_base_url || defaultPaymentGatewaySettings.providers.edfapay.live_base_url).replace(/\/+$/, ""),
        sandbox_base_url: String(requestedEdfaPay.sandbox_base_url || defaultPaymentGatewaySettings.providers.edfapay.sandbox_base_url).replace(/\/+$/, ""),
        merchant_id_encrypted: merchantIdEncrypted,
        merchant_password_encrypted: merchantPasswordEncrypted,
        webhook_secret_encrypted: webhookSecretEncrypted,
        callback_path_secret_encrypted: callbackPathSecretEncrypted,
        supported_countries: [...new Set(asArray(requestedEdfaPay.supported_countries).map((value) => String(value || "").toUpperCase()).filter((value) => ["SA", "AE", "BH", "KW", "OM", "QA"].includes(value)))].slice(0, 10).length
          ? [...new Set(asArray(requestedEdfaPay.supported_countries).map((value) => String(value || "").toUpperCase()).filter((value) => ["SA", "AE", "BH", "KW", "OM", "QA"].includes(value)))].slice(0, 10)
          : ["SA"],
        supported_currencies: [...new Set(asArray(requestedEdfaPay.supported_currencies).map((value) => String(value || "").toUpperCase()).filter((value) => ["SAR", "AED", "BHD", "KWD", "OMR", "QAR"].includes(value)))].slice(0, 10).length
          ? [...new Set(asArray(requestedEdfaPay.supported_currencies).map((value) => String(value || "").toUpperCase()).filter((value) => ["SAR", "AED", "BHD", "KWD", "OMR", "QAR"].includes(value)))].slice(0, 10)
          : ["SAR"],
        minimum_amount: Math.max(0, Number(requestedEdfaPay.minimum_amount || 0)),
        maximum_amount: numberOrNull(requestedEdfaPay.maximum_amount),
        allowed_redirect_hosts: [...new Set(asArray(requestedEdfaPay.allowed_redirect_hosts).map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))].slice(0, 20),
        last_test_at: requestedEdfaPay.last_test_at || null,
        last_test_status: ["not_tested", "connected", "failed"].includes(requestedEdfaPay.last_test_status) ? requestedEdfaPay.last_test_status : "not_tested",
        last_test_message: String(requestedEdfaPay.last_test_message || "").slice(0, 500)
      },
      tabby: {
        ...requestedTabby,
        public_key: undefined,
        secret_key: undefined,
        is_enabled: isTabbyEnabled,
        show_at_checkout: requestedTabby.show_at_checkout !== false && requestedTabby.show_at_checkout !== "false",
        environment: requestedTabby.environment === "sandbox" ? "sandbox" : "production",
        base_url: String(requestedTabby.base_url || defaultPaymentGatewaySettings.providers.tabby.base_url).replace(/\/+$/, ""),
        public_key_encrypted: tabbyPublicKeyEncrypted,
        secret_key_encrypted: tabbySecretKeyEncrypted,
        merchant_code: String(requestedTabby.merchant_code || "SA").trim().slice(0, 50),
        webhook_auth_encrypted: tabbyWebhookAuthEncrypted,
        supported_countries: [...new Set(asArray(requestedTabby.supported_countries).map((value) => String(value || "").toUpperCase()).filter((value) => ["SA", "AE", "KW"].includes(value)))].slice(0, 10).length ? [...new Set(asArray(requestedTabby.supported_countries).map((value) => String(value || "").toUpperCase()).filter((value) => ["SA", "AE", "KW"].includes(value)))].slice(0, 10) : ["SA"],
        supported_currencies: [...new Set(asArray(requestedTabby.supported_currencies).map((value) => String(value || "").toUpperCase()).filter((value) => ["SAR", "AED", "KWD"].includes(value)))].slice(0, 10).length ? [...new Set(asArray(requestedTabby.supported_currencies).map((value) => String(value || "").toUpperCase()).filter((value) => ["SAR", "AED", "KWD"].includes(value)))].slice(0, 10) : ["SAR"],
        minimum_amount: Math.max(0, Number(requestedTabby.minimum_amount || 0)),
        maximum_amount: numberOrNull(requestedTabby.maximum_amount),
        auto_capture: requestedTabby.auto_capture !== false && requestedTabby.auto_capture !== "false",
        allowed_redirect_hosts: [...new Set(asArray(requestedTabby.allowed_redirect_hosts).map((value) => String(value || "").trim().toLowerCase()).filter(Boolean))].slice(0, 20),
        webhook_id: String(requestedTabby.webhook_id || "").slice(0, 100),
        webhook_url: String(requestedTabby.webhook_url || "").slice(0, 500),
        webhook_registered_at: requestedTabby.webhook_registered_at || null,
        last_test_at: requestedTabby.last_test_at || null,
        last_test_status: ["not_tested", "connected", "failed"].includes(requestedTabby.last_test_status) ? requestedTabby.last_test_status : "not_tested",
        last_test_message: String(requestedTabby.last_test_message || "").slice(0, 500)
      }
    },
    updated_at: payload.updated_at || current.updated_at || null
  };
}

function publicPaymentGateways({ storefront = false } = {}) {
  const settings = normalizePaymentGateways();
  const tamara = settings.providers.tamara;
  const edfapay = settings.providers.edfapay;
  const tabby = settings.providers.tabby;
  const apiToken = decryptIntegrationSecret(tamara.api_token_encrypted);
  const notificationToken = decryptIntegrationSecret(tamara.notification_token_encrypted);
  const publicKey = decryptIntegrationSecret(tamara.public_key_encrypted);
  const edfapayMerchantId = decryptIntegrationSecret(edfapay.merchant_id_encrypted);
  const edfapayMerchantPassword = decryptIntegrationSecret(edfapay.merchant_password_encrypted);
  const edfapayWebhookSecret = decryptIntegrationSecret(edfapay.webhook_secret_encrypted);
  const edfapayCallbackSecret = decryptIntegrationSecret(edfapay.callback_path_secret_encrypted);
  const tabbyPublicKey = decryptIntegrationSecret(tabby.public_key_encrypted);
  const tabbySecretKey = decryptIntegrationSecret(tabby.secret_key_encrypted);
  if (storefront) {
    const methods = [];
    if (settings.cash_on_delivery.is_enabled) methods.push({
      id: "cod",
      provider: "internal",
      type: "cash_on_delivery",
      title_en: settings.cash_on_delivery.title_en,
      title_ar: settings.cash_on_delivery.title_ar,
      sort_order: settings.cash_on_delivery.sort_order
    });
    if (tamara.show_at_checkout && tamara.is_enabled && apiToken) methods.push({
      id: "tamara",
      provider: "tamara",
      type: "buy_now_pay_later",
      title_en: "Tamara",
      title_ar: "تمارا",
      description_en: tamara.payment_type === "PAY_NOW" ? "Pay securely with Tamara" : `Split into ${tamara.instalments} payments with Tamara`,
      description_ar: tamara.payment_type === "PAY_NOW" ? "ادفعي بأمان عبر تمارا" : `قسّميها على ${tamara.instalments} دفعات عبر تمارا`,
      payment_type: tamara.payment_type,
      instalments: tamara.instalments,
      supported_countries: tamara.supported_countries,
      supported_currencies: tamara.supported_currencies,
      minimum_amount: tamara.minimum_amount,
      maximum_amount: tamara.maximum_amount,
      public_key: publicKey,
      sort_order: 20
    });
    if (edfapay.show_at_checkout && edfapay.is_enabled && edfapayMerchantId && edfapayMerchantPassword) methods.push({
      id: "edfapay",
      provider: "edfapay",
      type: "hosted_card_checkout",
      title_en: "EdfaPay",
      title_ar: "ادفع باي",
      description_en: "Pay securely by card on EdfaPay",
      description_ar: "ادفع بأمان بالبطاقة عبر ادفع باي",
      supported_countries: edfapay.supported_countries,
      supported_currencies: edfapay.supported_currencies,
      minimum_amount: edfapay.minimum_amount,
      maximum_amount: edfapay.maximum_amount,
      sort_order: 30
    });
    if (tabby.show_at_checkout && tabby.is_enabled && tabbyPublicKey && tabbySecretKey) methods.push({
      id: "tabby", provider: "tabby", type: "buy_now_pay_later", title_en: "Tabby", title_ar: "تابي",
      description_en: "Split your purchase into 4 payments with Tabby", description_ar: "قسّمي مشترياتك على 4 دفعات مع تابي",
      supported_countries: tabby.supported_countries, supported_currencies: tabby.supported_currencies,
      minimum_amount: tabby.minimum_amount, maximum_amount: tabby.maximum_amount, public_key: tabbyPublicKey, sort_order: 25
    });
    const widgets = {};
    if (tamara.is_enabled && tamara.show_product_widget && publicKey) widgets.tamara = {
      id: "tamara",
      type: "tamara-summary",
      environment: tamara.environment,
      public_key: publicKey,
      supported_countries: tamara.supported_countries,
      supported_currencies: tamara.supported_currencies,
      minimum_amount: tamara.minimum_amount,
      maximum_amount: tamara.maximum_amount
    };
    return { active_provider: settings.active_provider, redirect_policy: settings.redirect_policy, methods: methods.sort((a, b) => a.sort_order - b.sort_order), widgets };
  }
  return {
    ...settings,
    providers: {
      ...settings.providers,
      tamara: {
        ...tamara,
        api_token_encrypted: undefined,
        notification_token_encrypted: undefined,
        public_key_encrypted: undefined,
        has_api_token: Boolean(apiToken),
        has_notification_token: Boolean(notificationToken),
        has_public_key: Boolean(publicKey),
        is_configured: Boolean(apiToken && notificationToken && publicKey)
      },
      edfapay: {
        ...edfapay,
        merchant_id_encrypted: undefined,
        merchant_password_encrypted: undefined,
        webhook_secret_encrypted: undefined,
        callback_path_secret_encrypted: undefined,
        has_merchant_id: Boolean(edfapayMerchantId),
        has_merchant_password: Boolean(edfapayMerchantPassword),
        has_webhook_secret: Boolean(edfapayWebhookSecret),
        is_configured: Boolean(edfapayMerchantId && edfapayMerchantPassword),
        customer_return_url: publicStoreUrl("/payment/edfapay/return"),
        callback_url: edfapayCallbackSecret ? publicStoreUrl(`/api/webhooks/edfapay/${edfapayCallbackSecret}`) : ""
      },
      tabby: {
        ...tabby,
        public_key_encrypted: undefined,
        secret_key_encrypted: undefined,
        webhook_auth_encrypted: undefined,
        has_public_key: Boolean(tabbyPublicKey),
        has_secret_key: Boolean(tabbySecretKey),
        is_configured: Boolean(tabbyPublicKey && tabbySecretKey && tabby.merchant_code),
        callback_urls: {
          success: publicStoreUrl("/payment/tabby/success"),
          cancel: publicStoreUrl("/payment/tabby/cancel"),
          failure: publicStoreUrl("/payment/tabby/failure")
        },
        callback_url: publicStoreUrl("/api/webhooks/tabby")
      }
    }
  };
}

function tamaraBaseUrl(config = normalizePaymentGateways().providers.tamara) {
  return config.environment === "sandbox" ? config.sandbox_base_url : config.live_base_url;
}

function tamaraSafeError(data, status) {
  const candidate = data?.message || data?.error?.message || data?.errors?.[0]?.message || data?.error || `Tamara request failed (${status})`;
  const message = typeof candidate === "string" ? candidate : JSON.stringify(candidate);
  return String(message || `Tamara request failed (${status})`).slice(0, 500);
}

async function tamaraRequest(pathname, { method = "GET", body, timeoutMs = 10000 } = {}) {
  const config = normalizePaymentGateways().providers.tamara;
  const apiToken = decryptIntegrationSecret(config.api_token_encrypted);
  if (!apiToken) fail("TAMARA_API_TOKEN_MISSING", 503);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(200, timeoutMs));
  try {
    const response = await fetch(`${tamaraBaseUrl(config)}${pathname}`, {
      method,
      headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) fail(tamaraSafeError(data, response.status), response.status);
    return data;
  } catch (error) {
    if (error.name === "AbortError") fail("TAMARA_REQUEST_TIMEOUT", 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function edfapayBaseUrl(config = normalizePaymentGateways().providers.edfapay) {
  return config.environment === "sandbox" ? config.sandbox_base_url : config.live_base_url;
}

function edfapayAmount(amount, currency = "SAR") {
  const digits = ["BHD", "KWD", "OMR"].includes(String(currency).toUpperCase()) ? 3 : 2;
  return Number(Math.max(0, Number(amount || 0))).toFixed(digits);
}

function edfapayLegacyHash(parts, password) {
  const input = [...parts, password].map((value) => String(value ?? "")).join("").toUpperCase();
  return crypto.createHash("sha1").update(crypto.createHash("md5").update(input).digest("hex")).digest("hex");
}

function edfapaySafeError(data, status) {
  const candidate = data?.error_message || data?.message || data?.errorCode || data?.errors?.[0]?.error_message || `EdfaPay request failed (${status})`;
  return String(typeof candidate === "string" ? candidate : JSON.stringify(candidate)).slice(0, 500);
}

async function edfapayInitiateRequest(fields, timeoutMs = 15000) {
  const config = normalizePaymentGateways().providers.edfapay;
  const merchantId = decryptIntegrationSecret(config.merchant_id_encrypted);
  const merchantPassword = decryptIntegrationSecret(config.merchant_password_encrypted);
  if (!merchantId || !merchantPassword) fail("EDFAPAY_CREDENTIALS_MISSING", 503);
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== "") form.append(key, String(value)); });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${edfapayBaseUrl(config)}/payment/initiate`, { method: "POST", body: form, signal: controller.signal, headers: { Accept: "application/json" } });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = Object.fromEntries(new URLSearchParams(text)); }
    if (!response.ok || String(data?.result || "").toUpperCase() === "ERROR") fail(edfapaySafeError(data, response.status), response.status || 502);
    return data;
  } catch (error) {
    if (error.name === "AbortError") fail("EDFAPAY_REQUEST_TIMEOUT", 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function tabbyRequest(pathname, { method = "GET", body, timeoutMs = 12000 } = {}) {
  const config = normalizePaymentGateways().providers.tabby;
  const secretKey = decryptIntegrationSecret(config.secret_key_encrypted);
  if (!secretKey) fail("TABBY_SECRET_KEY_MISSING", 503);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${config.base_url}${pathname}`, {
      method,
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json", "X-Merchant-Code": config.merchant_code, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) fail(String(data?.error || data?.message || data?.status || `TABBY_REQUEST_FAILED_${response.status}`).slice(0, 500), response.status);
    return data;
  } catch (error) {
    if (error.name === "AbortError") fail("TABBY_REQUEST_TIMEOUT", 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function tabbyPaymentStatus(value) {
  const status = String(value || "CREATED").toUpperCase();
  if (status === "CLOSED") return "captured";
  if (status === "AUTHORIZED") return "authorised";
  if (["REJECTED", "EXPIRED", "CANCELLED"].includes(status)) return status.toLowerCase();
  return "pending";
}

function tabbyAbsoluteUrl(value, fallback = "/") {
  try { return new URL(String(value || fallback), publicStoreUrl("/")).toString(); }
  catch { return publicStoreUrl(fallback); }
}

function tabbyItems(order) {
  return (order.items || []).map((item) => ({
    title: String(item.name_en || item.name_ar || "Product").slice(0, 255),
    description: String(item.description_en || item.variant_label || "").slice(0, 255),
    quantity: Math.max(1, Number(item.quantity || 1)),
    unit_price: Number(item.price || 0).toFixed(2),
    discount_amount: Number(item.discount_amount || 0).toFixed(2),
    reference_id: String(item.sku || item.product_id || item.bundle_id || item.key || "item").slice(0, 100),
    image_url: tabbyAbsoluteUrl(item.image_url || item.bundle_main_photo_url, "/"),
    product_url: publicStoreUrl(item.bundle_id ? `/bundle/${item.bundle_id}` : `/product/${item.product_id}`),
    category: String(item.category_name_en || item.category_slug || "Clothing").slice(0, 100)
  }));
}

async function completeTabbyPayment(order, remote) {
  const providerStatus = String(remote?.status || "CREATED").toUpperCase();
  const status = tabbyPaymentStatus(providerStatus);
  const paid = ["authorised", "captured"].includes(status);
  const failed = ["rejected", "expired", "cancelled", "failed"].includes(status);
  let nextOrder = updateRecord("orders", order.id, {
    payment: { ...(order.payment || {}), provider: "tabby", status, provider_status: providerStatus, provider_order_id: remote?.id || order.payment?.provider_order_id, transaction_id: remote?.id || order.payment?.transaction_id, last_updated_at: new Date().toISOString() },
    status: paid && order.status === "pending" ? "confirmed" : failed && order.status === "pending" ? "cancelled" : order.status
  });
  if (paid && !nextOrder.payment_completed_at) {
    finalizePromotionRedemptions(nextOrder.applied_promotions || [], nextOrder.customer_identity || {}, nextOrder.id);
    nextOrder = updateRecord("orders", nextOrder.id, { payment_completed_at: new Date().toISOString(), promotion_redemptions_finalized_at: new Date().toISOString() });
    await initializeOrderShipping(nextOrder);
    addOrderEvent(nextOrder.id, "payment_confirmed", { provider: "tabby", status, transaction_id: remote?.id || null }, "tabby");
  } else if (failed && !nextOrder.payment_failed_at) {
    releaseOrderPromotionReservations(nextOrder, `tabby_${status}`);
    nextOrder = updateRecord("orders", nextOrder.id, { payment_failed_at: new Date().toISOString() });
    addOrderEvent(nextOrder.id, "payment_failed", { provider: "tabby", status }, "tabby");
  }
  return getRecord("orders", nextOrder.id);
}

async function syncTabbyPayment(order, paymentId = order.payment?.provider_order_id) {
  if (!paymentId) fail("TABBY_PAYMENT_ID_MISSING", 409);
  let remote = await tabbyRequest(`/api/v2/payments/${encodeURIComponent(paymentId)}`);
  const config = normalizePaymentGateways().providers.tabby;
  if (String(remote.status).toUpperCase() === "AUTHORIZED" && config.auto_capture) {
    remote = await tabbyRequest(`/api/v2/payments/${encodeURIComponent(paymentId)}/captures`, { method: "POST", body: { amount: Number(order.total || 0).toFixed(2), reference_id: `SITEYFY-${order.id}-CAPTURE`, tax_amount: "0.00", shipping_amount: Number(order.shipping_amount || 0).toFixed(2), discount_amount: Number(order.discount_amount || 0).toFixed(2), items: tabbyItems(order) } });
    if (!remote?.status) remote = await tabbyRequest(`/api/v2/payments/${encodeURIComponent(paymentId)}`);
  }
  const status = tabbyPaymentStatus(remote.status);
  paymentTransaction({ provider: "tabby", order_id: order.id, provider_order_id: paymentId, type: "status_sync", status, amount: Number(remote.amount ?? order.total), currency: remote.currency || order.currency_snapshot?.code || "SAR", provider_event_key: `tabby:${paymentId}:${remote.status}`, details: { provider_status: remote.status } });
  return completeTabbyPayment(order, remote);
}

async function createTabbyCheckout(order) {
  const config = normalizePaymentGateways().providers.tabby;
  const currency = String(order.currency_snapshot?.code || "SAR").toUpperCase();
  const country = String(order.market_snapshot?.country_code || order.customer?.country_code || "SA").toUpperCase();
  if (!config.is_enabled || !config.show_at_checkout || !decryptIntegrationSecret(config.secret_key_encrypted)) fail("TABBY_NOT_ENABLED", 409);
  if (!config.supported_countries.includes(country) || !config.supported_currencies.includes(currency)) fail("TABBY_COUNTRY_OR_CURRENCY_NOT_SUPPORTED", 409);
  if (Number(order.total || 0) < Number(config.minimum_amount || 0) || (config.maximum_amount !== null && Number(order.total || 0) > Number(config.maximum_amount))) fail("TABBY_ORDER_AMOUNT_NOT_SUPPORTED", 409);
  if (!order.customer?.email || !order.customer?.phone) fail("TABBY_CUSTOMER_DETAILS_REQUIRED", 409);
  const token = jwt.sign({ type: "tabby_return", order_id: Number(order.id) }, jwtSecret, { expiresIn: "1d", audience: "siteyfy-tabby" });
  const callback = (outcome) => publicStoreUrl(`/payment/tabby/${outcome}?order_id=${order.id}&token=${encodeURIComponent(token)}`);
  const payload = {
    payment: {
      amount: Number(order.total || 0).toFixed(2), currency, description: `SITEYFY order #${order.id}`,
      buyer: { name: order.customer.full_name, email: order.customer.email, phone: order.customer.phone },
      shipping_address: { city: order.customer.city, address: [order.customer.street, order.customer.building_number, order.customer.district].filter(Boolean).join(" "), zip: order.customer.postal_code },
      order: { reference_id: String(order.id), items: tabbyItems(order), tax_amount: "0.00", shipping_amount: Number(order.shipping_amount || 0).toFixed(2), discount_amount: Number(order.discount_amount || 0).toFixed(2) },
      meta: { order_id: String(order.id), customer: String(order.customer_identity?.user_id || order.customer?.email || "guest") }
    },
    lang: "ar", merchant_code: config.merchant_code,
    merchant_urls: { success: callback("success"), cancel: callback("cancel"), failure: callback("failure") }
  };
  const result = await tabbyRequest("/api/v2/checkout", { method: "POST", body: payload, timeoutMs: 15000 });
  const paymentId = result.payment?.id;
  const checkoutUrl = result.configuration?.available_products?.installments?.[0]?.web_url;
  if (String(result.status).toLowerCase() !== "created" || !paymentId || !checkoutUrl) fail(result.configuration?.products?.installments?.rejection_reason || "TABBY_CHECKOUT_REJECTED", 409);
  const verifiedUrl = verifiedPaymentRedirectUrl(checkoutUrl, config);
  const payment = { ...(order.payment || {}), provider: "tabby", status: "pending", provider_status: result.payment?.status || result.status, provider_order_id: paymentId, checkout_id: result.id, checkout_url: verifiedUrl, environment: config.environment, created_at: new Date().toISOString() };
  paymentTransaction({ provider: "tabby", order_id: order.id, provider_order_id: paymentId, checkout_id: result.id, type: "checkout_created", status: "pending", amount: order.total, currency, details: { provider_status: result.status } });
  return updateRecord("orders", order.id, { payment });
}

const splAddressRateLimit = new Map();

function normalizeSaudiShortAddress(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function validSaudiShortAddress(value) {
  return /^[A-Z]{4}[0-9]{4}$/.test(normalizeSaudiShortAddress(value));
}

function addressValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
  }
  return "";
}

function normalizeSplAddress(row = {}, shortAddress = "") {
  const coordinates = String(addressValue(row, "ObjLatLng", "objLatLng") || "").match(/-?[0-9]+(?:\.[0-9]+)?/g)?.map(Number) || [];
  const directLatitude = Number(addressValue(row, "Latitude", "latitude"));
  const directLongitude = Number(addressValue(row, "Longitude", "longitude"));
  const latitude = Number.isFinite(directLatitude) && directLatitude !== 0 ? directLatitude : coordinates.length >= 3 ? coordinates[coordinates.length - 1] : null;
  const longitude = Number.isFinite(directLongitude) && directLongitude !== 0 ? directLongitude : coordinates.length >= 3 ? coordinates[coordinates.length - 2] : null;
  return {
    country_code: "SA",
    short_address: normalizeSaudiShortAddress(shortAddress),
    province: String(addressValue(row, "RegionName", "regionName", "RegionName_L2") || "").trim(),
    city: String(addressValue(row, "City", "city", "City_L2") || "").trim(),
    district: String(addressValue(row, "District", "district", "District_L2") || "").trim(),
    street: String(addressValue(row, "Street", "street", "Street_L2") || "").trim(),
    building_number: String(addressValue(row, "BuildingNumber", "buildingNumber") || "").trim(),
    postal_code: String(addressValue(row, "PostCode", "postCode", "ZipCode", "zipCode") || "").trim(),
    additional_number: String(addressValue(row, "AdditionalNumber", "additionalNumber") || "").trim(),
    latitude,
    longitude,
    address_line_1: String(addressValue(row, "Address1", "address1") || "").trim(),
    address_line_2: String(addressValue(row, "Address2", "address2") || "").trim(),
    provider_reference: String(addressValue(row, "PKAddressID", "pkAddressId", "ObjectId", "objectId") || "").trim()
  };
}

function splVerificationToken(address) {
  return jwt.sign({ type: "spl_address", address }, jwtSecret, { expiresIn: "30m", audience: "siteyfy-checkout" });
}

function verifiedAddressFromToken(token, shortAddress) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(String(token), jwtSecret, { audience: "siteyfy-checkout" });
    if (decoded?.type !== "spl_address" || normalizeSaudiShortAddress(decoded.address?.short_address) !== normalizeSaudiShortAddress(shortAddress)) return null;
    return decoded.address;
  } catch {
    return null;
  }
}

async function resolveSaudiShortAddress(shortAddress, { force = false, actor = "checkout" } = {}) {
  const code = normalizeSaudiShortAddress(shortAddress);
  if (!validSaudiShortAddress(code)) fail("INVALID_SAUDI_SHORT_ADDRESS");
  const settings = normalizeShippingIntegrations().spl_address;
  const apiKey = decryptIntegrationSecret(settings.api_key_encrypted);
  if (!settings.is_enabled || !apiKey) fail("SPL_ADDRESS_NOT_CONFIGURED", 503);
  const shortAddressHash = crypto.createHash("sha256").update(code).digest("hex");
  const cached = !force && entityRows("address_verifications").find((entry) => {
    if (entry.short_address_hash !== shortAddressHash || entry.status !== "verified") return false;
    return Date.now() - new Date(entry.verified_at || entry.created_at).getTime() < settings.cache_days * 86400000;
  });
  if (cached?.address) return { address: cached.address, verification_token: splVerificationToken(cached.address), cached: true, verified_at: cached.verified_at };

  const url = new URL(settings.base_url);
  url.searchParams.set("format", "json");
  url.searchParams.set("language", settings.language);
  url.searchParams.set("page", "1");
  url.searchParams.set("encode", "utf8");
  url.searchParams.set("shortaddress", code);
  url.searchParams.set("api_key", apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.timeout_ms);
  let response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
  } catch (error) {
    fail(error.name === "AbortError" ? "SPL_ADDRESS_TIMEOUT" : "SPL_ADDRESS_UNAVAILABLE", 502);
  } finally {
    clearTimeout(timeout);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) fail(`SPL_ADDRESS_HTTP_${response.status}`, 502);
  const rows = payload?.Addresses || payload?.addresses || payload?.result?.Addresses || payload?.result?.addresses || [];
  const first = Array.isArray(rows) ? rows[0] : rows;
  if (payload?.success === false || !first) fail("SPL_ADDRESS_NOT_FOUND", 404);
  const address = normalizeSplAddress(first, code);
  if (!address.city || !address.building_number || !address.postal_code) fail("SPL_ADDRESS_INCOMPLETE", 422);
  const verifiedAt = new Date().toISOString();
  createRecord("address_verifications", {
    provider: "spl",
    actor,
    status: "verified",
    short_address_hash: shortAddressHash,
    address,
    verified_at: verifiedAt
  });
  return { address, verification_token: splVerificationToken(address), cached: false, verified_at: verifiedAt };
}

const imileOmsPublicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCrTwxoTL1REQ1vJgrXqVpbG+EdNF+JFvQ/SLSO4MARMnPUXMx320oGklKEchR+JLcuxfIbRariYZAv7M+uhUcEatKhoYhA14zbshMpeEydpv2OFuPIz9t27miis0Qu2/WrZWj2GzZFi0tOdFvUeGT6aztJwomra8WRl925BN5+vwIDAQAB
-----END PUBLIC KEY-----`;

function imileOmsBaseUrl(connector) {
  return connector.environment === "sandbox" ? "https://test-oms.52imile.cn" : "https://oms.imile.com";
}

function imileOmsPagePath(connector, route = "account/feeDetail") {
  return `${imileOmsBaseUrl(connector)}/#/${route}`;
}

function imileOmsFrontSec(user = {}) {
  return {
    userCode: user.userCode || user.username || "",
    entId: user.ownOrgId,
    userType: user.userType || "",
    moduleId: 10023,
    settleOrgId: user.settleOrgId
  };
}

async function imileOmsLogin(settings = normalizeShippingIntegrations(), force = false) {
  const connector = settings.oms_connector;
  const password = decryptIntegrationSecret(connector.password_encrypted);
  if (!connector.is_enabled || !connector.username || !password) fail("IMILE_OMS_NOT_CONFIGURED");
  const cacheKey = `${connector.environment}:${connector.username}`;
  const cached = imileOmsTokenCache.get(cacheKey);
  if (!force && cached?.expires_at > Date.now() + 60000) return cached;
  const encryptedPassword = crypto.publicEncrypt(
    { key: imileOmsPublicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(password, "utf8")
  ).toString("base64");
  const body = new URLSearchParams({ userCode: connector.username, password: encryptedPassword, timeZone: "+3", lang: "en_US" });
  const response = await fetch(`${imileOmsBaseUrl(connector)}/ucenter/imile/login`, {
    method: "POST",
    headers: {
      Authorization: "Basic b21zOm9tcw==",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      lang: "en_US",
      "sys-name": "OMS",
      timeZone: "+3",
      "X-Page-Path": imileOmsPagePath(connector, "login")
    },
    body,
    signal: AbortSignal.timeout(20000)
  });
  const result = await response.json().catch(() => ({}));
  const auth = result.resultObject || result.data || {};
  if (!response.ok || result.status !== "success" || !auth.access_token) fail(`IMILE_OMS_AUTH_FAILED: ${result.message || response.status}`, 502);
  const session = {
    access_token: auth.access_token,
    user: auth.user_info || {},
    expires_at: Date.now() + Math.max(300, Number(auth.expires_in || 3600)) * 1000
  };
  imileOmsTokenCache.set(cacheKey, session);
  return session;
}

async function imileOmsRequest(pathname, payload, allowRetry = true) {
  const settings = normalizeShippingIntegrations();
  const connector = settings.oms_connector;
  const session = await imileOmsLogin(settings);
  const response = await fetch(`${imileOmsBaseUrl(connector)}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Front-Sec": JSON.stringify(imileOmsFrontSec(session.user)),
      lang: "en_US",
      "sys-name": "OMS",
      timeZone: "+3",
      "X-Page-Path": imileOmsPagePath(connector)
    },
    body: JSON.stringify(payload || {}),
    signal: AbortSignal.timeout(25000)
  });
  const result = await response.json().catch(() => ({}));
  if ((response.status === 401 || result.resultCode === "unauthorized") && allowRetry) {
    imileOmsTokenCache.clear();
    await imileOmsLogin(settings, true);
    return imileOmsRequest(pathname, payload, false);
  }
  if (!response.ok || result.status !== "success" || result.resultCode !== "success") {
    fail(`IMILE_OMS_API_ERROR: ${result.message || response.status}`, 502);
  }
  return result.resultObject || result.data || {};
}

async function imileOmsFormRequest(pathname, payload, allowRetry = true) {
  const settings = normalizeShippingIntegrations();
  const connector = settings.oms_connector;
  const session = await imileOmsLogin(settings);
  const response = await fetch(`${imileOmsBaseUrl(connector)}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
      "Front-Sec": JSON.stringify(imileOmsFrontSec(session.user)),
      lang: "en_US",
      "sys-name": "OMS",
      timeZone: "+3",
      "X-Page-Path": imileOmsPagePath(connector, "account/myBill")
    },
    body: new URLSearchParams(Object.entries(payload || {}).filter(([, value]) => value !== undefined && value !== null)),
    signal: AbortSignal.timeout(25000)
  });
  const result = await response.json().catch(() => ({}));
  if ((response.status === 401 || result.resultCode === "unauthorized") && allowRetry) {
    imileOmsTokenCache.clear();
    await imileOmsLogin(settings, true);
    return imileOmsFormRequest(pathname, payload, false);
  }
  if (!response.ok || result.status !== "success" || result.resultCode !== "success") {
    fail(`IMILE_OMS_API_ERROR: ${result.message || response.status}`, 502);
  }
  return result.resultObject || result.data || {};
}

function dateInRiyadh(date = new Date()) {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function shiftIsoDate(value, days) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function imileOmsAmount(value) {
  const totals = Array.isArray(value?.totalAmount) ? value.totalAmount : [];
  return {
    amount: Number(totals.reduce((sum, item) => sum + Number(item?.amount || 0), 0).toFixed(3)),
    currency: String(totals.find((item) => item?.currency)?.currency || "SAR")
  };
}

function imileOmsFeeBreakdown(value) {
  return (Array.isArray(value?.amountDTOS) ? value.amountDTOS : []).map((item) => ({
    name: String(item.feeTypeName || item.billTypeDesc || "Fee"),
    amount: Number(item.amount || 0),
    currency: String(item.currency || "SAR"),
    bill_code: String(item.billCode || ""),
    bill_date: String(item.billDate || ""),
    billed: String(item.billOutStatus || "") === "1"
  }));
}

async function fetchImileOmsFees(dateFrom, dateTo) {
  const showCount = 20;
  const rows = [];
  let windowStart = dateFrom;
  while (windowStart <= dateTo) {
    const windowEnd = shiftIsoDate(windowStart, 6) < dateTo ? shiftIsoDate(windowStart, 6) : dateTo;
    let currentPage = 1;
    let totalPage = 1;
    do {
      const result = await imileOmsRequest("/hera/bill/feeList", {
        timeSearchType: 1,
        startTime: `${windowStart} 00:00:00`,
        endTime: `${windowEnd} 23:59:59`,
        currentPage,
        showCount
      });
      rows.push(...(Array.isArray(result.results) ? result.results : []));
      totalPage = Math.max(1, Number(result.pagination?.totalPage || 1));
      currentPage += 1;
    } while (currentPage <= totalPage && currentPage <= 100);
    windowStart = shiftIsoDate(windowEnd, 1);
  }
  const unique = new Map();
  rows.forEach((row) => {
    const key = String(row.waybillNo || row.orderNo || `${row.clientNo || "row"}:${row.createDate || unique.size}`);
    const existing = unique.get(key);
    const existingCost = imileOmsAmount(existing?.expendAmount).amount;
    const incomingCost = imileOmsAmount(row.expendAmount).amount;
    if (!existing || incomingCost > existingCost || String(row.feeUpdateDate || "") > String(existing.feeUpdateDate || "")) unique.set(key, row);
  });
  return [...unique.values()];
}

function normalizeImileBillCycle(value = "") {
  const dates = String(value).match(/\d{4}[/-]\d{2}[/-]\d{2}/g) || [];
  const normalized = dates.map((date) => date.replaceAll("/", "-"));
  return { start: normalized[0] || "", end: normalized[1] || normalized[0] || "" };
}

async function fetchImileOmsBills(dateFrom, dateTo) {
  const rows = [];
  for (const billType of ["codBill", "feeBill"]) {
    let currentPage = 1;
    let totalPage = 1;
    do {
      const result = await imileOmsFormRequest("/hera/bill/billList", {
        moduleId: 10012,
        startBillDate: `${dateFrom} 00:00:00`,
        endBillDate: `${dateTo} 23:59:59`,
        businessCountry: "KSA",
        billType,
        settleType: "",
        currentPage,
        showCount: 100
      });
      rows.push(...(Array.isArray(result.results) ? result.results : []));
      totalPage = Math.max(1, Number(result.pagination?.totalPage || 1));
      currentPage += 1;
    } while (currentPage <= totalPage && currentPage <= 100);
  }
  return [...new Map(rows.map((row) => [String(row.id || row.billCode), row])).values()];
}

function upsertImileOmsBills(rows = [], fetchedAt = new Date().toISOString()) {
  const existingBills = entityRows("shipping_carrier_bills");
  let inserted = 0;
  let updated = 0;
  rows.forEach((row) => {
    const providerId = String(row.id || "");
    const billCode = String(row.billCode || "");
    const existing = existingBills.find((bill) => bill.provider === "imile" && (String(bill.provider_bill_id || "") === providerId || String(bill.bill_code || "") === billCode));
    const cycle = normalizeImileBillCycle(row.billCycle);
    const payload = {
      provider: "imile",
      provider_bill_id: providerId,
      bill_code: billCode,
      invoice_number: String(row.inoviceNo || row.invoiceNo || ""),
      bill_type: String(row.billType || ""),
      bill_type_label: String(row.billTypeDesc || ""),
      bill_date: String(row.billDate || "").slice(0, 10),
      cycle_label: String(row.billCycle || ""),
      cycle_start: cycle.start,
      cycle_end: cycle.end,
      amount: Number(Number(row.feeSum || 0).toFixed(3)),
      currency: String(row.billCurrency || row.clientBillCurrency || "SAR"),
      settlement_status: String(row.settleType || ""),
      business_country: String(row.businessCountry || "KSA"),
      client_code: String(row.clientCode || ""),
      client_name: String(row.clientName || ""),
      provider_created_at: String(row.createDate || ""),
      provider_updated_at: String(row.lastUpdDate || ""),
      fetched_at: fetchedAt,
      raw: row
    };
    if (existing) {
      updateRecord("shipping_carrier_bills", existing.id, payload);
      updated += 1;
    } else {
      createRecord("shipping_carrier_bills", payload);
      inserted += 1;
    }
  });

  const bills = entityRows("shipping_carrier_bills").filter((bill) => bill.provider === "imile");
  const existingWeeks = entityRows("shipping_weekly_reconciliations");
  const shipmentRows = entityRows("shipping_shipments");
  const cycles = [...new Set(bills.map((bill) => `${bill.cycle_start}|${bill.cycle_end}`).filter((key) => !key.startsWith("|")))];
  cycles.forEach((key) => {
    const [cycleStart, cycleEnd] = key.split("|");
    const cycleBills = bills.filter((bill) => bill.cycle_start === cycleStart && bill.cycle_end === cycleEnd);
    const codBill = cycleBills.find((bill) => bill.bill_type === "codBill") || null;
    const feeBill = cycleBills.find((bill) => bill.bill_type === "feeBill") || null;
    const billCodes = cycleBills.map((bill) => bill.bill_code).filter(Boolean);
    const linkedShipments = shipmentRows.filter((shipment) => {
      const numbers = Array.isArray(shipment.carrier_bill_numbers) ? shipment.carrier_bill_numbers.map(String) : [];
      return billCodes.some((code) => numbers.includes(code));
    });
    const linkedFeeTotal = Number(linkedShipments.reduce((sum, shipment) => sum + Number(shipment.carrier_actual_cost || 0), 0).toFixed(3));
    const feeAmount = Number(feeBill?.amount || 0);
    const codAmount = Number(codBill?.amount || 0);
    const feeDifference = Number((feeAmount - linkedFeeTotal).toFixed(3));
    const issues = [];
    if (!codBill) issues.push("missing_cod_bill");
    if (!feeBill) issues.push("missing_fee_bill");
    if (codBill && codBill.settlement_status !== "Completed") issues.push("cod_not_completed");
    if (feeBill && feeBill.settlement_status !== "Completed") issues.push("fee_not_completed");
    if (feeAmount > codAmount && codAmount > 0) issues.push("fees_exceed_collections");
    if (linkedShipments.length && Math.abs(feeDifference) > 0.05) issues.push("fee_detail_mismatch");
    const payload = {
      provider: "imile",
      cycle_start: cycleStart,
      cycle_end: cycleEnd,
      bill_date: codBill?.bill_date || feeBill?.bill_date || shiftIsoDate(cycleEnd, 1),
      cod_bill_id: codBill?.id || null,
      cod_bill_code: codBill?.bill_code || "",
      cod_amount: codAmount,
      cod_status: codBill?.settlement_status || "Missing",
      fee_bill_id: feeBill?.id || null,
      fee_bill_code: feeBill?.bill_code || "",
      fee_amount: feeAmount,
      fee_status: feeBill?.settlement_status || "Missing",
      expected_transfer: Number((codAmount - feeAmount).toFixed(3)),
      currency: codBill?.currency || feeBill?.currency || "SAR",
      linked_shipment_ids: linkedShipments.map((shipment) => shipment.id),
      linked_shipment_count: linkedShipments.length,
      linked_fee_total: linkedFeeTotal,
      fee_detail_difference: feeDifference,
      status: codBill?.settlement_status === "Completed" && feeBill?.settlement_status === "Completed" ? "completed" : "open",
      issues,
      fetched_at: fetchedAt
    };
    const existing = existingWeeks.find((week) => week.provider === "imile" && week.cycle_start === cycleStart && week.cycle_end === cycleEnd);
    existing ? updateRecord("shipping_weekly_reconciliations", existing.id, payload) : createRecord("shipping_weekly_reconciliations", payload);
  });
  return { inserted, updated, total: rows.length, reconciliations: cycles.length };
}

function normalizedLegacySku(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

function legacyShipmentProductMatches(shipment = {}, products = entityRows("products")) {
  const raw = String(shipment.metadata?.sku || "");
  if (!raw.trim()) return [];
  const tokens = raw.split(",").map(normalizedLegacySku).filter(Boolean);
  const matches = new Map();
  products.forEach((product) => {
    const aliases = [product.sku, ...(product.variants || []).map((variant) => variant.sku)].map(normalizedLegacySku).filter(Boolean);
    if (!aliases.length) return;
    const matched = tokens.some((token) => aliases.some((alias) => token === alias || token.startsWith(`${alias}-`)));
    if (matched) matches.set(Number(product.id), { product_id: Number(product.id), quantity: 1, confidence: "sku", matched_value: raw });
  });
  return [...matches.values()];
}

function syncLegacyShipmentSalesEvidence(fetchedAt = new Date().toISOString()) {
  const products = entityRows("products");
  const existing = entityRows("legacy_sales_evidence");
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  entityRows("shipping_shipments").filter((shipment) => shipment.provider === "imile" && !shipment.store_order_id).forEach((shipment) => {
    legacyShipmentProductMatches(shipment, products).forEach((match) => {
      const current = existing.find((row) => Number(row.shipment_id) === Number(shipment.id) && Number(row.product_id) === Number(match.product_id));
      const payload = {
        source: "imile_oms_shipment_history",
        shipment_id: Number(shipment.id),
        waybill_no: String(shipment.waybill_no || ""),
        legacy_order_no: String(shipment.client_order_no || ""),
        product_id: match.product_id,
        minimum_quantity: match.quantity,
        match_confidence: match.confidence,
        matched_value: match.matched_value,
        delivered: shipment.status_group === "delivered",
        shipment_status: String(shipment.status_group || "pending"),
        shipment_status_label: String(shipment.status_label || ""),
        shipment_date: String(shipment.delivered_at || shipment.latest_status_time || shipment.metadata?.created_at_oms || ""),
        customer_name: String(shipment.customer_name || ""),
        customer_phone: String(shipment.customer_phone || ""),
        billable_weight: Number(shipment.carrier_billable_weight || 0) || null,
        actual_shipping_cost: Number(shipment.carrier_actual_cost || 0) || null,
        currency: String(shipment.currency || "SAR"),
        verified_at: fetchedAt
      };
      if (current) {
        const changed = Object.entries(payload).some(([key, value]) => key !== "verified_at" && JSON.stringify(current[key] ?? null) !== JSON.stringify(value ?? null));
        if (changed) {
          updateRecord("legacy_sales_evidence", current.id, payload);
          updated += 1;
        } else {
          unchanged += 1;
        }
      } else {
        createRecord("legacy_sales_evidence", payload);
        inserted += 1;
      }
    });
  });
  return { inserted, updated, unchanged, total: entityRows("legacy_sales_evidence").length };
}

function verifiedLegacyUnitsSold(productId) {
  return entityRows("legacy_sales_evidence")
    .filter((row) => {
      if (Number(row.product_id) !== Number(productId) || row.delivered !== true) return false;
      if (!row.legacy_order_record_id) return true;
      const importedOrder = getRecord("orders", row.legacy_order_record_id);
      return !importedOrder || !orderIsPaidOrDelivered(importedOrder) || unitsOfProductInOrder(importedOrder, productId) === 0;
    })
    .reduce((sum, row) => sum + Math.max(1, Number(row.minimum_quantity || 1)), 0);
}

function imileDeliveryFee(shipment = {}) {
  return Number((shipment.carrier_fee_breakdown || []).filter((fee) => /delivery|配送/i.test(String(fee.name || ""))).reduce((sum, fee) => sum + Number(fee.amount || 0), 0).toFixed(3));
}

function inferImileWeightPricing() {
  const samples = entityRows("shipping_shipments").map((shipment) => ({
    shipment,
    weight: Number(shipment.carrier_billable_weight || 0),
    delivery_fee: imileDeliveryFee(shipment)
  })).filter((row) => row.weight > 0 && row.delivery_fee > 0);
  if (!samples.length) return { sample_count: 0, base_fee: null, included_weight_kg: null, extra_kg_fee: null, anomalies: [] };
  const feeCounts = samples.reduce((map, row) => map.set(row.delivery_fee, Number(map.get(row.delivery_fee) || 0) + 1), new Map());
  const baseFee = [...feeCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  let best = null;
  for (let included = 1; included <= 10; included += 1) {
    const priced = samples.filter((row) => Math.ceil(row.weight) > included && row.delivery_fee > baseFee);
    if (!priced.length) continue;
    const candidates = priced.map((row) => (row.delivery_fee - baseFee) / (Math.ceil(row.weight) - included)).sort((a, b) => a - b);
    const extra = candidates[Math.floor(candidates.length / 2)];
    const error = samples.reduce((sum, row) => sum + Math.abs(row.delivery_fee - (baseFee + Math.max(0, Math.ceil(row.weight) - included) * extra)), 0) / samples.length;
    if (!best || error < best.error) best = { included, extra, error };
  }
  const includedWeight = best?.included || 5;
  const extraKgFee = Number((best?.extra || 1).toFixed(3));
  const anomalies = samples.map((row) => {
    const expected = Number((baseFee + Math.max(0, Math.ceil(row.weight) - includedWeight) * extraKgFee).toFixed(3));
    return { shipment_id: row.shipment.id, waybill_no: row.shipment.waybill_no, legacy_order_no: row.shipment.client_order_no, weight: row.weight, actual_delivery_fee: row.delivery_fee, expected_delivery_fee: expected, difference: Number((row.delivery_fee - expected).toFixed(3)), status: row.shipment.status_group };
  }).filter((row) => Math.abs(row.difference) > 0.05).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  return { sample_count: samples.length, base_fee: baseFee, included_weight_kg: includedWeight, extra_kg_fee: extraKgFee, mean_absolute_error: Number((best?.error || 0).toFixed(3)), anomalies };
}

function upsertImileOmsReport(reportDate, rows, syncMeta) {
  const shipmentRows = entityRows("shipping_shipments");
  const shipmentByWaybill = new Map(shipmentRows.map((row) => [String(row.waybill_no || ""), row]));
  const matchedShipments = [];
  const items = [];
  const billNumbers = new Set();
  const feeTotals = new Map();
  let actualCostTotal = 0;
  let collectedTotal = 0;
  let costRows = 0;
  let unmatched = 0;
  rows.forEach((row) => {
    const waybill = String(row.waybillNo || "");
    const actual = imileOmsAmount(row.expendAmount);
    const collected = imileOmsAmount(row.revenueAmount);
    const feeBreakdown = imileOmsFeeBreakdown(row.expendAmount);
    let shipment = shipmentByWaybill.get(waybill);
    (Array.isArray(row.billNos) ? row.billNos : []).filter(Boolean).forEach((bill) => billNumbers.add(String(bill)));
    feeBreakdown.forEach((fee) => feeTotals.set(fee.name, Number(((feeTotals.get(fee.name) || 0) + fee.amount).toFixed(3))));
    actualCostTotal += actual.amount;
    collectedTotal += collected.amount;
    if (actual.amount > 0) costRows += 1;
    if (!shipment && waybill) {
      shipment = upsertShippingShipment({
        waybill_no: waybill,
        client_order_no: String(row.clientNo || ""),
        external_order_no: String(row.orderNo || ""),
        provider: "imile",
        source: "oms_fee_report",
        status_code: String(row.orderStatusDesc || row.orderStatus || "pending"),
        status_label: String(row.orderStatusDesc || row.orderStatus || ""),
        latest_status_time: String(row.finishDate || row.feeUpdateDate || row.createDate || ""),
        carrier_billable_weight: Number(row.billableWeight || 0),
        carrier_collected_amount: collected.amount,
        first_seen_at: syncMeta.fetched_at,
        last_seen_at: syncMeta.fetched_at,
        sync_state: "imported_from_fee_report"
      });
      shipmentByWaybill.set(waybill, shipment);
    }
    if (shipment) {
      matchedShipments.push(shipment);
      shipment = updateRecord("shipping_shipments", shipment.id, {
        carrier_actual_cost: actual.amount > 0 ? actual.amount : shipment.carrier_actual_cost ?? null,
        cost_source: actual.amount > 0 ? "imile_oms_fee_report" : shipment.cost_source ?? null,
        cost_recorded_at: actual.amount > 0 ? new Date().toISOString() : shipment.cost_recorded_at ?? null,
        carrier_collected_amount: collected.amount,
        carrier_billable_weight: Number(row.billableWeight || 0),
        carrier_bill_numbers: Array.isArray(row.billNos) ? row.billNos : [],
        carrier_fee_breakdown: feeBreakdown,
        oms_fee_update_date: String(row.feeUpdateDate || reportDate),
        oms_fee_create_date: String(row.feeCreateDate || reportDate),
        last_seen_at: syncMeta.fetched_at,
        provider_updated_at: String(row.feeUpdateDate || row.finishDate || reportDate)
      });
    } else {
      unmatched += 1;
    }
    items.push({
      waybill_no: waybill,
      client_no: String(row.clientNo || ""),
      order_no: String(row.orderNo || ""),
      provider: "imile",
      billable_weight: Number(row.billableWeight || 0),
      declared_value: Number(row.billableDeclaredValue || 0),
      collected_amount: collected.amount,
      actual_cost: actual.amount || null,
      currency: actual.currency || collected.currency || "SAR",
      bill_numbers: Array.isArray(row.billNos) ? row.billNos : [],
      fee_breakdown: feeBreakdown,
      order_type: String(row.orderTypeDesc || row.orderType || ""),
      order_status: String(row.orderStatusDesc || row.orderStatus || ""),
      order_created_at: String(row.createDate || ""),
      order_finished_at: String(row.finishDate || ""),
      fee_created_at: String(row.feeCreateDate || reportDate),
      fee_updated_at: String(row.feeUpdateDate || reportDate),
      matched_shipment_id: shipment?.id || null
    });
  });
  actualCostTotal = Number(actualCostTotal.toFixed(3));
  collectedTotal = Number(collectedTotal.toFixed(3));
  const reportPayload = {
    provider: "imile",
    source: "oms_fee_report",
    report_type: "weekly_fee",
    report_date: reportDate,
    fetched_at: syncMeta.fetched_at,
    range_start: syncMeta.range_start,
    range_end: syncMeta.range_end,
    shipment_count: rows.length,
    matched_count: matchedShipments.length,
    unmatched_count: unmatched,
    cost_rows: costRows,
    missing_cost_count: rows.length - costRows,
    actual_cost_total: actualCostTotal,
    collected_total: collectedTotal,
    currency: "SAR",
    bill_numbers: [...billNumbers],
    fee_totals: [...feeTotals.entries()].map(([name, amount]) => ({ name, amount, currency: "SAR" })),
    items
  };
  const existingReport = entityRows("shipping_reports").find((report) => report.source === "oms_fee_report" && report.report_date === reportDate);
  const report = existingReport ? updateRecord("shipping_reports", existingReport.id, reportPayload) : createRecord("shipping_reports", reportPayload);
  const customerShippingTotal = Number(matchedShipments.reduce((sum, shipment) => sum + Number(shipment.customer_shipping_charge || 0), 0).toFixed(2));
  const existingSettlement = entityRows("shipping_settlements").find((settlement) => settlement.source_data_date === reportDate || settlement.source_report_id === report.id);
  const settlementPayload = {
    provider: "imile",
    period_type: "week",
    period_start: existingSettlement?.period_start || shiftIsoDate(reportDate, -6),
    period_end: existingSettlement?.period_end || reportDate,
    status: existingSettlement?.status || "draft",
    shipment_ids: matchedShipments.map((shipment) => shipment.id),
    total: rows.length,
    shipment_count: rows.length,
    customer_shipping_total: customerShippingTotal,
    estimated_cost_total: Number(existingSettlement?.estimated_cost_total || 0),
    actual_cost_total: actualCostTotal,
    actual_cost_coverage: rows.length ? Math.round(costRows / rows.length * 100) : 0,
    estimated_margin: Number((customerShippingTotal - Number(existingSettlement?.estimated_cost_total || 0)).toFixed(2)),
    actual_margin: Number((customerShippingTotal - actualCostTotal).toFixed(3)),
    source: "imile_oms_fee_report",
    source_report_id: report.id,
    source_data_date: reportDate,
    bill_numbers: [...billNumbers],
    unmatched_count: unmatched,
    missing_cost_count: rows.length - costRows,
    notes: existingSettlement?.notes || "Synced read-only from iMile OMS fee details.",
    generated_at: syncMeta.fetched_at
  };
  const settlement = existingSettlement
    ? updateRecord("shipping_settlements", existingSettlement.id, settlementPayload)
    : createRecord("shipping_settlements", settlementPayload);
  return { report, settlement };
}

async function syncImileOmsReports(options = {}) {
  if (imileOmsSyncPromise) return imileOmsSyncPromise;
  imileOmsSyncPromise = (async () => {
    const settings = normalizeShippingIntegrations();
    const connector = settings.oms_connector;
    const fetchedAt = new Date().toISOString();
    const dateTo = String(options.date_to || dateInRiyadh());
    const cursorDate = String(connector.incremental_cursor?.fee_updated_through || connector.last_range?.end || "");
    const dateFrom = String(options.date_from || (cursorDate ? shiftIsoDate(cursorDate, -Number(connector.sync_overlap_days || 2)) : shiftIsoDate(dateTo, -connector.lookback_days)));
    let syncRun = createRecord("shipping_sync_runs", {
      provider: "imile",
      source: "oms_fee_report",
      trigger: String(options.trigger || (options.force ? "manual" : "automatic")),
      mode: options.date_from ? "backfill" : "incremental",
      status: "running",
      range_start: dateFrom,
      range_end: dateTo,
      cursor_before: connector.incremental_cursor || null,
      started_at: fetchedAt,
      fetched_rows: 0,
      new_shipments: 0,
      updated_shipments: 0,
      unchanged_shipments: 0,
      reports_updated: 0
    });
    if (!options.force && connector.last_success_at && Date.now() - new Date(connector.last_success_at).getTime() < 5 * 60 * 1000) {
      const latestReport = entityRows("shipping_reports").filter((report) => report.source === "oms_fee_report").sort((a, b) => String(b.report_date || "").localeCompare(String(a.report_date || "")))[0] || null;
      syncRun = updateRecord("shipping_sync_runs", syncRun.id, { status: "skipped", reason: "recently_synced", completed_at: new Date().toISOString() });
      return { skipped: true, reason: "recently_synced", run: syncRun, latest_report: latestReport, connector: publicShippingIntegrations().oms_connector };
    }
    try {
      const beforeRows = entityRows("shipping_shipments");
      const beforeByWaybill = new Map(beforeRows.map((row) => [String(row.waybill_no || ""), crypto.createHash("sha256").update(JSON.stringify({ carrier_actual_cost: row.carrier_actual_cost, carrier_collected_amount: row.carrier_collected_amount, carrier_billable_weight: row.carrier_billable_weight, carrier_bill_numbers: row.carrier_bill_numbers, carrier_fee_breakdown: row.carrier_fee_breakdown, oms_fee_update_date: row.oms_fee_update_date })).digest("hex")]));
      const rows = await fetchImileOmsFees(dateFrom, dateTo);
      const existingCarrierBills = entityRows("shipping_carrier_bills").filter((bill) => bill.provider === "imile");
      const billDateFrom = String(options.bill_date_from || (existingCarrierBills.length ? shiftIsoDate(dateTo, -45) : shiftIsoDate(dateTo, -730)));
      const billRows = await fetchImileOmsBills(billDateFrom, dateTo);
      const groups = rows.reduce((map, row) => {
        const reportDate = String(row.feeUpdateDate || row.feeCreateDate || dateTo);
        map.set(reportDate, [...(map.get(reportDate) || []), row]);
        return map;
      }, new Map());
      const persisted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([reportDate, reportRows]) => upsertImileOmsReport(reportDate, reportRows, { fetched_at: fetchedAt, range_start: dateFrom, range_end: dateTo }));
      const billSync = upsertImileOmsBills(billRows, fetchedAt);
      const legacyEvidence = syncLegacyShipmentSalesEvidence(fetchedAt);
      const latest = persisted.at(-1)?.report || entityRows("shipping_reports")[0] || null;
      const fetchedWaybills = [...new Set(rows.map((row) => String(row.waybillNo || "")).filter(Boolean))];
      const afterByWaybill = new Map(entityRows("shipping_shipments").map((row) => [String(row.waybill_no || ""), crypto.createHash("sha256").update(JSON.stringify({ carrier_actual_cost: row.carrier_actual_cost, carrier_collected_amount: row.carrier_collected_amount, carrier_billable_weight: row.carrier_billable_weight, carrier_bill_numbers: row.carrier_bill_numbers, carrier_fee_breakdown: row.carrier_fee_breakdown, oms_fee_update_date: row.oms_fee_update_date })).digest("hex")]));
      const newShipments = fetchedWaybills.filter((waybill) => !beforeByWaybill.has(waybill)).length;
      const updatedShipments = fetchedWaybills.filter((waybill) => beforeByWaybill.has(waybill) && beforeByWaybill.get(waybill) !== afterByWaybill.get(waybill)).length;
      const unchangedShipments = Math.max(0, fetchedWaybills.length - newShipments - updatedShipments);
      const cursorAfter = { fee_updated_through: dateTo, overlap_days: Number(connector.sync_overlap_days || 2), updated_at: fetchedAt };
      const updated = normalizeShippingIntegrations({
        ...settings,
        oms_connector: {
          ...settings.oms_connector,
          last_sync_at: fetchedAt,
          last_success_at: fetchedAt,
          last_error: "",
          last_report_date: latest?.report_date || settings.oms_connector.last_report_date,
          last_report_summary: latest ? {
            shipment_count: latest.shipment_count,
            matched_count: latest.matched_count,
            unmatched_count: latest.unmatched_count,
            missing_cost_count: latest.missing_cost_count,
            actual_cost_total: latest.actual_cost_total,
            collected_total: latest.collected_total,
            currency: latest.currency
          } : settings.oms_connector.last_report_summary,
          last_range: { start: dateFrom, end: dateTo },
          incremental_cursor: cursorAfter
        },
        updated_at: fetchedAt
      });
      setSetting("shippingIntegrations", updated);
      syncRun = updateRecord("shipping_sync_runs", syncRun.id, { status: "completed", fetched_rows: rows.length, unique_shipments: fetchedWaybills.length, new_shipments: newShipments, updated_shipments: updatedShipments, unchanged_shipments: unchangedShipments, reports_updated: persisted.length, bills_fetched: billRows.length, bills_inserted: billSync.inserted, bills_updated: billSync.updated, reconciliations_updated: billSync.reconciliations, cursor_after: cursorAfter, completed_at: new Date().toISOString() });
      queueShippingAudit("oms_sync");
      return { synced: true, fetched_rows: rows.length, reports_updated: persisted.length, new_shipments: newShipments, updated_shipments: updatedShipments, unchanged_shipments: unchangedShipments, bills: billSync, legacy_evidence: legacyEvidence, run: syncRun, latest_report: latest, connector: publicShippingIntegrations().oms_connector };
    } catch (error) {
      const updated = normalizeShippingIntegrations({
        ...settings,
        oms_connector: { ...settings.oms_connector, last_sync_at: fetchedAt, last_error: String(error.message || "IMILE_OMS_SYNC_FAILED") },
        updated_at: fetchedAt
      });
      setSetting("shippingIntegrations", updated);
      syncRun = updateRecord("shipping_sync_runs", syncRun.id, { status: "failed", error: String(error.message || "IMILE_OMS_SYNC_FAILED"), completed_at: new Date().toISOString() });
      throw error;
    }
  })();
  try {
    return await imileOmsSyncPromise;
  } finally {
    imileOmsSyncPromise = null;
  }
}

function imileBaseUrl(settings) {
  return settings.imile.environment === "sandbox" ? "https://test-openapi.52imile.cn" : "https://openapi.imile.com";
}

function imileSignedPayload(settings, param = {}, accessToken = "") {
  const timestamp = Date.now();
  const body = {
    customerId: settings.imile.customer_id,
    signMethod: settings.imile.sign_method,
    format: "json",
    version: settings.imile.version,
    timeZone: settings.imile.time_zone,
    timestamp,
    ...(accessToken ? { accessToken } : {}),
    param
  };
  const secret = decryptIntegrationSecret(settings.imile.secret_key_encrypted);
  if (!secret) fail("IMILE_SECRET_REQUIRED");
  const source = Object.keys(body).filter((key) => key !== "param").sort().map((key) => `${key}${body[key]}`).join("");
  const plain = `${secret}${source}body${JSON.stringify(param)}${secret}`;
  body.sign = crypto.createHash(settings.imile.sign_method === "MD5" ? "md5" : "sha256").update(plain).digest("hex").toUpperCase();
  return body;
}

async function imileRequest(pathname, param = {}, requiresToken = true) {
  const settings = normalizeShippingIntegrations();
  if (!settings.imile.is_enabled || !settings.imile.customer_id) fail("IMILE_NOT_CONFIGURED");
  let accessToken = "";
  if (requiresToken) accessToken = await imileAccessToken(settings);
  const response = await fetch(`${imileBaseUrl(settings)}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(imileSignedPayload(settings, param, accessToken)),
    signal: AbortSignal.timeout(20000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || ![0, 200, "0", "200", undefined].includes(result.code) || result.success === false) {
    fail(`IMILE_API_ERROR: ${result.message || result.msg || response.status}`, 502);
  }
  return result.data ?? result.result ?? result;
}

async function imileAccessToken(settings = normalizeShippingIntegrations()) {
  const cacheKey = `${settings.imile.environment}:${settings.imile.customer_id}`;
  const cached = imileTokenCache.get(cacheKey);
  if (cached && cached.expires_at > Date.now() + 60000) return cached.token;
  const response = await fetch(`${imileBaseUrl(settings)}/auth/accessToken/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(imileSignedPayload(settings, {}, "")),
    signal: AbortSignal.timeout(20000)
  });
  const result = await response.json().catch(() => ({}));
  const data = result.data ?? result.result ?? result;
  const token = data.accessToken || data.access_token || data.token;
  if (!response.ok || !token) fail(`IMILE_AUTH_FAILED: ${result.message || result.msg || response.status}`, 502);
  const expiresIn = Math.max(300, Number(data.expiresIn || data.expireIn || 7200));
  imileTokenCache.set(cacheKey, { token, expires_at: Date.now() + expiresIn * 1000 });
  return token;
}

function otoBaseUrl(settings = normalizeShippingIntegrations()) {
  return settings.oto.environment === "sandbox" ? settings.oto.sandbox_base_url : settings.oto.live_base_url;
}

async function otoAccessToken(settings = normalizeShippingIntegrations()) {
  const refreshToken = decryptIntegrationSecret(settings.oto.refresh_token_encrypted);
  if (!settings.oto.is_enabled || !refreshToken) fail("OTO_NOT_CONFIGURED", 409);
  const cacheKey = `${settings.oto.environment}:${crypto.createHash("sha256").update(refreshToken).digest("hex").slice(0, 12)}`;
  const cached = otoTokenCache.get(cacheKey);
  if (cached?.expires_at > Date.now() + 60000) return cached.token;
  const response = await fetch(`${otoBaseUrl(settings)}/rest/v2/refreshToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    signal: AbortSignal.timeout(settings.oto.timeout_ms)
  });
  const result = await response.json().catch(() => ({}));
  const token = result.access_token || result.accessToken || result.data?.access_token || result.data?.accessToken;
  if (!response.ok || !token) fail(`OTO_AUTH_FAILED: ${result.message || result.error || response.status}`, 502);
  otoTokenCache.set(cacheKey, { token, expires_at: Date.now() + Math.max(300, Number(result.expires_in || result.expiresIn || 3600)) * 1000 });
  return token;
}

async function otoRequest(pathname, { method = "POST", body, query } = {}) {
  const settings = normalizeShippingIntegrations();
  const token = await otoAccessToken(settings);
  const url = new URL(`${otoBaseUrl(settings)}${pathname}`);
  Object.entries(query || {}).forEach(([key, value]) => value !== "" && value !== null && value !== undefined && url.searchParams.set(key, value));
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(settings.oto.timeout_ms)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) fail(`OTO_API_ERROR: ${result.message || result.error || response.status}`, 502);
  return result.data ?? result;
}

function otoDeliveryOptions(result) {
  const candidates = [result?.deliveryCompany, result, result?.deliveryOptions, result?.options, result?.rates, result?.data, result?.data?.deliveryCompany, result?.data?.deliveryOptions, result?.result];
  return candidates.find(Array.isArray) || [];
}

function shippingQuoteFingerprint({ items = [], customer = {}, paymentMethod = "cod" }) {
  const value = {
    items: items.map((item) => [String(item.key || item.product_id), Number(item.quantity || 1), Number(item.subtotal || 0)]).sort((a, b) => a[0].localeCompare(b[0])),
    country: String(customer.country_code || "SA").toUpperCase(),
    city: String(customer.city || "").trim().toLowerCase(),
    method: normalizePaymentMethod(paymentMethod)
  };
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("base64url");
}

function signShippingQuote(quote, context) {
  return jwt.sign({ ...quote, fp: shippingQuoteFingerprint(context) }, jwtSecret, { audience: "siteyfy-shipping-quote", expiresIn: "15m" });
}

function verifyShippingQuoteToken(token, context) {
  if (!token) return null;
  let decoded;
  try { decoded = jwt.verify(String(token), jwtSecret, { audience: "siteyfy-shipping-quote" }); }
  catch { fail("SHIPPING_QUOTE_EXPIRED", 409); }
  if (decoded.fp !== shippingQuoteFingerprint(context)) fail("SHIPPING_QUOTE_CHANGED", 409);
  return decoded;
}

function shippingPackageTotals(items = []) {
  const components = items.flatMap((item) => item.shipping?.components?.length ? item.shipping.components : [{ ...item.shipping, quantity: item.quantity }]);
  return components.reduce((totals, item) => {
    if (item.requires_shipping === false) return totals;
    const quantity = Math.max(1, Number(item.quantity || 1));
    totals.weight += Number(item.weight || 0) * quantity;
    totals.volume += Number(item.length || 0) * Number(item.width || 0) * Number(item.height || 0) * quantity;
    return totals;
  }, { weight: 0, volume: 0 });
}

function normalizePaymentMethod(value = "cod_cash") {
  const method = String(value || "").toLowerCase();
  if (["prepaid", "card", "online", "ppd", "tamara", "edfapay", "tabby"].includes(method)) return "prepaid";
  if (["cod_pos", "pos", "card_on_delivery", "visa_on_delivery"].includes(method)) return "cod_pos";
  return "cod_cash";
}

function shippingEstimateProfile(settings, countryCode, currency) {
  const profiles = settings.customer_pricing?.estimate_profiles || [];
  const country = String(countryCode || "SA").toUpperCase();
  const code = String(currency || normalizeCurrencies().base_currency || "SAR").toUpperCase();
  return profiles.find((profile) => profile.is_active && profile.country_code === country && profile.currency === code)
    || profiles.find((profile) => profile.is_active && profile.country_code === country)
    || profiles.find((profile) => profile.is_active)
    || null;
}

function configuredCarrierEstimate({ settings, countryCode, currency, paymentMethod, subtotal }) {
  const profile = shippingEstimateProfile(settings, countryCode, currency);
  if (!profile) return { amount: null, profile: null, breakdown: [] };
  const method = normalizePaymentMethod(paymentMethod);
  const base = Number(profile.base_delivery_fee || 0);
  const cod = method === "prepaid" ? 0 : Number(profile.cod_fixed_fee || 0);
  const orderSubtotal = Math.max(0, Number(subtotal || 0));
  const posRate = Number(profile.pos_percent || 0) / 100;
  const taxFactor = profile.tax_mode === "add" ? 1 + Number(profile.vat_percent || 0) / 100 : 1;
  let posBase = orderSubtotal;
  if (method === "cod_pos" && profile.pos_basis === "collectable_amount" && taxFactor * posRate < 1) {
    const estimatedFee = taxFactor * (base + cod + posRate * orderSubtotal) / (1 - taxFactor * posRate);
    posBase += estimatedFee;
  }
  const pos = method === "cod_pos" ? Number((posBase * posRate).toFixed(3)) : 0;
  const beforeTax = base + cod + pos;
  const vat = profile.tax_mode === "add" ? Number((beforeTax * Number(profile.vat_percent || 0) / 100).toFixed(3)) : 0;
  let amount = beforeTax + vat;
  amount = Math.max(Number(profile.minimum_estimate || 0), amount);
  if (profile.maximum_estimate !== null && profile.maximum_estimate !== undefined) amount = Math.min(Number(profile.maximum_estimate), amount);
  const breakdown = [
    { type: "delivery", amount: base, currency: profile.currency },
    ...(cod ? [{ type: "cod", amount: cod, currency: profile.currency }] : []),
    ...(pos ? [{ type: "pos", amount: pos, rate: Number(profile.pos_percent || 0), basis: profile.pos_basis, currency: profile.currency }] : []),
    ...(vat ? [{ type: "vat", amount: vat, rate: Number(profile.vat_percent || 0), currency: profile.currency }] : [])
  ];
  return { amount: Number(amount.toFixed(2)), profile, breakdown, payment_method: method };
}

function refreshConfiguredShippingEstimates({ overwriteConfigured = true } = {}) {
  const settings = normalizeShippingIntegrations();
  let updated = 0;
  entityRows("shipping_shipments").forEach((row) => {
    if (row.cost_source === "imile_estimate") return;
    if (!overwriteConfigured && row.carrier_estimated_cost !== null && row.carrier_estimated_cost !== undefined) return;
    const countryCode = String(row.destination_country || "SA").toUpperCase() === "KSA" ? "SA" : String(row.destination_country || "SA").toUpperCase();
    const paymentMethod = String(row.payment_method || "") === "100" ? "prepaid" : feeMatches(row, "POS") ? "cod_pos" : normalizePaymentMethod(row.payment_method);
    const amountBasis = Number(row.cod_amount || row.carrier_collected_amount || row.order_total || row.metadata?.declared_value || 0);
    const estimate = configuredCarrierEstimate({ settings, countryCode, currency: row.currency || "SAR", paymentMethod, subtotal: amountBasis });
    if (estimate.amount === null) return;
    updateRecord("shipping_shipments", row.id, {
      carrier_estimated_cost: estimate.amount,
      estimate_source: "configured_profile",
      estimate_profile_id: estimate.profile?.id || null,
      estimate_payment_method: estimate.payment_method,
      estimated_fee_details: estimate.breakdown,
      estimate_updated_at: new Date().toISOString()
    });
    updated += 1;
  });
  return updated;
}

async function customerShippingQuote({ items = [], subtotal = 0, customer = {}, paymentMethod = "cod" }) {
  const internal = shippingQuote(items, subtotal);
  const integration = normalizeShippingIntegrations();
  const pricing = integration.customer_pricing;
  const currency = normalizeCurrencies().base_currency;
  const configuredEstimate = configuredCarrierEstimate({ settings: integration, countryCode: customer.country_code, currency, paymentMethod, subtotal });
  const shipping = shippingSettings();
  const rule = shipping.is_active ? matchingFreeShippingRule(items, subtotal, shipping) : null;
  const fixedBase = Number(pricing.fixed_amount || 0);
  const fixedCustomerAmount = shipping.is_active ? applyShippingRuleAction(rule, fixedBase) : fixedBase;
  const base = { customer_amount: internal.amount, base_customer_amount: internal.amount, carrier_estimated_cost: configuredEstimate.amount, currency: configuredEstimate.profile?.currency || currency, strategy: pricing.strategy, source: "internal_rules", estimate_source: configuredEstimate.amount === null ? null : "configured_profile", estimate_profile_id: configuredEstimate.profile?.id || null, estimated_fee_details: configuredEstimate.breakdown, payment_method: configuredEstimate.payment_method || normalizePaymentMethod(paymentMethod), fallback_used: false, fee_details: [], rule: internal.rule, quoted_at: new Date().toISOString() };
  if (pricing.strategy === "free") return { ...base, customer_amount: 0, source: "configured" };
  if (pricing.strategy === "fixed") return { ...base, customer_amount: Number(fixedCustomerAmount.toFixed(2)), base_customer_amount: fixedBase, carrier_estimated_cost: fixedBase, estimate_source: "flat_rate", source: "flat_rate", rule };
  if (!shipping.is_active || internal.amount === 0 && internal.rule) return { ...base, customer_amount: internal.amount };
  if (pricing.strategy === "internal_rules" || !integration.imile.is_enabled) return base;
  try {
    const totals = shippingPackageTotals(items);
    const sender = integration.imile.sender;
    const result = await imileRequest("/client/order/calShippingFee", {
      senderInfo: { country: sender.country || "KSA", province: sender.province, city: sender.city, area: sender.area, zipCode: sender.zip_code },
      consigneeInfo: { country: customer.country_code === "SA" ? "KSA" : customer.country_code, province: customer.province, city: customer.city, area: customer.district, zipCode: customer.postal_code },
      orderType: integration.imile.order_type,
      paymentMethod: normalizePaymentMethod(paymentMethod) === "prepaid" ? integration.imile.payment_method : "Cash",
      goodsType: integration.imile.default_goods_type,
      totalWeight: Number(totals.weight.toFixed(3)),
      totalVolume: Number(totals.volume.toFixed(3)),
      clientDeclaredValue: Number(subtotal.toFixed(2)),
      clientDeclaredCurrency: "Local",
      collectingMoney: normalizePaymentMethod(paymentMethod) === "prepaid" ? 0 : Number(subtotal.toFixed(2))
    });
    const estimated = Number(result.totalAmount ?? result.totalFee ?? result.amount ?? 0);
    let amount = estimated;
    if (pricing.strategy === "estimate_plus_fixed") amount += pricing.markup_fixed;
    if (pricing.strategy === "estimate_plus_percent") amount *= 1 + pricing.markup_percent / 100;
    if (pricing.strategy === "subsidized_fixed") amount = Math.max(0, estimated - pricing.subsidy_fixed);
    amount = Math.max(pricing.minimum_charge, amount);
    if (pricing.maximum_charge !== null) amount = Math.min(pricing.maximum_charge, amount);
    return { ...base, customer_amount: Number(amount.toFixed(2)), carrier_estimated_cost: Number(estimated.toFixed(2)), currency: result.currency || currency, source: "imile_estimate", estimate_source: "imile_api", fee_details: result.feeDetails || [] };
  } catch (error) {
    return { ...base, customer_amount: pricing.fallback_amount || internal.amount, source: "fallback", fallback_used: true, error_code: String(error.message || "IMILE_QUOTE_FAILED").split(":")[0] };
  }
}

function normalizeOtoQuoteOption(option, integration, currency, index) {
  const carrier = option.deliveryCompany || option.deliveryCompanyName || option.carrierName || option.companyName || option.name || "OTO";
  const carrierCode = String(option.deliveryCompanyCode || option.carrierCode || option.companyCode || carrier).toLowerCase().replace(/[^a-z0-9]/g, "");
  const deliveryOptionId = option.deliveryOptionId ?? option.deliveryCompanySettingsId ?? option.id;
  const rawAmount = Number(option.price ?? option.deliveryFee ?? option.fee ?? option.amount ?? option.total ?? 0);
  const customerAmount = Math.max(0, rawAmount * (1 + integration.oto.markup_percent / 100) + integration.oto.markup_fixed);
  return {
    id: `oto:${deliveryOptionId || carrierCode || index}`,
    provider: "oto",
    carrier_code: carrierCode || "oto",
    carrier_name_en: String(carrier),
    carrier_name_ar: String(option.deliveryCompanyNameAr || option.carrierNameAr || carrier),
    delivery_option_id: deliveryOptionId === undefined ? null : String(deliveryOptionId),
    customer_amount: Number(customerAmount.toFixed(2)),
    carrier_estimated_cost: Number(rawAmount.toFixed(2)),
    currency: option.currency || currency,
    eta_min_days: Number(option.minDeliveryDays ?? option.estimatedMinDays ?? option.minDays ?? 0) || null,
    eta_max_days: Number(option.maxDeliveryDays ?? option.estimatedMaxDays ?? option.maxDays ?? 0) || null,
    eta_label: String(option.avgDeliveryTime || option.deliveryTime || ""),
    logo_url: String(option.logo || ""),
    service_type: String(option.serviceType || ""),
    delivery_type: String(option.deliveryType || ""),
    source: "oto_api",
    fallback_used: false,
    fee_details: option,
    quoted_at: new Date().toISOString()
  };
}

async function otoShippingQuotes({ items, subtotal, customer, paymentMethod, integration, currency }) {
  if (!integration.oto.is_enabled || !integration.oto.show_at_checkout || !customer.city) return [];
  const totals = shippingPackageTotals(items);
  const profile = normalizeMarketSettings();
  const sender = integration.imile.sender || {};
  const dimensions = items.reduce((max, item) => ({
    length: Math.max(max.length, Number(item.shipping?.length || 0)),
    width: Math.max(max.width, Number(item.shipping?.width || 0)),
    height: Math.max(max.height, Number(item.shipping?.height || 0))
  }), { length: 0, width: 0, height: 0 });
  const request = {
    originCity: sender.city || "Riyadh",
    destinationCity: customer.city,
    originCountry: sender.country === "KSA" ? "SA" : sender.country || profile.default_country_code || "SA",
    destinationCountry: customer.country_code || "SA",
    weight: Math.max(0.1, Number(totals.weight.toFixed(3))),
    packageCount: Math.max(1, items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)),
    totalDue: normalizePaymentMethod(paymentMethod) === "prepaid" ? 0 : Number(subtotal.toFixed(2)),
    currency,
    ...dimensions
  };
  const paths = integration.oto.quote_mode === "both"
    ? ["/rest/v2/checkOTODeliveryFee", "/rest/v2/checkDeliveryFee"]
    : [integration.oto.quote_mode === "own_contracts" ? "/rest/v2/checkDeliveryFee" : "/rest/v2/checkOTODeliveryFee"];
  const settled = await Promise.allSettled(paths.map((pathname) => otoRequest(pathname, { body: request })));
  const options = settled.flatMap((entry) => entry.status === "fulfilled" ? otoDeliveryOptions(entry.value) : []);
  const customerDoorOptions = options.filter((option) => !option.deliveryType || option.deliveryType === "toCustomerDoorstep")
    .filter((option) => !option.serviceType || ["express", "sameDay", "fastDelivery"].includes(option.serviceType));
  return customerDoorOptions.map((option, index) => normalizeOtoQuoteOption(option, integration, currency, index))
    .sort((a, b) => a.customer_amount - b.customer_amount)
    .slice(0, integration.oto.max_checkout_options);
}

async function customerShippingQuotes(context) {
  const { items = [], subtotal = 0, customer = {}, paymentMethod = "cod" } = context;
  const integration = normalizeShippingIntegrations();
  const currency = normalizeCurrencies().base_currency;
  const quotes = [];
  if (integration.imile.is_enabled && integration.imile.show_at_checkout) {
    const quote = await customerShippingQuote(context);
    quotes.push({ ...quote, id: "imile:direct", provider: "imile", carrier_code: "imile", carrier_name_en: integration.imile.checkout_label_en, carrier_name_ar: integration.imile.checkout_label_ar });
  }
  if (integration.oto.is_enabled && integration.oto.show_at_checkout && integration.customer_pricing.strategy === "fixed") {
    const flatQuote = await customerShippingQuote(context);
    quotes.push({ ...flatQuote, id: "oto:flat-rate", provider: "oto", carrier_code: "oto", carrier_name_en: integration.oto.checkout_label_en, carrier_name_ar: integration.oto.checkout_label_ar });
  } else try { quotes.push(...await otoShippingQuotes({ ...context, integration, currency })); } catch (error) {
    if (!quotes.length && integration.oto.fallback_amount > 0) quotes.push({ id: "oto:fallback", provider: "oto", carrier_code: "oto", carrier_name_en: integration.oto.checkout_label_en, carrier_name_ar: integration.oto.checkout_label_ar, customer_amount: integration.oto.fallback_amount, carrier_estimated_cost: null, currency, source: "fallback", fallback_used: true, error_code: String(error.message || "OTO_QUOTE_FAILED").split(":")[0] });
  }
  const filtered = quotes.filter((quote, index, all) => {
    if (quote.provider === "oto" && integration.oto.exclude_imile_when_direct && integration.imile.is_enabled && quote.carrier_code.includes("imile")) return false;
    return all.findIndex((candidate) => `${candidate.carrier_code}:${candidate.customer_amount}` === `${quote.carrier_code}:${quote.customer_amount}`) === index;
  });
  if (!filtered.length) {
    const quote = await customerShippingQuote(context);
    filtered.push({ ...quote, id: "internal:rules", provider: "internal", carrier_code: "internal", carrier_name_en: "Store delivery", carrier_name_ar: "توصيل المتجر" });
  }
  const providerOrder = { imile: integration.imile.sort_order, oto: integration.oto.sort_order, internal: 99 };
  filtered.sort((a, b) => Number(providerOrder[a.provider] || 99) - Number(providerOrder[b.provider] || 99) || Number(a.customer_amount || 0) - Number(b.customer_amount || 0));
  let selected = filtered.find((quote) => quote.provider === integration.default_provider) || filtered[0];
  const signed = filtered.map((quote) => ({ ...quote, is_default: quote.id === selected.id, quote_token: signShippingQuote(quote, context) }));
  selected = signed.find((quote) => quote.id === selected.id) || signed[0];
  return { quote: selected, quotes: signed, selected_quote_id: selected.id };
}

async function createImileShipment(order, shipment) {
  const settings = normalizeShippingIntegrations();
  const sender = settings.imile.sender;
  if (!settings.imile.logistics_product_code) fail("IMILE_LOGISTICS_PRODUCT_CODE_REQUIRED");
  const packageTotals = shippingPackageTotals(order.items || []);
  const skuInfos = (order.items || []).flatMap((item) => {
    if (item.components?.length) return item.components.map((component) => ({
      skuName: String(component.name_en || component.name_ar || `Product ${component.product_id}`).slice(0, 100),
      skuQty: Math.max(1, Number(component.quantity || 1)),
      skuDeclaredValue: Number((Number(item.unit_price || 0) / Math.max(1, item.components.length)).toFixed(2)),
      skuWeight: Number((Number(item.shipping?.weight || 0) / Math.max(1, item.components.length)).toFixed(3)),
      skuHsCode: String(item.shipping?.hs_code || "").slice(0, 32)
    }));
    return [{
      skuName: String(item.name_en || item.name_ar || item.sku || `Product ${item.product_id}`).slice(0, 100),
      skuQty: Math.max(1, Number(item.quantity || 1)),
      skuDeclaredValue: Number(item.unit_price || 0),
      skuWeight: Number(item.shipping?.weight || 0),
      skuHsCode: String(item.shipping?.hs_code || "").slice(0, 32)
    }];
  });
  const customer = order.shipping_address || order.customer || {};
  const normalizedPayment = normalizePaymentMethod(order.payment?.method);
  const paymentMethod = normalizedPayment === "prepaid" ? "PPD" : "Cash";
  const data = await imileRequest("/client/order/v2/createOrder", {
    orderNo: shipment.client_order_no || `SITEYFY-${order.id}`,
    orderType: settings.imile.order_type,
    serviceInfo: { logisticsProductCode: settings.imile.logistics_product_code, pickupService: 0, deliveryService: "Delivery", isCutoff: false, isSupportUnpack: "0" },
    packageInfo: {
      paymentMethod,
      collectingMoney: paymentMethod === "Cash" ? Number(order.total || 0) : 0,
      codCurrency: order.currency_snapshot?.code || "SAR",
      clientDeclaredValue: Number(order.subtotal || order.total || 0),
      clientDeclaredCurrency: "Local",
      productValue: Number(order.subtotal || 0),
      productValueCurrency: "Local",
      goodsType: settings.imile.default_goods_type,
      totalVolume: Number(packageTotals.volume.toFixed(3)),
      grossWeight: Number(packageTotals.weight.toFixed(3)),
      totalCount: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0)
    },
    skuInfos,
    senderInfo: { contacts: sender.contacts, phone: sender.phone, addressType: "warehouse", country: sender.country || "KSA", province: sender.province, city: sender.city, area: sender.area, zipCode: sender.zip_code, address: sender.address },
    consigneeInfo: {
      contacts: customer.full_name,
      phone: customer.phone,
      addressType: "customer",
      country: customer.country_code === "SA" ? "KSA" : customer.country_code,
      province: customer.province,
      city: customer.city,
      area: customer.district,
      zipCode: customer.postal_code,
      address: [customer.street, customer.building_number && `Building ${customer.building_number}`, customer.additional_number && `Additional ${customer.additional_number}`, customer.short_address && `Short address ${customer.short_address}`, customer.address_notes].filter(Boolean).join(", "),
      ...(Number.isFinite(Number(customer.latitude)) ? { latitude: Number(customer.latitude) } : {}),
      ...(Number.isFinite(Number(customer.longitude)) ? { longitude: Number(customer.longitude) } : {})
    }
  });
  return upsertShippingShipment({ ...shipment, waybill_no: data.expressNo || data.waybillNo || data.billNo, external_order_no: data.orderNo || shipment.external_order_no, status_code: "UPLOADED", sync_state: "created", created_with_api_at: new Date().toISOString() });
}

function otoOrderPayload(order, settings = normalizeShippingIntegrations()) {
  const customer = order.shipping_address || order.customer || {};
  const packageTotals = shippingPackageTotals(order.items || []);
  const orderId = `${settings.oto.order_prefix || "SFY-"}${order.id}`;
  const prepaid = normalizePaymentMethod(order.payment?.method) === "prepaid";
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.full_name || customer.name || "Customer";
  const address = [customer.building_number, customer.street, customer.additional_number, customer.district, customer.postal_code, customer.city, customer.province, customer.country_code].filter(Boolean).join(", ");
  return {
    orderId,
    ref1: String(order.id),
    pickupLocationCode: settings.oto.pickup_location_code || undefined,
    createShipment: false,
    deliveryOptionId: order.shipping_selection?.delivery_option_id || undefined,
    storeName: "SITEYFY",
    payment_method: prepaid ? "paid" : "cod",
    amount: Number(order.total || 0),
    amount_due: prepaid ? 0 : Number(order.total || 0),
    shippingAmount: Number(order.shipping_amount || 0),
    subtotal: Number(order.subtotal || 0),
    currency: order.currency_snapshot?.code || "SAR",
    shippingNotes: String(customer.address_notes || "").slice(0, 500),
    packageCount: Math.max(1, Number(order.shipping_package?.total_count || 1)),
    packageWeight: Math.max(0.1, Number(packageTotals.weight.toFixed(3))),
    orderDate: new Date(order.created_at || Date.now()).toISOString(),
    senderName: "SITEYFY",
    customer: {
      name: fullName,
      email: customer.email || undefined,
      mobile: customer.phone,
      address,
      buildingNo: customer.building_number || undefined,
      street: customer.street || undefined,
      secondaryAddressNumber: customer.additional_number || undefined,
      shortAddressCode: customer.short_address || undefined,
      district: customer.district || "",
      city: customer.city,
      state: customer.province || undefined,
      country: customer.country_code || "SA",
      postcode: customer.postal_code || "",
      lat: customer.latitude || undefined,
      lon: customer.longitude || undefined,
      refID: String(order.customer_identity?.user_id || order.id)
    },
    items: (order.items || []).map((item) => ({
      productId: String(item.product_id || item.sku || ""),
      name: item.name_en || item.name_ar || item.sku || "Product",
      price: Number(item.unit_price || 0),
      rowTotal: Number(item.subtotal || 0),
      quantity: Math.max(1, Number(item.quantity || 1)),
      sku: String(item.sku || item.product_id || ""),
      image: item.image_url || item.main_photo_url || undefined,
      hsCode: item.shipping?.hs_code || undefined
    }))
  };
}

async function createOtoShipment(order, shipment) {
  const settings = normalizeShippingIntegrations();
  if (!settings.oto.is_enabled) fail("OTO_PROVIDER_NOT_ACTIVE", 409);
  const payload = otoOrderPayload(order, settings);
  const orderId = payload.orderId;
  const created = await otoRequest("/rest/v2/createOrder", { body: payload });
  if (settings.oto.auto_create_shipments && order.shipping_selection?.delivery_option_id) {
    await otoRequest("/rest/v2/createShipment", { body: { orderId, deliveryOptionId: order.shipping_selection.delivery_option_id } });
  }
  return upsertShippingShipment({
    ...shipment,
    provider: "oto",
    external_order_no: orderId,
    oto_id: created.otoId || created.id || null,
    delivery_option_id: order.shipping_selection?.delivery_option_id || null,
    carrier_code: order.shipping_selection?.carrier_code || "oto",
    status_code: settings.oto.auto_create_shipments ? "shipmentProcessing" : "orderCreated",
    sync_state: settings.oto.auto_create_shipments ? "created" : "order_created",
    created_with_api_at: new Date().toISOString()
  });
}

async function updateOtoOrder(order, shipment) {
  const settings = normalizeShippingIntegrations();
  if (!settings.oto.is_enabled) fail("OTO_PROVIDER_NOT_ACTIVE", 409);
  if (!shipment?.external_order_no && !shipment?.oto_id) fail("OTO_ORDER_NOT_CREATED", 409);
  if (shipment.waybill_no) fail("OTO_UPDATE_REQUIRES_SHIPMENT_CANCELLATION", 409);
  const payload = otoOrderPayload(order, settings);
  await otoRequest("/rest/v2/updateOrder", { body: payload });
  return upsertShippingShipment({
    ...shipment,
    provider: "oto",
    external_order_no: payload.orderId,
    integration_error: null,
    last_attempted_at: new Date().toISOString(),
    last_order_update_at: new Date().toISOString(),
    sync_state: "order_created"
  });
}

function imileStatusGroup(value) {
  const raw = String(value || "").trim().toUpperCase();
  const exact = { DELIVERED: "delivered", DELIVERY: "out_for_delivery", TO_DO_DELIVERED: "pending", TRANSIT: "in_transit", STAGING: "in_transit", UPLOADED: "pending", CLOSED: "exception", CANCELLED: "cancelled" };
  if (exact[raw]) return exact[raw];
  const status = raw.toLowerCase();
  if (status.includes("deliver") && !status.includes("undeliver")) return "delivered";
  if (status.includes("ofd") || status.includes("out for delivery")) return "out_for_delivery";
  if (status.includes("return") || status.includes("rto")) return "return";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("fail") || status.includes("exception") || status.includes("ndr") || status.includes("undeliver")) return "exception";
  if (status.includes("shipping") || status.includes("transit") || status.includes("arrive") || status.includes("receive")) return "in_transit";
  if (status.includes("pickup") || status.includes("picked")) return "picked_up";
  return "pending";
}

function otoWebhookSignatureValid(payload, secret) {
  if (!secret || !payload?.signature) return false;
  const eventCode = payload.errorCode || payload.status || "";
  const expected = crypto.createHmac("sha256", secret).update(`${payload.orderId}:${eventCode}:${payload.timestamp}`).digest("base64");
  const received = String(payload.signature || "");
  return expected.length === received.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function upsertShippingShipment(payload = {}) {
  const rows = entityRows("shipping_shipments");
  const existing = rows.find((row) => payload.waybill_no && row.waybill_no === payload.waybill_no)
    || rows.find((row) => payload.store_order_id && Number(row.store_order_id) === Number(payload.store_order_id));
  const statusCode = payload.status_code || payload.latest_status || existing?.status_code || "pending";
  const normalized = {
    provider: "imile",
    source: "store",
    currency: normalizeCurrencies().base_currency,
    customer_shipping_charge: 0,
    carrier_estimated_cost: null,
    carrier_actual_cost: null,
    cost_source: null,
    tracking_events: [],
    sync_state: "pending",
    ...existing,
    ...payload,
    status_code: statusCode,
    status_group: payload.status_group || imileStatusGroup(statusCode),
    last_synced_at: payload.last_synced_at || existing?.last_synced_at || null
  };
  delete normalized.id;
  delete normalized.created_at;
  delete normalized.updated_at;
  return existing ? updateRecord("shipping_shipments", existing.id, normalized) : createRecord("shipping_shipments", normalized);
}

async function syncImileTracking(options = {}) {
  if (imileTrackingSyncPromise) return imileTrackingSyncPromise;
  imileTrackingSyncPromise = (async () => {
    const startedAt = new Date().toISOString();
    const requested = Array.isArray(options.shipment_ids) ? options.shipment_ids.map(Number) : [];
    const terminal = new Set(["delivered", "cancelled", "return"]);
    const rows = entityRows("shipping_shipments").filter((row) => row.waybill_no
      && (!requested.length || requested.includes(Number(row.id)))
      && (options.force_all || requested.length || !terminal.has(row.status_group)));
    let run = createRecord("shipping_sync_runs", {
      provider: "imile",
      source: "tracking",
      trigger: String(options.trigger || "automatic"),
      mode: "tracking",
      status: "running",
      started_at: startedAt,
      fetched_rows: rows.length,
      new_shipments: 0,
      updated_shipments: 0,
      unchanged_shipments: 0
    });
    if (!rows.length) {
      run = updateRecord("shipping_sync_runs", run.id, { status: "completed", completed_at: new Date().toISOString() });
      return { synced: 0, updated: 0, unchanged: 0, failed: 0, run };
    }
    try {
      let synced = 0;
      let updated = 0;
      for (let offset = 0; offset < rows.length; offset += 100) {
        const batch = rows.slice(offset, offset + 100);
        const data = await imileRequest("/client/track/list", { orderType: "1", language: "2", orderNo: batch.map((row) => row.waybill_no) });
        const tracks = (Array.isArray(data) ? data : (data.list || data.tracks || data.data || [data])).filter(Boolean);
        tracks.forEach((track) => {
          const existing = batch.find((row) => String(row.waybill_no) === String(track.billNo || track.waybillNo));
          if (!existing) return;
          const nextCode = track.latestStatus || existing.status_code;
          const nextTime = track.latestStatusTime || track.latestTime || existing.latest_status_time;
          const changed = String(existing.status_code || "") !== String(nextCode || "") || String(existing.latest_status_time || "") !== String(nextTime || "");
          upsertShippingShipment({
            ...existing,
            waybill_no: track.billNo || track.waybillNo,
            status_code: nextCode,
            status_label: String(track.latestStatusDesc || track.statusDesc || existing.status_label || ""),
            latest_status_time: nextTime,
            latest_site: track.latestSite,
            latest_locus: track.latestLocus,
            tracking_events: track.locus || track.latestLocusList || track.tracks || [],
            sync_state: "synced",
            last_synced_at: new Date().toISOString(),
            delivered_at: imileStatusGroup(nextCode) === "delivered" ? (nextTime || existing.delivered_at || new Date().toISOString()) : existing.delivered_at
          });
          synced += 1;
          if (changed) updated += 1;
        });
      }
      run = updateRecord("shipping_sync_runs", run.id, { status: "completed", synced_shipments: synced, updated_shipments: updated, unchanged_shipments: Math.max(0, synced - updated), failed_shipments: Math.max(0, rows.length - synced), completed_at: new Date().toISOString() });
      queueShippingAudit("tracking_sync");
      return { synced, updated, unchanged: Math.max(0, synced - updated), failed: Math.max(0, rows.length - synced), run };
    } catch (error) {
      run = updateRecord("shipping_sync_runs", run.id, { status: "failed", error: String(error.message || "IMILE_TRACKING_SYNC_FAILED"), completed_at: new Date().toISOString() });
      throw error;
    }
  })();
  try {
    return await imileTrackingSyncPromise;
  } finally {
    imileTrackingSyncPromise = null;
  }
}

function shippingShipmentSummary(rows = entityRows("shipping_shipments")) {
  const sum = (key) => Number(rows.reduce((total, row) => total + Number(row[key] || 0), 0).toFixed(2));
  const priced = rows.filter((row) => row.carrier_actual_cost !== null && row.carrier_actual_cost !== undefined).length;
  return {
    total: rows.length,
    delivered: rows.filter((row) => row.status_group === "delivered").length,
    pending: rows.filter((row) => ["pending", "picked_up", "in_transit", "out_for_delivery"].includes(row.status_group)).length,
    exceptions: rows.filter((row) => ["exception", "return", "cancelled"].includes(row.status_group)).length,
    customer_shipping_total: sum("customer_shipping_charge"),
    estimated_cost_total: sum("carrier_estimated_cost"),
    actual_cost_total: sum("carrier_actual_cost"),
    actual_cost_coverage: rows.length ? Math.round(priced / rows.length * 100) : 0,
    missing_cost_count: rows.length - priced
  };
}

function backfillShippingSettlementSnapshots() {
  const shipmentsById = new Map(entityRows("shipping_shipments").map((row) => [Number(row.id), row]));
  entityRows("shipping_settlements").forEach((settlement) => {
    if (Array.isArray(settlement.shipment_snapshot) && settlement.shipment_snapshot.length) return;
    const snapshot = (settlement.shipment_ids || []).map((id) => shipmentsById.get(Number(id))).filter(Boolean);
    if (!snapshot.length) return;
    const summary = shippingLedgerSummary(snapshot);
    updateRecord("shipping_settlements", settlement.id, {
      shipment_snapshot: snapshot,
      snapshot_migrated_at: new Date().toISOString(),
      ...summary,
      shipment_count: snapshot.length,
      estimated_margin: Number((summary.customer_shipping_total - summary.estimated_cost_total).toFixed(2)),
      actual_margin: Number((summary.customer_shipping_total - summary.actual_cost_total).toFixed(2))
    });
  });
}

function shippingLedgerDate(row, basis = "delivered") {
  if (basis === "created") return String(row.metadata?.created_at_oms || row.created_at || "").slice(0, 10);
  if (basis === "fee_updated") return String(row.oms_fee_update_date || row.cost_recorded_at || "").slice(0, 10);
  if (basis === "latest_status") return String(row.latest_status_time || row.updated_at || "").slice(0, 10);
  return String(row.delivered_at || row.latest_status_time || row.created_at || "").slice(0, 10);
}

function shipmentFeeRows(row) {
  return Array.isArray(row.carrier_fee_breakdown) ? row.carrier_fee_breakdown : [];
}

function feeMatches(row, token) {
  const value = String(token || "").toUpperCase();
  return shipmentFeeRows(row).some((fee) => {
    const name = String(fee.name || "").toUpperCase();
    return value === "POS" ? name.includes("POS") : value === "COD" ? name.includes("COD") : name.includes(value);
  });
}

function filterShippingLedger(query = {}, sourceRows = entityRows("shipping_shipments")) {
  let rows = [...sourceRows];
  const text = String(query.q || "").trim().toLowerCase();
  const dateBasis = ["created", "delivered", "fee_updated", "latest_status"].includes(query.date_basis) ? query.date_basis : "delivered";
  if (text) rows = rows.filter((row) => [row.waybill_no, row.external_order_no, row.client_order_no, row.customer_name, row.customer_phone, row.destination_city, row.destination_country, row.status_label, ...(row.carrier_bill_numbers || [])].some((value) => String(value || "").toLowerCase().includes(text)));
  if (query.date_from) rows = rows.filter((row) => shippingLedgerDate(row, dateBasis) >= String(query.date_from));
  if (query.date_to) rows = rows.filter((row) => shippingLedgerDate(row, dateBasis) <= String(query.date_to));
  if (query.status_group === "pending_all") rows = rows.filter((row) => ["pending", "picked_up", "in_transit", "out_for_delivery"].includes(row.status_group));
  else if (query.status_group === "problem_all") rows = rows.filter((row) => ["exception", "return", "cancelled"].includes(row.status_group));
  else if (query.status_group) rows = rows.filter((row) => row.status_group === query.status_group);
  if (query.city) rows = rows.filter((row) => String(row.destination_city || "") === String(query.city));
  if (query.requested_payment) rows = rows.filter((row) => String(row.payment_method || "") === String(query.requested_payment));
  if (query.actual_payment) rows = rows.filter((row) => String(row.metadata?.actual_payment_method || "") === String(query.actual_payment));
  if (query.payment_changed === "true") rows = rows.filter((row) => row.payment_method && row.metadata?.actual_payment_method && String(row.payment_method) !== String(row.metadata.actual_payment_method));
  if (query.payment_changed === "false") rows = rows.filter((row) => row.payment_method && row.metadata?.actual_payment_method && String(row.payment_method) === String(row.metadata.actual_payment_method));
  if (query.pos_fee === "true") rows = rows.filter((row) => feeMatches(row, "POS"));
  if (query.pos_fee === "false") rows = rows.filter((row) => !feeMatches(row, "POS"));
  if (query.cod_fee === "true") rows = rows.filter((row) => feeMatches(row, "COD"));
  if (query.cod_fee === "false") rows = rows.filter((row) => !feeMatches(row, "COD"));
  if (query.cod_collected === "true") rows = rows.filter((row) => Number(row.carrier_collected_amount || 0) > 0);
  if (query.cod_collected === "false") rows = rows.filter((row) => Number(row.carrier_collected_amount || 0) <= 0);
  if (query.cost_state === "recorded") rows = rows.filter((row) => row.carrier_actual_cost !== null && row.carrier_actual_cost !== undefined);
  if (query.cost_state === "missing") rows = rows.filter((row) => row.carrier_actual_cost === null || row.carrier_actual_cost === undefined);
  if (query.matched === "true") rows = rows.filter((row) => row.source !== "oms_fee_report" || row.store_order_id || row.customer_name);
  if (query.matched === "false") rows = rows.filter((row) => row.source === "oms_fee_report" && !row.store_order_id && !row.customer_name);
  if (query.bill_number) rows = rows.filter((row) => (row.carrier_bill_numbers || []).includes(String(query.bill_number)));
  if (query.settlement_state === "billed") rows = rows.filter((row) => (row.carrier_bill_numbers || []).length > 0);
  if (query.settlement_state === "unbilled") rows = rows.filter((row) => !(row.carrier_bill_numbers || []).length);
  if (query.min_cost !== undefined && query.min_cost !== "") rows = rows.filter((row) => Number(row.carrier_actual_cost || 0) >= Number(query.min_cost));
  if (query.max_cost !== undefined && query.max_cost !== "") rows = rows.filter((row) => Number(row.carrier_actual_cost || 0) <= Number(query.max_cost));
  rows.sort((a, b) => shippingLedgerDate(b, dateBasis).localeCompare(shippingLedgerDate(a, dateBasis)) || Number(b.id) - Number(a.id));
  return { rows, date_basis: dateBasis };
}

function shippingLedgerSummary(rows = []) {
  const base = shippingShipmentSummary(rows);
  const feeTotal = (token) => Number(rows.reduce((sum, row) => sum + shipmentFeeRows(row).filter((fee) => String(fee.name || "").toUpperCase().includes(token)).reduce((feeSum, fee) => feeSum + Number(fee.amount || 0), 0), 0).toFixed(3));
  return {
    ...base,
    billed_shipments: rows.filter((row) => (row.carrier_bill_numbers || []).length > 0).length,
    unbilled_shipments: rows.filter((row) => !(row.carrier_bill_numbers || []).length).length,
    pos_fee_shipments: rows.filter((row) => feeMatches(row, "POS")).length,
    cod_fee_shipments: rows.filter((row) => feeMatches(row, "COD")).length,
    payment_changed: rows.filter((row) => row.payment_method && row.metadata?.actual_payment_method && String(row.payment_method) !== String(row.metadata.actual_payment_method)).length,
    cod_collected_total: Number(rows.reduce((sum, row) => sum + Number(row.carrier_collected_amount || 0), 0).toFixed(2)),
    pos_fee_total: feeTotal("POS"),
    cod_fee_total: feeTotal("COD"),
    estimate_variance_total: Number((base.estimated_cost_total - base.actual_cost_total).toFixed(2))
  };
}

function normalizeShippingAuditSettings(payload = {}) {
  const saved = getSetting("shippingAuditSettings") || {};
  const source = { ...defaultShippingAuditSettings, ...saved, ...payload };
  const merge = (key) => ({ ...defaultShippingAuditSettings[key], ...(saved[key] || {}), ...(payload[key] || {}) });
  const tokens = (value, fallback) => (Array.isArray(value) ? value : fallback).map((item) => String(item).trim().toUpperCase()).filter(Boolean);
  const number = (value, fallback, max = 100000) => Math.min(max, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : fallback));
  const payment = merge("payment");
  return {
    enabled: source.enabled !== false && source.enabled !== "false",
    auto_run_after_sync: source.auto_run_after_sync !== false && source.auto_run_after_sync !== "false",
    currency: String(source.currency || "SAR").toUpperCase(),
    weight: { ...merge("weight"), enabled: merge("weight").enabled !== false && merge("weight").enabled !== "false", tolerance_kg: number(merge("weight").tolerance_kg, 0.5, 100), tolerance_percent: number(merge("weight").tolerance_percent, 20, 1000), require_expected_weight: merge("weight").require_expected_weight !== false && merge("weight").require_expected_weight !== "false" },
    cancellation: { ...merge("cancellation"), enabled: merge("cancellation").enabled !== false && merge("cancellation").enabled !== "false", allowed_fee: number(merge("cancellation").allowed_fee, 0), require_timeline_evidence: merge("cancellation").require_timeline_evidence !== false && merge("cancellation").require_timeline_evidence !== "false" },
    duplicates: { ...merge("duplicates"), enabled: merge("duplicates").enabled !== false && merge("duplicates").enabled !== "false", amount_tolerance: number(merge("duplicates").amount_tolerance, 0.01, 100) },
    payment: {
      ...payment,
      enabled: payment.enabled !== false && payment.enabled !== "false",
      requested_prepaid_codes: tokens(payment.requested_prepaid_codes, defaultShippingAuditSettings.payment.requested_prepaid_codes),
      requested_collect_codes: tokens(payment.requested_collect_codes, defaultShippingAuditSettings.payment.requested_collect_codes),
      actual_prepaid_codes: tokens(payment.actual_prepaid_codes, defaultShippingAuditSettings.payment.actual_prepaid_codes),
      actual_cash_codes: tokens(payment.actual_cash_codes, defaultShippingAuditSettings.payment.actual_cash_codes),
      actual_pos_codes: tokens(payment.actual_pos_codes, defaultShippingAuditSettings.payment.actual_pos_codes),
      pos_fee_tokens: tokens(payment.pos_fee_tokens, defaultShippingAuditSettings.payment.pos_fee_tokens),
      cod_fee_tokens: tokens(payment.cod_fee_tokens, defaultShippingAuditSettings.payment.cod_fee_tokens)
    },
    settlement: { ...merge("settlement"), enabled: merge("settlement").enabled !== false && merge("settlement").enabled !== "false", overdue_days: Math.min(365, Math.max(1, Math.round(number(merge("settlement").overdue_days, 7, 365)))), require_completed_bill_for_financial_findings: merge("settlement").require_completed_bill_for_financial_findings !== false && merge("settlement").require_completed_bill_for_financial_findings !== "false" },
    pricing: { ...merge("pricing"), enabled: merge("pricing").enabled !== false && merge("pricing").enabled !== "false", base_fee: number(merge("pricing").base_fee, 18), included_weight_kg: number(merge("pricing").included_weight_kg, 5, 100), extra_started_kg_fee: number(merge("pricing").extra_started_kg_fee, 1), vat_percent: number(merge("pricing").vat_percent, 15, 100), tolerance_amount: number(merge("pricing").tolerance_amount, 0.5) },
    updated_at: source.updated_at || null,
    version: Math.max(1, Number(source.version || 1))
  };
}

function auditCode(value) {
  return String(value || "").trim().toUpperCase();
}

function shippingAuditFeeTotal(shipment, tokens = []) {
  return Number(shipmentFeeRows(shipment).filter((fee) => tokens.some((token) => auditCode(fee.name).includes(auditCode(token)))).reduce((sum, fee) => sum + Number(fee.amount || 0), 0).toFixed(3));
}

function shippingAuditOrder(shipment, ordersById, ordersByNumber) {
  return ordersById.get(Number(shipment.store_order_id)) || ordersByNumber.get(String(shipment.client_order_no || "")) || ordersByNumber.get(String(shipment.external_order_no || "")) || null;
}

function shippingAuditTimeline(shipment, order) {
  const events = Array.isArray(shipment.tracking_events) ? shipment.tracking_events : [];
  const normalized = events.map((event) => ({
    code: auditCode(event.status || event.statusCode || event.code || event.locusStatus || event.latestStatus),
    label: auditCode(event.statusDesc || event.statusName || event.description || event.locusStatusDesc || event.latestStatusDesc),
    time: String(event.time || event.statusTime || event.date || event.locusTime || event.latestStatusTime || "")
  }));
  const pickup = normalized.find((event) => /PICK|COLLECT|RECEIVED BY|WAREHOUSE|SCAN|揽收|取件/.test(`${event.code} ${event.label}`));
  const cancellation = normalized.find((event) => /CANCEL|取消/.test(`${event.code} ${event.label}`));
  const orderCancelled = [order?.cancelled_at, order?.legacy_dates?.cancelled_at].find(Boolean) || null;
  return { events: normalized, pickup_at: pickup?.time || null, cancelled_at: cancellation?.time || orderCancelled, has_tracking_evidence: normalized.length > 0 };
}

function shippingAuditExpectedWeight(order) {
  const weight = Number(order?.shipping_package?.gross_weight || 0);
  return weight > 0 ? weight : null;
}

function shippingAuditOrderContents(order = null) {
  if (!order) return { items: [], expected_weight: null, calculated_weight: null, weight_source: "missing_order", calculation_complete: false };
  const products = new Map(entityRows("products").map((product) => [Number(product.id), product]));
  let calculationComplete = true;
  const items = (order.items || []).map((item) => {
    const product = products.get(Number(item.product_id));
    const variant = (product?.variants || []).find((row) => String(row.id) === String(item.variant_id));
    const snapshot = product ? productShippingSnapshot(product, variant) : null;
    const quantity = Math.max(1, Number(item.quantity || 1));
    const unitWeight = Number(item.shipping?.weight ?? snapshot?.weight ?? 0);
    if (!unitWeight) calculationComplete = false;
    return {
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      sku: item.sku || product?.sku || "",
      name_ar: item.name_ar || product?.name_ar || "",
      name_en: item.name_en || product?.name_en || "",
      variant_label: item.variant_label || "",
      quantity,
      unit_weight: unitWeight || null,
      total_weight: unitWeight ? Number((unitWeight * quantity).toFixed(3)) : null,
      weight_source: item.shipping?.data_source || snapshot?.data_source || (product ? "current_catalog" : "unmatched_product"),
      shipping_profile_id: item.shipping?.shipping_profile_id || snapshot?.shipping_profile_id || product?.shipping_profile_id || null,
      dimensions: snapshot ? { length: snapshot.length, width: snapshot.width, height: snapshot.height, unit: snapshot.dimension_unit || "cm" } : null,
      image_url: item.image_url || product?.main_photo_url || product?.image_url || ""
    };
  });
  const calculatedWeight = Number(items.reduce((sum, item) => sum + Number(item.total_weight || 0), 0).toFixed(3));
  return {
    items,
    expected_weight: Number(order.shipping_package?.gross_weight || 0) || null,
    calculated_weight: calculatedWeight || null,
    weight_source: order.shipping_package?.weight_source || "order_package_snapshot",
    calculation_complete: calculationComplete && items.length > 0,
    package_snapshot: order.shipping_package || null
  };
}

function shippingAuditUnifiedTimeline(shipment, finding = null) {
  const events = [];
  const add = (type, time, title_en, title_ar, detail = {}, sortFallback = "") => events.push({ type, time: time || sortFallback || null, title_en, title_ar, detail });
  add("shipment_created", shipment.metadata?.created_at_oms || shipment.created_at, "Shipment created in OMS", "تم إنشاء الشحنة في OMS", { source: shipment.source, waybill_no: shipment.waybill_no });
  (shipment.tracking_events || []).forEach((event) => add("tracking", event.time || event.statusTime || event.date || event.locusTime, String(event.statusDesc || event.statusName || event.description || event.status || event.code || "Tracking event"), String(event.statusDesc || event.statusName || event.description || event.status || event.code || "حدث تتبع"), { raw: event }));
  (finding?.source?.reports || []).forEach((report) => add("oms_report", report.report_date, "Included in OMS fee report", "أدرجت في تقرير رسوم OMS", report));
  (finding?.source?.bills || []).forEach((bill) => add("carrier_bill", bill.bill_date, bill.bill_type === "codBill" ? "Included in completed COD bill" : "Included in completed fee bill", bill.bill_type === "codBill" ? "أدرجت في فاتورة COD المقفلة" : "أدرجت في فاتورة المصاريف المقفلة", bill));
  (finding?.source?.reconciliations || []).forEach((row) => add("reconciliation", row.bill_date || row.cycle_end, "Weekly reconciliation generated", "تم إنشاء التقفيل الأسبوعي", row));
  if (shipment.latest_status_time) add("latest_status", shipment.latest_status_time, `Latest status: ${shipment.status_label || shipment.status_code || shipment.status_group}`, `آخر حالة: ${shipment.status_label || shipment.status_code || shipment.status_group}`, { status_group: shipment.status_group });
  return events.filter((event) => event.time).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

function shippingAuditFingerprint(shipment, ruleCode, detail = "") {
  return crypto.createHash("sha256").update([shipment.provider || "imile", shipment.id, shipment.waybill_no, ruleCode, detail].join("|")).digest("hex");
}

function shippingAuditSource(shipment, context = {}) {
  const billCodes = [...new Set([...(shipment.carrier_bill_numbers || []), ...shipmentFeeRows(shipment).map((fee) => fee.bill_code)].map(String).filter(Boolean))];
  const bills = billCodes.map((code) => context.billsByCode?.get(code)).filter(Boolean);
  const completedBills = bills.filter((bill) => auditCode(bill.settlement_status) === "COMPLETED");
  const completedFeeBills = completedBills.filter((bill) => bill.bill_type === "feeBill");
  const reports = context.reportsByShipment?.get(Number(shipment.id)) || [];
  const reconciliations = context.reconciliationsByShipment?.get(Number(shipment.id)) || [];
  return {
    state: completedFeeBills.length ? "completed_bill" : bills.some((bill) => bill.bill_type === "feeBill") ? "unclosed_bill" : "unbilled",
    financially_confirmed: completedFeeBills.length > 0,
    completed_fee_bill_codes: completedFeeBills.map((bill) => bill.bill_code),
    bill_codes: billCodes,
    bills: bills.map((bill) => ({ id: bill.id, bill_code: bill.bill_code, bill_type: bill.bill_type, bill_type_label: bill.bill_type_label, bill_date: bill.bill_date, cycle_start: bill.cycle_start, cycle_end: bill.cycle_end, amount: bill.amount, currency: bill.currency, settlement_status: bill.settlement_status })),
    reports: reports.map((report) => ({ id: report.id, report_type: report.report_type, report_date: report.report_date, fetched_at: report.fetched_at, range_start: report.range_start, range_end: report.range_end, source: report.source, shipment_count: report.shipment_count, matched_count: report.matched_count, bill_numbers: report.bill_numbers || [] })),
    reconciliations: reconciliations.map((row) => ({ id: row.id, cycle_start: row.cycle_start, cycle_end: row.cycle_end, bill_date: row.bill_date, status: row.status, cod_bill_id: row.cod_bill_id, fee_bill_id: row.fee_bill_id }))
  };
}

function shippingAuditDetectionSteps(ruleCode, finding, source, settings) {
  const sourceStep = source.financially_confirmed
    ? { en: `Matched the shipment to completed fee bill ${source.completed_fee_bill_codes?.[0] || "-"}.`, ar: `تمت مطابقة الشحنة مع فاتورة المصاريف المقفلة ${source.completed_fee_bill_codes?.[0] || "-"}.` }
    : { en: `No completed fee bill was found after ${settings.settlement.overdue_days} days.`, ar: `لم يتم العثور على فاتورة مصاريف مقفلة بعد ${settings.settlement.overdue_days} أيام.` };
  const comparisons = {
    duplicate_fee: { en: `Grouped fee rows by waybill, bill code, fee name and amount; found ${finding.duplicate_count || 2} identical rows.`, ar: `تم تجميع بنود الرسوم حسب البوليصة والفاتورة واسم الرسم والمبلغ، وظهر ${finding.duplicate_count || 2} بند متطابق.` },
    weight_variance: { en: `Compared ${finding.expected_weight ?? "-"} kg expected with ${finding.billed_weight ?? "-"} kg billed using the configured tolerance.`, ar: `تمت مقارنة الوزن المتوقع ${finding.expected_weight ?? "-"} كجم بالمحتسب ${finding.billed_weight ?? "-"} كجم وفق نسبة السماح المحددة.` },
    missing_expected_weight: { en: "The bill contains carrier weight, but the linked store order has no package weight.", ar: "الفاتورة تحتوي وزن شركة الشحن لكن الطلب المرتبط لا يحتوي وزن الطرد المتوقع." },
    unexpected_pos_fee: { en: `Compared the POS fee with actual payment code ${finding.actual_payment || "-"}.`, ar: `تمت مقارنة رسم POS مع كود الدفع الفعلي ${finding.actual_payment || "-"}.` },
    unexpected_cod_fee: { en: `Compared the COD fee with requested payment code ${finding.requested_payment || "-"}.`, ar: `تمت مقارنة رسم التحصيل مع كود الدفع المطلوب ${finding.requested_payment || "-"}.` },
    payment_method_changed: { en: `Requested payment ${finding.requested_payment || "-"}; actual payment ${finding.actual_payment || "-"}.`, ar: `الدفع المطلوب ${finding.requested_payment || "-"}؛ والدفع الفعلي ${finding.actual_payment || "-"}.` },
    delivery_fee_variance: { en: `Compared configured total ${finding.expected_amount ?? "-"} with closed bill total ${finding.actual_amount ?? "-"}.`, ar: `تمت مقارنة الإجمالي حسب القاعدة ${finding.expected_amount ?? "-"} مع إجمالي الفاتورة المقفلة ${finding.actual_amount ?? "-"}.` },
    settlement_overdue: { en: `The shipment reached ${finding.shipment_status || "a billable stage"} and remained without a completed bill beyond the configured limit.`, ar: `وصلت الشحنة إلى ${finding.shipment_status || "مرحلة قابلة للتقفيل"} وظلت بدون فاتورة مقفلة بعد المهلة المحددة.` }
  };
  return [sourceStep, comparisons[ruleCode] || { en: "Applied the configured audit rule to the stored OMS evidence.", ar: "تم تطبيق قاعدة المراجعة المحددة على دليل OMS المحفوظ." }];
}

function shippingAuditFindingBase(shipment, order, run, ruleCode, settings, source, detail = "") {
  return {
    fingerprint: shippingAuditFingerprint(shipment, ruleCode, detail),
    run_id: run.id,
    provider: shipment.provider || "imile",
    shipment_id: Number(shipment.id),
    store_order_id: order?.id || shipment.store_order_id || null,
    waybill_no: String(shipment.waybill_no || ""),
    client_order_no: String(shipment.client_order_no || ""),
    rule_code: ruleCode,
    currency: shipment.currency || settings.currency,
    detected_at: new Date().toISOString(),
    rule_version: settings.version,
    source,
    settlement_state: source.state,
    financially_confirmed: source.financially_confirmed,
    evidence: {
      shipment_status: shipment.status_group || shipment.status_code || "",
      shipment_status_label: shipment.status_label || "",
      requested_payment: shipment.payment_method || null,
      actual_payment: shipment.metadata?.actual_payment_method || null,
      bill_numbers: source.bill_codes,
      fee_breakdown: shipmentFeeRows(shipment),
      latest_status_time: shipment.latest_status_time || null,
      source
    }
  };
}

function buildShippingAuditFindings(shipment, order, run, settings, context = {}) {
  const findings = [];
  const source = shippingAuditSource(shipment, context);
  const add = (ruleCode, severity, title_en, title_ar, reason_en, reason_ar, values = {}, detail = "") => {
    const finding = { ...shippingAuditFindingBase(shipment, order, run, ruleCode, settings, source, detail), severity, title_en, title_ar, reason_en, reason_ar, exposure_amount: 0, ...values };
    finding.detection_steps = shippingAuditDetectionSteps(ruleCode, finding, source, settings);
    findings.push(finding);
  };
  const actualCost = Number(shipment.carrier_actual_cost || 0);
  const deliveryTokens = ["DELIVERY", "配送"];
  const vatTokens = ["VAT", "TAX", "ضريبة"];
  const deliveryFee = shippingAuditFeeTotal(shipment, deliveryTokens);
  const vatFee = shippingAuditFeeTotal(shipment, vatTokens);
  const expectedWeight = shippingAuditExpectedWeight(order);
  const billedWeight = Number(shipment.carrier_billable_weight || 0) || null;
  const statusDate = new Date(shipment.delivered_at || shipment.latest_status_time || shipment.metadata?.created_at_oms || shipment.created_at || 0);
  const ageDays = Number.isFinite(statusDate.getTime()) ? Math.floor((Date.now() - statusDate.getTime()) / 86400000) : 0;
  const billableStage = ["delivered", "out_for_delivery", "exception", "return"].includes(shipment.status_group);
  if (settings.settlement.enabled && !source.financially_confirmed && billableStage && ageDays >= settings.settlement.overdue_days) {
    add("settlement_overdue", "high", "Completed bill is overdue", "التقفيل متأخر", `No completed carrier bill was linked ${ageDays} days after the latest shipment stage.`, `لم ترتبط فاتورة شركة شحن مقفلة بعد ${ageDays} يومًا من آخر مرحلة للشحنة.`, { finding_kind: "operational", overdue_days: ageDays, configured_overdue_days: settings.settlement.overdue_days, shipment_status: shipment.status_group, calculation: { latest_status_time: shipment.latest_status_time || shipment.delivered_at || null, elapsed_days: ageDays, allowed_days: settings.settlement.overdue_days, fee_bill_state: source.state } });
  }
  if (settings.payment.enabled) {
    const requested = auditCode(shipment.payment_method);
    const actual = auditCode(shipment.metadata?.actual_payment_method);
    if (requested && actual && requested !== actual) {
      add("payment_method_changed", "info", "Payment method changed at delivery", "تغيرت طريقة الدفع عند التسليم", "The customer changed the payment method with the courier. This is stored for reference only and does not require review.", "غيّر العميل طريقة الدفع مع المندوب. يتم حفظ ذلك للرجوع فقط ولا يحتاج إلى مراجعة.", { finding_kind: "informational", requested_payment: requested, actual_payment: actual, exposure_amount: 0 });
    }
  }
  const financialEligible = source.financially_confirmed || !settings.settlement.require_completed_bill_for_financial_findings;
  if (!financialEligible) return findings;

  if (settings.weight.enabled && expectedWeight && billedWeight) {
    const delta = Number((billedWeight - expectedWeight).toFixed(3));
    const allowed = Math.max(settings.weight.tolerance_kg, expectedWeight * settings.weight.tolerance_percent / 100);
    if (Math.abs(delta) > allowed) add("weight_variance", delta > 0 ? "high" : "medium", "Billed weight differs from expected", "الوزن المحتسب يختلف عن المتوقع", `Carrier weight differs by ${Math.abs(delta).toFixed(2)} kg.`, `وزن شركة الشحن يختلف بمقدار ${Math.abs(delta).toFixed(2)} كجم.`, { expected_weight: expectedWeight, billed_weight: billedWeight, variance_amount: delta, calculation: { expected_weight: expectedWeight, billed_weight: billedWeight, difference_kg: delta, tolerance_kg: settings.weight.tolerance_kg, tolerance_percent: settings.weight.tolerance_percent, allowed_difference_kg: Number(allowed.toFixed(3)) } });
  } else if (settings.weight.enabled && settings.weight.require_expected_weight && billedWeight && !expectedWeight && order) {
    add("missing_expected_weight", "review", "Expected order weight is missing", "وزن الطلب المتوقع غير موجود", "The carrier supplied a billed weight but the linked order has no package weight.", "شركة الشحن أرسلت وزنًا محتسبًا لكن الطلب المرتبط بلا وزن طرد.", { billed_weight: billedWeight });
  }

  if (settings.cancellation.enabled && shipment.status_group === "cancelled" && actualCost > settings.cancellation.allowed_fee) {
    const timeline = shippingAuditTimeline(shipment, order);
    if (timeline.pickup_at) {
      add("cancelled_after_pickup_fee_review", "review", "Cancelled shipment was charged after pickup", "شحنة ملغاة عليها رسوم بعد الاستلام", "Pickup evidence exists, so the fee requires contract review rather than automatic rejection.", "يوجد دليل استلام من شركة الشحن، لذلك تحتاج الرسوم لمراجعة العقد بدل رفضها تلقائيًا.", { actual_amount: actualCost, expected_amount: null, exposure_amount: 0, timeline });
    } else if (timeline.has_tracking_evidence || !settings.cancellation.require_timeline_evidence) {
      add("cancelled_before_pickup_fee", "critical", "Fee charged before carrier pickup", "رسوم على طلب ألغي قبل الاستلام", "No pickup event exists before cancellation, so only the configured cancellation allowance is expected.", "لا يوجد حدث استلام قبل الإلغاء، لذلك المتوقع فقط هو رسم الإلغاء المسموح به.", { actual_amount: actualCost, expected_amount: settings.cancellation.allowed_fee, exposure_amount: Number((actualCost - settings.cancellation.allowed_fee).toFixed(3)), timeline });
    } else {
      add("cancelled_timeline_incomplete", "review", "Cancellation timeline needs evidence", "تسلسل الإلغاء يحتاج دليلًا", "The cancelled shipment has a fee but tracking events are unavailable; review it before disputing.", "الشحنة الملغاة عليها رسوم لكن أحداث التتبع غير متاحة؛ راجعها قبل الاعتراض.", { actual_amount: actualCost, timeline });
    }
  }

  if (settings.duplicates.enabled) {
    const groups = new Map();
    shipmentFeeRows(shipment).forEach((fee) => {
      const key = [auditCode(fee.name), Number(fee.amount || 0).toFixed(3), String(fee.bill_code || "")].join("|");
      groups.set(key, [...(groups.get(key) || []), fee]);
    });
    groups.forEach((fees, key) => {
      if (fees.length < 2) return;
      const duplicateAmount = Number((Number(fees[0].amount || 0) * (fees.length - 1)).toFixed(3));
      add("duplicate_fee", "critical", "Duplicate carrier fee", "رسم شركة شحن مكرر", `The same fee appears ${fees.length} times on the shipment.`, `الرسم نفسه ظاهر ${fees.length} مرات على الشحنة.`, { actual_amount: Number(fees[0].amount || 0) * fees.length, expected_amount: Number(fees[0].amount || 0), exposure_amount: duplicateAmount, duplicate_count: fees.length, duplicate_fee: fees[0], matched_fee_rows: fees, calculation: { fee_name: fees[0].name, unit_amount: Number(fees[0].amount || 0), row_count: fees.length, expected_row_count: 1, expected_total: Number(fees[0].amount || 0), charged_total: Number((Number(fees[0].amount || 0) * fees.length).toFixed(3)), duplicate_difference: duplicateAmount, bill_code: fees[0].bill_code || null, bill_date: fees[0].bill_date || null } }, key);
    });
  }

  if (settings.payment.enabled) {
    const requested = auditCode(shipment.payment_method);
    const actual = auditCode(shipment.metadata?.actual_payment_method);
    const posFee = shippingAuditFeeTotal(shipment, settings.payment.pos_fee_tokens);
    const codFee = shippingAuditFeeTotal(shipment, settings.payment.cod_fee_tokens);
    if (posFee > 0 && actual && !settings.payment.actual_pos_codes.includes(actual)) add("unexpected_pos_fee", "info", "POS fee information", "تنبيه رسوم POS", "A POS fee appears with a different recorded payment code. This is informational because payment can change with the courier.", "ظهر رسم POS مع كود دفع مختلف. هذا تنبيه معلوماتي لأن العميل قد يغيّر طريقة الدفع مع المندوب.", { finding_kind: "informational", actual_amount: posFee, expected_amount: null, exposure_amount: 0 });
    if (codFee > 0 && requested && settings.payment.requested_prepaid_codes.includes(requested)) add("unexpected_cod_fee", "high", "Unexpected collection fee", "رسوم تحصيل غير متوقعة", "A collection fee was charged for an order configured as prepaid.", "تم احتساب رسم تحصيل لطلب مسجل كمدفوع مقدمًا.", { actual_amount: codFee, expected_amount: 0, exposure_amount: codFee });
  }

  if (settings.pricing.enabled && billedWeight && deliveryFee > 0) {
    const extraStartedKg = Math.max(0, Math.ceil(billedWeight) - settings.pricing.included_weight_kg);
    const extraWeightCharge = Number((extraStartedKg * settings.pricing.extra_started_kg_fee).toFixed(3));
    const expectedDelivery = Number((settings.pricing.base_fee + extraWeightCharge).toFixed(3));
    const expectedVat = Number((expectedDelivery * settings.pricing.vat_percent / 100).toFixed(3));
    const difference = Number(((deliveryFee + vatFee) - (expectedDelivery + expectedVat)).toFixed(3));
    if (Math.abs(difference) > settings.pricing.tolerance_amount) {
      const feeRows = shipmentFeeRows(shipment);
      const deliveryRows = feeRows.filter((fee) => deliveryTokens.some((token) => auditCode(fee.name).includes(auditCode(token))));
      const vatRows = feeRows.filter((fee) => vatTokens.some((token) => auditCode(fee.name).includes(auditCode(token))));
      add("delivery_fee_variance", difference > 0 ? "high" : "medium", "Delivery fee differs from configured pricing", "رسوم التوصيل تختلف عن التسعير المحدد", `Configured total is ${(expectedDelivery + expectedVat).toFixed(2)}; carrier total is ${(deliveryFee + vatFee).toFixed(2)}.`, `الإجمالي حسب القاعدة ${(expectedDelivery + expectedVat).toFixed(2)} والمحتسب من الشركة ${(deliveryFee + vatFee).toFixed(2)}.`, { actual_amount: Number((deliveryFee + vatFee).toFixed(3)), expected_amount: Number((expectedDelivery + expectedVat).toFixed(3)), exposure_amount: Math.max(0, difference), variance_amount: difference, expected_weight: expectedWeight, billed_weight: billedWeight, calculation: { base_fee: settings.pricing.base_fee, included_weight_kg: settings.pricing.included_weight_kg, billed_weight: billedWeight, extra_started_kg: extraStartedKg, extra_started_kg_fee: settings.pricing.extra_started_kg_fee, extra_weight_charge: extraWeightCharge, expected_delivery: expectedDelivery, vat_percent: settings.pricing.vat_percent, expected_vat: expectedVat, expected_total: Number((expectedDelivery + expectedVat).toFixed(3)), carrier_delivery_total: deliveryFee, carrier_vat_total: vatFee, carrier_total: Number((deliveryFee + vatFee).toFixed(3)), difference, delivery_row_count: deliveryRows.length, vat_row_count: vatRows.length, possible_duplicate_dependency: deliveryRows.length > 1 || vatRows.length > 1, delivery_rows: deliveryRows, vat_rows: vatRows } });
    }
  }
  return findings;
}

function shippingAuditSummary(findings = entityRows("shipping_audit_findings")) {
  const activeRows = findings.filter((row) => !["resolved", "ignored", "resolved_automatically"].includes(row.status));
  const notices = activeRows.filter((row) => row.finding_kind === "informational" || row.severity === "info" || row.status === "notice");
  const active = activeRows.filter((row) => !notices.includes(row));
  const count = (value) => active.filter((row) => row.severity === value).length;
  return {
    total_findings: findings.length,
    open_findings: active.length,
    notices: notices.length,
    critical: count("critical"), high: count("high"), medium: count("medium"), review: count("review"),
    exposure_amount: Number(active.reduce((sum, row) => sum + Number(row.exposure_amount || 0), 0).toFixed(3)),
    disputed_amount: Number(findings.filter((row) => row.status === "disputed").reduce((sum, row) => sum + Number(row.exposure_amount || 0), 0).toFixed(3)),
    affected_shipments: new Set(active.map((row) => Number(row.shipment_id))).size,
    financially_confirmed: active.filter((row) => row.financially_confirmed === true).length,
    settlement_overdue: active.filter((row) => row.rule_code === "settlement_overdue").length,
    currency: active.find((row) => row.currency)?.currency || "SAR"
  };
}

function runShippingAudit(options = {}) {
  const settings = normalizeShippingAuditSettings();
  const startedAt = new Date().toISOString();
  let run = createRecord("shipping_audit_runs", { provider: "imile", trigger: String(options.trigger || "manual"), status: "running", started_at: startedAt, rule_version: settings.version, settings_snapshot: settings });
  if (!settings.enabled) return updateRecord("shipping_audit_runs", run.id, { status: "skipped", reason: "audit_disabled", completed_at: new Date().toISOString() });
  const orders = entityRows("orders");
  const ordersById = new Map(orders.map((order) => [Number(order.id), order]));
  const ordersByNumber = new Map();
  orders.forEach((order) => [order.order_number, order.legacy_order_number, order.external_order_no].filter(Boolean).forEach((number) => ordersByNumber.set(String(number), order)));
  const shipments = entityRows("shipping_shipments").filter((row) => row.provider === "imile");
  const billsByCode = new Map(entityRows("shipping_carrier_bills").filter((bill) => bill.provider === "imile" && bill.bill_code).map((bill) => [String(bill.bill_code), bill]));
  const reportsByShipment = new Map();
  entityRows("shipping_reports").filter((report) => report.source === "oms_fee_report").forEach((report) => (report.items || []).forEach((item) => {
    const shipmentId = Number(item.matched_shipment_id);
    if (!shipmentId) return;
    reportsByShipment.set(shipmentId, [...(reportsByShipment.get(shipmentId) || []), report]);
  }));
  const reconciliationsByShipment = new Map();
  entityRows("shipping_weekly_reconciliations").forEach((row) => (row.linked_shipment_ids || []).forEach((shipmentId) => {
    const id = Number(shipmentId);
    reconciliationsByShipment.set(id, [...(reconciliationsByShipment.get(id) || []), row]);
  }));
  const auditContext = { billsByCode, reportsByShipment, reconciliationsByShipment };
  const existing = entityRows("shipping_audit_findings");
  const byFingerprint = new Map(existing.map((row) => [row.fingerprint, row]));
  const detected = new Set();
  let inserted = 0;
  let updated = 0;
  shipments.forEach((shipment) => {
    const order = shippingAuditOrder(shipment, ordersById, ordersByNumber);
    buildShippingAuditFindings(shipment, order, run, settings, auditContext).forEach((finding) => {
      detected.add(finding.fingerprint);
      const current = byFingerprint.get(finding.fingerprint);
      if (current) {
        const status = finding.finding_kind === "informational" ? "notice" : current.status === "resolved_automatically" ? "open" : current.status || "open";
        updateRecord("shipping_audit_findings", current.id, { ...finding, status, first_detected_at: current.first_detected_at || current.created_at, last_detected_at: finding.detected_at, occurrence_count: Number(current.occurrence_count || 1) + 1 });
        updated += 1;
      } else {
        createRecord("shipping_audit_findings", { ...finding, status: finding.finding_kind === "informational" ? "notice" : "open", first_detected_at: finding.detected_at, last_detected_at: finding.detected_at, occurrence_count: 1, notes: "" });
        inserted += 1;
      }
    });
  });
  let autoResolved = 0;
  existing.filter((row) => ["open", "reviewing", "notice"].includes(row.status) && !detected.has(row.fingerprint)).forEach((row) => {
    updateRecord("shipping_audit_findings", row.id, { status: "resolved_automatically", resolved_at: new Date().toISOString(), resolution_reason: "not_detected_in_latest_run" });
    autoResolved += 1;
  });
  const summary = shippingAuditSummary();
  run = updateRecord("shipping_audit_runs", run.id, { status: "completed", shipment_count: shipments.length, detected_count: detected.size, inserted_count: inserted, updated_count: updated, auto_resolved_count: autoResolved, summary, completed_at: new Date().toISOString() });
  return run;
}

function queueShippingAudit(trigger = "automatic") {
  const settings = normalizeShippingAuditSettings();
  if (!settings.enabled || !settings.auto_run_after_sync) return;
  setTimeout(() => {
    try { runShippingAudit({ trigger }); }
    catch (error) { console.error(`Shipping audit failed: ${error.message}`); }
  }, 250);
}

function shipmentReportItem(row) {
  return {
    waybill_no: row.waybill_no || "",
    client_no: row.client_order_no || "",
    order_no: row.external_order_no || "",
    provider: row.provider || "imile",
    billable_weight: Number(row.carrier_billable_weight || 0),
    declared_value: Number(row.metadata?.declared_value || 0),
    collected_amount: Number(row.carrier_collected_amount || row.cod_amount || 0),
    actual_cost: row.carrier_actual_cost ?? null,
    currency: row.currency || "SAR",
    bill_numbers: row.carrier_bill_numbers || [],
    fee_breakdown: shipmentFeeRows(row),
    order_type: row.metadata?.order_type_label || row.metadata?.order_type || "Delivery order",
    order_status: row.status_label || row.status_code || "",
    order_created_at: row.metadata?.created_at_oms || row.created_at || "",
    order_finished_at: row.delivered_at || row.latest_status_time || "",
    fee_created_at: row.oms_fee_create_date || "",
    fee_updated_at: row.oms_fee_update_date || "",
    matched_shipment_id: row.id,
    shipment: { ...row }
  };
}

function normalizeSettingsPayload(payload = {}) {
  return {
    ...payload,
    website_domain: payload.website_domain || defaultPublicDomain,
    shipping_active: payload.shipping_active === true || payload.shipping_active === "true" || payload.shippingActive === true,
    default_shipping_cost: Number(payload.default_shipping_cost || payload.defaultShippingCost || 0),
    free_shipping_threshold: Number(payload.free_shipping_threshold || payload.freeShippingThreshold || 0),
    free_shipping_rules: normalizeFreeShippingRules(payload.free_shipping_rules)
  };
}

function currentSettings() {
  return normalizeSettingsPayload(getSetting("settings") || {});
}

function normalizeHexColor(value, fallback) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : fallback;
}

function normalizeBrandIdentity(payload = {}) {
  const current = { ...defaultBrandIdentity, ...(getSetting("brandIdentity") || {}), ...payload };
  if (!current.updated_at && current.font_ar === "Jannah LT, Noto Kufi Arabic, sans-serif") {
    current.font_ar = defaultBrandIdentity.font_ar;
  }
  if (!current.updated_at && current.font_en === "Inter, sans-serif") {
    current.font_en = defaultBrandIdentity.font_en;
  }
  return {
    ...current,
    primary_color: normalizeHexColor(current.primary_color, defaultBrandIdentity.primary_color),
    primary_dark_color: normalizeHexColor(current.primary_dark_color, defaultBrandIdentity.primary_dark_color),
    sale_color: normalizeHexColor(current.sale_color, defaultBrandIdentity.sale_color),
    footer_color: normalizeHexColor(current.footer_color, defaultBrandIdentity.footer_color),
    surface_color: normalizeHexColor(current.surface_color, defaultBrandIdentity.surface_color),
    header_color: normalizeHexColor(current.header_color, defaultBrandIdentity.header_color),
    text_color: normalizeHexColor(current.text_color, defaultBrandIdentity.text_color),
    muted_color: normalizeHexColor(current.muted_color, defaultBrandIdentity.muted_color),
    heading_weight: Math.min(900, Math.max(400, Number(current.heading_weight || 700))),
    body_weight: Math.min(700, Math.max(300, Number(current.body_weight || 400))),
    card_radius: Math.min(40, Math.max(0, Number(current.card_radius || 0))),
    button_radius: Math.min(100, Math.max(0, Number(current.button_radius || 0))),
    input_radius: Math.min(24, Math.max(0, Number(current.input_radius || 0))),
    updated_at: current.updated_at || null
  };
}

function normalizeCurrencies(payload = {}) {
  const saved = getSetting("currencies") || {};
  const requestedRows = Array.isArray(payload.currencies) ? payload.currencies : (saved.currencies || defaultCurrencies);
  const defaultsByCode = new Map(defaultCurrencies.map((currency) => [currency.code, currency]));
  const rows = requestedRows.map((currency) => {
    const code = String(currency.code || "").toUpperCase();
    const fallback = defaultsByCode.get(code) || {};
    return {
      ...fallback,
      ...currency,
      code,
      decimal_digits: Math.min(3, Math.max(0, Number(currency.decimal_digits ?? fallback.decimal_digits ?? 2))),
      exchange_rate: Math.max(0.000001, Number(currency.exchange_rate || 1)),
      symbol_position: currency.symbol_position === "before" ? "before" : "after",
      is_active: currency.is_active !== false
    };
  }).filter((currency) => currency.code);
  const requestedBase = String(payload.base_currency || saved.base_currency || "SAR").toUpperCase();
  const baseCurrency = rows.some((currency) => currency.code === requestedBase) ? requestedBase : (rows[0]?.code || "SAR");
  rows.forEach((currency) => { if (currency.code === baseCurrency) currency.is_active = true; });
  return {
    base_currency: baseCurrency,
    display_mode: payload.display_mode !== undefined ? (payload.display_mode === "multi" ? "multi" : "fixed") : (saved.display_mode === "multi" ? "multi" : "fixed"),
    auto_exchange: payload.auto_exchange !== undefined ? payload.auto_exchange === true : saved.auto_exchange === true,
    rounding_mode: ["none", "nearest_1", "nearest_5", "psychological"].includes(payload.rounding_mode) ? payload.rounding_mode : (saved.rounding_mode || "none"),
    currencies: rows,
    updated_at: payload.updated_at || saved.updated_at || null
  };
}

function normalizeCountries(payload = {}) {
  const saved = getSetting("countries");
  const source = Array.isArray(payload.countries) ? payload.countries : (Array.isArray(saved) ? saved : defaultCountries);
  const defaultsByCode = new Map(defaultCountries.map((country) => [country.code, country]));
  return source.map((country) => {
    const code = String(country.code || "").trim().toUpperCase();
    return {
      ...(defaultsByCode.get(code) || {}),
      ...country,
      code,
      code3: String(country.code3 || defaultsByCode.get(code)?.code3 || "").toUpperCase(),
      calling_code: String(country.calling_code || defaultsByCode.get(code)?.calling_code || ""),
      currency_code: String(country.currency_code || defaultsByCode.get(code)?.currency_code || "").toUpperCase(),
      flag: code,
      is_active: country.is_active === true
    };
  }).filter((country) => country.code.length === 2);
}

function normalizeGoodsTypes(payload = {}) {
  const saved = getSetting("goodsTypes");
  const source = Array.isArray(payload.goods_types) ? payload.goods_types : (Array.isArray(saved) ? saved : defaultGoodsTypes);
  const rows = source.map((row, index) => ({
    id: String(row.id || row.code || `goods-${index + 1}`).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    code: String(row.code || row.id || "NORMAL").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
    name_en: String(row.name_en || row.name || "Goods type").trim(),
    name_ar: String(row.name_ar || row.name || "نوع بضاعة").trim(),
    description_en: String(row.description_en || "").trim(),
    description_ar: String(row.description_ar || "").trim(),
    provider_mapping: { ...(row.provider_mapping || {}) },
    is_active: row.is_active !== false,
    is_default: row.is_default === true
  })).filter((row) => row.id && row.code);
  const requestedDefault = rows.find((row) => row.is_default && row.is_active) || rows.find((row) => row.is_active) || rows[0];
  rows.forEach((row) => { row.is_default = row.id === requestedDefault?.id; });
  return rows;
}

function normalizeShippingProfiles(payload = {}) {
  const saved = getSetting("shippingProfiles");
  const source = Array.isArray(payload.shipping_profiles) ? payload.shipping_profiles : (Array.isArray(saved) ? saved : defaultShippingProfiles);
  const goodsTypes = normalizeGoodsTypes();
  const validGoodsTypeIds = new Set(goodsTypes.map((row) => row.id));
  const fallbackGoodsType = goodsTypes.find((row) => row.is_default)?.id || "normal";
  const rows = source.map((row, index) => ({
    id: String(row.id || `profile-${index + 1}`).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name_en: String(row.name_en || row.name || "Shipping profile").trim(),
    name_ar: String(row.name_ar || row.name || "ملف شحن").trim(),
    goods_type_id: validGoodsTypeIds.has(String(row.goods_type_id)) ? String(row.goods_type_id) : fallbackGoodsType,
    weight: Math.max(0, Number(row.weight || 0)),
    length: Math.max(0, Number(row.length || 0)),
    width: Math.max(0, Number(row.width || 0)),
    height: Math.max(0, Number(row.height || 0)),
    origin_country_code: String(row.origin_country_code || "SA").toUpperCase(),
    requires_shipping: row.requires_shipping !== false,
    is_active: row.is_active !== false,
    is_default: row.is_default === true
  })).filter((row) => row.id);
  const requestedDefault = rows.find((row) => row.is_default && row.is_active) || rows.find((row) => row.is_active) || rows[0];
  rows.forEach((row) => { row.is_default = row.id === requestedDefault?.id; });
  return rows;
}

function normalizeMarketSettings(payload = {}) {
  const saved = getSetting("marketSettings") || {};
  const current = { ...defaultMarketSettings, ...saved, ...payload };
  const countries = normalizeCountries();
  const validCodes = new Set(countries.map((country) => country.code));
  const defaultCountryCode = validCodes.has(String(current.default_country_code).toUpperCase()) ? String(current.default_country_code).toUpperCase() : "SA";
  const enabledCodes = [...new Set(asArray(current.enabled_country_codes).map((code) => String(code).toUpperCase()).filter((code) => validCodes.has(code)))];
  if (!enabledCodes.includes(defaultCountryCode)) enabledCodes.unshift(defaultCountryCode);
  const goodsTypes = normalizeGoodsTypes();
  const profiles = normalizeShippingProfiles();
  return {
    default_country_code: defaultCountryCode,
    enabled_country_codes: enabledCodes,
    timezone: String(current.timezone || countries.find((country) => country.code === defaultCountryCode)?.timezone || "Asia/Riyadh"),
    weight_unit: current.weight_unit === "g" ? "g" : "kg",
    dimension_unit: current.dimension_unit === "mm" ? "mm" : "cm",
    default_goods_type_id: goodsTypes.some((row) => row.id === current.default_goods_type_id) ? current.default_goods_type_id : (goodsTypes.find((row) => row.is_default)?.id || "normal"),
    default_shipping_profile_id: profiles.some((row) => row.id === current.default_shipping_profile_id) ? current.default_shipping_profile_id : (profiles.find((row) => row.is_default)?.id || "apparel-light"),
    mixed_goods_policy: ["review", "strictest", "split"].includes(current.mixed_goods_policy) ? current.mixed_goods_policy : "review",
    updated_at: current.updated_at || null
  };
}

function normalizeStorefrontLayout(payload = {}) {
  const saved = getSetting("storefrontLayout") || {};
  const announcement = { ...defaultStorefrontLayout.announcement, ...(saved.announcement || {}), ...(payload.announcement || {}) };
  return {
    ...defaultStorefrontLayout,
    ...saved,
    ...payload,
    announcement: {
      ...announcement,
      rotation_interval_seconds: Math.min(60, Math.max(2, Number(announcement.rotation_interval_seconds || 5))),
      transition: ["fade", "slide"].includes(announcement.transition) ? announcement.transition : "fade",
      pause_on_hover: announcement.pause_on_hover !== false,
      messages: Array.isArray(payload.announcement?.messages) ? payload.announcement.messages : (saved.announcement?.messages || defaultStorefrontLayout.announcement.messages)
    },
    header: { ...defaultStorefrontLayout.header, ...(saved.header || {}), ...(payload.header || {}) },
    footer: { ...defaultStorefrontLayout.footer, ...(saved.footer || {}), ...(payload.footer || {}) },
    updated_at: payload.updated_at || saved.updated_at || null
  };
}

function normalizeHomeBuilder(payload = {}) {
  const saved = getSetting("homeBuilder") || {};
  return {
    slides: Array.isArray(payload.slides) ? payload.slides : (saved.slides || []),
    sections: (Array.isArray(payload.sections) ? payload.sections : (saved.sections || defaultHomeBuilder.sections)).map((section, index) => ({
      ...section,
      id: String(section.id || `section-${index + 1}`),
      order: Number(section.order || index + 1),
      is_active: section.is_active !== false,
      collection_id: section.collection_id === "" || section.collection_id === null || section.collection_id === undefined
        ? null
        : Number(section.collection_id),
      display_style: section.display_style === "slider" ? "slider" : "grid",
      limit: Math.min(100, Math.max(1, Number(section.limit || 12))),
      show_view_all: section.show_view_all !== false
    })),
    updated_at: payload.updated_at || saved.updated_at || null
  };
}

function getRobotsTxt() {
  const saved = getSetting("robotsTxt") || {};
  return {
    content: typeof saved.content === "string" ? saved.content : defaultRobotsTxt,
    updated_at: saved.updated_at || null
  };
}

function maskSecret(value) {
  const raw = String(value || "");
  if (!raw) return "";
  return `${raw.slice(0, 7)}...${raw.slice(-4)}`;
}

function normalizeAiSetup(setup = {}) {
  const openai = setup.providers?.openai || {};
  const models = Array.isArray(setup.models) && setup.models.length ? setup.models : defaultAiModels;
  return {
    providers: {
      openai: {
        enabled: Boolean(openai.enabled),
        api_key: openai.api_key || "",
        organization: openai.organization || "",
        project: openai.project || "",
        default_text_model: openai.default_text_model || "gpt-5.6-mini",
        default_image_model: openai.default_image_model || "gpt-image-2",
        default_video_model: openai.default_video_model || "sora-2",
        synced_at: openai.synced_at || null
      }
    },
    models,
    updated_at: setup.updated_at || null
  };
}

function publicAiSetup(setup = getSetting("aiSetup")) {
  const normalized = normalizeAiSetup(setup);
  return {
    ...normalized,
    providers: {
      ...normalized.providers,
      openai: {
        ...normalized.providers.openai,
        has_api_key: Boolean(normalized.providers.openai.api_key),
        api_key: maskSecret(normalized.providers.openai.api_key)
      }
    }
  };
}

function inferAiModule(modelId) {
  const id = String(modelId || "").toLowerCase();
  if (id.includes("image") || id.includes("dall")) return "image";
  if (id.includes("sora") || id.includes("video")) return "video";
  if (id.includes("audio") || id.includes("realtime") || id.includes("transcribe") || id.includes("tts")) return "audio";
  if (id.includes("embedding")) return "embeddings";
  if (id.includes("moderation")) return "moderation";
  return "text";
}

function mergeAiModels(existingModels, syncedModels) {
  const byId = new Map((existingModels || []).map((model) => [model.id, model]));
  for (const synced of syncedModels) {
    const current = byId.get(synced.id) || {};
    byId.set(synced.id, {
      id: synced.id,
      module: current.module || inferAiModule(synced.id),
      input_per_1m: Number(current.input_per_1m || 0),
      cached_input_per_1m: Number(current.cached_input_per_1m || 0),
      output_per_1m: Number(current.output_per_1m || 0),
      currency: current.currency || "USD",
      unit_note: current.unit_note || "",
      is_enabled: current.is_enabled ?? true,
      source: "openai",
      owned_by: synced.owned_by || current.owned_by || "",
      synced_at: new Date().toISOString()
    });
  }
  return Array.from(byId.values()).sort((a, b) => a.module.localeCompare(b.module) || a.id.localeCompare(b.id));
}

function parsePrice(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "-") return 0;
  if (/free/i.test(raw)) return 0;
  const match = raw.match(/\$([0-9.]+)/);
  return match ? Number(match[1]) : 0;
}

function priceUnit(value, fallback = "1M tokens") {
  const raw = String(value || "").trim();
  if (raw.includes("/")) return raw.replace(/^\$[0-9.]+\s*/, "").trim();
  return fallback;
}

function splitMarkdownRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((part) => part.trim());
}

function pricingModule({ model = "", category = "", modality = "", section = "" }) {
  const value = `${model} ${category} ${modality} ${section}`.toLowerCase();
  if (value.includes("image")) return "image";
  if (value.includes("sora") || value.includes("video")) return "video";
  if (value.includes("audio") || value.includes("transcribe") || value.includes("tts") || value.includes("whisper")) return "audio";
  if (value.includes("embedding")) return "embeddings";
  if (value.includes("moderation")) return "moderation";
  if (value.includes("fine")) return "finetuning";
  if (value.includes("search")) return "search";
  return "text";
}

function pricingRow(row) {
  return {
    provider: "openai",
    currency: "USD",
    is_enabled: true,
    source_url: "https://developers.openai.com/api/docs/pricing",
    ...row
  };
}

function parseOfficialOpenAiPricing(markdown) {
  const lines = markdown.split(/\r?\n/);
  const rows = [];
  let section = "";
  let tier = "";

  const knownSections = [
    "Flagship models",
    "Realtime and audio generation models",
    "Image generation models",
    "Video generation models",
    "Transcription models",
    "Specialized models",
    "Finetuning"
  ];
  const knownTiers = ["Standard", "Batch", "Flex", "Fast mode"];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (knownSections.includes(line)) section = line;
    if (knownTiers.includes(line)) tier = line;
    if (!line.startsWith("| ")) continue;

    const headers = splitMarkdownRow(line);
    const separator = lines[i + 1]?.trim() || "";
    if (!separator.startsWith("| ---")) continue;

    i += 2;
    while (i < lines.length && lines[i].trim().startsWith("| ")) {
      const cells = splitMarkdownRow(lines[i]);
      const item = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
      const fetched_at = new Date().toISOString();

      if (item.Model && item["Short context input"]) {
        const base = { model: item.Model, module: pricingModule({ model: item.Model, section }), tier, section, fetched_at };
        rows.push(pricingRow({
          ...base,
          pricing_key: `${item.Model}|${tier}|short`,
          context: "short",
          billing_unit: "1M tokens",
          input_per_1m: parsePrice(item["Short context input"]),
          cached_input_per_1m: parsePrice(item["Short context cached input"]),
          cache_write_per_1m: parsePrice(item["Short context cache writes"]),
          output_per_1m: parsePrice(item["Short context output"])
        }));
        if (item["Long context input"] && item["Long context input"] !== "-") {
          rows.push(pricingRow({
            ...base,
            pricing_key: `${item.Model}|${tier}|long`,
            context: "long",
            billing_unit: "1M tokens",
            input_per_1m: parsePrice(item["Long context input"]),
            cached_input_per_1m: parsePrice(item["Long context cached input"]),
            cache_write_per_1m: parsePrice(item["Long context cache writes"]),
            output_per_1m: parsePrice(item["Long context output"])
          }));
        }
      } else if (item.Model && item.Modality) {
        rows.push(pricingRow({
          pricing_key: `${item.Model}|${tier}|${item.Modality}`,
          model: item.Model,
          module: pricingModule({ model: item.Model, modality: item.Modality, section }),
          section,
          tier,
          modality: item.Modality,
          context: "",
          billing_unit: priceUnit(item["Output / cost"] || item.Output || item.Input),
          input_per_1m: parsePrice(item.Input),
          cached_input_per_1m: parsePrice(item["Cached input"]),
          cache_write_per_1m: 0,
          output_per_1m: parsePrice(item["Output / cost"] || item.Output),
          unit_note: item["Output / cost"] || "",
          fetched_at
        }));
      } else if (item.Model && item["Price per second"]) {
        rows.push(pricingRow({
          pricing_key: `${item.Model}|${tier}|${item.Size}`,
          model: item.Model,
          module: "video",
          section,
          tier,
          modality: item.Size,
          context: `${item.Portrait} / ${item.Landscape}`,
          billing_unit: "second",
          input_per_1m: 0,
          cached_input_per_1m: 0,
          cache_write_per_1m: 0,
          output_per_1m: 0,
          price_per_second: parsePrice(item["Price per second"]),
          unit_note: item["Price per second"],
          fetched_at
        }));
      } else if (item.Model && item["Use case"]) {
        rows.push(pricingRow({
          pricing_key: `${item.Model}|${item["Use case"]}`,
          model: item.Model,
          module: "audio",
          section,
          tier: "Standard",
          modality: item["Use case"],
          context: "",
          billing_unit: priceUnit(item["Estimated cost"], "minute"),
          input_per_1m: parsePrice(item.Input),
          cached_input_per_1m: 0,
          cache_write_per_1m: 0,
          output_per_1m: parsePrice(item.Output),
          price_per_minute: parsePrice(item["Estimated cost"]),
          unit_note: item["Estimated cost"],
          fetched_at
        }));
      } else if (item.Category && item.Model) {
        rows.push(pricingRow({
          pricing_key: `${item.Model}|${tier}|${item.Category}`,
          model: item.Model,
          module: pricingModule({ model: item.Model, category: item.Category, section }),
          section,
          tier,
          modality: item.Category,
          context: "",
          billing_unit: "1M tokens",
          input_per_1m: parsePrice(item.Input),
          cached_input_per_1m: parsePrice(item["Cached input"]),
          cache_write_per_1m: 0,
          output_per_1m: parsePrice(item.Output),
          unit_note: /free/i.test(item.Input || "") ? "Free" : "",
          fetched_at
        }));
      }
      i += 1;
    }
  }

  const byKey = new Map();
  for (const row of rows) byKey.set(row.pricing_key, row);
  return Array.from(byKey.values());
}

async function fetchOfficialOpenAiPricing() {
  const response = await fetch("https://developers.openai.com/api/docs/pricing.md");
  if (!response.ok) fail("Unable to fetch OpenAI pricing documentation", response.status);
  return parseOfficialOpenAiPricing(await response.text());
}

function getAiPricing() {
  const saved = getSetting("aiPricing");
  return Array.isArray(saved) && saved.length ? saved : [];
}

function aiPriceForModel(modelId, module = "text") {
  const pricing = getAiPricing();
  return pricing.find((row) => row.model === modelId && row.module === module && row.tier === "Standard" && row.context !== "long")
    || pricing.find((row) => row.model === modelId && row.module === module && row.tier === "Standard")
    || pricing.find((row) => row.model === modelId && row.tier === "Standard")
    || pricing.find((row) => row.model === modelId)
    || defaultAiModels.find((row) => row.id === modelId)
    || { input_per_1m: 0, cached_input_per_1m: 0, output_per_1m: 0, currency: "USD" };
}

function aiCostFromUsage(modelId, module, usage = {}) {
  const price = aiPriceForModel(modelId, module);
  const inputTokens = Number(usage.input_tokens || usage.prompt_tokens || 0);
  const outputTokens = Number(usage.output_tokens || usage.completion_tokens || 0);
  const cachedTokens = Number(usage.input_tokens_details?.cached_tokens || usage.prompt_tokens_details?.cached_tokens || 0);
  const billableInput = Math.max(inputTokens - cachedTokens, 0);
  const cost = (billableInput / 1000000) * Number(price.input_per_1m || 0)
    + (cachedTokens / 1000000) * Number(price.cached_input_per_1m || 0)
    + (outputTokens / 1000000) * Number(price.output_per_1m || 0);
  return {
    model: modelId,
    module,
    input_tokens: inputTokens,
    cached_input_tokens: cachedTokens,
    output_tokens: outputTokens,
    currency: price.currency || "USD",
    estimated_cost: Number(cost.toFixed(8)),
    pricing_snapshot: price
  };
}

function logAiUsage(payload) {
  const now = new Date().toISOString();
  return createRecord("ai_usage_logs", { created_at: now, ...payload });
}

function aiUsageSummary() {
  const logs = entityRows("ai_usage_logs").slice(0, 250);
  const total = logs.reduce((sum, item) => sum + Number(item.estimated_cost || 0), 0);
  return {
    logs,
    total_estimated_cost: Number(total.toFixed(8)),
    currency: logs.find((item) => item.currency)?.currency || "USD"
  };
}

function catalogContext() {
  return {
    categories: activeRows("categories").map(({ id, name_en, name_ar, slug }) => ({ id, name_en, name_ar, slug })),
    brands: activeRows("brands").map(({ id, name_en, name_ar, slug }) => ({ id, name_en, name_ar, slug })),
    colors: activeRows("colors").map((row) => ({ id: row.id, name_en: row.name_en || row.nameEn, name_ar: row.name_ar || row.nameAr, color: row.color })),
    options: activeRows("options").map((row) => ({ id: row.id, name_en: row.name_en || row.nameEn, name_ar: row.name_ar || row.nameAr }))
  };
}

function fallbackProductAnalysis(imageUrl) {
  const catalog = catalogContext();
  const category = catalog.categories[0] || null;
  const brand = catalog.brands.find((item) => String(item.slug || "").toLowerCase() === "others") || catalog.brands[0] || null;
  return {
    image_url: imageUrl,
    source: "fallback",
    product: {
      name_en: "Product from uploaded image",
      name_ar: "منتج من الصورة المرفوعة",
      short_description_en: "AI setup is ready. Add an OpenAI key to generate richer product copy from the image.",
      short_description_ar: "إعدادات الذكاء الاصطناعي جاهزة. أضف مفتاح OpenAI لتوليد بيانات أدق من الصورة.",
      description_en: "Suggested placeholder until AI analysis is enabled.",
      description_ar: "اقتراح مؤقت حتى يتم تفعيل تحليل الذكاء الاصطناعي.",
      category_id: category?.id || null,
      category_name_en: category?.name_en || "",
      category_name_ar: category?.name_ar || "",
      brand_id: brand?.id || null,
      brand_name_en: brand?.name_en || "Others",
      brand_name_ar: brand?.name_ar || "أخرى",
      colors: [],
      options: []
    },
    suggestions: {
      create_categories: category ? [] : [{ name_en: "Accessories", name_ar: "إكسسوارات", slug: "accessories" }],
      create_brands: [],
      create_colors: [],
      create_options: []
    },
    generated_image_slots: [
      { type: "front", status: "inactive", prompt: "Generate a clean front product image matching the uploaded item." },
      { type: "side", status: "inactive", prompt: "Generate a side-angle product image matching the uploaded item." },
      { type: "detail", status: "inactive", prompt: "Generate a close-up detail image matching the uploaded item." },
      { type: "lifestyle", status: "inactive", prompt: "Generate a lifestyle image for the same product." }
    ]
  };
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
}

function latestAiProductDraft(context = "product-new") {
  return entityRows("ai_product_drafts")
    .find((draft) => draft.context === context) || null;
}

function saveAiProductDraft(payload = {}) {
  return createRecord("ai_product_drafts", {
    context: payload.context || "product-new",
    product_id: payload.product_id || null,
    image_url: payload.image_url || payload.result?.image_url || "",
    result: payload.result || {},
    generated_images: payload.generated_images || [],
    updated_at: new Date().toISOString()
  });
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createCatalogSuggestion(type, payload = {}) {
  const map = {
    category: { entity: "categories", imageField: "image_url" },
    categories: { entity: "categories", imageField: "image_url" },
    brand: { entity: "brands", imageField: "logo_url" },
    brands: { entity: "brands", imageField: "logo_url" },
    color: { entity: "colors" },
    colors: { entity: "colors" },
    option: { entity: "options" },
    options: { entity: "options" }
  };
  const target = map[type];
  if (!target) fail("Unsupported suggestion type");
  const nameEn = payload.name_en || payload.nameEn || payload.name || "";
  const nameAr = payload.name_ar || payload.nameAr || payload.name || "";
  const record = createRecord(target.entity, {
    name_en: nameEn,
    name_ar: nameAr,
    nameEn,
    nameAr,
    slug: payload.slug || slugify(nameEn || nameAr),
    color: payload.hex || payload.color || "",
    is_active: true,
    isActive: true
  });
  return { entity: target.entity, record };
}

function productSeoPayload(product) {
  return {
    id: product.id,
    name_en: product.name_en,
    name_ar: product.name_ar,
    slug: product.slug,
    short_description_en: product.short_description_en,
    short_description_ar: product.short_description_ar,
    description_en: product.description_en,
    description_ar: product.description_ar,
    category_slug: product.category_slug,
    brand_slug: product.brand_slug,
    price: product.price
  };
}

function collectImageUrls(value, urls = new Set()) {
  if (!value) return urls;
  if (typeof value === "string") {
    if (value.startsWith("/uploads/")) urls.add(value.split(/[?#]/)[0]);
    return urls;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectImageUrls(item, urls));
    return urls;
  }
  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectImageUrls(item, urls));
  }
  return urls;
}

function imageUsageIndex() {
  const usage = new Map();
  const add = (url, item) => {
    if (!url) return;
    const clean = String(url).split(/[?#]/)[0];
    if (!clean.startsWith("/uploads/")) return;
    if (!usage.has(clean)) usage.set(clean, []);
    usage.get(clean).push(item);
  };

  for (const entity of ["products", "categories", "brands", "content", "pages"]) {
    for (const row of entityRows(entity, true)) {
      const urls = collectImageUrls(row);
      urls.forEach((url) => add(url, {
        entity,
        id: row.id,
        label: row.name_en || row.name_ar || row.title_en || row.title_ar || `${entity} #${row.id}`,
        is_deleted: Boolean(row.is_deleted)
      }));
    }
  }

  for (const key of ["companyInfo", "robotsTxt", "aiSetup"]) {
    const urls = collectImageUrls(getSetting(key));
    urls.forEach((url) => add(url, { entity: "settings", id: key, label: key, is_deleted: false }));
  }

  for (const row of entityRows("ai_usage_logs", true)) {
    collectImageUrls(row).forEach((url) => add(url, {
      entity: "ai_usage_logs",
      id: row.id,
      label: row.action || `AI log #${row.id}`,
      is_deleted: false
    }));
  }

  return usage;
}

function fileToGalleryItem(filePath, usageIndex) {
  const relative = filePath.slice(path.join(__dirname, "public").length).replaceAll(path.sep, "/");
  const stat = fs.statSync(filePath);
  const usage = usageIndex.get(relative) || [];
  return {
    id: crypto.createHash("sha1").update(relative).digest("hex"),
    url: relative,
    filename: path.basename(filePath),
    folder: path.dirname(relative).replace("/uploads", "") || "/",
    size: stat.size,
    created_at: stat.birthtime.toISOString(),
    updated_at: stat.mtime.toISOString(),
    usage,
    usage_count: usage.length,
    is_orphan: usage.length === 0,
    is_linked_to_deleted: usage.length > 0 && usage.every((item) => item.is_deleted)
  };
}

function listUploadImageFiles(dir = path.join(__dirname, "public", "uploads"), files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "optimized") continue;
      listUploadImageFiles(fullPath, files);
    } else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function listGalleryImages({ includeTrash = false, onlyUnused = false } = {}) {
  const usage = imageUsageIndex();
  const deleted = new Set(entityRows("image_gallery_deleted", true).map((row) => row.url));
  return listUploadImageFiles()
    .map((file) => fileToGalleryItem(file, usage))
    .filter((item) => includeTrash || !deleted.has(item.url))
    .filter((item) => !onlyUnused || item.is_orphan || item.is_linked_to_deleted)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function galleryImageById(id) {
  return listGalleryImages({ includeTrash: true }).find((item) => item.id === id || item.url === id);
}

function deleteGalleryImage(id) {
  const image = galleryImageById(id);
  if (!image) fail("Image not found", 404);
  if (!image.is_orphan && !image.is_linked_to_deleted) fail("Image is still linked to active content");
  const filePath = path.join(__dirname, "public", image.url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  createRecord("image_gallery_deleted", { url: image.url, deleted_at: new Date().toISOString() });
  return image;
}

function productAuditTargets(req, limit = 3) {
  const products = storeProductRows().slice(0, limit);
  return [
    { label: "Homepage", label_ar: "الرئيسية", url: publicStoreUrl("/") },
    { label: "Products listing", label_ar: "صفحة المنتجات", url: publicStoreUrl("/products") },
    ...products.map((product) => ({
      label: product.name_en || `Product ${product.id}`,
      label_ar: product.name_ar || `منتج ${product.id}`,
      url: publicStoreUrl(`/product/${product.id}`)
    }))
  ];
}

function normalizedAuditUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) fail("Audit URL is required");
  let url;
  try {
    url = /^https?:\/\//i.test(raw) ? new URL(raw) : new URL(raw.startsWith("/") ? raw : `/${raw}`, publicStoreUrl("/"));
  } catch {
    fail("Audit URL is invalid");
  }
  if (!["http:", "https:"].includes(url.protocol)) fail("Only http and https URLs can be tested");
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) fail("Use the public website domain from Settings, not a local URL");
  return url.toString();
}

function auditTargetFromRequest(body = {}) {
  const mode = body.mode || "homepage";
  if (mode === "products") {
    return { label: "Products listing", label_ar: "صفحة المنتجات", url: publicStoreUrl("/products") };
  }
  if (mode === "product") {
    const product = findProduct(body.productId);
    if (!product) fail("Product was not found", 404);
    return {
      label: product.name_en || `Product ${product.id}`,
      label_ar: product.name_ar || `منتج ${product.id}`,
      url: publicStoreUrl(`/product/${product.id}`)
    };
  }
  if (mode === "custom") {
    const url = normalizedAuditUrl(body.url);
    return {
      label: body.label || "Custom page",
      label_ar: body.label_ar || "صفحة مخصصة",
      url
    };
  }
  return { label: "Homepage", label_ar: "الرئيسية", url: publicStoreUrl("/") };
}

async function ensureAuditPageAvailable(target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(target.url, { method: "GET", redirect: "follow", signal: controller.signal });
    if (response.status >= 400) fail(`Page is not available for testing: ${response.status}`, 404);
  } catch (error) {
    if (error.status) throw error;
    fail("Page is not available for testing", 404);
  } finally {
    clearTimeout(timeout);
  }
}

function categoryScore(categories, key) {
  const value = categories?.[key]?.score;
  return typeof value === "number" ? Math.round(value * 100) : null;
}

function metricDisplay(audits, key) {
  return audits?.[key]?.displayValue || "";
}

async function runLighthouseAudit(target) {
  const chrome = await launch({
    chromePath: process.env.CHROME_PATH,
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });
  try {
    const result = await lighthouse(target.url, {
      port: chrome.port,
      output: "html",
      logLevel: "error",
      onlyCategories: ["performance", "seo", "accessibility", "best-practices"]
    });
    const lhr = result.lhr;
    const slug = target.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "audit";
    const filename = `${Date.now()}-${slug}.html`;
    const reportPath = path.join(__dirname, "public", "lighthouse-reports", filename);
    const report = Array.isArray(result.report) ? result.report[0] : result.report;
    fs.writeFileSync(reportPath, report || "", "utf8");
    return {
      ...target,
      report_url: `/lighthouse-reports/${filename}`,
      fetched_at: new Date().toISOString(),
      scores: {
        performance: categoryScore(lhr.categories, "performance"),
        seo: categoryScore(lhr.categories, "seo"),
        accessibility: categoryScore(lhr.categories, "accessibility"),
        best_practices: categoryScore(lhr.categories, "best-practices")
      },
      metrics: {
        first_contentful_paint: metricDisplay(lhr.audits, "first-contentful-paint"),
        largest_contentful_paint: metricDisplay(lhr.audits, "largest-contentful-paint"),
        total_blocking_time: metricDisplay(lhr.audits, "total-blocking-time"),
        cumulative_layout_shift: metricDisplay(lhr.audits, "cumulative-layout-shift"),
        speed_index: metricDisplay(lhr.audits, "speed-index")
      }
    };
  } finally {
    await chrome.kill();
  }
}

function activeRows(entity) {
  return entityRows(entity).filter((row) => row.is_active !== false && row.isActive !== false && row.active !== false);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizedProductVariant(variant = {}, index = 0) {
  const color = String(variant.color || variant.color_name || "").trim();
  const option = String(variant.option || variant.option_name || "").trim();
  const value = String(variant.value || variant.option_value || "").trim();
  const type = variant.type || (color && option ? "color_option" : color ? "color" : "option");
  const isInStock = variant.is_in_stock !== false && variant.in_stock !== false && variant.stock_status !== "out_of_stock";
  const stableFallbackId = `variant-${crypto.createHash("sha256").update(JSON.stringify([color, option, value, variant.sku || "", variant.barcode || "", index])).digest("hex").slice(0, 12)}`;
  return {
    id: variant.id || stableFallbackId,
    type,
    color,
    color_id: variant.color_id || null,
    hex_code: validSwatchHex(variant.hex_code || variant.color_hex || variant.hex),
    option,
    value,
    sku: String(variant.sku || "").trim().toUpperCase(),
    barcode: String(variant.barcode || "").trim(),
    image_url: String(variant.image_url || variant.image || "").trim(),
    price: variant.price === "" || variant.price === null || variant.price === undefined ? null : Number(variant.price || 0),
    compare_at_price: variant.compare_at_price === "" || variant.compare_at_price === null || variant.compare_at_price === undefined ? null : Number(variant.compare_at_price || 0),
    cost: variant.cost === "" || variant.cost === null || variant.cost === undefined ? 0 : Number(variant.cost || 0),
    price_adjustment: Number(variant.price_adjustment || variant.price_delta || 0),
    weight: variant.weight === "" || variant.weight === null || variant.weight === undefined ? null : Math.max(0, Number(variant.weight || 0)),
    stock: variant.stock === "" || variant.stock === null || variant.stock === undefined || Number(variant.stock || 0) === 0 ? null : Number(variant.stock || 0),
    is_in_stock: isInStock,
    stock_status: isInStock ? "in_stock" : "out_of_stock",
    is_active: variant.is_active !== false && variant.isActive !== false && variant.active !== false,
    sort_order: Number(variant.sort_order || index)
  };
}

function normalizeProductPayload(payload = {}) {
  const variants = asArray(payload.variants).map(normalizedProductVariant).filter((variant) => variant.color || variant.option || variant.value);
  const nullableNumber = (value) => value === "" || value === null || value === undefined || Number(value) <= 0 ? null : Number(value);
  return {
    ...payload,
    sku: String(payload.sku || "").trim().toUpperCase(),
    barcode: String(payload.barcode || "").trim(),
    cost: Number(payload.cost || 0),
    stock: payload.stock === "" || payload.stock === null || payload.stock === undefined || Number(payload.stock || 0) === 0 ? null : Number(payload.stock || 0),
    goods_type_id: String(payload.goods_type_id || "").trim(),
    shipping_profile_id: String(payload.shipping_profile_id || "").trim(),
    requires_shipping: payload.requires_shipping !== false && payload.requires_shipping !== "false",
    weight: nullableNumber(payload.weight),
    length: nullableNumber(payload.length),
    width: nullableNumber(payload.width),
    height: nullableNumber(payload.height),
    origin_country_code: String(payload.origin_country_code || "").trim().toUpperCase(),
    hs_code: String(payload.hs_code || "").trim(),
    shipping_data_source: ["manual", "imported", "estimated", "profile"].includes(payload.shipping_data_source) ? payload.shipping_data_source : "profile",
    variants,
    active_variants: variants.filter((variant) => variant.is_active !== false),
    generated_images: asArray(payload.generated_images)
  };
}

function effectiveVariantPrice(product = {}, variant = null) {
  const basePrice = Number(product.sale_price ?? product.price ?? 0);
  if (variant?.price !== null && variant?.price !== undefined && variant?.price !== "") return Number(variant.price);
  return Number((basePrice + Number(variant?.price_adjustment || variant?.price_delta || 0)).toFixed(2));
}

function generatedCatalogSku(product, index = 0) {
  const stem = String(product.slug || product.category_slug || "PRODUCT")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 18) || "PRODUCT";
  return `${stem}-${String(product.id || index + 1).padStart(4, "0")}`;
}

function inferredShippingProfile(product = {}) {
  const haystack = `${product.category_slug || ""} ${product.name_ar || ""} ${product.name_en || ""}`.toLowerCase();
  if (/طقم|اطقم|set/.test(haystack)) return "prayer-set";
  if (/سجاد|سجادة|mat|rug/.test(haystack)) return "prayer-mat";
  return "apparel-light";
}

function migrateCommerceFoundation() {
  const version = Number(getSetting("commerceFoundationVersion") || 0);
  if (version >= 1) return;
  setSetting("countries", normalizeCountries({ countries: getSetting("countries") || defaultCountries }));
  setSetting("goodsTypes", normalizeGoodsTypes({ goods_types: getSetting("goodsTypes") || defaultGoodsTypes }));
  setSetting("shippingProfiles", normalizeShippingProfiles({ shipping_profiles: getSetting("shippingProfiles") || defaultShippingProfiles }));
  setSetting("marketSettings", normalizeMarketSettings({ ...defaultMarketSettings, ...(getSetting("marketSettings") || {}), updated_at: new Date().toISOString() }));
  const currencySettings = normalizeCurrencies(getSetting("currencies") || {});
  if (!currencySettings.base_currency) currencySettings.base_currency = "SAR";
  setSetting("currencies", currencySettings);

  const products = entityRows("products");
  for (const product of products) {
    const sku = String(product.sku || "").trim().toUpperCase() || generatedCatalogSku(product);
    const variants = asArray(product.variants).map((variant, index) => ({
      ...variant,
      sku: String(variant.sku || "").trim().toUpperCase() || `${sku}-V${String(index + 1).padStart(2, "0")}`
    }));
    updateProductRecord(product.id, {
      ...product,
      sku,
      variants,
      goods_type_id: product.goods_type_id || "normal",
      shipping_profile_id: product.shipping_profile_id || inferredShippingProfile(product),
      requires_shipping: product.requires_shipping !== false,
      origin_country_code: product.origin_country_code || "SA",
      shipping_data_source: product.weight ? (product.shipping_data_source || "imported") : "estimated"
    });
  }
  setSetting("commerceFoundationVersion", 1);
}

migrateCommerceFoundation();

function normalizeDiscountPayload(payload = {}) {
  const type = ["percentage", "fixed", "free_shipping"].includes(payload.type) ? payload.type : "percentage";
  const appliesTo = ["all_products", "products", "categories"].includes(payload.applies_to) ? payload.applies_to : "all_products";
  return {
    code: String(payload.code || "").trim().toUpperCase(),
    name_en: String(payload.name_en || payload.name || payload.code || "").trim(),
    name_ar: String(payload.name_ar || payload.name || payload.code || "").trim(),
    type,
    value: Number(payload.value || 0),
    starts_at: payload.starts_at || null,
    ends_at: payload.ends_at || null,
    usage_limit: payload.usage_limit === "" || payload.usage_limit === null || payload.usage_limit === undefined ? null : Number(payload.usage_limit || 0),
    used_count: Number(payload.used_count || 0),
    minimum_order_total: Number(payload.minimum_order_total || 0),
    applies_to: appliesTo,
    product_ids: asArray(payload.product_ids).map((id) => Number(id)).filter(Boolean),
    category_slugs: asArray(payload.category_slugs).map(String).filter(Boolean),
    trigger_mode: payload.trigger_mode === "automatic" ? "automatic" : "code",
    combination_group: ["product", "order", "bundle", "shipping", "gift"].includes(payload.combination_group) ? payload.combination_group : (type === "free_shipping" ? "shipping" : "order"),
    stacking_policy: ["exclusive", "same_group_blocked", "selected_only", "stackable", "best_offer"].includes(payload.stacking_policy) ? payload.stacking_policy : "same_group_blocked",
    compatible_discount_ids: asArray(payload.compatible_discount_ids).map(Number).filter(Boolean),
    priority: Number(payload.priority || 100),
    applies_to_bundles: payload.applies_to_bundles !== false,
    allow_guests: payload.allow_guests !== false,
    per_customer_limit: Math.max(0, Number(payload.per_customer_limit ?? 1)),
    usage_identity: asArray(payload.usage_identity).length ? asArray(payload.usage_identity).filter((item) => ["guest", "user", "email", "phone", "payment"].includes(item)) : ["guest", "user", "email", "phone"],
    first_order_only: payload.first_order_only === true,
    is_active: payload.is_active !== false && payload.isActive !== false && payload.active !== false
  };
}

function discountStatus(discount = {}, now = new Date()) {
  if (discount.is_active === false || discount.isActive === false || discount.active === false) return "disabled";
  const startsAt = discount.starts_at ? new Date(discount.starts_at) : null;
  const endsAt = discount.ends_at ? new Date(discount.ends_at) : null;
  const usageLimit = discount.usage_limit === null || discount.usage_limit === undefined || discount.usage_limit === "" ? null : Number(discount.usage_limit || 0);
  if (usageLimit && Number(discount.used_count || 0) >= usageLimit) return "used_up";
  if (startsAt && now < startsAt) return "scheduled";
  if (endsAt && now > endsAt) return "expired";
  if (endsAt && endsAt.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) return "expiring_soon";
  return "active";
}

function discountWithStatus(discount = {}) {
  const normalized = normalizeDiscountPayload(discount);
  return {
    ...discount,
    ...normalized,
    status: discountStatus(normalized),
    remaining_ms: normalized.ends_at ? Math.max(new Date(normalized.ends_at).getTime() - Date.now(), 0) : null
  };
}

function normalizeDiscountSlug(value) {
  const slug = String(value || "").trim().toLowerCase();
  if (!slug) return "";
  return slug.replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "");
}

function discountSlugVariants(value) {
  const slug = normalizeDiscountSlug(value);
  if (!slug) return [];
  const variants = new Set([slug]);
  if (slug.endsWith("ies")) variants.add(`${slug.slice(0, -3)}y`);
  if (slug.endsWith("s")) variants.add(slug.slice(0, -1));
  else variants.add(`${slug}s`);
  return Array.from(variants).filter(Boolean);
}

function productCategorySlugs(productIds = []) {
  const slugs = new Set();
  const categories = entityRows("categories");
  productIds.map(Number).filter(Boolean).forEach((id) => {
    const product = findProduct(id) || entityRows("products").find((item) => Number(item.id) === id);
    if (!product) return;
    [
      product.category_slug,
      product.categorySlug,
      product.category?.slug,
      categories.find((cat) => Number(cat.id) === Number(product.category_id || product.categoryId))?.slug
    ].forEach((slug) => discountSlugVariants(slug).forEach((item) => slugs.add(item)));
  });
  return Array.from(slugs);
}

function validateDiscountCode({ code, order_total = 0, product_ids = [], category_slugs = [], items = [] } = {}) {
  const cleanCode = String(code || "").trim().toUpperCase();
  const discount = entityRows("discounts").map(discountWithStatus).find((item) => item.code === cleanCode);
  if (!discount) fail("Discount code was not found", 404);
  if (!["active", "expiring_soon"].includes(discount.status)) fail("Discount code is not active");
  const itemProductIds = asArray(items).flatMap((item) => {
    const direct = Number(item.product_id || item.productId || item.product?.id || 0);
    const bundle = (item.bundle_id || item.bundleId) ? findBundle(item.bundle_id || item.bundleId) : null;
    return [direct, ...(bundle?.items || []).map((component) => component.product_id)];
  });
  const requestProductIds = [...product_ids, ...itemProductIds].map(Number).filter(Boolean);
  const requestCategorySlugs = [
    ...category_slugs.flatMap(discountSlugVariants),
    ...asArray(items).flatMap((item) => [item.category_slug, item.categorySlug]).flatMap(discountSlugVariants),
    ...productCategorySlugs(requestProductIds)
  ];
  const discountCategorySlugs = discount.category_slugs.flatMap(discountSlugVariants);
  if (discount.applies_to === "products" && discount.product_ids.length && !requestProductIds.some((id) => discount.product_ids.includes(id))) fail("Discount does not apply to these products");
  if (discount.applies_to === "categories") {
    if (discountCategorySlugs.length && !requestCategorySlugs.some((slug) => discountCategorySlugs.includes(slug))) fail("Discount does not apply to these categories");
    if (discount.product_ids.length && !requestProductIds.some((id) => discount.product_ids.includes(id))) fail("Discount does not apply to these products");
  }
  const normalizedItems = asArray(items).map((item, index) => {
    const bundleId = Number(item.bundle_id || item.bundleId || 0);
    const bundle = bundleId ? findBundle(bundleId) : null;
    const productId = Number(item.product_id || item.productId || item.product?.id || 0);
    const product = findProduct(productId) || entityRows("products").find((entry) => Number(entry.id) === productId);
    const productVariants = product ? normalizeProductPayload(product).variants : [];
    const variantId = item.variant_id || item.variantId || item.optionId || null;
    const variant = productVariants.find((entry) => String(entry.id) === String(variantId));
    const submittedPrice = Number(item.price ?? item.variantPrice ?? item.product?.price ?? 0);
    const catalogPrice = bundle ? Number(bundle.price || 0) : Number(variant?.price || 0) || Number(product?.sale_price || product?.price || 0) || submittedPrice;
    const catalogCost = bundle ? Number(bundle.cost || 0) : Number(variant?.cost || product?.cost || 0);
    const quantity = Math.max(1, Number(item.quantity || 1));
    const bundleProductIds = (bundle?.items || []).map((component) => Number(component.product_id)).filter(Boolean);
    const bundleCategorySlugs = productCategorySlugs(bundleProductIds);
    return {
      key: String(item.key || (bundle ? `bundle:${bundle.id}` : [productId, item.colorId || "", variantId || "", index].join(":"))),
      item_type: bundle ? "bundle" : "product",
      bundle_id: bundle ? Number(bundle.id) : null,
      bundle_product_ids: bundleProductIds,
      product_id: productId,
      variant_id: variantId,
      name_ar: String(item.name_ar || bundle?.name_ar || product?.name_ar || product?.model_ar || ""),
      name_en: String(item.name_en || bundle?.name_en || product?.name_en || product?.model_en || ""),
      category_slugs: [item.category_slug, item.categorySlug, product?.category_slug, product?.category?.slug, ...productCategorySlugs([productId]), ...bundleCategorySlugs].flatMap(discountSlugVariants),
      unit_price: Math.max(0, catalogPrice),
      quantity,
      subtotal: Math.max(0, catalogPrice * quantity),
      cost_total: Math.max(0, catalogCost * quantity)
    };
  }).filter((item) => item.product_id || item.bundle_id);
  const evaluatedItems = normalizedItems.map((item) => {
    let eligible = true;
    let reason = "eligible";
    if (discount.applies_to === "products" && discount.product_ids.length) {
      const targeted = item.item_type === "bundle"
        ? item.bundle_product_ids.length > 0 && item.bundle_product_ids.every((id) => discount.product_ids.includes(id))
        : discount.product_ids.includes(item.product_id);
      if (!targeted) { eligible = false; reason = "product_not_eligible"; }
    }
    if (discount.applies_to === "categories") {
      const categoryMatches = item.item_type === "bundle"
        ? item.bundle_product_ids.length > 0 && item.bundle_product_ids.every((id) => productCategorySlugs([id]).some((slug) => discountCategorySlugs.includes(slug)))
        : item.category_slugs.some((slug) => discountCategorySlugs.includes(slug));
      if (discountCategorySlugs.length && !categoryMatches) {
        eligible = false;
        reason = "category_not_eligible";
      } else if (discount.product_ids.length && (item.item_type === "bundle" ? !item.bundle_product_ids.every((id) => discount.product_ids.includes(id)) : !discount.product_ids.includes(item.product_id))) {
        eligible = false;
        reason = "product_not_eligible";
      }
    }
    return { ...item, eligible, reason, discount_amount: 0, final_subtotal: item.subtotal };
  });
  const eligibleItems = evaluatedItems.filter((item) => item.eligible);
  if (normalizedItems.length && !eligibleItems.length) fail(discount.applies_to === "products" ? "Discount does not apply to these products" : "Discount does not apply to these categories");
  const eligibleSubtotal = normalizedItems.length ? eligibleItems.reduce((sum, item) => sum + item.subtotal, 0) : Number(order_total || 0);
  if (eligibleSubtotal < Number(discount.minimum_order_total || 0)) fail("Eligible subtotal does not meet the discount minimum");

  if (discount.type === "percentage") {
    eligibleItems.forEach((item) => {
      item.discount_amount = Number(Math.min(item.subtotal, item.subtotal * discount.value / 100).toFixed(2));
    });
  } else if (discount.type === "fixed" && eligibleSubtotal > 0) {
    const targetCents = Math.round(Math.min(eligibleSubtotal, discount.value) * 100);
    const allocations = eligibleItems.map((item) => {
      const exact = targetCents * item.subtotal / eligibleSubtotal;
      return { item, cents: Math.floor(exact), remainder: exact - Math.floor(exact) };
    });
    let remaining = targetCents - allocations.reduce((sum, entry) => sum + entry.cents, 0);
    allocations.sort((a, b) => b.remainder - a.remainder).forEach((entry) => {
      if (remaining > 0) { entry.cents += 1; remaining -= 1; }
    });
    allocations.forEach(({ item, cents }) => { item.discount_amount = cents / 100; });
  }
  evaluatedItems.forEach((item) => { item.final_subtotal = Number(Math.max(0, item.subtotal - item.discount_amount).toFixed(2)); });
  const discountAmount = evaluatedItems.reduce((sum, item) => sum + item.discount_amount, 0);
  const cartSubtotal = normalizedItems.length ? evaluatedItems.reduce((sum, item) => sum + item.subtotal, 0) : Number(order_total || 0);
  return {
    discount,
    cart_subtotal: Number(cartSubtotal.toFixed(2)),
    eligible_subtotal: Number(eligibleSubtotal.toFixed(2)),
    ineligible_subtotal: Number(Math.max(0, cartSubtotal - eligibleSubtotal).toFixed(2)),
    discount_amount: Number(discountAmount.toFixed(2)),
    final_subtotal: Number(Math.max(0, cartSubtotal - discountAmount).toFixed(2)),
    eligible_product_ids: [...new Set(eligibleItems.map((item) => item.product_id))],
    line_discounts: evaluatedItems.map(({ category_slugs, ...item }) => item),
    free_shipping: discount.type === "free_shipping"
  };
}

function normalizePromotionPolicy(value = getSetting("promotionPolicy") || {}) {
  return {
    enabled: value.enabled !== false,
    max_manual_codes: Math.max(1, Number(value.max_manual_codes || 1)),
    max_automatic_promotions: Math.max(0, Number(value.max_automatic_promotions ?? 1)),
    allow_shipping_benefit: value.allow_shipping_benefit !== false,
    max_financial_discount_percent: Math.min(100, Math.max(0, Number(value.max_financial_discount_percent ?? 30))),
    max_financial_discount_amount: value.max_financial_discount_amount === "" || value.max_financial_discount_amount === null || value.max_financial_discount_amount === undefined ? null : Math.max(0, Number(value.max_financial_discount_amount || 0)),
    never_below_cost: value.never_below_cost === true,
    reservation_minutes: Math.max(5, Number(value.reservation_minutes || 30)),
    bundle_extra_discounts: value.bundle_extra_discounts === true,
    default_stacking_policy: value.default_stacking_policy || "same_group_blocked",
    group_order: asArray(value.group_order).length ? asArray(value.group_order) : ["bundle", "product", "order", "shipping", "gift"],
    updated_at: value.updated_at || null
  };
}

function promotionIdentities({ guest_hash = null, user_id = null, customer = {} } = {}) {
  return {
    guest_hash: guest_hash || null,
    user_id: user_id ? String(user_id) : null,
    email_hash: identityHash(customer.email),
    phone_hash: identityHash(customer.phone),
    payment_hash: identityHash(customer.payment_identity || customer.payment_token)
  };
}

function expirePromotionReservations() {
  db.prepare("UPDATE promo_redemptions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE status = 'reserved' AND reserved_until < ?").run(new Date().toISOString());
}

function matchingPromotionRedemptions(discount, identities, statuses = ["used", "reserved"]) {
  expirePromotionReservations();
  const clauses = [];
  const params = [Number(discount.id), ...statuses];
  const enabled = new Set(discount.usage_identity || []);
  if (enabled.has("guest") && identities.guest_hash) { clauses.push("guest_hash = ?"); params.push(identities.guest_hash); }
  if (enabled.has("user") && identities.user_id) { clauses.push("user_id = ?"); params.push(identities.user_id); }
  if (enabled.has("email") && identities.email_hash) { clauses.push("email_hash = ?"); params.push(identities.email_hash); }
  if (enabled.has("phone") && identities.phone_hash) { clauses.push("phone_hash = ?"); params.push(identities.phone_hash); }
  if (enabled.has("payment") && identities.payment_hash) { clauses.push("payment_hash = ?"); params.push(identities.payment_hash); }
  if (!clauses.length) return [];
  return db.prepare(`SELECT * FROM promo_redemptions WHERE discount_id = ? AND status IN (${statuses.map(() => "?").join(",")}) AND (${clauses.join(" OR ")}) ORDER BY id DESC`).all(...params);
}

function assertPromotionUsage(discount, identities, { allowOwnReservation = true } = {}) {
  if (!discount.allow_guests && !identities.user_id) fail("PROMO_GUESTS_NOT_ALLOWED");
  const limit = Number(discount.per_customer_limit || 0);
  if (discount.first_order_only) {
    const priorOrder = entityRows("orders").find((order) => {
      const saved = order.customer_identity || {};
      return (identities.user_id && saved.user_id === identities.user_id) ||
        (identities.email_hash && saved.email_hash === identities.email_hash) ||
        (identities.phone_hash && saved.phone_hash === identities.phone_hash) ||
        (identities.payment_hash && saved.payment_hash === identities.payment_hash) ||
        (identities.guest_hash && saved.guest_hash === identities.guest_hash);
    });
    if (priorOrder) fail("PROMO_FIRST_ORDER_ONLY");
  }
  if (!limit) return null;
  const matches = matchingPromotionRedemptions(discount, identities);
  const used = matches.filter((row) => row.status === "used");
  if (used.length >= limit) fail("PROMO_ALREADY_USED");
  const ownReservation = matches.find((row) => row.status === "reserved" && identities.guest_hash && row.guest_hash === identities.guest_hash);
  if (allowOwnReservation && ownReservation) return ownReservation;
  if (matches.filter((row) => row.status === "reserved").length + used.length >= limit) fail("PROMO_CURRENTLY_RESERVED");
  return null;
}

function reservePromotion(discount, identities, policy) {
  const existing = assertPromotionUsage(discount, identities, { allowOwnReservation: true });
  const reservedUntil = new Date(Date.now() + policy.reservation_minutes * 60 * 1000).toISOString();
  if (existing) {
    db.prepare("UPDATE promo_redemptions SET reserved_until = ?, email_hash = COALESCE(?, email_hash), phone_hash = COALESCE(?, phone_hash), payment_hash = COALESCE(?, payment_hash), user_id = COALESCE(?, user_id), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(reservedUntil, identities.email_hash, identities.phone_hash, identities.payment_hash, identities.user_id, existing.id);
    return existing.id;
  }
  return Number(db.prepare("INSERT INTO promo_redemptions (discount_id, discount_code, guest_hash, user_id, email_hash, phone_hash, payment_hash, status, reserved_until) VALUES (?, ?, ?, ?, ?, ?, ?, 'reserved', ?)")
    .run(Number(discount.id), discount.code, identities.guest_hash, identities.user_id, identities.email_hash, identities.phone_hash, identities.payment_hash, reservedUntil).lastInsertRowid);
}

function promotionCompatible(candidate, accepted = []) {
  if (!accepted.length) return { compatible: true };
  if (candidate.stacking_policy === "exclusive" || accepted.some((item) => item.discount.stacking_policy === "exclusive")) return { compatible: false, reason: "PROMO_EXCLUSIVE_CONFLICT" };
  const sameGroup = accepted.find((item) => item.discount.combination_group === candidate.combination_group);
  if (sameGroup && [candidate.stacking_policy, sameGroup.discount.stacking_policy].some((policy) => ["same_group_blocked", "best_offer"].includes(policy))) return { compatible: false, reason: "PROMO_SAME_GROUP_CONFLICT" };
  if (candidate.stacking_policy === "selected_only" && !accepted.every((item) => candidate.compatible_discount_ids.includes(Number(item.discount.id)))) return { compatible: false, reason: "PROMO_NOT_COMPATIBLE" };
  if (accepted.some((item) => item.discount.stacking_policy === "selected_only" && !item.discount.compatible_discount_ids.includes(Number(candidate.id)))) return { compatible: false, reason: "PROMO_NOT_COMPATIBLE" };
  return { compatible: true };
}

function evaluatePromotions({ codes = [], code = "", order_total = 0, product_ids = [], category_slugs = [], items = [], customer = {}, identity = {}, reserve = false } = {}) {
  const policy = normalizePromotionPolicy();
  const manualCodes = [...new Set([...(Array.isArray(codes) ? codes : []), code].map((item) => String(item || "").trim().toUpperCase()).filter(Boolean))];
  const rejected = [];
  const allowedCodes = manualCodes.slice(0, policy.max_manual_codes);
  manualCodes.slice(policy.max_manual_codes).forEach((item) => rejected.push({ code: item, reason: "PROMO_MANUAL_LIMIT" }));
  const automatic = entityRows("discounts").map(discountWithStatus).filter((item) => item.trigger_mode === "automatic" && ["active", "expiring_soon"].includes(item.status)).slice(0, policy.max_automatic_promotions);
  const candidates = [];
  for (const entry of [...allowedCodes.map((item) => ({ code: item, automatic: false })), ...automatic.map((item) => ({ code: item.code, automatic: true }))]) {
    try {
      const result = validateDiscountCode({ code: entry.code, order_total, product_ids, category_slugs, items });
      if (!result.discount.applies_to_bundles && result.line_discounts.some((line) => line.item_type === "bundle" && line.eligible)) fail("PROMO_BUNDLE_NOT_ALLOWED");
      if (!policy.bundle_extra_discounts && result.discount.combination_group === "product" && result.line_discounts.some((line) => line.item_type === "bundle" && line.eligible)) fail("PROMO_BUNDLE_NOT_ALLOWED");
      assertPromotionUsage(result.discount, promotionIdentities({ ...identity, customer }), { allowOwnReservation: true });
      candidates.push({ ...result, automatic: entry.automatic });
    } catch (error) {
      rejected.push({ code: entry.code, reason: error.message });
    }
  }
  candidates.sort((a, b) => {
    const sameGroup = a.discount.combination_group === b.discount.combination_group;
    const bestOffer = [a.discount.stacking_policy, b.discount.stacking_policy].includes("best_offer");
    if (sameGroup && bestOffer) return Number(b.discount_amount || 0) - Number(a.discount_amount || 0);
    return Number(b.discount.priority || 0) - Number(a.discount.priority || 0) || Number(b.discount_amount || 0) - Number(a.discount_amount || 0);
  });
  const accepted = [];
  for (const candidate of candidates) {
    const check = promotionCompatible(candidate.discount, accepted);
    if (!check.compatible) rejected.push({ code: candidate.discount.code, discount_id: candidate.discount.id, reason: check.reason });
    else if (candidate.free_shipping && !policy.allow_shipping_benefit) rejected.push({ code: candidate.discount.code, discount_id: candidate.discount.id, reason: "PROMO_SHIPPING_DISABLED" });
    else accepted.push(candidate);
  }
  const subtotal = Number(candidates[0]?.cart_subtotal ?? order_total ?? 0);
  const financial = accepted.filter((item) => !item.free_shipping);
  const rawDiscount = financial.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);
  const percentCap = subtotal * policy.max_financial_discount_percent / 100;
  const amountCap = policy.max_financial_discount_amount === null ? Infinity : policy.max_financial_discount_amount;
  const costFloorCap = policy.never_below_cost && candidates[0]?.line_discounts?.length
    ? candidates[0].line_discounts.reduce((sum, line) => sum + Math.max(0, Number(line.subtotal || 0) - Number(line.cost_total || 0)), 0)
    : Infinity;
  const discountAmount = Number(Math.min(subtotal, rawDiscount, percentCap, amountCap, costFloorCap).toFixed(2));
  const scale = rawDiscount > 0 ? discountAmount / rawDiscount : 0;
  const lineMap = new Map();
  financial.forEach((promotion) => promotion.line_discounts.forEach((line) => {
    const current = lineMap.get(String(line.key)) || { ...line, discount_amount: 0, promotion_codes: [] };
    if (line.eligible && Number(line.discount_amount || 0) > 0) {
      current.discount_amount += Number(line.discount_amount || 0) * scale;
      current.promotion_codes.push(promotion.discount.code);
    }
    lineMap.set(String(line.key), current);
  }));
  const lineDiscounts = [...lineMap.values()].map((line) => {
    const { cost_total, ...publicLine } = line;
    const lineCap = policy.never_below_cost ? Math.max(0, Number(line.subtotal || 0) - Number(cost_total || 0)) : Number(line.subtotal || 0);
    const lineDiscount = Math.min(lineCap, Number(line.discount_amount || 0));
    return { ...publicLine, discount_amount: Number(lineDiscount.toFixed(2)), final_subtotal: Number(Math.max(0, line.subtotal - lineDiscount).toFixed(2)) };
  });
  const reservationIds = reserve ? accepted.map((item) => reservePromotion(item.discount, promotionIdentities({ ...identity, customer }), policy)) : [];
  return {
    policy,
    discount: accepted[0]?.discount || null,
    applied_promotions: accepted.map((item, index) => ({ discount_id: item.discount.id, code: item.discount.code, name_en: item.discount.name_en, name_ar: item.discount.name_ar, group: item.discount.combination_group, type: item.discount.type, discount_amount: Number((Number(item.discount_amount || 0) * scale).toFixed(2)), free_shipping: item.free_shipping, automatic: item.automatic, reservation_id: reservationIds[index] || null })),
    rejected_promotions: rejected,
    cart_subtotal: subtotal,
    eligible_subtotal: Number(financial.reduce((sum, item) => sum + Number(item.eligible_subtotal || 0), 0).toFixed(2)),
    discount_amount: discountAmount,
    final_subtotal: Number(Math.max(0, subtotal - discountAmount).toFixed(2)),
    line_discounts: lineDiscounts,
    free_shipping: accepted.some((item) => item.free_shipping)
  };
}

function finalizePromotionRedemptions(appliedPromotions, identities, orderId) {
  appliedPromotions.forEach((promotion) => {
    const discount = getRecord("discounts", promotion.discount_id);
    if (!discount) return;
    assertPromotionUsage({ ...normalizeDiscountPayload(discount), id: Number(discount.id) }, identities, { allowOwnReservation: true });
    const reservation = promotion.reservation_id ? db.prepare("SELECT * FROM promo_redemptions WHERE id = ?").get(promotion.reservation_id) : matchingPromotionRedemptions({ ...discount, id: promotion.discount_id, usage_identity: discount.usage_identity || ["guest", "user", "email", "phone"] }, identities, ["reserved"])[0];
    if (reservation) db.prepare("UPDATE promo_redemptions SET status = 'used', order_id = ?, email_hash = COALESCE(?, email_hash), phone_hash = COALESCE(?, phone_hash), payment_hash = COALESCE(?, payment_hash), user_id = COALESCE(?, user_id), updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(orderId, identities.email_hash, identities.phone_hash, identities.payment_hash, identities.user_id, reservation.id);
    else db.prepare("INSERT INTO promo_redemptions (discount_id, discount_code, guest_hash, user_id, email_hash, phone_hash, payment_hash, order_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'used')").run(promotion.discount_id, promotion.code, identities.guest_hash, identities.user_id, identities.email_hash, identities.phone_hash, identities.payment_hash, orderId);
    updateRecord("discounts", promotion.discount_id, { used_count: Number(discount.used_count || 0) + 1 });
  });
}

function productShippingSnapshot(product = {}, variant = null) {
  const normalized = normalizeProductPayload(product);
  const market = normalizeMarketSettings();
  const profiles = normalizeShippingProfiles();
  const goodsTypes = normalizeGoodsTypes();
  const profile = profiles.find((row) => row.id === normalized.shipping_profile_id)
    || profiles.find((row) => row.id === market.default_shipping_profile_id)
    || profiles.find((row) => row.is_default)
    || {};
  const goodsTypeId = normalized.goods_type_id || profile.goods_type_id || market.default_goods_type_id;
  const goodsType = goodsTypes.find((row) => row.id === goodsTypeId) || goodsTypes.find((row) => row.is_default) || {};
  const value = (productValue, profileValue) => productValue !== null && productValue !== undefined && productValue !== "" ? Number(productValue) : Number(profileValue || 0);
  return {
    requires_shipping: normalized.requires_shipping !== false && profile.requires_shipping !== false,
    shipping_profile_id: profile.id || null,
    shipping_profile_name: profile.name_en || profile.name_ar || null,
    goods_type_id: goodsType.id || goodsTypeId || "normal",
    goods_type_code: goodsType.code || "NORMAL",
    provider_goods_type: goodsType.provider_mapping?.imile || "Normal",
    weight: variant?.weight !== null && variant?.weight !== undefined ? Number(variant.weight) : value(normalized.weight, profile.weight),
    length: value(normalized.length, profile.length),
    width: value(normalized.width, profile.width),
    height: value(normalized.height, profile.height),
    weight_unit: market.weight_unit,
    dimension_unit: market.dimension_unit,
    origin_country_code: normalized.origin_country_code || profile.origin_country_code || market.default_country_code,
    hs_code: normalized.hs_code || null,
    data_source: [normalized.weight, normalized.length, normalized.width, normalized.height].some((entry) => Number(entry) > 0) ? normalized.shipping_data_source : "profile"
  };
}

function normalizeCheckoutCustomer(customer = {}) {
  const market = normalizeMarketSettings();
  const countryCode = String(customer.country_code || market.default_country_code || "SA").toUpperCase();
  const country = normalizeCountries().find((row) => row.code === countryCode);
  if (!country || !market.enabled_country_codes.includes(countryCode)) fail("Shipping country is not available");
  const suppliedFullName = String(customer.full_name || customer.name || "").trim();
  const suppliedParts = suppliedFullName.split(/\s+/).filter(Boolean);
  const firstName = String(customer.first_name || suppliedParts.shift() || "").trim();
  const lastName = String(customer.last_name || suppliedParts.join(" ") || "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const phoneRaw = String(customer.phone || "").trim().replace(/[\s()-]/g, "");
  let phone;
  if (countryCode === "SA") {
    let localPhone = phoneRaw.replace(/^\+?966/, "").replace(/^00966/, "").replace(/\D/g, "");
    if (localPhone.length === 10 && localPhone.startsWith("0")) localPhone = localPhone.slice(1);
    if (!/^5\d{8}$/.test(localPhone)) fail("INVALID_SAUDI_PHONE");
    phone = `+966${localPhone}`;
  } else {
    phone = phoneRaw.startsWith("+") ? phoneRaw : phoneRaw.startsWith("00") ? `+${phoneRaw.slice(2)}` : `${country.calling_code}${phoneRaw.replace(/^0+/, "")}`;
  }
  const verifiedAddress = countryCode === "SA" ? verifiedAddressFromToken(customer.address_verification_token, customer.short_address) : null;
  const addressSource = verifiedAddress ? { ...customer, ...verifiedAddress } : customer;
  const normalized = {
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    phone,
    alternate_phone: String(customer.alternate_phone || "").trim(),
    email: String(customer.email || "").trim().toLowerCase(),
    country_code: countryCode,
    province: String(addressSource.province || "").trim(),
    city: String(addressSource.city || "").trim(),
    district: String(addressSource.district || "").trim(),
    street: String(addressSource.street || addressSource.address || "").trim(),
    building_number: String(addressSource.building_number || "").trim(),
    postal_code: String(addressSource.postal_code || "").trim(),
    additional_number: String(addressSource.additional_number || "").trim(),
    short_address: normalizeSaudiShortAddress(addressSource.short_address),
    address_notes: String(customer.address_notes || customer.notes || "").trim(),
    latitude: addressSource.latitude === "" || addressSource.latitude === undefined ? null : Number(addressSource.latitude),
    longitude: addressSource.longitude === "" || addressSource.longitude === undefined ? null : Number(addressSource.longitude),
    address_verification: verifiedAddress ? { provider: "spl", status: "verified", verified_at: new Date().toISOString(), provider_reference: verifiedAddress.provider_reference || null } : { provider: null, status: "manual", verified_at: null }
  };
  if (countryCode === "SA" && normalized.short_address && !validSaudiShortAddress(normalized.short_address)) fail("INVALID_SAUDI_SHORT_ADDRESS");
  const required = ["first_name", "last_name", "phone", "province", "city", "district", "street", "building_number", "postal_code"];
  if (countryCode === "SA") required.push("short_address");
  const missing = required.filter((key) => !normalized[key]);
  if (missing.length) fail(`Missing checkout fields: ${missing.join(", ")}`);
  return normalized;
}

async function normalizeVerifiedCheckoutCustomer(customer = {}, actor = "checkout") {
  const countryCode = String(customer.country_code || normalizeMarketSettings().default_country_code || "SA").toUpperCase();
  const code = normalizeSaudiShortAddress(customer.short_address);
  const spl = publicShippingIntegrations().spl_address;
  if (countryCode !== "SA" || !code || !spl.is_enabled || !spl.has_api_key) return normalizeCheckoutCustomer(customer);
  if (verifiedAddressFromToken(customer.address_verification_token, code)) return normalizeCheckoutCustomer(customer);
  try {
    const resolved = await resolveSaudiShortAddress(code, { actor });
    return normalizeCheckoutCustomer({ ...customer, ...resolved.address, address_verification_token: resolved.verification_token });
  } catch (error) {
    const providerUnavailable = Number(error.status || 500) >= 500;
    if (spl.allow_manual_fallback && providerUnavailable) return normalizeCheckoutCustomer(customer);
    throw error;
  }
}

function commerceOrderSnapshot(customer, paymentMethod = "cod") {
  const market = normalizeMarketSettings();
  const currencies = normalizeCurrencies();
  const country = normalizeCountries().find((row) => row.code === customer.country_code) || {};
  const currency = currencies.currencies.find((row) => row.code === currencies.base_currency) || {};
  const normalizedPayment = normalizePaymentMethod(paymentMethod);
  const requestedPayment = String(paymentMethod || "").toLowerCase();
  const onlineProvider = ["tamara", "edfapay", "tabby"].includes(requestedPayment) ? requestedPayment : null;
  return {
    market: {
      country_code: country.code || market.default_country_code,
      country_name_en: country.name_en || "",
      country_name_ar: country.name_ar || "",
      timezone: market.timezone,
      weight_unit: market.weight_unit,
      dimension_unit: market.dimension_unit
    },
    currency: {
      code: currency.code || currencies.base_currency,
      symbol_en: currency.symbol_en || currency.code || "",
      symbol_ar: currency.symbol_ar || currency.code || "",
      exchange_rate: Number(currency.exchange_rate || 1),
      decimal_digits: Number(currency.decimal_digits ?? 2)
    },
    payment: {
      method: normalizedPayment,
      provider: onlineProvider,
      status: normalizedPayment === "prepaid" ? "pending" : normalizedPayment === "cod_pos" ? "card_on_delivery" : "cash_on_delivery",
      transaction_id: null,
      payment_reference: null,
      installment_provider: onlineProvider,
      installment_plan: onlineProvider === "tamara" ? normalizePaymentGateways().providers.tamara.instalments : null
    }
  };
}

function checkoutLineItems(items = []) {
  return asArray(items).map((item, index) => {
    if (item.item_type === "bundle" || item.bundle_id || item.bundleId) {
      const bundle = findBundle(item.bundle_id || item.bundleId);
      if (!bundle) fail("Bundle was not found or is inactive", 404);
      const quantity = Math.max(1, Number(item.quantity || 1));
      if (bundle.available_stock !== null && quantity > bundle.available_stock) fail("Bundle quantity is out of stock");
      const unitPrice = Number(bundle.price || 0);
      const componentShipping = bundle.items.map((component) => {
        const rawProduct = getRecord("products", component.product_id) || {};
        return { product_id: component.product_id, quantity: component.quantity * quantity, ...productShippingSnapshot(rawProduct) };
      });
      return {
        key: String(item.key || `bundle:${bundle.id}:${index}`),
        item_type: "bundle",
        bundle_id: Number(bundle.id),
        product_id: 0,
        variant_id: null,
        name_ar: bundle.name_ar,
        name_en: bundle.name_en,
        category_slug: "bundles",
        unit_price: unitPrice,
        price: unitPrice,
        quantity,
        subtotal: Number((unitPrice * quantity).toFixed(2)),
        shipping: {
          requires_shipping: componentShipping.some((component) => component.requires_shipping),
          weight: Number(componentShipping.reduce((sum, component) => sum + component.weight * component.quantity, 0).toFixed(3)),
          goods_type_ids: [...new Set(componentShipping.map((component) => component.goods_type_id))],
          components: componentShipping
        },
        components: bundle.items.map((component) => ({
          product_id: component.product_id,
          quantity: component.quantity * quantity,
          name_ar: component.name_ar,
          name_en: component.name_en
        }))
      };
    }
    const productId = Number(item.product_id || item.productId || item.product?.id || 0);
    const product = findProduct(productId) || entityRows("products").find((entry) => Number(entry.id) === productId);
    if (!product) fail(`Product ${productId || "unknown"} was not found`, 404);
    const variantId = item.variant_id || item.variantId || item.optionId || null;
    const variant = normalizeProductPayload(product).variants.find((entry) => String(entry.id) === String(variantId));
    if (variantId && (!variant || variant.is_active === false)) fail("Product option was not found or is inactive", 404);
    if (variant?.is_in_stock === false) fail("Product option is out of stock", 409);
    const unitPrice = effectiveVariantPrice(product, variant);
    const quantity = Math.max(1, Number(item.quantity || 1));
    if (variant?.stock !== null && variant?.stock !== undefined && quantity > Number(variant.stock)) fail("Requested product option quantity is out of stock", 409);
    const shipping = productShippingSnapshot(product, variant);
    return {
      key: String(item.key || [productId, item.colorId || "", variantId || "", index].join(":")),
      product_id: productId,
      variant_id: variantId,
      name_ar: product.name_ar || product.model_ar || item.name_ar || "",
      name_en: product.name_en || product.model_en || item.name_en || "",
      category_slug: product.category_slug || product.category?.slug || item.category_slug || "",
      sku: product.sku || null,
      variant_sku: variant?.sku || null,
      unit_price: unitPrice,
      price: unitPrice,
      quantity,
      subtotal: Number((unitPrice * quantity).toFixed(2)),
      shipping
    };
  });
}

function validSwatchHex(value) {
  const hex = String(value || "").trim();
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? hex : "";
}

function publicVariant(variant = {}, colors = entityRows("colors")) {
  const { cost, stock, ...rest } = variant;
  const name = String(variant.color || "").trim().normalize("NFC").toLowerCase();
  const match = colors.find(row => (variant.color_id && String(row.id) === String(variant.color_id)) ||
    [row.name_ar, row.name_en, row.nameAr, row.nameEn, row.slug].some(value => value && String(value).trim().normalize("NFC").toLowerCase() === name));
  return { ...rest, in_stock: variant.is_in_stock !== false, stock_status: variant.is_in_stock === false ? "out_of_stock" : "in_stock", hex_code: validSwatchHex(match?.color || match?.hex_code || match?.hex) || validSwatchHex(variant.hex_code || variant.color_hex || variant.hex) };
}

function productForStore(product = {}) {
  const normalized = normalizeProductPayload(product);
  const colors = entityRows("colors");
  const activeVariants = normalized.variants.filter((variant) => variant.is_active !== false).map(variant => publicVariant(variant, colors));
  const { cost, stock, ...publicProduct } = normalized;
  return {
    ...publicProduct,
    variants: activeVariants,
    active_variants: activeVariants
  };
}

function storeProductRows() {
  return activeRows("products").map(productForStore);
}

const reviewStatuses = new Set(["pending", "published", "hidden", "rejected"]);
const salesDisplayModes = new Set(["exact", "threshold", "hidden"]);
const reviewSubmissionWindowMs = 60 * 60 * 1000;
const reviewDuplicateWindowMs = 24 * 60 * 60 * 1000;
const defaultProductSocialProofSettings = {
  reviews_enabled: true,
  accepting_reviews: true,
  auto_publish_verified: false,
  show_rating_summary: true,
  show_sales: true,
  sales_display_mode: "exact",
  sales_threshold: 10,
  imported_historical_sales: 0,
  imported_source: "",
  imported_note: ""
};

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return value === true || value === "true" || value === 1 || value === "1";
}

function productRecord(identifier, activeOnly = false) {
  const value = String(identifier || "").trim();
  const rows = entityRows("products");
  return rows.find((product) => (
    (String(product.id) === value || String(product.slug || "") === value)
    && (!activeOnly || (product.is_active !== false && product.isActive !== false && product.active !== false))
  )) || null;
}

function socialProofSettingsRecord(productId) {
  return entityRows("product_social_proof_settings")
    .find((row) => Number(row.product_id) === Number(productId)) || null;
}

function normalizedSocialProofSettings(payload = {}, existing = null) {
  const merged = { ...defaultProductSocialProofSettings, ...(existing || {}), ...(payload || {}) };
  const importedHistoricalSales = Math.max(0, Math.floor(Number(merged.imported_historical_sales || 0)));
  const importedSource = String(merged.imported_source || "").trim().slice(0, 240);
  const importedNote = String(merged.imported_note || "").trim().slice(0, 1000);
  if (importedHistoricalSales > 0 && (!importedSource || !importedNote)) {
    fail("Imported historical sales require a non-empty source and note");
  }
  return {
    product_id: Number(merged.product_id || existing?.product_id || 0),
    reviews_enabled: boolValue(merged.reviews_enabled, true),
    accepting_reviews: boolValue(merged.accepting_reviews, true),
    auto_publish_verified: boolValue(merged.auto_publish_verified, false),
    show_rating_summary: boolValue(merged.show_rating_summary, true),
    show_sales: boolValue(merged.show_sales, true),
    sales_display_mode: salesDisplayModes.has(String(merged.sales_display_mode || "")) ? String(merged.sales_display_mode) : "threshold",
    sales_threshold: Math.max(1, Math.floor(Number(merged.sales_threshold || 10))),
    imported_historical_sales: importedHistoricalSales,
    imported_source: importedSource,
    imported_note: importedNote
  };
}

function productSocialProofSettings(productId) {
  const existing = socialProofSettingsRecord(productId);
  return normalizedSocialProofSettings({ product_id: Number(productId) }, existing);
}

function saveProductSocialProofSettings(productId, payload = {}) {
  const product = productRecord(productId);
  if (!product) fail("Product not found", 404);
  const existing = socialProofSettingsRecord(product.id);
  const normalized = normalizedSocialProofSettings({ ...(payload || {}), product_id: Number(product.id) }, existing);
  return existing
    ? updateRecord("product_social_proof_settings", existing.id, normalized)
    : createRecord("product_social_proof_settings", normalized);
}

function cleanReviewText(value, min, max, field) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (text.length < min || text.length > max) fail(`${field} must be between ${min} and ${max} characters`);
  return text;
}

function validRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail("Rating must be an integer between 1 and 5");
  return rating;
}

function orderContainsProduct(order = {}, productId) {
  return asArray(order.items).some((item) => {
    if (Number(item.product_id) === Number(productId)) return Number(item.quantity || 1) > 0;
    return asArray(item.bundle_items).some((bundleItem) => (
      Number(bundleItem.product_id) === Number(productId)
      && Number(bundleItem.quantity || 1) * Number(item.quantity || 1) > 0
    ));
  });
}

function orderIsPaidOrDelivered(order = {}) {
  const orderStatus = String(order.status || "").toLowerCase();
  const paymentStatus = String(order.payment?.status || order.payment_status || "").toLowerCase();
  if (["cancelled", "canceled", "returned", "return"].includes(orderStatus) || orderStatus.includes("refund")) return false;
  if (["failed", "voided", "cancelled", "canceled"].includes(paymentStatus) || paymentStatus.includes("refund")) return false;
  return orderStatus === "delivered" || ["paid", "captured", "completed", "succeeded", "success"].includes(paymentStatus);
}

function verifiedReviewPurchase({ productId, orderId, email, phone, userId }) {
  const eligibleOrders = entityRows("orders")
    .filter((order) => orderContainsProduct(order, productId) && orderIsPaidOrDelivered(order))
    .sort((a, b) => recentTimestamp(b) - recentTimestamp(a));
  const submittedEmailHash = identityHash(email);
  const submittedPhoneHash = identityHash(phone);
  const matchesContact = (order) => {
    const customer = order.shipping_address || order.customer || {};
    const storedEmailHash = order.customer_identity?.email_hash || identityHash(customer.email);
    const storedPhoneHash = order.customer_identity?.phone_hash || identityHash(customer.phone);
    return Boolean(
      (submittedEmailHash && storedEmailHash && submittedEmailHash === storedEmailHash)
      || (submittedPhoneHash && storedPhoneHash && submittedPhoneHash === storedPhoneHash)
    );
  };

  if (userId) {
    const accountMatch = eligibleOrders.find((order) => {
      const storedUserId = order.customer_identity?.user_id || order.user_id || order.customer_id;
      return storedUserId && String(storedUserId) === String(userId);
    });
    return accountMatch || eligibleOrders.find(matchesContact) || null;
  }

  if (!orderId || (!email && !phone)) return null;
  const guestOrder = eligibleOrders.find((order) => String(order.id) === String(orderId));
  return guestOrder && matchesContact(guestOrder) ? guestOrder : null;
}

function reviewClientIp(req) {
  const socketIp = String(req.socket.remoteAddress || "").replace(/^::ffff:/, "");
  const trustedHop = socketIp === "127.0.0.1" || socketIp === "::1" || socketIp.startsWith("10.") || socketIp.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(socketIp);
  if (!trustedHop) return socketIp || "unknown";
  return String(req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || socketIp)
    .split(",")[0].trim().replace(/^::ffff:/, "") || socketIp || "unknown";
}

function reviewIpHash(req) {
  return identityHash(`review-ip:${reviewClientIp(req)}`);
}

function reviewSubmissionHash({ productId, displayName, comment, email, phone, ipHash }) {
  return identityHash([
    productId,
    String(displayName || "").toLowerCase(),
    String(comment || "").toLowerCase(),
    identityHash(email) || "",
    identityHash(phone) || "",
    ipHash || ""
  ].join("|"));
}

function recentTimestamp(row = {}) {
  const value = row.submitted_at || row.updated_at || row.created_at;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function enforceReviewRateLimit(req) {
  const ipHash = reviewIpHash(req);
  const now = Date.now();
  const recent = entityRows("product_reviews").filter((review) => review.ip_hash === ipHash && now - recentTimestamp(review) < reviewSubmissionWindowMs);
  if (recent.length >= 5) fail("Too many review submissions. Please try again later.", 429);
  return ipHash;
}

function publicCustomerReview(review = {}, helpfulByCurrentGuest = false) {
  return {
    id: Number(review.id),
    product_id: Number(review.product_id),
    source: "customer",
    display_name: review.display_name,
    rating: Number(review.rating),
    comment: review.comment,
    is_verified_purchase: review.is_verified_purchase === true,
    helpful_count: Math.max(0, Number(review.helpful_count || 0)),
    helpful_by_current_guest: helpfulByCurrentGuest === true,
    published_at: review.published_at || review.created_at
  };
}

function normalizeRecommendationPayload(payload = {}, existing = null) {
  const merged = { ...(existing || {}), ...(payload || {}) };
  const productId = Number(merged.product_id || 0);
  if (!Number.isInteger(productId) || productId <= 0 || !productRecord(productId)) fail("Product not found", 404);
  const bodyAr = String(merged.body_ar || merged.content_ar || "").trim().slice(0, 2000);
  const bodyEn = String(merged.body_en || merged.content_en || "").trim().slice(0, 2000);
  if (!bodyAr && !bodyEn) fail("Recommendation body is required in Arabic or English");
  const sharedAuthor = String(merged.author_name || "").trim();
  return {
    product_id: productId,
    source: "store",
    rating: validRating(merged.rating),
    body_ar: bodyAr,
    body_en: bodyEn,
    author_name_ar: String(merged.author_name_ar || sharedAuthor || "فريق رداء الحشمة").trim().slice(0, 80),
    author_name_en: String(merged.author_name_en || sharedAuthor || "Redaa Alhishma Team").trim().slice(0, 80),
    is_active: boolValue(merged.is_active, true),
    is_featured: boolValue(merged.is_featured, false),
    sort_order: Number.isFinite(Number(merged.sort_order)) ? Number(merged.sort_order) : 0
  };
}

function publicStoreRecommendation(recommendation = {}) {
  return {
    id: Number(recommendation.id),
    product_id: Number(recommendation.product_id),
    type: "store_recommendation",
    source: "store",
    source_label: { ar: "توصية فريق المتجر", en: "Store team recommendation" },
    rating: Number(recommendation.rating),
    body_ar: recommendation.body_ar || "",
    body_en: recommendation.body_en || "",
    author_name_ar: recommendation.author_name_ar || "فريق رداء الحشمة",
    author_name_en: recommendation.author_name_en || "Redaa Alhishma Team",
    is_featured: recommendation.is_featured === true,
    sort_order: Number(recommendation.sort_order || 0),
    published_at: recommendation.created_at
  };
}

function publishedProductReviews(productId) {
  return entityRows("product_reviews")
    .filter((review) => Number(review.product_id) === Number(productId) && review.source === "customer" && review.status === "published")
    .sort((a, b) => String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)));
}

function ratingAggregate(reviews = []) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) distribution[Number(review.rating)] += 1;
  const count = reviews.length;
  const average = count ? Number((reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count).toFixed(2)) : 0;
  return { average, count, distribution };
}

function unitsOfProductInOrder(order = {}, productId) {
  return asArray(order.items).reduce((sum, item) => {
    const lineQuantity = Math.max(0, Math.floor(Number(item.quantity || 0)));
    if (Number(item.product_id) === Number(productId)) return sum + lineQuantity;
    const storedComponents = asArray(item.components);
    if (storedComponents.length) {
      return sum + storedComponents.reduce((componentSum, component) => (
        Number(component.product_id) === Number(productId)
          ? componentSum + Math.max(0, Math.floor(Number(component.quantity || 0)))
          : componentSum
      ), 0);
    }
    const bundleUnits = asArray(item.bundle_items).reduce((bundleSum, bundleItem) => (
      Number(bundleItem.product_id) === Number(productId)
        ? bundleSum + Math.max(0, Math.floor(Number(bundleItem.quantity || 0))) * lineQuantity
        : bundleSum
    ), 0);
    return sum + bundleUnits;
  }, 0);
}

function actualUnitsSold(productId) {
  return entityRows("orders")
    .filter((order) => !boolValue(order.is_test, false) && orderIsPaidOrDelivered(order))
    .reduce((sum, order) => sum + unitsOfProductInOrder(order, productId), 0);
}

function productSalesSocialProof(productId, settings = productSocialProofSettings(productId)) {
  const actual = actualUnitsSold(productId);
  const imported = Math.max(0, Number(settings.imported_historical_sales || 0));
  const verifiedLegacy = verifiedLegacyUnitsSold(productId);
  const displayed = actual + imported + verifiedLegacy;
  const mode = settings.sales_display_mode;
  const threshold = Math.max(1, Number(settings.sales_threshold || 10));
  let visible = settings.show_sales === true && mode !== "hidden";
  let label = { ar: "", en: "" };
  if (mode === "threshold") {
    visible = visible && displayed >= threshold;
    if (visible) label = { ar: `تم شراء هذا المنتج أكثر من ${threshold} مرة`, en: `${threshold}+ purchased` };
  } else if (mode === "exact" && visible) {
    const arabicUnit = displayed === 1 ? "مرة واحدة" : displayed === 2 ? "مرتين" : `${displayed} مرات`;
    label = { ar: `تم شراء هذا المنتج ${arabicUnit}`, en: `${displayed} purchased` };
  }
  return {
    actual_units_sold: actual,
    imported_historical_sales: imported,
    verified_legacy_units_sold: verifiedLegacy,
    displayed_units_sold: displayed,
    display_mode: mode,
    threshold,
    visible,
    label
  };
}

function adminReviewView(review = {}) {
  return {
    id: Number(review.id),
    record_type: "customer_review",
    source: "customer",
    product_id: Number(review.product_id),
    display_name: review.display_name,
    rating: Number(review.rating),
    comment: review.comment,
    status: review.status,
    is_verified_purchase: review.is_verified_purchase === true,
    order_id: review.order_id || null,
    helpful_count: Math.max(0, Number(review.helpful_count || 0)),
    submitted_at: review.submitted_at || review.created_at,
    published_at: review.published_at || null,
    created_at: review.created_at,
    updated_at: review.updated_at
  };
}

function reviewEvent(reviewId, action, actor, details = {}) {
  return createRecord("review_events", {
    review_id: Number(reviewId),
    action,
    actor: String(actor || "system"),
    details,
    occurred_at: new Date().toISOString()
  });
}

function activeReviewRecord(id) {
  return entityRows("product_reviews").find((review) => Number(review.id) === Number(id)) || null;
}

function activeRecommendationRecord(id) {
  return entityRows("product_recommendations").find((recommendation) => Number(recommendation.id) === Number(id)) || null;
}

function updateCustomerReview(review, payload = {}, actor = "admin") {
  const next = { ...review };
  const changed = {};
  if (["display_name", "comment", "rating", "is_verified_purchase", "source"].some((field) => payload[field] !== undefined)) {
    fail("Customer review content and verification cannot be edited", 400);
  }
  if (payload.status !== undefined) {
    const status = String(payload.status || "").toLowerCase();
    if (!reviewStatuses.has(status)) fail("Invalid review status");
    next.status = status;
    if (status === "published" && !review.published_at) next.published_at = new Date().toISOString();
  }
  for (const field of ["display_name", "comment", "rating", "status"]) {
    if (next[field] !== review[field]) changed[field] = { from: review[field], to: next[field] };
  }
  const updated = updateRecord("product_reviews", review.id, {
    status: next.status,
    published_at: next.published_at || null
  });
  if (Object.keys(changed).length) reviewEvent(review.id, "moderated", actor, { changed });
  return updated;
}

function normalizeBundlePayload(payload = {}) {
  const sourceItems = asArray(payload.items || payload.bundle_items || payload.product_ids);
  const items = sourceItems.map((item) => ({
    product_id: Number(typeof item === "object" ? (item.product_id || item.productId || item.id) : item),
    quantity: Math.max(1, Number(typeof item === "object" ? item.quantity || 1 : 1))
  })).filter((item) => item.product_id);
  const uniqueItems = Array.from(new Map(items.map((item) => [item.product_id, item])).values());
  return {
    ...payload,
    name_en: String(payload.name_en || payload.name || "").trim(),
    name_ar: String(payload.name_ar || payload.name || "").trim(),
    slug: String(payload.slug || "").trim(),
    main_photo_url: String(payload.main_photo_url || payload.image_url || "").trim(),
    description_en: String(payload.description_en || "").trim(),
    description_ar: String(payload.description_ar || "").trim(),
    price: Math.max(0, Number(payload.price || 0)),
    compare_at_price: Math.max(0, Number(payload.compare_at_price || payload.price_before || 0)),
    cost: Math.max(0, Number(payload.cost || 0)),
    use_own_stock: payload.use_own_stock === true || payload.useOwnStock === true || payload.use_own_stock === "true",
    stock: payload.stock === "" || payload.stock === null || payload.stock === undefined ? null : Math.max(0, Number(payload.stock || 0)),
    items: uniqueItems,
    is_active: payload.is_active !== false && payload.isActive !== false && payload.active !== false
  };
}

function bundleForStore(bundle = {}) {
  const normalized = normalizeBundlePayload(bundle);
  const items = normalized.items.map((item) => {
    const rawProduct = getRecord("products", item.product_id);
    if (!rawProduct || rawProduct.is_active === false) return null;
    const product = productForStore(rawProduct);
    const productStock = normalizeProductPayload(rawProduct).stock;
    return {
      product_id: Number(product.id),
      quantity: item.quantity,
      slug: product.slug || "",
      name_ar: product.name_ar || "",
      name_en: product.name_en || "",
      image_url: product.main_photo_url || product.image_url || "",
      unit_price: Number(product.sale_price || product.price || 0),
      subtotal: Number((Number(product.sale_price || product.price || 0) * item.quantity).toFixed(2)),
      available_stock: productStock === null ? null : Math.max(0, Math.floor(Number(productStock || 0) / item.quantity))
    };
  }).filter(Boolean);
  const finiteStocks = items.map((item) => item.available_stock).filter((value) => value !== null);
  const inheritedStock = finiteStocks.length ? Math.min(...finiteStocks) : null;
  const availableStock = normalized.use_own_stock ? normalized.stock : inheritedStock;
  return {
    ...normalized,
    id: Number(bundle.id),
    items,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    regular_total: Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)),
    savings: Number(Math.max(0, items.reduce((sum, item) => sum + item.subtotal, 0) - normalized.price).toFixed(2)),
    available_stock: availableStock,
    stock_source: normalized.use_own_stock ? "bundle" : "products"
  };
}

function storeBundleRows() {
  return activeRows("bundles").map(bundleForStore).filter((bundle) => bundle.items.length >= 2);
}

function findBundle(identifier) {
  const value = String(identifier || "");
  return storeBundleRows().find((bundle) => String(bundle.id) === value || bundle.slug === value);
}

function updateBundleRecord(id, payload = {}) {
  const existing = getRecord("bundles", id);
  const normalized = normalizeBundlePayload({ ...(existing || {}), ...payload });
  if (normalized.items.length < 2) fail("A bundle must contain at least two products");
  return existing ? updateRecord("bundles", id, normalized) : createRecord("bundles", normalized);
}

function collectionSlug(value) {
  return slugify(value).slice(0, 160);
}

function ensureUniqueCollectionSlug(slug, collectionId = null) {
  const duplicate = entityRows("collections").find((collection) => (
    Number(collection.id) !== Number(collectionId)
    && String(collection.slug || "").toLowerCase() === String(slug || "").toLowerCase()
  ));
  if (duplicate) fail("Collection slug already exists", 409);
}

function normalizeCollectionPayload(payload = {}, collectionId = null, existing = null) {
  const nameArInput = String(payload.name_ar || payload.nameAr || payload.name || "").trim();
  const nameEnInput = String(payload.name_en || payload.nameEn || payload.name || "").trim();
  if (!nameArInput && !nameEnInput) fail("Collection name is required in Arabic or English");
  const nameAr = nameArInput || nameEnInput;
  const nameEn = nameEnInput || nameArInput;
  const slug = collectionSlug(payload.slug || nameEn || nameAr);
  if (!slug) fail("Collection slug is required");
  ensureUniqueCollectionSlug(slug, collectionId);

  const products = new Map(entityRows("products").map((product) => [Number(product.id), product]));
  const existingIds = new Map(asArray(existing?.items).map((item) => [
    `${Number(item.product_id)}:${String(item.variant_id || "")}`,
    String(item.id || "")
  ]));
  const pairs = new Set();
  const itemIds = new Set();
  const items = asArray(payload.items || payload.collection_items).map((source, index) => {
    const item = typeof source === "object" && source !== null ? source : { product_id: source };
    const productId = Number(item.product_id || item.productId || item.product?.id || 0);
    if (!Number.isInteger(productId) || productId <= 0) fail(`Collection item ${index + 1} has an invalid product`);
    const product = products.get(productId);
    if (!product) fail(`Product ${productId} was not found`, 404);

    const rawVariantId = item.variant_id ?? item.variantId ?? item.option_id ?? item.optionId ?? "";
    const variantId = String(rawVariantId || "").trim();
    if (variantId) {
      const belongsToProduct = normalizeProductPayload(product).variants.some((variant) => String(variant.id) === variantId);
      if (!belongsToProduct) fail(`Variant ${variantId} does not belong to product ${productId}`);
    }

    const pair = `${productId}:${variantId}`;
    if (pairs.has(pair)) fail(`Product ${productId} with variant ${variantId || "base"} is duplicated in this collection`);
    pairs.add(pair);
    const itemId = String(item.id || existingIds.get(pair) || crypto.randomUUID());
    if (itemIds.has(itemId)) fail(`Collection item id ${itemId} is duplicated`);
    itemIds.add(itemId);
    return {
      id: itemId,
      product_id: productId,
      variant_id: variantId,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : index + 1
    };
  }).sort((a, b) => a.sort_order - b.sort_order).map((item, index) => ({ ...item, sort_order: index + 1 }));

  return {
    ...payload,
    name_ar: nameAr,
    name_en: nameEn,
    slug,
    description_ar: String(payload.description_ar || payload.descriptionAr || "").trim(),
    description_en: String(payload.description_en || payload.descriptionEn || "").trim(),
    cover_image_url: String(payload.cover_image_url || payload.coverImageUrl || payload.image_url || "").trim(),
    is_active: payload.is_active !== false && payload.isActive !== false && payload.active !== false,
    items
  };
}

function collectionItemView(collection, item, publicView = false, productsById = null) {
  const product = productsById
    ? productsById.get(Number(item.product_id))
    : entityRows("products").find((row) => Number(row.id) === Number(item.product_id));
  const productActive = Boolean(product) && product.is_active !== false && product.isActive !== false && product.active !== false;
  const requestedVariantId = String(item.variant_id || "");
  const normalizedProduct = product ? normalizeProductPayload(product) : null;
  const variant = requestedVariantId
    ? normalizedProduct?.variants.find((row) => String(row.id) === requestedVariantId) || null
    : null;
  const variantExists = !requestedVariantId || Boolean(variant);
  const variantActive = !requestedVariantId || variant?.is_active !== false;
  const isAvailable = Boolean(product && productActive && variantExists && variantActive);

  const effectivePrice = effectiveVariantPrice(product || {}, variant);
  const baseComparePrice = Number(product?.compare_at_price ?? product?.price_before ?? 0);
  const effectiveComparePrice = variant?.compare_at_price !== null && variant?.compare_at_price !== undefined
    ? Number(variant.compare_at_price)
    : baseComparePrice;
  const effectiveImage = String(variant?.image_url || product?.main_photo_url || product?.image_url || asArray(product?.images)[0] || "");
  const labels = [
    variant?.color ? String(variant.color) : "",
    variant?.option && variant?.value ? `${variant.option}: ${variant.value}` : String(variant?.value || variant?.option || "")
  ].filter(Boolean);
  const query = new URLSearchParams();
  if (requestedVariantId) query.set("variant", requestedVariantId);
  query.set("collection", String(collection.slug || ""));

  return {
    id: String(item.id || ""),
    product_id: Number(item.product_id),
    variant_id: requestedVariantId,
    sort_order: Number(item.sort_order || 0),
    is_available: isAvailable,
    availability: {
      product_exists: Boolean(product),
      product_active: productActive,
      variant_exists: variantExists,
      variant_active: variantActive,
      reason: !product ? "product_missing" : !productActive ? "product_inactive" : !variantExists ? "variant_missing" : !variantActive ? "variant_inactive" : null
    },
    name_ar: String(product?.name_ar || product?.model_ar || ""),
    name_en: String(product?.name_en || product?.model_en || ""),
    slug: String(product?.slug || ""),
    sku: String(variant?.sku || product?.sku || ""),
    image_url: effectiveImage,
    price: effectivePrice,
    compare_at_price: effectiveComparePrice,
    labels,
    variant_labels: {
      color: String(variant?.color || ""),
      option: String(variant?.option || ""),
      value: String(variant?.value || "")
    },
    href: `/product/${Number(item.product_id)}?${query.toString()}`,
    product: product ? (publicView ? productForStore(product) : normalizedProduct) : null,
    variant: variant ? (publicView ? publicVariant(variant) : variant) : null
  };
}

function collectionForAdmin(collection = {}, productsById = null) {
  const productLookup = productsById || new Map(entityRows("products").map((product) => [Number(product.id), product]));
  const items = asArray(collection.items)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((item) => collectionItemView(collection, item, false, productLookup));
  return {
    ...collection,
    id: Number(collection.id),
    items,
    item_count: items.length,
    available_item_count: items.filter((item) => item.is_available).length,
    unavailable_item_count: items.filter((item) => !item.is_available).length
  };
}

function collectionForStore(collection = {}, productsById = null) {
  const productLookup = productsById || new Map(entityRows("products").map((product) => [Number(product.id), product]));
  const items = asArray(collection.items)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((item) => collectionItemView(collection, item, true, productLookup))
    .filter((item) => item.is_available);
  return {
    id: Number(collection.id),
    name_ar: String(collection.name_ar || collection.name_en || ""),
    name_en: String(collection.name_en || collection.name_ar || ""),
    slug: String(collection.slug || ""),
    description_ar: String(collection.description_ar || ""),
    description_en: String(collection.description_en || ""),
    cover_image_url: String(collection.cover_image_url || ""),
    is_active: true,
    items,
    item_count: items.length
  };
}

function storeCollectionRows() {
  const productsById = new Map(entityRows("products").map((product) => [Number(product.id), product]));
  return activeRows("collections").map((collection) => collectionForStore(collection, productsById));
}

function updateCollectionRecord(id, payload = {}) {
  const existing = getRecord("collections", id);
  if (!existing) fail("Collection not found", 404);
  const normalized = normalizeCollectionPayload({ ...existing, ...payload }, id, existing);
  return updateRecord("collections", id, normalized);
}

function productForNextStore(product = {}) {
  const activeVariants = asArray(product.variants).filter((variant) => variant.is_active !== false);
  const basePrice = Number(product.sale_price || product.price || 0);
  const prices = [basePrice, ...activeVariants.map((variant) => Number(variant.price || 0) || (basePrice + Number(variant.price_adjustment || 0)))].filter((value) => value >= 0);
  const colorVariants = activeVariants.filter((variant) => variant.color).map((variant) => ({
    id: variant.id,
    color_id: variant.color_id || variant.id,
    value: variant.color,
    labelEn: variant.color,
    labelAr: variant.color,
    hexCode: variant.hex_code || variant.hex || "#111111",
    image: variant.image_url || product.main_photo_url || product.image_url || "",
    images: [variant.image_url].filter(Boolean),
    price: Number(variant.price || 0) || (basePrice + Number(variant.price_adjustment || 0)),
    compareAtPrice: Number(variant.compare_at_price || product.price_before || 0) || undefined,
    stock: variant.stock === null || variant.stock === undefined ? 999999 : Number(variant.stock || 0),
    variantId: variant.id
  }));
  const optionVariants = activeVariants.filter((variant) => !variant.color && (variant.option || variant.value)).map((variant) => ({
    id: variant.id,
    size_id: variant.option_id || variant.id,
    value: variant.value || variant.option,
    labelEn: variant.value || variant.option,
    labelAr: variant.value || variant.option,
    price: Number(variant.price || 0) || (basePrice + Number(variant.price_adjustment || 0)),
    compareAtPrice: Number(variant.compare_at_price || product.price_before || 0) || undefined,
    stock: variant.stock === null || variant.stock === undefined ? 999999 : Number(variant.stock || 0),
    variantId: variant.id,
    image: variant.image_url || undefined
  }));
  const rawLabels = Array.isArray(product.labels) ? product.labels : String(product.labels || "").split(",").map((item) => item.trim()).filter(Boolean);
  return {
    ...product,
    modelEn: product.name_en || product.modelEn || product.model || "",
    modelAr: product.name_ar || product.modelAr || product.model || "",
    descriptionEn: product.description_en || product.descriptionEn || "",
    descriptionAr: product.description_ar || product.descriptionAr || "",
    mainPhotoUrl: product.main_photo_url || product.mainPhotoUrl || product.image_url || "",
    sidePhotos: asArray(product.side_photos || product.sidePhotos || product.gallery || product.images),
    category: {
      ...(product.category || {}),
      id: Number(product.category?.id || product.category_id || 0),
      nameEn: product.category?.nameEn || product.category?.name_en || product.category_name_en || "",
      nameAr: product.category?.nameAr || product.category?.name_ar || product.category_name_ar || "",
      slug: product.category?.slug || product.category_slug || "",
      image: product.category?.image || product.category?.image_url || product.category_image_url || ""
    },
    brand: {
      ...(product.brand || {}),
      id: Number(product.brand?.id || product.brand_id || 0),
      nameEn: product.brand?.nameEn || product.brand?.name_en || product.brand_en || "",
      nameAr: product.brand?.nameAr || product.brand?.name_ar || product.brand_ar || "",
      slug: product.brand?.slug || product.brand_slug || "",
      logo: product.brand?.logo || product.brand?.logo_url || product.brand_logo_url || ""
    },
    variantAxes: [...(colorVariants.length ? ["color"] : []), ...(optionVariants.length ? ["size"] : [])],
    variants: {
      colors: colorVariants.length ? colorVariants : undefined,
      sizes: optionVariants.length ? optionVariants : undefined,
      default: { price: basePrice, compareAtPrice: Number(product.price_before || (product.sale_price ? product.price : 0)) || undefined, stock: product.stock === null || product.stock === undefined ? 999999 : Number(product.stock || 0), variantId: 0 }
    },
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    totalStock: product.stock === null || product.stock === undefined ? 999999 : Number(product.stock || 0),
    isActive: product.is_active !== false,
    labels: rawLabels.map((name, index) => typeof name === "object" ? name : ({ id:`label-${index}`, nameEn:name, nameAr:name, color:"#ffffff", backgroundColor:(getSetting("companyInfo") || {}).primary_color || "#b20000", isActive:true }))
  };
}

function findProduct(identifier) {
  const value = String(identifier || "");
  return storeProductRows().find((product) => String(product.id) === value || product.slug === value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function optimizedImage(src, width = 640) {
  const value = String(src || "");
  const match = value.match(/^\/uploads\/([^/]+)\/([^/?#]+)\.(png|jpe?g)$/i);
  if (!match) return value;
  const slug = `${match[1]}-${path.parse(match[2]).name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const candidate = path.join(__dirname, "public", "uploads", "optimized", `${slug}-${width}.webp`);
  return fs.existsSync(candidate) ? `/uploads/optimized/${slug}-${width}.webp` : value;
}

function localPublicImagePath(decodedUrl) {
  let pathname = decodedUrl;
  if (/^https?:\/\//i.test(decodedUrl)) {
    try {
      const url = new URL(decodedUrl);
      pathname = url.pathname;
    } catch {
      return null;
    }
  }
  if (!pathname.startsWith("/")) return null;
  const localPath = path.normalize(path.join(__dirname, "public", pathname));
  if (!localPath.startsWith(path.join(__dirname, "public"))) return null;
  return fs.existsSync(localPath) ? localPath : null;
}

function sendPerformanceHtml(res, filename) {
  const filePath = path.join(__dirname, "public", filename);
  let html = fs.readFileSync(filePath, "utf8");
  if (!shippingSettings().is_active) {
    html = html.replace("</head>", `<style id="slyrah-shipping-visibility">a[href="/order-tracking"],a[href="order-tracking.html"],a[href="/shipping-policy"],a[href="shipping-policy.html"]{display:none!important}</style></head>`);
  }
  html = html
    .replace(/srcSet="[^"]*logo-premiumbrand\.png[^"]*"/g, 'srcSet="/logo-premiumbrand.png 120w"')
    .replace(/src="_next\/image%3Furl=%252Flogo-premiumbrand\.png&amp;w=3840&amp;q=75"/g, 'src="/logo-premiumbrand.png"');
  const delayedScripts = [];
  html = html.replace(/<script src="(_next\/static\/chunks\/[^"]+\.js)" async=""><\/script>/g, (_match, src) => {
    delayedScripts.push(src);
    return "";
  });
  html = html.replace(/<link rel="preload" as="script" fetchPriority="low" href="(_next\/static\/chunks\/[^"]+\.js)"\/>/g, "");
  const loader = `<script id="slyrah-deferred-hydration">
    (()=>{const scripts=${JSON.stringify(delayedScripts)};let loaded=false;function load(){if(loaded)return;loaded=true;scripts.forEach(src=>{const s=document.createElement('script');s.src=src;s.async=false;document.body.appendChild(s);});}
    ['pointerdown','keydown','touchstart','mousemove'].forEach(e=>addEventListener(e,load,{once:true,passive:true}));
    if ('requestIdleCallback' in window) requestIdleCallback(load,{timeout:1200}); else setTimeout(load,400);
    })();
  </script>`;
  const cartGuard = `<script id="slyrah-cart-navigation-guard">
    (()=>{function isCartTrigger(node){const target=node?.closest?.('button,a');if(!target)return false;const label=(target.getAttribute('aria-label')||target.textContent||'').trim();return label==='Cart'||label==='السلة';}
    addEventListener('click',event=>{if(!isCartTrigger(event.target))return;event.preventDefault();event.stopImmediatePropagation();location.href='/cart';},true);
    addEventListener('touchend',event=>{if(!isCartTrigger(event.target))return;event.preventDefault();event.stopImmediatePropagation();location.href='/cart';},true);
    })();
  </script>`;
  const chromeSync = false ? `<script id="slyrah-storefront-chrome-sync">
    (()=>{const headerHtml=${JSON.stringify(storefrontHeaderHtml())};const footerHtml=${JSON.stringify(storefrontFooterHtml())};let syncing=false;function elementFrom(html){const template=document.createElement('template');template.innerHTML=html.trim();return template.content.firstElementChild;}function lang(){return(localStorage.getItem('language')||'ar')==='en'?'en':'ar';}function applyLanguage(){const current=lang();document.documentElement.lang=current;document.documentElement.dir=current==='ar'?'rtl':'ltr';document.querySelectorAll('[data-ar][data-en]').forEach(node=>{const value=node.dataset[current];if(value!==undefined&&node.textContent!==value)node.textContent=value;});document.querySelectorAll('[data-language-toggle]').forEach(node=>{const value=current==='ar'?'EN':'AR';if(node.textContent!==value)node.textContent=value;});}function updateScroll(){const scrolled=scrollY>50;document.querySelectorAll('.site-header-cover').forEach(node=>node.classList.toggle('is-collapsed',scrolled));document.querySelectorAll('.site-header-logo-shell').forEach(node=>{node.classList.toggle('is-expanded',!scrolled);node.classList.toggle('is-scrolled',scrolled);});}function updateCart(){let items=[];try{items=JSON.parse(localStorage.getItem('slyrah_cart')||localStorage.getItem('cart')||'[]');}catch{}const count=Array.isArray(items)?items.reduce((sum,item)=>sum+Number(item.quantity||1),0):0;document.querySelectorAll('[data-cart-count]').forEach(node=>{node.textContent=String(count);node.classList.toggle('hidden',count<=0);});}function closeMenu(){document.querySelector('.slyrah-mobile-drawer')?.classList.remove('is-open');document.querySelector('.slyrah-mobile-backdrop')?.classList.remove('is-open');document.body.style.overflow='';}function sync(){if(syncing)return;const oldHeader=document.querySelector('header:not([data-slyrah-header])');const oldFooter=document.querySelector('footer:not([data-slyrah-footer])');if(!oldHeader&&!oldFooter)return;syncing=true;if(oldHeader){const nextHeader=elementFrom(headerHtml);nextHeader.setAttribute('data-slyrah-header','true');oldHeader.replaceWith(nextHeader);}if(oldFooter){const nextFooter=elementFrom(footerHtml);nextFooter.setAttribute('data-slyrah-footer','true');oldFooter.replaceWith(nextFooter);}applyLanguage();updateScroll();updateCart();syncing=false;}document.addEventListener('click',event=>{const languageButton=event.target.closest('[data-language-toggle]');if(languageButton){event.preventDefault();localStorage.setItem('language',lang()==='ar'?'en':'ar');applyLanguage();return;}if(event.target.closest('[data-mobile-menu-toggle]')){document.querySelector('.slyrah-mobile-drawer')?.classList.add('is-open');document.querySelector('.slyrah-mobile-backdrop')?.classList.add('is-open');document.body.style.overflow='hidden';return;}if(event.target.closest('[data-mobile-menu-close]')){closeMenu();return;}const submenu=event.target.closest('[data-mobile-submenu-toggle]');if(submenu){document.querySelector('[data-mobile-submenu="'+submenu.dataset.mobileSubmenuToggle+'"]')?.classList.toggle('is-open');}},true);addEventListener('scroll',updateScroll,{passive:true});addEventListener('storage',updateCart);addEventListener('slyrah-cart-updated',updateCart);document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync);else sync();[250,700,1400,3000,8500].forEach(delay=>setTimeout(sync,delay));new MutationObserver(()=>{if(document.querySelector('header:not([data-slyrah-header]),footer:not([data-slyrah-footer])'))queueMicrotask(sync);}).observe(document.documentElement,{childList:true,subtree:true});})();
  </script>` : "";
  const productGalleryEnhancer = false ? `<script id="slyrah-product-card-gallery">
    (()=>{const style=document.createElement('style');style.textContent='.slyrah-card-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:20;pointer-events:auto}.slyrah-card-dot{height:6px;width:6px;border:0;border-radius:999px;background:#9ca3af;padding:0;transition:width .25s ease,background-color .25s ease}.slyrah-card-dot.is-active{width:24px;background:#111}.dark .slyrah-card-dot.is-active{background:#fff}';document.head.appendChild(style);function collect(product){const images=[];[product.main_photo_url,product.image_url,product.mainPhotoUrl].forEach(src=>src&&!images.includes(src)&&images.push(src));(product.side_photos||product.sidePhotos||product.gallery||product.images||[]).forEach(src=>{if(typeof src==='string'&&src&&!images.includes(src))images.push(src);else if(src?.url&&!images.includes(src.url))images.push(src.url);});return images;}function imageTarget(card){const img=card.querySelector('img');if(!img)return null;return {img,area:img.closest('[class*=\"aspect-\"]')||img.parentElement};}function setImage(target,src){target.img.removeAttribute('srcset');target.img.removeAttribute('sizes');target.img.src=src;}function enhance(products){const byId=new Map(products.map(product=>[String(product.id),collect(product)]));document.querySelectorAll('a[href*=\"/product/\"]').forEach(link=>{const match=(link.getAttribute('href')||'').match(/\\/product\\/(\\d+)/);if(!match)return;const images=byId.get(match[1])||[];if(images.length<=1)return;const card=link.closest('.product-card-typography')||link.closest('article')||link.closest('div');if(!card||card.dataset.slyrahGallery==='ready')return;const target=imageTarget(card);if(!target?.img||!target.area)return;card.dataset.slyrahGallery='ready';let index=0;let startX=null;let endX=null;target.area.style.position='relative';target.area.classList.add('touch-pan-y');const dots=document.createElement('div');dots.className='slyrah-card-dots';function render(){setImage(target,images[index]);dots.querySelectorAll('button').forEach((dot,i)=>dot.classList.toggle('is-active',i===index));}images.forEach((_,i)=>{const dot=document.createElement('button');dot.type='button';dot.className='slyrah-card-dot'+(i===0?' is-active':'');dot.setAttribute('aria-label','Image '+(i+1));dot.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();index=i;render();});dots.appendChild(dot);});target.area.appendChild(dots);target.area.addEventListener('touchstart',event=>{startX=event.targetTouches[0]?.clientX??null;endX=null;},{passive:true});target.area.addEventListener('touchmove',event=>{endX=event.targetTouches[0]?.clientX??null;},{passive:true});target.area.addEventListener('touchend',event=>{if(startX===null||endX===null)return;const distance=startX-endX;if(Math.abs(distance)<=50){startX=null;endX=null;return;}event.preventDefault();event.stopPropagation();index=distance>0?(index+1)%images.length:(index-1+images.length)%images.length;render();startX=null;endX=null;},{passive:false});let timer=null;card.addEventListener('mouseenter',()=>{if(matchMedia('(max-width: 767px)').matches)return;clearInterval(timer);timer=setInterval(()=>{index=(index+1)%images.length;render();},2000);});card.addEventListener('mouseleave',()=>{clearInterval(timer);timer=null;index=0;render();});});}fetch('/api/store/products?limit=200',{cache:'no-store'}).then(response=>response.json()).then(payload=>{const products=payload?.data?.products||payload?.products||[];enhance(products);setTimeout(()=>enhance(products),1000);setTimeout(()=>enhance(products),3000);}).catch(()=>{});})();
  </script>` : "";
  html = html.replace("</body>", `${cartGuard}${chromeSync}${productGalleryEnhancer}${loader}</body>`);
  res.setHeader("Cache-Control", "public, max-age=60");
  res.type("html").send(html);
}

function storefrontChromeCss() {
  return `
    .storefront-spacer { height:calc(30vh + 188px); min-height:318px; }
    header.site-header-portal,
    header.site-header-portal[class*="fixed"] {
      position:fixed !important;
      top:0 !important;
      left:0 !important;
      right:0 !important;
      width:100% !important;
      z-index:9999 !important;
      isolation:isolate !important;
      backface-visibility:hidden !important;
      -webkit-backface-visibility:hidden !important;
    }
    .site-header-cover {
      height:30vh;
      opacity:1;
      transform:translateZ(0);
      -webkit-transform:translateZ(0);
      transition:height .42s cubic-bezier(.22,1,.36,1), opacity .28s ease;
      will-change:height, opacity;
      contain:layout paint;
    }
    .site-header-cover.is-collapsed { height:0; opacity:0; }
    .site-header-cover-media {
      position:relative;
      transform-origin:top center;
      transition:transform .42s cubic-bezier(.22,1,.36,1), opacity .28s ease;
      will-change:transform;
      contain:paint;
    }
    .site-header-cover.is-collapsed .site-header-cover-media { transform:translate3d(0,-10px,0); opacity:.65; }
    .site-header-logo-shell {
      position:fixed;
      top:0;
      left:0;
      width:42px;
      height:42px;
      z-index:10000;
      transform-origin:top left;
      transition:transform .42s cubic-bezier(.22,1,.36,1);
      will-change:transform;
      backface-visibility:hidden;
      -webkit-backface-visibility:hidden;
    }
    .site-header-logo-shell.is-expanded { transform:translate3d(2rem, calc(15vh - 3.95rem), 0) scale(3.58); }
    .site-header-logo-shell.is-scrolled { transform:translate3d(88px, 9px, 0) scale(1.04); }
    .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
    .scrollbar-hide::-webkit-scrollbar { display:none; }
    .slyrah-mobile-drawer { transform:translateX(-110%); transition:transform .34s cubic-bezier(.22,1,.36,1); }
    html[dir="rtl"] .slyrah-mobile-drawer { transform:translateX(-110%); }
    .slyrah-mobile-drawer.is-open { transform:translateX(0) !important; }
    .slyrah-mobile-backdrop { opacity:0; pointer-events:none; transition:opacity .22s ease; }
    .slyrah-mobile-backdrop.is-open { opacity:1; pointer-events:auto; }
    .slyrah-mobile-submenu { display:none; }
    .slyrah-mobile-submenu.is-open { display:block; }
    @media (max-width:767px) {
      .site-header-logo-shell.is-expanded { transform:translate3d(1.58rem, calc(15vh - 3.02rem), 0) scale(2.96); }
      .site-header-logo-shell.is-scrolled { transform:translate3d(68px, 9px, 0) scale(1.02); }
      body { padding-bottom:72px; }
    }
    @supports (-webkit-touch-callout:none) {
      .site-header-cover, .site-header-cover-media, .site-header-logo-shell {
        -webkit-transform:translateZ(0);
        transform:translateZ(0);
      }
      .site-header-cover { transition:height .34s ease-out, opacity .22s ease-out; }
      .site-header-cover-media { transition:transform .34s ease-out, opacity .22s ease-out; }
      .site-header-logo-shell { transition:transform .34s ease-out; }
      .site-header-logo-shell.is-expanded { transform:translate3d(1.56rem, calc(15vh - 2.82rem), 0) scale(2.9); }
    }
    @media (prefers-reduced-motion:reduce) {
      .site-header-cover, .site-header-cover-media, .site-header-logo-shell { animation:none !important; transition:none !important; }
    }
    @media (max-width:820px){ .storefront-spacer { height:calc(30vh + 188px); min-height:290px; } }
  `;
}

function storefrontHeadAssetsHtml() {
  return `<link rel="stylesheet" href="/_next/static/css/843be7308c9c3c0a.css" data-precedence="next"/>
  <link rel="stylesheet" href="/_next/static/css/b9fbc6ffbacc0ce3.css" data-precedence="next"/>
  <link rel="stylesheet" href="/_next/static/css/a9b21774882a3827.css"/>
  <link rel="stylesheet" href="/_next/static/css/325571e309da4243.css"/>`;
}

function storefrontCategoryLinks(gender) {
  const fallback = [
    { slug: "watches", name_ar: "ساعات", name_en: "Watches" },
    { slug: "wallets", name_ar: "محافظ", name_en: "Wallets" },
    { slug: "belt", name_ar: "أحزمة", name_en: "Belts" },
    { slug: "bag", name_ar: "حقائب", name_en: "Bags" },
    { slug: "perfume", name_ar: "عطور", name_en: "Perfumes" }
  ];
  const rows = activeRows("categories");
  const categories = rows.length ? rows : fallback;
  return categories.slice(0, 6).map((category) => {
    const slug = category.slug || String(category.name_en || category.name_ar || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const ar = category.name_ar || category.title_ar || category.name || category.name_en || slug;
    const en = category.name_en || category.title_en || category.name || category.name_ar || slug;
    return `<a href="/products?gender=${gender}&category=${escapeHtml(slug)}" class="text-[13px] min-[440px]:text-[14.5px] sm:text-base md:text-[1.02rem] lg:text-[1.06rem] font-medium hover:text-[var(--primary-color)] transition-colors relative group flex-shrink-0" style="--primary-color:${escapeHtml((getSetting("companyInfo") || {}).primary_color || "#b20000")}"><span data-ar="${escapeHtml(ar)}" data-en="${escapeHtml(en)}">${escapeHtml(ar)}</span><span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary-color)] transition-all duration-300 group-hover:w-full"></span></a>`;
  }).join("");
}

function storefrontRawHeaderHtml() {
  const company = getSetting("companyInfo") || {};
  const homeSections = getSetting("homeSections") || {};
  const primaryColor = company.primary_color || "#b20000";
  const logoUrl = company.logo_url || "/logo-premiumbrand.png";
  const siteName = company.site_name_en || company.name_en || "Slyrah";
  const phone = company.phone || "";
  const email = company.email || "";
  const facebookUrl = company.facebook_url || "";
  const instagramUrl = company.instagram_url || "";
  const tiktokUrl = company.tiktok_url || "";
  const sliders = activeRows("content").filter((item) => String(item.type || item.section || "").toLowerCase().includes("slider"));
  const slide = sliders.find((item) => item.media_url || item.media_url_desktop || item.media_url_mobile || item.image_url) || {};
  const deletedMedia = new Set(entityRows("image_gallery_deleted", true).map((item) => String(item.url || "")));
  const availableMedia = (...candidates) => candidates.find((candidate) => {
    if (!candidate) return false;
    try { return !deletedMedia.has(String(candidate)) && !deletedMedia.has(new URL(String(candidate), "https://ecommerce.siteyfy.com").pathname); }
    catch { return !deletedMedia.has(String(candidate)); }
  });
  const desktopHero = optimizedImage(availableMedia(slide.media_url_desktop, slide.media_url, slide.image_url, slide.media_url_mobile, "/uploads/catalog/gift.png"), 1920);
  const mobileHero = optimizedImage(availableMedia(slide.media_url_mobile, slide.media_url, slide.image_url, slide.media_url_desktop, "/uploads/catalog/gift.png"), 1080);
  const iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
  return `<header class="site-header-portal fixed top-0 left-0 right-0 w-full z-[40] transition-colors duration-300" dir="ltr">
    <div class="site-header-cover relative w-full overflow-hidden bg-black ">
      <div class="site-header-cover-media h-[30vh]">
        <section class="relative overflow-hidden bg-black group text-white h-full w-full"><div class="absolute inset-0" style="will-change:opacity;-webkit-backface-visibility:hidden;backface-visibility:hidden;opacity:1"><div class="absolute inset-0 transition-transform ease-linear transform group-hover:scale-105 bg-black overflow-hidden" style="transition-duration:10000ms;will-change:transform;-webkit-transform:translateZ(0);transform:translateZ(0);-webkit-backface-visibility:hidden;backface-visibility:hidden"><picture><source media="(max-width: 767px)" srcset="${escapeHtml(mobileHero)}"/><source media="(min-width: 768px)" srcset="${escapeHtml(desktopHero)}"/><img alt="Hero Image" fetchpriority="high" decoding="async" class="object-cover object-center" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-fit:cover;color:transparent" sizes="100vw" src="${escapeHtml(desktopHero)}"/></picture></div><div class="absolute inset-0 transition-opacity duration-300 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent"></div></div></section>
        <div class="absolute inset-0 bg-black/40 pointer-events-none"></div>
      </div>
    </div>
    <div class="site-header-logo-shell is-expanded"><a class="block relative group h-full w-full" href="/"><div class="relative h-full w-full rounded-full border-white bg-white shadow-xl overflow-hidden flex items-center justify-center transition-all duration-300 border-4"><img alt="${escapeHtml(siteName)}" fetchpriority="auto" loading="lazy" decoding="async" class="object-contain transition-all duration-300 p-1.5 md:p-2" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;color:transparent;object-fit:contain" sizes="120px" src="${escapeHtml(logoUrl)}"/></div></a></div>
    <div class="bg-white dark:bg-black border-b border-gray-100 dark:border-white/10 relative z-[50]"><div class="container mx-auto px-4 h-[60px] md:h-[70px] flex items-center justify-between pl-12 md:pl-28"><div class="flex items-center gap-14 md:gap-4"><button class="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Toggle Mobile Menu" type="button" data-mobile-menu-toggle><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button><button class="px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-bold uppercase transition-colors" type="button" data-language-toggle>EN</button></div><div class="hidden md:flex items-center justify-center flex-1"><a class="text-sm font-bold uppercase tracking-widest hover:text-[var(--primary-color)] transition-colors" style="--primary-color:${escapeHtml(primaryColor)}" href="/" data-ar="الرئيسية" data-en="Home">الرئيسية</a></div><div class="flex items-center gap-2 md:gap-4"><a class="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full" aria-label="Search" href="/products"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></a><a class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full relative hidden md:block" aria-label="Wishlist" href="/wishlist"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></a><a class="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full relative" aria-label="Cart" href="/cart">${iconSvg}<span data-cart-count class="hidden absolute top-0 right-0 w-4 h-4 text-[10px] flex items-center justify-center text-white rounded-full" style="background-color:${escapeHtml(primaryColor)}"></span></a><a class="hidden md:inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 transition hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] dark:border-white/10 dark:text-gray-200 text-xs font-semibold uppercase tracking-[0.18em] text-gray-700" style="--primary-color:${escapeHtml(primaryColor)}" aria-label="تسجيل الدخول" href="/login.html"><span class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 dark:border-white/10"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><span data-ar="تسجيل الدخول" data-en="Login">تسجيل الدخول</span></a></div></div></div>
    ${homeSections.headerCategoryBanners !== false ? `<div class="relative z-[39] bg-white dark:bg-black shadow-md border-b border-gray-100 dark:border-white/10 w-full" dir="rtl">
      <div class="w-full border-b border-gray-100 dark:border-white/10 py-4 bg-white dark:bg-black"><div class="container mx-auto px-4 flex items-center gap-4 md:gap-6"><div class="w-20 min-[440px]:w-24 md:w-40 flex-shrink-0 font-bold uppercase tracking-tighter sm:tracking-widest text-[13.5px] min-[440px]:text-[15px] sm:text-[1.05rem] md:text-[1.08rem] lg:text-[1.12rem] border-e border-gray-200 dark:border-white/20 pe-2 min-[440px]:pe-3 md:pe-6 flex items-center justify-center leading-tight whitespace-nowrap" data-ar="للنساء" data-en="Women">للنساء</div><div class="flex-1 relative overflow-hidden" dir="ltr"><div class="flex justify-center items-center gap-8 md:gap-12 w-full">${storefrontCategoryLinks("women")}</div></div></div></div>
      <div class="w-full border-b border-gray-100 dark:border-white/10 py-4 bg-white dark:bg-black"><div class="container mx-auto px-4 flex items-center gap-4 md:gap-6"><div class="w-20 min-[440px]:w-24 md:w-40 flex-shrink-0 font-bold uppercase tracking-tighter sm:tracking-widest text-[13.5px] min-[440px]:text-[15px] sm:text-[1.05rem] md:text-[1.08rem] lg:text-[1.12rem] border-e border-gray-200 dark:border-white/20 pe-2 min-[440px]:pe-3 md:pe-6 flex items-center justify-center leading-tight whitespace-nowrap" data-ar="للرجال" data-en="Men">للرجال</div><div class="flex-1 relative overflow-hidden" dir="ltr"><div class="flex justify-center items-center gap-8 md:gap-12 w-full">${storefrontCategoryLinks("men")}</div></div></div></div>
    </div>` : ""}
  </header><div class="slyrah-mobile-backdrop md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000]" data-mobile-menu-close></div><nav class="slyrah-mobile-drawer md:hidden fixed top-0 left-0 h-[100dvh] w-4/5 max-w-sm bg-white dark:bg-zinc-900 shadow-2xl z-[10001] flex flex-col pt-6 overflow-hidden" dir="rtl" aria-label="Mobile Menu"><div class="flex justify-end px-4 pb-4"><button class="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full" aria-label="Close Menu" type="button" data-mobile-menu-close><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div><div class="px-6 flex flex-col relative h-full overflow-hidden"><div class="flex-1 overflow-y-auto pb-28 custom-scrollbar"><ul class="space-y-1"><li><a href="/login.html" class="w-full flex items-center gap-4 py-4 px-2 text-base font-bold select-none active:bg-gray-50 dark:active:bg-white/5 rounded-xl"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span data-ar="تسجيل الدخول" data-en="Login">تسجيل الدخول</span></a></li><li><a href="/products" class="w-full flex items-center gap-4 py-4 px-2 text-base font-bold select-none active:bg-gray-50 dark:active:bg-white/5 rounded-xl text-red-600 dark:text-red-400"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span data-ar="الأكثر مبيعاً" data-en="Top Sales">الأكثر مبيعاً</span></a></li><li><button type="button" data-mobile-submenu-toggle="categories" class="w-full flex items-center justify-between py-4 px-2 text-base font-bold select-none active:bg-gray-50 dark:active:bg-white/5 rounded-xl"><span class="flex items-center gap-4"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg><span data-ar="الفئات" data-en="Categories">الفئات</span></span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button><ul class="slyrah-mobile-submenu overflow-hidden pr-12 space-y-4 mb-2 mt-1 text-gray-500 font-medium" data-mobile-submenu="categories"><li><a href="/products" class="block py-1 hover:text-black dark:hover:text-white" data-ar="عرض الكل" data-en="View All">عرض الكل</a></li>${activeRows("categories").slice(0, 12).map((cat) => `<li><a href="/products?category=${escapeHtml(cat.slug || cat.id)}" class="block py-1 hover:text-black dark:hover:text-white" data-ar="${escapeHtml(cat.name_ar || cat.name_en || "Category")}" data-en="${escapeHtml(cat.name_en || cat.name_ar || "Category")}">${escapeHtml(cat.name_ar || cat.name_en || "Category")}</a></li>`).join("")}</ul></li><li><a href="/cart" class="w-full flex items-center justify-between py-4 text-base font-bold select-none active:bg-gray-50 dark:active:bg-white/5 rounded-xl px-2"><span class="flex items-center gap-4">${iconSvg}<span data-ar="السلة" data-en="Cart">السلة</span></span><span data-cart-count class="hidden bg-black dark:bg-white text-white dark:text-black rounded-full px-2.5 py-0.5 text-xs font-bold"></span></a></li><li><a href="/order-tracking" class="w-full flex items-center gap-4 py-4 px-2 text-base font-bold select-none active:bg-gray-50 dark:active:bg-white/5 rounded-xl"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg><span data-ar="تتبع الشحنة" data-en="Track Order">تتبع الشحنة</span></a></li></ul><div class="h-px bg-gray-100 dark:bg-white/10 my-6"></div><div class="space-y-4 px-2" dir="ltr">${phone ? `<a href="tel:${escapeHtml(phone)}" class="flex items-center gap-4 text-gray-600 dark:text-gray-400 p-2 -mx-2 rounded-xl active:bg-gray-50 dark:active:bg-white/5"><span class="bg-gray-100 dark:bg-white/10 p-2.5 rounded-full"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span><span class="font-medium tracking-wide">${escapeHtml(phone)}</span></a>` : ""}${email ? `<a href="mailto:${escapeHtml(email)}" class="flex items-center gap-4 text-gray-600 dark:text-gray-400 p-2 -mx-2 rounded-xl active:bg-gray-50 dark:active:bg-white/5"><span class="bg-gray-100 dark:bg-white/10 p-2.5 rounded-full"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg></span><span class="font-medium text-sm md:text-base break-all">${escapeHtml(email)}</span></a>` : ""}</div></div><div class="border-t border-gray-100 dark:border-white/10 pt-6 pb-safe safe-area-bottom mb-2 bg-white dark:bg-zinc-900 absolute bottom-0 left-0 right-0 z-10 px-6"><div class="flex items-center gap-4 justify-center">${facebookUrl ? `<a href="${escapeHtml(facebookUrl)}" target="_blank" rel="noopener noreferrer" class="p-3 bg-gray-50 dark:bg-white/5 rounded-full hover:-translate-y-1 transition-transform" style="color:#1877F2" aria-label="Facebook"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14-3.414 0-5.643 2.03-5.643 5.86v3.64H6v4h3.5v9.5h4.5v-9.5z"/></svg></a>` : ""}${instagramUrl ? `<a href="${escapeHtml(instagramUrl)}" target="_blank" rel="noopener noreferrer" class="p-3 bg-gray-50 dark:bg-white/5 rounded-full hover:-translate-y-1 transition-transform" style="color:#E4405F" aria-label="Instagram"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg></a>` : ""}${tiktokUrl ? `<a href="${escapeHtml(tiktokUrl)}" target="_blank" rel="noopener noreferrer" class="p-3 bg-gray-50 dark:bg-white/5 rounded-full hover:-translate-y-1 transition-transform text-black dark:text-white" aria-label="TikTok">♪</a>` : ""}</div></div></div></nav><div class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-white/10 z-[100] flex items-center justify-around pb-safe safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,.05)]"><a href="/" class="flex flex-col items-center justify-center py-3 w-full text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span class="text-[10px] mt-1 shrink-0 font-[var(--font-tajawal)]" data-ar="الرئيسية" data-en="Home">الرئيسية</span></a><a href="/products" class="flex flex-col items-center justify-center py-3 w-full text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span class="text-[10px] mt-1 shrink-0 font-[var(--font-tajawal)]" data-ar="بحث" data-en="Search">بحث</span></a><a href="/cart" class="flex flex-col items-center justify-center py-3 w-full relative text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"><span class="relative">${iconSvg}<span data-cart-count class="hidden absolute -top-1.5 -right-2.5 w-4 h-4 text-[10px] font-bold flex items-center justify-center text-white rounded-full" style="background-color:${escapeHtml(primaryColor)}"></span></span><span class="text-[10px] mt-1 shrink-0 font-[var(--font-tajawal)]" data-ar="السلة" data-en="Cart">السلة</span></a><a href="/wishlist" class="flex flex-col items-center justify-center py-3 w-full relative text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span class="text-[10px] mt-1 shrink-0 font-[var(--font-tajawal)]" data-ar="المفضلة" data-en="Wishlist">المفضلة</span></a></div><div class="storefront-spacer" aria-hidden="true"></div>`;
}

function storefrontHeaderHtml() {
  const html = storefrontRawHeaderHtml();
  if (shippingSettings().is_active) return html;
  return html.replace(/<li><a href="\/order-tracking"[\s\S]*?<\/li>/, "");
}

function storefrontFooterHtml() {
  const company = getSetting("companyInfo") || {};
  const shipping = shippingSettings();
  const siteAr = company.site_name_ar || company.name_ar || "سليراه";
  const siteEn = company.site_name_en || company.name_en || "Slyrah";
  const addressAr = company.address_ar || company.address_en || "";
  const addressEn = company.address_en || company.address_ar || "";
  return `<footer class="relative mt-24 pt-16 pb-8 border-t border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#0a0a0a] transition-colors duration-300" style="box-shadow:0 -20px 40px -20px rgba(0,0,0,.15)">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
        <div class="flex flex-col items-start space-y-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-wider" data-ar="${escapeHtml(siteAr)}" data-en="${escapeHtml(siteEn)}">${escapeHtml(siteEn)}</h2>
          ${siteAr ? `<span class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(siteAr)}</span>` : ""}
          <p class="text-sm text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed" data-ar="اكتشف مجموعتنا المختارة من الساعات والإكسسوارات الفاخرة. جودة وأناقة في كل تفصيلة." data-en="Discover our exclusive collection of premium watches and accessories. Quality and elegance in every detail.">Discover our exclusive collection of premium watches and accessories. Quality and elegance in every detail.</p>
          ${(company.facebook_url || company.instagram_url) ? `<div class="flex items-center gap-4 mt-4">${company.facebook_url ? `<a href="${escapeHtml(company.facebook_url)}" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors" aria-label="Facebook"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14-3.414 0-5.643 2.03-5.643 5.86v3.64H6v4h3.5v9.5h4.5v-9.5z"/></svg></a>` : ""}${company.instagram_url ? `<a href="${escapeHtml(company.instagram_url)}" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-pink-600 hover:text-white dark:hover:bg-pink-600 transition-colors" aria-label="Instagram"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg></a>` : ""}</div>` : ""}
        </div>
        <div>
          <h3 class="font-bold text-xs tracking-widest uppercase mb-6 text-gray-900 dark:text-white after:content-[''] after:block after:w-8 after:h-0.5 after:bg-gray-400 dark:after:bg-white/20 after:mt-3 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-fit"><a href="/contact-us" data-ar="تواصل معنا" data-en="Contact Us">تواصل معنا</a></h3>
          <ul class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            ${addressAr || addressEn ? `<li class="flex items-start gap-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="flex-shrink-0 text-gray-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span class="leading-relaxed">${escapeHtml(addressEn)}<br/>${escapeHtml(addressAr)}</span></li>` : ""}
            ${company.email ? `<li class="flex items-center gap-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="flex-shrink-0 text-gray-500"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg><a href="mailto:${escapeHtml(company.email)}" class="hover:text-white transition-colors">${escapeHtml(company.email)}</a></li>` : ""}
            ${company.phone ? `<li class="flex items-center gap-3"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="flex-shrink-0 text-gray-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><a href="tel:${escapeHtml(company.phone)}" class="hover:text-gray-900 dark:hover:text-white transition-colors">${escapeHtml(company.phone)}</a></li>` : ""}
          </ul>
        </div>
        <div>
          <h3 class="font-bold text-xs tracking-widest uppercase mb-6 text-gray-900 dark:text-white after:content-[''] after:block after:w-8 after:h-0.5 after:bg-gray-400 dark:after:bg-white/20 after:mt-3" data-ar="معلومات" data-en="Information">معلومات</h3>
          <div class="flex flex-col space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <a href="/contact-us" class="hover:text-gray-900 dark:hover:text-white transition-colors" data-ar="اتصل بنا" data-en="Contact Us">اتصل بنا</a>
            ${shipping.is_active ? `<a href="/order-tracking" class="hover:text-gray-900 dark:hover:text-white transition-colors" data-ar="تتبع الشحنة" data-en="Track Order">تتبع الشحنة</a>` : ""}
            <a href="/refund-policy" class="hover:text-gray-900 dark:hover:text-white transition-colors" data-ar="سياسة الاستبدال والاسترجاع" data-en="Return & Exchange Policy">سياسة الاستبدال والاسترجاع</a>
            <a href="/terms-conditions" class="hover:text-gray-900 dark:hover:text-white transition-colors" data-ar="الشروط والأحكام" data-en="Terms & Conditions">الشروط والأحكام</a>
            ${shipping.is_active ? `<a href="/shipping-policy" class="hover:text-gray-900 dark:hover:text-white transition-colors" data-ar="سياسة الشحن" data-en="Shipping Policy">سياسة الشحن</a>` : ""}
          </div>
        </div>
      </div>
      <div class="border-t border-gray-200 dark:border-white/10 pt-8 flex flex-col items-center">
        <p class="text-sm text-gray-600 dark:text-gray-400 font-medium tracking-wide">© 2025 <span class="text-gray-900 dark:text-white font-bold" data-ar="${escapeHtml(siteAr)}" data-en="${escapeHtml(siteEn)}">${escapeHtml(siteAr)}</span>. <span data-ar="جميع الحقوق محفوظة" data-en="All rights reserved">جميع الحقوق محفوظة</span></p>
      </div>
    </div>
  </footer>`;
}

function storefrontLanguageScript() {
  return `<script>
    function applyStorefrontLanguage(language) {
      const lang = language === "en" ? "en" : "ar";
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.querySelectorAll("[data-ar][data-en]").forEach((node) => { node.textContent = node.dataset[lang]; });
      document.querySelectorAll("[data-desc-lang]").forEach((node) => { node.hidden = node.dataset.descLang !== lang; });
      document.querySelectorAll("[data-ar-placeholder][data-en-placeholder]").forEach((node) => { node.placeholder = node.dataset[lang + "Placeholder"] || node.placeholder; });
      document.querySelectorAll("[data-language-toggle]").forEach((node) => { node.textContent = lang === "ar" ? "EN" : "AR"; });
      localStorage.setItem("language", lang);
    }
    document.addEventListener("DOMContentLoaded", () => {
      applyStorefrontLanguage(localStorage.getItem("language") || "ar");
      const updateHeaderScroll = () => {
        const scrolled = window.scrollY > 50;
        document.querySelectorAll(".site-header-cover").forEach((node) => node.classList.toggle("is-collapsed", scrolled));
        document.querySelectorAll(".site-header-logo-shell").forEach((node) => {
          node.classList.toggle("is-expanded", !scrolled);
          node.classList.toggle("is-scrolled", scrolled);
          const inner = node.querySelector(".rounded-full");
          if (inner) {
            inner.classList.toggle("border-4", !scrolled);
            inner.classList.toggle("border-2", scrolled);
          }
        });
      };
      const updateCartCount = () => {
        let count = 0;
        try { count = JSON.parse(localStorage.getItem("slyrah_cart") || localStorage.getItem("cart") || "[]").reduce((sum, item) => sum + Number(item.quantity || 1), 0); } catch {}
        document.querySelectorAll("[data-cart-count]").forEach((node) => {
          node.textContent = String(count);
          node.classList.toggle("hidden", count <= 0);
        });
      };
      const closeMobileMenu = () => {
        document.querySelector(".slyrah-mobile-drawer")?.classList.remove("is-open");
        document.querySelector(".slyrah-mobile-backdrop")?.classList.remove("is-open");
        document.body.style.overflow = "";
      };
      const openMobileMenu = () => {
        document.querySelector(".slyrah-mobile-drawer")?.classList.add("is-open");
        document.querySelector(".slyrah-mobile-backdrop")?.classList.add("is-open");
        document.body.style.overflow = "hidden";
      };
      updateHeaderScroll();
      updateCartCount();
      window.addEventListener("scroll", updateHeaderScroll, { passive: true });
      window.addEventListener("storage", updateCartCount);
      window.addEventListener("slyrah-cart-updated", updateCartCount);
      document.querySelectorAll("[data-mobile-menu-toggle]").forEach((button) => button.addEventListener("click", openMobileMenu));
      document.querySelectorAll("[data-mobile-menu-close]").forEach((button) => button.addEventListener("click", closeMobileMenu));
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMobileMenu(); });
      document.querySelectorAll("[data-mobile-submenu-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
          const id = button.getAttribute("data-mobile-submenu-toggle");
          document.querySelector('[data-mobile-submenu="' + id + '"]')?.classList.toggle("is-open");
        });
      });
      document.querySelectorAll("[data-language-toggle]").forEach((button) => {
        button.addEventListener("click", () => applyStorefrontLanguage((localStorage.getItem("language") || "ar") === "ar" ? "en" : "ar"));
      });
      document.addEventListener("click", (event) => { if (event.target.closest("[data-cart-count]")) setTimeout(updateCartCount, 50); });
    });
  </script>`;
}

function productDetailHtml(product) {
  const title = product.name_ar || product.name_en || "Product";
  const englishTitle = product.name_en || product.name_ar || "Product";
  const image = optimizedImage(product.main_photo_url || product.image_url || "/uploads/catalog/gift.png", 1200);
  const variants = (product.variants || []).filter((variant) => variant.is_active !== false);
  const baseSalePrice = Number(product.sale_price || product.price || 0);
  const baseComparePrice = product.sale_price && product.price ? Number(product.price || 0) : 0;
  const cartProduct = {
    id: product.id,
    slug: product.slug,
    category_slug: product.category_slug || product.category?.slug || "",
    name_ar: title,
    name_en: englishTitle,
    image_url: image,
    price: baseSalePrice,
    compare_at_price: baseComparePrice,
    variants: variants.map((variant, index) => ({
      id: variant.id || `variant-${index}`,
      label: [variant.color, variant.option, variant.value].filter(Boolean).join(" / "),
      image_url: optimizedImage(variant.image_url || image, 1200),
      price: Number(variant.price || 0) || (baseSalePrice + Number(variant.price_adjustment || 0)),
      compare_at_price: Number(variant.compare_at_price || 0) || baseComparePrice
    }))
  };
  const gallery = Array.from(new Set([image, ...(product.side_photos || []), ...(product.gallery || []), ...(product.images || []), ...variants.map((variant) => variant.image_url)].filter(Boolean).map((src) => optimizedImage(src, 640))));
  const price = baseSalePrice.toLocaleString("ar-EG");
  const comparePrice = baseComparePrice ? baseComparePrice.toLocaleString("ar-EG") : "";
  const brand = product.brand?.name_ar || product.brand_ar || product.brand?.name_en || product.brand_en || "";
  const category = product.category?.name_ar || product.category_name_ar || product.category?.name_en || product.category_name_en || "";
  const descriptionAr = product.description_ar || product.short_description_ar || "";
  const descriptionEn = product.description_en || product.short_description_en || "";
  const shipping = shippingSettings();
  const related = storeProductRows()
    .filter((item) => item.id !== product.id && item.category_slug === product.category_slug)
    .slice(0, 4);

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Slyrah</title>
  <meta name="description" content="${escapeHtml(product.short_description_ar || descriptionAr || descriptionEn)}" />
  ${storefrontHeadAssetsHtml()}
  <style>
    :root { --brand:${escapeHtml((getSetting("companyInfo") || {}).primary_color || "#b20000")}; --ink:#111111; --muted:#666666; --line:#e5e7eb; --soft:#f5f5f5; }
    ${storefrontChromeCss()}
    * { box-sizing: border-box; }
    body { margin:0; font-family: "Tajawal", "Arial", sans-serif; color:var(--ink); background:#fff; }
    a { color:inherit; text-decoration:none; }
    .wrap { max-width:1280px; margin:0 auto; padding:2rem 1rem 5rem; }
    .crumbs { color:#6b7280; font-size:14px; padding:1.5rem 0; margin-bottom:1rem; }
    .product { display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:3rem; margin-top:2rem; align-items:start; }
    .gallery-column { grid-column:span 7/span 7; min-width:0; }
    .panel-column { grid-column:span 5/span 5; position:relative; min-width:0; }
    .panel { position:sticky; top:6rem; display:flex; flex-direction:column; gap:2rem; }
    .gallery-main { position:relative; width:100%; aspect-ratio:1/1; background:#f5f5f5; overflow:hidden; display:grid; place-items:center; }
    .gallery-main img { width:100%; height:100%; object-fit:contain; padding:1rem; }
    .gallery-arrow { position:absolute; top:50%; transform:translateY(-50%); z-index:3; width:44px; height:44px; border:1px solid #e5e7eb; background:rgba(255,255,255,.92); border-radius:50%; display:grid; place-items:center; cursor:pointer; font-size:24px; }
    .gallery-arrow.prev { left:14px; } .gallery-arrow.next { right:14px; }
    .gallery-fullscreen { position:absolute; top:14px; right:14px; z-index:3; width:42px; height:42px; border:1px solid #e5e7eb; background:#fff; border-radius:50%; display:grid; place-items:center; cursor:pointer; }
    .thumbs { display:flex; gap:10px; margin-top:12px; overflow-x:auto; scrollbar-width:none; }
    .thumbs::-webkit-scrollbar { display:none; }
    .thumb { flex:0 0 86px; width:86px; height:86px; border:2px solid transparent; background:#f7f7f7; padding:4px; cursor:pointer; }
    .thumb.active { border-color:var(--brand); } .thumb img { width:100%; height:100%; object-fit:contain; }
    .brand-link { display:inline-block; width:max-content; background:#f3f4f6; color:#111; padding:.5rem 1rem; border-radius:4px; font-weight:800; text-transform:uppercase; font-size:.875rem; }
    h1 { font-size:clamp(2.25rem,4vw,3rem); line-height:1.12; margin:0; font-weight:800; }
    .price { display:flex; align-items:baseline; gap:12px; }
    .price strong { color:var(--brand); font-size:clamp(1.875rem,3vw,2.25rem); font-weight:700; }
    .price del { color:#9ca3af; font-size:1.125rem; }
    .stock { display:flex; align-items:center; gap:.5rem; color:#16a34a; font-size:.875rem; text-transform:uppercase; }
    .stock-dot { width:8px; height:8px; border-radius:50%; background:#16a34a; animation:pulse 1.8s infinite; }
    @keyframes pulse { 50% { opacity:.35; } }
    .meta { display:flex; flex-wrap:wrap; gap:10px; }
    .pill { border:1px solid var(--line); background:#fff; border-radius:4px; padding:7px 11px; color:#374151; font-weight:700; font-size:.875rem; }
    .variants { display:grid; gap:12px; }
    .variants h2 { font-size:.875rem; margin:0; text-transform:uppercase; }
    .variant-list { display:flex; flex-wrap:wrap; gap:10px; }
    .variant-option { border:1px solid #d1d5db; background:#fff; border-radius:4px; min-height:42px; padding:0 14px; font-weight:800; cursor:pointer; }
    .variant-option.active { border-color:var(--brand); color:var(--brand); box-shadow:0 0 0 2px color-mix(in srgb,var(--brand) 12%,transparent); }
    .quantity { display:flex; align-items:center; padding:4px; border:1px solid #d1d5db; border-radius:999px; width:max-content; }
    .quantity button { width:40px; height:40px; border:0; background:transparent; border-radius:50%; cursor:pointer; font-size:20px; }
    .quantity span { width:48px; text-align:center; font-weight:700; }
    .actions { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .btn { border:0; min-height:58px; padding:0 20px; border-radius:8px; font-weight:800; text-transform:uppercase; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
    .primary { background:#111; color:#fff; } .buy { background:var(--brand); color:#fff; }
    .notice { min-height:40px; display:none; align-items:center; padding:0 14px; border-radius:4px; background:#ecfdf5; color:#047857; font-weight:800; }
    .notice.show { display:inline-flex; }
    .shipping-note { border:1px solid #d1fae5; background:#ecfdf5; color:#047857; padding:12px 14px; font-size:.875rem; }
    .desc { border-top:1px solid var(--line); padding-top:2rem; }
    .desc h2 { font-size:1.125rem; margin:0 0 .5rem; } .desc p { color:#4b5563; line-height:1.9; margin:0; white-space:pre-line; }
    .related { margin-top:5rem; border-top:1px solid var(--line); padding-top:2rem; }
    .related h2 { font-size:1.5rem; } .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
    .card { border:1px solid #f3f4f6; border-radius:16px; background:#fff; padding:6px; transition:box-shadow .25s ease; }
    .card:hover { box-shadow:0 10px 30px rgba(0,0,0,.08); } .card img { width:100%; aspect-ratio:4/5; object-fit:contain; background:#f5f5f5; border-radius:12px; display:block; }
    .card div { padding:10px 8px; font-weight:700; font-size:.875rem; }
    .lightbox { position:fixed; inset:0; z-index:12000; background:rgba(0,0,0,.92); display:none; place-items:center; padding:24px; }
    .lightbox.open { display:grid; } .lightbox img { max-width:95vw; max-height:90vh; object-fit:contain; } .lightbox button { position:absolute; top:20px; right:20px; width:44px; height:44px; border:0; border-radius:50%; background:#fff; font-size:24px; cursor:pointer; }
    @media (max-width:1023px) { .product { grid-template-columns:1fr; } .gallery-column,.panel-column { grid-column:auto; } .panel { position:static; } }
    @media (max-width:640px) { .wrap { padding-inline:12px; } .product { gap:2rem; } .actions { grid-template-columns:1fr; } .grid { grid-template-columns:repeat(2,1fr); gap:8px; } .gallery-arrow { width:38px; height:38px; } h1 { font-size:2rem; } }
  </style>
</head>
<body>
  ${storefrontHeaderHtml()}
  <main class="wrap">
    <nav class="crumbs"><a href="/" data-ar="الرئيسية" data-en="Home">الرئيسية</a> / <a href="/products" data-ar="المنتجات" data-en="Products">المنتجات</a> / <span data-ar="${escapeHtml(title)}" data-en="${escapeHtml(englishTitle)}">${escapeHtml(title)}</span></nav>
    <section class="product">
      <div class="gallery-column">
        <div class="gallery-main" id="productGallery">
          <img id="mainProductImage" src="${escapeHtml(image)}" width="900" height="900" alt="${escapeHtml(title)}" fetchpriority="high" decoding="async" />
          ${gallery.length > 1 ? `<button class="gallery-arrow prev" id="galleryPrev" type="button" aria-label="Previous image">&#8249;</button><button class="gallery-arrow next" id="galleryNext" type="button" aria-label="Next image">&#8250;</button>` : ""}
          <button class="gallery-fullscreen" id="galleryFullscreen" type="button" aria-label="Fullscreen">&#x26F6;</button>
        </div>
        ${gallery.length > 1 ? `<div class="thumbs" id="galleryThumbs">${gallery.map((src, index) => `<button class="thumb${index === 0 ? " active" : ""}" type="button" data-gallery-index="${index}"><img src="${escapeHtml(src)}" width="120" height="120" alt="" loading="lazy" decoding="async" /></button>`).join("")}</div>` : ""}
      </div>
      <div class="panel-column">
      <article class="panel">
        ${brand ? `<a class="brand-link" href="/products?brand=${encodeURIComponent(product.brand_slug || brand)}" data-ar="${escapeHtml(product.brand?.name_ar || product.brand_ar || brand)}" data-en="${escapeHtml(product.brand?.name_en || product.brand_en || brand)}">${escapeHtml(brand)}</a>` : ""}
        <h1 data-ar="${escapeHtml(title)}" data-en="${escapeHtml(englishTitle)}">${escapeHtml(title)}</h1>
        <div class="price"><strong id="productPrice">${price} جنيه</strong>${comparePrice ? `<del id="productComparePrice">${comparePrice} جنيه</del>` : `<del id="productComparePrice" hidden></del>`}</div>
        <div class="stock"><span class="stock-dot"></span><span data-ar="متوفر" data-en="In stock">متوفر</span></div>
        <div class="meta">
          ${category ? `<a class="pill" href="/products?category=${escapeHtml(product.category_slug || product.category?.slug || "")}" data-ar="${escapeHtml(product.category?.name_ar || product.category_name_ar || category)}" data-en="${escapeHtml(product.category?.name_en || product.category_name_en || category)}">${escapeHtml(category)}</a>` : ""}
          ${product.color ? `<span class="pill">${escapeHtml(product.color)}</span>` : ""}${product.options ? `<span class="pill">${escapeHtml(product.options)}</span>` : ""}
        </div>
        ${variants.length ? `<div class="variants"><h2 data-ar="الاختيارات" data-en="Options">الاختيارات</h2><div class="variant-list">
          ${variants.map((variant, index) => {
            const variantPrice = Number(variant.price || 0) || (baseSalePrice + Number(variant.price_adjustment || 0));
            const variantCompare = Number(variant.compare_at_price || 0) || baseComparePrice;
            const label = [variant.color, variant.option, variant.value].filter(Boolean).join(" / ");
            return `<button class="variant-option" type="button" data-variant-index="${index}" data-image="${escapeHtml(optimizedImage(variant.image_url || image, 1200))}" data-price="${variantPrice}" data-compare="${variantCompare}">${escapeHtml(label)}</button>`;
          }).join("")}
        </div></div>` : ""}
        <div class="quantity"><button id="qtyMinus" type="button" aria-label="Decrease">-</button><span id="productQuantity">1</span><button id="qtyPlus" type="button" aria-label="Increase">+</button></div>
        <div class="notice" id="cartNotice" data-ar="تمت إضافة المنتج للسلة" data-en="Product added to cart">تمت إضافة المنتج للسلة</div>
        <div class="actions"><button class="btn primary" id="addToCartBtn" type="button" data-ar="أضف للسلة" data-en="Add to Cart">أضف للسلة</button><button class="btn buy" id="buyNowBtn" type="button" data-ar="اشتري الآن" data-en="Buy Now">اشتري الآن</button></div>
        ${shipping.is_active ? `<div class="shipping-note" data-ar="يتم حساب تكلفة الشحن عند إتمام الطلب" data-en="Shipping is calculated at checkout">يتم حساب تكلفة الشحن عند إتمام الطلب</div>` : ""}
        <div class="desc">
          <section data-desc-lang="ar"><h2>الوصف</h2><p>${escapeHtml(descriptionAr || descriptionEn)}</p></section>
          <section data-desc-lang="en" dir="ltr" style="text-align:left"><h2>Description</h2><p>${escapeHtml(descriptionEn || descriptionAr)}</p></section>
        </div>
      </article>
      </div>
    </section>
    ${related.length ? `<section class="related"><h2 data-ar="منتجات مشابهة" data-en="Related products">منتجات مشابهة</h2><div class="grid">${related.map((item) => `<a class="card" href="/product/${item.id}"><img src="${escapeHtml(optimizedImage(item.main_photo_url || item.image_url || image, 640))}" width="240" height="240" loading="lazy" decoding="async" alt="${escapeHtml(item.name_ar || item.name_en)}" /><div data-ar="${escapeHtml(item.name_ar || item.name_en)}" data-en="${escapeHtml(item.name_en || item.name_ar)}">${escapeHtml(item.name_ar || item.name_en)}</div></a>`).join("")}</div></section>` : ""}
  </main>
  <div class="lightbox" id="productLightbox" role="dialog" aria-modal="true" aria-label="Product image"><button id="closeLightbox" type="button" aria-label="Close">&times;</button><img id="lightboxImage" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" /></div>
  ${storefrontFooterHtml()}
  ${storefrontLanguageScript()}
  <script>
    const productData = ${JSON.stringify(cartProduct)};
    const galleryImages = ${JSON.stringify(gallery)};
    let selectedVariant = productData.variants[0] || null;
    let quantity = 1;
    let galleryIndex = 0;
    function cartItems() {
      try {
        const modern = JSON.parse(localStorage.getItem("slyrah_cart") || "[]");
        const legacy = JSON.parse(localStorage.getItem("cart") || "[]");
        const result = new Map();
        [...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(modern) ? modern : [])].forEach(entry => {
          const productId = Number(entry.product_id || entry.productId || entry.product?.id || 0);
          if (!productId) return;
          const key = [productId, entry.colorId || "", entry.variant_id || entry.optionId || ""].join(":");
          const normalized = { ...entry, key, product_id:productId, productId, price:Number(entry.price ?? entry.variantPrice ?? entry.product?.price ?? 0), image_url:entry.image_url || entry.product?.mainPhotoUrl || "", name_ar:entry.name_ar || entry.product?.modelAr || entry.product?.model || "", name_en:entry.name_en || entry.product?.modelEn || entry.product?.model || "", quantity:Math.max(1,Number(entry.quantity || 1)) };
          const existing = result.get(key);
          result.set(key, existing ? { ...existing, ...normalized, quantity:Math.max(existing.quantity, normalized.quantity) } : normalized);
        });
        return Array.from(result.values());
      } catch { return []; }
    }
    function saveCart(items) {
      localStorage.setItem("slyrah_cart", JSON.stringify(items));
      localStorage.setItem("cart", JSON.stringify(items.map(item => ({ id:item.key, productId:item.product_id, quantity:item.quantity, optionId:item.variant_id || undefined, variantPrice:item.price, optionName:item.variant_label || undefined, product:{ id:item.product_id, brandEn:"", brandAr:"", model:item.name_en || item.name_ar, price:item.price, mainPhotoUrl:item.image_url } }))));
    }
    async function addToCart() {
      const item = {
        key: [productData.id, "", selectedVariant?.id || ""].join(":"),
        product_id: productData.id,
        slug: productData.slug,
        category_slug: productData.category_slug || "",
        name_ar: productData.name_ar,
        name_en: productData.name_en,
        image_url: selectedVariant?.image_url || productData.image_url,
        variant_id: selectedVariant?.id || null,
        variant_label: selectedVariant?.label || "",
        price: selectedVariant?.price || productData.price || 0,
        quantity
      };
      const items = cartItems();
      const existing = items.find(entry => entry.key === item.key);
      if (existing) existing.quantity = Number(existing.quantity || 1) + quantity;
      else items.push(item);
      saveCart(items);
      window.dispatchEvent(new Event("slyrah-cart-updated"));
      fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }).catch(() => {});
      const notice = document.getElementById("cartNotice");
      if (notice) {
        notice.classList.add("show");
        setTimeout(() => notice.classList.remove("show"), 1800);
      }
    }
    document.querySelectorAll(".variant-option").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".variant-option").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        selectedVariant = productData.variants[Number(button.dataset.variantIndex)] || null;
        const image = button.dataset.image;
        const price = Number(button.dataset.price || 0).toLocaleString("ar-EG");
        const compare = Number(button.dataset.compare || 0);
        const mainImage = document.getElementById("mainProductImage");
        if (mainImage && image) mainImage.src = image;
        document.getElementById("productPrice").textContent = price + ' جنيه';
        const compareBox = document.getElementById("productComparePrice");
        if (compareBox) { compareBox.hidden = !compare; compareBox.textContent = compare ? compare.toLocaleString("ar-EG") + ' جنيه' : ''; }
      });
    });
    function updateQuantity(next) { quantity = Math.max(1, Number(next || 1)); document.getElementById("productQuantity").textContent = String(quantity); }
    document.getElementById("qtyMinus")?.addEventListener("click", () => updateQuantity(quantity - 1));
    document.getElementById("qtyPlus")?.addEventListener("click", () => updateQuantity(quantity + 1));
    function renderGallery(next) { galleryIndex = (next + galleryImages.length) % galleryImages.length; const src = galleryImages[galleryIndex]; const main = document.getElementById("mainProductImage"); if (main) main.src = src; document.querySelectorAll("[data-gallery-index]").forEach((node,index) => node.classList.toggle("active",index===galleryIndex)); }
    document.getElementById("galleryPrev")?.addEventListener("click", () => renderGallery(galleryIndex - 1));
    document.getElementById("galleryNext")?.addEventListener("click", () => renderGallery(galleryIndex + 1));
    document.querySelectorAll("[data-gallery-index]").forEach(button => button.addEventListener("click", () => renderGallery(Number(button.dataset.galleryIndex))));
    let galleryTouchStart = null;
    document.getElementById("productGallery")?.addEventListener("touchstart", event => { galleryTouchStart = event.touches[0]?.clientX ?? null; }, { passive:true });
    document.getElementById("productGallery")?.addEventListener("touchend", event => { if (galleryTouchStart === null) return; const end = event.changedTouches[0]?.clientX ?? galleryTouchStart; if (Math.abs(galleryTouchStart-end)>50) renderGallery(galleryIndex + (galleryTouchStart>end ? 1 : -1)); galleryTouchStart=null; }, { passive:true });
    const lightbox = document.getElementById("productLightbox");
    document.getElementById("galleryFullscreen")?.addEventListener("click", () => { document.getElementById("lightboxImage").src = document.getElementById("mainProductImage").src; lightbox?.classList.add("open"); document.body.style.overflow="hidden"; });
    function closeLightbox(){ lightbox?.classList.remove("open"); document.body.style.overflow=""; }
    document.getElementById("closeLightbox")?.addEventListener("click", closeLightbox);
    lightbox?.addEventListener("click", event => { if (event.target===lightbox) closeLightbox(); });
    document.addEventListener("keydown", event => { if (event.key==="Escape") closeLightbox(); });
    document.getElementById("addToCartBtn")?.addEventListener("click", addToCart);
    document.getElementById("buyNowBtn")?.addEventListener("click", async () => {
      await addToCart();
      location.href = "/cart";
    });
    document.querySelectorAll("[data-ar-placeholder][data-en-placeholder]").forEach(input => { const lang=localStorage.getItem("language") === "en" ? "en" : "ar"; input.placeholder = input.dataset[lang+"Placeholder"] || input.placeholder; });
  </script>
</body>
</html>`;
}

function cartPageHtml({ checkout = false } = {}) {
  const shipping = shippingSettings();
  const pageTitleAr = checkout ? "إتمام الطلب" : "سلة التسوق";
  const pageTitleEn = checkout ? "Checkout" : "Shopping Cart";
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${pageTitleAr} | Slyrah</title>
  ${storefrontHeadAssetsHtml()}
  <style>
    :root { --brand:#b20000; --ink:#111; --muted:#666; --line:#ececec; --soft:#f8f8f8; }
    ${storefrontChromeCss()}
    * { box-sizing:border-box; }
    body { margin:0; font-family:"Tajawal", Arial, sans-serif; color:var(--ink); background:#fff; }
    a { color:inherit; text-decoration:none; }
    .nav { height:78px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:center; gap:34px; font-weight:900; }
    .logo { width:70px; height:70px; border-radius:50%; overflow:hidden; border:3px solid #fff; box-shadow:0 12px 34px rgba(0,0,0,.12); }
    .logo img { width:100%; height:100%; object-fit:contain; padding:7px; }
    .wrap { max-width:1120px; margin:0 auto; padding:42px 18px 80px; }
    h1 { font-size:clamp(32px,5vw,54px); margin:0 0 22px; }
    .layout { display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:24px; align-items:start; }
    .items, .summary, .empty { border:1px solid var(--line); background:#fff; }
    .item { display:grid; grid-template-columns:96px minmax(0,1fr) auto; gap:16px; padding:16px; border-bottom:1px solid var(--line); align-items:center; }
    .item:last-child { border-bottom:0; }
    .item img { width:96px; height:96px; object-fit:contain; background:var(--soft); padding:8px; }
    .item h2 { font-size:18px; margin:0 0 8px; }
    .meta { color:var(--muted); font-size:14px; }
    .line-offer { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:9px; }
    .line-offer .status-badge { min-height:22px; font-size:11px; }
    .line-offer del { color:#9ca3af; font-size:13px; }
    .line-offer strong { color:#087f5b; font-size:14px; }
    .line-offer .not-eligible { background:#f3f4f6; color:#6b7280; }
    .qty { display:flex; align-items:center; gap:8px; justify-content:flex-end; }
    .iconbtn, .btn { border:1px solid var(--line); background:#fff; min-height:40px; padding:0 14px; font-weight:900; cursor:pointer; }
    .iconbtn { width:40px; padding:0; }
    .danger { color:var(--brand); }
    .summary { padding:20px; position:sticky; top:18px; display:grid; gap:14px; }
    .row { display:flex; justify-content:space-between; gap:12px; border-bottom:1px solid var(--line); padding-bottom:12px; }
    .coupon { display:grid; gap:10px; border:1px solid var(--line); background:#fafafa; padding:12px; }
    .coupon-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; }
    .coupon input { width:100%; min-height:42px; border:1px solid var(--line); background:#fff; padding:0 12px; font-weight:800; text-transform:uppercase; outline:none; }
    .coupon input:focus { border-color:var(--brand); box-shadow:0 0 0 3px rgba(178,0,0,.08); }
    .coupon-msg { min-height:18px; font-size:12px; color:var(--muted); }
    .coupon-msg.ok { color:#087f5b; }
    .coupon-msg.err { color:var(--brand); }
    .status-badge { display:inline-flex; align-items:center; min-height:24px; padding:0 9px; border-radius:999px; font-size:12px; font-weight:900; background:#f1f3f5; color:#555; white-space:nowrap; }
    .status-badge.on { background:#e7f8ef; color:#087f5b; }
    .status-badge.off { background:#fff4e6; color:#b35c00; }
    .discount-row strong { color:#087f5b; }
    .total { font-size:24px; font-weight:950; color:var(--brand); }
    .primary { background:var(--brand); border-color:var(--brand); color:#fff; justify-content:center; display:flex; align-items:center; }
    .empty { min-height:320px; display:grid; place-items:center; text-align:center; padding:36px; }
    @media (max-width:820px){ .layout{grid-template-columns:1fr}.item{grid-template-columns:76px 1fr}.qty{grid-column:1/-1;justify-content:flex-start}.item img{width:76px;height:76px}.nav{gap:18px} }
  </style>
</head>
<body>
  ${storefrontHeaderHtml()}
  <main class="wrap">
    <h1 data-ar="${pageTitleAr}" data-en="${pageTitleEn}">${pageTitleAr}</h1>
    <div id="cartRoot"></div>
  </main>
  ${storefrontFooterHtml()}
  ${storefrontLanguageScript()}
  <script>
    const root = document.getElementById("cartRoot");
    const shippingConfig = ${JSON.stringify(shipping)};
    const checkoutMode = ${checkout ? "true" : "false"};
    const currency = "جنيه";
    const copy = {
      ar: { emptyTitle:"السلة فارغة", emptyBody:"ابدأ التسوق واختر المنتجات المناسبة لك.", shop:"تسوق الآن", summary:"ملخص الطلب", subtotal:"المجموع", eligibleSubtotal:"المبلغ المؤهل للخصم", discount:"الخصم", itemDiscount:"خصم المنتج", eligible:"يشمله الخصم", notEligible:"لا يشمله الخصم", coupon:"كود الخصم", couponPlaceholder:"اكتب الكود", applyCoupon:"تطبيق", removeCoupon:"إزالة", couponApplied:"تم تطبيق الكود على المنتجات المؤهلة", couponInvalid:"الكود غير صالح لهذا الطلب", shipping:"الشحن", shippingActive:"نظام الشحن مفعل", shippingFree:"شحن مجاني", checkout:"إتمام الطلب", clear:"مسح السلة", remove:"حذف", currency:"جنيه", checking:"جاري التحقق...", notFound:"كود الخصم غير موجود", inactive:"كود الخصم غير نشط", minimum:"مجموع المنتجات المؤهلة أقل من الحد الأدنى للكود", productsOnly:"الكود غير مخصص لهذه المنتجات", categoriesOnly:"الكود غير مخصص لهذه التصنيفات" },
      en: { emptyTitle:"Your cart is empty", emptyBody:"Start shopping and choose the products you like.", shop:"Shop Now", summary:"Order summary", subtotal:"Subtotal", eligibleSubtotal:"Discount-eligible subtotal", discount:"Discount", itemDiscount:"Item discount", eligible:"Discount applied", notEligible:"Not eligible", coupon:"Discount code", couponPlaceholder:"Enter code", applyCoupon:"Apply", removeCoupon:"Remove", couponApplied:"Code applied to eligible products", couponInvalid:"Code is not valid for this order", shipping:"Shipping", shippingActive:"Shipping system is active", shippingFree:"Free shipping", checkout:"Checkout", clear:"Clear cart", remove:"Remove", currency:"EGP", checking:"Checking...", notFound:"Discount code was not found", inactive:"Discount code is not active", minimum:"Eligible products are below the code minimum", productsOnly:"Discount does not apply to these products", categoriesOnly:"Discount does not apply to these categories" }
    };
    function lang(){ return (localStorage.getItem("language") || "ar") === "en" ? "en" : "ar"; }
    function t(key){ return copy[lang()][key] || copy.ar[key] || key; }
    function normalizeCartItem(item){
      const productId = Number(item?.product_id || item?.productId || item?.product?.id || (/^\d+$/.test(String(item?.id || "")) ? item.id : 0));
      const variantId = item?.variant_id || item?.optionId || null;
      return {
        ...item,
        key: [productId, item?.colorId || "", variantId || ""].join(":"),
        product_id: productId,
        productId,
        category_slug: item?.category_slug || item?.categorySlug || item?.product?.category_slug || "",
        name_ar: item?.name_ar || item?.product?.modelAr || item?.product?.model || "",
        name_en: item?.name_en || item?.product?.modelEn || item?.product?.model || "",
        image_url: item?.image_url || item?.product?.mainPhotoUrl || "",
        variant_id: variantId,
        variant_label: item?.variant_label || [item?.colorNameAr || item?.colorName, item?.optionNameAr || item?.optionName].filter(Boolean).join(" / "),
        price: Number(item?.price ?? item?.variantPrice ?? item?.product?.price ?? 0),
        quantity: Math.max(1, Number(item?.quantity || 1))
      };
    }
    function readCart(){
      try {
        const modern = JSON.parse(localStorage.getItem("slyrah_cart") || "[]");
        const legacy = JSON.parse(localStorage.getItem("cart") || "[]");
        const merged = new Map();
        [...(Array.isArray(legacy) ? legacy : []), ...(Array.isArray(modern) ? modern : [])].map(normalizeCartItem).filter(item => item.product_id).forEach(item => {
          const existing = merged.get(item.key);
          merged.set(item.key, existing ? { ...existing, ...item, quantity: Math.max(existing.quantity, item.quantity) } : item);
        });
        return Array.from(merged.values());
      } catch { return []; }
    }
    function writeCart(items){
      const normalized = items.map(normalizeCartItem).filter(item => item.product_id);
      localStorage.setItem("slyrah_cart", JSON.stringify(normalized));
      localStorage.setItem("cart", JSON.stringify(normalized.map(item => ({
        id: item.id || item.key,
        productId: item.product_id,
        quantity: item.quantity,
        colorId: item.colorId,
        optionId: item.variant_id,
        variantPrice: item.price,
        colorName: item.colorName,
        optionName: item.optionName,
        product: { id:item.product_id, brandEn:item.brand_en || "", brandAr:item.brand_ar || "", model:item.name_en || item.name_ar || "", price:item.price, mainPhotoUrl:item.image_url }
      }))));
    }
    function readDiscount(){ try { return JSON.parse(localStorage.getItem("slyrah_discount") || "null"); } catch { return null; } }
    function writeDiscount(value){ value ? localStorage.setItem("slyrah_discount", JSON.stringify(value)) : localStorage.removeItem("slyrah_discount"); }
    function money(value){ return Number(value || 0).toLocaleString(lang() === "ar" ? "ar-EG" : "en-US") + " " + t("currency"); }
    function productIds(items){ return items.map(item => Number(item.product_id || item.productId || item.product?.id || item.id)).filter(Boolean); }
    function categorySlugs(items){ return Array.from(new Set(items.map(item => String(item.category_slug || item.categorySlug || "")).filter(Boolean))); }
    function discountAmount(applied, subtotal) {
      if (!applied?.discount) return 0;
      if (Number.isFinite(Number(applied.discount_amount))) return Math.min(subtotal, Number(applied.discount_amount));
      const discount = applied.discount;
      if (discount.type === "percentage") return Math.min(subtotal, (subtotal * Number(discount.value || 0)) / 100);
      if (discount.type === "fixed") return Math.min(subtotal, Number(discount.value || applied.discount_amount || 0));
      return 0;
    }
    function lineDiscount(item, applied) {
      const lines = Array.isArray(applied?.line_discounts) ? applied.line_discounts : [];
      return lines.find(line => String(line.key) === String(item.key)) || lines.find(line => Number(line.product_id) === Number(item.product_id) && String(line.variant_id || "") === String(item.variant_id || "")) || null;
    }
    function matchingShippingRule(items, subtotal) {
      const quantity = rows => rows.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
      return (shippingConfig.free_shipping_rules || []).find(rule => {
        if (rule.is_active === false) return false;
        if (rule.condition_type === "order_subtotal") return subtotal >= Number(rule.minimum_subtotal || 0);
        if (rule.condition_type === "any_quantity") return quantity(items) >= Number(rule.minimum_quantity || 2);
        if (rule.condition_type === "selected_products_quantity") return (rule.product_ids || []).length && quantity(items.filter(item => (rule.product_ids || []).map(Number).includes(Number(item.product_id)))) >= Number(rule.minimum_quantity || 2);
        if (rule.condition_type === "product_bundle") return (rule.product_ids || []).length && rule.product_ids.every(id => items.some(item => Number(item.product_id) === Number(id)));
        if (rule.condition_type === "selected_categories_quantity") return (rule.category_slugs || []).length && quantity(items.filter(item => (rule.category_slugs || []).includes(String(item.category_slug || "")))) >= Number(rule.minimum_quantity || 2);
        return false;
      });
    }
    function applyShippingRuleAction(rule) {
      const base = Math.max(0, Number(shippingConfig.default_cost || 0));
      if (!rule || rule.action_type === "free_shipping") return rule ? 0 : base;
      if (rule.action_type === "fixed_shipping") return Math.max(0, Number(rule.action_value || 0));
      if (rule.action_type === "shipping_discount_percentage") return Math.max(0, base * (1 - Math.min(100, Number(rule.action_value || 0)) / 100));
      if (rule.action_type === "shipping_discount_fixed") return Math.max(0, base - Number(rule.action_value || 0));
      return base;
    }
    function shippingAmount(subtotal, applied, items) {
      if (!shippingConfig.is_active) return 0;
      if (applied?.free_shipping || applied?.discount?.type === "free_shipping") return 0;
      const rule = matchingShippingRule(items, subtotal);
      if (rule) return Math.round(applyShippingRuleAction(rule) * 100) / 100;
      if (shippingConfig.free_shipping_threshold && subtotal >= shippingConfig.free_shipping_threshold) return 0;
      return Number(shippingConfig.default_cost || 0);
    }
    async function syncQuantity(item){
      if (!item) return;
      try {
        await fetch("/api/cart/" + encodeURIComponent(item.key || item.product_id), {
          method:"PUT",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ quantity: item.quantity })
        });
      } catch {}
    }
    async function removeServerItem(item){
      if (!item) return;
      try { await fetch("/api/cart/" + encodeURIComponent(item.key || item.product_id), { method:"DELETE" }); } catch {}
    }
    async function validateCartDiscount(code, items = readCart()) {
      const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
      const response = await fetch("/api/store/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, order_total:subtotal, product_ids:productIds(items), category_slugs:categorySlugs(items), items:items.map(item => ({ key:item.key, product_id:item.product_id, variant_id:item.variant_id, category_slug:item.category_slug, price:item.price, quantity:item.quantity, name_ar:item.name_ar, name_en:item.name_en })) })
      });
      const payload = await response.json();
      if (!response.ok || payload.success === false) throw new Error(payload?.error?.message || payload?.message || "Invalid code");
      const result = { ...payload.data, code };
      (result.line_discounts || []).forEach(line => {
        const item = items.find(entry => String(entry.key) === String(line.key)) || items.find(entry => Number(entry.product_id) === Number(line.product_id) && String(entry.variant_id || "") === String(line.variant_id || ""));
        if (item) item.price = Number(line.unit_price || item.price || 0);
      });
      writeCart(items);
      return result;
    }
    async function revalidateAfterCartChange(code) {
      if (!code) { writeDiscount(null); render(); return; }
      try { writeDiscount(await validateCartDiscount(code)); }
      catch { writeDiscount(null); }
      render();
    }
    async function hydrateCart(){
      try {
        const response = await fetch("/api/cart", { cache:"no-store" });
        const payload = await response.json();
        const serverItems = payload?.data?.items || payload?.items || [];
        if (serverItems.length) {
          const merged = readCart();
          serverItems.forEach((serverItem) => {
            const key = serverItem.key || String(serverItem.product_id || serverItem.id);
            const existing = merged.find((item) => (item.key || String(item.product_id || item.id)) === key);
            if (existing) existing.quantity = Math.max(Number(existing.quantity || 1), Number(serverItem.quantity || 1));
            else merged.push({ ...serverItem, key });
          });
          writeCart(merged);
        }
      } catch {}
      render();
      const storedCode = readDiscount()?.discount?.code || readDiscount()?.code || "";
      if (checkoutMode && storedCode) revalidateAfterCartChange(storedCode);
    }
    function render(){
      const items = readCart();
      if (!items.length) {
        root.innerHTML = '<section class="empty"><div><h2>' + t("emptyTitle") + '</h2><p class="meta">' + t("emptyBody") + '</p><a class="btn primary" href="/products">' + t("shop") + '</a></div></section>';
        return;
      }
      const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
      const applied = readDiscount();
      const discountValue = discountAmount(applied, subtotal);
      const shippingValue = shippingAmount(subtotal, applied, items);
      const total = Math.max(0, subtotal - discountValue) + shippingValue;
      const shippingRows = shippingConfig.is_active ? '<div class="row"><span>' + t("shipping") + '</span><span><span class="status-badge on">' + t("shippingActive") + '</span></span></div><div class="row"><span>' + t("shipping") + '</span><strong>' + (shippingValue === 0 ? t("shippingFree") : money(shippingValue)) + '</strong></div>' : '';
      const couponCode = applied?.discount?.code || applied?.code || "";
      root.innerHTML = '<div class="layout"><section class="items">' + items.map((item, index) => { const line = lineDiscount(item, applied); const lineOffer = couponCode && line ? (line.eligible ? '<div class="line-offer"><span class="status-badge on">' + t("eligible") + '</span>' + (Number(line.discount_amount || 0) ? '<del>' + money(line.subtotal) + '</del><strong>' + money(line.final_subtotal) + ' (-' + money(line.discount_amount) + ')</strong>' : '') + '</div>' : '<div class="line-offer"><span class="status-badge not-eligible">' + t("notEligible") + '</span></div>') : ''; return '<article class="item"><img src="' + (item.image_url || "/uploads/catalog/gift.png") + '" alt="" /><div><h2>' + (lang() === "ar" ? (item.name_ar || item.name_en || "Product") : (item.name_en || item.name_ar || "Product")) + '</h2>' + (item.variant_label ? '<div class="meta">' + item.variant_label + '</div>' : '') + '<div class="meta">' + money(item.price) + '</div>' + lineOffer + '</div><div class="qty"><button class="iconbtn" data-dec="' + index + '">-</button><strong>' + Number(item.quantity || 1) + '</strong><button class="iconbtn" data-inc="' + index + '">+</button><button class="btn danger" data-remove="' + index + '">' + t("remove") + '</button></div></article>'; }).join("") + '</section><aside class="summary"><h2>' + t("summary") + '</h2><div class="row"><span>' + t("subtotal") + '</span><strong>' + money(subtotal) + '</strong></div>' + (couponCode ? '<div class="row"><span>' + t("eligibleSubtotal") + '</span><strong>' + money(applied?.eligible_subtotal || 0) + '</strong></div>' : '') + '<div class="coupon"><label class="meta" for="discountCode">' + t("coupon") + '</label><div class="coupon-row"><input id="discountCode" value="' + couponCode + '" placeholder="' + t("couponPlaceholder") + '" autocomplete="off" /><button class="btn" id="applyCoupon" type="button">' + t("applyCoupon") + '</button></div><div class="coupon-msg ' + (couponCode ? 'ok' : '') + '" id="couponMsg">' + (couponCode ? t("couponApplied") : '') + '</div>' + (couponCode ? '<button class="btn danger" id="removeCoupon" type="button">' + t("removeCoupon") + '</button>' : '') + '</div>' + (discountValue ? '<div class="row discount-row"><span>' + t("discount") + '</span><strong>-' + money(discountValue) + '</strong></div>' : '') + shippingRows + '<div class="total">' + money(total) + '</div>' + (checkoutMode ? '' : '<a class="btn primary" id="checkoutBtn" href="/checkout">' + t("checkout") + '</a>') + '<button class="btn" id="clearCart">' + t("clear") + '</button></aside></div>';
      root.querySelectorAll("[data-inc]").forEach(btn => btn.onclick = async () => { const code = readDiscount()?.discount?.code || readDiscount()?.code || ""; const items = readCart(); const item = items[Number(btn.dataset.inc)]; item.quantity = Number(item.quantity || 1) + 1; writeCart(items); syncQuantity(item); await revalidateAfterCartChange(code); });
      root.querySelectorAll("[data-dec]").forEach(btn => btn.onclick = async () => { const code = readDiscount()?.discount?.code || readDiscount()?.code || ""; const items = readCart(); const item = items[Number(btn.dataset.dec)]; item.quantity = Math.max(1, Number(item.quantity || 1) - 1); writeCart(items); syncQuantity(item); await revalidateAfterCartChange(code); });
      root.querySelectorAll("[data-remove]").forEach(btn => btn.onclick = async () => { const code = readDiscount()?.discount?.code || readDiscount()?.code || ""; const items = readCart(); const removed = items.splice(Number(btn.dataset.remove), 1)[0]; writeCart(items); removeServerItem(removed); await revalidateAfterCartChange(items.length ? code : ""); });
      document.getElementById("clearCart").onclick = () => { writeCart([]); writeDiscount(null); fetch("/api/cart", { method:"DELETE" }).catch(() => {}); render(); };
      document.getElementById("removeCoupon")?.addEventListener("click", () => { writeDiscount(null); render(); });
      document.getElementById("checkoutBtn")?.addEventListener("click", async event => {
        const code = readDiscount()?.discount?.code || readDiscount()?.code || "";
        if (!code) return;
        event.preventDefault();
        const msg = document.getElementById("couponMsg");
        if (msg) { msg.className = "coupon-msg"; msg.textContent = t("checking"); }
        try { writeDiscount(await validateCartDiscount(code)); location.href = "/checkout"; }
        catch { writeDiscount(null); render(); }
      });
      document.getElementById("applyCoupon")?.addEventListener("click", async () => {
        const input = document.getElementById("discountCode");
        const msg = document.getElementById("couponMsg");
        const code = String(input?.value || "").trim().toUpperCase();
        if (!code) { writeDiscount(null); render(); return; }
        if (msg) { msg.className = "coupon-msg"; msg.textContent = t("checking"); }
        try {
          writeDiscount(await validateCartDiscount(code, items));
          render();
        } catch (error) {
          writeDiscount(null);
          const message = String(error?.message || "");
          const translated = message.includes("not found") ? t("notFound") : message.includes("not active") ? t("inactive") : message.includes("minimum") ? t("minimum") : message.includes("products") ? t("productsOnly") : message.includes("categories") ? t("categoriesOnly") : t("couponInvalid");
          if (msg) { msg.className = "coupon-msg err"; msg.textContent = translated; }
        }
      });
    }
    hydrateCart();
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-language-toggle]")) setTimeout(render, 0);
    });
  </script>
</body>
</html>`;
}

function adminPayload() {
  return {
    id: 1,
    name: process.env.ADMIN_NAME || "SITEYFY Admin",
    email: process.env.ADMIN_EMAIL || "admin@siteyfy.com",
    role: "admin"
  };
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, jwtSecret);
    } catch {}
  }
  next();
}

app.use(authOptional);

function customerSessionUser(req) {
  if (!req.user || String(req.user.role || "").toLowerCase() === "admin") return null;
  const storedUser = req.user.id ? getRecord("users", req.user.id) : null;
  if (storedUser && (storedUser.is_active === false || ["inactive", "blocked"].includes(String(storedUser.status || "").toLowerCase()))) return null;
  const source = storedUser || req.user;
  const name = String(source.name || source.full_name || source.fullName || [source.first_name, source.last_name].filter(Boolean).join(" ") || "").trim();
  if (!source.id || !name) return null;
  return {
    id: source.id,
    name,
    email: String(source.email || "").trim(),
    phone: String(source.phone || "").trim(),
    role: String(source.role || "customer"),
    permissions: Array.isArray(source.permissions) ? source.permissions : defaultUserPermissions
  };
}

app.post("/api/admin/auth/login", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (email !== String(process.env.ADMIN_EMAIL || "admin@siteyfy.com").toLowerCase() || password !== String(process.env.ADMIN_PASSWORD || "admin12345")) {
    fail("Invalid email or password", 401);
  }
  const admin = adminPayload();
  const token = jwt.sign(admin, jwtSecret, { expiresIn: "7d" });
  res.json(ok({ token, admin }));
});

app.use("/api/admin", (req, _res, next) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  next();
});

app.post(["/api/admin/upload/single", "/api/admin/company-info/logo", "/api/admin/company-info/favicon"], upload.single("file"), (req, res) => {
  const url = req.file ? `/uploads/${req.file.filename}` : "";
  res.json(ok({ url, fileUrl: url, path: url }));
});

const entityMap = {
  categories: "categories",
  brands: "brands",
  colors: "colors",
  options: "options",
  labels: "labels",
  pages: "pages",
  content: "content",
  products: "products",
  bundles: "bundles",
  collections: "collections",
  discounts: "discounts",
  users: "users",
  orders: "orders"
};

const allowedUserRoles = new Set(["customer", "member", "vip_customer", "wholesale"]);
const allowedUserPermissions = new Set(["place_orders", "view_order_history", "manage_profile", "submit_reviews", "use_promo_codes", "use_wishlist"]);
const defaultUserPermissions = [...allowedUserPermissions];

function hashUserPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

function verifyUserPassword(password, encoded = "") {
  const [algorithm, salt, expectedHex] = String(encoded).split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function adminUserView(user = {}) {
  const { password_hash, password, ...safe } = user;
  return safe;
}

function normalizeUserPayload(input = {}, existing = null) {
  const email = String(input.email ?? existing?.email ?? "").trim().toLowerCase();
  const name = String(input.name ?? input.full_name ?? existing?.name ?? existing?.full_name ?? "").trim();
  const phone = String(input.phone ?? existing?.phone ?? "").trim();
  const role = String(input.role ?? existing?.role ?? "customer").toLowerCase();
  const status = String(input.status ?? existing?.status ?? "active").toLowerCase();
  if (!name || name.length < 2) fail("User name is required");
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) fail("A valid email is required");
  if (!allowedUserRoles.has(role)) fail("Invalid user role");
  if (!["active", "inactive", "blocked"].includes(status)) fail("Invalid user status");
  const duplicate = entityRows("users").find((user) => String(user.email || "").toLowerCase() === email && Number(user.id) !== Number(existing?.id));
  if (duplicate) fail("A user with this email already exists", 409);
  const requestedPermissions = Array.isArray(input.permissions) ? input.permissions : (existing?.permissions || defaultUserPermissions);
  const permissions = [...new Set(requestedPermissions.map(String).filter((permission) => allowedUserPermissions.has(permission)))];
  const payload = {
    ...(existing || {}),
    name,
    full_name: name,
    email,
    phone,
    role,
    status,
    is_active: status === "active",
    email_verified: input.email_verified === undefined ? Boolean(existing?.email_verified) : input.email_verified === true,
    permissions
  };
  const password = String(input.password || "");
  if (!existing && password.length < 8) fail("Password must contain at least 8 characters");
  if (password) {
    if (password.length < 8) fail("Password must contain at least 8 characters");
    payload.password_hash = hashUserPassword(password);
  }
  delete payload.password;
  return payload;
}

const managedOrderStatuses = new Set(["pending", "confirmed", "processing", "ready_to_ship", "shipped", "delivered", "cancelled"]);

function orderShipment(order = {}) {
  if (order.shipping_shipment_id) {
    const linked = getRecord("shipping_shipments", order.shipping_shipment_id);
    if (linked) return linked;
  }
  return entityRows("shipping_shipments").find((row) => Number(row.store_order_id) === Number(order.id)) || null;
}

function adminOrderView(order = {}, context = {}) {
  const { legacy_source_payload, ...safeOrder } = order;
  const shipment = context.shipmentsById
    ? (context.shipmentsById.get(Number(order.shipping_shipment_id)) || context.shipmentsByOrderId.get(Number(order.id)) || null)
    : orderShipment(order);
  const customer = order.shipping_address || order.customer || {};
  const products = context.products || entityRows("products");
  const items = (order.items || []).map((item) => {
    const product = products.find((row) => Number(row.id) === Number(item.product_id));
    return {
      ...item,
      name_en: item.name_en || product?.name_en || "",
      name_ar: item.name_ar || product?.name_ar || "",
      image_url: item.image_url || item.main_photo_url || product?.main_photo_url || product?.image_url || ""
    };
  });
  return {
    ...safeOrder,
    items,
    customer_name: customer.full_name || customer.name || "",
    customer_phone: customer.phone || "",
    customer_city: customer.city || "",
    payment_method: order.payment?.method || "",
    payment_status: order.payment?.status || "pending",
    address_status: customer.address_verification?.status || "manual",
    shipment: shipment ? {
      id: shipment.id,
      provider: shipment.provider || order.shipping_provider || null,
      waybill_no: shipment.waybill_no || null,
      external_order_no: shipment.external_order_no || null,
      oto_id: shipment.oto_id || null,
      status_group: shipment.status_group || shipment.status_code || null,
      status_label: shipment.status_label || shipment.status_code || null,
      sync_state: shipment.sync_state || null,
      integration_error: shipment.integration_error || null,
      last_attempted_at: shipment.last_attempted_at || null,
      created_with_api_at: shipment.created_with_api_at || null
    } : null
  };
}

function addOrderEvent(orderId, type, data = {}, actor = "admin") {
  return createRecord("order_events", { order_id: Number(orderId), type, actor, data, occurred_at: new Date().toISOString() });
}

function orderFulfillmentProvider(order, integration = normalizeShippingIntegrations()) {
  const selected = String(order.shipping_selection?.provider || order.shipping_provider || "").toLowerCase();
  if (["imile", "oto"].includes(selected) && integration[selected]?.is_enabled) return selected;
  const preferred = String(integration.default_provider || integration.active_provider || "").toLowerCase();
  if (["imile", "oto"].includes(preferred) && integration[preferred]?.is_enabled) return preferred;
  return selected;
}

async function dispatchOrderToShippingProvider(order, requestedProvider = "") {
  if (order.is_historical || order.suppress_side_effects) fail("HISTORICAL_ORDER_CANNOT_BE_DISPATCHED", 409);
  const integration = normalizeShippingIntegrations();
  const provider = String(requestedProvider || orderFulfillmentProvider(order, integration)).toLowerCase();
  if (!["imile", "oto"].includes(provider)) fail("SHIPPING_PROVIDER_NOT_SELECTED", 409);
  if (!integration[provider]?.is_enabled) fail(`${provider.toUpperCase()}_PROVIDER_NOT_ACTIVE`, 409);
  if (!order.shipping_package?.requires_shipping) fail("ORDER_DOES_NOT_REQUIRE_SHIPPING", 409);
  let shipment = orderShipment(order);
  if (shipment && shipment.provider && shipment.provider !== provider && !["creation_failed", "manual_dispatch", "creation_pending"].includes(shipment.sync_state)) {
    fail("ORDER_ALREADY_ASSIGNED_TO_ANOTHER_PROVIDER", 409);
  }
  if (shipment?.waybill_no || ["order_created", "created", "webhook_synced"].includes(shipment?.sync_state) || (provider === "oto" && (shipment?.external_order_no || shipment?.oto_id))) return shipment;
  if (!shipment) {
    const customer = order.shipping_address || order.customer || {};
    shipment = upsertShippingShipment({
      store_order_id: order.id,
      provider,
      client_order_no: provider === "oto" ? `${integration.oto.order_prefix || "SFY-"}${order.id}` : `SITEYFY-${order.id}`,
      status_code: "awaiting_api_creation",
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      destination_country: customer.country_code,
      destination_province: customer.province,
      destination_city: customer.city,
      order_total: Number(order.total || 0),
      cod_amount: Number(order.payment?.cod_amount || 0),
      payment_method: order.payment?.method,
      currency: order.currency_snapshot?.code || "SAR",
      customer_shipping_charge: Number(order.shipping_amount || 0),
      carrier_estimated_cost: order.shipping_quote?.carrier_estimated_cost ?? null,
      gross_weight: Number(order.shipping_package?.gross_weight || 0),
      package_snapshot: order.shipping_package,
      quote_snapshot: order.shipping_quote,
      source: "store",
      sync_state: "creation_pending"
    });
  }
  try {
    shipment = upsertShippingShipment({ ...shipment, provider, sync_state: "creation_pending", integration_error: null, last_attempted_at: new Date().toISOString() });
    const created = provider === "oto" ? await createOtoShipment(order, shipment) : await createImileShipment(order, shipment);
    updateRecord("orders", order.id, { shipping_shipment_id: created.id, shipping_provider: provider, status: order.status === "pending" ? "ready_to_ship" : order.status });
    return created;
  } catch (error) {
    upsertShippingShipment({ ...shipment, provider, sync_state: "creation_failed", integration_error: String(error.message || `${provider.toUpperCase()}_CREATE_FAILED`), last_attempted_at: new Date().toISOString() });
    throw error;
  }
}

function paymentTransaction(payload = {}) {
  const eventKey = String(payload.provider_event_key || "").trim();
  if (eventKey) {
    const existing = entityRows("payment_transactions").find((row) => row.provider_event_key === eventKey);
    if (existing) return existing;
  }
  const transaction = createRecord("payment_transactions", {
    provider: String(payload.provider || "internal"),
    order_id: Number(payload.order_id || 0) || null,
    provider_order_id: String(payload.provider_order_id || "") || null,
    checkout_id: String(payload.checkout_id || "") || null,
    type: String(payload.type || "status"),
    status: String(payload.status || "pending"),
    amount: payload.amount === null || payload.amount === undefined ? null : Number(payload.amount),
    currency: String(payload.currency || "") || null,
    provider_event_key: eventKey || null,
    details: payload.details || {},
    occurred_at: payload.occurred_at || new Date().toISOString()
  });
  try { syncCheckoutRecoveryFromPaymentTransaction(transaction); }
  catch (error) { console.error(`Checkout recovery payment sync failed: ${error.message}`); }
  return transaction;
}

const checkoutRecoveryFinalStatuses = new Set(["completed", "recovered", "closed"]);
const checkoutRecoveryClientStatuses = new Set(["active", "payment_pending"]);
const checkoutRecoveryStages = new Set([
  "checkout_started", "contact_started", "address_started", "ready_to_submit", "validation_failed",
  "order_created", "gateway_initializing", "payment_redirected", "payment_pending", "payment_failed",
  "payment_cancelled", "payment_completed", "checkout_completed", "checkout_failed"
]);
const checkoutRecoveryClientEvents = new Set([
  "checkout_started", "checkout_updated", "payment_method_selected", "validation_failed", "checkout_submitted",
  "payment_redirected", "checkout_left", "client_error"
]);

function checkoutRecoverySettings(payload = null) {
  const current = getSetting("checkoutRecovery") || {};
  if (payload) {
    const normalized = {
      enabled: payload.enabled !== false && payload.enabled !== "false",
      abandon_after_minutes: Math.min(1440, Math.max(5, Number(payload.abandon_after_minutes || current.abandon_after_minutes || 30))),
      pending_review_after_minutes: Math.min(10080, Math.max(15, Number(payload.pending_review_after_minutes || current.pending_review_after_minutes || 120))),
      retention_days: Math.min(730, Math.max(7, Number(payload.retention_days || current.retention_days || 90))),
      updated_at: new Date().toISOString()
    };
    setSetting("checkoutRecovery", normalized);
    return normalized;
  }
  return {
    enabled: current.enabled !== false,
    abandon_after_minutes: Math.min(1440, Math.max(5, Number(current.abandon_after_minutes || 30))),
    pending_review_after_minutes: Math.min(10080, Math.max(15, Number(current.pending_review_after_minutes || 120))),
    retention_days: Math.min(730, Math.max(7, Number(current.retention_days || 90))),
    updated_at: current.updated_at || null
  };
}

function sanitizeCheckoutCustomer(customer = {}) {
  const pick = (key, max = 180) => String(customer[key] || "").trim().slice(0, max);
  return {
    first_name: pick("first_name", 80), last_name: pick("last_name", 80), phone: pick("phone", 32), email: pick("email", 160).toLowerCase(),
    country_code: pick("country_code", 4).toUpperCase(), short_address: pick("short_address", 20).toUpperCase(), province: pick("province"),
    city: pick("city"), district: pick("district"), street: pick("street", 240), building_number: pick("building_number", 32),
    postal_code: pick("postal_code", 32), additional_number: pick("additional_number", 32), address_notes: pick("address_notes", 500)
  };
}

function checkoutRecoveryCustomer(session = {}) {
  try { return sanitizeCheckoutCustomer(JSON.parse(decryptIntegrationSecret(session.customer_encrypted) || "{}")); }
  catch { return {}; }
}

function checkoutRecoveryCart(items = []) {
  return asArray(items).slice(0, 80).map((item) => ({
    key: String(item.key || "").slice(0, 160), item_type: item.item_type === "bundle" ? "bundle" : "product",
    product_id: Number(item.product_id || 0) || null, bundle_id: Number(item.bundle_id || 0) || null,
    variant_id: item.variant_id ? String(item.variant_id).slice(0, 160) : null,
    name_ar: String(item.name_ar || "").slice(0, 240), name_en: String(item.name_en || "").slice(0, 240),
    variant_label: String(item.variant_label || "").slice(0, 240), image_url: String(item.image_url || item.bundle_main_photo_url || "").slice(0, 500),
    quantity: Math.min(999, Math.max(1, Number(item.quantity || 1))), price: Math.max(0, Number(item.price || 0))
  }));
}

function redactCheckoutDiagnostic(value) {
  return String(value || "")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [redacted]")
    .replace(/\b(?:sk|pk)_[A-Za-z0-9_-]+\b/g, "[redacted-key]")
    .replace(/[A-Za-z0-9_-]{80,}/g, "[redacted-token]")
    .slice(0, 800);
}

function checkoutRecoverySessionByKey(key) {
  return entityRows("checkout_recovery_sessions").find((row) => row.session_key === String(key || "")) || null;
}

function signCheckoutRecoverySession(session) {
  return jwt.sign({ type:"checkout_recovery", session_id:session.id, session_key:session.session_key }, jwtSecret, { expiresIn:"30d", audience:"siteyfy-checkout-recovery" });
}

function verifyCheckoutRecoverySession(sessionKey, token) {
  try {
    const decoded = jwt.verify(String(token || ""), jwtSecret, { audience:"siteyfy-checkout-recovery" });
    if (decoded?.type !== "checkout_recovery" || decoded.session_key !== String(sessionKey || "")) return null;
    const session = getRecord("checkout_recovery_sessions", decoded.session_id);
    return session?.session_key === decoded.session_key ? session : null;
  } catch { return null; }
}

function recordCheckoutRecoveryEvent(session, type, payload = {}) {
  if (!session?.id) return null;
  return createRecord("checkout_recovery_events", {
    session_id: Number(session.id), session_key: session.session_key, event_type: String(type || "status").slice(0, 80),
    source: String(payload.source || "storefront").slice(0, 40), stage: String(payload.stage || session.stage || "").slice(0, 80),
    status: String(payload.status || session.status || "active").slice(0, 80), order_id: Number(payload.order_id || session.order_id || 0) || null,
    payment_attempt_id: String(payload.payment_attempt_id || session.payment_attempt_id || "").slice(0, 120) || null,
    provider: String(payload.provider || session.payment_provider || "").slice(0, 40) || null,
    reason_code: String(payload.reason_code || "").slice(0, 120) || null,
    message: redactCheckoutDiagnostic(payload.message || ""), details: payload.details && typeof payload.details === "object" ? payload.details : {},
    occurred_at: payload.occurred_at || new Date().toISOString()
  });
}

function updateCheckoutRecoverySession(session, payload = {}, eventType = "") {
  if (!session) return null;
  const now = new Date().toISOString();
  const customer = payload.customer ? { ...checkoutRecoveryCustomer(session), ...sanitizeCheckoutCustomer(payload.customer) } : checkoutRecoveryCustomer(session);
  const cart = payload.items ? checkoutRecoveryCart(payload.items) : asArray(session.cart_snapshot);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const status = checkoutRecoveryFinalStatuses.has(session.status) ? session.status : String(payload.status || session.status || "active");
  const stage = checkoutRecoveryStages.has(payload.stage) ? payload.stage : (session.stage || "checkout_started");
  const updated = updateRecord("checkout_recovery_sessions", session.id, {
    customer_encrypted: encryptIntegrationSecret(JSON.stringify(customer)), customer_name_hash: identityHash(`${customer.first_name} ${customer.last_name}`),
    phone_hash: identityHash(customer.phone), email_hash: identityHash(customer.email), cart_snapshot: cart,
    cart_count: cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0), subtotal: Number(subtotal.toFixed(2)),
    total: payload.total === undefined ? Number(session.total ?? subtotal) : Math.max(0, Number(payload.total || 0)),
    payment_provider: String(payload.payment_provider || session.payment_provider || "").slice(0, 40) || null,
    payment_attempt_id: String(payload.payment_attempt_id || session.payment_attempt_id || "").slice(0, 120) || null,
    order_id: Number(payload.order_id || session.order_id || 0) || null, stage, status,
    locale: String(payload.locale || session.locale || "ar_SA").slice(0, 20), last_seen_at: now,
    submitted_at: payload.submitted_at || session.submitted_at || null, completed_at: payload.completed_at || session.completed_at || null,
    last_error_code: payload.reason_code ? String(payload.reason_code).slice(0, 120) : session.last_error_code || null,
    last_error_message: payload.message ? redactCheckoutDiagnostic(payload.message) : session.last_error_message || null
  });
  if (eventType) recordCheckoutRecoveryEvent(updated, eventType, payload);
  return updated;
}

function checkoutRecoveryAdminView(session = {}) {
  const customer = checkoutRecoveryCustomer(session);
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim();
  return { ...session, customer_encrypted:undefined, customer:{ ...customer, full_name:fullName }, contact_name:fullName, phone:customer.phone || "", email:customer.email || "" };
}

function refreshCheckoutRecoveryStatuses() {
  const settings = checkoutRecoverySettings();
  const now = Date.now();
  for (const session of entityRows("checkout_recovery_sessions")) {
    if (checkoutRecoveryFinalStatuses.has(session.status) || ["failed", "cancelled", "abandoned"].includes(session.status)) continue;
    const inactiveMinutes = (now - new Date(session.last_seen_at || session.updated_at || session.created_at).getTime()) / 60000;
    if (session.status === "payment_pending" && inactiveMinutes >= settings.pending_review_after_minutes) {
      const updated = updateRecord("checkout_recovery_sessions", session.id, { status:"pending_review", last_error_code:"PAYMENT_CONFIRMATION_TIMEOUT" });
      recordCheckoutRecoveryEvent(updated, "payment_confirmation_timeout", { source:"system", status:"pending_review", reason_code:"PAYMENT_CONFIRMATION_TIMEOUT", message:"No final payment confirmation was received within the configured review window." });
    } else if (session.status === "active" && inactiveMinutes >= settings.abandon_after_minutes) {
      const updated = updateRecord("checkout_recovery_sessions", session.id, { status:"abandoned", abandoned_at:new Date().toISOString() });
      recordCheckoutRecoveryEvent(updated, "checkout_abandoned", { source:"system", status:"abandoned", message:"Checkout activity stopped before completion." });
    }
  }
}

function pruneCheckoutRecoveryHistory() {
  const settings = checkoutRecoverySettings();
  const cutoff = Date.now() - settings.retention_days * 86_400_000;
  const expired = entityRows("checkout_recovery_sessions").filter((session) => {
    if (!["abandoned", "failed", "cancelled", "completed", "recovered", "closed"].includes(session.status)) return false;
    return new Date(session.completed_at || session.abandoned_at || session.updated_at || session.created_at).getTime() < cutoff;
  });
  if (!expired.length) return 0;
  const ids = new Set(expired.map((session) => Number(session.id)));
  entityRows("checkout_recovery_events").filter((row) => ids.has(Number(row.session_id))).forEach((row) => softDelete("checkout_recovery_events", row.id));
  entityRows("checkout_recovery_contacts").filter((row) => ids.has(Number(row.session_id))).forEach((row) => softDelete("checkout_recovery_contacts", row.id));
  expired.forEach((session) => softDelete("checkout_recovery_sessions", session.id));
  return expired.length;
}

function checkoutRecoveryByOrder(orderId) {
  return entityRows("checkout_recovery_sessions").find((row) => Number(row.order_id || 0) === Number(orderId || 0)) || null;
}

function syncCheckoutRecoveryFromPaymentTransaction(transaction = {}) {
  if (!transaction.order_id) return;
  const session = checkoutRecoveryByOrder(transaction.order_id);
  if (!session) return;
  const status = String(transaction.status || "pending").toLowerCase();
  const success = ["authorised", "authorized", "captured", "partially_captured", "fully_captured", "completed", "paid"].includes(status);
  const failed = ["failed", "declined", "cancelled", "canceled", "expired", "rejected"].includes(status);
  updateCheckoutRecoverySession(session, {
    status: success ? "completed" : failed ? (status.includes("cancel") ? "cancelled" : "failed") : "payment_pending",
    stage: success ? "payment_completed" : failed ? (status.includes("cancel") ? "payment_cancelled" : "payment_failed") : "payment_pending",
    payment_provider: transaction.provider, order_id:transaction.order_id, completed_at:success ? new Date().toISOString() : null,
    reason_code: failed ? String(transaction.details?.reason || transaction.details?.provider_status || status).slice(0,120) : null,
    message: failed ? String(transaction.details?.reason || transaction.details?.provider_status || status) : ""
  }, success ? "payment_completed" : failed ? "payment_failed" : "payment_status_updated");
}

function releaseOrderPromotionReservations(order, reason = "payment_cancelled") {
  for (const promotion of asArray(order.applied_promotions)) {
    if (!promotion.reservation_id) continue;
    db.prepare("UPDATE promo_redemptions SET status = 'cancelled', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'reserved'")
      .run(reason, promotion.reservation_id);
  }
}

async function initializeOrderShipping(order) {
  const integration = normalizeShippingIntegrations();
  const provider = orderFulfillmentProvider(order, integration);
  if (!order.shipping_package?.requires_shipping || !["imile", "oto"].includes(provider)) return null;
  const providerSettings = integration[provider];
  if (!providerSettings?.is_enabled) return null;
  const autoCreate = provider === "imile" ? providerSettings.auto_create_orders : providerSettings.auto_create_orders;
  let shipment = orderShipment(order);
  if (!shipment) {
    const customer = order.shipping_address || order.customer || {};
    shipment = upsertShippingShipment({
      store_order_id: order.id,
      provider,
      client_order_no: provider === "oto" ? `${integration.oto.order_prefix || "SFY-"}${order.id}` : `SITEYFY-${order.id}`,
      external_order_no: null,
      waybill_no: null,
      status_code: autoCreate ? "awaiting_api_creation" : "awaiting_dispatch",
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      destination_country: customer.country_code,
      destination_province: customer.province,
      destination_city: customer.city,
      order_total: Number(order.total || 0),
      cod_amount: Number(order.payment?.cod_amount || 0),
      payment_method: order.payment?.method,
      currency: order.currency_snapshot?.code || "SAR",
      customer_shipping_charge: Number(order.shipping_amount || 0),
      carrier_estimated_cost: order.shipping_quote?.carrier_estimated_cost ?? null,
      cost_source: order.shipping_quote?.carrier_estimated_cost === null ? null : `${provider}_estimate`,
      gross_weight: Number(order.shipping_package?.gross_weight || 0),
      package_snapshot: order.shipping_package,
      quote_snapshot: order.shipping_quote,
      source: "store",
      sync_state: autoCreate ? "creation_pending" : "manual_dispatch"
    });
  }
  if (autoCreate && !shipment.waybill_no) {
    try {
      shipment = await dispatchOrderToShippingProvider(order, provider);
      addOrderEvent(order.id, "shipment_auto_created", { provider, shipment_id: shipment.id, external_order_no: shipment.external_order_no || null, waybill_no: shipment.waybill_no || null }, "system");
    } catch (error) {
      shipment = upsertShippingShipment({ ...shipment, provider, sync_state: "creation_failed", integration_error: String(error.message || `${provider.toUpperCase()}_CREATE_FAILED`), last_attempted_at: new Date().toISOString() });
      addOrderEvent(order.id, "shipment_auto_failed", { provider, reason: shipment.integration_error }, "system");
    }
  }
  updateRecord("orders", order.id, { shipping_shipment_id: shipment.id, shipping_provider: provider });
  return shipment;
}

function tamaraPaymentStatus(value = "") {
  const status = String(value || "").toLowerCase().replaceAll(" ", "_");
  if (["approved", "authorised", "authorized"].includes(status)) return "authorised";
  if (["fully_captured", "captured"].includes(status)) return "captured";
  if (status === "partially_captured") return "partially_captured";
  if (["fully_refunded", "refunded"].includes(status)) return "refunded";
  if (status === "partially_refunded") return "partially_refunded";
  if (["declined", "failed"].includes(status)) return "failed";
  if (["canceled", "cancelled"].includes(status)) return "cancelled";
  if (status === "expired") return "expired";
  return "pending";
}

function tamaraStatusFromEvent(eventType = "") {
  return {
    order_approved: "approved",
    order_authorised: "authorised",
    order_captured: "fully_captured",
    order_refunded: "fully_refunded",
    order_canceled: "canceled",
    order_declined: "declined",
    order_expired: "expired"
  }[String(eventType || "").toLowerCase()] || "";
}

function tamaraOrderByReference({ providerOrderId, orderReferenceId } = {}) {
  return entityRows("orders").find((order) => (
    (providerOrderId && String(order.payment?.provider_order_id || "") === String(providerOrderId))
    || (orderReferenceId && (String(order.payment?.order_reference_id || "") === String(orderReferenceId) || String(order.id) === String(orderReferenceId).replace(/^SITEYFY-/, "")))
  )) || null;
}

async function completeTamaraPayment(order, status, details = {}) {
  const paidStatuses = new Set(["authorised", "captured", "partially_captured"]);
  const failedStatuses = new Set(["failed", "cancelled", "expired"]);
  let nextOrder = updateRecord("orders", order.id, {
    payment: {
      ...(order.payment || {}),
      provider: "tamara",
      status,
      provider_status: details.provider_status || status,
      transaction_id: details.transaction_id || order.payment?.transaction_id || order.payment?.provider_order_id || null,
      last_event: details.event_type || order.payment?.last_event || null,
      last_updated_at: new Date().toISOString()
    },
    status: paidStatuses.has(status) && order.status === "pending" ? "confirmed" : failedStatuses.has(status) && order.status === "pending" ? "cancelled" : order.status
  });
  if (paidStatuses.has(status) && !nextOrder.payment_completed_at) {
    finalizePromotionRedemptions(nextOrder.applied_promotions || [], nextOrder.customer_identity || {}, nextOrder.id);
    nextOrder = updateRecord("orders", nextOrder.id, { payment_completed_at: new Date().toISOString(), promotion_redemptions_finalized_at: new Date().toISOString() });
    await initializeOrderShipping(nextOrder);
    addOrderEvent(nextOrder.id, "payment_confirmed", { provider: "tamara", status }, "tamara");
  } else if (failedStatuses.has(status) && !nextOrder.payment_failed_at) {
    releaseOrderPromotionReservations(nextOrder, `tamara_${status}`);
    nextOrder = updateRecord("orders", nextOrder.id, { payment_failed_at: new Date().toISOString() });
    addOrderEvent(nextOrder.id, "payment_failed", { provider: "tamara", status }, "tamara");
  }
  return getRecord("orders", nextOrder.id);
}

async function syncTamaraOrder(order, { event = null, outcome = "" } = {}) {
  const providerOrderId = event?.order_id || order.payment?.provider_order_id;
  let remote = null;
  if (providerOrderId) {
    try { remote = await tamaraRequest(`/orders/${encodeURIComponent(providerOrderId)}`, { timeoutMs: 8000 }); }
    catch (error) {
      if (!event) throw error;
    }
  }
  let providerStatus = remote?.status || tamaraStatusFromEvent(event?.event_type);
  if (!providerStatus && outcome === "failure") providerStatus = "failed";
  if (!providerStatus && outcome === "cancel") providerStatus = "canceled";
  if (!providerStatus) providerStatus = "new";
  let status = tamaraPaymentStatus(providerStatus);
  const config = normalizePaymentGateways().providers.tamara;
  if (String(providerStatus).toLowerCase() === "approved" && config.auto_authorise && providerOrderId) {
    await tamaraRequest(`/orders/${encodeURIComponent(providerOrderId)}/authorise`, { method: "POST", timeoutMs: 10000 });
    providerStatus = "authorised";
    status = "authorised";
  }
  paymentTransaction({
    provider: "tamara",
    order_id: order.id,
    provider_order_id: providerOrderId,
    checkout_id: order.payment?.checkout_id,
    type: event ? "webhook" : "status_sync",
    status,
    amount: Number(remote?.total_amount?.amount ?? event?.data?.captured_amount?.amount ?? order.total ?? 0),
    currency: remote?.total_amount?.currency || order.currency_snapshot?.code || "SAR",
    provider_event_key: event ? `tamara:${providerOrderId}:${event.event_type}:${event.data?.capture_id || event.data?.refund_id || event.data?.cancel_id || "status"}` : "",
    details: { provider_status: providerStatus, event_type: event?.event_type || null, outcome: outcome || null }
  });
  return completeTamaraPayment(order, status, { provider_status: providerStatus, event_type: event?.event_type, transaction_id: providerOrderId });
}

function tamaraMoney(amount, currency) {
  return { amount: Number(Math.max(0, Number(amount || 0)).toFixed(2)), currency };
}

function tamaraPersonName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return { first_name: parts[0] || "Customer", last_name: parts.slice(1).join(" ") || "-" };
}

function verifiedPaymentRedirectUrl(rawUrl, providerConfig = {}) {
  let target;
  try { target = new URL(String(rawUrl || "")); }
  catch { fail("PAYMENT_REDIRECT_URL_INVALID", 502); }
  const policy = normalizePaymentGateways().redirect_policy;
  if (policy.require_https && target.protocol !== "https:") fail("PAYMENT_REDIRECT_HTTPS_REQUIRED", 502);
  const allowedHosts = asArray(providerConfig.allowed_redirect_hosts).map((value) => String(value || "").toLowerCase()).filter(Boolean);
  const hostname = target.hostname.toLowerCase();
  if (allowedHosts.length && !allowedHosts.some((allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`))) fail("PAYMENT_REDIRECT_HOST_NOT_ALLOWED", 502);
  const storefront = new URL(publicStoreUrl("/"));
  if (target.origin === storefront.origin && target.pathname.startsWith("/payment/")) fail("PAYMENT_REDIRECT_CALLBACK_LOOP", 502);
  return target.toString();
}

function tamaraCheckoutPayload(order, req) {
  const config = normalizePaymentGateways().providers.tamara;
  const customer = order.shipping_address || order.customer || {};
  const currency = order.currency_snapshot?.code || "SAR";
  const name = tamaraPersonName(customer.full_name);
  const callbackToken = jwt.sign({ type: "tamara_return", order_id: Number(order.id) }, jwtSecret, { expiresIn: "1d", audience: "siteyfy-tamara" });
  const callback = (outcome) => publicStoreUrl(`/payment/tamara/${outcome}?order_id=${order.id}&token=${encodeURIComponent(callbackToken)}`);
  const phone = String(customer.phone || "").replace(/[^0-9]/g, "");
  const address = {
    ...name,
    line1: [customer.street, customer.building_number].filter(Boolean).join(" ").slice(0, 255),
    line2: [customer.district, customer.additional_number].filter(Boolean).join(" · ").slice(0, 255),
    region: String(customer.province || customer.district || "").slice(0, 100),
    city: String(customer.city || "").slice(0, 100),
    country_code: String(customer.country_code || "SA"),
    phone_number: phone
  };
  const items = asArray(order.items).map((item) => {
    const product = Number(item.product_id) ? getRecord("products", item.product_id) : null;
    const image = product?.main_photo_url || product?.image_url || asArray(product?.images)[0]?.url || "";
    const discountAmount = Number(item.discount_amount || 0);
    const totalAmount = Number(item.final_subtotal ?? item.subtotal ?? Number(item.unit_price || 0) * Number(item.quantity || 1));
    return {
      reference_id: String(item.item_type === "bundle" ? `bundle-${item.bundle_id}` : item.variant_id ? `${item.product_id}-${item.variant_id}` : item.product_id || item.key),
      type: item.shipping?.requires_shipping === false ? "Digital" : "Physical",
      name: String(item.name_ar || item.name_en || `Item ${item.product_id || item.bundle_id}`).slice(0, 255),
      sku: String(item.variant_sku || item.sku || `SITEYFY-${item.product_id || item.bundle_id || item.key}`).slice(0, 128),
      quantity: Math.max(1, Number(item.quantity || 1)),
      unit_price: tamaraMoney(item.unit_price, currency),
      tax_amount: tamaraMoney(0, currency),
      discount_amount: tamaraMoney(discountAmount, currency),
      total_amount: tamaraMoney(totalAmount, currency),
      item_url: publicStoreUrl(item.item_type === "bundle" ? `/bundle/${item.bundle_id}` : `/product/${item.product_id}`),
      ...(image ? { image_url: /^https?:\/\//i.test(image) ? image : publicStoreUrl(image) } : {})
    };
  });
  return {
    order_reference_id: `SITEYFY-${order.id}`,
    order_number: String(order.id),
    total_amount: tamaraMoney(order.total, currency),
    shipping_amount: tamaraMoney(order.shipping_amount, currency),
    tax_amount: tamaraMoney(0, currency),
    ...(Number(order.discount_amount || 0) > 0 ? { discount: { name: asArray(order.discount_codes).join(", ") || "Store discount", amount: tamaraMoney(order.discount_amount, currency) } } : {}),
    items,
    consumer: { ...name, ...(String(customer.email || "").trim() ? { email: String(customer.email).trim() } : {}), phone_number: phone },
    country_code: String(customer.country_code || "SA"),
    description: `SITEYFY order #${order.id}`,
    payment_type: config.payment_type,
    instalments: config.instalments,
    merchant_url: { success: callback("success"), failure: callback("failure"), cancel: callback("cancel") },
    billing_address: address,
    shipping_address: address,
    platform: "SITEYFY Direct API",
    is_mobile: /mobile|android|iphone|ipad/i.test(String(req.headers["user-agent"] || "")),
    locale: String(req.body?.locale || "ar_SA") === "en_US" ? "en_US" : "ar_SA",
    additional_data: { delivery_method: "Home Delivery", store_code: "SITEYFY" }
  };
}

async function createTamaraCheckout(order, req) {
  const config = normalizePaymentGateways().providers.tamara;
  const currency = order.currency_snapshot?.code || "SAR";
  const country = order.market_snapshot?.country_code || order.customer?.country_code || "SA";
  if (!config.is_enabled || normalizePaymentGateways().active_provider !== "tamara") fail("TAMARA_NOT_ENABLED", 409);
  if (!config.supported_countries.includes(country) || !config.supported_currencies.includes(currency)) fail("TAMARA_COUNTRY_OR_CURRENCY_NOT_SUPPORTED", 409);
  if (Number(order.total || 0) < Number(config.minimum_amount || 0) || (config.maximum_amount !== null && Number(order.total || 0) > Number(config.maximum_amount))) fail("TAMARA_ORDER_AMOUNT_NOT_SUPPORTED", 409);
  try {
    const eligibility = await tamaraRequest("/pre-checkout/v1/eligibility", {
      method: "POST",
      body: { order: { amount: Number(order.total || 0), currency }, customer: { phone_number: String(order.customer?.phone || "").replace(/[^0-9]/g, ""), email: order.customer?.email || "" } },
      timeoutMs: 200
    });
    if (eligibility?.is_eligible === false) fail("TAMARA_CUSTOMER_NOT_ELIGIBLE", 409);
  } catch (error) {
    if (error.message !== "TAMARA_REQUEST_TIMEOUT") throw error;
  }
  const result = await tamaraRequest("/checkout", { method: "POST", body: tamaraCheckoutPayload(order, req), timeoutMs: 15000 });
  if (!result.order_id || !result.checkout_url) fail("TAMARA_CHECKOUT_RESPONSE_INVALID", 502);
  const checkoutUrl = verifiedPaymentRedirectUrl(result.checkout_url, config);
  const payment = {
    ...(order.payment || {}),
    provider: "tamara",
    status: "pending",
    provider_status: result.status || "new",
    provider_order_id: result.order_id,
    order_reference_id: `SITEYFY-${order.id}`,
    checkout_id: result.checkout_id || null,
    checkout_url: checkoutUrl,
    environment: config.environment,
    payment_type: config.payment_type,
    instalments: config.instalments,
    created_at: new Date().toISOString()
  };
  paymentTransaction({ provider: "tamara", order_id: order.id, provider_order_id: result.order_id, checkout_id: result.checkout_id, type: "checkout_created", status: "pending", amount: order.total, currency, details: { environment: config.environment, provider_status: result.status || "new" } });
  return updateRecord("orders", order.id, { payment });
}

function edfapayPaymentStatus(payload = {}) {
  const status = String(payload.status || payload.transactionStatus || payload.paymentStatus || "").trim().toLowerCase();
  const result = String(payload.result || "").trim().toLowerCase();
  if (["approved", "settled", "success", "successful", "completed", "paid"].includes(status) || result === "success") return "captured";
  if (["declined", "failed", "failure", "cancelled", "canceled", "expired", "error"].includes(status) || ["declined", "error"].includes(result)) return "failed";
  return "pending";
}

async function completeEdfaPayPayment(order, status, details = {}) {
  const paid = status === "captured";
  const failed = ["failed", "cancelled", "expired"].includes(status);
  let nextOrder = updateRecord("orders", order.id, {
    payment: {
      ...(order.payment || {}),
      provider: "edfapay",
      status,
      provider_status: details.provider_status || order.payment?.provider_status || null,
      provider_order_id: details.transaction_id || order.payment?.provider_order_id || null,
      transaction_id: details.transaction_id || order.payment?.transaction_id || null,
      last_event: details.event_type || order.payment?.last_event || null,
      last_updated_at: new Date().toISOString()
    },
    status: paid && order.status === "pending" ? "confirmed" : failed && order.status === "pending" ? "cancelled" : order.status
  });
  if (paid && !nextOrder.payment_completed_at) {
    finalizePromotionRedemptions(nextOrder.applied_promotions || [], nextOrder.customer_identity || {}, nextOrder.id);
    nextOrder = updateRecord("orders", nextOrder.id, { payment_completed_at: new Date().toISOString(), promotion_redemptions_finalized_at: new Date().toISOString() });
    await initializeOrderShipping(nextOrder);
    addOrderEvent(nextOrder.id, "payment_confirmed", { provider: "edfapay", status, transaction_id: details.transaction_id || null }, "edfapay");
  } else if (failed && !nextOrder.payment_failed_at) {
    releaseOrderPromotionReservations(nextOrder, `edfapay_${status}`);
    nextOrder = updateRecord("orders", nextOrder.id, { payment_failed_at: new Date().toISOString() });
    addOrderEvent(nextOrder.id, "payment_failed", { provider: "edfapay", status, reason: details.reason || null }, "edfapay");
  }
  return getRecord("orders", nextOrder.id);
}

function edfapayOrderId(value) {
  const match = String(value || "").match(/(?:SITEYFY-)?([0-9]+)$/i);
  return match ? Number(match[1]) : 0;
}

async function applyEdfaPayEvent(payload = {}, source = "callback") {
  const orderId = edfapayOrderId(payload.order_id || payload.orderId || payload.order_number || payload.orderNumber);
  const order = getRecord("orders", orderId);
  if (!order || order.payment?.provider !== "edfapay") fail("EDFAPAY_ORDER_NOT_FOUND", 404);
  const transactionId = String(payload.trans_id || payload.transactionId || payload.id || "").trim();
  const providerStatus = String(payload.status || payload.transactionStatus || payload.paymentStatus || payload.result || "pending");
  const status = edfapayPaymentStatus(payload);
  const amount = Number(payload.amount ?? payload.order_amount ?? order.total);
  const callbackCurrency = String(payload.currency || payload.order_currency || "").toUpperCase();
  const orderCurrency = String(order.currency_snapshot?.code || "SAR").toUpperCase();
  if (Number.isFinite(amount) && Math.abs(amount - Number(order.total || 0)) > 0.01) fail("EDFAPAY_CALLBACK_AMOUNT_MISMATCH", 409);
  if (callbackCurrency && callbackCurrency !== orderCurrency && callbackCurrency !== "682") fail("EDFAPAY_CALLBACK_CURRENCY_MISMATCH", 409);
  paymentTransaction({
    provider: "edfapay",
    order_id: order.id,
    provider_order_id: transactionId,
    type: source,
    status,
    amount: Number.isFinite(amount) ? amount : order.total,
    currency: orderCurrency,
    provider_event_key: `edfapay:${transactionId || order.id}:${String(payload.type || payload.action || "purchase")}:${providerStatus}`,
    details: { provider_status: providerStatus, result: payload.result || null, reason: payload.decline_reason || payload.pgDetails?.reason || null, source }
  });
  return completeEdfaPayPayment(order, status, { provider_status: providerStatus, transaction_id: transactionId, event_type: payload.type || payload.action || source, reason: payload.decline_reason || payload.pgDetails?.reason || null });
}

async function createEdfaPayCheckout(order, req) {
  const config = normalizePaymentGateways().providers.edfapay;
  const merchantId = decryptIntegrationSecret(config.merchant_id_encrypted);
  const merchantPassword = decryptIntegrationSecret(config.merchant_password_encrypted);
  const currency = String(order.currency_snapshot?.code || "SAR").toUpperCase();
  const country = String(order.market_snapshot?.country_code || order.customer?.country_code || "SA").toUpperCase();
  if (!config.is_enabled || !config.show_at_checkout || !merchantId || !merchantPassword) fail("EDFAPAY_NOT_ENABLED", 409);
  if (!config.supported_countries.includes(country) || !config.supported_currencies.includes(currency)) fail("EDFAPAY_COUNTRY_OR_CURRENCY_NOT_SUPPORTED", 409);
  if (Number(order.total || 0) < Number(config.minimum_amount || 0) || (config.maximum_amount !== null && Number(order.total || 0) > Number(config.maximum_amount))) fail("EDFAPAY_ORDER_AMOUNT_NOT_SUPPORTED", 409);
  if (!String(order.customer?.email || "").trim()) fail("EDFAPAY_EMAIL_REQUIRED", 409);
  const amount = edfapayAmount(order.total, currency);
  const orderReference = String(order.id);
  const description = `SITEYFY order #${order.id}`;
  const name = tamaraPersonName(order.customer?.full_name || "");
  const returnToken = jwt.sign({ type: "edfapay_return", order_id: Number(order.id) }, jwtSecret, { expiresIn: "1d", audience: "siteyfy-edfapay" });
  const returnUrl = publicStoreUrl(`/payment/edfapay/return?order_id=${order.id}&token=${encodeURIComponent(returnToken)}`);
  const address = [order.customer?.street, order.customer?.building_number, order.customer?.district].filter(Boolean).join(" ").slice(0, 255);
  const forwardedIp = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim().replace(/^::ffff:/, "");
  const payerIp = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(forwardedIp) ? forwardedIp : "127.0.0.1";
  const fields = {
    action: "SALE",
    edfa_merchant_id: merchantId,
    order_id: orderReference,
    order_amount: amount,
    order_currency: currency,
    order_description: description,
    req_token: "N",
    payer_first_name: name.first_name.slice(0, 32),
    payer_last_name: name.last_name.slice(0, 32),
    payer_address: address || order.customer?.city || "Address",
    payer_address2: String(order.customer?.address_notes || "").slice(0, 255),
    payer_country: country,
    payer_state: String(order.customer?.province || "").slice(0, 32),
    payer_city: String(order.customer?.city || "").slice(0, 32),
    payer_zip: String(order.customer?.postal_code || "").slice(0, 10),
    payer_email: String(order.customer?.email || "").slice(0, 256),
    payer_phone: String(order.customer?.phone || "").replace(/[^0-9+]/g, "").slice(0, 32),
    payer_ip: payerIp,
    term_url_3ds: returnUrl,
    recurring_init: "N",
    auth: "N",
    hash: edfapayLegacyHash([orderReference, amount, currency, description], merchantPassword)
  };
  const result = await edfapayInitiateRequest(fields);
  const redirectUrl = result.redirect_url || result.redirectUrl || result.data?.redirectUrl;
  if (!redirectUrl) fail(edfapaySafeError(result, 502), 502);
  const checkoutUrl = verifiedPaymentRedirectUrl(redirectUrl, config);
  const payment = {
    ...(order.payment || {}),
    provider: "edfapay",
    status: "pending",
    provider_status: String(result.status || result.result || "new"),
    order_reference_id: orderReference,
    checkout_url: checkoutUrl,
    environment: config.environment,
    return_url: returnUrl,
    description,
    created_at: new Date().toISOString()
  };
  paymentTransaction({ provider: "edfapay", order_id: order.id, type: "checkout_created", status: "pending", amount: order.total, currency, details: { environment: config.environment, provider_status: payment.provider_status } });
  return updateRecord("orders", order.id, { payment });
}

app.post("/api/admin/catalog/reset", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const entities = ["products", "categories", "brands", "colors", "options"];
  const placeholders = entities.map(() => "?").join(",");
  const removed = db.prepare(`SELECT entity, COUNT(*) AS count FROM records WHERE entity IN (${placeholders}) GROUP BY entity`).all(...entities);
  db.prepare(`DELETE FROM records WHERE entity IN (${placeholders})`).run(...entities);
  res.json(ok({ message: "Catalog reset", removed }));
});

for (const [route, entity] of Object.entries(entityMap)) {
  app.get(`/api/admin/${route}`, (req, res) => {
    const rows = entityRows(entity);
    if (entity === "products") return res.json(ok({ products: rows, total: rows.length, page: Number(req.query.page || 1), limit: Number(req.query.limit || 20) }));
    if (entity === "bundles") return res.json(ok({ bundles: rows.map(bundleForStore), total: rows.length }));
    if (entity === "collections") {
      const productsById = new Map(entityRows("products").map((product) => [Number(product.id), product]));
      return res.json(ok({ collections: rows.map((collection) => collectionForAdmin(collection, productsById)), total: rows.length }));
    }
    if (entity === "discounts") return res.json(ok({ discounts: rows.map(discountWithStatus), total: rows.length }));
    if (entity === "users") {
      const orders = entityRows("orders");
      const users = rows.map((user) => {
        const userOrders = orders.filter((order) => {
          const identity = order.customer_identity || {};
          const customer = order.customer || order.shipping_address || {};
          return (identity.user_id && String(identity.user_id) === String(user.id))
            || (user.email && customer.email && String(customer.email).toLowerCase() === String(user.email).toLowerCase())
            || (user.phone && customer.phone && String(customer.phone) === String(user.phone));
        });
        return adminUserView({
          ...user,
          order_count: userOrders.length,
          completed_order_count: userOrders.filter((order) => order.status === "delivered").length,
          total_spent: Number(userOrders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0).toFixed(2)),
          last_order_at: userOrders.sort((a, b) => recentTimestamp(b) - recentTimestamp(a))[0]?.created_at || null
        });
      });
      return res.json(ok({ users, total: users.length, totalPages: 1 }));
    }
    if (entity === "orders") {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));
      const query = String(req.query.q || "").trim().toLowerCase();
      const status = String(req.query.status || "").trim().toLowerCase();
      const source = String(req.query.source || "").trim().toLowerCase();
      const address = String(req.query.address || "").trim().toLowerCase();
      const shipmentFilter = String(req.query.shipment || "").trim().toLowerCase();
      const shipments = entityRows("shipping_shipments");
      const context = {
        products: entityRows("products"),
        shipmentsById: new Map(shipments.map((shipment) => [Number(shipment.id), shipment])),
        shipmentsByOrderId: new Map(shipments.filter((shipment) => shipment.store_order_id).map((shipment) => [Number(shipment.store_order_id), shipment]))
      };
      const exactOrderNumberQuery = /^\d+$/.test(query) && rows.some((order) => String(order.is_historical ? order.legacy_order_number : order.id) === query);
      let filtered = rows.filter((order) => {
        const customer = order.shipping_address || order.customer || {};
        const displayOrderNumber = order.is_historical ? order.legacy_order_number : order.id;
        const haystack = [displayOrderNumber, customer.full_name, customer.phone, customer.city, ...(order.discount_codes || [])].join(" ").toLowerCase();
        const sourceMatches = !source || (source === "legacy" ? order.is_historical === true : order.is_historical !== true);
        const addressStatus = customer.address_verification?.status || "manual";
        const addressMatches = !address || (address === "verified" ? addressStatus === "verified" : addressStatus !== "verified");
        const queryMatches = !query || (exactOrderNumberQuery ? String(displayOrderNumber) === query : haystack.includes(query));
        return queryMatches && (!status || order.status === status) && sourceMatches && addressMatches;
      }).map((order) => adminOrderView(order, context));
      if (shipmentFilter) filtered = filtered.filter((order) => shipmentFilter === "linked" ? Boolean(order.shipment) : !order.shipment);
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * limit;
      return res.json(ok({ orders: filtered.slice(start, start + limit), pagination: { total, page: safePage, limit, totalPages } }));
    }
    res.json(ok(rows));
  });

  app.get(`/api/admin/${route}/:id`, (req, res) => {
    const record = getRecord(entity, req.params.id);
    if (entity === "collections") {
      if (!record) fail("Collection not found", 404);
      const collection = collectionForAdmin(record);
      return res.json(ok({ collection, ...collection }));
    }
    if (entity === "users") return res.json(ok({ user:adminUserView(record || {}) }));
    res.json(ok(entity === "discounts" && record ? discountWithStatus(record) : (record || {})));
  });

  app.post(`/api/admin/${route}`, (req, res) => {
    if (entity === "orders") fail("Orders can only be created through checkout", 405);
    const payload = entity === "products"
      ? normalizeProductPayload(req.body || {})
      : entity === "bundles"
        ? normalizeBundlePayload(req.body || {})
        : entity === "collections"
          ? normalizeCollectionPayload(req.body || {})
          : entity === "discounts"
            ? normalizeDiscountPayload(req.body || {})
            : entity === "users"
              ? normalizeUserPayload(req.body || {})
              : (req.body || {});
    if (entity === "bundles" && payload.items.length < 2) fail("A bundle must contain at least two products");
    const record = createRecord(entity, payload);
    if (entity === "collections") {
      const collection = collectionForAdmin(record);
      return res.json(ok({ collection, ...collection }));
    }
    const responseRecord = entity === "users" ? adminUserView(record) : record;
    res.json(ok({ [entity.slice(0, -1)]: responseRecord, ...responseRecord }));
  });

  app.put(`/api/admin/${route}/:id`, (req, res) => {
    if (entity === "orders") fail("Use order management endpoints to update orders", 405);
    const record = entity === "products"
      ? updateProductRecord(req.params.id, req.body || {})
      : entity === "bundles"
        ? updateBundleRecord(req.params.id, req.body || {})
        : entity === "collections"
          ? updateCollectionRecord(req.params.id, req.body || {})
          : entity === "discounts"
            ? updateRecord(entity, req.params.id, normalizeDiscountPayload(req.body || {}))
            : entity === "users"
              ? updateRecord(entity, req.params.id, normalizeUserPayload(req.body || {}, getRecord(entity, req.params.id)))
              : updateRecord(entity, req.params.id, req.body || {});
    if (entity === "collections") {
      const collection = collectionForAdmin(record);
      return res.json(ok({ collection, ...collection }));
    }
    const responseRecord = entity === "users" ? adminUserView(record) : record;
    res.json(ok({ [entity.slice(0, -1)]: responseRecord, ...responseRecord }));
  });

  app.patch(`/api/admin/${route}/:id`, (req, res) => {
    if (entity === "orders") fail("Use order management endpoints to update orders", 405);
    const record = entity === "products"
      ? updateProductRecord(req.params.id, req.body || {})
      : entity === "bundles"
        ? updateBundleRecord(req.params.id, req.body || {})
        : entity === "collections"
          ? updateCollectionRecord(req.params.id, req.body || {})
          : entity === "discounts"
            ? updateRecord(entity, req.params.id, normalizeDiscountPayload({ ...(getRecord(entity, req.params.id) || {}), ...(req.body || {}) }))
            : entity === "users"
              ? updateRecord(entity, req.params.id, normalizeUserPayload(req.body || {}, getRecord(entity, req.params.id)))
              : updateRecord(entity, req.params.id, req.body || {});
    if (entity === "collections") {
      const collection = collectionForAdmin(record);
      return res.json(ok({ collection, ...collection }));
    }
    const responseRecord = entity === "users" ? adminUserView(record) : record;
    res.json(ok({ [entity.slice(0, -1)]: responseRecord, ...responseRecord }));
  });

  app.delete(`/api/admin/${route}/:id`, (req, res) => {
    if (entity === "orders") fail("Orders cannot be deleted through the generic API", 405);
    softDelete(entity, req.params.id);
    res.json(ok({ message: "Deleted" }));
  });
}

app.get("/api/admin/products/trash", (_req, res) => res.json(ok({ products: [], total: 0 })));
app.post("/api/admin/products/:id/restore", (req, res) => res.json(ok(updateRecord("products", req.params.id, { is_deleted: 0 }))));
app.delete("/api/admin/products/:id/force", (_req, res) => res.json(ok({ message: "Deleted permanently" })));
app.post("/api/admin/products/:id/delete", (req, res) => {
  softDelete("products", req.params.id);
  res.json(ok({ message: "Moved to trash" }));
});

app.get("/api/admin/users/stats", (_req, res) => {
  const users = entityRows("users");
  const active = (user) => user.is_active !== false && !["inactive", "blocked"].includes(String(user.status || "active").toLowerCase());
  res.json(ok({ stats: {
    totalUsers: users.length,
    activeUsers: users.filter(active).length,
    blockedUsers: users.filter((user) => String(user.status || "").toLowerCase() === "blocked").length,
    inactiveUsers: users.filter((user) => !active(user)).length,
    verifiedUsers: users.filter((user) => user.is_verified === true || user.email_verified === true || user.verified_at).length
  } }));
});
app.patch("/api/admin/users/:id/status", (req, res) => {
  const status = String(req.body?.status || "").toLowerCase();
  if (!["active", "inactive", "blocked"].includes(status)) fail("Invalid user status");
  const user = getRecord("users", req.params.id);
  if (!user) fail("User not found", 404);
  res.json(ok({ user: adminUserView(updateRecord("users", req.params.id, { status, is_active: status === "active" })) }));
});

app.get("/api/admin/orders/orders-stats", (_req, res) => {
  const rows = entityRows("orders");
  res.json(ok({
    totalOrders: rows.length,
    pendingOrders: rows.filter((row) => ["pending", "confirmed"].includes(row.status)).length,
    processingOrders: rows.filter((row) => ["processing", "ready_to_ship", "shipped"].includes(row.status)).length,
    deliveredOrders: rows.filter((row) => row.status === "delivered").length,
    cancelledOrders: rows.filter((row) => row.status === "cancelled").length,
    totalRevenue: Number(rows.filter((row) => row.status !== "cancelled").reduce((sum, row) => sum + Number(row.total || 0), 0).toFixed(2))
  }));
});
app.get("/api/admin/order-management/stats/summary", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const rows = entityRows("orders");
  res.json(ok({
    totalOrders: rows.length,
    pendingOrders: rows.filter((row) => ["pending", "confirmed"].includes(row.status)).length,
    processingOrders: rows.filter((row) => ["processing", "ready_to_ship", "shipped"].includes(row.status)).length,
    deliveredOrders: rows.filter((row) => row.status === "delivered").length,
    cancelledOrders: rows.filter((row) => row.status === "cancelled").length,
    historicalOrders: rows.filter((row) => row.is_historical === true).length,
    liveOrders: rows.filter((row) => row.is_historical !== true).length,
    totalRevenue: Number(rows.filter((row) => row.status !== "cancelled").reduce((sum, row) => sum + Number(row.total || 0), 0).toFixed(2))
  }));
});
app.get("/api/admin/order-migrations/legacy", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const orders = entityRows("orders").filter((order) => order.source === "komrz_woocommerce");
  const runs = entityRows("legacy_order_import_runs").sort((a, b) => String(b.completed_at || b.created_at).localeCompare(String(a.completed_at || a.created_at)));
  const linkedOrderIds = new Set(entityRows("shipping_shipments").map((shipment) => Number(shipment.store_order_id)).filter(Boolean));
  const linked = orders.filter((order) => linkedOrderIds.has(Number(order.id))).length;
  const unmatchedLines = orders.reduce((sum, order) => sum + (order.items || []).filter((item) => !item.product_id).length, 0);
  res.json(ok({
    source: "redaa-alhishma.com",
    imported_orders: orders.length,
    linked_shipments: linked,
    unmatched_lines: unmatchedLines,
    date_min: orders.map((order) => order.legacy_dates?.created_at).filter(Boolean).sort()[0] || null,
    date_max: orders.map((order) => order.legacy_dates?.created_at).filter(Boolean).sort().at(-1) || null,
    latest_run: runs[0] || null,
    runs: runs.slice(0, 10)
  }));
});
app.get("/api/admin/order-management/:id", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const order = getRecord("orders", req.params.id);
  if (!order) fail("ORDER_NOT_FOUND", 404);
  const events = entityRows("order_events").filter((event) => Number(event.order_id) === Number(order.id)).sort((a, b) => String(b.occurred_at || b.created_at).localeCompare(String(a.occurred_at || a.created_at)));
  res.json(ok({ order: adminOrderView(order), events, integrations: publicShippingIntegrations() }));
});
app.patch("/api/admin/order-management/:id/status", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const order = getRecord("orders", req.params.id);
  if (!order) fail("ORDER_NOT_FOUND", 404);
  const status = String(req.body?.status || "").toLowerCase();
  if (!managedOrderStatuses.has(status)) fail("INVALID_ORDER_STATUS");
  const updated = updateRecord("orders", order.id, { status });
  addOrderEvent(order.id, "status_changed", { from: order.status, to: status }, req.user.email || "admin");
  res.json(ok({ order: adminOrderView(updated) }));
});
app.put("/api/admin/order-management/:id/address", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    const order = getRecord("orders", req.params.id);
    if (!order) fail("ORDER_NOT_FOUND", 404);
    const current = order.shipping_address || order.customer || {};
    const address = await normalizeVerifiedCheckoutCustomer({ ...current, ...(req.body || {}) }, `admin_order_${order.id}`);
    const shipment = orderShipment(order);
    const remoteOrderExists = Boolean(shipment?.external_order_no || shipment?.oto_id || shipment?.waybill_no);
    const updated = updateRecord("orders", order.id, {
      customer: { ...(order.customer || {}), ...address },
      shipping_address: address,
      shipment_address_out_of_sync: remoteOrderExists
    });
    addOrderEvent(order.id, "address_updated", { verification_status: address.address_verification?.status || "manual", shipment_address_out_of_sync: remoteOrderExists }, req.user.email || "admin");
    res.json(ok({ order: adminOrderView(updated) }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/order-management/:id/shipping-update", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    const order = getRecord("orders", req.params.id);
    if (!order) fail("ORDER_NOT_FOUND", 404);
    const shipment = orderShipment(order);
    if (shipment?.provider !== "oto") fail("OTO_ORDER_NOT_CREATED", 409);
    try {
      const updatedShipment = await updateOtoOrder(order, shipment);
      const updatedOrder = updateRecord("orders", order.id, { shipment_address_out_of_sync: false });
      addOrderEvent(order.id, "oto_order_updated", { shipment_id: updatedShipment.id, external_order_no: updatedShipment.external_order_no }, req.user.email || "admin");
      res.json(ok({ order: adminOrderView(updatedOrder), shipment: updatedShipment }));
    } catch (error) {
      upsertShippingShipment({ ...shipment, integration_error: String(error.message || "OTO_UPDATE_FAILED"), last_attempted_at: new Date().toISOString() });
      addOrderEvent(order.id, "oto_order_update_failed", { reason: String(error.message || "OTO_UPDATE_FAILED") }, req.user.email || "admin");
      throw error;
    }
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/order-management/:id/dispatch", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    const order = getRecord("orders", req.params.id);
    if (!order) fail("ORDER_NOT_FOUND", 404);
    const provider = String(req.body?.provider || "").toLowerCase();
    try {
      const shipment = await dispatchOrderToShippingProvider(order, provider);
      addOrderEvent(order.id, "shipment_dispatched", { provider: shipment.provider, shipment_id: shipment.id, external_order_no: shipment.external_order_no || null, waybill_no: shipment.waybill_no || null }, req.user.email || "admin");
      res.json(ok({ order: adminOrderView(getRecord("orders", order.id)), shipment }));
    } catch (error) {
      addOrderEvent(order.id, "shipment_dispatch_failed", { provider: provider || orderFulfillmentProvider(order), reason: String(error.message || "SHIPPING_DISPATCH_FAILED") }, req.user.email || "admin");
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/reviews", (req, res) => {
  const source = String(req.query.source || "all").toLowerCase();
  const status = String(req.query.status || "all").toLowerCase();
  const rating = req.query.rating === undefined || req.query.rating === "" ? null : Number(req.query.rating);
  const productId = req.query.product_id === undefined || req.query.product_id === "" ? null : Number(req.query.product_id);
  const query = String(req.query.q || "").trim().toLowerCase();
  if (!["all", "customer", "store"].includes(source)) fail("Invalid review source");
  if (status !== "all" && !reviewStatuses.has(status) && !["active", "inactive"].includes(status)) fail("Invalid review status");
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) fail("Invalid review rating");
  if (productId !== null && (!Number.isInteger(productId) || productId <= 0)) fail("Invalid product id");

  const products = new Map(entityRows("products").map((product) => [Number(product.id), product]));
  const customerReviews = entityRows("product_reviews").map((review) => {
    const product = products.get(Number(review.product_id));
    return { ...adminReviewView(review), product_name_ar: product?.name_ar || "", product_name_en: product?.name_en || "" };
  });
  const storeRecommendations = entityRows("product_recommendations").map((recommendation) => {
    const product = products.get(Number(recommendation.product_id));
    return {
      id: Number(recommendation.id),
      record_type: "store_recommendation",
      source: "store",
      product_id: Number(recommendation.product_id),
      product_name_ar: product?.name_ar || "",
      product_name_en: product?.name_en || "",
      display_name: recommendation.author_name_en || recommendation.author_name_ar,
      author_name_ar: recommendation.author_name_ar,
      author_name_en: recommendation.author_name_en,
      rating: Number(recommendation.rating),
      comment: recommendation.body_en || recommendation.body_ar,
      body_ar: recommendation.body_ar,
      body_en: recommendation.body_en,
      status: recommendation.is_active === false ? "inactive" : "active",
      is_featured: recommendation.is_featured === true,
      sort_order: Number(recommendation.sort_order || 0),
      created_at: recommendation.created_at,
      updated_at: recommendation.updated_at
    };
  });
  const allRows = [...customerReviews, ...storeRecommendations];
  const rows = allRows.filter((row) => {
    if (source !== "all" && row.source !== source) return false;
    if (status !== "all" && row.status !== status) return false;
    if (rating !== null && row.rating !== rating) return false;
    if (productId !== null && row.product_id !== productId) return false;
    if (query) {
      const haystack = [row.display_name, row.comment, row.body_ar, row.body_en, row.product_name_ar, row.product_name_en, row.order_id]
        .map((value) => String(value || "").toLowerCase()).join(" ");
      if (!haystack.includes(query)) return false;
    }
    return true;
  }).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 25)));
  const paged = rows.slice((page - 1) * limit, page * limit);
  res.json(ok({
    reviews: paged,
    total: rows.length,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(rows.length / limit)),
    summary: {
      total: allRows.length,
      customer: customerReviews.length,
      store: storeRecommendations.length,
      pending: customerReviews.filter((row) => row.status === "pending").length,
      published: customerReviews.filter((row) => row.status === "published").length,
      hidden: customerReviews.filter((row) => row.status === "hidden").length,
      rejected: customerReviews.filter((row) => row.status === "rejected").length,
      verified_purchases: customerReviews.filter((row) => row.is_verified_purchase).length,
      average_rating: ratingAggregate(customerReviews.filter((row) => row.status === "published")).average
    }
  }));
});

app.get("/api/admin/reviews/:id", (req, res) => {
  const review = activeReviewRecord(req.params.id);
  if (!review) fail("Review not found", 404);
  const events = entityRows("review_events")
    .filter((event) => Number(event.review_id) === Number(review.id))
    .sort((a, b) => String(b.occurred_at || b.created_at).localeCompare(String(a.occurred_at || a.created_at)));
  res.json(ok({ review: adminReviewView(review), events }));
});

for (const method of ["put", "patch"]) {
  app[method]("/api/admin/reviews/:id", (req, res) => {
    const review = activeReviewRecord(req.params.id);
    if (!review) fail("Review not found", 404);
    const updated = updateCustomerReview(review, req.body || {}, req.user.email || "admin");
    res.json(ok({ review: adminReviewView(updated) }));
  });
}

app.delete("/api/admin/reviews/:id", (req, res) => {
  const review = activeReviewRecord(req.params.id);
  if (!review) fail("Review not found", 404);
  reviewEvent(review.id, "deleted", req.user.email || "admin", { previous_status: review.status });
  softDelete("product_reviews", review.id);
  res.json(ok({ message: "Review deleted" }));
});

app.get("/api/admin/recommendations", (req, res) => {
  const productId = req.query.product_id ? Number(req.query.product_id) : null;
  const recommendations = entityRows("product_recommendations")
    .filter((row) => !productId || Number(row.product_id) === productId)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  res.json(ok({ recommendations, total: recommendations.length }));
});

app.get("/api/admin/recommendations/:id", (req, res) => {
  const recommendation = activeRecommendationRecord(req.params.id);
  if (!recommendation) fail("Recommendation not found", 404);
  res.json(ok({ recommendation }));
});

app.post("/api/admin/recommendations", (req, res) => {
  const recommendation = createRecord("product_recommendations", normalizeRecommendationPayload(req.body || {}));
  reviewEvent(recommendation.id, "store_recommendation_created", req.user.email || "admin", { product_id: recommendation.product_id });
  res.json(ok({ recommendation }));
});

for (const method of ["put", "patch"]) {
  app[method]("/api/admin/recommendations/:id", (req, res) => {
    const existing = activeRecommendationRecord(req.params.id);
    if (!existing) fail("Recommendation not found", 404);
    const recommendation = updateRecord("product_recommendations", existing.id, normalizeRecommendationPayload(req.body || {}, existing));
    reviewEvent(recommendation.id, "store_recommendation_updated", req.user.email || "admin", { product_id: recommendation.product_id });
    res.json(ok({ recommendation }));
  });
}

app.delete("/api/admin/recommendations/:id", (req, res) => {
  const recommendation = activeRecommendationRecord(req.params.id);
  if (!recommendation) fail("Recommendation not found", 404);
  reviewEvent(recommendation.id, "store_recommendation_deleted", req.user.email || "admin", { product_id: recommendation.product_id });
  softDelete("product_recommendations", recommendation.id);
  res.json(ok({ message: "Recommendation deleted" }));
});

app.get("/api/admin/products/:id/social-proof", (req, res) => {
  const product = productRecord(req.params.id);
  if (!product) fail("Product not found", 404);
  const settings = productSocialProofSettings(product.id);
  res.json(ok({
    product_id: Number(product.id),
    settings,
    sales: productSalesSocialProof(product.id, settings),
    aggregate: ratingAggregate(publishedProductReviews(product.id))
  }));
});

app.put("/api/admin/products/:id/social-proof", (req, res) => {
  const product = productRecord(req.params.id);
  if (!product) fail("Product not found", 404);
  const saved = saveProductSocialProofSettings(product.id, req.body || {});
  const settings = productSocialProofSettings(product.id);
  reviewEvent(0, "social_proof_settings_updated", req.user.email || "admin", { product_id: Number(product.id), settings_record_id: saved.id });
  res.json(ok({
    product_id: Number(product.id),
    settings,
    sales: productSalesSocialProof(product.id, settings),
    aggregate: ratingAggregate(publishedProductReviews(product.id))
  }));
});

app.get("/api/admin/analytics/sales", (_req, res) => res.json(ok({ totalSales: 0, totalOrders: 0, revenue: 0, chart: [] })));
app.get("/api/admin/analytics/user-stats", (_req, res) => res.json(ok({ totalUsers: 0, newUsers: 0 })));
app.get("/api/admin/analytics/engagement", (_req, res) => res.json(ok({ wishlistCount: 0, cartCount: 0, views: 0 })));
app.get("/api/admin/analytics/top-products", (_req, res) => res.json(ok({ products: [] })));
app.get("/api/admin/analytics/top-cart-products", (_req, res) => res.json(ok({ products: [] })));
app.get("/api/admin/lighthouse/targets", (req, res) => {
  const products = storeProductRows().map((product) => ({
    id: product.id,
    label: product.name_en || `Product ${product.id}`,
    label_ar: product.name_ar || `منتج ${product.id}`,
    url: publicStoreUrl(`/product/${product.id}`)
  }));
  res.json(ok({
    targets: [
      { mode: "homepage", label: "Homepage", label_ar: "الرئيسية", url: publicStoreUrl("/") },
      { mode: "products", label: "Products listing", label_ar: "صفحة المنتجات", url: publicStoreUrl("/products") }
    ],
    products
  }));
});
app.post("/api/admin/lighthouse/run", async (req, res, next) => {
  try {
    const targets = req.body?.targets?.length ? req.body.targets.map((target) => auditTargetFromRequest(target)) : [auditTargetFromRequest(req.body)];
    const results = [];
    for (const target of targets) {
      await ensureAuditPageAvailable(target);
      results.push(await runLighthouseAudit(target));
    }
    res.json(ok({
      generated_at: new Date().toISOString(),
      target_count: results.length,
      results
    }));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/company-info", (_req, res) => res.json(ok(getSetting("companyInfo"))));
app.put("/api/admin/company-info", (req, res) => res.json(ok(setSetting("companyInfo", { ...getSetting("companyInfo"), ...req.body }))));
app.get("/api/admin/settings/home-sections", (_req, res) => res.json(ok(getSetting("homeSections"))));
app.put("/api/admin/settings/home-sections", (req, res) => res.json(ok(setSetting("homeSections", req.body))));
app.get("/api/admin/settings", (_req, res) => res.json(ok(currentSettings())));
app.put("/api/admin/settings", (req, res) => res.json(ok(setSetting("settings", normalizeSettingsPayload({ ...getSetting("settings"), ...req.body })))));
app.get("/api/admin/shipping/integrations", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  res.json(ok({ settings: publicShippingIntegrations(), connection: { connected: false, tested_at: null } }));
});
app.put("/api/admin/shipping/integrations", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const settings = normalizeShippingIntegrations({ ...(req.body || {}), updated_at: new Date().toISOString() });
  setSetting("shippingIntegrations", settings);
  const estimatesUpdated = refreshConfiguredShippingEstimates({ overwriteConfigured: true });
  imileTokenCache.clear();
  otoTokenCache.clear();
  imileOmsTokenCache.clear();
  res.json(ok({ settings: publicShippingIntegrations(), estimates_updated: estimatesUpdated }));
});
app.patch("/api/admin/shipping/integrations/:provider/state", (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();
  if (!["imile", "oto"].includes(provider)) fail("SHIPPING_PROVIDER_NOT_SUPPORTED", 404);
  const current = normalizeShippingIntegrations();
  const providerSettings = current[provider];
  const isEnabled = req.body?.is_enabled === true;
  const showAtCheckout = req.body?.show_at_checkout === undefined ? providerSettings.show_at_checkout : req.body.show_at_checkout === true;
  let defaultProvider = current.default_provider;
  if (req.body?.is_default === true && isEnabled) defaultProvider = provider;
  if (!isEnabled && defaultProvider === provider) defaultProvider = provider === "oto" && current.imile.is_enabled ? "imile" : provider === "imile" && current.oto.is_enabled ? "oto" : "internal";
  const settings = normalizeShippingIntegrations({
    default_provider: defaultProvider,
    active_provider: defaultProvider,
    [provider]: { ...providerSettings, is_enabled: isEnabled, show_at_checkout: showAtCheckout },
    updated_at: new Date().toISOString()
  });
  setSetting("shippingIntegrations", settings);
  if (provider === "imile") imileTokenCache.clear();
  if (provider === "oto") otoTokenCache.clear();
  res.json(ok({ settings: publicShippingIntegrations() }));
});
app.post("/api/admin/shipping/integrations/imile/test", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    const token = await imileAccessToken();
    res.json(ok({ connected: Boolean(token), environment: normalizeShippingIntegrations().imile.environment, tested_at: new Date().toISOString() }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/shipping/integrations/oto/test", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    otoTokenCache.clear();
    const settings = normalizeShippingIntegrations();
    const token = await otoAccessToken(settings);
    const testedAt = new Date().toISOString();
    const saved = normalizeShippingIntegrations({ oto: { ...settings.oto, last_test_at: testedAt, last_test_status: "connected", last_test_message: "Authentication successful" }, updated_at: testedAt });
    setSetting("shippingIntegrations", saved);
    res.json(ok({ connected: Boolean(token), environment: settings.oto.environment, tested_at: testedAt }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/shipping/integrations/oto/webhook", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    const current = normalizeShippingIntegrations();
    const baseUrl = `https://${process.env.PUBLIC_DOMAIN || "ecommerce.siteyfy.com"}/api/webhooks/oto`;
    const registered = await otoRequest("/rest/v2/webhook", { method: "GET" });
    const existingWebhooks = Array.isArray(registered.webhooks) ? registered.webhooks : [];
    const existingStatus = existingWebhooks.find((row) => row.url === baseUrl || row.url === `${baseUrl}/order-status`);
    const secret = existingStatus?.secretKey || decryptIntegrationSecret(current.oto.webhook_secret_encrypted) || crypto.randomBytes(32).toString("base64url");
    const authorization = existingStatus?.authorizationKey || decryptIntegrationSecret(current.oto.webhook_authorization_encrypted) || crypto.randomBytes(32).toString("base64url");
    const ids = { ...(current.oto.webhook_ids || {}) };
    for (const webhookType of ["orderStatus", "shipmentError"]) {
      const url = webhookType === "shipmentError" ? `${baseUrl}/shipment-error` : (existingStatus?.url || `${baseUrl}/order-status`);
      const existing = existingWebhooks.find((row) => row.url === url);
      if (existing) { ids[webhookType] = String(existing.id); continue; }
      const body = { method: "post", url, orderPrefix: current.oto.order_prefix || "SFY-", secretKey: secret, authorizationKey: authorization, webhookType };
      const result = await otoRequest("/rest/v2/webhook", { method: "POST", body });
      ids[webhookType] = String(result.id || "");
    }
    const settings = normalizeShippingIntegrations({
      oto: { ...current.oto, webhook_secret: secret, webhook_authorization: authorization, webhook_ids: ids, webhook_url: baseUrl, webhook_registered_at: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
    setSetting("shippingIntegrations", settings);
    res.json(ok({ registered: true, url: baseUrl, webhook_types: Object.keys(ids), registered_at: settings.oto.webhook_registered_at }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/shipping/integrations/oms/test", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    imileOmsTokenCache.clear();
    const session = await imileOmsLogin(normalizeShippingIntegrations(), true);
    res.json(ok({ connected: Boolean(session.access_token), username: session.user?.userCode || session.user?.username || "", tested_at: new Date().toISOString() }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/shipping/integrations/spl/test", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    const shortAddress = normalizeSaudiShortAddress(req.body?.short_address);
    const result = await resolveSaudiShortAddress(shortAddress, { force: true, actor: `admin:${req.user.email || req.user.id || "admin"}` });
    res.json(ok({ ...result, verification_token: undefined, connected: true, tested_at: new Date().toISOString() }));
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/payment-gateways", (_req, res) => {
  const transactions = entityRows("payment_transactions").sort((a, b) => recentTimestamp(b) - recentTimestamp(a)).slice(0, 25);
  res.json(ok({ settings: publicPaymentGateways(), transactions, webhook_endpoint: publicStoreUrl("/api/webhooks/tamara") }));
});
app.put("/api/admin/payment-gateways", (req, res) => {
  const settings = normalizePaymentGateways({ ...(req.body || {}), updated_at: new Date().toISOString() });
  setSetting("paymentGateways", settings);
  res.json(ok({ settings: publicPaymentGateways(), webhook_endpoint: publicStoreUrl("/api/webhooks/tamara") }));
});
app.patch("/api/admin/payment-gateways/:provider/state", (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();
  const current = normalizePaymentGateways();
  if (provider === "cod") {
    const settings = normalizePaymentGateways({
      cash_on_delivery: { ...current.cash_on_delivery, is_enabled: req.body?.is_enabled === true },
      updated_at: new Date().toISOString()
    });
    setSetting("paymentGateways", settings);
    return res.json(ok({ settings: publicPaymentGateways() }));
  }
  if (!["tamara", "edfapay", "tabby"].includes(provider)) fail("PAYMENT_PROVIDER_NOT_SUPPORTED", 404);
  const providerSettings = current.providers[provider];
  const isEnabled = req.body?.is_enabled === true;
  const showAtCheckout = req.body?.show_at_checkout === undefined ? providerSettings.show_at_checkout : req.body.show_at_checkout === true;
  let activeProvider = current.active_provider;
  if (req.body?.is_preferred === true && isEnabled) activeProvider = provider;
  if (!isEnabled && activeProvider === provider) activeProvider = "none";
  const settings = normalizePaymentGateways({
    active_provider: activeProvider,
    providers: { [provider]: { ...providerSettings, is_enabled: isEnabled, show_at_checkout: showAtCheckout } },
    updated_at: new Date().toISOString()
  });
  setSetting("paymentGateways", settings);
  res.json(ok({ settings: publicPaymentGateways() }));
});
app.post("/api/admin/payment-gateways/tamara/test", async (_req, res, next) => {
  try {
    const settings = normalizePaymentGateways();
    const tamara = settings.providers.tamara;
    const currency = tamara.supported_currencies[0] || "SAR";
    const result = await tamaraRequest("/pre-checkout/v1/eligibility", {
      method: "POST",
      body: { order: { amount: Math.max(1, Number(tamara.minimum_amount || 0)), currency }, customer: {} },
      timeoutMs: 5000
    });
    const updated = normalizePaymentGateways({ providers: { tamara: { last_test_at: new Date().toISOString(), last_test_status: "connected", last_test_message: "Authentication accepted by Tamara" } }, updated_at: new Date().toISOString() });
    setSetting("paymentGateways", updated);
    res.json(ok({ connected: true, environment: tamara.environment, eligibility_probe: result, tested_at: updated.providers.tamara.last_test_at }));
  } catch (error) {
    const updated = normalizePaymentGateways({ providers: { tamara: { last_test_at: new Date().toISOString(), last_test_status: "failed", last_test_message: String(error.message || "Connection failed") } }, updated_at: new Date().toISOString() });
    setSetting("paymentGateways", updated);
    next(error);
  }
});
app.post("/api/admin/payment-gateways/tamara/register-webhook", async (_req, res, next) => {
  try {
    const settings = normalizePaymentGateways();
    const tamara = settings.providers.tamara;
    const webhookUrl = publicStoreUrl("/api/webhooks/tamara");
    // Tamara's live API currently rejects order_updated despite it still appearing in older docs.
    const events = ["order_approved", "order_authorised", "order_canceled", "order_captured", "order_refunded"];
    let result;
    if (tamara.webhook_id) {
      result = await tamaraRequest(`/webhooks/${encodeURIComponent(tamara.webhook_id)}`, { method: "PUT", body: { url: webhookUrl, events, headers: {} }, timeoutMs: 10000 });
    } else {
      result = await tamaraRequest("/webhooks", { method: "POST", body: { type: "order", events, url: webhookUrl, headers: {} }, timeoutMs: 10000 });
    }
    const webhookId = String(result.webhook_id || result.id || tamara.webhook_id || "");
    const updated = normalizePaymentGateways({ providers: { tamara: { webhook_id: webhookId, webhook_url: webhookUrl, webhook_registered_at: new Date().toISOString() } }, updated_at: new Date().toISOString() });
    setSetting("paymentGateways", updated);
    paymentTransaction({ provider: "tamara", type: "webhook_registered", status: "completed", details: { webhook_id: webhookId, webhook_url: webhookUrl, environment: tamara.environment } });
    res.json(ok({ registered: true, webhook_id: webhookId, webhook_url: webhookUrl, provider_response: result }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/payment-gateways/edfapay/test", async (_req, res, next) => {
  try {
    const settings = normalizePaymentGateways();
    const edfapay = settings.providers.edfapay;
    const merchantId = decryptIntegrationSecret(edfapay.merchant_id_encrypted);
    const merchantPassword = decryptIntegrationSecret(edfapay.merchant_password_encrypted);
    if (!merchantId || !merchantPassword) fail("EDFAPAY_CREDENTIALS_MISSING", 409);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(merchantId)) fail("EDFAPAY_MERCHANT_ID_INVALID", 409);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await fetch(`${edfapayBaseUrl(edfapay)}/payment/initiate`, { method: "OPTIONS", signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (response.status >= 500) fail(`EDFAPAY_ENDPOINT_UNAVAILABLE_${response.status}`, 502);
    const testedAt = new Date().toISOString();
    const message = "Endpoint reachable; credentials are verified on the first real checkout.";
    const updated = normalizePaymentGateways({ providers: { edfapay: { last_test_at: testedAt, last_test_status: "connected", last_test_message: message } }, updated_at: testedAt });
    setSetting("paymentGateways", updated);
    res.json(ok({ connected: true, endpoint_reachable: true, credentials_format_valid: true, environment: edfapay.environment, tested_at: testedAt, message }));
  } catch (error) {
    const testedAt = new Date().toISOString();
    const updated = normalizePaymentGateways({ providers: { edfapay: { last_test_at: testedAt, last_test_status: "failed", last_test_message: String(error.message || "Connection failed") } }, updated_at: testedAt });
    setSetting("paymentGateways", updated);
    next(error);
  }
});
app.post("/api/admin/payment-gateways/tabby/test", async (_req, res, next) => {
  try {
    const tabby = normalizePaymentGateways().providers.tabby;
    const result = await tabbyRequest("/api/v1/webhooks", { timeoutMs: 6000 });
    const testedAt = new Date().toISOString();
    const updated = normalizePaymentGateways({ providers: { tabby: { last_test_at: testedAt, last_test_status: "connected", last_test_message: "Authentication accepted by Tabby" } }, updated_at: testedAt });
    setSetting("paymentGateways", updated);
    res.json(ok({ connected: true, environment: tabby.environment, webhooks: result, tested_at: testedAt }));
  } catch (error) {
    const testedAt = new Date().toISOString();
    setSetting("paymentGateways", normalizePaymentGateways({ providers: { tabby: { last_test_at: testedAt, last_test_status: "failed", last_test_message: String(error.message || "Connection failed") } }, updated_at: testedAt }));
    next(error);
  }
});
app.post("/api/admin/payment-gateways/tabby/register-webhook", async (_req, res, next) => {
  try {
    const settings = normalizePaymentGateways();
    const tabby = settings.providers.tabby;
    const authValue = decryptIntegrationSecret(tabby.webhook_auth_encrypted);
    const webhookUrl = publicStoreUrl("/api/webhooks/tabby");
    const body = { url: webhookUrl, header: { title: "X-Siteyfy-Tabby-Token", value: authValue } };
    const result = tabby.webhook_id
      ? await tabbyRequest(`/api/v1/webhooks/${encodeURIComponent(tabby.webhook_id)}`, { method: "PUT", body })
      : await tabbyRequest("/api/v1/webhooks", { method: "POST", body });
    const registeredAt = new Date().toISOString();
    const updated = normalizePaymentGateways({ providers: { tabby: { webhook_id: result.id || tabby.webhook_id, webhook_url: webhookUrl, webhook_registered_at: registeredAt } }, updated_at: registeredAt });
    setSetting("paymentGateways", updated);
    paymentTransaction({ provider: "tabby", type: "webhook_registered", status: "completed", details: { webhook_id: result.id || tabby.webhook_id, webhook_url: webhookUrl } });
    res.json(ok({ registered: true, webhook_id: result.id || tabby.webhook_id, webhook_url: webhookUrl }));
  } catch (error) { next(error); }
});
app.get("/api/admin/payment-gateways/transactions", (req, res) => {
  let rows = entityRows("payment_transactions");
  if (req.query.provider) rows = rows.filter((row) => row.provider === String(req.query.provider));
  if (req.query.status) rows = rows.filter((row) => row.status === String(req.query.status));
  if (req.query.order_id) rows = rows.filter((row) => String(row.order_id || "") === String(req.query.order_id));
  rows.sort((a, b) => recentTimestamp(b) - recentTimestamp(a));
  res.json(ok({ transactions: rows.slice(0, Math.min(250, Math.max(10, Number(req.query.limit || 100)))), total: rows.length }));
});
app.get("/api/admin/checkout-recovery", (req, res) => {
  refreshCheckoutRecoveryStatuses();
  let rows = entityRows("checkout_recovery_sessions").map(checkoutRecoveryAdminView);
  const q = String(req.query.q || "").trim().toLowerCase();
  const status = String(req.query.status || "").trim().toLowerCase();
  const provider = String(req.query.provider || "").trim().toLowerCase();
  const dateFrom = String(req.query.date_from || "");
  const dateTo = String(req.query.date_to || "");
  if (q) rows = rows.filter((row) => [row.id,row.session_key,row.order_id,row.contact_name,row.phone,row.email].some((value) => String(value || "").toLowerCase().includes(q)));
  if (status) rows = rows.filter((row) => row.status === status);
  if (provider) rows = rows.filter((row) => row.payment_provider === provider);
  if (dateFrom) rows = rows.filter((row) => String(row.started_at || row.created_at) >= dateFrom);
  if (dateTo) rows = rows.filter((row) => String(row.started_at || row.created_at).slice(0,10) <= dateTo);
  rows.sort((a,b) => recentTimestamp(b) - recentTimestamp(a));
  const all = entityRows("checkout_recovery_sessions");
  const stats = {
    total:all.length, active:all.filter(row=>row.status==="active").length, abandoned:all.filter(row=>row.status==="abandoned").length,
    failed:all.filter(row=>["failed","cancelled"].includes(row.status)).length, pending:all.filter(row=>["payment_pending","pending_review"].includes(row.status)).length,
    completed:all.filter(row=>row.status==="completed").length, recovered:all.filter(row=>row.status==="recovered"||row.recovery_state==="recovered").length
  };
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit || 30)));
  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const safePage = Math.min(page, totalPages);
  res.json(ok({ sessions:rows.slice((safePage-1)*limit,safePage*limit), stats, pagination:{ page:safePage, limit, total:rows.length, total_pages:totalPages }, settings:checkoutRecoverySettings() }));
});
app.get("/api/admin/checkout-recovery/:id", (req, res) => {
  refreshCheckoutRecoveryStatuses();
  const session = getRecord("checkout_recovery_sessions", req.params.id) || checkoutRecoverySessionByKey(req.params.id);
  if (!session) fail("Checkout recovery session not found", 404);
  const events = entityRows("checkout_recovery_events").filter(row=>Number(row.session_id)===Number(session.id)).sort((a,b)=>recentTimestamp(a)-recentTimestamp(b));
  const contacts = entityRows("checkout_recovery_contacts").filter(row=>Number(row.session_id)===Number(session.id)).sort((a,b)=>recentTimestamp(b)-recentTimestamp(a));
  const order = session.order_id ? getRecord("orders", session.order_id) : null;
  const transactions = session.order_id ? entityRows("payment_transactions").filter(row=>Number(row.order_id)===Number(session.order_id)).sort((a,b)=>recentTimestamp(a)-recentTimestamp(b)) : [];
  res.json(ok({ session:checkoutRecoveryAdminView(session), events, contacts, order:order?adminOrderView(order):null, transactions }));
});
app.patch("/api/admin/checkout-recovery/:id", (req, res) => {
  const session = getRecord("checkout_recovery_sessions", req.params.id) || checkoutRecoverySessionByKey(req.params.id);
  if (!session) fail("Checkout recovery session not found", 404);
  const allowedStatus = ["active","abandoned","payment_pending","pending_review","failed","cancelled","completed","recovered","closed"];
  const status = allowedStatus.includes(req.body?.status) ? req.body.status : session.status;
  const recoveryState = ["new","contacted","follow_up","recovered","not_reachable","closed"].includes(req.body?.recovery_state) ? req.body.recovery_state : session.recovery_state;
  const updated = updateRecord("checkout_recovery_sessions", session.id, {
    status, recovery_state:recoveryState, assigned_to:String(req.body?.assigned_to || session.assigned_to || "").slice(0,120) || null,
    follow_up_at:req.body?.follow_up_at || session.follow_up_at || null,
    completed_at:status==="recovered" ? (session.completed_at || new Date().toISOString()) : session.completed_at || null
  });
  recordCheckoutRecoveryEvent(updated, "admin_status_updated", { source:`admin:${req.user.email||req.user.id}`, status, message:`Recovery state changed to ${recoveryState}` });
  res.json(ok({ session:checkoutRecoveryAdminView(updated) }));
});
app.post("/api/admin/checkout-recovery/:id/contacts", (req, res) => {
  const session = getRecord("checkout_recovery_sessions", req.params.id) || checkoutRecoverySessionByKey(req.params.id);
  if (!session) fail("Checkout recovery session not found", 404);
  const channel = ["phone","whatsapp","email","other"].includes(req.body?.channel) ? req.body.channel : "phone";
  const outcome = ["contacted","no_answer","follow_up","recovered","not_interested","wrong_number"].includes(req.body?.outcome) ? req.body.outcome : "contacted";
  const contact = createRecord("checkout_recovery_contacts", {
    session_id:Number(session.id), channel, outcome, note:String(req.body?.note || "").trim().slice(0,2000),
    contacted_by:req.user.email || String(req.user.id), contacted_at:new Date().toISOString(), follow_up_at:req.body?.follow_up_at || null
  });
  const recoveryState = outcome === "recovered" ? "recovered" : outcome === "follow_up" ? "follow_up" : outcome === "no_answer" ? "not_reachable" : "contacted";
  const updated = updateRecord("checkout_recovery_sessions", session.id, {
    recovery_state:recoveryState, status:outcome==="recovered"?"recovered":session.status,
    last_contacted_at:new Date().toISOString(), follow_up_at:req.body?.follow_up_at || session.follow_up_at || null
  });
  recordCheckoutRecoveryEvent(updated, "customer_contacted", { source:`admin:${req.user.email||req.user.id}`, status:updated.status, message:`${channel}: ${outcome}` });
  res.json(ok({ contact, session:checkoutRecoveryAdminView(updated) }));
});
app.get("/api/admin/checkout-recovery-settings", (_req, res) => res.json(ok({ settings:checkoutRecoverySettings() })));
app.put("/api/admin/checkout-recovery-settings", (req, res) => res.json(ok({ settings:checkoutRecoverySettings(req.body || {}) })));
app.get("/api/admin/shipping/carrier-bills", (req, res) => {
  let bills = entityRows("shipping_carrier_bills").filter((bill) => bill.provider === "imile");
  if (req.query.type) bills = bills.filter((bill) => bill.bill_type === String(req.query.type));
  if (req.query.status) bills = bills.filter((bill) => bill.settlement_status === String(req.query.status));
  if (req.query.date_from) bills = bills.filter((bill) => bill.bill_date >= String(req.query.date_from));
  if (req.query.date_to) bills = bills.filter((bill) => bill.bill_date <= String(req.query.date_to));
  const q = String(req.query.q || "").trim().toLowerCase();
  if (q) bills = bills.filter((bill) => [bill.bill_code, bill.invoice_number, bill.client_name, bill.client_code, bill.cycle_start, bill.cycle_end].some((value) => String(value || "").toLowerCase().includes(q)));
  bills.sort((a, b) => String(b.bill_date || "").localeCompare(String(a.bill_date || "")) || Number(b.id) - Number(a.id));
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit || 20)));
  const totalPages = Math.max(1, Math.ceil(bills.length / limit));
  const safePage = Math.min(page, totalPages);
  const summary = { total: bills.length, completed: bills.filter((bill) => auditCode(bill.settlement_status) === "COMPLETED").length, pending: bills.filter((bill) => auditCode(bill.settlement_status) !== "COMPLETED").length, amount: Number(bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0).toFixed(3)), currency: bills.find((bill) => bill.currency)?.currency || "SAR" };
  res.json(ok({ bills: bills.slice((safePage - 1) * limit, safePage * limit), summary, pagination: { page: safePage, limit, total: bills.length, total_pages: totalPages } }));
});
app.get("/api/admin/shipping/carrier-bills/:id", (req, res) => {
  const bill = getRecord("shipping_carrier_bills", req.params.id);
  if (!bill || bill.provider !== "imile") fail("Carrier bill not found", 404);
  const reconciliations = entityRows("shipping_weekly_reconciliations").filter((row) => Number(row.cod_bill_id) === Number(bill.id) || Number(row.fee_bill_id) === Number(bill.id));
  const linkedIds = new Set(reconciliations.flatMap((row) => row.linked_shipment_ids || []).map(Number));
  const shipments = entityRows("shipping_shipments").filter((shipment) => linkedIds.has(Number(shipment.id)) || (shipment.carrier_bill_numbers || []).includes(bill.bill_code) || shipmentFeeRows(shipment).some((fee) => String(fee.bill_code || "") === String(bill.bill_code)));
  const shipmentIds = new Set(shipments.map((shipment) => Number(shipment.id)));
  const reports = entityRows("shipping_reports").filter((report) => (report.bill_numbers || []).includes(bill.bill_code) || (report.items || []).some((item) => shipmentIds.has(Number(item.matched_shipment_id))));
  const findings = entityRows("shipping_audit_findings").filter((finding) => finding.source?.bills?.some((sourceBill) => Number(sourceBill.id) === Number(bill.id)));
  res.json(ok({ bill, reconciliations, shipments, reports, findings, summary: shippingLedgerSummary(shipments) }));
});
app.get("/api/admin/shipping/reports/latest", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const reports = entityRows("shipping_reports").filter((report) => report.source === "oms_fee_report").sort((a, b) => String(b.report_date || "").localeCompare(String(a.report_date || "")));
  res.json(ok({ latest_report: reports[0] || null, reports: reports.slice(0, 24), connector: publicShippingIntegrations().oms_connector }));
});
app.get("/api/admin/shipping/reports/:id", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const report = getRecord("shipping_reports", req.params.id);
  if (!report || report.source !== "oms_fee_report") fail("Shipping report not found", 404);
  const shipments = new Map(entityRows("shipping_shipments").map((shipment) => [Number(shipment.id), shipment]));
  const items = (report.items || []).map((item) => {
    const shipment = shipments.get(Number(item.matched_shipment_id));
    if (!shipment) return { ...item, shipment: null };
    return {
      ...item,
      shipment: {
        id: shipment.id,
        provider: shipment.provider,
        source: shipment.source,
        client_order_no: shipment.client_order_no,
        customer_name: shipment.customer_name,
        customer_phone: shipment.customer_phone,
        destination_city: shipment.destination_city,
        destination_country: shipment.destination_country,
        status_code: shipment.status_code,
        status_label: shipment.status_label,
        status_group: shipment.status_group,
        latest_status_time: shipment.latest_status_time,
        payment_method: shipment.payment_method,
        delivered_at: shipment.delivered_at,
        cod_amount: shipment.cod_amount,
        customer_shipping_charge: shipment.customer_shipping_charge,
        carrier_estimated_cost: shipment.carrier_estimated_cost,
        carrier_actual_cost: shipment.carrier_actual_cost,
        cost_source: shipment.cost_source,
        sync_state: shipment.sync_state,
        metadata: shipment.metadata || {},
        tracking_events: shipment.tracking_events || []
      }
    };
  });
  res.json(ok({ report: { ...report, items } }));
});
app.post("/api/admin/shipping/reports/sync", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    const result = await syncImileOmsReports({
      date_from: req.body?.date_from,
      date_to: req.body?.date_to,
      force: req.body?.force === true,
      trigger: req.body?.trigger
    });
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/shipping/sync-runs", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const limit = Math.min(100, Math.max(5, Number(req.query.limit || 20)));
  const runs = entityRows("shipping_sync_runs").slice(0, limit);
  res.json(ok({ runs, latest: runs[0] || null }));
});
app.get("/api/admin/shipping/weekly-reconciliations", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  let rows = entityRows("shipping_weekly_reconciliations").filter((row) => row.provider === "imile");
  if (req.query.date_from) rows = rows.filter((row) => row.cycle_end >= String(req.query.date_from));
  if (req.query.date_to) rows = rows.filter((row) => row.cycle_start <= String(req.query.date_to));
  if (req.query.status) rows = rows.filter((row) => row.status === String(req.query.status));
  if (req.query.issue === "true") rows = rows.filter((row) => Array.isArray(row.issues) && row.issues.length > 0);
  rows.sort((a, b) => String(b.cycle_end || "").localeCompare(String(a.cycle_end || "")));
  const summary = {
    weeks: rows.length,
    completed_weeks: rows.filter((row) => row.status === "completed").length,
    open_weeks: rows.filter((row) => row.status !== "completed").length,
    issue_weeks: rows.filter((row) => Array.isArray(row.issues) && row.issues.length > 0).length,
    cod_total: Number(rows.reduce((sum, row) => sum + Number(row.cod_amount || 0), 0).toFixed(3)),
    fee_total: Number(rows.reduce((sum, row) => sum + Number(row.fee_amount || 0), 0).toFixed(3)),
    expected_transfer_total: Number(rows.reduce((sum, row) => sum + Number(row.expected_transfer || 0), 0).toFixed(3)),
    latest_bill_date: rows[0]?.bill_date || null,
    latest_fetched_at: rows[0]?.fetched_at || null,
    currency: rows[0]?.currency || "SAR"
  };
  res.json(ok({ reconciliations: rows, summary }));
});
app.get("/api/admin/shipping/weekly-reconciliations/:id", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const reconciliation = getRecord("shipping_weekly_reconciliations", req.params.id);
  if (!reconciliation || reconciliation.provider !== "imile") fail("Weekly reconciliation not found", 404);
  const bills = [reconciliation.cod_bill_id, reconciliation.fee_bill_id].filter(Boolean).map((id) => getRecord("shipping_carrier_bills", id)).filter(Boolean);
  const shipmentsById = new Map(entityRows("shipping_shipments").map((shipment) => [Number(shipment.id), shipment]));
  const shipments = (reconciliation.linked_shipment_ids || []).map((id) => shipmentsById.get(Number(id))).filter(Boolean);
  const findings = entityRows("shipping_audit_findings").filter((finding) => finding.source?.reconciliations?.some((row) => Number(row.id) === Number(reconciliation.id)));
  res.json(ok({ reconciliation, bills, shipments, findings }));
});
app.get("/api/admin/shipping/intelligence", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const evidence = entityRows("legacy_sales_evidence");
  const products = new Map(entityRows("products").map((product) => [Number(product.id), product]));
  const productSales = [...evidence.reduce((map, row) => {
    const id = Number(row.product_id);
    const current = map.get(id) || { product_id: id, product_name_ar: products.get(id)?.name_ar || "", product_name_en: products.get(id)?.name_en || "", matched_shipments: 0, delivered_shipments: 0, minimum_units_sold: 0 };
    current.matched_shipments += 1;
    if (row.delivered) {
      current.delivered_shipments += 1;
      current.minimum_units_sold += Math.max(1, Number(row.minimum_quantity || 1));
    }
    map.set(id, current);
    return map;
  }, new Map()).values()].sort((a, b) => b.minimum_units_sold - a.minimum_units_sold);
  const pricing = inferImileWeightPricing();
  const shipmentRows = entityRows("shipping_shipments");
  const overdueDays = normalizeShippingAuditSettings().settlement.overdue_days;
  const delayed = shipmentRows.filter((shipment) => ["pending", "in_transit", "out_for_delivery", "exception"].includes(shipment.status_group) && Date.now() - new Date(shipment.latest_status_time || shipment.created_at).getTime() > overdueDays * 86400000);
  res.json(ok({
    legacy_sales: { evidence_count: evidence.length, delivered_evidence_count: evidence.filter((row) => row.delivered).length, products: productSales },
    weight_pricing: pricing,
    operations: { total_shipments: shipmentRows.length, delayed_shipments: delayed.length, delayed_after_days: overdueDays, delayed: delayed.slice(0, 100) }
  }));
});
app.get("/api/admin/shipping/overview", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const rows = entityRows("shipping_shipments");
  const statusCounts = rows.reduce((counts, row) => ({ ...counts, [row.status_group || "pending"]: Number(counts[row.status_group || "pending"] || 0) + 1 }), {});
  const latestRuns = entityRows("shipping_sync_runs");
  const integrations = publicShippingIntegrations();
  res.json(ok({
    summary: shippingLedgerSummary(rows),
    status_counts: statusCounts,
    latest_fee_sync: latestRuns.find((run) => run.source === "oms_fee_report" && run.status === "completed") || null,
    latest_tracking_sync: latestRuns.find((run) => run.source === "tracking" && run.status === "completed") || null,
    automation: {
      fee_sync_enabled: integrations.oms_connector.is_enabled === true && integrations.oms_connector.has_password === true && integrations.oms_connector.auto_sync_on_open !== false,
      fee_sync_interval_minutes: integrations.oms_connector.sync_interval_minutes,
      tracking_sync_enabled: integrations.imile.is_enabled === true && integrations.imile.has_secret_key === true && integrations.imile.auto_sync_tracking === true,
      tracking_sync_interval_minutes: integrations.imile.sync_interval_minutes
    }
  }));
});
app.get("/api/admin/shipping/ledger", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const { rows, date_basis } = filterShippingLedger(req.query || {});
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));
  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const allRows = entityRows("shipping_shipments");
  const facets = {
    cities: [...new Set(allRows.map((row) => String(row.destination_city || "")).filter(Boolean))].sort(),
    requested_payments: [...new Set(allRows.map((row) => String(row.payment_method || "")).filter(Boolean))].sort(),
    actual_payments: [...new Set(allRows.map((row) => String(row.metadata?.actual_payment_method || "")).filter(Boolean))].sort(),
    bill_numbers: [...new Set(allRows.flatMap((row) => row.carrier_bill_numbers || []).filter(Boolean))].sort().reverse()
  };
  res.json(ok({ shipments: rows.slice(start, start + limit), summary: shippingLedgerSummary(rows), facets, date_basis, pagination: { page: safePage, limit, total: rows.length, total_pages: totalPages } }));
});
app.get("/api/admin/shipping/ledger/report", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const { rows, date_basis } = filterShippingLedger(req.query || {});
  const items = rows.map(shipmentReportItem);
  const summary = shippingLedgerSummary(rows);
  const bills = [...new Set(rows.flatMap((row) => row.carrier_bill_numbers || []).filter(Boolean))];
  const feeTotals = new Map();
  rows.flatMap(shipmentFeeRows).forEach((fee) => feeTotals.set(fee.name, Number(((feeTotals.get(fee.name) || 0) + Number(fee.amount || 0)).toFixed(3))));
  res.json(ok({ report: {
    id: "live-ledger",
    provider: "imile",
    source: "shipping_ledger",
    report_type: "live_filtered",
    report_date: String(req.query.date_to || dateInRiyadh()),
    fetched_at: new Date().toISOString(),
    range_start: String(req.query.date_from || ""),
    range_end: String(req.query.date_to || ""),
    date_basis,
    filters: { ...(req.query || {}) },
    shipment_count: rows.length,
    matched_count: rows.length,
    unmatched_count: 0,
    cost_rows: rows.filter((row) => row.carrier_actual_cost !== null && row.carrier_actual_cost !== undefined).length,
    missing_cost_count: rows.filter((row) => row.carrier_actual_cost === null || row.carrier_actual_cost === undefined).length,
    actual_cost_total: summary.actual_cost_total,
    collected_total: summary.cod_collected_total,
    customer_shipping_total: summary.customer_shipping_total,
    currency: rows.find((row) => row.currency)?.currency || "SAR",
    bill_numbers: bills,
    fee_totals: [...feeTotals.entries()].map(([name, amount]) => ({ name, amount, currency: "SAR" })),
    summary,
    items
  } }));
});
app.get("/api/admin/shipping/shipments", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  let rows = entityRows("shipping_shipments");
  const query = String(req.query.q || "").trim().toLowerCase();
  if (query) rows = rows.filter((row) => [row.waybill_no, row.external_order_no, row.client_order_no, row.customer_name, row.customer_phone, row.latest_site, row.latest_locus].some((value) => String(value || "").toLowerCase().includes(query)));
  if (req.query.status_group) rows = rows.filter((row) => row.status_group === req.query.status_group);
  if (req.query.cost_state === "missing") rows = rows.filter((row) => row.carrier_actual_cost === null || row.carrier_actual_cost === undefined);
  if (req.query.cost_state === "recorded") rows = rows.filter((row) => row.carrier_actual_cost !== null && row.carrier_actual_cost !== undefined);
  if (req.query.date_from) rows = rows.filter((row) => String(row.latest_status_time || row.created_at || "") >= String(req.query.date_from));
  if (req.query.date_to) rows = rows.filter((row) => String(row.latest_status_time || row.created_at || "") <= `${req.query.date_to}T23:59:59.999Z`);
  rows.sort((a, b) => String(b.latest_status_time || b.created_at || "").localeCompare(String(a.latest_status_time || a.created_at || "")));
  const summary = shippingShipmentSummary(rows);
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit || 25)));
  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  res.json(ok({ shipments: rows.slice(start, start + limit), summary, pagination: { page: safePage, limit, total: rows.length, total_pages: totalPages } }));
});
app.patch("/api/admin/shipping/shipments/:id", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const existing = getRecord("shipping_shipments", req.params.id);
  if (!existing) fail("Shipment not found", 404);
  const patch = { ...(req.body || {}) };
  if (Object.prototype.hasOwnProperty.call(patch, "carrier_actual_cost")) {
    patch.carrier_actual_cost = patch.carrier_actual_cost === "" || patch.carrier_actual_cost === null ? null : Math.max(0, Number(patch.carrier_actual_cost || 0));
    patch.cost_source = patch.carrier_actual_cost === null ? null : (patch.cost_source || "manual_statement");
    patch.cost_recorded_at = patch.carrier_actual_cost === null ? null : new Date().toISOString();
  }
  res.json(ok({ shipment: updateRecord("shipping_shipments", req.params.id, patch) }));
});
app.post("/api/admin/shipping/shipments/import", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const rows = Array.isArray(req.body?.shipments) ? req.body.shipments.slice(0, 5000) : [];
  let imported = 0;
  rows.forEach((row) => {
    if (!row?.waybill_no) return;
    upsertShippingShipment({ ...row, provider: "imile", source: row.source || "oms_history", imported_at: new Date().toISOString() });
    imported += 1;
  });
  res.json(ok({ imported, summary: shippingShipmentSummary() }));
});
app.post("/api/admin/shipping/shipments/sync", async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
    res.json(ok(await syncImileTracking({ shipment_ids: req.body?.shipment_ids, force_all: req.body?.force_all === true, trigger: "manual" })));
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/shipping/settlements", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  let rows = entityRows("shipping_settlements");
  if (req.query.year) rows = rows.filter((row) => String(row.period_start || "").startsWith(String(req.query.year)));
  if (req.query.status) rows = rows.filter((row) => row.status === req.query.status);
  rows.sort((a, b) => {
    const sourceOrder = Number(b.source === "imile_oms_fee_report") - Number(a.source === "imile_oms_fee_report");
    if (sourceOrder) return sourceOrder;
    return String(b.source_data_date || b.period_end || b.generated_at || "").localeCompare(String(a.source_data_date || a.period_end || a.generated_at || ""));
  });
  res.json(ok({ settlements: rows }));
});
app.get("/api/admin/shipping/settlements/:id/report", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const settlement = getRecord("shipping_settlements", req.params.id);
  if (!settlement) fail("Settlement not found", 404);
  const liveById = new Map(entityRows("shipping_shipments").map((row) => [Number(row.id), row]));
  const snapshot = Array.isArray(settlement.shipment_snapshot) && settlement.shipment_snapshot.length
    ? settlement.shipment_snapshot
    : (settlement.shipment_ids || []).map((id) => liveById.get(Number(id))).filter(Boolean);
  const items = snapshot.map(shipmentReportItem);
  const bills = [...new Set(snapshot.flatMap((row) => row.carrier_bill_numbers || []).filter(Boolean))];
  const feeTotals = new Map();
  snapshot.flatMap(shipmentFeeRows).forEach((fee) => feeTotals.set(fee.name, Number(((feeTotals.get(fee.name) || 0) + Number(fee.amount || 0)).toFixed(3))));
  const summary = shippingLedgerSummary(snapshot);
  res.json(ok({ report: {
    id: `settlement-${settlement.id}`,
    settlement_id: settlement.id,
    provider: settlement.provider || "imile",
    source: "local_settlement_snapshot",
    report_type: settlement.period_type || "custom",
    report_date: settlement.period_end,
    fetched_at: settlement.generated_at || settlement.created_at,
    range_start: settlement.period_start,
    range_end: settlement.period_end,
    date_basis: settlement.date_basis || settlement.filter_snapshot?.date_basis || "delivered",
    filters: settlement.filter_snapshot || {},
    shipment_count: snapshot.length,
    matched_count: snapshot.length,
    unmatched_count: 0,
    cost_rows: snapshot.filter((row) => row.carrier_actual_cost !== null && row.carrier_actual_cost !== undefined).length,
    missing_cost_count: snapshot.filter((row) => row.carrier_actual_cost === null || row.carrier_actual_cost === undefined).length,
    actual_cost_total: summary.actual_cost_total,
    collected_total: summary.cod_collected_total,
    customer_shipping_total: summary.customer_shipping_total,
    currency: settlement.currency || "SAR",
    bill_numbers: bills,
    fee_totals: [...feeTotals.entries()].map(([name, amount]) => ({ name, amount, currency: settlement.currency || "SAR" })),
    summary,
    items
  }, settlement }));
});
app.post("/api/admin/shipping/settlements/generate", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const periodStart = String(req.body?.period_start || "");
  const periodEnd = String(req.body?.period_end || "");
  if (!periodStart || !periodEnd) fail("Settlement period is required");
  const filterSnapshot = { ...(req.body?.filters || {}), date_from: periodStart, date_to: periodEnd, date_basis: req.body?.date_basis || req.body?.filters?.date_basis || "delivered" };
  const { rows: shipments, date_basis: dateBasis } = filterShippingLedger(filterSnapshot);
  const summary = shippingLedgerSummary(shipments);
  const settlement = createRecord("shipping_settlements", {
    provider: "imile",
    period_type: req.body?.period_type === "week" ? "week" : req.body?.period_type === "custom" ? "custom" : "month",
    period_start: periodStart,
    period_end: periodEnd,
    status: "draft",
    shipment_ids: shipments.map((row) => row.id),
    shipment_snapshot: shipments,
    filter_snapshot: filterSnapshot,
    date_basis: dateBasis,
    currency: shipments.find((row) => row.currency)?.currency || "SAR",
    ...summary,
    estimated_margin: Number((summary.customer_shipping_total - summary.estimated_cost_total).toFixed(2)),
    actual_margin: Number((summary.customer_shipping_total - summary.actual_cost_total).toFixed(2)),
    notes: String(req.body?.notes || ""),
    generated_at: new Date().toISOString()
  });
  res.json(ok({ settlement }));
});
app.patch("/api/admin/shipping/settlements/:id", (req, res) => {
  if (!req.user || req.user.role !== "admin") fail("Unauthorized", 401);
  const existing = getRecord("shipping_settlements", req.params.id);
  if (!existing) fail("Settlement not found", 404);
  const status = ["draft", "reviewed", "closed"].includes(req.body?.status) ? req.body.status : existing.status;
  res.json(ok({ settlement: updateRecord("shipping_settlements", req.params.id, { status, notes: req.body?.notes ?? existing.notes, closed_at: status === "closed" ? new Date().toISOString() : existing.closed_at || null }) }));
});
app.get("/api/admin/shipping/audit/settings", (_req, res) => res.json(ok({ settings: normalizeShippingAuditSettings() })));
app.put("/api/admin/shipping/audit/settings", (req, res) => {
  const current = normalizeShippingAuditSettings();
  const settings = normalizeShippingAuditSettings({ ...(req.body || {}), version: current.version + 1, updated_at: new Date().toISOString() });
  setSetting("shippingAuditSettings", settings);
  createRecord("shipping_audit_rule_versions", { version: settings.version, settings, changed_by: req.user?.email || "admin", changed_at: settings.updated_at });
  res.json(ok({ settings }));
});
app.post("/api/admin/shipping/audit/run", (req, res) => res.json(ok({ run: runShippingAudit({ trigger: req.body?.trigger || "manual" }), summary: shippingAuditSummary() })));
app.get("/api/admin/shipping/audit/overview", (_req, res) => {
  const findings = entityRows("shipping_audit_findings");
  const runs = entityRows("shipping_audit_runs");
  const disputes = entityRows("shipping_dispute_cases");
  const active = findings.filter((row) => !["resolved", "ignored", "resolved_automatically"].includes(row.status));
  const byRule = [...active.reduce((map, row) => {
    const current = map.get(row.rule_code) || { rule_code: row.rule_code, count: 0, exposure_amount: 0 };
    current.count += 1;
    current.exposure_amount = Number((current.exposure_amount + Number(row.exposure_amount || 0)).toFixed(3));
    map.set(row.rule_code, current);
    return map;
  }, new Map()).values()].sort((a, b) => b.exposure_amount - a.exposure_amount || b.count - a.count);
  res.json(ok({ summary: shippingAuditSummary(findings), latest_run: runs[0] || null, by_rule: byRule, recent_findings: active.slice(0, 8), disputes: { open: disputes.filter((row) => !["accepted", "rejected", "closed"].includes(row.status)).length, total: disputes.length } }));
});
app.get("/api/admin/shipping/audit/findings", (req, res) => {
  let rows = entityRows("shipping_audit_findings");
  const q = String(req.query.q || "").trim().toLowerCase();
  if (q) rows = rows.filter((row) => [row.waybill_no, row.client_order_no, row.rule_code, row.title_en, row.title_ar, row.reason_en, row.reason_ar, row.notes, ...(row.source?.bill_codes || []), ...(row.source?.reports || []).map((report) => report.report_date)].some((value) => String(value || "").toLowerCase().includes(q)));
  if (req.query.status === "active") rows = rows.filter((row) => !["resolved", "ignored", "resolved_automatically"].includes(row.status));
  else if (req.query.status) rows = rows.filter((row) => row.status === req.query.status);
  if (req.query.severity) rows = rows.filter((row) => row.severity === req.query.severity);
  if (req.query.rule_code) rows = rows.filter((row) => row.rule_code === req.query.rule_code);
  if (req.query.settlement_state) rows = rows.filter((row) => row.settlement_state === req.query.settlement_state);
  if (req.query.date_from) rows = rows.filter((row) => String(row.last_detected_at || row.detected_at || "").slice(0, 10) >= String(req.query.date_from));
  if (req.query.date_to) rows = rows.filter((row) => String(row.last_detected_at || row.detected_at || "").slice(0, 10) <= String(req.query.date_to));
  rows.sort((a, b) => Number(b.exposure_amount || 0) - Number(a.exposure_amount || 0) || Number(b.id) - Number(a.id));
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));
  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const safePage = Math.min(page, totalPages);
  const facetsSource = entityRows("shipping_audit_findings");
  res.json(ok({ findings: rows.slice((safePage - 1) * limit, safePage * limit), summary: shippingAuditSummary(rows), facets: { rules: [...new Set(facetsSource.map((row) => row.rule_code))].sort(), statuses: [...new Set(facetsSource.map((row) => row.status))].sort() }, pagination: { page: safePage, limit, total: rows.length, total_pages: totalPages } }));
});
app.get("/api/admin/shipping/audit/findings/:id", (req, res) => {
  const finding = getRecord("shipping_audit_findings", req.params.id);
  if (!finding) fail("Audit finding not found", 404);
  const shipment = getRecord("shipping_shipments", finding.shipment_id);
  const order = finding.store_order_id ? getRecord("orders", finding.store_order_id) : null;
  const disputes = entityRows("shipping_dispute_cases").filter((row) => Number(row.finding_id) === Number(finding.id));
  res.json(ok({
    finding,
    shipment,
    order,
    disputes,
    order_contents: shippingAuditOrderContents(order),
    unified_timeline: shippingAuditUnifiedTimeline(shipment || {}, finding),
    timeline_evidence: {
      tracking_event_count: Array.isArray(shipment?.tracking_events) ? shipment.tracking_events.length : 0,
      has_latest_status: Boolean(shipment?.latest_status_time),
      report_count: finding.source?.reports?.length || 0,
      bill_count: finding.source?.bills?.length || 0,
      reconciliation_count: finding.source?.reconciliations?.length || 0
    }
  }));
});
app.patch("/api/admin/shipping/audit/findings/:id", (req, res) => {
  const finding = getRecord("shipping_audit_findings", req.params.id);
  if (!finding) fail("Audit finding not found", 404);
  if (finding.finding_kind === "informational" || finding.severity === "info") {
    return res.json(ok({ finding: updateRecord("shipping_audit_findings", finding.id, { status: "notice", notes: req.body?.notes ?? finding.notes }) }));
  }
  const allowed = new Set(["open", "reviewing", "disputed", "resolved", "ignored"]);
  const status = allowed.has(req.body?.status) ? req.body.status : finding.status;
  const updated = updateRecord("shipping_audit_findings", finding.id, { status, notes: req.body?.notes ?? finding.notes, reviewed_by: req.user?.email || "admin", reviewed_at: new Date().toISOString(), resolved_at: status === "resolved" ? new Date().toISOString() : finding.resolved_at || null });
  res.json(ok({ finding: updated }));
});
app.post("/api/admin/shipping/audit/findings/:id/dispute", (req, res) => {
  const finding = getRecord("shipping_audit_findings", req.params.id);
  if (!finding) fail("Audit finding not found", 404);
  if (finding.finding_kind === "informational" || finding.severity === "info") fail("Informational notices cannot create disputes", 400);
  const dispute = createRecord("shipping_dispute_cases", { finding_id: finding.id, shipment_id: finding.shipment_id, provider: finding.provider, waybill_no: finding.waybill_no, status: "draft", amount: Number(req.body?.amount ?? finding.exposure_amount ?? 0), currency: finding.currency || "SAR", subject: String(req.body?.subject || finding.title_en || finding.rule_code), message: String(req.body?.message || finding.reason_en || ""), evidence: finding.evidence, created_by: req.user?.email || "admin", submitted_at: null });
  updateRecord("shipping_audit_findings", finding.id, { status: "disputed", dispute_id: dispute.id, reviewed_at: new Date().toISOString(), reviewed_by: req.user?.email || "admin" });
  res.json(ok({ dispute }));
});
app.get("/api/admin/shipping/audit/disputes", (req, res) => {
  let disputes = entityRows("shipping_dispute_cases");
  if (req.query.status) disputes = disputes.filter((row) => row.status === req.query.status);
  res.json(ok({ disputes }));
});
app.patch("/api/admin/shipping/audit/disputes/:id", (req, res) => {
  const dispute = getRecord("shipping_dispute_cases", req.params.id);
  if (!dispute) fail("Dispute not found", 404);
  const allowed = new Set(["draft", "submitted", "carrier_review", "accepted", "rejected", "closed"]);
  const status = allowed.has(req.body?.status) ? req.body.status : dispute.status;
  const updated = updateRecord("shipping_dispute_cases", dispute.id, { status, response: req.body?.response ?? dispute.response, notes: req.body?.notes ?? dispute.notes, submitted_at: status === "submitted" && !dispute.submitted_at ? new Date().toISOString() : dispute.submitted_at, updated_by: req.user?.email || "admin" });
  if (["accepted", "closed"].includes(status)) updateRecord("shipping_audit_findings", dispute.finding_id, { status: "resolved", resolved_at: new Date().toISOString(), resolution_reason: `dispute_${status}` });
  res.json(ok({ dispute: updated }));
});
app.get("/api/admin/promotion-policy", (_req, res) => res.json(ok(normalizePromotionPolicy())));
app.put("/api/admin/promotion-policy", (req, res) => {
  const policy = normalizePromotionPolicy({ ...normalizePromotionPolicy(), ...(req.body || {}), updated_at: new Date().toISOString() });
  res.json(ok(setSetting("promotionPolicy", policy)));
});
app.get("/api/admin/promotion-redemptions", (_req, res) => {
  expirePromotionReservations();
  const rows = db.prepare("SELECT id, discount_id, discount_code, user_id, order_id, status, reserved_until, rejection_reason, created_at, updated_at, CASE WHEN guest_hash IS NOT NULL THEN 1 ELSE 0 END AS has_guest, CASE WHEN email_hash IS NOT NULL THEN 1 ELSE 0 END AS has_email, CASE WHEN phone_hash IS NOT NULL THEN 1 ELSE 0 END AS has_phone, CASE WHEN payment_hash IS NOT NULL THEN 1 ELSE 0 END AS has_payment FROM promo_redemptions ORDER BY id DESC LIMIT 250").all();
  res.json(ok({ redemptions: rows }));
});
app.post("/api/admin/promotions/simulate", (req, res) => res.json(ok(evaluatePromotions({ ...(req.body || {}), identity: {}, reserve: false }))));
app.get("/api/admin/brand-identity", (_req, res) => res.json(ok(normalizeBrandIdentity())));
app.put("/api/admin/brand-identity", (req, res) => {
  const next = normalizeBrandIdentity({ ...req.body, updated_at: new Date().toISOString() });
  setSetting("brandIdentity", next);
  createRecord("brand_identity_history", { ...next, action: "save" });
  res.json(ok(next));
});
app.get("/api/admin/currencies", (_req, res) => res.json(ok(normalizeCurrencies())));
app.put("/api/admin/currencies", (req, res) => {
  const next = normalizeCurrencies({ ...req.body, updated_at: new Date().toISOString() });
  setSetting("currencies", next);
  createRecord("currency_settings_history", { base_currency: next.base_currency, display_mode: next.display_mode, currencies: next.currencies, action: "save" });
  res.json(ok(next));
});
app.get("/api/admin/market", (_req, res) => res.json(ok({
  settings: normalizeMarketSettings(),
  countries: normalizeCountries(),
  currencies: normalizeCurrencies(),
  goods_types: normalizeGoodsTypes(),
  shipping_profiles: normalizeShippingProfiles()
})));
app.put("/api/admin/market", (req, res) => {
  const countries = normalizeCountries({ countries: req.body?.countries });
  setSetting("countries", countries);
  const settings = normalizeMarketSettings({ ...(req.body?.settings || req.body || {}), updated_at: new Date().toISOString() });
  setSetting("marketSettings", settings);
  const currencies = normalizeCurrencies();
  const selectedCountry = countries.find((country) => country.code === settings.default_country_code);
  if (req.body?.sync_currency !== false && selectedCountry?.currency_code && currencies.currencies.some((currency) => currency.code === selectedCountry.currency_code)) {
    currencies.base_currency = selectedCountry.currency_code;
    currencies.currencies.forEach((currency) => { if (currency.code === currencies.base_currency) currency.is_active = true; });
    currencies.updated_at = settings.updated_at;
    setSetting("currencies", currencies);
  }
  createRecord("market_settings_history", { ...settings, action: "save" });
  res.json(ok({ settings, countries, currencies }));
});
app.get("/api/admin/goods-types", (_req, res) => res.json(ok({ goods_types: normalizeGoodsTypes() })));
app.put("/api/admin/goods-types", (req, res) => {
  const goodsTypes = normalizeGoodsTypes({ goods_types: req.body?.goods_types });
  setSetting("goodsTypes", goodsTypes);
  const settings = normalizeMarketSettings({ ...(getSetting("marketSettings") || {}), default_goods_type_id: goodsTypes.find((row) => row.is_default)?.id, updated_at: new Date().toISOString() });
  setSetting("marketSettings", settings);
  createRecord("goods_type_settings_history", { goods_types: goodsTypes, action: "save" });
  res.json(ok({ goods_types: goodsTypes, settings }));
});
app.get("/api/admin/shipping-profiles", (_req, res) => res.json(ok({ shipping_profiles: normalizeShippingProfiles(), goods_types: normalizeGoodsTypes(), countries: normalizeCountries() })));
app.put("/api/admin/shipping-profiles", (req, res) => {
  const profiles = normalizeShippingProfiles({ shipping_profiles: req.body?.shipping_profiles });
  setSetting("shippingProfiles", profiles);
  const settings = normalizeMarketSettings({ ...(getSetting("marketSettings") || {}), default_shipping_profile_id: profiles.find((row) => row.is_default)?.id, updated_at: new Date().toISOString() });
  setSetting("marketSettings", settings);
  createRecord("shipping_profile_settings_history", { shipping_profiles: profiles, action: "save" });
  res.json(ok({ shipping_profiles: profiles, settings }));
});
app.get("/api/admin/storefront-layout", (_req, res) => res.json(ok(normalizeStorefrontLayout())));
app.put("/api/admin/storefront-layout", (req, res) => {
  const next = normalizeStorefrontLayout({ ...req.body, updated_at: new Date().toISOString() });
  setSetting("storefrontLayout", next);
  res.json(ok(next));
});
app.get("/api/admin/home-builder", (_req, res) => res.json(ok(normalizeHomeBuilder())));
app.put("/api/admin/home-builder", (req, res) => {
  const next = normalizeHomeBuilder({ ...req.body, updated_at: new Date().toISOString() });
  setSetting("homeBuilder", next);
  res.json(ok(next));
});
app.get("/api/admin/robots", (_req, res) => {
  res.json(ok({
    ...getRobotsTxt(),
    history: entityRows("robots_history").slice(0, 25)
  }));
});
app.put("/api/admin/robots", (req, res) => {
  const content = String(req.body?.content ?? "").trim();
  if (!content) fail("Robots content is required");
  const now = new Date().toISOString();
  const robots = setSetting("robotsTxt", { content, updated_at: now });
  createRecord("robots_history", { content, edited_at: now });
  res.json(ok({
    ...robots,
    history: entityRows("robots_history").slice(0, 25)
  }));
});
app.get("/api/admin/ai/setup", (_req, res) => {
  res.json(ok(publicAiSetup()));
});
app.put("/api/admin/ai/setup", (req, res) => {
  const current = normalizeAiSetup(getSetting("aiSetup"));
  const incomingOpenai = req.body?.providers?.openai || {};
  const currentOpenai = current.providers.openai;
  const apiKeyInput = String(incomingOpenai.api_key || "").trim();
  const keepExistingKey = !apiKeyInput || apiKeyInput.includes("...");
  const next = {
    ...current,
    providers: {
      openai: {
        ...currentOpenai,
        enabled: Boolean(incomingOpenai.enabled),
        api_key: keepExistingKey ? currentOpenai.api_key : apiKeyInput,
        organization: String(incomingOpenai.organization || "").trim(),
        project: String(incomingOpenai.project || "").trim(),
        default_text_model: incomingOpenai.default_text_model || currentOpenai.default_text_model,
        default_image_model: incomingOpenai.default_image_model || currentOpenai.default_image_model,
        default_video_model: incomingOpenai.default_video_model || currentOpenai.default_video_model
      }
    },
    models: Array.isArray(req.body?.models) ? req.body.models.map((model) => ({
      id: String(model.id || "").trim(),
      module: model.module || inferAiModule(model.id),
      input_per_1m: Number(model.input_per_1m || 0),
      cached_input_per_1m: Number(model.cached_input_per_1m || 0),
      output_per_1m: Number(model.output_per_1m || 0),
      currency: model.currency || "USD",
      unit_note: model.unit_note || "",
      is_enabled: Boolean(model.is_enabled),
      source: model.source || "manual",
      owned_by: model.owned_by || "",
      synced_at: model.synced_at || null
    })).filter((model) => model.id) : current.models,
    updated_at: new Date().toISOString()
  };
  setSetting("aiSetup", next);
  createRecord("ai_setup_history", { action: "save", updated_at: next.updated_at });
  res.json(ok(publicAiSetup(next)));
});
app.post("/api/admin/ai/setup/openai/sync", async (_req, res, next) => {
  try {
    const setup = normalizeAiSetup(getSetting("aiSetup"));
    const openai = setup.providers.openai;
    if (!openai.api_key) fail("OpenAI API key is required");
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${openai.api_key}`,
        ...(openai.organization ? { "OpenAI-Organization": openai.organization } : {}),
        ...(openai.project ? { "OpenAI-Project": openai.project } : {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) fail(data?.error?.message || "Unable to sync OpenAI models", response.status);
    const syncedAt = new Date().toISOString();
    const models = mergeAiModels(setup.models, Array.isArray(data.data) ? data.data : []);
    const next = {
      ...setup,
      providers: {
        openai: {
          ...openai,
          enabled: true,
          synced_at: syncedAt
        }
      },
      models,
      updated_at: syncedAt
    };
    setSetting("aiSetup", next);
    createRecord("ai_setup_history", { action: "sync_openai_models", model_count: models.length, updated_at: syncedAt });
    res.json(ok(publicAiSetup(next)));
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/ai/pricing", (_req, res) => {
  res.json(ok({ pricing: getAiPricing() }));
});
app.put("/api/admin/ai/pricing", (req, res) => {
  const pricing = Array.isArray(req.body?.pricing) ? req.body.pricing.map((row) => ({
    provider: row.provider || "openai",
    pricing_key: row.pricing_key || `${row.model}|${row.tier || ""}|${row.modality || row.context || ""}`,
    model: String(row.model || "").trim(),
    module: row.module || pricingModule(row),
    section: row.section || "",
    tier: row.tier || "",
    modality: row.modality || "",
    context: row.context || "",
    billing_unit: row.billing_unit || "1M tokens",
    currency: row.currency || "USD",
    input_per_1m: Number(row.input_per_1m || 0),
    cached_input_per_1m: Number(row.cached_input_per_1m || 0),
    cache_write_per_1m: Number(row.cache_write_per_1m || 0),
    output_per_1m: Number(row.output_per_1m || 0),
    price_per_second: Number(row.price_per_second || 0),
    price_per_minute: Number(row.price_per_minute || 0),
    unit_note: row.unit_note || "",
    source_url: row.source_url || "https://developers.openai.com/api/docs/pricing",
    fetched_at: row.fetched_at || null,
    is_enabled: Boolean(row.is_enabled)
  })).filter((row) => row.model) : [];
  setSetting("aiPricing", pricing);
  createRecord("ai_pricing_history", { action: "save", row_count: pricing.length, updated_at: new Date().toISOString() });
  res.json(ok({ pricing }));
});
app.post("/api/admin/ai/pricing/refresh-openai", async (_req, res, next) => {
  try {
    const official = await fetchOfficialOpenAiPricing();
    const current = getAiPricing();
    const currentByKey = new Map(current.map((row) => [row.pricing_key, row]));
    const merged = official.map((row) => ({
      ...row,
      is_enabled: currentByKey.has(row.pricing_key) ? Boolean(currentByKey.get(row.pricing_key).is_enabled) : true
    }));
    setSetting("aiPricing", merged);
    createRecord("ai_pricing_history", { action: "refresh_openai_docs", row_count: merged.length, updated_at: new Date().toISOString() });
    res.json(ok({ pricing: merged, source_url: "https://developers.openai.com/api/docs/pricing", row_count: merged.length }));
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/ai/usage", (_req, res) => {
  res.json(ok(aiUsageSummary()));
});
app.get("/api/admin/ai/products/context", (_req, res) => {
  res.json(ok(catalogContext()));
});
app.post("/api/admin/ai/products/analyze", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) fail("Product image is required");
    const imageUrl = `/uploads/${req.file.filename}`;
    const setup = normalizeAiSetup(getSetting("aiSetup"));
    const openai = setup.providers.openai;
    const model = req.body?.model || openai.default_text_model || "gpt-5.6-mini";
    const catalog = catalogContext();

    if (!openai.enabled || !openai.api_key) {
      const result = fallbackProductAnalysis(imageUrl);
      logAiUsage({
        action: "product_image_analysis",
        provider: "openai",
        model,
        module: "text",
        status: "skipped",
        reason: "OpenAI is not enabled or API key is missing",
        image_url: imageUrl,
        estimated_cost: 0,
        currency: "USD",
        result
      });
      const draft = saveAiProductDraft({ context: req.body?.context || "product-new", product_id: req.body?.product_id || null, result });
      return res.json(ok({ result, draft, usage: { estimated_cost: 0, currency: "USD" } }));
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const mimeType = req.file.mimetype || "image/jpeg";
    const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
    const prompt = `Analyze this ecommerce product image for an Amazon EG style accessories store.
Return only valid JSON with this exact shape:
{
  "product": {
    "name_en": "",
    "name_ar": "",
    "short_description_en": "",
    "short_description_ar": "",
    "description_en": "",
    "description_ar": "",
    "category_id": null,
    "category_name_en": "",
    "category_name_ar": "",
    "brand_id": null,
    "brand_name_en": "",
    "brand_name_ar": "",
    "colors": [{"id": null, "name_en": "", "name_ar": "", "hex": ""}],
    "options": [{"id": null, "name_en": "", "name_ar": "", "value_en": "", "value_ar": ""}]
  },
  "suggestions": {
    "create_categories": [{"name_en": "", "name_ar": "", "slug": ""}],
    "create_brands": [{"name_en": "", "name_ar": "", "slug": ""}],
    "create_colors": [{"name_en": "", "name_ar": "", "hex": ""}],
    "create_options": [{"name_en": "", "name_ar": ""}]
  },
  "generated_image_slots": [
    {"type": "front", "status": "inactive", "prompt": ""},
    {"type": "side", "status": "inactive", "prompt": ""},
    {"type": "detail", "status": "inactive", "prompt": ""},
    {"type": "lifestyle", "status": "inactive", "prompt": ""}
  ]
}
Use IDs only from this catalog when there is a confident match. If no brand is visible, use the Others brand if available. If a category/color/option is missing, add it to suggestions instead of inventing an id.
Available catalog JSON: ${JSON.stringify(catalog)}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openai.api_key}`,
        "Content-Type": "application/json",
        ...(openai.organization ? { "OpenAI-Organization": openai.organization } : {}),
        ...(openai.project ? { "OpenAI-Project": openai.project } : {})
      },
      body: JSON.stringify({
        model,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: imageDataUrl, detail: "high" }
          ]
        }]
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logAiUsage({
        action: "product_image_analysis",
        provider: "openai",
        model,
        module: "text",
        status: "failed",
        reason: data?.error?.message || "OpenAI product analysis failed",
        image_url: imageUrl,
        estimated_cost: 0,
        currency: "USD"
      });
      fail(data?.error?.message || "OpenAI product analysis failed", response.status);
    }
    const outputText = data.output_text
      || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("\n")
      || "";
    const parsed = extractJsonObject(outputText) || fallbackProductAnalysis(imageUrl);
    const result = { ...parsed, image_url: imageUrl, source: "openai" };
    const usage = aiCostFromUsage(model, "text", data.usage || {});
    logAiUsage({
      action: "product_image_analysis",
      provider: "openai",
      status: "completed",
      image_url: imageUrl,
      ...usage,
      result
    });
    const draft = saveAiProductDraft({ context: req.body?.context || "product-new", product_id: req.body?.product_id || null, result });
    res.json(ok({ result, draft, usage }));
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/ai/products/drafts/latest", (req, res) => {
  res.json(ok({ draft: latestAiProductDraft(req.query.context || "product-new") }));
});
app.post("/api/admin/ai/products/drafts", (req, res) => {
  res.json(ok({ draft: saveAiProductDraft(req.body || {}) }));
});
app.post("/api/admin/ai/products/suggestions", (req, res) => {
  res.json(ok(createCatalogSuggestion(req.body?.type, req.body?.payload || {})));
});
app.post("/api/admin/ai/products/generate-image", async (req, res, next) => {
  try {
    const setup = normalizeAiSetup(getSetting("aiSetup"));
    const openai = setup.providers.openai;
    if (!openai.enabled || !openai.api_key) fail("OpenAI image generation is not enabled");
    const imageUrl = String(req.body?.image_url || "").trim();
    const sourcePath = localPublicImagePath(imageUrl);
    if (!sourcePath) fail("Source image was not found", 404);
    const model = req.body?.model || openai.default_image_model || "gpt-image-2";
    const prompt = String(req.body?.prompt || "Generate a clean ecommerce product image matching the uploaded product.").trim();
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    form.append("size", req.body?.size || "1024x1024");
    form.append("image", new Blob([fs.readFileSync(sourcePath)], { type: "image/png" }), path.basename(sourcePath));
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openai.api_key}` },
      body: form
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logAiUsage({ action: "product_image_generation", provider: "openai", model, module: "image", status: "failed", reason: data?.error?.message, image_url: imageUrl, estimated_cost: 0, currency: "USD" });
      fail(data?.error?.message || "Image generation failed", response.status);
    }
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) fail("Image generation did not return an image");
    const filename = `ai-product-${Date.now()}-${crypto.randomInt(100000, 999999)}.png`;
    const outputPath = path.join(__dirname, "public", "uploads", filename);
    fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
    const url = `/uploads/${filename}`;
    const pricing = aiPriceForModel(model, "image");
    const estimatedCost = Number((Number(pricing.output_per_1m || 0) / 1000).toFixed(8));
    logAiUsage({ action: "product_image_generation", provider: "openai", model, module: "image", status: "completed", image_url: imageUrl, generated_url: url, estimated_cost: estimatedCost, currency: pricing.currency || "USD", prompt });
    res.json(ok({ url, estimated_cost: estimatedCost, currency: pricing.currency || "USD" }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/ai/seo/analyze", async (req, res, next) => {
  try {
    const product = findProduct(req.body?.productId);
    if (!product) fail("Product was not found", 404);
    const setup = normalizeAiSetup(getSetting("aiSetup"));
    const openai = setup.providers.openai;
    const model = req.body?.model || openai.default_text_model || "gpt-4.1-mini";
    if (!openai.enabled || !openai.api_key) fail("OpenAI is not enabled");
    const prompt = `Analyze this ecommerce product for SEO in Arabic and English. Return only JSON:
{"score":0,"issues":[],"recommendations":[],"improved":{"name_en":"","name_ar":"","slug":"","short_description_en":"","short_description_ar":"","description_en":"","description_ar":"","meta_title_en":"","meta_title_ar":"","meta_description_en":"","meta_description_ar":""}}
Product JSON: ${JSON.stringify(productSeoPayload(product))}`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${openai.api_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: prompt })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) fail(data?.error?.message || "SEO analysis failed", response.status);
    const outputText = data.output_text || data.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("\n") || "";
    const result = extractJsonObject(outputText) || { score: 0, issues: ["Unable to parse AI result"], recommendations: [], improved: {} };
    const usage = aiCostFromUsage(model, "text", data.usage || {});
    logAiUsage({ action: "product_seo_analysis", provider: "openai", status: "completed", product_id: product.id, ...usage, result });
    res.json(ok({ result, usage, product }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/admin/ai/seo/apply", (req, res) => {
  const product = getRecord("products", req.body?.productId);
  if (!product) fail("Product was not found", 404);
  const improved = req.body?.improved || {};
  const allowed = ["name_en", "name_ar", "slug", "short_description_en", "short_description_ar", "description_en", "description_ar", "meta_title_en", "meta_title_ar", "meta_description_en", "meta_description_ar"];
  const payload = {};
  for (const key of allowed) if (improved[key]) payload[key] = improved[key];
  const updated = updateRecord("products", product.id, payload);
  res.json(ok({ product: updated }));
});

app.get("/api/admin/image-gallery", (req, res) => {
  const images = listGalleryImages({ onlyUnused: req.query.filter === "unused" });
  res.json(ok({ images, pagination: { total: images.length, page: 1, totalPages: 1 } }));
});
app.post("/api/admin/image-gallery/upload", upload.array("files", 40), (req, res) => {
  const uploaded = (req.files || []).map((file) => {
    const url = `/uploads/${file.filename}`;
    createRecord("image_gallery_uploads", {
      url,
      filename: file.originalname || file.filename,
      mimetype: file.mimetype,
      size: file.size,
      uploaded_at: new Date().toISOString()
    });
    return { url, fileUrl: url, path: url };
  });
  res.json(ok({ images: uploaded, count: uploaded.length }));
});
app.get("/api/admin/image-gallery/trash", (_req, res) => res.json(ok({ images: entityRows("image_gallery_deleted", true) })));
app.post("/api/admin/image-gallery/sync", (_req, res) => {
  const images = listGalleryImages();
  createRecord("image_gallery_sync", { synced_at: new Date().toISOString(), image_count: images.length });
  res.json(ok({ message: "Synced", images, count: images.length }));
});
app.post("/api/admin/image-gallery/trash/restore", (_req, res) => res.json(ok({ message: "Restore is not available after physical deletion" })));
app.post("/api/admin/image-gallery/:id/replace", upload.single("file"), (req, res) => {
  const image = galleryImageById(req.params.id);
  if (!image) fail("Image not found", 404);
  if (!req.file) fail("Replacement file is required");
  const oldPath = path.join(__dirname, "public", image.url);
  const newPath = path.join(__dirname, "public", "uploads", req.file.filename);
  fs.copyFileSync(newPath, oldPath);
  fs.unlinkSync(newPath);
  res.json(ok({ url: image.url, image: galleryImageById(req.params.id) }));
});
app.delete("/api/admin/image-gallery/unused", (_req, res) => {
  const unused = listGalleryImages({ onlyUnused: true });
  const deleted = [];
  for (const image of unused) {
    try {
      deleted.push(deleteGalleryImage(image.id));
    } catch {
      // Ignore images that became linked while deleting.
    }
  }
  res.json(ok({ message: "Unused images deleted", count: deleted.length, images: deleted }));
});
app.delete("/api/admin/image-gallery/trash/empty", (_req, res) => res.json(ok({ message: "Trash emptied" })));
app.delete("/api/admin/image-gallery/:id", (req, res) => {
  const image = deleteGalleryImage(req.params.id);
  res.json(ok({ message: "Deleted", image }));
});

app.get("/api/locations/governorates", (_req, res) => res.json(ok({ governorates: [], data: [] })));
app.post("/api/locations/governorates", (req, res) => res.json(ok(createRecord("governorates", req.body || {}))));
app.put("/api/locations/governorates/:id", (req, res) => res.json(ok(updateRecord("governorates", req.params.id, req.body || {}))));
app.delete("/api/locations/governorates/:id", (req, res) => {
  softDelete("governorates", req.params.id);
  res.json(ok({ message: "Deleted" }));
});
app.get("/api/locations/areas", (_req, res) => res.json(ok({ areas: [], data: [], pagination: { total: 0 } })));
app.get("/api/locations/governorates/:id/areas", (_req, res) => res.json(ok({ areas: [], data: [] })));
app.post("/api/locations/areas", (req, res) => res.json(ok(createRecord("areas", req.body || {}))));
app.put("/api/locations/areas/:id", (req, res) => res.json(ok(updateRecord("areas", req.params.id, req.body || {}))));
app.patch("/api/locations/governorates/:id/areas/shipping-cost", (_req, res) => res.json(ok({ message: "Updated" })));
app.delete("/api/locations/areas/:id", (req, res) => {
  softDelete("areas", req.params.id);
  res.json(ok({ message: "Deleted" }));
});

app.get("/api/products", (_req, res) => {
  const products = storeProductRows();
  res.json(ok({ products, total: products.length }));
});
app.get("/api/products/:id", (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: { message: "Product not found" } });
  res.json(ok({ product, ...product }));
});
app.get("/api/bundles", (_req, res) => res.json(ok({ bundles: storeBundleRows() })));
app.get("/api/bundles/:id", (req, res) => {
  const bundle = findBundle(req.params.id);
  if (!bundle) return res.status(404).json({ success: false, error: { message: "Bundle not found" } });
  res.json(ok({ bundle, ...bundle }));
});
app.get("/api/categories", (_req, res) => res.json(ok({ categories: activeRows("categories") })));
app.get("/api/brands", (_req, res) => res.json(ok({ brands: activeRows("brands") })));
app.get("/api/company-info", (_req, res) => res.json(ok(getSetting("companyInfo"))));
app.get("/api/content", (_req, res) => res.json(ok([])));
app.get("/api/pages", (_req, res) => res.json(ok([])));
app.get("/api/wishlist", (_req, res) => res.json(ok({ items: [] })));
app.post("/api/wishlist", (_req, res) => res.json(ok({ message: "Wishlist disabled until user setup" })));
app.delete("/api/wishlist/:id", (_req, res) => res.json(ok({ message: "Removed" })));
app.post("/api/store/checkout-recovery/session", (req, res) => {
  const settings = checkoutRecoverySettings();
  if (!settings.enabled) return res.json(ok({ enabled:false }));
  const guest = guestIdentity(req, res);
  const suppliedKey = String(req.body?.session_id || "");
  const suppliedToken = String(req.body?.session_token || "");
  let session = suppliedKey && suppliedToken ? verifyCheckoutRecoverySession(suppliedKey, suppliedToken) : null;
  if (session && checkoutRecoveryFinalStatuses.has(session.status)) session = null;
  if (!session) {
    session = createRecord("checkout_recovery_sessions", {
      session_key: crypto.randomUUID(), guest_hash: guest.guest_hash, user_id: req.user?.role !== "admin" ? Number(req.user?.id || 0) || null : null,
      customer_encrypted: encryptIntegrationSecret("{}"), cart_snapshot: [], cart_count:0, subtotal:0, total:0,
      status:"active", stage:"checkout_started", locale:String(req.body?.locale || "ar_SA").slice(0,20),
      started_at:new Date().toISOString(), last_seen_at:new Date().toISOString(), recovery_state:"new"
    });
    recordCheckoutRecoveryEvent(session, "checkout_started", { source:"storefront", stage:"checkout_started", status:"active" });
  }
  session = updateCheckoutRecoverySession(session, {
    customer:req.body?.customer, items:req.body?.items, total:req.body?.total, locale:req.body?.locale,
    payment_provider:req.body?.payment_provider, stage:req.body?.stage || session.stage, status:"active"
  });
  res.json(ok({ enabled:true, session_id:session.session_key, session_token:signCheckoutRecoverySession(session), status:session.status, stage:session.stage, updated_at:session.updated_at }));
});
app.post("/api/store/checkout-recovery/session/:sessionKey/sync", (req, res) => {
  const session = verifyCheckoutRecoverySession(req.params.sessionKey, req.body?.session_token);
  if (!session) fail("CHECKOUT_RECOVERY_SESSION_INVALID", 401);
  const eventType = checkoutRecoveryClientEvents.has(req.body?.event_type) ? req.body.event_type : "checkout_updated";
  const requestedStatus = checkoutRecoveryClientStatuses.has(req.body?.status) ? req.body.status : session.status;
  const updated = updateCheckoutRecoverySession(session, {
    customer:req.body?.customer, items:req.body?.items, total:req.body?.total, locale:req.body?.locale,
    payment_provider:req.body?.payment_provider, payment_attempt_id:req.body?.payment_attempt_id,
    stage:req.body?.stage, status:requestedStatus, reason_code:req.body?.reason_code,
    message:req.body?.message, source:"storefront", details:{ field_names:asArray(req.body?.field_names).slice(0,30).map(value=>String(value).slice(0,80)) }
  }, eventType);
  res.json(ok({ session_id:updated.session_key, status:updated.status, stage:updated.stage, updated_at:updated.updated_at }));
});
app.get("/api/cart", (req, res) => res.json(ok(cartSummary(cartFromRequest(req)))));
app.post("/api/cart", (req, res) => {
  const item = publicCartItem(req.body || {});
  const items = cartFromRequest(req);
  const existing = items.find((entry) => entry.key === item.key);
  if (existing) existing.quantity = Number(existing.quantity || 1) + item.quantity;
  else items.push(item);
  persistCart(res, items);
  res.json(ok({ message: "Cart event saved", item, ...cartSummary(items) }));
});
app.put("/api/cart/:id", (req, res) => {
  const items = cartFromRequest(req);
  const target = items.find((entry) => entry.key === req.params.id || String(entry.product_id) === String(req.params.id));
  if (target) Object.assign(target, req.body || {}, { quantity: Math.max(1, Number(req.body?.quantity || target.quantity || 1)) });
  persistCart(res, items);
  res.json(ok({ message: "Cart updated", id: req.params.id, ...cartSummary(items) }));
});
app.delete(["/api/cart", "/api/cart/:id"], (req, res) => {
  const items = req.params.id ? cartFromRequest(req).filter((entry) => entry.key !== req.params.id && String(entry.product_id) !== String(req.params.id)) : [];
  persistCart(res, items);
  res.json(ok({ message: "Cart cleared", ...cartSummary(items) }));
});
app.post(["/api/webhooks/oto", "/api/webhooks/oto/:eventType"], (req, res) => {
  const settings = normalizeShippingIntegrations();
  const authorization = decryptIntegrationSecret(settings.oto.webhook_authorization_encrypted);
  const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!authorization || supplied !== authorization) fail("OTO_WEBHOOK_UNAUTHORIZED", 401);
  const payload = req.body || {};
  const secret = decryptIntegrationSecret(settings.oto.webhook_secret_encrypted);
  if (!otoWebhookSignatureValid(payload, secret)) fail("OTO_WEBHOOK_SIGNATURE_INVALID", 401);
  const externalOrderId = String(payload.orderId || "");
  const localOrderId = externalOrderId.startsWith(settings.oto.order_prefix) ? externalOrderId.slice(settings.oto.order_prefix.length) : externalOrderId;
  const shipment = entityRows("shipping_shipments").find((row) => String(row.external_order_no || "") === externalOrderId || String(row.store_order_id || "") === localOrderId);
  if (!shipment) return res.json(ok({ accepted: true, matched: false }));
  const eventKey = `${payload.timestamp || ""}:${payload.status || payload.errorCode || ""}:${payload.signature || ""}`;
  const events = Array.isArray(shipment.tracking_events) ? shipment.tracking_events : [];
  if (events.some((event) => event.event_key === eventKey)) return res.json(ok({ accepted: true, duplicate: true }));
  const statusCode = payload.status || payload.errorCode || shipment.status_code;
  const updated = upsertShippingShipment({
    ...shipment,
    provider: "oto",
    waybill_no: payload.trackingNumber || payload.dcTrackingNumber || shipment.waybill_no,
    status_code: statusCode,
    status_group: payload.errorCode ? "exception" : imileStatusGroup(statusCode),
    status_label: payload.dcStatus || payload.note || payload.errorMessage || statusCode,
    integration_error: payload.errorMessage || null,
    tracking_url: payload.trackingUrl || shipment.tracking_url,
    awb_url: payload.printAWBURL || shipment.awb_url,
    tracking_events: [...events, { event_key: eventKey, provider: "oto", status: statusCode, note: payload.note || payload.errorMessage || "", occurred_at: payload.timestamp ? new Date(Number(payload.timestamp)).toISOString() : new Date().toISOString(), raw: payload }],
    latest_status_time: payload.timestamp ? new Date(Number(payload.timestamp)).toISOString() : new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
    sync_state: payload.errorCode ? "creation_failed" : "webhook_synced"
  });
  const order = getRecord("orders", shipment.store_order_id);
  if (order) {
    const statusGroup = updated.status_group;
    const orderStatus = statusGroup === "delivered" ? "completed" : statusGroup === "cancelled" ? "cancelled" : order.status;
    updateRecord("orders", order.id, { shipping_shipment_id: updated.id, shipping_provider: "oto", shipping_status: statusGroup, status: orderStatus });
    addOrderEvent(order.id, payload.errorCode ? "oto_shipment_error" : "oto_status_updated", { shipment_id: updated.id, status: statusCode, note: payload.note || payload.errorMessage || "" }, "oto_webhook");
  }
  res.json(ok({ accepted: true, matched: true, shipment_id: updated.id }));
});
app.post("/api/store/shipping/quote", async (req, res, next) => {
  try {
    const items = checkoutLineItems(req.body?.items || cartFromRequest(req));
    if (!items.length) fail("Cart is empty");
    const customer = await normalizeVerifiedCheckoutCustomer(req.body?.customer || {}, "shipping_quote");
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const result = await customerShippingQuotes({ items, subtotal, customer, paymentMethod: req.body?.payment_method || "cod" });
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
});
app.get("/api/store/address/sa/config", (_req, res) => {
  const spl = publicShippingIntegrations().spl_address;
  res.json(ok({ enabled: spl.is_enabled && spl.has_api_key, require_verified_checkout: spl.require_verified_checkout, allow_manual_fallback: spl.allow_manual_fallback, format: "AAAA0000" }));
});
app.post("/api/store/address/sa/resolve", async (req, res, next) => {
  try {
    const key = String(req.ip || req.socket.remoteAddress || "unknown");
    const recent = (splAddressRateLimit.get(key) || []).filter((time) => Date.now() - time < 60000);
    if (recent.length >= 10) fail("SPL_ADDRESS_RATE_LIMIT", 429);
    splAddressRateLimit.set(key, [...recent, Date.now()]);
    const result = await resolveSaudiShortAddress(req.body?.short_address, { actor: "checkout" });
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
});
app.post("/api/users/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const user = entityRows("users").find((row) => String(row.email || "").toLowerCase() === email);
  if (!user || !verifyUserPassword(password, user.password_hash)) fail("Invalid email or password", 401);
  if (user.is_active === false || ["inactive", "blocked"].includes(String(user.status || "").toLowerCase())) fail("This account is inactive", 403);
  const safeUser = adminUserView(user);
  const token = jwt.sign({ id:user.id, name:user.name || user.full_name, email:user.email, phone:user.phone || "", role:user.role || "customer", permissions:Array.isArray(user.permissions) ? user.permissions : defaultUserPermissions }, jwtSecret, { expiresIn:"7d" });
  res.json(ok({ token, user:safeUser }));
});
app.post("/api/users/register", (req, res) => res.status(403).json({ success: false, error: { message: "Customer registration is disabled until setup." } }));
app.get("/api/users/profile", (req, res) => {
  const user = customerSessionUser(req);
  if (!user) return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
  res.json(ok({ user }));
});
app.post("/api/password-reset/request", (_req, res) => res.json(ok({ message: "If an account exists, a reset link will be sent." })));
app.post("/api/password-reset/reset", (_req, res) => res.json(ok({ message: "Password reset disabled in empty copy." })));
app.get("/api/orders/my-orders", (req, res) => {
  const user = customerSessionUser(req);
  if (!user) fail("Unauthorized", 401);
  if (!user.permissions.includes("view_order_history")) fail("You do not have permission to view order history", 403);
  const orders = entityRows("orders").filter((order) => String(order.customer_identity?.user_id || "") === String(user.id)).map(adminOrderView);
  res.json(ok({ orders }));
});
app.post("/api/orders", async (req, res, next) => {
 let recoverySession = null;
 try {
  try {
    recoverySession = verifyCheckoutRecoverySession(req.body?.checkout_session_id, req.body?.checkout_session_token);
    if (recoverySession) recoverySession = updateCheckoutRecoverySession(recoverySession, {
      customer:req.body?.customer, items:req.body?.items, payment_provider:req.body?.payment_method,
      payment_attempt_id:req.body?.payment_attempt_id, stage:"ready_to_submit", status:"active", submitted_at:new Date().toISOString(), source:"server"
    }, "checkout_submitted");
  } catch (error) { console.error(`Checkout recovery submit sync failed: ${error.message}`); }
  const sessionUser = customerSessionUser(req);
  if (sessionUser && !sessionUser.permissions.includes("place_orders")) fail("You do not have permission to place orders", 403);
  const items = checkoutLineItems(req.body?.items || cartFromRequest(req));
  if (!items.length) fail("Cart is empty");
  const customer = await normalizeVerifiedCheckoutCustomer(req.body?.customer || {}, "place_order");
  const requestedPaymentMethod = String(req.body?.payment_method || "cod").toLowerCase();
  const gatewaySettings = normalizePaymentGateways();
  if (!["cod", "tamara", "edfapay", "tabby"].includes(requestedPaymentMethod)) fail("PAYMENT_METHOD_NOT_SUPPORTED", 409);
  if (requestedPaymentMethod === "tamara" && (!gatewaySettings.providers.tamara.is_enabled || !gatewaySettings.providers.tamara.show_at_checkout)) fail("TAMARA_NOT_ENABLED", 409);
  if (requestedPaymentMethod === "edfapay" && (!gatewaySettings.providers.edfapay.is_enabled || !gatewaySettings.providers.edfapay.show_at_checkout)) fail("EDFAPAY_NOT_ENABLED", 409);
  if (requestedPaymentMethod === "tabby" && (!gatewaySettings.providers.tabby.is_enabled || !gatewaySettings.providers.tabby.show_at_checkout)) fail("TABBY_NOT_ENABLED", 409);
  if (requestedPaymentMethod === "cod" && !gatewaySettings.cash_on_delivery.is_enabled) fail("CASH_ON_DELIVERY_NOT_ENABLED", 409);
  const suppliedAttemptId = String(req.body?.payment_attempt_id || "").trim();
  if (suppliedAttemptId && !/^[A-Za-z0-9_-]{16,100}$/.test(suppliedAttemptId)) fail("PAYMENT_ATTEMPT_ID_INVALID", 400);
  const hostedPayment = ["tamara", "edfapay", "tabby"].includes(requestedPaymentMethod);
  const paymentAttemptId = hostedPayment ? suppliedAttemptId : "";
  if (paymentAttemptId) {
    const existing = entityRows("orders").find((row) => row.payment_attempt_id === paymentAttemptId && row.payment?.provider === requestedPaymentMethod);
    if (existing) {
      const attemptAge = Date.now() - recentTimestamp(existing);
      const attemptTtl = gatewaySettings.redirect_policy.attempt_ttl_minutes * 60 * 1000;
      if (attemptAge > attemptTtl) fail("PAYMENT_ATTEMPT_EXPIRED", 409);
      if (["authorised", "captured", "partially_captured", "fully_captured"].includes(String(existing.payment?.status || ""))) {
        return res.json(ok({ order: existing, payment_provider: requestedPaymentMethod, payment_confirmed: true, reused_payment_attempt: true }));
      }
      if (existing.status === "pending" && existing.payment?.checkout_url) {
        return res.json(ok({ order: existing, payment_redirect_url: existing.payment.checkout_url, payment_provider: requestedPaymentMethod, reused_payment_attempt: true }));
      }
      fail("PAYMENT_ATTEMPT_CLOSED", 409);
    }
  }
  const commerceSnapshot = commerceOrderSnapshot(customer, requestedPaymentMethod);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const quoteContext = { items, subtotal, customer, paymentMethod: req.body?.payment_method || "cod" };
  const submittedQuoteToken = String(req.body?.shipping_quote_token || "").trim();
  let quote = verifyShippingQuoteToken(submittedQuoteToken, quoteContext);
  const discountCodes = [...new Set([...(Array.isArray(req.body?.discount_codes) ? req.body.discount_codes : []), req.body?.discount_code, req.body?.coupon_code].map((item) => String(item || "").trim().toUpperCase()).filter(Boolean))];
  if (sessionUser && discountCodes.length && !sessionUser.permissions.includes("use_promo_codes")) fail("You do not have permission to use promo codes", 403);
  const guest = guestIdentity(req, res);
  const identities = promotionIdentities({ ...guest, user_id: req.user?.id, customer });
  const applied = evaluatePromotions({
    codes: discountCodes,
    order_total: subtotal,
    product_ids: items.map((item) => item.product_id),
    category_slugs: items.map((item) => item.category_slug).filter(Boolean),
    items,
    customer,
    identity: { ...guest, user_id: req.user?.id },
    reserve: true
  });
  const appliedCodeSet = new Set((applied.applied_promotions || []).map((item) => item.code));
  const rejectedSubmitted = discountCodes.find((item) => !appliedCodeSet.has(item));
  if (rejectedSubmitted) {
    const rejection = (applied.rejected_promotions || []).find((item) => item.code === rejectedSubmitted);
    fail(rejection?.reason || "PROMO_NOT_APPLIED");
  }
  if (!quote) quote = (await customerShippingQuotes(quoteContext)).quote;
  const shippingAmount = applied?.free_shipping ? 0 : quote.customer_amount;
  const discountAmount = Number(applied?.discount_amount || 0);
  const total = Number(Math.max(0, subtotal - discountAmount + Number(shippingAmount || 0)).toFixed(2));
  commerceSnapshot.payment.cod_amount = commerceSnapshot.payment.method === "prepaid" ? 0 : total;
  commerceSnapshot.payment.currency = commerceSnapshot.currency.code;
  const lineMap = new Map((applied?.line_discounts || []).map((line) => [String(line.key), line]));
  const orderItems = items.map((item) => {
    const line = lineMap.get(String(item.key));
    return {
      ...item,
      discount_eligible: Boolean(line?.eligible),
      discount_reason: line?.reason || null,
      discount_amount: Number(line?.discount_amount || 0),
      final_subtotal: Number(line?.final_subtotal ?? item.subtotal)
    };
  });
  const order = createRecord("orders", {
    status: "pending",
    payment_attempt_id: paymentAttemptId || null,
    customer,
    shipping_address: customer,
    market_snapshot: commerceSnapshot.market,
    currency_snapshot: commerceSnapshot.currency,
    payment: commerceSnapshot.payment,
    items: orderItems,
    subtotal: Number(subtotal.toFixed(2)),
    eligible_subtotal: Number(applied?.eligible_subtotal || 0),
    discount_id: applied?.discount?.id || null,
    discount_code: applied?.applied_promotions?.[0]?.code || null,
    discount_codes: applied?.applied_promotions?.map((item) => item.code) || [],
    applied_promotions: applied?.applied_promotions || [],
    rejected_promotions: applied?.rejected_promotions || [],
    discount_amount: discountAmount,
    shipping_amount: Number(shippingAmount || 0),
    shipping_base_amount: Number(quote.base_customer_amount ?? quote.customer_amount ?? 0),
    expected_shipping_cost: Number(quote.carrier_estimated_cost ?? quote.base_customer_amount ?? quote.customer_amount ?? 0),
    free_shipping_rule_id: applied?.free_shipping ? null : quote.rule?.id || null,
    shipping_quote: { ...quote, quote_token: undefined, fp: undefined, iat: undefined, exp: undefined, aud: undefined, customer_amount: Number(shippingAmount || 0), carrier_customer_amount: Number(quote.base_customer_amount ?? quote.customer_amount ?? 0), free_shipping_applied: Boolean(applied?.free_shipping) },
    shipping_provider: quote.provider || "internal",
    shipping_selection: { provider: quote.provider || "internal", carrier_code: quote.carrier_code || quote.provider || "internal", carrier_name_en: quote.carrier_name_en || "", carrier_name_ar: quote.carrier_name_ar || "", delivery_option_id: quote.delivery_option_id || null, quote_id: quote.id || null },
    total,
    shipping_package: {
      total_count: orderItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0),
      gross_weight: Number(orderItems.reduce((sum, item) => sum + Number(item.shipping?.weight || 0) * Number(item.quantity || 1), 0).toFixed(3)),
      goods_type_ids: [...new Set(orderItems.flatMap((item) => item.shipping?.goods_type_ids || [item.shipping?.goods_type_id]).filter(Boolean))],
      requires_shipping: orderItems.some((item) => item.shipping?.requires_shipping !== false)
    },
    discount_breakdown: applied?.line_discounts || [],
    customer_identity: identities
  });
  if (recoverySession) recoverySession = updateCheckoutRecoverySession(recoverySession, {
    customer, items:orderItems, total, payment_provider:requestedPaymentMethod, payment_attempt_id:paymentAttemptId,
    order_id:order.id, stage:"order_created", status:hostedPayment?"payment_pending":"active", source:"server"
  }, "order_created");
  if (requestedPaymentMethod === "tamara") {
    try {
      if (recoverySession) recoverySession = updateCheckoutRecoverySession(recoverySession, { stage:"gateway_initializing", status:"payment_pending", payment_provider:"tamara", source:"server" }, "gateway_initializing");
      const pendingOrder = await createTamaraCheckout(order, req);
      if (recoverySession) updateCheckoutRecoverySession(recoverySession, { stage:"payment_redirected", status:"payment_pending", payment_provider:"tamara", order_id:order.id, source:"server" }, "payment_redirect_ready");
      return res.json(ok({ order: pendingOrder, payment_redirect_url: pendingOrder.payment?.checkout_url, payment_provider: "tamara" }));
    } catch (error) {
      releaseOrderPromotionReservations(order, "tamara_checkout_failed");
      updateRecord("orders", order.id, { status: "cancelled", payment: { ...commerceSnapshot.payment, provider: "tamara", status: "failed", failure_reason: String(error.message || "TAMARA_CHECKOUT_FAILED"), last_updated_at: new Date().toISOString() }, payment_failed_at: new Date().toISOString() });
      paymentTransaction({ provider: "tamara", order_id: order.id, type: "checkout_failed", status: "failed", amount: total, currency: commerceSnapshot.currency.code, details: { reason: String(error.message || "TAMARA_CHECKOUT_FAILED").slice(0, 500) } });
      throw error;
    }
  }
  if (requestedPaymentMethod === "edfapay") {
    try {
      if (recoverySession) recoverySession = updateCheckoutRecoverySession(recoverySession, { stage:"gateway_initializing", status:"payment_pending", payment_provider:"edfapay", source:"server" }, "gateway_initializing");
      const pendingOrder = await createEdfaPayCheckout(order, req);
      if (recoverySession) updateCheckoutRecoverySession(recoverySession, { stage:"payment_redirected", status:"payment_pending", payment_provider:"edfapay", order_id:order.id, source:"server" }, "payment_redirect_ready");
      return res.json(ok({ order: pendingOrder, payment_redirect_url: pendingOrder.payment?.checkout_url, payment_provider: "edfapay" }));
    } catch (error) {
      releaseOrderPromotionReservations(order, "edfapay_checkout_failed");
      updateRecord("orders", order.id, { status: "cancelled", payment: { ...commerceSnapshot.payment, provider: "edfapay", status: "failed", failure_reason: String(error.message || "EDFAPAY_CHECKOUT_FAILED"), last_updated_at: new Date().toISOString() }, payment_failed_at: new Date().toISOString() });
      paymentTransaction({ provider: "edfapay", order_id: order.id, type: "checkout_failed", status: "failed", amount: total, currency: commerceSnapshot.currency.code, details: { reason: String(error.message || "EDFAPAY_CHECKOUT_FAILED").slice(0, 500) } });
      throw error;
    }
  }
  if (requestedPaymentMethod === "tabby") {
    try {
      if (recoverySession) recoverySession = updateCheckoutRecoverySession(recoverySession, { stage:"gateway_initializing", status:"payment_pending", payment_provider:"tabby", source:"server" }, "gateway_initializing");
      const pendingOrder = await createTabbyCheckout(order);
      if (recoverySession) updateCheckoutRecoverySession(recoverySession, { stage:"payment_redirected", status:"payment_pending", payment_provider:"tabby", order_id:order.id, source:"server" }, "payment_redirect_ready");
      return res.json(ok({ order: pendingOrder, payment_redirect_url: pendingOrder.payment?.checkout_url, payment_provider: "tabby" }));
    } catch (error) {
      releaseOrderPromotionReservations(order, "tabby_checkout_failed");
      updateRecord("orders", order.id, { status: "cancelled", payment: { ...commerceSnapshot.payment, provider: "tabby", status: "failed", failure_reason: String(error.message || "TABBY_CHECKOUT_FAILED"), last_updated_at: new Date().toISOString() }, payment_failed_at: new Date().toISOString() });
      paymentTransaction({ provider: "tabby", order_id: order.id, type: "checkout_failed", status: "failed", amount: total, currency: commerceSnapshot.currency.code, details: { reason: String(error.message || "TABBY_CHECKOUT_FAILED").slice(0, 500) } });
      throw error;
    }
  }
  await initializeOrderShipping(order);
  finalizePromotionRedemptions(applied?.applied_promotions || [], identities, order.id);
  updateRecord("orders", order.id, { promotion_redemptions_finalized_at: new Date().toISOString() });
  if (recoverySession) updateCheckoutRecoverySession(recoverySession, { stage:"checkout_completed", status:"completed", order_id:order.id, completed_at:new Date().toISOString(), source:"server" }, "checkout_completed");
  persistCart(res, []);
  res.json(ok({ order: getRecord("orders", order.id), payment_provider: "internal" }));
 } catch (error) {
   if (recoverySession && !checkoutRecoveryFinalStatuses.has(recoverySession.status)) {
     try {
       const paymentStarted = Boolean(recoverySession.order_id || recoverySession.payment_attempt_id || ["order_created", "gateway_initializing", "payment_redirected", "payment_pending"].includes(recoverySession.stage));
       const validationError = [400, 409, 422].includes(Number(error.status || 0));
       updateCheckoutRecoverySession(recoverySession, { stage:paymentStarted?"payment_failed":validationError?"validation_failed":"checkout_failed", status:"failed", reason_code:String(error.message||"CHECKOUT_FAILED").split(":")[0], message:error.message, source:"server" }, "checkout_failed");
     }
     catch (recoveryError) { console.error(`Checkout recovery failure sync failed: ${recoveryError.message}`); }
   }
   next(error);
 }
});
app.get("/api/store/payment-methods", (_req, res) => res.json(ok(publicPaymentGateways({ storefront: true }))));
app.get("/api/store/payments/edfapay/status", (req, res, next) => {
  try {
    const orderId = Number(req.query.order_id || 0);
    const decoded = jwt.verify(String(req.query.token || ""), jwtSecret, { audience: "siteyfy-edfapay" });
    if (decoded?.type !== "edfapay_return" || Number(decoded.order_id) !== orderId) fail("INVALID_PAYMENT_RETURN", 401);
    const order = getRecord("orders", orderId);
    if (!order || order.payment?.provider !== "edfapay") fail("PAYMENT_ORDER_NOT_FOUND", 404);
    res.json(ok({ order: { id: order.id, status: order.status, total: order.total, currency: order.currency_snapshot?.code || "SAR", payment_status: order.payment?.status || "pending", provider_status: order.payment?.provider_status || null, provider: "edfapay" } }));
  } catch (error) {
    next(error);
  }
});
app.get("/api/store/payments/tabby/status", async (req, res, next) => {
  try {
    const orderId = Number(req.query.order_id || 0);
    const outcome = String(req.query.outcome || "");
    const decoded = jwt.verify(String(req.query.token || ""), jwtSecret, { audience: "siteyfy-tabby" });
    if (decoded?.type !== "tabby_return" || Number(decoded.order_id) !== orderId) fail("INVALID_PAYMENT_RETURN", 401);
    const order = getRecord("orders", orderId);
    if (!order || order.payment?.provider !== "tabby") fail("PAYMENT_ORDER_NOT_FOUND", 404);
    let updated = order;
    try { updated = await syncTabbyPayment(order); }
    catch (error) {
      if (outcome === "cancel" || outcome === "failure") updated = await completeTabbyPayment(order, { id: order.payment?.provider_order_id, status: outcome === "cancel" ? "EXPIRED" : "REJECTED" });
      else throw error;
    }
    res.json(ok({ order: { id: updated.id, status: updated.status, total: updated.total, currency: updated.currency_snapshot?.code || "SAR", payment_status: updated.payment?.status || "pending", provider_status: updated.payment?.provider_status || null, provider: "tabby" } }));
  } catch (error) { next(error); }
});
app.get("/api/store/payments/tamara/status", async (req, res, next) => {
  try {
    const orderId = Number(req.query.order_id || 0);
    const token = String(req.query.token || "");
    const outcome = ["success", "failure", "cancel"].includes(String(req.query.outcome || "")) ? String(req.query.outcome) : "";
    const decoded = jwt.verify(token, jwtSecret, { audience: "siteyfy-tamara" });
    if (decoded?.type !== "tamara_return" || Number(decoded.order_id) !== orderId) fail("INVALID_PAYMENT_RETURN", 401);
    const order = getRecord("orders", orderId);
    if (!order || order.payment?.provider !== "tamara") fail("PAYMENT_ORDER_NOT_FOUND", 404);
    const updated = await syncTamaraOrder(order, { outcome });
    res.json(ok({
      order: {
        id: updated.id,
        status: updated.status,
        total: updated.total,
        currency: updated.currency_snapshot?.code || "SAR",
        payment_status: updated.payment?.status || "pending",
        provider_status: updated.payment?.provider_status || null,
        provider: "tamara"
      }
    }));
  } catch (error) {
    next(error);
  }
});
app.post("/api/webhooks/tamara", async (req, res, next) => {
  try {
    const settings = normalizePaymentGateways();
    const notificationSecret = decryptIntegrationSecret(settings.providers.tamara.notification_token_encrypted);
    if (!settings.providers.tamara.is_enabled || !notificationSecret) fail("TAMARA_WEBHOOK_DISABLED", 404);
    const authHeader = String(req.headers.authorization || "");
    const signedToken = String(req.query.tamaraToken || (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""));
    if (!signedToken) fail("TAMARA_WEBHOOK_TOKEN_MISSING", 401);
    try { jwt.verify(signedToken, notificationSecret, { algorithms: ["HS256"] }); }
    catch { fail("TAMARA_WEBHOOK_TOKEN_INVALID", 401); }
    const event = req.body || {};
    if (!event.order_id || !event.event_type) fail("TAMARA_WEBHOOK_PAYLOAD_INVALID", 400);
    const order = tamaraOrderByReference({ providerOrderId: event.order_id, orderReferenceId: event.order_reference_id });
    if (!order) {
      paymentTransaction({ provider: "tamara", provider_order_id: event.order_id, type: "unmatched_webhook", status: tamaraPaymentStatus(tamaraStatusFromEvent(event.event_type)), provider_event_key: `tamara:unmatched:${event.order_id}:${event.event_type}`, details: { order_reference_id: event.order_reference_id || null, event_type: event.event_type } });
      return res.json({ success: true, received: true, matched: false });
    }
    const updated = await syncTamaraOrder(order, { event });
    res.json({ success: true, received: true, matched: true, order_id: updated.id, payment_status: updated.payment?.status });
  } catch (error) {
    next(error);
  }
});
const edfapayMultipartBody = (req, res, next) => req.is("multipart/form-data") ? upload.none()(req, res, next) : next();

function edfapayCallbackPayload(req) {
  if (typeof req.body === "string") return Object.fromEntries(new URLSearchParams(req.body));
  return req.body && typeof req.body === "object" ? req.body : {};
}

function secureTextEqual(left, right) {
  const actual = Buffer.from(String(left || ""));
  const expected = Buffer.from(String(right || ""));
  return actual.length === expected.length && actual.length > 0 && crypto.timingSafeEqual(actual, expected);
}

app.post("/api/webhooks/edfapay/:secret", edfapayMultipartBody, async (req, res) => {
  try {
    const settings = normalizePaymentGateways();
    const config = settings.providers.edfapay;
    const expectedPathSecret = decryptIntegrationSecret(config.callback_path_secret_encrypted);
    if (!config.is_enabled || !secureTextEqual(req.params.secret, expectedPathSecret)) return res.status(404).type("text/plain").send("ERROR");
    const webhookSecret = decryptIntegrationSecret(config.webhook_secret_encrypted);
    if (webhookSecret) {
      const suppliedSignature = String(req.headers["x-edfapay-signature"] || "").replace(/^sha256=/i, "").trim();
      const raw = req.rawBody?.length ? req.rawBody : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");
      if (!secureTextEqual(suppliedSignature.toLowerCase(), expectedSignature.toLowerCase())) return res.status(401).type("text/plain").send("ERROR");
    }
    await applyEdfaPayEvent(edfapayCallbackPayload(req), "webhook");
    res.type("text/plain").send("OK");
  } catch (error) {
    console.error("EdfaPay callback failed", String(error.message || error));
    res.status(error.status || 400).type("text/plain").send("ERROR");
  }
});
app.post("/api/webhooks/tabby", async (req, res) => {
  try {
    const tabby = normalizePaymentGateways().providers.tabby;
    const expected = decryptIntegrationSecret(tabby.webhook_auth_encrypted);
    if (!tabby.is_enabled || !secureTextEqual(req.headers["x-siteyfy-tabby-token"], expected)) return res.status(401).json({ received: false });
    const paymentId = String(req.body?.id || req.body?.payment_id || req.body?.payment?.id || "");
    if (!paymentId) return res.status(400).json({ received: false });
    const order = entityRows("orders").find((row) => row.payment?.provider === "tabby" && row.payment?.provider_order_id === paymentId);
    if (!order) {
      paymentTransaction({ provider: "tabby", provider_order_id: paymentId, type: "unmatched_webhook", status: "pending", provider_event_key: `tabby:unmatched:${paymentId}:${req.body?.status || "event"}` });
      return res.json({ received: true, matched: false });
    }
    const updated = await syncTabbyPayment(order, paymentId);
    res.json({ received: true, matched: true, order_id: updated.id, payment_status: updated.payment?.status });
  } catch (error) {
    console.error("Tabby webhook failed", String(error.message || error));
    res.status(error.status || 400).json({ received: false });
  }
});

app.post("/payment/edfapay/return", async (req, res) => {
  const orderId = Number(req.query.order_id || 0);
  const token = String(req.query.token || "");
  try {
    const decoded = jwt.verify(token, jwtSecret, { audience: "siteyfy-edfapay" });
    if (decoded?.type !== "edfapay_return" || Number(decoded.order_id) !== orderId) fail("INVALID_PAYMENT_RETURN", 401);
  } catch (error) {
    console.error("EdfaPay customer return failed", String(error.message || error));
  }
  res.redirect(303, `/payment/edfapay/return?order_id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`);
});
app.get("/api/addresses", (_req, res) => res.json(ok({ addresses: [] })));

app.get("/api/store/home-sections", (_req, res) => res.json(ok(getSetting("homeSections"))));
app.get("/api/store/appearance", (_req, res) => res.json(ok({ company: getSetting("companyInfo") || {}, brand: normalizeBrandIdentity(), layout: normalizeStorefrontLayout(), shipping: shippingSettings() })));
app.get("/api/store/currencies", (_req, res) => res.json(ok(normalizeCurrencies())));
app.get("/api/store/market", (_req, res) => {
  const settings = normalizeMarketSettings();
  const countries = normalizeCountries().filter((country) => settings.enabled_country_codes.includes(country.code));
  res.json(ok({ settings, countries, currency: normalizeCurrencies() }));
});
app.get("/api/store/home-builder", (_req, res) => res.json(ok(normalizeHomeBuilder())));
app.get("/api/store/company-info", (_req, res) => {
  const companyInfo = getSetting("companyInfo") || {};
  res.json(ok({ company_info: companyInfo, ...companyInfo }));
});
app.get("/api/store/categories", (_req, res) => res.json(ok({ categories: activeRows("categories") })));
app.get("/api/store/brands", (_req, res) => res.json(ok({ brands: activeRows("brands") })));
app.get("/api/store/bundles", (_req, res) => res.json(ok({ bundles: storeBundleRows() })));
app.get("/api/store/collections", (_req, res) => {
  const collections = storeCollectionRows();
  res.json(ok({ collections, total: collections.length }));
});
app.get("/api/store/collections/:slug", (req, res) => {
  const collection = storeCollectionRows().find((row) => row.slug === collectionSlug(req.params.slug));
  if (!collection) fail("Collection not found", 404);
  res.json(ok({ collection, ...collection }));
});
app.get("/api/store/discounts", (_req, res) => res.json(ok({ discounts: entityRows("discounts").map(discountWithStatus).filter((item) => ["active", "expiring_soon"].includes(item.status)) })));
app.post("/api/store/discounts/validate", (req, res) => {
  const guest = guestIdentity(req, res);
  res.json(ok(evaluatePromotions({ ...(req.body || {}), codes: [req.body?.code], identity: { ...guest, user_id: req.user?.id }, reserve: true })));
});
app.post("/api/store/promotions/evaluate", (req, res) => {
  const guest = guestIdentity(req, res);
  res.json(ok(evaluatePromotions({ ...(req.body || {}), identity: { ...guest, user_id: req.user?.id }, reserve: req.body?.reserve !== false })));
});
app.post("/api/webhooks/imile/tracking", (req, res) => {
  const settings = normalizeShippingIntegrations();
  if (!settings.imile.webhook_enabled) return res.status(404).json({ code: "404", message: "disabled" });
  const expectedToken = decryptIntegrationSecret(settings.imile.webhook_token_encrypted);
  if (expectedToken && String(req.headers["x-siteyfy-webhook-token"] || "") !== expectedToken) {
    return res.status(401).json({ code: "401", message: "unauthorized" });
  }
  const payload = req.body?.param || req.body || {};
  if (req.body?.partnerCode && settings.imile.customer_id && String(req.body.partnerCode) !== String(settings.imile.customer_id)) {
    return res.status(400).json({ code: "400", message: "partner mismatch" });
  }
  upsertShippingShipment({
    waybill_no: payload.billNo || payload.waybillNo,
    external_order_no: payload.orderNo || null,
    status_code: payload.latestStatus,
    latest_status_time: payload.latestTime,
    latest_site: payload.latestSite,
    latest_locus: payload.latestLocus,
    tracking_events: Array.isArray(payload.latestLocus) ? payload.latestLocus : undefined,
    source: "webhook",
    sync_state: "synced",
    last_synced_at: new Date().toISOString(),
    delivered_at: imileStatusGroup(payload.latestStatus) === "delivered" ? (payload.latestTime || new Date().toISOString()) : undefined
  });
  res.json({ code: "200", message: "success" });
});
app.get("/api/store/content/sliders", (_req, res) => {
  const builder = normalizeHomeBuilder();
  res.json(ok({
    sliders: builder.slides.filter((slide) => slide.is_active !== false).map((slide, index) => ({
      ...slide,
      type: "SLIDER",
      media_url: slide.desktop_image_url || slide.mobile_image_url || null,
      media_url_mobile: slide.mobile_image_url || slide.desktop_image_url || null,
      media_url_desktop: slide.desktop_image_url || slide.mobile_image_url || null,
      button_text_en: slide.cta_en || "",
      button_text_ar: slide.cta_ar || "",
      button_link: slide.link_url || null,
      sort_order: index
    }))
  }));
});
app.get("/api/store/products", (req, res) => {
  const products = storeProductRows().map(productForNextStore);
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || products.length || 20);
  const start = Math.max(page - 1, 0) * limit;
  const paged = products.slice(start, start + limit);
  res.json(ok({ products: paged, total: products.length, page, totalPages: Math.max(Math.ceil(products.length / limit), 1) }));
});
app.get("/api/store/products/top-viewed", (_req, res) => res.json(ok({ products: storeProductRows().slice(0, 8).map(productForNextStore) })));
app.get("/api/store/products/top-sales", (_req, res) => res.json(ok({ products: storeProductRows().slice(0, 8).map(productForNextStore) })));
app.get("/api/store/products/:id/related", (req, res) => {
  const product = findProduct(req.params.id);
  const products = storeProductRows().filter((item) => item.id !== product?.id && item.category_slug === product?.category_slug).slice(0, 6).map(productForNextStore);
  res.json(ok({ products }));
});
app.get("/api/store/products/:id/reviews", (req, res) => {
  const product = productRecord(req.params.id, true);
  if (!product) fail("Product not found", 404);
  const settings = productSocialProofSettings(product.id);
  const published = settings.reviews_enabled ? publishedProductReviews(product.id) : [];
  const guest = guestIdentity(req, res);
  const ipHash = reviewIpHash(req);
  const helpfulReviewIds = new Set(entityRows("review_helpful_votes")
    .filter((vote) => (vote.guest_hash && vote.guest_hash === guest.guest_hash) || (vote.ip_hash && vote.ip_hash === ipHash))
    .map((vote) => Number(vote.review_id)));
  const recommendations = settings.reviews_enabled
    ? entityRows("product_recommendations")
      .filter((row) => Number(row.product_id) === Number(product.id) && row.is_active !== false)
      .sort((a, b) => Number(b.is_featured === true) - Number(a.is_featured === true) || Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map(publicStoreRecommendation)
    : [];
  res.json(ok({
    product_id: Number(product.id),
    reviews: published.map((review) => publicCustomerReview(review, helpfulReviewIds.has(Number(review.id)))),
    recommendations,
    aggregate: settings.show_rating_summary ? ratingAggregate(published) : { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, hidden: true },
    social_proof: productSalesSocialProof(product.id, settings),
    settings: {
      reviews_enabled: settings.reviews_enabled,
      accepting_reviews: settings.reviews_enabled && settings.accepting_reviews,
      show_rating_summary: settings.show_rating_summary,
      show_sales: settings.show_sales,
      sales_display_mode: settings.sales_display_mode,
      sales_threshold: settings.sales_threshold
    }
  }));
});
app.post("/api/store/products/:id/reviews", (req, res) => {
  const product = productRecord(req.params.id, true);
  if (!product) fail("Product not found", 404);
  const settings = productSocialProofSettings(product.id);
  if (!settings.reviews_enabled) fail("Reviews are disabled for this product", 403);
  if (!settings.accepting_reviews) fail("This product is not accepting new reviews", 403);

  const sessionUser = customerSessionUser(req);
  if (sessionUser && !sessionUser.permissions.includes("submit_reviews")) fail("You do not have permission to submit reviews", 403);
  const displayName = cleanReviewText(sessionUser?.name || req.body?.display_name, 2, 80, "Name");
  const comment = cleanReviewText(req.body?.comment, 10, 2000, "Comment");
  const rating = validRating(req.body?.rating);
  const email = String(sessionUser?.email || req.body?.email || "").trim().slice(0, 320);
  const phone = String(sessionUser?.phone || req.body?.phone || "").trim().slice(0, 40);
  const submittedOrderId = String(req.body?.order_id || "").trim().slice(0, 80) || null;
  const ipHash = enforceReviewRateLimit(req);
  const submissionHash = reviewSubmissionHash({ productId: product.id, displayName, comment, email, phone, ipHash });
  const duplicate = entityRows("product_reviews").find((review) => (
    review.submission_hash === submissionHash
    && Date.now() - recentTimestamp(review) < reviewDuplicateWindowMs
  ));
  if (duplicate) fail("This review was already submitted recently", 409);

  const verifiedOrder = verifiedReviewPurchase({ productId: product.id, orderId: submittedOrderId, email, phone, userId: sessionUser?.id });
  const orderId = verifiedOrder ? String(verifiedOrder.id) : submittedOrderId;
  const isVerifiedPurchase = Boolean(verifiedOrder);
  if (verifiedOrder && entityRows("product_reviews").some((review) => (
    review.is_verified_purchase === true
    && Number(review.product_id) === Number(product.id)
    && String(review.order_id || "") === orderId
  ))) fail("This order already has a verified review for this product", 409);

  const status = settings.auto_publish_verified && isVerifiedPurchase ? "published" : "pending";
  const now = new Date().toISOString();
  const review = createRecord("product_reviews", {
    product_id: Number(product.id),
    customer_id: sessionUser?.id || null,
    source: "customer",
    status,
    display_name: displayName,
    rating,
    comment,
    order_id: orderId,
    is_verified_purchase: isVerifiedPurchase,
    email_hash: identityHash(email),
    phone_hash: identityHash(phone),
    ip_hash: ipHash,
    submission_hash: submissionHash,
    helpful_count: 0,
    submitted_at: now,
    published_at: status === "published" ? now : null
  });
  reviewEvent(review.id, "submitted", "customer", { status, is_verified_purchase: isVerifiedPurchase });
  res.status(201).json(ok({
    review: publicCustomerReview(review),
    status,
    message: status === "published" ? "Review published" : "Review submitted for moderation"
  }));
});
app.post("/api/store/reviews/:id/helpful", (req, res) => {
  const review = activeReviewRecord(req.params.id);
  if (!review || review.status !== "published" || review.source !== "customer") fail("Review not found", 404);
  const guest = guestIdentity(req, res);
  const ipHash = reviewIpHash(req);
  const duplicate = entityRows("review_helpful_votes").find((vote) => (
    Number(vote.review_id) === Number(review.id)
    && ((vote.guest_hash && vote.guest_hash === guest.guest_hash) || (vote.ip_hash && vote.ip_hash === ipHash))
  ));
  if (duplicate) fail("Helpful vote already recorded", 409);
  createRecord("review_helpful_votes", {
    review_id: Number(review.id),
    guest_hash: guest.guest_hash,
    ip_hash: ipHash,
    voted_at: new Date().toISOString()
  });
  const helpfulCount = entityRows("review_helpful_votes").filter((vote) => Number(vote.review_id) === Number(review.id)).length;
  updateRecord("product_reviews", review.id, { helpful_count: helpfulCount });
  res.json(ok({ review_id: Number(review.id), helpful_count: helpfulCount }));
});
app.get("/api/store/products/:id", (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: { message: "Product not found" } });
  const storefrontProduct = productForNextStore(product);
  res.json(ok({ product: storefrontProduct, ...storefrontProduct }));
});
app.get("/api/public/pages/:slug", (_req, res) => res.json(ok({ page: null })));

async function serveNextImage(req, res, next, sourceUrl, requestedWidth, requestedQuality) {
  try {
    const rawUrl = String(sourceUrl || "");
    const decodedUrl = decodeURIComponent(rawUrl);
    const width = Math.min(Math.max(Number(requestedWidth || 828), 16), 1920);
    const quality = Math.min(Math.max(Number(requestedQuality || 72), 40), 85);
    const cacheKey = crypto.createHash("sha1").update(`${decodedUrl}|${width}|${quality}`).digest("hex");
    const cachePath = path.join(__dirname, "public", "image-cache", `${cacheKey}.webp`);

    if (fs.existsSync(cachePath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.type("image/webp");
      return res.sendFile(cachePath);
    }

    const localPath = localPublicImagePath(decodedUrl);
    if (localPath) {
      await sharp(localPath)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(cachePath);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.type("image/webp");
      return res.sendFile(cachePath);
    }

    if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
      const upstream = await fetch(decodedUrl);
      if (!upstream.ok) return res.sendStatus(upstream.status);
      const buffer = Buffer.from(await upstream.arrayBuffer());
      await sharp(buffer)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toFile(cachePath);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.type("image/webp");
      return res.sendFile(cachePath);
    }

    return res.sendStatus(404);
  } catch (error) {
    next(error);
  }
}

app.get("/_next/image", (req, res, next) => {
  serveNextImage(req, res, next, req.query.url, req.query.w, req.query.q);
});

app.get(/^\/_next\/image%3Furl=.*$/, (req, res, next) => {
  const raw = req.path.replace(/^\/_next\/image%3F/i, "");
  const params = new URLSearchParams(raw.replaceAll("%26", "&"));
  serveNextImage(req, res, next, params.get("url"), params.get("w"), params.get("q"));
});

app.get(/^\/_next\/image%3Furl=.*logo-premiumbrand\.png.*$/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "logo-premiumbrand.png"));
});

app.get("/favicon.ico", (_req, res) => {
  const company = getSetting("companyInfo") || {};
  const faviconPath = localPublicImagePath(company.favicon_url || "");
  if (faviconPath) return res.sendFile(faviconPath);
  res.type("image/png").sendFile(path.join(__dirname, "public", "logo-premiumbrand.png"));
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(getRobotsTxt().content);
});

const adminHtml = path.join(__dirname, "public", "admin", "index.html");
app.get(["/admin", "/admin/", "/admin/index.html"], (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.sendFile(adminHtml);
});
const storefrontHtml = path.join(__dirname, "public", "storefront", "index.html");
app.get(["/", "/products", "/shop", "/cart", "/checkout", "/payment/tamara/success", "/payment/tamara/failure", "/payment/tamara/cancel", "/payment/edfapay/return", "/payment/tabby/success", "/payment/tabby/failure", "/payment/tabby/cancel"], (_req, res) => res.sendFile(storefrontHtml));
app.get("/product/:id", (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).send("Product not found");
  res.sendFile(storefrontHtml);
});
app.get("/bundle/:id", (req, res) => {
  const bundle = findBundle(req.params.id);
  if (!bundle) return res.status(404).send("Bundle not found");
  res.sendFile(storefrontHtml);
});
app.get("/collection/:slug", (req, res) => {
  const collection = storeCollectionRows().find((row) => row.slug === collectionSlug(req.params.slug));
  if (!collection) return res.status(404).send("Collection not found");
  res.sendFile(storefrontHtml);
});
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads"), { maxAge: "30d", immutable: true }));
app.use("/_next/static", express.static(path.join(__dirname, "public", "_next", "static"), { maxAge: "30d", immutable: true }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h" }));

app.get(["/wishlist", "/login", "/register", "/forgot-password", "/verify-email"], (req, res) => {
  const htmlFile = path.join(__dirname, "public", `${req.path.slice(1)}.html`);
  res.sendFile(fs.existsSync(htmlFile) ? htmlFile : path.join(__dirname, "public", "index.html"));
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ success: false, error: { message: err.message || "Server error" } });
});

app.listen(port, () => {
  refreshConfiguredShippingEstimates({ overwriteConfigured: false });
  backfillShippingSettlementSnapshots();
  refreshCheckoutRecoveryStatuses();
  pruneCheckoutRecoveryHistory();
  console.log(`Slyrah commerce copy running on port ${port}`);
  const runScheduledShippingSync = async () => {
    const integrations = publicShippingIntegrations();
    const connector = integrations.oms_connector;
    if (connector.is_enabled && connector.has_password && connector.auto_sync_on_open !== false) {
      const intervalMs = Math.max(15, Number(connector.sync_interval_minutes || 15)) * 60_000;
      if (!connector.last_success_at || Date.now() - new Date(connector.last_success_at).getTime() >= intervalMs) {
        try { await syncImileOmsReports({ trigger: "scheduler" }); }
        catch (error) { console.error(`Scheduled iMile fee sync failed: ${error.message}`); }
      }
    }
    const tracking = integrations.imile;
    if (tracking.is_enabled && tracking.has_secret_key && tracking.auto_sync_tracking) {
      const latestTrackingRun = entityRows("shipping_sync_runs").find((run) => run.source === "tracking" && run.status === "completed");
      const trackingIntervalMs = Math.max(15, Number(tracking.sync_interval_minutes || 60)) * 60_000;
      if (!latestTrackingRun?.completed_at || Date.now() - new Date(latestTrackingRun.completed_at).getTime() >= trackingIntervalMs) {
        try { await syncImileTracking({ trigger: "scheduler" }); }
        catch (error) { console.error(`Scheduled iMile tracking sync failed: ${error.message}`); }
      }
    }
  };
  setTimeout(runScheduledShippingSync, 30_000);
  setInterval(runScheduledShippingSync, 60_000);
  setInterval(() => {
    try { refreshCheckoutRecoveryStatuses(); pruneCheckoutRecoveryHistory(); }
    catch (error) { console.error(`Checkout recovery maintenance failed: ${error.message}`); }
  }, 5 * 60_000);
});
