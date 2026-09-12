const app = document.getElementById("storeApp");
const overlayRoot = document.getElementById("overlayRoot");
const toastRoot = document.getElementById("toastRoot");

const state = {
  appearance:null,
  currencies:null,
  market:null,
  builder:null,
  categories:[],
  products:[],
  bundles:[],
  collections:[],
  cart:readLocalCart(),
  page:1,
  category:new URLSearchParams(location.search).get("category") || "",
  maxPrice:Infinity,
  sort:"default",
  announcementTimer:null
  ,checkoutQuote:null,checkoutQuotes:[],
  addressConfig:{ enabled:false, format:"AAAA0000" },
  paymentMethods:{ methods:[] },
  customer:null,
  helpfulReviews:new Set()
};

function customerAuthToken() {
  return localStorage.getItem("premiumbrandeg:user:token") || localStorage.getItem("siteyfy:user:token") || "";
}

function readLocalCart() {
  try { return JSON.parse(localStorage.getItem("slyrah_cart") || "[]"); } catch { return []; }
}

function saveLocalCart() {
  localStorage.setItem("slyrah_cart", JSON.stringify(state.cart));
  updateCartCount();
}

async function api(endpoint, options = {}) {
  const customerToken=customerAuthToken();
  const response = await fetch(endpoint, { ...options, headers:{ Accept:"application/json", ...(options.body ? { "Content-Type":"application/json" } : {}), ...(customerToken ? { Authorization:`Bearer ${customerToken}` } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) throw new Error(payload?.error?.message || "تعذر تنفيذ الطلب");
  return payload?.data ?? payload;
}

function esc(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function icon(name, size = 20) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

function whatsappIcon(size = 24) {
  return `<svg class="whatsapp-mark" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.173.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.894 6.99c-.003 5.45-4.437 9.884-9.886 9.889m8.413-18.297A11.815 11.815 0 0 0 12.055 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.14 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.688 1.448h.005c6.557 0 11.893-5.335 11.896-11.893a11.821 11.821 0 0 0-3.487-8.413Z"/></svg>`;
}

function hydrateIcons() {
  window.lucide?.createIcons({ attrs:{ "stroke-width":1.8 } });
}

function applyTheme() {
  const { company = {}, brand = {} } = state.appearance || {};
  const root = document.documentElement.style;
  const vars = { primary:"primary_color", "primary-dark":"primary_dark_color", sale:"sale_color", footer:"footer_color", surface:"surface_color", text:"text_color", muted:"muted_color" };
  Object.entries(vars).forEach(([variable,key]) => brand[key] && root.setProperty(`--${variable}`, brand[key]));
  if (brand.font_ar) root.setProperty("--font-ar", brand.font_ar);
  if (brand.font_en) root.setProperty("--font-en", brand.font_en);
  document.title = company.site_name_ar || "رداء الحشمة";
  const description = document.querySelector('meta[name="description"]');
  if (description && company.description_ar) description.content = company.description_ar;
}

function baseCurrency() {
  const rows = state.currencies?.currencies || [];
  return rows.find((item) => item.code === state.currencies?.base_currency) || rows[0] || { code:"SAR", symbol_ar:"ر.س", decimal_digits:0, locale:"ar-SA", symbol_position:"after" };
}

function money(value) {
  const currency = baseCurrency();
  const digits = Number(currency.decimal_digits || 0);
  const amount = new Intl.NumberFormat(currency.locale || "ar-SA", { minimumFractionDigits:digits, maximumFractionDigits:digits }).format(Number(value || 0));
  if (currency.code === "SAR") return `<span class="sar-price"><bdi>${amount}</bdi><span class="sar-symbol" role="img" aria-label="ريال سعودي"></span></span>`;
  const symbol = currency.symbol_ar || currency.symbol_en || currency.code;
  return currency.symbol_position === "before" ? `${symbol} ${amount}` : `${amount} ${symbol}`;
}

function productPrice(product) {
  return Number(product.sale_price || product.price || 0);
}

function variantPrice(product, variant = null) {
  if (variant?.price !== null && variant?.price !== undefined && variant?.price !== "") return Number(variant.price);
  return Number((productPrice(product) + Number(variant?.price_adjustment || variant?.price_delta || 0)).toFixed(2));
}

function comparePrice(product) {
  const regular = Number(product.price_before || product.price || 0);
  return regular > productPrice(product) ? regular : 0;
}

function activeVariants(product) {
  return Array.isArray(product.variants) ? product.variants.filter((variant) => variant.is_active !== false && variant.active !== false && variant.status !== "inactive") : [];
}

function variantInStock(variant) {
  return variant?.in_stock !== false && variant?.is_in_stock !== false && variant?.stock_status !== "out_of_stock";
}

function productCardPurchase(product) {
  const variants=activeVariants(product),available=variants.filter(variantInStock);
  if(!variants.length)return { mode:"direct",variant:null };
  if(!available.length)return { mode:"sold_out",variant:null };
  if(available.length===1)return { mode:"direct",variant:available[0] };
  return { mode:"select",variant:null };
}

function productCardActions(product, pinnedVariant = null, productLink = "") {
  const purchase=pinnedVariant
    ? { mode:variantInStock(pinnedVariant)?"direct":"sold_out",variant:pinnedVariant }
    : productCardPurchase(product);
  const soldOut=purchase.mode==="sold_out",needsSelection=purchase.mode==="select";
  const variantAttribute=pinnedVariant?` data-card-variant="${esc(pinnedVariant.id)}"`:"";
  const linkAttribute=productLink?` data-card-link="${esc(productLink)}"`:"";
  return `<div class="product-card-actions">
    <button class="card-action card-cart" type="button" data-card-product="${product.id}" data-card-action="add"${variantAttribute}${linkAttribute} ${soldOut?"disabled":""}>${icon("shopping-cart",15)}<span>${soldOut?"نفدت الكمية":needsSelection?"تحديد الخيارات":"أضف للسلة"}</span></button>
    <button class="card-action card-buy" type="button" data-card-product="${product.id}" data-card-action="buy"${variantAttribute}${linkAttribute} ${soldOut?"disabled":""}>${icon("shopping-bag",15)}<span>${soldOut?"غير متاح":"اشتري الآن"}</span></button>
  </div>`;
}

function productImages(product) {
  const values = [product.main_photo_url || product.image_url, ...(product.side_photos || []), ...(product.gallery || []), ...activeVariants(product).map((variant) => variant.image_url)].filter(Boolean);
  return [...new Set(values)];
}

function uniqueColors(product) {
  const map = new Map();
  activeVariants(product).filter((variant) => variant.color).forEach((variant) => {
    if (!map.has(variant.color)) map.set(variant.color, { name:variant.color, hex:variant.hex_code || variant.hex || "transparent" });
  });
  return [...map.values()];
}

function productCategoryName(product) {
  return product.category_name_ar || product.category?.name_ar || product.category?.nameAr || "رداء الحشمة";
}

function productCard(product, home = false) {
  const colors = uniqueColors(product);
  const compare = comparePrice(product);
  const sale = compare > productPrice(product);
  return `<article class="product-card" data-product-card="${product.id}">
    <div class="product-media">
      ${sale ? `<span class="sale-badge">تخفيض</span>` : ""}
      <button class="wish-button" type="button" aria-label="إضافة للمفضلة">${icon("heart",17)}</button>
      <a href="/product/${product.id}" aria-label="${esc(product.name_ar)}"><img src="${esc(product.main_photo_url || product.image_url)}" alt="${esc(product.name_ar)}" loading="lazy" /></a>
    </div>
    <div class="product-info">
      <div class="swatch-row">${colors.slice(0,5).map(color=>`<span class="mini-swatch" style="background:${esc(color.hex)}" title="${esc(color.name)}"></span>`).join("")}${colors.length>5?`<small>+${colors.length-5}</small>`:""}</div>
      <div class="product-meta">${esc(productCategoryName(product))}</div>
      <a class="product-title" href="/product/${product.id}">${esc(product.name_ar || product.name_en)}</a>
      <div class="price">${compare?`<del>${money(compare)}</del>`:""}<strong>${money(productPrice(product))}</strong></div>
      ${productCardActions(product)}
    </div>
  </article>`;
}

function collectionItems(collection) {
  const rows = collection?.items || collection?.products || [];
  return Array.isArray(rows) ? rows : [];
}

function collectionById(id) {
  return state.collections.find((collection) => String(collection.id) === String(id) || collection.slug === String(id));
}

function collectionItemData(item, collection) {
  if (item.is_available === false) return null;
  const product = item.product || state.products.find((row) => String(row.id) === String(item.product_id || item.productId));
  if (!product || product.is_active === false || product.active === false) return null;
  const variantId = item.variant_id ?? item.variantId ?? item.variant?.id;
  const variant = item.variant || activeVariants(product).find((row) => String(row.id) === String(variantId));
  if (variantId != null && (!variant || variant.is_active === false || variant.active === false || variant.status === "inactive")) return null;
  const link = item.href || item.link_url || item.product_url || item.url || (() => {
    const params = new URLSearchParams();
    if (variant?.id != null) params.set("variant", variant.id);
    if (collection?.slug) params.set("collection", collection.slug);
    const query = params.toString();
    return `/product/${product.id}${query ? `?${query}` : ""}`;
  })();
  const price = Number(item.price ?? variant?.price ?? productPrice(product));
  const compare = Number(item.compare_at_price ?? item.compare_price ?? variant?.compare_at_price ?? comparePrice(product));
  return {
    product,
    variant,
    link,
    price,
    compare:compare > price ? compare : 0,
    image:item.image_url || item.variant_image_url || variant?.image_url || product.main_photo_url || product.image_url,
    color:item.color || item.color_name || item.variant_labels?.color || variant?.color || "",
    hex:item.hex_code || item.color_hex || variant?.hex_code || variant?.hex || "#777",
    option:item.option_label || item.option_name || item.variant_labels?.option || variant?.option || "",
    value:item.option_value || item.value || item.variant_labels?.value || variant?.value || ""
  };
}

function collectionItemCard(item, collection, home = false) {
  const data = collectionItemData(item, collection);
  if (!data) return "";
  const { product, variant, link, price, compare, image, color, hex, option, value } = data;
  const labels = [option && value ? `${option}: ${value}` : value].filter(Boolean);
  return `<article class="product-card collection-product-card" data-product-card="${product.id}">
    <div class="product-media">
      ${compare ? `<span class="sale-badge">تخفيض</span>` : ""}
      <a href="${esc(link)}" aria-label="${esc(product.name_ar || product.name_en)}"><img src="${esc(image)}" alt="${esc(product.name_ar || product.name_en)}" loading="lazy" /></a>
    </div>
    <div class="product-info">
      <div class="collection-variant-meta">${color ? `<span class="collection-color"><i style="--collection-color:${esc(hex)}"></i>${esc(color)}</span>` : ""}${labels.map((label) => `<span class="collection-option">${esc(label)}</span>`).join("")}</div>
      <div class="product-meta">${esc(productCategoryName(product))}</div>
      <a class="product-title" href="${esc(link)}">${esc(product.name_ar || product.name_en)}</a>
      <div class="price">${compare ? `<del>${money(compare)}</del>` : ""}<strong>${money(price)}</strong></div>
      ${productCardActions(product,variant,link)}
    </div>
  </article>`;
}

function bundleVisual(bundle, compact = false) {
  if(bundle.main_photo_url)return `<img src="${esc(bundle.main_photo_url)}" alt="${esc(bundle.name_ar||bundle.name_en)}" />`;
  return `<div class="bundle-composite ${compact?"compact":""}">${(bundle.items||[]).slice(0,3).map((item,index)=>`${index?`<span class="bundle-plus">+</span>`:""}<img src="${esc(item.image_url||"")}" alt="${esc(item.name_ar||item.name_en)}" />`).join("")}</div>`;
}

function bundleCard(bundle) {
  const compare=Number(bundle.compare_at_price||bundle.regular_total||0);
  return `<article class="product-card bundle-card"><div class="product-media"><span class="bundle-badge">بندل</span><a href="/bundle/${bundle.id}" aria-label="${esc(bundle.name_ar)}">${bundleVisual(bundle,true)}</a></div><div class="product-info"><div class="product-meta">${Number(bundle.item_count||bundle.items?.length||0)} منتجات معًا</div><a class="product-title" href="/bundle/${bundle.id}">${esc(bundle.name_ar||bundle.name_en)}</a><div class="price">${compare>Number(bundle.price)?`<del>${money(compare)}</del>`:""}<strong>${money(bundle.price)}</strong></div><a class="card-add bundle-card-link" href="/bundle/${bundle.id}">عرض البندل</a></div></article>`;
}

function announcementHtml() {
  const announcement = state.appearance?.layout?.announcement;
  if (!announcement?.is_active) return "";
  const messages = (announcement.messages || []).filter((item) => item.is_active !== false);
  if (!messages.length) return "";
  const transition = announcement.transition === "slide" ? "slide" : "fade";
  return `<div class="announcement ${transition}" data-announcement data-interval="${Math.max(2,Number(announcement.rotation_interval_seconds||5))*1000}" data-pause="${announcement.pause_on_hover!==false}" aria-live="polite"><div class="announcement-track">${messages.map((message,index)=>`<div class="announcement-message ${index===0?"active":""}" data-announcement-message>${icon(message.icon||"gift",13)}<span>${esc(message.text_ar)}</span>${message.link_url?`<a href="${esc(message.link_url)}">${esc(message.link_label_ar||"تسوق الآن")}</a>`:""}</div>`).join("")}</div></div>`;
}

function bindAnnouncement() {
  clearInterval(state.announcementTimer);
  const bar=document.querySelector("[data-announcement]");
  const messages=[...(bar?.querySelectorAll("[data-announcement-message]")||[])];
  if(!bar||messages.length<2)return;
  let current=0;let paused=false;
  const show=next=>{
    const previous=messages[current];
    const incoming=messages[next];
    previous.classList.remove("active");
    previous.classList.add("leaving");
    incoming.classList.remove("leaving");
    incoming.classList.add("active");
    current=next;
    window.setTimeout(()=>previous.classList.remove("leaving"),460);
  };
  state.announcementTimer=setInterval(()=>{if(!paused)show((current+1)%messages.length);},Number(bar.dataset.interval||5000));
  if(bar.dataset.pause==="true"){bar.addEventListener("mouseenter",()=>{paused=true;});bar.addEventListener("mouseleave",()=>{paused=false;});}
}

function headerHtml() {
  const company = state.appearance?.company || {};
  const layout = state.appearance?.layout?.header || {};
  const pathname = location.pathname;
  return `${announcementHtml()}<header class="store-header ${layout.sticky ? "is-sticky" : ""}"><div class="container header-main">
    <a class="header-logo" href="/"><img src="${esc(company.logo_url)}" alt="${esc(company.site_name_ar || "رداء الحشمة")}" /></a>
    <nav class="main-nav desktop-only"><a href="/" class="${pathname==="/"?"active":""}">الرئيسية</a><a href="/products" class="${pathname==="/products"||pathname==="/shop"||pathname.startsWith("/product/")?"active":""}">المتجر</a><a href="/cart" class="${pathname==="/cart"?"active":""}">السلة</a><a href="/checkout">إتمام الطلب</a><a href="#footer">تواصل معنا</a><a href="#about">من نحن</a></nav>
    <div class="header-actions start desktop-only">${layout.show_search!==false?`<button class="round-action" type="button" data-search-open aria-label="البحث">${icon("search")}</button>`:""}${layout.show_cart!==false?`<a class="round-action" href="/cart" aria-label="السلة">${icon("shopping-cart")}<span class="cart-count" data-cart-count>0</span></a>`:""}${layout.show_wishlist!==false?`<button class="round-action" aria-label="المفضلة">${icon("heart")}</button>`:""}<button class="login-button" type="button"><span>تسجيل الدخول</span>${icon("user-round",18)}</button></div>
    <button class="round-action mobile-only" type="button" data-menu-open aria-label="القائمة">${icon("menu")}</button>
    <div class="header-actions mobile-only"><button class="round-action" type="button" data-search-open aria-label="البحث">${icon("search")}</button><a class="round-action" href="/cart" aria-label="السلة">${icon("shopping-cart")}<span class="cart-count" data-cart-count>0</span></a></div>
  </div></header>${layout.show_category_strip!==false ? categoryStripHtml() : ""}`;
}

function categoryStripHtml() {
  return `<div class="category-strip"><div class="container category-strip-inner" data-drag-scroll>${state.categories.map(category=>`<a class="category-shortcut" href="/products?category=${encodeURIComponent(category.slug)}"><span>${esc(category.name_ar || category.name_en)}</span>${category.image_url?`<img src="${esc(category.image_url)}" alt="" />`:""}</a>`).join("")}</div></div>`;
}

function footerLinkUrl(value = "") {
  const url=String(value).trim();
  if (/^#[a-zA-Z][\w-]*$/.test(url) || /^\/(?![\/\\])[^\\]*$/.test(url)) return url;
  try { const parsed=new URL(url); return ["https:","http:"].includes(parsed.protocol) ? parsed.href : ""; } catch { return ""; }
}

function footerHtml() {
  const company = state.appearance?.company || {};
  const footer = state.appearance?.layout?.footer || {};
  const english=document.documentElement.lang==="en";
  const label=(ar,en)=>english?en:ar;
  const name=(english?company.site_name_en:company.site_name_ar)||company.site_name_ar||company.site_name_en||"";
  const description=(english?company.description_en:company.description_ar)||company.description_ar||company.description_en||"";
  const address=(english?company.address_en:company.address_ar)||company.address_ar||company.address_en||"";
  const phone=String(company.phone||"").trim();
  const phoneHref=phone.replace(/[^+\d]/g,"");
  const whatsapp=String(company.whatsapp||company.phone||"").replace(/\D/g,"");
  const email=String(company.email||"").trim();
  const policies=[
    [footer.store_policy_url,label("سياسة المتجر","Store policy")],
    [footer.shipping_policy_url,label("الشحن والتوصيل","Shipping & delivery")],
    [footer.privacy_policy_url,label("سياسة الخصوصية","Privacy policy")]
  ].map(([url,title])=>({url:footerLinkUrl(url),title})).filter(item=>item.url);
  const social=[
    [company.facebook_url,"Facebook",'<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4c-.4-.1-1.6-.2-3-.2-3 0-5 1.8-5 5.2V9H7v4h3v9Z"/></svg>'],
    [company.instagram_url,"Instagram",'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>'],
    [company.tiktok_url,"TikTok",'<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16 2h-3v13.5a3.5 3.5 0 1 1-3-3.46V9a6.5 6.5 0 1 0 6 6.5V8a8.4 8.4 0 0 0 5 1.6V6.5A5.2 5.2 0 0 1 16 2Z"/></svg>']
  ].map(([url,title,mark])=>({url:footerLinkUrl(url),title,mark})).filter(item=>item.url);
  const hasBusiness=footer.show_business_info!==false&&(company.business_document||company.commercial_registration);
  return `<footer class="store-footer" id="footer"><div class="container footer-main">
    <section class="footer-brand" id="about" aria-label="${esc(name)}">
      <a class="footer-logo-link" href="/" aria-label="${esc(label("الرئيسية","Home"))}">${company.logo_light_url||company.logo_url?`<img src="${esc(company.logo_light_url||company.logo_url)}" alt="${esc(name)}" loading="lazy" />`:`<strong>${esc(name)}</strong>`}</a>
      ${footer.show_description!==false&&description?`<p>${esc(description)}</p>`:""}
      ${footer.show_social!==false&&social.length?`<nav class="socials" aria-label="${label("تابعينا","Follow us")}">${social.map(item=>`<a class="social-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${item.title}">${item.mark}</a>`).join("")}</nav>`:""}
    </section>
    <section class="footer-column footer-navigation"><h3>${label("روابط تهمك","Explore")}</h3><nav aria-label="${label("روابط الفوتر","Footer navigation")}"><a href="/products">${label("تسوقي المنتجات","Shop all")}</a><a href="/cart">${label("سلة التسوق","Shopping bag")}</a>${footer.show_description!==false&&description?`<a href="#about">${label("من نحن","About us")}</a>`:""}${footer.show_policies!==false?policies.map(item=>`<a href="${esc(item.url)}">${esc(item.title)}</a>`).join(""):""}</nav></section>
    ${footer.show_contact!==false&&(address||phoneHref||email)?`<section class="footer-column footer-contact"><h3>${label("تواصل معنا","Get in touch")}</h3><div>${address?`<span class="footer-contact-row">${icon("map-pin",18)}<span>${esc(address)}</span></span>`:""}${phoneHref?`<a class="footer-contact-row" href="tel:${esc(phoneHref)}">${icon("phone",18)}<bdi dir="ltr">${esc(phone)}</bdi></a>`:""}${email?`<a class="footer-contact-row" href="mailto:${esc(email)}">${icon("mail",18)}<bdi dir="ltr">${esc(email)}</bdi></a>`:""}${whatsapp?`<a class="footer-contact-row" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener noreferrer">${whatsappIcon(18)}<span>${label("تواصلي عبر واتساب","Chat on WhatsApp")}</span></a>`:""}</div></section>`:""}
    ${hasBusiness?`<section class="footer-column footer-business" aria-label="${label("بيانات المنشأة","Business details")}"><div class="footer-business-heading">${company.business_center_logo_url?`<img class="business-logo" src="${esc(company.business_center_logo_url)}" alt="${label("المركز السعودي للأعمال","Saudi Business Center")}" loading="lazy" />`:icon("badge-check",30)}<h3>${label("موثق لدى منصة الأعمال","Business registration")}</h3></div><dl>${company.business_document?`<div><dt>${label("رقم التوثيق","Document number")}</dt><dd><bdi>${esc(company.business_document)}</bdi></dd></div>`:""}${company.commercial_registration?`<div><dt>${label("السجل التجاري","Commercial registration")}</dt><dd><bdi>${esc(company.commercial_registration)}</bdi></dd></div>`:""}</dl></section>`:""}
  </div><div class="footer-bottom"><div class="container footer-bottom-inner"><p>${esc((english?footer.copyright_en:footer.copyright_ar)||label(`جميع الحقوق محفوظة © ${new Date().getFullYear()} ${name}`,`© ${new Date().getFullYear()} ${name}. All rights reserved.`))}</p>${company.payment_methods_image_url?`<div class="footer-payments"><span>${icon("lock-keyhole",16)}${label("وسائل الدفع","Payment methods")}</span><img class="payment-methods" src="${esc(company.payment_methods_image_url)}" alt="${label("وسائل الدفع","Payment methods")}" loading="lazy" /></div>`:""}</div></div></footer>${whatsapp?`<a class="whatsapp-float" href="https://wa.me/${whatsapp}" target="_blank" rel="noopener noreferrer" aria-label="${label("فتح محادثة واتساب","Open WhatsApp chat")}">${whatsappIcon(28)}</a>`:""}<button class="scroll-top" type="button" aria-label="${label("العودة إلى أعلى الصفحة","Back to top")}" title="${label("العودة إلى الأعلى","Back to top")}" tabindex="-1">${icon("arrow-up",22)}</button>`;
}

function shell(content) {
  app.innerHTML = `${headerHtml()}<main class="page-main">${content}</main>${footerHtml()}`;
  bindGlobal();
}

function updateCartCount() {
  const count = state.cart.reduce((sum,item)=>sum+Number(item.quantity||1),0);
  document.querySelectorAll("[data-cart-count]").forEach(el=>el.textContent=count);
}

function toast(message) {
  toastRoot.innerHTML = `<div class="toast">${esc(message)}</div>`;
  setTimeout(()=>{ toastRoot.innerHTML=""; },2600);
}

function openOverlay(html) {
  overlayRoot.innerHTML = `<button class="drawer-backdrop" data-overlay-close aria-label="إغلاق"></button>${html}`;
  document.body.classList.add("is-locked");
  overlayRoot.querySelectorAll("[data-overlay-close]").forEach(button=>button.onclick=closeOverlay);
  hydrateIcons();
}

function closeOverlay() {
  overlayRoot.innerHTML="";
  document.body.classList.remove("is-locked");
}

function openMenu() {
  const company=state.appearance.company||{};
  openOverlay(`<aside class="side-drawer"><div class="drawer-head"><img src="${esc(company.logo_url)}" alt="" /><button class="close-button" data-overlay-close aria-label="إغلاق">${icon("x")}</button></div><div class="drawer-body"><nav class="drawer-menu"><a href="/">الرئيسية</a><a href="/products">المتجر</a><a href="/cart">السلة</a><a href="/checkout">إتمام الطلب</a><a href="#footer" data-overlay-close>تواصل معنا</a><a href="#about" data-overlay-close>من نحن</a></nav></div><div class="drawer-foot"><a class="primary-button" href="/products">تسوق الآن</a></div></aside>`);
  overlayRoot.querySelectorAll("[data-overlay-close]").forEach(button=>button.onclick=closeOverlay);
}

function openSearch() {
  openOverlay(`<section class="search-dialog"><div class="drawer-head" style="padding:0 0 15px"><strong>ابحثي في المتجر</strong><button class="close-button" data-overlay-close>${icon("x")}</button></div><div class="search-input-wrap"><input id="storeSearch" type="search" placeholder="ابحثي باسم المنتج..." autofocus /><button class="primary-button" type="button">${icon("search")}</button></div><div class="search-results" id="searchResults"></div></section>`);
  const input=document.getElementById("storeSearch");
  const render=()=>{const q=input.value.trim();const rows=q?state.products.filter(product=>(product.name_ar||"").includes(q)).slice(0,8):[];document.getElementById("searchResults").innerHTML=rows.map(product=>`<a class="search-result" href="/product/${product.id}"><img src="${esc(product.main_photo_url)}" alt="" /><strong>${esc(product.name_ar)}</strong><span>${money(productPrice(product))}</span></a>`).join("") || (q?`<div class="no-results" style="min-height:100px">لا توجد نتائج</div>`:"");};
  input.oninput=render;
  input.focus();
}

function bindGlobal() {
  updateCartCount();
  bindAnnouncement();
  document.querySelectorAll("[data-menu-open]").forEach(button=>button.onclick=openMenu);
  document.querySelectorAll("[data-search-open]").forEach(button=>button.onclick=openSearch);
  document.querySelectorAll("[data-card-product]").forEach(button=>button.onclick=()=>{const product=state.products.find(item=>String(item.id)===button.dataset.cardProduct);if(!product)return;const pinnedVariant=button.dataset.cardVariant?activeVariants(product).find(item=>String(item.id)===button.dataset.cardVariant):null;const purchase=pinnedVariant?{mode:variantInStock(pinnedVariant)?"direct":"sold_out",variant:pinnedVariant}:productCardPurchase(product);if(purchase.mode==="sold_out"){toast("نفدت كمية هذا المنتج");return;}if(purchase.mode==="select"){location.href=button.dataset.cardLink||`/product/${product.id}`;return;}addToCart(product,purchase.variant,1,button.dataset.cardAction!=="buy");if(button.dataset.cardAction==="buy")location.href="/cart";});
  bindDragScroll();
  bindScrollTop();
  hydrateIcons();
}

function bindDragScroll() {
  document.querySelectorAll("[data-drag-scroll]").forEach(rail=>{
    if(rail.dataset.dragBound==="true")return;
    rail.dataset.dragBound="true";
    requestAnimationFrame(()=>rail.classList.toggle("can-drag",rail.scrollWidth>rail.clientWidth+1));
    let active=false,moved=false,startX=0,startScrollLeft=0,pointerId=null,suppressClickUntil=0;
    rail.addEventListener("dragstart",event=>event.preventDefault());
    rail.addEventListener("pointerdown",event=>{
      if(event.pointerType!=="mouse"||event.button!==0||rail.scrollWidth<=rail.clientWidth+1||event.target.closest("button,input,select,textarea"))return;
      active=true;moved=false;startX=event.clientX;startScrollLeft=rail.scrollLeft;pointerId=event.pointerId;
      rail.classList.add("is-drag-ready");
      rail.setPointerCapture?.(pointerId);
    });
    rail.addEventListener("pointermove",event=>{
      if(!active||event.pointerId!==pointerId)return;
      const delta=event.clientX-startX;
      if(!moved&&Math.abs(delta)<6)return;
      moved=true;rail.classList.add("is-dragging");event.preventDefault();
      rail.scrollLeft=startScrollLeft+(getComputedStyle(rail).direction==="rtl"?delta:-delta);
    });
    const finish=event=>{
      if(!active||event.pointerId!==pointerId)return;
      if(moved)suppressClickUntil=Date.now()+220;
      active=false;pointerId=null;
      rail.classList.remove("is-drag-ready","is-dragging");
    };
    rail.addEventListener("pointerup",finish);
    rail.addEventListener("pointercancel",finish);
    rail.addEventListener("lostpointercapture",()=>{active=false;pointerId=null;rail.classList.remove("is-drag-ready","is-dragging");});
    rail.addEventListener("click",event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}},true);
  });
}

let scrollTopHandler=null;
function bindScrollTop() {
  const button=document.querySelector(".scroll-top");
  if(scrollTopHandler)window.removeEventListener("scroll",scrollTopHandler);
  if(!button)return;
  scrollTopHandler=()=>{
    const visible=window.scrollY>420;
    button.classList.toggle("is-visible",visible);
    button.tabIndex=visible?0:-1;
    button.setAttribute("aria-hidden",String(!visible));
  };
  window.addEventListener("scroll",scrollTopHandler,{passive:true});
  button.onclick=()=>window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  scrollTopHandler();
}

function breadcrumbs(current) {
  return `<div class="container breadcrumbs"><a href="/">الرئيسية</a> <b>‹</b> <span>${esc(current)}</span></div>`;
}

function homeRail(rows, id, renderer = product => productCard(product, true)) {
  return `<div class="home-rail-shell"><button class="rail-arrow rail-prev" type="button" data-rail-target="${id}" data-rail-direction="1" aria-label="السابق">${icon("chevron-right",24)}</button><div class="home-rail" id="${id}" data-drag-scroll>${rows.map(renderer).join("")}</div><button class="rail-arrow rail-next" type="button" data-rail-target="${id}" data-rail-direction="-1" aria-label="التالي">${icon("chevron-left",24)}</button></div>`;
}

function homeCategory(category) {
  return `<a class="category-card" href="/products?category=${encodeURIComponent(category.slug)}"><img src="${esc(category.image_url)}" alt="${esc(category.name_ar)}" loading="lazy" /><span>${esc(category.name_ar)}</span></a>`;
}

function featuredProductCard(product) {
  const compare=comparePrice(product);
  return `<article class="featured-product-card"><a class="featured-product-image" href="/product/${product.id}"><img src="${esc(product.main_photo_url||product.image_url)}" alt="${esc(product.name_ar)}" loading="lazy" /></a><div class="featured-product-info"><div class="product-meta">${esc(productCategoryName(product))}</div><a class="featured-product-title" href="/product/${product.id}">${esc(product.name_ar||product.name_en)}</a><div class="featured-stars" aria-label="التقييم">★★★★★</div><div class="price">${compare?`<del>${money(compare)}</del>`:""}<strong>${money(productPrice(product))}</strong></div>${productCardActions(product)}</div></article>`;
}

function eidShowcase(products) {
  if (!products.length) return `<div class="no-results"><div><h2>لا توجد منتجات متاحة حاليًا</h2><p>ستظهر أحدث المنتجات هنا فور إضافتها.</p></div></div>`;
  const beige=state.products.find(product=>(product.name_ar||"").includes("ريون"))||products[0];
  const rug=state.products.find(product=>(productCategoryName(product)||"").includes("سجاد"))||products[1]||products[0];
  return `<div class="eid-showcase"><aside class="eid-promos"><a class="eid-promo eid-promo-tall" href="/product/${beige.id}" style="--promo-image:url('${esc(beige.main_photo_url||beige.image_url)}')"><span>خامة فاخرة..<br />لفة أنيقة</span><b>تسوق الآن</b></a><a class="eid-promo eid-promo-short" href="/product/${rug.id}" style="--promo-image:url('${esc(rug.main_photo_url||rug.image_url)}')"><span>تعرّفي على جديد<br />سجاد الصلاة</span><b>تسوق الآن</b></a></aside><div class="eid-products">${products.slice(0,6).map(featuredProductCard).join("")}</div></div>`;
}

function bindHomeRails() {
  document.querySelectorAll("[data-rail-target]").forEach(button=>button.onclick=()=>{
    const rail=document.getElementById(button.dataset.railTarget);
    if(!rail)return;
    rail.scrollBy({left:Number(button.dataset.railDirection)*Math.max(rail.clientWidth*.78,260),behavior:"smooth"});
  });
}

function collectionSectionHtml(collection, section = {}, index = 0) {
  if (!collection) return "";
  const rows = collectionItems(collection).filter((item) => collectionItemData(item, collection));
  const limit = Math.max(1, Number(section.item_limit || section.limit || collection.home_item_limit || rows.length));
  const visible = rows.slice(0, limit);
  if (!visible.length) return "";
  const title = section.title_ar || collection.name_ar || collection.name_en;
  const slug = collection.slug || collection.id;
  const railId = `collectionRail-${String(section.id || collection.id || index).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const products = visible.map((item) => collectionItemCard(item, collection, true)).join("");
  const display = section.display_style === "grid"
    ? `<div class="product-grid collection-home-grid">${products}</div>`
    : homeRail(visible, railId, (item) => collectionItemCard(item, collection, true));
  return `<section class="section home-collection"><div class="container"><div class="section-head"><div><span class="collection-eyebrow">مجموعة مختارة</span><h2>${esc(title)}</h2></div>${section.show_view_all === false ? "" : `<a class="section-link" href="/collection/${encodeURIComponent(slug)}">مشاهدة المجموعة</a>`}</div>${display}</div></section>`;
}

function isCollectionSection(section) {
  const type = String(section?.type || "").toLowerCase();
  const source = String(section?.source || "").toLowerCase();
  return Boolean(section?.collection_id ?? section?.collectionId) && (type === "collection" || source === "collection");
}

function renderHome() {
  const slides=(state.builder?.slides||[]).filter(slide=>slide.is_active!==false);
  const saleProducts=state.products.filter(product=>comparePrice(product)>productPrice(product)).slice(0,8);
  const categoryOrder=["شراشف صلاة","سجاد صلاة","اطقم سجاد وشراشف","الأكثر مبيعأ"];
  const categoryRows=[...state.categories].sort((a,b)=>categoryOrder.indexOf(a.name_ar)-categoryOrder.indexOf(b.name_ar));
  const eidProducts=state.products.slice(0,8);
  const fixed = {
    offers:`<section class="section home-offers"><div class="container"><div class="section-head"><h2>أفضل عروض رداء الحشمة</h2><a class="section-link" href="/products">مشاهدة الكل</a></div>${homeRail(saleProducts.length?saleProducts:state.products.slice(0,8),"offersRail")}</div></section>`,
    categories:`<section class="section home-categories"><div class="container"><div class="section-head center"><h2>تسوق التصنيفات</h2></div>${homeRail(categoryRows,"categoriesRail",homeCategory)}</div></section>`,
    latest:`<section class="section home-latest"><div class="container"><div class="section-head"><h2>عروض العيد</h2><a class="section-link" href="/products">مشاهدة الكل</a></div>${eidShowcase(eidProducts)}</div></section>`
  };
  const used = new Set();
  const builderSections = (state.builder?.sections || []).filter((section) => section.is_active !== false).sort((a,b) => Number(a.order || 0) - Number(b.order || 0));
  const orderedSections = builderSections.map((section,index) => {
    if (section.type === "banner") return renderPromoBanner(section);
    if (isCollectionSection(section)) return collectionSectionHtml(collectionById(section.collection_id ?? section.collectionId), section, index);
    const source = String(section.source || "").toLowerCase();
    const type = String(section.type || "").toLowerCase();
    let key = "";
    if (type === "categories" || source === "categories") key = "categories";
    else if (source === "sale" || String(section.id).includes("offer")) key = "offers";
    else if (source === "latest" || String(section.id).includes("latest")) key = "latest";
    if (!key || used.has(key)) return "";
    used.add(key);
    return fixed[key];
  }).join("");
  const remaining = ["offers","categories","latest"].filter((key) => !used.has(key)).map((key) => fixed[key]).join("");
  shell(`<div class="home-content">${slides.length?`<section class="hero"><div class="hero-stage">${slides.map((slide,index)=>`<article class="hero-slide ${index===0?"active":""}" data-slide="${index}"><a href="${esc(slide.link_url||"/products")}">${responsiveBanner(slide, index === 0)}${slide.cta_ar?`<span class="hero-cta">${esc(slide.cta_ar)}</span>`:""}</a></article>`).join("")}<div class="hero-dots">${slides.map((_,index)=>`<button class="hero-dot ${index===0?"active":""}" data-hero-dot="${index}" aria-label="عرض البانر ${index+1}" aria-pressed="${index===0}"></button>`).join("")}</div></div></section>`:""}${orderedSections}${remaining}</div>`);
  bindHero(slides.length);
  bindHomeRails();
}

function companyName(){return state.appearance?.company?.site_name_ar||"رداء الحشمة";}

function responsiveBanner(banner, priority = false) {
  const desktop = banner.desktop_image_url || banner.mobile_image_url || "";
  const mobile = banner.mobile_image_url || desktop;
  return `<picture><source media="(max-width:760px)" srcset="${esc(mobile)}" /><img src="${esc(desktop)}" alt="${esc(banner.title_ar || companyName())}" loading="${priority ? "eager" : "lazy"}" decoding="async" ${priority ? 'fetchpriority="high"' : ""} /></picture>`;
}

function renderPromoBanner(section) {
  if (!section.desktop_image_url && !section.mobile_image_url) return "";
  return `<section class="promo-band"><a href="${esc(section.link_url || "/products")}">${responsiveBanner(section)}</a></section>`;
}

function bindHero(count) {
  if(count<2)return;
  let current=0;
  const show=index=>{current=index;document.querySelectorAll("[data-slide]").forEach(el=>{const active=Number(el.dataset.slide)===current;el.classList.toggle("active",active);el.inert=!active;});document.querySelectorAll("[data-hero-dot]").forEach(el=>{const active=Number(el.dataset.heroDot)===current;el.classList.toggle("active",active);el.setAttribute("aria-pressed",String(active));});};
  show(0);
  document.querySelectorAll("[data-hero-dot]").forEach(button=>button.onclick=()=>show(Number(button.dataset.heroDot)));
  const hero=document.querySelector(".hero");
  let touchStart=null;
  hero.addEventListener("touchstart",event=>{
    if(event.touches.length!==1){touchStart=null;return;}
    const touch=event.touches[0];
    touchStart={x:touch.clientX,y:touch.clientY,time:Date.now()};
  },{passive:true});
  hero.addEventListener("touchend",event=>{
    if(!touchStart||event.changedTouches.length!==1){touchStart=null;return;}
    const touch=event.changedTouches[0];
    const deltaX=touch.clientX-touchStart.x;
    const deltaY=touch.clientY-touchStart.y;
    const elapsed=Date.now()-touchStart.time;
    touchStart=null;
    if(elapsed>900||Math.abs(deltaX)<42||Math.abs(deltaX)<=Math.abs(deltaY)*1.15)return;
    event.preventDefault();
    show((current+(deltaX<0?1:-1)+count)%count);
  },{passive:false});
  hero.addEventListener("touchcancel",()=>{touchStart=null;},{passive:true});
  let paused=false;
  hero.addEventListener("pointerenter",()=>paused=true);
  hero.addEventListener("pointerleave",()=>paused=false);
  const timer=setInterval(()=>{
    if(!hero.isConnected){clearInterval(timer);return;}
    if(!paused&&!document.hidden&&!hero.contains(document.activeElement)&&!matchMedia("(prefers-reduced-motion: reduce)").matches)show((current+1)%count);
  },5500);
}

function filteredProducts() {
  let rows=[...state.products];
  if(state.category) rows=rows.filter(product=>String(product.category_slug||product.category?.slug)===state.category || (product.categories||[]).some(item=>String(item.slug)===state.category));
  if(Number.isFinite(state.maxPrice)) rows=rows.filter(product=>productPrice(product)<=state.maxPrice);
  if(state.sort==="price-asc") rows.sort((a,b)=>productPrice(a)-productPrice(b));
  if(state.sort==="price-desc") rows.sort((a,b)=>productPrice(b)-productPrice(a));
  if(state.sort==="name") rows.sort((a,b)=>(a.name_ar||"").localeCompare(b.name_ar||"","ar"));
  return rows;
}

function renderProducts() {
  const allPrices=state.products.map(productPrice);
  const maxCatalog=Math.ceil(Math.max(...allPrices,100)/10)*10;
  if(!Number.isFinite(state.maxPrice))state.maxPrice=maxCatalog;
  const rows=filteredProducts();
  const perPage=12;
  const pages=Math.max(1,Math.ceil(rows.length/perPage));
  state.page=Math.min(state.page,pages);
  const visible=rows.slice((state.page-1)*perPage,state.page*perPage);
  const visibleBundles=state.page===1&&!state.category?state.bundles:[];
  shell(`${breadcrumbs("المتجر")}<section class="container"><div class="shop-head"><h1>المتجر</h1></div><div class="shop-layout"><div><div class="shop-toolbar"><div class="view-tools"><button class="view-button active">${icon("grid-3x3",19)}</button><button class="view-button">${icon("list",19)}</button><button class="mobile-filter-button mobile-only" id="mobileFilter">${icon("sliders-horizontal",17)}فلترة</button></div><div class="sort-tools"><label>الترتيب الافتراضي</label><select class="store-select" id="sortProducts"><option value="default">الترتيب الافتراضي</option><option value="price-asc">السعر: من الأقل للأعلى</option><option value="price-desc">السعر: من الأعلى للأقل</option><option value="name">الاسم</option></select></div></div>${visibleBundles.length?`<div class="bundle-shop-heading"><span>وفر أكثر</span><h2>بندلز مختارة لك</h2></div>`:""}<div class="product-grid shop-grid">${visibleBundles.map(bundleCard).join("")}${visible.map(productCard).join("")}</div>${visible.length?`<div class="pagination">${Array.from({length:pages},(_,index)=>`<button class="page-button ${index+1===state.page?"active":""}" data-page="${index+1}">${index+1}</button>`).join("")}</div>`:`<div class="no-results"><div><h2>لا توجد منتجات</h2><p>جرّبي اختيار تصنيف أو سعر مختلف.</p></div></div>`}</div>${filterHtml(maxCatalog)}</div></section>`);
  document.getElementById("sortProducts").value=state.sort;
  document.getElementById("sortProducts").onchange=event=>{state.sort=event.target.value;state.page=1;renderProducts();};
  document.querySelectorAll("[data-page]").forEach(button=>button.onclick=()=>{state.page=Number(button.dataset.page);renderProducts();scrollTo({top:0,behavior:"smooth"});});
  bindFilters();
}

function filterHtml(maxCatalog) {
  return `<aside class="filter-sidebar" id="filterSidebar"><div class="mobile-filter-close mobile-only"><button class="close-button" id="closeFilter">${icon("x")}</button></div><section class="filter-panel"><h2 class="filter-title">تصنيفات المنتج</h2><div class="filter-list"><button class="${!state.category?"active":""}" data-category="">كل المنتجات</button>${state.categories.map(category=>`<button class="${state.category===category.slug?"active":""}" data-category="${esc(category.slug)}">${esc(category.name_ar)}</button>`).join("")}</div></section><section class="filter-panel"><h2 class="filter-title">الفرز بالسعر</h2><input class="price-range" id="maxPrice" type="range" min="0" max="${maxCatalog}" step="5" value="${state.maxPrice}" /><div class="price-filter-copy"><span>السعر: 0 - <b id="maxPriceCopy">${money(state.maxPrice)}</b></span><button class="filter-apply" id="applyPrice">تصفية</button></div></section></aside>`;
}

function bindFilters() {
  document.querySelectorAll("[data-category]").forEach(button=>button.onclick=()=>{state.category=button.dataset.category;state.page=1;const url=state.category?`/products?category=${encodeURIComponent(state.category)}`:"/products";history.replaceState(null,"",url);renderProducts();});
  const range=document.getElementById("maxPrice");
  range.oninput=()=>document.getElementById("maxPriceCopy").innerHTML=money(range.value);
  document.getElementById("applyPrice").onclick=()=>{state.maxPrice=Number(range.value);state.page=1;renderProducts();};
  const sidebar=document.getElementById("filterSidebar");
  document.getElementById("mobileFilter")?.addEventListener("click",()=>{sidebar.classList.add("mobile-open");document.body.classList.add("is-locked");});
  document.getElementById("closeFilter")?.addEventListener("click",()=>{sidebar.classList.remove("mobile-open");document.body.classList.remove("is-locked");});
}

function variantLabel(variant) {
  return [variant.color,variant.value].filter(Boolean).join(" / ");
}

function updateVariantUrl(variant) {
  const url = new URL(location.href);
  if (variant?.id != null) url.searchParams.set("variant", variant.id);
  else url.searchParams.delete("variant");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function reviewSetting(settings, keys, fallback) {
  for (const key of keys) if (settings?.[key] !== undefined && settings?.[key] !== null) return settings[key] !== false;
  return fallback;
}

function reviewCount(summary = {}) {
  return Number(summary.count ?? summary.total_reviews ?? summary.review_count ?? 0);
}

function reviewAverage(summary = {}) {
  return Math.max(0, Math.min(5, Number(summary.average ?? summary.average_rating ?? summary.rating ?? 0)));
}

function starRating(rating, label = "") {
  const value=Math.max(0,Math.min(5,Number(rating||0)));
  return `<span class="review-stars" role="img" aria-label="${esc(label||`${value.toFixed(1)} من 5 نجوم`)}"><span aria-hidden="true">${Array.from({length:5},(_,index)=>{const fill=value-index;return `<span class="${fill>=1?"filled":fill>=0.25?"half":""}">★</span>`;}).join("")}</span></span>`;
}

function reviewDate(value) {
  if(!value)return "";
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"":new Intl.DateTimeFormat("ar-SA",{year:"numeric",month:"long",day:"numeric"}).format(date);
}

function distributionCount(summary, rating) {
  const rows=summary?.distribution || summary?.rating_distribution || {};
  if(Array.isArray(rows)){
    const row=rows.find(item=>Number(item.rating??item.stars)===rating);
    return Number(row?.count||0);
  }
  return Number(rows[rating] ?? rows[String(rating)] ?? summary?.[`rating_${rating}`] ?? 0);
}

function renderReviewRows(reviews = []) {
  if(!reviews.length)return `<div class="reviews-empty"><div class="reviews-empty-mark">${icon("message-square",25)}</div><div><div class="reviews-empty-stars" aria-hidden="true">★★★★★</div><strong>لا توجد تقييمات للعملاء بعد</strong><p>يمكنك أن تكون أول من يشارك تجربته مع هذا المنتج.</p></div></div>`;
  return reviews.map(review=>{
    if(review.helpful_by_current_guest===true)state.helpfulReviews.add(String(review.id));
    const verified=review.verified_purchase===true||review.is_verified_purchase===true||review.verified===true;
    const helpful=Number(review.helpful_count||review.helpful||0);
    return `<article class="customer-review">
      <header><div class="review-author"><span class="review-avatar" aria-hidden="true">${esc(String(review.display_name||review.customer_name||review.name||"ع").trim().charAt(0)||"ع")}</span><div><strong>${esc(review.display_name||review.customer_name||review.name||"عميل المتجر")}</strong>${verified?`<span class="verified-purchase">${icon("badge-check",14)}عملية شراء موثقة</span>`:""}</div></div><time datetime="${esc(review.published_at||review.created_at||review.date||"")}">${esc(reviewDate(review.published_at||review.created_at||review.date))}</time></header>
      ${starRating(review.rating,`تقييم ${Number(review.rating||0)} من 5 نجوم`)}
      <p>${esc(review.comment||review.review||review.content||"")}</p>
      <button class="helpful-review ${state.helpfulReviews.has(String(review.id))?"is-done":""}" type="button" data-helpful-review="${esc(review.id)}" ${state.helpfulReviews.has(String(review.id))?"disabled":""}>${icon("thumbs-up",15)}<span>${state.helpfulReviews.has(String(review.id))?"شكرًا لك":"هل كان مفيدًا؟"}</span><small>${helpful}</small></button>
    </article>`;
  }).join("");
}

function renderStoreRecommendations(recommendations = []) {
  if(!recommendations.length)return "";
  const english=document.documentElement.lang==="en";
  return `<section class="store-recommendations" aria-labelledby="storeRecommendationsTitle"><header class="review-section-heading"><span>${icon("sparkles",18)}${english?"Store pick":"اختيار من المتجر"}</span><h3 id="storeRecommendationsTitle">${english?"Store team recommendation":"توصية فريق المتجر"} <small>${english?"توصية فريق المتجر":"Store Team Recommendation"}</small></h3><p>${english?"Editorial guidance written by the store team to help you choose.":"ملاحظات تحريرية مقدمة من فريق المتجر لمساعدتك في الاختيار."}</p></header><div class="store-recommendation-list">${recommendations.map(item=>`<article class="store-recommendation"><div class="store-recommendation-mark">${icon("quote",20)}</div><div>${item.rating?starRating(item.rating,english?"Store team rating":"تقييم فريق المتجر"):""}<p>${esc((english?item.body_en:item.body_ar)||item.body_ar||item.body_en||item.comment||item.recommendation||item.content||item.text||"")}</p><footer><strong>${esc((english?item.author_name_en:item.author_name_ar)||item.author_name_ar||item.author_name_en||item.author_name||item.author||item.display_name||(english?"Store Team":"فريق رداء الحشمة"))}</strong><span>${english?"By the store team":"من فريق المتجر"}</span></footer></div></article>`).join("")}</div></section>`;
}

function reviewSubmitError(message="") {
  if(message.includes("already submitted")||message.includes("already has a verified review"))return "تم إرسال تقييم لهذا المنتج أو الطلب من قبل.";
  if(message.includes("Too many review submissions"))return "تم الوصول إلى حد الإرسال مؤقتًا. حاول مرة أخرى لاحقًا.";
  if(message.includes("not accepting")||message.includes("Reviews are disabled"))return "إضافة التقييمات متوقفة حاليًا لهذا المنتج.";
  return message||"تعذر إرسال التقييم الآن.";
}

function reviewForm(productId) {
  const customer=state.customer;
  return `<section class="product-review-form" aria-labelledby="writeReviewTitle"><header class="review-section-heading"><span>شارك تجربتك</span><h3 id="writeReviewTitle">أضف تقييمك</h3><p>${customer?"سيتم التحقق من الشراء تلقائيًا من طلبات حسابك المكتملة.":"يمكنك إضافة بيانات الطلب للتحقق من الشراء، ولن تظهر بيانات التواصل للعملاء."}</p></header><form id="productReviewForm">
    <fieldset class="review-rating-field"><legend>تقييمك <span>*</span></legend><div class="review-rating-picker" role="radiogroup" aria-label="اختر تقييمًا من خمس نجوم">${[1,2,3,4,5].map(value=>`<button type="button" data-review-rating="${value}" role="radio" aria-checked="false" tabindex="${value===1?0:-1}" aria-label="${value} من 5 نجوم">★</button>`).join("")}</div><input type="hidden" name="rating" id="reviewRatingValue" required /></fieldset>
    ${customer?`<div class="review-signed-user">${icon("user-round",18)}<div><span>سيظهر التقييم باسم</span><strong>${esc(customer.name)}</strong></div></div>`:""}
    <div class="review-form-grid">${customer?"":`<label><span>الاسم <b>*</b></span><input name="display_name" required maxlength="80" autocomplete="name" /></label>`}<label class="full"><span>التعليق <b>*</b></span><textarea name="comment" required minlength="10" maxlength="1500" rows="5" placeholder="اكتب تجربتك مع المنتج بوضوح..."></textarea></label></div>
    ${customer?"":`<details class="review-verification-fields"><summary>التحقق من الشراء <span>اختياري</span></summary><div class="review-form-grid"><label><span>رقم الطلب</span><input name="order_id" inputmode="numeric" autocomplete="off" /></label><label><span>البريد الإلكتروني</span><input name="email" type="email" autocomplete="email" /></label><label><span>رقم الجوال</span><input name="phone" type="tel" autocomplete="tel" /></label></div></details>`}
    <div class="review-form-actions"><button class="primary-button" id="submitProductReview" type="submit">${icon("send",17)}إرسال التقييم</button><p id="reviewFormMessage" role="status"></p></div>
  </form></section>`;
}

function bindReviewInteractions(product) {
  const productId=product.id;
  document.querySelectorAll("[data-helpful-review]").forEach(button=>button.onclick=async()=>{
    const id=button.dataset.helpfulReview;if(!id||state.helpfulReviews.has(id))return;
    button.disabled=true;
    try{await api(`/api/store/reviews/${encodeURIComponent(id)}/helpful`,{method:"POST"});state.helpfulReviews.add(id);button.classList.add("is-done");button.querySelector("span").textContent="شكرًا لك";const count=button.querySelector("small");count.textContent=String(Number(count.textContent||0)+1);}catch(error){button.disabled=false;toast(error.message);}
  });
  const form=document.getElementById("productReviewForm");if(!form)return;
  const ratingInput=document.getElementById("reviewRatingValue");
  const ratingButtons=[...form.querySelectorAll("[data-review-rating]")];
  const setRating=(value,focus=false)=>{ratingInput.value=String(value);ratingButtons.forEach(item=>{const current=Number(item.dataset.reviewRating);item.classList.toggle("selected",current<=value);item.setAttribute("aria-checked",String(current===value));item.tabIndex=current===value?0:-1;});if(focus)ratingButtons.find(item=>Number(item.dataset.reviewRating)===value)?.focus();};
  ratingButtons.forEach(button=>{button.onclick=()=>setRating(Number(button.dataset.reviewRating));button.onkeydown=event=>{if(!["ArrowRight","ArrowUp","ArrowLeft","ArrowDown"].includes(event.key))return;event.preventDefault();const step=["ArrowRight","ArrowUp"].includes(event.key)?1:-1;setRating(Math.max(1,Math.min(5,Number(button.dataset.reviewRating)+step)),true);};});
  form.onsubmit=async event=>{
    event.preventDefault();const message=document.getElementById("reviewFormMessage");
    if(!ratingInput.value){message.className="error";message.textContent="اختر عدد النجوم أولًا.";ratingButtons[0]?.focus();return;}
    if(!form.reportValidity())return;
    const button=document.getElementById("submitProductReview");const values=Object.fromEntries(new FormData(form));values.rating=Number(values.rating);Object.keys(values).forEach(key=>{if(values[key]==="")delete values[key];});button.disabled=true;message.className="";message.textContent="جاري إرسال تقييمك...";
    try{const result=await api(`/api/store/products/${encodeURIComponent(productId)}/reviews`,{method:"POST",body:JSON.stringify(values)});form.reset();ratingInput.value="";ratingButtons.forEach((item,index)=>{item.classList.remove("selected");item.setAttribute("aria-checked","false");item.tabIndex=index===0?0:-1;});message.className="success";message.textContent="شكرًا لك. استلمنا تقييمك.";button.innerHTML=`${icon("check",17)}تم إرسال التقييم`;hydrateIcons();if(result.status==="published")loadProductReviews(product);}catch(error){button.disabled=false;message.className="error";message.textContent=reviewSubmitError(error.message);hydrateIcons();}
  };
}

function loadExternalScript(src,key){if(document.querySelector(`script[data-payment-widget="${key}"]`))return Promise.resolve();return new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=src;script.async=true;script.dataset.paymentWidget=key;script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});}

function paymentWidgetContext() {
  return {
    language:document.documentElement.lang==="en"?"en":"ar",
    country:String(state.market?.settings?.default_country_code||state.market?.countries?.find(item=>item.is_active)?.code||"SA").toUpperCase(),
    currency:String(state.currencies?.base_currency||state.market?.currency?.base_currency||"SAR").toUpperCase()
  };
}

function paymentAmountAllowed(config,amount,context) {
  if(!config||!config.public_key||!Number.isFinite(amount)||amount<=0)return false;
  if(config.supported_countries?.length&&!config.supported_countries.includes(context.country))return false;
  if(config.supported_currencies?.length&&!config.supported_currencies.includes(context.currency))return false;
  if(amount<Number(config.minimum_amount||0))return false;
  return config.maximum_amount===null||config.maximum_amount===undefined||config.maximum_amount===""||amount<=Number(config.maximum_amount);
}

async function renderTamaraProductWidget(root,tamara,amount,context) {
  window.tamaraWidgetConfig={
    lang:context.language,
    country:context.country,
    publicKey:tamara.public_key,
    css:":host { --font-primary: inherit !important; --font-secondary: inherit !important; }",
    style:{fontSize:"14px",badgeRatio:1.2}
  };
  const box=document.createElement("div");
  box.className="installment-widget tamara-installment-widget";
  const widget=document.createElement("tamara-widget");
  widget.id="tamaraProductWidget";
  widget.setAttribute("type","tamara-summary");
  widget.setAttribute("amount",amount.toFixed(2));
  widget.setAttribute("currency",context.currency);
  widget.setAttribute("inline-type","2");
  widget.setAttribute("config",JSON.stringify({badgePosition:context.language==="ar"?"right":"left",showExtraContent:""}));
  box.appendChild(widget);
  root.appendChild(box);
  try{await loadExternalScript("https://cdn.tamara.co/widget-v2/tamara-widget.js","tamara");}catch{box.remove();}
}

async function renderInstallmentWidgets(product,price){
  const root=document.getElementById("productPaymentWidgets");if(!root)return;
  const methods=state.paymentMethods?.methods||[];
  const widgets=state.paymentMethods?.widgets;
  const tabby=methods.find(item=>item.id==="tabby"&&item.public_key);
  const tamara=widgets?widgets.tamara:methods.find(item=>item.id==="tamara"&&item.public_key);
  const amount=Number(price||0),context=paymentWidgetContext();
  root.innerHTML="";root.hidden=false;
  if(tabby&&paymentAmountAllowed(tabby,amount,context)){
    const box=document.createElement("div");box.id="tabbyPromoWidget";box.className="installment-widget";root.appendChild(box);
    try{await loadExternalScript("https://checkout.tabby.ai/tabby-promo.js","tabby");window.TabbyPromo?.({selector:"#tabbyPromoWidget",currency:context.currency,price:amount.toFixed(2),lang:context.language,publicKey:tabby.public_key,merchantCode:tabby.merchant_code||context.country});}catch{box.remove();}
  }
  if(paymentAmountAllowed(tamara,amount,context))await renderTamaraProductWidget(root,tamara,amount,context);
  root.hidden=!root.children.length;
}

async function renderCheckoutPaymentWidgets(amount){
  const methods=state.paymentMethods?.methods||[],widgets=state.paymentMethods?.widgets||{},context=paymentWidgetContext(),total=Number(amount||0);
  const tamara=widgets.tamara||methods.find(item=>item.id==="tamara"&&item.public_key),tamaraRoot=document.getElementById("checkout-tamara-widget");
  if(tamaraRoot){tamaraRoot.innerHTML="";if(paymentAmountAllowed(tamara,total,context))await renderTamaraProductWidget(tamaraRoot,tamara,total,context);}
  const tabby=methods.find(item=>item.id==="tabby"&&item.public_key),tabbyRoot=document.getElementById("checkout-tabby-widget");
  if(tabbyRoot){tabbyRoot.innerHTML="";if(paymentAmountAllowed(tabby,total,context)){try{await loadExternalScript("https://checkout.tabby.ai/tabby-promo.js","tabby");window.TabbyPromo?.({selector:"#checkout-tabby-widget",currency:context.currency,price:total.toFixed(2),lang:context.language,publicKey:tabby.public_key,merchantCode:tabby.merchant_code||context.country});}catch{tabbyRoot.innerHTML="";}}}
  observeCheckoutPaymentWidgetHeights();
}

let checkoutPaymentHeightObserver;
function syncCheckoutPaymentWidgetHeights(){
  const group=document.querySelector(".checkout-payment-methods");if(!group)return;
  const heights=[...group.querySelectorAll("#checkout-tamara-widget,#checkout-tabby-widget")].map(root=>Math.max(root.scrollHeight,root.getBoundingClientRect().height));
  group.style.setProperty("--checkout-payment-height",`${Math.ceil(Math.max(96,...heights))}px`);
}
function observeCheckoutPaymentWidgetHeights(){
  checkoutPaymentHeightObserver?.disconnect();
  const roots=[...document.querySelectorAll("#checkout-tamara-widget,#checkout-tabby-widget")];
  if("ResizeObserver" in window){checkoutPaymentHeightObserver=new ResizeObserver(syncCheckoutPaymentWidgetHeights);roots.forEach(root=>checkoutPaymentHeightObserver.observe(root));}
  [0,250,900].forEach(delay=>setTimeout(syncCheckoutPaymentWidgetHeights,delay));
}
async function loadProductReviews(product) {
  const root=document.getElementById("productReviewsRoot");if(!root)return;
  try{
    const data=await api(`/api/store/products/${encodeURIComponent(product.id)}/reviews`);
    if(!document.getElementById("productReviewsRoot")||String(document.getElementById("productReviewsRoot").dataset.productId)!==String(product.id))return;
    const settings=data.settings||{};const summary=data.summary||data.aggregate||{};const reviews=Array.isArray(data.reviews)?data.reviews:[];const recommendations=Array.isArray(data.recommendations)?data.recommendations:[];
    const enabled=reviewSetting(settings,["reviews_enabled","show_reviews","enabled"],true);
    const accepting=reviewSetting(settings,["accepting_reviews","allow_reviews","allow_new_reviews"],true);
    const showSummary=reviewSetting(settings,["show_rating_summary"],true)&&summary.hidden!==true;const count=reviewCount(summary);const average=reviewAverage(summary);
    const titleSummary=document.getElementById("productRatingSummary");
    if(titleSummary&&enabled&&showSummary&&count>0){titleSummary.hidden=false;titleSummary.innerHTML=`${starRating(average)}<a href="#productReviewsRoot"><strong>${average.toFixed(1)}</strong><span>${count} تقييم</span></a>`;}
    const social=document.getElementById("productSalesProof");const rawLabel=data.social_proof?.display_label??data.social_proof?.label;const label=typeof rawLabel==="object"?(rawLabel?.ar||rawLabel?.en||""):rawLabel;
    if(social&&data.social_proof?.visible===true&&reviewSetting(settings,["show_sales"],false)&&label){social.hidden=false;social.innerHTML=`${icon("trending-up",16)}<span>${esc(label)}</span>`;}
    if(!enabled){root.remove();hydrateIcons();return;}
    const total=showSummary?Math.max(count,reviews.length):reviews.length;root.innerHTML=`<div class="product-reviews-layout"><section class="reviews-overview" aria-labelledby="customerReviewsTitle"><header class="review-section-heading"><span>آراء العملاء</span><h2 id="customerReviewsTitle">تقييمات المنتج</h2></header>${showSummary?`<div class="rating-overview"><div class="rating-score"><strong>${average.toFixed(1)}</strong>${starRating(average)}<span>بناءً على ${total} تقييم</span></div><div class="rating-distribution">${[5,4,3,2,1].map(rating=>{const value=distributionCount(summary,rating);const percentage=total?Math.min(100,Math.round(value/total*100)):0;return `<div><span>${rating} ★</span><i aria-hidden="true"><b style="width:${percentage}%"></b></i><small>${value}</small></div>`;}).join("")}</div></div>`:""}<div class="customer-review-list">${renderReviewRows(reviews)}</div></section>${renderStoreRecommendations(recommendations)}${accepting?reviewForm(product.id):""}</div>`;
    bindReviewInteractions(product);hydrateIcons();
  }catch(error){root.innerHTML=`<div class="reviews-load-error">${icon("circle-alert",20)}<div><strong>تعذر تحميل التقييمات الآن</strong><p>يمكنك متابعة تصفح المنتج والمحاولة لاحقًا.</p></div><button type="button" id="retryProductReviews">إعادة المحاولة</button></div>`;document.getElementById("retryProductReviews").onclick=()=>{root.innerHTML=`<div class="reviews-loading"><span></span><span></span><span></span></div>`;loadProductReviews(product);};hydrateIcons();}
}

function renderProduct(product) {
  const variants=activeVariants(product);
  const requestedVariantId=new URLSearchParams(location.search).get("variant");
  let selectedVariant=variants.find((variant)=>String(variant.id)===String(requestedVariantId)) || variants.find(variantInStock) || variants[0] || null;
  let selectedColor=selectedVariant?.color || "";
  let selectedValue=selectedVariant?.value || "";
  let quantity=1;
  const images=productImages(product);
  const initialImage=selectedVariant?.image_url || images[0] || product.main_photo_url;
  shell(`${breadcrumbs(product.name_ar)}<section class="container product-page"><div class="product-detail"><div class="product-gallery"><div class="gallery-thumbs" id="galleryThumbs">${images.map((src)=>`<button class="gallery-thumb ${src===initialImage?"active":""}" data-gallery-src="${esc(src)}"><img src="${esc(src)}" alt="" /></button>`).join("")}</div><div class="gallery-main"><img id="mainProductImage" src="${esc(initialImage)}" alt="${esc(product.name_ar)}" /><button class="zoom-hint" id="zoomProduct" aria-label="تكبير">${icon("maximize-2")}</button></div></div><div class="product-summary"><div class="product-meta">${esc(productCategoryName(product))}</div><h1>${esc(product.name_ar)}</h1><div class="product-rating-summary" id="productRatingSummary" hidden></div><div class="price detail-price" id="detailPrice"></div><div id="productPaymentWidgets" class="product-payment-widgets"></div><p class="short-description">${esc(product.short_description_ar||product.description_ar||"")}</p><div id="variantControls"></div><p class="variant-stock-state" id="variantStockState" role="status" hidden>${icon("circle-alert",17)}نفدت كمية هذا الاختيار</p><div class="purchase-row"><div class="quantity-control"><button id="qtyPlus" aria-label="زيادة الكمية">+</button><strong id="qtyValue">1</strong><button id="qtyMinus" aria-label="تقليل الكمية">−</button></div><button class="primary-button" id="addProduct">${icon("shopping-cart")}إضافة إلى السلة</button></div><button class="secondary-button buy-now" id="buyNow">اشتري الآن</button><div class="product-sales-proof" id="productSalesProof" hidden></div><div class="product-trust"><span>${icon("shield-check",18)}دفع آمن وبيانات محمية</span><span>${icon("badge-check",18)}منتج أصلي من رداء الحشمة</span></div></div></div><section class="detail-description"><h2>وصف المنتج</h2><p>${esc(product.description_ar||product.short_description_ar||"")}</p></section><section class="product-reviews-root" id="productReviewsRoot" data-product-id="${esc(product.id)}" aria-live="polite"><div class="reviews-loading" aria-label="جاري تحميل التقييمات"><span></span><span></span><span></span></div></section></section><section class="section soft"><div class="container"><div class="section-head"><h2>منتجات قد تعجبك</h2></div><div class="product-grid">${state.products.filter(item=>item.id!==product.id).slice(0,4).map(productCard).join("")}</div></div></section>`);
  const currentVariant=()=>selectedVariant || variants.find(variant=>(!selectedColor||variant.color===selectedColor)&&(!selectedValue||variant.value===selectedValue)) || variants.find(variant=>!selectedColor||variant.color===selectedColor) || variants[0] || null;
  const update=()=>{
    const colorRows=uniqueColors(product);
    const valueRows=variants.filter(variant=>!selectedColor||variant.color===selectedColor);
    const values=[...new Set(valueRows.map(variant=>variant.value).filter(Boolean))];
    if(values.length&&!values.includes(selectedValue))selectedValue=valueRows.find(variantInStock)?.value||values[0];
    if(!values.length)selectedValue="";
    const variant=currentVariant();
    document.getElementById("variantControls").innerHTML=`${colorRows.length?`<div class="variant-group"><div class="variant-group-title"><span>اللون</span><small>${esc(selectedColor)}</small></div><div class="variant-options">${colorRows.map(color=>{const unavailable=!variants.some(row=>row.color===color.name&&variantInStock(row));return `<button class="color-option ${color.name===selectedColor?"selected":""} ${unavailable?"is-out-of-stock":""}" style="--color:${esc(color.hex)}" title="${esc(color.name)}${unavailable?" - نفدت الكمية":""}" aria-label="${esc(color.name)}${unavailable?" - نفدت الكمية":""}" aria-pressed="${color.name===selectedColor}" data-select-color="${esc(color.name)}"><span class="color-chip" aria-hidden="true"></span><span>${esc(color.name)}</span>${unavailable?`<small>نفد</small>`:""}</button>`;}).join("")}</div></div>`:""}${values.length?`<div class="variant-group"><div class="variant-group-title"><span>${esc(variant?.option||"الاختيار")}</span><small>${esc(selectedValue)}</small></div><div class="variant-options">${values.map(value=>{const unavailable=!valueRows.some(row=>row.value===value&&variantInStock(row));return `<button class="text-option ${value===selectedValue?"selected":""} ${unavailable?"is-out-of-stock":""}" aria-label="${esc(value)}${unavailable?" - نفدت الكمية":""}" aria-pressed="${value===selectedValue}" data-select-value="${esc(value)}"><span>${esc(value)}</span>${unavailable?`<small>نفد</small>`:""}</button>`;}).join("")}</div></div>`:""}`;
    const price=variantPrice(product,variant);const compare=variant?.compare_at_price!==null&&variant?.compare_at_price!==undefined?Number(variant.compare_at_price):comparePrice(product);document.getElementById("detailPrice").innerHTML=`${compare>price?`<del>${money(compare)}</del>`:""}<strong>${money(price)}</strong>`;renderInstallmentWidgets(product,price);
    const unavailable=Boolean(variant&&!variantInStock(variant)),stockState=document.getElementById("variantStockState"),addButton=document.getElementById("addProduct"),buyButton=document.getElementById("buyNow");
    stockState.hidden=!unavailable;addButton.disabled=unavailable;buyButton.disabled=unavailable;addButton.innerHTML=unavailable?`${icon("circle-x",18)}نفدت الكمية`:`${icon("shopping-cart")}إضافة إلى السلة`;buyButton.textContent=unavailable?"هذا الاختيار غير متاح":"اشتري الآن";
    if(variant?.image_url){document.getElementById("mainProductImage").src=variant.image_url;document.querySelectorAll(".gallery-thumb").forEach(btn=>btn.classList.toggle("active",btn.dataset.gallerySrc===variant.image_url));}
    updateVariantUrl(variant);
    document.querySelectorAll("[data-select-color]").forEach(button=>button.onclick=()=>{selectedVariant=null;selectedColor=button.dataset.selectColor;update();[...document.querySelectorAll("[data-select-color]")].find(el=>el.dataset.selectColor===selectedColor)?.focus({preventScroll:true});});
    document.querySelectorAll("[data-select-value]").forEach(button=>button.onclick=()=>{selectedVariant=null;selectedValue=button.dataset.selectValue;update();[...document.querySelectorAll("[data-select-value]")].find(el=>el.dataset.selectValue===selectedValue)?.focus({preventScroll:true});});
    hydrateIcons();
  };
  update();
  document.querySelectorAll("[data-gallery-src]").forEach(button=>button.onclick=()=>{document.getElementById("mainProductImage").src=button.dataset.gallerySrc;document.querySelectorAll(".gallery-thumb").forEach(item=>item.classList.toggle("active",item===button));});
  document.getElementById("zoomProduct").onclick=()=>openOverlay(`<div class="lightbox"><button class="close-button" data-overlay-close>${icon("x")}</button><img src="${esc(document.getElementById("mainProductImage").src)}" alt="" /></div>`);
  document.getElementById("qtyPlus").onclick=()=>{quantity+=1;document.getElementById("qtyValue").textContent=quantity;};
  document.getElementById("qtyMinus").onclick=()=>{quantity=Math.max(1,quantity-1);document.getElementById("qtyValue").textContent=quantity;};
  document.getElementById("addProduct").onclick=()=>{const variant=currentVariant();if(variant&&!variantInStock(variant)){toast("نفدت كمية هذا الاختيار");return;}addToCart(product,variant,quantity);};
  document.getElementById("buyNow").onclick=()=>{const variant=currentVariant();if(variant&&!variantInStock(variant)){toast("نفدت كمية هذا الاختيار");return;}addToCart(product,variant,quantity,false);location.href="/cart";};
  hydrateIcons();
  loadProductReviews(product);
}

function renderCollection(collection) {
  const rows=collectionItems(collection).filter((item)=>collectionItemData(item,collection));
  const name=collection.name_ar||collection.name_en||"مجموعة مختارة";
  const description=collection.description_ar||collection.description_en||"";
  const cover=collection.cover_image_url||collection.image_url||"";
  shell(`${breadcrumbs(name)}<main class="collection-page"><header class="collection-hero ${cover?"has-cover":""}">${cover?`<img src="${esc(cover)}" alt="${esc(name)}" />`:""}<div class="container collection-hero-copy"><span>Collection</span><h1>${esc(name)}</h1>${description?`<p>${esc(description)}</p>`:""}<small>${rows.length} ${rows.length===1?"اختيار":"اختيارات"}</small></div></header><section class="container collection-catalog"><div class="collection-catalog-head"><div><span>مختارة لك</span><h2>منتجات المجموعة</h2></div><p>كل بطاقة تفتح المنتج على اللون والاختيار المحددين للمجموعة.</p></div>${rows.length?`<div class="product-grid collection-grid">${rows.map((item)=>collectionItemCard(item,collection)).join("")}</div>`:`<div class="collection-empty"><h2>لا توجد اختيارات متاحة حاليًا</h2><p>يمكنك متابعة باقي منتجات المتجر.</p><a class="primary-button" href="/products">تصفح المنتجات</a></div>`}</section></main>`);
}

function renderStoreRoute() {
  const path=location.pathname.replace(/\/$/,"")||"/";
  if(path==="/")renderHome();
  else if(path==="/products"||path==="/shop")renderProducts();
  else if(path.startsWith("/product/")){const id=decodeURIComponent(path.split("/").pop());const product=state.products.find(item=>String(item.id)===id||item.slug===id);product?renderProduct(product):renderNotFound();}
  else if(path.startsWith("/collection/")){const slug=decodeURIComponent(path.split("/").pop());const collection=state.collections.find(item=>String(item.id)===slug||item.slug===slug);collection?renderCollection(collection):renderNotFound();}
  else if(path.startsWith("/bundle/")){const id=decodeURIComponent(path.split("/").pop());const bundle=state.bundles.find(item=>String(item.id)===id||item.slug===id);bundle?renderBundle(bundle):renderNotFound();}
  else if(path==="/cart")renderCart(false);
  else if(path==="/checkout")renderCart(true);
  else if(path.startsWith("/payment/tamara/"))renderTamaraReturn(path.split("/").pop());
  else if(path==="/payment/edfapay/return")renderEdfaPayReturn();
  else if(path.startsWith("/payment/tabby/"))renderTabbyReturn(path.split("/").pop());
  else renderNotFound();
}

function renderBundle(bundle) {
  let quantity=1;
  const compare=Number(bundle.compare_at_price||bundle.regular_total||0);
  shell(`${breadcrumbs(bundle.name_ar||"بندل المنتجات")}<section class="container product-page bundle-page"><div class="product-detail"><div class="bundle-main-visual">${bundleVisual(bundle)}</div><div class="product-summary"><div class="product-meta">بندل خاص · ${Number(bundle.item_count||bundle.items?.length||0)} قطع</div><h1>${esc(bundle.name_ar||bundle.name_en)}</h1><div class="price detail-price">${compare>Number(bundle.price)?`<del>${money(compare)}</del>`:""}<strong>${money(bundle.price)}</strong></div>${bundle.savings?`<div class="bundle-saving">وفّري ${money(bundle.savings)} عند شراء المجموعة</div>`:""}<p class="short-description">${esc(bundle.description_ar||"")}</p><div class="purchase-row"><div class="quantity-control"><button id="bundleQtyPlus">+</button><strong id="bundleQtyValue">1</strong><button id="bundleQtyMinus">−</button></div><button class="primary-button" id="addBundle">${icon("shopping-cart")}إضافة البندل للسلة</button></div><button class="secondary-button buy-now" id="buyBundleNow">اشتري الآن</button></div></div><section class="bundle-includes"><div class="section-head center"><h2>البندل يحتوي على</h2></div><div class="bundle-items-row">${(bundle.items||[]).map((item,index)=>`${index?`<span class="bundle-item-plus">+</span>`:""}<a class="bundle-item-card" href="/product/${item.product_id}"><img src="${esc(item.image_url)}" alt="${esc(item.name_ar)}" /><div><span>${item.quantity>1?`${item.quantity} × `:""}منتج #${item.product_id}</span><strong>${esc(item.name_ar||item.name_en)}</strong><small>${money(item.unit_price)}</small></div></a>`).join("")}</div></section>${bundle.description_ar?`<section class="detail-description"><h2>وصف البندل</h2><p>${esc(bundle.description_ar)}</p></section>`:""}</section>`);
  const update=()=>document.getElementById("bundleQtyValue").textContent=quantity;
  document.getElementById("bundleQtyPlus").onclick=()=>{quantity+=1;update();};
  document.getElementById("bundleQtyMinus").onclick=()=>{quantity=Math.max(1,quantity-1);update();};
  document.getElementById("addBundle").onclick=()=>addBundleToCart(bundle,quantity);
  document.getElementById("buyBundleNow").onclick=()=>{addBundleToCart(bundle,quantity,false);location.href="/cart";};
  hydrateIcons();
}

function addBundleToCart(bundle, quantity=1, notify=true) {
  const key=`bundle:${bundle.id}`;
  const item={key,item_type:"bundle",bundle_id:bundle.id,product_id:0,name_ar:bundle.name_ar,name_en:bundle.name_en,image_url:bundle.main_photo_url||bundle.items?.[0]?.image_url||"",bundle_main_photo_url:bundle.main_photo_url||"",variant_label:`${bundle.item_count||bundle.items?.length||0} منتجات`,price:Number(bundle.price||0),quantity:Number(quantity||1),bundle_items:bundle.items||[]};
  const existing=state.cart.find(entry=>entry.key===key);if(existing)existing.quantity+=item.quantity;else state.cart.push(item);
  saveLocalCart();api("/api/cart",{method:"POST",body:JSON.stringify(item)}).catch(()=>{});if(notify)toast("تمت إضافة البندل إلى السلة");
}

async function addToCart(product, variant, quantity = 1, notify = true) {
  if(variant&&!variantInStock(variant)){toast("نفدت كمية هذا الاختيار");return false;}
  const price=variantPrice(product,variant);
  const key=[product.id,variant?.id||"default"].join(":");
  const item={ key, product_id:product.id, variant_id:variant?.id||null, name_ar:product.name_ar, name_en:product.name_en, image_url:variant?.image_url||product.main_photo_url, category_slug:product.category_slug, variant_label:variant?variantLabel(variant):"", colorName:variant?.color||"", optionName:variant?.value||"", price, quantity:Number(quantity||1) };
  const existing=state.cart.find(entry=>entry.key===key);
  if(existing)existing.quantity+=item.quantity;else state.cart.push(item);
  saveLocalCart();
  api("/api/cart",{method:"POST",body:JSON.stringify(item)}).catch(()=>{});
  if(notify)toast("تمت إضافة المنتج إلى السلة");
  return true;
}

function cartTotals() {
  const subtotal=state.cart.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||1),0);
  let discount=null;try{discount=JSON.parse(localStorage.getItem("slyrah_discount")||"null");}catch{}
  const discountAmount=Number(discount?.discount_amount||0);
  const quoted=state.checkoutQuote ? { active:true, amount:Number(state.checkoutQuote.customer_amount||0), base_amount:Number(state.checkoutQuote.base_customer_amount??state.checkoutQuote.customer_amount??0), rule:state.checkoutQuote.rule||null, source:state.checkoutQuote.source } : storefrontShippingQuote(subtotal,discount);
  const promotionFree=Boolean(discount?.free_shipping||discount?.discount?.type==="free_shipping");
  const shipping=promotionFree?{...quoted,amount:0,base_amount:Number(quoted.base_amount??quoted.amount??0),promotion_free:true}:quoted;
  return {subtotal,discount,discountAmount,shipping,total:Math.max(0,subtotal-discountAmount)+shipping.amount};
}

function checkoutShippingPrice(shipping){
  if(Number(shipping?.amount||0)>0)return money(shipping.amount);
  const base=Number(shipping?.base_amount||0);
  return base>0?`<span class="shipping-price-discount"><del>${money(base)}</del><b>مجاني</b></span>`:"مجاني";
}

function appliedPromotionCodes(discount) {
  const rows=Array.isArray(discount?.applied_promotions)?discount.applied_promotions:[];
  return rows.length?rows.map(item=>item.code).filter(Boolean):[discount?.discount?.code||discount?.code].filter(Boolean);
}

function promotionErrorMessage(message="") {
  if(message.includes("INVALID_SAUDI_PHONE"))return "أدخلي رقم جوال سعودي صحيح: 9 أرقام بعد +966 ويبدأ بالرقم 5";
  if(message.includes("Missing checkout fields"))return "راجعي بيانات الاسم والعنوان المطلوبة قبل تأكيد الطلب";
  if(message.includes("PAYMENT_ATTEMPT_EXPIRED"))return "انتهت محاولة الدفع السابقة. اضغطي تأكيد الطلب لبدء محاولة جديدة";
  if(message.includes("PAYMENT_ATTEMPT_CLOSED"))return "محاولة الدفع السابقة مغلقة. راجعي حالة الطلب أو ابدئي محاولة جديدة";
  if(message.includes("PAYMENT_REDIRECT"))return "تم إيقاف التحويل لحمايتك من حلقة إعادة توجيه. حاولي مرة أخرى أو اختاري طريقة دفع أخرى";
  if(message.includes("TAMARA_CUSTOMER_NOT_ELIGIBLE"))return "تمارا غير متاحة لهذا الطلب حاليًا. يمكنك اختيار طريقة دفع أخرى";
  if(message.includes("TAMARA_COUNTRY_OR_CURRENCY_NOT_SUPPORTED"))return "تمارا غير متاحة لدولة أو عملة هذا الطلب";
  if(message.includes("TAMARA_ORDER_AMOUNT_NOT_SUPPORTED"))return "قيمة الطلب خارج الحدود المسموحة للدفع عبر تمارا";
  if(message.includes("TAMARA"))return "تعذر بدء الدفع عبر تمارا الآن. حاولي مرة أخرى أو اختاري الدفع عند الاستلام";
  if(message.includes("EDFAPAY_EMAIL_REQUIRED"))return "البريد الإلكتروني مطلوب للدفع عبر ادفع باي";
  if(message.includes("EDFAPAY_COUNTRY_OR_CURRENCY_NOT_SUPPORTED"))return "ادفع باي غير متاحة لدولة أو عملة هذا الطلب";
  if(message.includes("EDFAPAY_ORDER_AMOUNT_NOT_SUPPORTED"))return "قيمة الطلب خارج الحدود المسموحة للدفع عبر ادفع باي";
  if(message.includes("EDFAPAY"))return "تعذر بدء الدفع عبر ادفع باي الآن. حاولي مرة أخرى أو اختاري طريقة دفع أخرى";
  if(message.includes("TABBY_CUSTOMER_DETAILS_REQUIRED"))return "رقم الجوال والبريد الإلكتروني مطلوبان للدفع عبر تابي";
  if(message.includes("TABBY_COUNTRY_OR_CURRENCY_NOT_SUPPORTED"))return "تابي غير متاحة لدولة أو عملة هذا الطلب";
  if(message.includes("TABBY_ORDER_AMOUNT_NOT_SUPPORTED"))return "قيمة الطلب خارج الحدود المسموحة للدفع عبر تابي";
  if(message.includes("TABBY"))return "تعذر بدء الدفع عبر تابي الآن. حاولي مرة أخرى أو اختاري طريقة دفع أخرى";
  if(message.includes("PROMO_ALREADY_USED"))return "تم استخدام هذا الكود لهذا العميل من قبل";
  if(message.includes("PROMO_CURRENTLY_RESERVED"))return "الكود محجوز حاليًا لطلب آخر";
  if(message.includes("PROMO_FIRST_ORDER_ONLY"))return "هذا العرض متاح لأول طلب فقط";
  if(message.includes("PROMO_GUESTS_NOT_ALLOWED"))return "سجّلي الدخول لاستخدام هذا الكود";
  if(message.includes("PROMO_MANUAL_LIMIT"))return "وصلتِ للحد المسموح من أكواد الخصم";
  if(message.includes("PROMO_EXCLUSIVE_CONFLICT"))return "لا يمكن جمع هذا الكود مع عرض حصري";
  if(message.includes("PROMO_SAME_GROUP_CONFLICT"))return "تم تطبيق العرض الأفضل من هذه المجموعة";
  if(message.includes("PROMO_NOT_COMPATIBLE"))return "لا يمكن جمع هذين العرضين";
  if(message.includes("not found"))return "كود الخصم غير موجود";
  if(message.includes("not active"))return "كود الخصم غير نشط";
  return "كود الخصم غير صالح لهذا الطلب";
}

function storefrontShippingQuote(subtotal,discount) {
  const config=state.appearance?.shipping||{};
  if(!config.is_active)return {active:false,amount:0,rule:null};
  if(discount?.free_shipping||discount?.discount?.type==="free_shipping")return {active:true,amount:0,rule:null};
  const quantity=rows=>rows.reduce((sum,item)=>sum+Math.max(1,Number(item.quantity||1)),0);
  const rule=(config.free_shipping_rules||[]).find(item=>{
    if(item.is_active===false)return false;
    if(item.condition_type==="order_subtotal")return subtotal>=Number(item.minimum_subtotal||0);
    if(item.condition_type==="any_quantity")return quantity(state.cart)>=Number(item.minimum_quantity||2);
    if(item.condition_type==="selected_products_quantity")return (item.product_ids||[]).length&&quantity(state.cart.filter(row=>(item.product_ids||[]).map(Number).includes(Number(row.product_id))))>=Number(item.minimum_quantity||2);
    if(item.condition_type==="product_bundle")return (item.product_ids||[]).length&&item.product_ids.every(id=>state.cart.some(row=>Number(row.product_id)===Number(id)));
    if(item.condition_type==="selected_categories_quantity")return (item.category_slugs||[]).length&&quantity(state.cart.filter(row=>(item.category_slugs||[]).includes(String(row.category_slug||""))))>=Number(item.minimum_quantity||2);
    return false;
  })||null;
  const legacyFree=Number(config.free_shipping_threshold||0)>0&&subtotal>=Number(config.free_shipping_threshold);
  const base=Math.max(0,Number(config.default_cost||0));
  let amount=base;
  if(rule&&(!rule.action_type||rule.action_type==="free_shipping"))amount=0;
  else if(rule?.action_type==="fixed_shipping")amount=Math.max(0,Number(rule.action_value||0));
  else if(rule?.action_type==="shipping_discount_percentage")amount=Math.max(0,base*(1-Math.min(100,Number(rule.action_value||0))/100));
  else if(rule?.action_type==="shipping_discount_fixed")amount=Math.max(0,base-Number(rule.action_value||0));
  if(legacyFree)amount=0;
  return {active:true,amount:Math.round(amount*100)/100,base_amount:base,rule};
}

function cartBundleMedia(item) {
  const bundle=state.bundles.find(entry=>Number(entry.id)===Number(item.bundle_id));
  const mainPhoto=item.bundle_main_photo_url||bundle?.main_photo_url||"";
  if(mainPhoto)return `<img class="cart-main-image" src="${esc(mainPhoto)}" alt="" />`;
  const images=(item.bundle_items?.length?item.bundle_items:(bundle?.items||[])).map(component=>component.image_url).filter(Boolean).slice(0,2);
  return `<div class="cart-bundle-media">${images.map(src=>`<img src="${esc(src)}" alt="" />`).join("")}</div>`;
}

function cartItemHtml(item,index) {
  const isBundle=item.item_type==="bundle"||item.bundle_id;
  const bundle=isBundle?state.bundles.find(entry=>Number(entry.id)===Number(item.bundle_id)):null;
  const bundleItems=item.bundle_items?.length?item.bundle_items:(bundle?.items||[]);
  const media=isBundle?cartBundleMedia(item):`<img class="cart-main-image" src="${esc(item.image_url)}" alt="" />`;
  const components=isBundle?`<div class="cart-bundle-components">${bundleItems.map(component=>`<a href="/product/${component.product_id}"><img src="${esc(component.image_url||"")}" alt="" /><span>${component.quantity>1?`${component.quantity} × `:""}${esc(component.name_ar||component.name_en)}</span></a>`).join("")}</div>`:"";
  return `<article class="cart-item ${isBundle?"is-bundle":""}"><div class="cart-item-media">${media}</div><div class="cart-item-copy"><h3>${esc(item.name_ar||item.name_en)}</h3><div class="cart-variant">${esc(item.variant_label||"")}</div><div class="price"><strong>${money(item.price)}</strong></div>${components}</div><div class="cart-item-actions"><div class="quantity-control" style="width:105px"><button data-cart-plus="${index}">+</button><strong>${item.quantity}</strong><button data-cart-minus="${index}">−</button></div><button class="remove-link" data-cart-remove="${index}" aria-label="حذف">${icon("trash-2",18)}</button></div></article>`;
}

function checkoutCustomerDefaults(defaultCountry) {
  const customer=state.customer||{};const parts=String(customer.full_name||customer.name||"").trim().split(/\s+/).filter(Boolean);
  const first_name=customer.first_name||parts.shift()||"",last_name=customer.last_name||parts.join(" ")||"";
  let phone=String(customer.phone||"").replace(/\D/g,"");if((customer.country_code||defaultCountry)==="SA")phone=phone.replace(/^966/,"").replace(/^0(?=5\d{8}$)/,"");
  return {...customer,first_name,last_name,phone};
}

function checkoutFormMarkup(countries, defaultCountry) {
  const splEnabled = state.addressConfig?.enabled === true;
  const defaults=checkoutCustomerDefaults(defaultCountry);
  const methods=state.paymentMethods?.methods||[];
  const cardBrands=[
    ["mada.webp","مدى","mada"],
    ["visa.svg","Visa","visa"],
    ["mastercard.svg","Mastercard","mastercard"],
    ["apple-pay.svg","Apple Pay","apple-pay"]
  ].map(([file,name,className])=>`<img class="is-${className}" src="/storefront/assets/payments/${file}" alt="${name}" />`).join("");
  const paymentChoices=methods.map((method,index)=>{
    let content=`<span class="checkout-payment-copy"><strong>${esc(method.title_ar||method.title_en)}</strong><small>${esc(method.description_ar||"")}</small></span>`;
    if(method.id==="cod")content=`<img class="checkout-cod-image" src="/storefront/assets/payments/cash-on-delivery.png" alt="" /><span class="checkout-payment-copy"><strong>${esc(method.title_ar||"الدفع عند الاستلام")}</strong><small>ادفعي عند استلام طلبك</small></span>`;
    if(method.id==="tamara"||method.id==="tabby")content=`<span class="checkout-installment-widget" id="checkout-${method.id}-widget"></span>`;
    if(method.id==="edfapay")content=`<span class="checkout-payment-copy"><strong>${esc(method.title_ar||"ادفع باي")}</strong><small>ادفعي عن طريق البطاقة البنكية أو الائتمانية</small></span><span class="checkout-card-brands" aria-label="مدى وفيزا وماستركارد وApple Pay">${cardBrands}</span>`;
    return `<label class="checkout-payment-choice is-${esc(method.id)}"><input type="radio" name="payment_method" value="${esc(method.id)}" ${index===0?"checked":""} required /><span class="checkout-payment-indicator"></span><span class="checkout-payment-frame">${content}</span></label>`;
  }).join("");
  return `<form class="checkout-form" id="checkoutForm">
    <label><span class="checkout-label-text">الاسم الأول<i>*</i></span><input name="first_name" autocomplete="given-name" value="${esc(defaults.first_name||"")}" required /></label>
    <label><span class="checkout-label-text">اسم العائلة<i>*</i></span><input name="last_name" autocomplete="family-name" value="${esc(defaults.last_name||"")}" required /></label>
    <label><span class="checkout-label-text">رقم الجوال<i>*</i></span><div class="checkout-phone-control" id="checkoutPhoneControl"><span id="checkoutPhonePrefix">+966</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="5XXXXXXXX" value="${esc(defaults.phone||"")}" required /></div><small class="checkout-field-hint" id="checkoutPhoneHint">9 أرقام بعد +966</small></label>
    <label>البريد الإلكتروني<input name="email" type="email" autocomplete="email" value="${esc(defaults.email||"")}" /></label>
    <label><span class="checkout-label-text">الدولة<i>*</i></span><select name="country_code" required>${countries.map(country=>`<option value="${country.code}" ${country.code===defaultCountry?"selected":""}>${country.code==="SA"?"🇸🇦 ":""}${esc(country.name_ar||country.name_en)}</option>`).join("")}</select></label>
    ${splEnabled?`<section class="national-address-card full" id="saudiAddressPanel">
      <div class="national-address-head"><div><span>العنوان الوطني السعودي <i class="checkout-required-star">*</i></span><strong>اكتبي الرمز المختصر لملء العنوان تلقائيًا</strong></div><span class="address-verification-state" id="addressVerificationState">جاهز للتحقق</span></div>
      <div class="national-address-control"><input name="short_address" id="shortAddress" maxlength="9" autocomplete="off" placeholder="AAAA 0000" aria-label="العنوان الوطني المختصر" required /><button type="button" id="verifyShortAddress">${icon("map-pin-check",18)}تحقق واملأ العنوان</button></div>
      <p id="nationalAddressMessage">يتكون الرمز من 4 أحرف و4 أرقام.</p>
      <input name="address_verification_token" type="hidden" />
      <input name="latitude" type="hidden" />
      <input name="longitude" type="hidden" />
    </section>`:`<label><span class="checkout-label-text">الرمز الوطني المختصر<i>*</i></span><input name="short_address" maxlength="9" autocomplete="off" placeholder="AAAA 0000" style="direction:ltr;text-transform:uppercase" required /></label>`}
    <label><span class="checkout-label-text">المنطقة<i>*</i></span><input name="province" autocomplete="address-level1" required data-address-field /></label>
    <label><span class="checkout-label-text">المدينة<i>*</i></span><input name="city" autocomplete="address-level2" required data-address-field /></label>
    <label><span class="checkout-label-text">الحي<i>*</i></span><input name="district" autocomplete="address-level3" required data-address-field /></label>
    <label><span class="checkout-label-text">الشارع<i>*</i></span><input name="street" autocomplete="street-address" required data-address-field /></label>
    <label><span class="checkout-label-text">رقم المبنى<i>*</i></span><input name="building_number" inputmode="numeric" required data-address-field /></label>
    <label><span class="checkout-label-text">الرمز البريدي<i>*</i></span><input name="postal_code" inputmode="numeric" autocomplete="postal-code" required data-address-field /></label>
    <label>الرقم الإضافي للعنوان<input name="additional_number" inputmode="numeric" data-address-field /></label>
    <fieldset class="checkout-shipping-methods full" id="checkoutShippingMethods" hidden><legend>شركة الشحن</legend><div id="checkoutShippingChoices"></div></fieldset>
    <fieldset class="checkout-payment-methods full"><legend>طريقة الدفع</legend>${paymentChoices||`<p>لا توجد طريقة دفع متاحة حاليًا.</p>`}</fieldset>
    <label class="full">ملاحظات العنوان أو الطلب<textarea name="address_notes"></textarea></label>
  </form>`;
}

function renderCart(checkout=false) {
  if(!checkout)state.checkoutQuote=null;
  if(!state.cart.length){shell(`${breadcrumbs(checkout?"إتمام الطلب":"السلة")}<section class="container empty-cart"><div>${icon("shopping-bag",58)}<h1>سلة التسوق فارغة</h1><p class="muted">اختاري ما يناسبك من منتجات رداء الحشمة.</p><a class="primary-button" href="/products">العودة إلى المتجر</a></div></section>`);return;}
  const totals=cartTotals();
  const promoCodes=appliedPromotionCodes(totals.discount);
  const countries=state.market?.countries||[];
  const defaultCountry=state.market?.settings?.default_country_code||"SA";
  shell(`${breadcrumbs(checkout?"إتمام الطلب":"سلة التسوق")}<section class="container cart-page">${checkout?`<h1>إتمام الطلب</h1>${checkoutFormMarkup(countries,defaultCountry)}`:"<h1>سلة التسوق</h1>"}<div class="cart-layout"><div class="cart-items">${state.cart.map(cartItemHtml).join("")}</div><aside class="cart-summary"><h2>ملخص الطلب</h2><div class="summary-row"><span>المجموع الفرعي</span><strong>${money(totals.subtotal)}</strong></div>${totals.discountAmount?`<div class="summary-row discount"><span>الخصم</span><strong>− ${money(totals.discountAmount)}</strong></div>`:""}${totals.shipping.active?`<div class="summary-row shipping" id="checkoutShippingRow"><span>الشحن${totals.shipping.rule?`<small>${esc(totals.shipping.rule.name_ar||"")}</small>`:""}</span><strong id="checkoutShippingAmount">${checkoutShippingPrice(totals.shipping)}</strong></div>`:""}<div class="coupon-box"><label for="couponCode">هل لديك كود خصم؟</label>${promoCodes.length?`<div class="applied-promo-list">${promoCodes.map(code=>`<button type="button" data-remove-promo="${esc(code)}"><span>${esc(code)}</span>${icon("x",13)}</button>`).join("")}</div>`:""}<div class="coupon-row"><input id="couponCode" value="" placeholder="أدخلي كودًا آخر" /><button id="applyCoupon" type="button">تطبيق</button></div><div class="coupon-message ${totals.discount?"success":""}" id="couponMessage">${totals.discount?`تم تطبيق ${promoCodes.length} كود خصم`:""}</div></div><div class="summary-total"><span>الإجمالي</span><strong id="checkoutTotalAmount">${money(totals.total)}</strong></div>${checkout?`<small class="muted" id="shippingQuoteState"></small><button class="primary-button" style="width:100%" id="placeOrder">تأكيد الطلب</button>`:`<a class="primary-button" style="width:100%" href="/checkout">إتمام الطلب</a>`}</aside></div></section>`);
  document.querySelectorAll("[data-cart-plus]").forEach(button=>button.onclick=()=>changeCartQuantity(Number(button.dataset.cartPlus),1,checkout));
  document.querySelectorAll("[data-cart-minus]").forEach(button=>button.onclick=()=>changeCartQuantity(Number(button.dataset.cartMinus),-1,checkout));
  document.querySelectorAll("[data-cart-remove]").forEach(button=>button.onclick=()=>removeCartItem(Number(button.dataset.cartRemove),checkout));
  document.getElementById("applyCoupon").onclick=applyCoupon;
  document.querySelectorAll("[data-remove-promo]").forEach(button=>button.onclick=()=>removePromotionCode(button.dataset.removePromo,checkout));
  document.getElementById("placeOrder")?.addEventListener("click",placeOrder);
  if(checkout){bindSaudiAddressVerification();bindCheckoutPhoneInput();renderCheckoutPaymentWidgets(totals.total);const form=document.getElementById("checkoutForm"),email=form.elements.email;const syncEmailRequirement=()=>{email.required=["tamara","edfapay","tabby"].includes(form.elements.payment_method.value);};form.querySelectorAll('[name="payment_method"]').forEach(input=>input.addEventListener("change",syncEmailRequirement));syncEmailRequirement();let quoteTimer;form.addEventListener("input",()=>{clearTimeout(quoteTimer);quoteTimer=setTimeout(refreshCheckoutQuote,500);});}
}

function bindCheckoutPhoneInput(){
  const form=document.getElementById("checkoutForm");if(!form)return;const country=form.elements.country_code,phone=form.elements.phone,prefix=document.getElementById("checkoutPhonePrefix"),hint=document.getElementById("checkoutPhoneHint"),control=document.getElementById("checkoutPhoneControl");
  const normalizeSaudi=()=>{let value=phone.value.replace(/\D/g,"").replace(/^966/,"");if(value.length===10&&value.startsWith("0"))value=value.slice(1);phone.value=value.slice(0,9);phone.setCustomValidity(value&&/^5\d{8}$/.test(phone.value)?"":"أدخلي 9 أرقام تبدأ بالرقم 5");};
  const update=()=>{const saudi=country.value==="SA";control.classList.toggle("is-saudi",saudi);prefix.hidden=!saudi;hint.textContent=saudi?"9 أرقام بعد +966":"أدخلي رقم الهاتف مع مفتاح الدولة";phone.maxLength=saudi?10:18;phone.inputMode=saudi?"numeric":"tel";phone.placeholder=saudi?"5XXXXXXXX":"+971...";if(form.elements.short_address)form.elements.short_address.required=saudi;phone.setCustomValidity("");if(saudi)normalizeSaudi();};
  phone.addEventListener("input",()=>{if(country.value==="SA")normalizeSaudi();else phone.setCustomValidity("");});country.addEventListener("change",update);update();
}

function checkoutCustomerValues(form){
  const values=Object.fromEntries(new FormData(form));
  if(values.country_code==="SA"){let local=String(values.phone||"").replace(/\D/g,"").replace(/^966/,"");if(local.length===10&&local.startsWith("0"))local=local.slice(1);values.phone=`+966${local}`;}
  return values;
}

function bindSaudiAddressVerification(){
  const form=document.getElementById("checkoutForm");if(!form)return;
  const country=form.elements.country_code;const panel=document.getElementById("saudiAddressPanel");const short=form.elements.short_address;const token=form.elements.address_verification_token;const message=document.getElementById("nationalAddressMessage");const stateLabel=document.getElementById("addressVerificationState");const verify=document.getElementById("verifyShortAddress");
  if(!panel||!short||!token||!verify)return;
  const updateCountry=()=>{panel.hidden=country.value!=="SA";if(panel.hidden){token.value="";stateLabel.textContent="غير مطلوب";}};
  const invalidate=()=>{if(!token.value)return;token.value="";stateLabel.textContent="يحتاج إعادة تحقق";stateLabel.className="address-verification-state is-pending";message.textContent="تم تعديل بيانات العنوان. تحققي من الرمز مرة أخرى.";};
  country.addEventListener("change",updateCountry);updateCountry();
  form.querySelectorAll("[data-address-field]").forEach(input=>input.addEventListener("input",invalidate));
  short.addEventListener("input",()=>{const clean=short.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8);short.value=clean.length>4?`${clean.slice(0,4)} ${clean.slice(4)}`:clean;token.value="";stateLabel.textContent=state.addressConfig?.enabled?"جاهز للتحقق":"إدخال يدوي";stateLabel.className="address-verification-state";});
  verify?.addEventListener("click",async()=>{const code=short.value.toUpperCase().replace(/[^A-Z0-9]/g,"");if(!/^[A-Z]{4}[0-9]{4}$/.test(code)){message.textContent="أدخلي 4 أحرف ثم 4 أرقام.";stateLabel.textContent="رمز غير مكتمل";stateLabel.className="address-verification-state is-error";return;}verify.disabled=true;verify.innerHTML=`${icon("loader-circle",18)}جاري التحقق...`;message.textContent="نتحقق من العنوان لدى SPL...";try{const result=await api("/api/store/address/sa/resolve",{method:"POST",body:JSON.stringify({short_address:code})});const address=result.address||{};["province","city","district","street","building_number","postal_code","additional_number","latitude","longitude"].forEach(name=>{if(form.elements[name]&&address[name]!==null&&address[name]!==undefined)form.elements[name].value=address[name];});short.value=`${code.slice(0,4)} ${code.slice(4)}`;token.value=result.verification_token||"";stateLabel.textContent="موثق من SPL";stateLabel.className="address-verification-state is-verified";message.textContent=`${address.city||""}${address.district?`، ${address.district}`:""} · تم ملء بيانات العنوان.`;refreshCheckoutQuote();}catch(error){stateLabel.textContent="تعذر التحقق";stateLabel.className="address-verification-state is-error";message.textContent=error.message==="SPL_ADDRESS_NOT_FOUND"?"لم نجد عنوانًا مطابقًا لهذا الرمز.":"تعذر التحقق الآن، راجعي الرمز أو استكملي العنوان يدويًا.";}finally{verify.disabled=!state.addressConfig?.enabled;verify.innerHTML=`${icon("map-pin-check",18)}تحقق واملأ العنوان`;hydrateIcons();}});
  hydrateIcons();
}

function renderCheckoutShippingChoices(quotes=[]){
  const fieldset=document.getElementById("checkoutShippingMethods"),box=document.getElementById("checkoutShippingChoices");if(!fieldset||!box)return;
  fieldset.hidden=quotes.length<2;
  box.innerHTML=quotes.map(quote=>`<label class="checkout-shipping-choice"><input type="radio" name="shipping_quote_choice" value="${esc(quote.id)}" ${quote.id===state.checkoutQuote?.id?"checked":""}/><span class="checkout-shipping-indicator"></span><span class="checkout-shipping-logo">${quote.logo_url?`<img src="${esc(quote.logo_url)}" alt="" loading="lazy" />`:icon("truck",20)}</span><span><strong>${esc(quote.carrier_name_ar||quote.carrier_name_en||"التوصيل")}</strong><small>${quote.eta_min_days?`خلال ${quote.eta_min_days}${quote.eta_max_days&&quote.eta_max_days!==quote.eta_min_days?`–${quote.eta_max_days}`:""} أيام`:quote.eta_label?esc(String(quote.eta_label).replace(/to/g," - ").replace(/WorkingDays/i," أيام عمل")):quote.provider==="oto"?"عبر منصة OTO":""}</small></span><b>${Number(quote.customer_amount||0)===0?"مجاني":money(quote.customer_amount)}</b></label>`).join("");
  box.querySelectorAll('[name="shipping_quote_choice"]').forEach(input=>input.onchange=()=>{state.checkoutQuote=quotes.find(quote=>quote.id===input.value)||state.checkoutQuote;const totals=cartTotals();document.getElementById("checkoutShippingAmount").innerHTML=checkoutShippingPrice(totals.shipping);document.getElementById("checkoutTotalAmount").innerHTML=money(totals.total);});
}

async function refreshCheckoutQuote(){
  const form=document.getElementById("checkoutForm");if(!form)return;const required=[...form.querySelectorAll("[required]")];if(required.some(input=>!input.value.trim()))return;
  const values=checkoutCustomerValues(form);const payment_method=values.payment_method||"cod";delete values.payment_method;delete values.shipping_quote_choice;const status=document.getElementById("shippingQuoteState");if(status)status.textContent="جاري حساب الشحن...";
  try{const result=await api("/api/store/shipping/quote",{method:"POST",body:JSON.stringify({customer:values,payment_method,items:state.cart})});state.checkoutQuotes=result.quotes||[result.quote].filter(Boolean);const previous=state.checkoutQuote?.id;state.checkoutQuote=state.checkoutQuotes.find(quote=>quote.id===previous)||result.quote;renderCheckoutShippingChoices(state.checkoutQuotes);const totals=cartTotals();const shippingAmount=document.getElementById("checkoutShippingAmount");if(shippingAmount)shippingAmount.innerHTML=checkoutShippingPrice(totals.shipping);const total=document.getElementById("checkoutTotalAmount");if(total)total.innerHTML=money(totals.total);renderCheckoutPaymentWidgets(totals.total);if(status)status.textContent=result.quote?.fallback_used?"تم استخدام سعر الشحن الاحتياطي":"تم تحديث تكلفة الشحن";}catch(error){if(status)status.textContent="سيتم تأكيد تكلفة الشحن عند إرسال الطلب";}
}

function changeCartQuantity(index,delta,checkout) {
  const item=state.cart[index];if(!item)return;item.quantity=Math.max(1,Number(item.quantity||1)+delta);saveLocalCart();api(`/api/cart/${encodeURIComponent(item.key)}`,{method:"PUT",body:JSON.stringify({quantity:item.quantity})}).catch(()=>{});clearDiscount();renderCart(checkout);
}

function removeCartItem(index,checkout) {
  const [item]=state.cart.splice(index,1);saveLocalCart();if(item)api(`/api/cart/${encodeURIComponent(item.key)}`,{method:"DELETE"}).catch(()=>{});clearDiscount();renderCart(checkout);
}

function clearDiscount(){localStorage.removeItem("slyrah_discount");}

async function applyCoupon() {
  const code=document.getElementById("couponCode").value.trim().toUpperCase();const message=document.getElementById("couponMessage");if(!code)return;message.className="coupon-message";message.textContent="جاري التحقق...";const existing=appliedPromotionCodes(cartTotals().discount);const codes=[...new Set([...existing,code])];
  try{const result=await api("/api/store/promotions/evaluate",{method:"POST",body:JSON.stringify({codes,order_total:cartTotals().subtotal,product_ids:state.cart.map(item=>item.product_id),category_slugs:state.cart.map(item=>item.category_slug),items:state.cart})});const rejected=(result.rejected_promotions||[]).find(item=>item.code===code);if(rejected)throw new Error(rejected.reason);localStorage.setItem("slyrah_discount",JSON.stringify(result));renderCart(location.pathname==="/checkout");}catch(error){message.className="coupon-message error";message.textContent=promotionErrorMessage(error.message);}
}

async function removePromotionCode(code,checkout){const codes=appliedPromotionCodes(cartTotals().discount).filter(item=>item!==code);if(!codes.length){clearDiscount();renderCart(checkout);return;}try{const result=await api("/api/store/promotions/evaluate",{method:"POST",body:JSON.stringify({codes,order_total:cartTotals().subtotal,items:state.cart})});localStorage.setItem("slyrah_discount",JSON.stringify(result));}catch{clearDiscount();}renderCart(checkout);}

const PAYMENT_ATTEMPT_KEY="siteyfy_payment_attempt";

function paymentCartFingerprint(provider){
  return `${provider}:${state.cart.map(item=>`${item.key}:${Number(item.quantity||1)}`).sort().join("|")}:${Number(cartTotals().total||0).toFixed(2)}`;
}

function paymentAttempt(provider){
  const fingerprint=paymentCartFingerprint(provider),ttl=Number(state.paymentMethods?.redirect_policy?.attempt_ttl_minutes||30)*60*1000;
  let current=null;try{current=JSON.parse(sessionStorage.getItem(PAYMENT_ATTEMPT_KEY)||"null");}catch{}
  if(current&&current.provider===provider&&current.fingerprint===fingerprint&&Date.now()-Number(current.created_at||0)<ttl)return current;
  const id=crypto.randomUUID?.()||`${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  current={id,provider,fingerprint,created_at:Date.now(),automatic_redirects:0};
  sessionStorage.setItem(PAYMENT_ATTEMPT_KEY,JSON.stringify(current));
  return current;
}

function clearPaymentAttempt(orderId=""){
  try{const current=JSON.parse(sessionStorage.getItem(PAYMENT_ATTEMPT_KEY)||"null");if(!orderId||!current?.order_id||String(current.order_id)===String(orderId))sessionStorage.removeItem(PAYMENT_ATTEMPT_KEY);}catch{sessionStorage.removeItem(PAYMENT_ATTEMPT_KEY);}
}

function safeGatewayRedirect(rawUrl){
  let target;try{target=new URL(String(rawUrl||""),location.origin);}catch{throw new Error("PAYMENT_REDIRECT_URL_INVALID");}
  if(target.protocol!=="https:")throw new Error("PAYMENT_REDIRECT_HTTPS_REQUIRED");
  if(target.origin===location.origin&&target.pathname.startsWith("/payment/"))throw new Error("PAYMENT_REDIRECT_CALLBACK_LOOP");
  return target.toString();
}

function continueGatewayPayment(result,attempt,button){
  const redirectUrl=safeGatewayRedirect(result.payment_redirect_url),maxRedirects=Number(state.paymentMethods?.redirect_policy?.max_automatic_redirects??1);
  attempt.order_id=result.order?.id||attempt.order_id;attempt.checkout_url=redirectUrl;
  localStorage.setItem("siteyfy_pending_payment",JSON.stringify({provider:result.payment_provider||attempt.provider,order_id:attempt.order_id,started_at:new Date().toISOString()}));
  if(Number(attempt.automatic_redirects||0)>=maxRedirects){
    sessionStorage.setItem(PAYMENT_ATTEMPT_KEY,JSON.stringify(attempt));
    button.disabled=false;button.textContent="تأكيد الطلب";
    let notice=document.getElementById("paymentRedirectGuard");
    if(!notice){notice=document.createElement("div");notice.id="paymentRedirectGuard";notice.className="payment-redirect-guard";button.before(notice);}
    notice.innerHTML=`${icon("shield-check",20)}<div><strong>جلسة الدفع جاهزة</strong><small>أوقفنا التحويل التلقائي المتكرر لحمايتك من حلقة إعادة التوجيه.</small></div><a class="primary-button" href="${esc(redirectUrl)}">متابعة الدفع</a>`;
    hydrateIcons();return;
  }
  attempt.automatic_redirects=Number(attempt.automatic_redirects||0)+1;
  sessionStorage.setItem(PAYMENT_ATTEMPT_KEY,JSON.stringify(attempt));
  button.textContent="جاري الانتقال إلى بوابة الدفع...";
  location.replace(redirectUrl);
}

async function placeOrder() {
  const form=document.getElementById("checkoutForm");if(!form.reportValidity())return;const values=checkoutCustomerValues(form);const payment_method=values.payment_method||"cod";delete values.payment_method;delete values.shipping_quote_choice;const customer=values;const discount=cartTotals().discount;const button=document.getElementById("placeOrder");button.disabled=true;button.textContent="جاري تأكيد الطلب...";
  const attempt=payment_method==="cod"?null:paymentAttempt(payment_method);
  try{const result=await api("/api/orders",{method:"POST",body:JSON.stringify({customer,payment_method,payment_attempt_id:attempt?.id||undefined,shipping_quote_token:state.checkoutQuote?.quote_token||undefined,locale:"ar_SA",items:state.cart,discount_codes:appliedPromotionCodes(discount)})});if(result.payment_redirect_url){continueGatewayPayment(result,attempt,button);return;}clearPaymentAttempt(result.order?.id);state.cart=[];saveLocalCart();clearDiscount();shell(`${breadcrumbs("تم استلام الطلب")}<section class="container empty-cart"><div>${icon("circle-check-big",58)}<h1>تم استلام طلبك بنجاح</h1><p class="muted">رقم الطلب: ${esc(result.order?.id||"")}</p><a class="primary-button" href="/products">متابعة التسوق</a></div></section>`);}catch(error){if(["PAYMENT_ATTEMPT_EXPIRED","PAYMENT_ATTEMPT_CLOSED"].includes(error.message))clearPaymentAttempt();toast(promotionErrorMessage(error.message));button.disabled=false;button.textContent="تأكيد الطلب";}
}

async function renderTamaraReturn(outcome="success"){
  const params=new URLSearchParams(location.search),orderId=params.get("order_id"),token=params.get("token");
  shell(`${breadcrumbs("حالة الدفع")}<section class="container payment-return"><div class="payment-return-state is-loading">${icon("loader-circle",54)}<span>تمارا</span><h1>جاري تأكيد حالة الدفع</h1><p>نراجع العملية مباشرة مع تمارا، انتظري لحظة.</p></div></section>`);
  try{const result=await api(`/api/store/payments/tamara/status?order_id=${encodeURIComponent(orderId||"")}&token=${encodeURIComponent(token||"")}&outcome=${encodeURIComponent(outcome)}`),order=result.order||{},paid=["authorised","captured","partially_captured"].includes(order.payment_status);if(paid){clearPaymentAttempt(order.id||orderId);state.cart=[];saveLocalCart();clearDiscount();localStorage.removeItem("siteyfy_pending_payment");shell(`${breadcrumbs("تم الدفع")}<section class="container payment-return"><div class="payment-return-state is-success">${icon("circle-check-big",58)}<span>تمارا</span><h1>تم تأكيد الدفع بنجاح</h1><p>تم استلام طلبك رقم <b>#${esc(order.id||orderId||"")}</b> وربطه بعملية Tamara.</p><a class="primary-button" href="/products">متابعة التسوق</a></div></section>`);return;}const cancelled=["cancelled","failed","expired"].includes(order.payment_status)||outcome!=="success";if(cancelled){clearPaymentAttempt(order.id||orderId);localStorage.removeItem("siteyfy_pending_payment");}shell(`${breadcrumbs(cancelled?"لم يكتمل الدفع":"الدفع قيد التأكيد")}<section class="container payment-return"><div class="payment-return-state ${cancelled?"is-failed":"is-pending"}">${icon(cancelled?"circle-x":"clock",58)}<span>تمارا</span><h1>${cancelled?"لم تكتمل عملية الدفع":"الدفع قيد التأكيد"}</h1><p>${cancelled?"لم يتم خصم الطلب ويمكنك العودة لإتمامه بطريقة أخرى.":"استلمنا العملية وننتظر تأكيد Tamara النهائي. سيتم تحديث الطلب تلقائيًا."}</p><a class="primary-button" href="/checkout">${cancelled?"العودة لإتمام الطلب":"مراجعة الطلب"}</a></div></section>`);}catch(error){shell(`${breadcrumbs("تعذر التحقق")}<section class="container payment-return"><div class="payment-return-state is-failed">${icon("circle-x",58)}<span>تمارا</span><h1>تعذر التحقق من العملية</h1><p>${esc(promotionErrorMessage(error.message))}</p><a class="primary-button" href="/checkout">العودة لإتمام الطلب</a></div></section>`);}
  hydrateIcons();
}

async function renderHostedPaymentReturn(provider,outcome="success"){
  const labels={edfapay:"ادفع باي",tabby:"تابي"},label=labels[provider]||provider;
  const params=new URLSearchParams(location.search),orderId=params.get("order_id"),token=params.get("token");
  shell(`${breadcrumbs("حالة الدفع")}<section class="container payment-return"><div class="payment-return-state is-loading">${icon("loader-circle",54)}<span class="${provider}-return-mark">${esc(label)}</span><h1>جاري تأكيد حالة الدفع</h1><p>نراجع آخر حالة مسجلة للعملية، انتظري لحظة.</p></div></section>`);
  try{
    const query=`order_id=${encodeURIComponent(orderId||"")}&token=${encodeURIComponent(token||"")}&outcome=${encodeURIComponent(outcome||"")}`;
    const result=await api(`/api/store/payments/${provider}/status?${query}`),order=result.order||{},paid=["authorised","captured","partially_captured"].includes(order.payment_status);
    if(paid){clearPaymentAttempt(order.id||orderId);state.cart=[];saveLocalCart();clearDiscount();localStorage.removeItem("siteyfy_pending_payment");shell(`${breadcrumbs("تم الدفع")}<section class="container payment-return"><div class="payment-return-state is-success">${icon("circle-check-big",58)}<span class="${provider}-return-mark">${esc(label)}</span><h1>تم تأكيد الدفع بنجاح</h1><p>تم استلام طلبك رقم <b>#${esc(order.id||orderId||"")}</b> وربطه بعملية ${esc(label)}.</p><a class="primary-button" href="/products">متابعة التسوق</a></div></section>`);return;}
    const failed=["cancelled","failed","expired","rejected"].includes(order.payment_status)||order.status==="cancelled"||["cancel","failure"].includes(outcome);
    if(failed){clearPaymentAttempt(order.id||orderId);localStorage.removeItem("siteyfy_pending_payment");}
    shell(`${breadcrumbs(failed?"لم يكتمل الدفع":"الدفع قيد التأكيد")}<section class="container payment-return"><div class="payment-return-state ${failed?"is-failed":"is-pending"}">${icon(failed?"circle-x":"clock",58)}<span class="${provider}-return-mark">${esc(label)}</span><h1>${failed?"لم تكتمل عملية الدفع":"الدفع قيد التأكيد"}</h1><p>${failed?"لم يتم تأكيد الدفع ويمكنك العودة لإتمام الطلب بطريقة أخرى.":`لم يصل التأكيد النهائي من ${esc(label)} بعد. سيُحدّث الطلب تلقائيًا عند وصول الإشعار.`}</p><a class="primary-button" href="/checkout">${failed?"العودة لإتمام الطلب":"مراجعة الطلب"}</a></div></section>`);
  }catch(error){shell(`${breadcrumbs("تعذر التحقق")}<section class="container payment-return"><div class="payment-return-state is-failed">${icon("circle-x",58)}<span>${esc(label)}</span><h1>تعذر التحقق من العملية</h1><p>${esc(promotionErrorMessage(error.message))}</p><a class="primary-button" href="/checkout">العودة لإتمام الطلب</a></div></section>`);}
  hydrateIcons();
}

function renderEdfaPayReturn(){return renderHostedPaymentReturn("edfapay","return");}
function renderTabbyReturn(outcome){return renderHostedPaymentReturn("tabby",outcome);}

function renderNotFound(){shell(`<section class="container empty-cart"><div><h1>الصفحة غير موجودة</h1><a class="primary-button" href="/">العودة للرئيسية</a></div></section>`);}

async function init() {
  try {
    const [appearance,currencies,market,builder,categories,productsResponse,bundlesResponse,collectionsResponse,addressConfig,paymentMethods,profile] = await Promise.all([
      api("/api/store/appearance"),api("/api/store/currencies"),api("/api/store/market"),api("/api/store/home-builder"),api("/api/categories"),api("/api/products"),api("/api/bundles"),api("/api/store/collections").catch(()=>({collections:[]})),api("/api/store/address/sa/config").catch(()=>({enabled:false,format:"AAAA0000"})),api("/api/store/payment-methods").catch(()=>({methods:[{id:"cod",title_ar:"الدفع عند الاستلام"}]})),customerAuthToken()?api("/api/users/profile").catch(()=>null):Promise.resolve(null)
    ]);
    state.appearance=appearance;state.currencies=currencies;state.market=market;state.builder=builder;state.categories=categories.categories||categories||[];state.products=productsResponse.products||productsResponse||[];state.bundles=bundlesResponse.bundles||bundlesResponse||[];state.collections=collectionsResponse.collections||collectionsResponse||[];state.addressConfig=addressConfig||{enabled:false,format:"AAAA0000"};state.paymentMethods=paymentMethods||{methods:[]};state.customer=profile?.user||null;
    applyTheme();
    renderStoreRoute();
  } catch(error) {
    app.innerHTML=`<section class="store-loading"><h1>تعذر تحميل المتجر</h1><p>${esc(error.message)}</p><button class="primary-button" onclick="location.reload()">إعادة المحاولة</button></section>`;
  }
}

document.addEventListener("keydown",event=>{if(event.key==="Escape"){closeOverlay();document.getElementById("filterSidebar")?.classList.remove("mobile-open");document.body.classList.remove("is-locked");}});
document.addEventListener("click",event=>{
  const link=event.target.closest("a[href^='/collection/']");
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const url=new URL(link.href,location.origin);
  if(url.origin!==location.origin)return;
  event.preventDefault();
  history.pushState(null,"",`${url.pathname}${url.search}`);
  renderStoreRoute();
  scrollTo({top:0,behavior:"smooth"});
});
window.addEventListener("popstate",()=>renderStoreRoute());
init();
