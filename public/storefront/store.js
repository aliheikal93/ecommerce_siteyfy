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
  labels:[],
  facets:[],
  showAllColors:false,
  pages:[],
  cart:readLocalCart(),
  page:1,
  category:new URLSearchParams(location.search).get("category") || "",
  subcategory:new URLSearchParams(location.search).get("subcategory") || "",
  facet:new URLSearchParams(location.search).get("facet") || new URLSearchParams(location.search).get("label") || "",
  option:new URLSearchParams(location.search).get("option") || "",
  color:new URLSearchParams(location.search).get("color") || "",
  collection:new URLSearchParams(location.search).get("collection") || "",
  minPrice:Number(new URLSearchParams(location.search).get("min_price") || 0),
  maxPrice:Number(new URLSearchParams(location.search).get("max_price")) || Infinity,
  sort:"default",
  announcementTimer:null
  ,checkoutQuote:null,checkoutQuotes:[],
  addressConfig:{ enabled:false, format:"AAAA0000" },
  paymentMethods:{ methods:[] },
  marketingPixels:null,
  customer:null,
  checkoutRecovery:null,
  checkoutRecoveryPromise:null,
  cartRevisionToken:"",
  cartVerifiedAt:0,
  cartReconcilePromise:null,
  pendingCartChanges:[],
  cartValidationError:null,
  helpfulReviews:new Set(),
  trackedEvents:new Set()
};

function customerAuthToken() {
  return localStorage.getItem("premiumbrandeg:user:token") || localStorage.getItem("siteyfy:user:token") || "";
}

function readLocalCart() {
  try { return JSON.parse(localStorage.getItem("slyrah_cart") || "[]"); } catch { return []; }
}

function saveLocalCart({ invalidateRevision=true } = {}) {
  localStorage.setItem("slyrah_cart", JSON.stringify(state.cart));
  if(invalidateRevision){state.cartRevisionToken="";state.cartVerifiedAt=0;state.checkoutQuote=null;}
  updateCartCount();
}

async function api(endpoint, options = {}) {
  const customerToken=customerAuthToken();
  const response = await fetch(endpoint, { ...options, headers:{ Accept:"application/json", ...(options.body ? { "Content-Type":"application/json" } : {}), ...(customerToken ? { Authorization:`Bearer ${customerToken}` } : {}), ...(options.headers || {}) } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) { const error=new Error(payload?.error?.message || "تعذر تنفيذ الطلب");error.code=payload?.error?.code||payload?.error?.message||"REQUEST_FAILED";error.status=response.status;error.data=payload?.data||payload?.error?.data||null;throw error; }
  return payload?.data ?? payload;
}

function trackingCurrency(){return String(state.currencies?.base_currency||state.market?.currency?.base_currency||"SAR").toUpperCase();}
function trackingContentId(item={}){
  const productId=item.product_id||item.id||item.bundle_id||item.key||"";
  return String(state.marketingPixels?.content_id_source==="sku"?(item.sku||productId):(productId||item.sku));
}
function trackingItem(item={},product=null){
  const source=product||state.products.find(row=>String(row.id)===String(item.product_id))||{};
  return {content_id:trackingContentId({...source,...item}),product_id:Number(item.product_id||source.id||0)||null,variant_id:item.variant_id||null,name:item.name_ar||item.name_en||source.name_ar||source.name_en||"",category:item.category_slug||source.category_slug||source.category_name_en||"",price:Number(item.price??source.sale_price??source.price??0),quantity:Number(item.quantity||1),variant:item.variant_label||""};
}
function loadTrackingScript(src,key){
  if(document.querySelector(`script[data-tracking-script="${key}"]`))return;
  const script=document.createElement("script");script.async=true;script.src=src;script.dataset.trackingScript=key;document.head.appendChild(script);
}
function initializeMarketingPixels(settings={}){
  state.marketingPixels=settings;
  if(settings.meta?.is_enabled&&settings.meta.pixel_id){
    if(!window.fbq){const fbq=window.fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments);};fbq.push=fbq;fbq.loaded=true;fbq.version="2.0";fbq.queue=[];window._fbq=fbq;loadTrackingScript("https://connect.facebook.net/en_US/fbevents.js","meta");}
    window.fbq("init",settings.meta.pixel_id);
  }
  const googleId=settings.google?.measurement_id||settings.google?.ads_id;
  if(settings.google?.is_enabled&&googleId){
    window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag("js",new Date());
    if(settings.google.measurement_id)window.gtag("config",settings.google.measurement_id,{send_page_view:false,debug_mode:settings.debug_mode===true});
    if(settings.google.ads_id)window.gtag("config",settings.google.ads_id,{send_page_view:false});
    loadTrackingScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleId)}`,"google");
  }
  if(settings.tiktok?.is_enabled&&settings.tiktok.pixel_id){
    if(!window.ttq){const ttq=window.ttq=[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=(target,method)=>{target[method]=function(){target.push([method].concat([].slice.call(arguments)));};};ttq.methods.forEach(method=>ttq.setAndDefer(ttq,method));ttq.instance=id=>{const instance=ttq._i?.[id]||[];ttq.methods.forEach(method=>ttq.setAndDefer(instance,method));return instance;};ttq.load=id=>{ttq._i=ttq._i||{};ttq._i[id]=[];ttq._i[id]._u="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._t=ttq._t||{};ttq._t[id]=Date.now();ttq._o=ttq._o||{};ttq._o[id]={};loadTrackingScript(`${ttq._i[id]._u}?sdkid=${encodeURIComponent(id)}&lib=ttq`,"tiktok");};}
    window.ttq.load(settings.tiktok.pixel_id);
  }
}
function trackingPayload(items=[],extra={}){
  const normalized=items.map(item=>trackingItem(item)).filter(item=>item.content_id);
  return {currency:extra.currency||trackingCurrency(),value:Number(extra.value??normalized.reduce((sum,item)=>sum+item.price*item.quantity,0)),transaction_id:extra.transaction_id||"",items:normalized};
}
function trackCommerceEvent(eventName,items=[],extra={}){
  const settings=state.marketingPixels;if(!settings)return;
  const eventId=extra.event_id||(globalThis.crypto?.randomUUID?.()||`evt-${Date.now()}-${Math.random().toString(36).slice(2)}`),payload=trackingPayload(items,extra),contentIds=payload.items.map(item=>item.content_id);
  const metaNames={page_view:"PageView",view_item:"ViewContent",view_cart:"ViewCart",add_to_cart:"AddToCart",remove_from_cart:"RemoveFromCart",begin_checkout:"InitiateCheckout",add_payment_info:"AddPaymentInfo",purchase:"Purchase",search:"Search"};
  const googleNames={page_view:"page_view",view_item:"view_item",view_cart:"view_cart",add_to_cart:"add_to_cart",remove_from_cart:"remove_from_cart",begin_checkout:"begin_checkout",add_payment_info:"add_payment_info",purchase:"purchase",search:"search"};
  const tiktokNames={page_view:"PageView",view_item:"ViewContent",view_cart:"ViewContent",add_to_cart:"AddToCart",remove_from_cart:"RemoveFromCart",begin_checkout:"InitiateCheckout",add_payment_info:"AddPaymentInfo",purchase:"CompletePayment",search:"Search"};
  if(settings.meta?.is_enabled&&window.fbq){const data={content_ids:contentIds,contents:payload.items.map(item=>({id:item.content_id,quantity:item.quantity,item_price:item.price})),content_type:"product",value:payload.value,currency:payload.currency};if(eventName==="search")data.search_string=extra.search_term||"";window.fbq("track",metaNames[eventName]||eventName,data,{eventID:eventId});}
  if(settings.google?.is_enabled&&window.gtag){const data={currency:payload.currency,value:payload.value,transaction_id:payload.transaction_id||undefined,search_term:extra.search_term||undefined,items:payload.items.map(item=>({item_id:item.content_id,item_name:item.name,item_category:item.category,item_variant:item.variant,price:item.price,quantity:item.quantity}))};window.gtag("event",googleNames[eventName]||eventName,data);if(eventName==="purchase"&&settings.google.ads_id&&settings.google.purchase_conversion_label)window.gtag("event","conversion",{send_to:`${settings.google.ads_id}/${settings.google.purchase_conversion_label}`,value:payload.value,currency:payload.currency,transaction_id:payload.transaction_id});}
  if(settings.tiktok?.is_enabled&&window.ttq){const data={content_id:contentIds[0]||undefined,content_type:"product",contents:payload.items.map(item=>({content_id:item.content_id,content_name:item.name,content_category:item.category,quantity:item.quantity,price:item.price})),quantity:payload.items.reduce((sum,item)=>sum+item.quantity,0),value:payload.value,currency:payload.currency,description:payload.items.map(item=>item.name).filter(Boolean).join(", ").slice(0,200)};if(eventName==="search")data.query=extra.search_term||"";if(eventName==="page_view")window.ttq.page();else window.ttq.track(tiktokNames[eventName]||eventName,data);}
  fetch("/api/store/marketing-pixels/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event_id:eventId,event_name:eventName,page_url:location.href,value:payload.value,currency:payload.currency,transaction_id:payload.transaction_id,items:payload.items}),keepalive:true}).catch(()=>{});
}
function trackCommerceEventOnce(key,eventName,items=[],extra={}){if(state.trackedEvents.has(key))return;state.trackedEvents.add(key);trackCommerceEvent(eventName,items,extra);}
function trackPurchase(order={}){const id=String(order.id||order.transaction_id||"");if(!id||localStorage.getItem(`siteyfy_pixel_purchase_${id}`))return;trackCommerceEvent("purchase",order.items||state.cart,{value:Number(order.total||0),currency:order.currency||trackingCurrency(),transaction_id:id});localStorage.setItem(`siteyfy_pixel_purchase_${id}`,new Date().toISOString());}

function esc(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function normalizedDescriptionSource(value = "") {
  return String(value || "")
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/\r\n?|\n/g, "\n")
    .trim();
}

function richDescriptionHtml(value = "") {
  const source = normalizedDescriptionSource(value);
  if (!source) return "";
  const parsed = new DOMParser().parseFromString(`<div id="descriptionRoot">${source}</div>`, "text/html");
  const root = parsed.getElementById("descriptionRoot");
  if (!root) return "";
  const allowed = new Set(["P","BR","STRONG","B","EM","I","UL","OL","LI","H2","H3","H4","A"]);
  const blocked = new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","FORM","INPUT","BUTTON","SVG"]);
  const scrub = parent => {
    [...parent.childNodes].forEach(node => {
      if (node.nodeType === Node.COMMENT_NODE) { node.remove(); return; }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (blocked.has(node.tagName)) { node.remove(); return; }
      scrub(node);
      if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
      const href = node.tagName === "A" ? String(node.getAttribute("href") || "").trim() : "";
      [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
      if (node.tagName === "A" && (/^https?:\/\//i.test(href) || href.startsWith("/"))) {
        node.setAttribute("href", href);
        node.setAttribute("rel", "noopener noreferrer");
      } else if (node.tagName === "A") node.replaceWith(...node.childNodes);
    });
  };
  scrub(root);
  const textNodes = [];
  const walker = parsed.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    if (!node.textContent.includes("\n")) return;
    const lines = node.textContent.split(/\n+/).map(line => line.replace(/[ \t]+/g, " ").trim()).filter(Boolean);
    if (!lines.length) { node.remove(); return; }
    const fragment = parsed.createDocumentFragment();
    lines.forEach((line, index) => { if (index) fragment.append(parsed.createElement("br")); fragment.append(parsed.createTextNode(line)); });
    node.replaceWith(fragment);
  });
  root.querySelectorAll("p,li,h2,h3,h4").forEach(element => { if (!element.textContent.trim() && !element.querySelector("br")) element.remove(); });
  const hasBlock = root.querySelector("p,ul,ol,h2,h3,h4");
  if (!hasBlock && root.textContent.trim()) {
    const lines = root.textContent.split(/\n+/).map(line => line.trim()).filter(Boolean);
    root.innerHTML = lines.map(line => `<p>${esc(line)}</p>`).join("");
  }
  return root.innerHTML.trim();
}

function descriptionExcerpt(value = "", limit = 220) {
  const text = productText(normalizedDescriptionSource(value)).replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
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

function productInStock(product) {
  if (product?.inventory_mode === "out_of_stock" || product?.in_stock === false || product?.is_in_stock === false || product?.stock_status === "out_of_stock") return false;
  const variants = activeVariants(product);
  return !variants.length || variants.some(variantInStock);
}

function productCardPurchase(product) {
  const variants=activeVariants(product),available=variants.filter(variantInStock);
  if(!productInStock(product))return { mode:"sold_out",variant:null };
  if(!variants.length)return { mode:"direct",variant:null };
  if(!available.length)return { mode:"sold_out",variant:null };
  if(available.length===1)return { mode:"direct",variant:available[0] };
  return { mode:"select",variant:null };
}

function productCardActions(product, pinnedVariant = null, productLink = "") {
  const purchase=!productInStock(product)
    ? { mode:"sold_out",variant:null }
    : pinnedVariant
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

function productMedia(product) {
  const main = product.main_photo_url || product.image_url || "";
  const saved = Array.isArray(product.media_gallery) ? product.media_gallery : Array.isArray(product.mediaGallery) ? product.mediaGallery : [];
  const rows = [{ type:"image", url:main, alt_ar:product.name_ar || "" }, ...saved, ...productImages(product).map(url => ({ type:"image", url }))];
  const seen = new Set();
  return rows.map((item, index) => typeof item === "string" ? { type:/\.(mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(item)?"video":"image",url:item,sort_order:index } : { ...item, type:item.type === "video" ? "video" : "image", sort_order:Number(item.sort_order ?? index) })
    .filter(item => item.url && !seen.has(item.url) && seen.add(item.url));
}

function productText(value = "") {
  const html = String(value || "")
    .replace(/\\r\\n|\\n|\\r/g, "\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, "\n");
  const documentValue = new DOMParser().parseFromString(html, "text/html");
  return String(documentValue.body.textContent || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
  const soldOut = !productInStock(product);
  const badges=(product.labels||[]).filter(label=>label.is_active!==false&&label.isActive!==false).map(label=>({text:label.nameAr||label.name_ar||label.nameEn||label.name_en||String(label),color:/^#[0-9a-f]{3,8}$/i.test(String(label.backgroundColor||""))?label.backgroundColor:"#513b82"})).filter(label=>!sale||!/^(تخفيض|sale)$/i.test(label.text)).slice(0,2);
  return `<article class="product-card" data-product-card="${product.id}" data-card-href="/product/${product.id}" tabindex="0" aria-label="${esc(product.name_ar || product.name_en)}">
    <div class="product-media ${soldOut ? "is-out-of-stock" : ""}">
      ${sale ? `<span class="sale-badge">تخفيض</span>` : ""}
      ${badges.length?`<div class="product-card-badges ${sale?"under-sale":""}">${badges.map(label=>`<span style="--badge-bg:${esc(label.color)}">${esc(label.text)}</span>`).join("")}</div>`:""}
      ${soldOut ? `<span class="stock-badge">Out of Stock</span>` : ""}
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
  const soldOut = !productInStock(product) || (variant && !variantInStock(variant));
  const labels = [option && value ? `${option}: ${value}` : value].filter(Boolean);
  return `<article class="product-card collection-product-card" data-product-card="${product.id}" data-card-href="${esc(link)}" tabindex="0" aria-label="${esc(product.name_ar || product.name_en)}">
    <div class="product-media ${soldOut ? "is-out-of-stock" : ""}">
      ${compare ? `<span class="sale-badge">تخفيض</span>` : ""}
      ${soldOut ? `<span class="stock-badge">Out of Stock</span>` : ""}
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
  return `<article class="product-card bundle-card"><div class="product-media"><span class="bundle-badge">طقم</span><a href="/bundle/${bundle.id}" aria-label="${esc(bundle.name_ar)}">${bundleVisual(bundle,true)}</a></div><div class="product-info"><div class="product-meta">${Number(bundle.item_count||bundle.items?.length||0)} منتجات معًا</div><a class="product-title" href="/bundle/${bundle.id}">${esc(bundle.name_ar||bundle.name_en)}</a><div class="price">${compare>Number(bundle.price)?`<del>${money(compare)}</del>`:""}<strong>${money(bundle.price)}</strong></div><a class="card-add bundle-card-link" href="/bundle/${bundle.id}">عرض الطقم</a></div></article>`;
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
    <nav class="main-nav desktop-only"><a href="/" class="${pathname==="/"?"active":""}">الرئيسية</a><a href="/products" class="${pathname==="/products"||pathname==="/shop"||pathname.startsWith("/product/")?"active":""}">المتجر</a><a href="/cart" class="${pathname==="/cart"?"active":""}">السلة</a><a href="/checkout">إتمام الطلب</a><a href="#footer">تواصل معنا</a><a href="/page/about-us" class="${pathname==="/page/about-us"?"active":""}">من نحن</a></nav>
    <div class="header-actions start desktop-only">${layout.show_search!==false?`<button class="round-action" type="button" data-search-open aria-label="البحث">${icon("search")}</button>`:""}${layout.show_cart!==false?`<a class="round-action" href="/cart" aria-label="السلة">${icon("shopping-cart")}<span class="cart-count" data-cart-count>0</span></a>`:""}${layout.show_wishlist!==false?`<button class="round-action" aria-label="المفضلة">${icon("heart")}</button>`:""}<a class="login-button" href="${state.customer?"/account":"/login.html"}"><span>${state.customer?"حسابي":"تسجيل الدخول"}</span>${icon("user-round",18)}</a></div>
    <button class="round-action mobile-only" type="button" data-menu-open aria-label="القائمة">${icon("menu")}</button>
    <div class="header-actions mobile-only"><button class="round-action" type="button" data-search-open aria-label="البحث">${icon("search")}</button><a class="round-action" href="/cart" aria-label="السلة">${icon("shopping-cart")}<span class="cart-count" data-cart-count>0</span></a></div>
  </div></header>${layout.show_category_strip!==false ? categoryStripHtml() : ""}`;
}

function repeatingScrollTrack(itemHtml, enabled) {
  if (!enabled) return itemHtml;
  return `<div class="auto-scroll-segment" data-scroll-segment>${itemHtml}</div><div class="auto-scroll-segment" data-scroll-segment data-scroll-clone aria-hidden="true">${itemHtml}</div><div class="auto-scroll-segment" data-scroll-segment data-scroll-clone aria-hidden="true">${itemHtml}</div>`;
}

function categoryStripHtml() {
  const saved=state.appearance?.layout?.header?.shortcuts;
  const items=Array.isArray(saved)?saved.filter(item=>item.is_active!==false):state.categories.filter(category=>!category.parent_id&&category.show_in_category_strip!==false).map(category=>({type:"category",ref:category.slug,title_ar:category.name_ar,title_en:category.name_en,image_url:category.image_url}));
  const visible=items.map(item=>{
    const type=String(item.type||"category"),ref=String(item.ref||"");
    const source=type==="facet"?state.facets.find(facet=>String(facet.id)===ref):state.categories.find(category=>String(category.slug)===ref||String(category.id)===ref);
    if(type!=="all"&&(!source||source.is_active===false||source.isActive===false))return null;
    const href=type==="all"?"/products":type==="facet"?`/products?facet=${encodeURIComponent(ref)}`:`/products?category=${encodeURIComponent(source.slug)}`;
    return {href,title:item.title_ar||source?.name_ar||source?.nameAr||source?.name_en||source?.nameEn||"كل المنتجات",image:item.image_url||source?.image_url||""};
  }).filter(Boolean);
  if(!visible.length)return "";
  const header = state.appearance?.layout?.header || {};
  const autoScroll = header.category_strip_auto_scroll !== false;
  const scrollSpeed = Math.max(8, Math.min(36, Number(header.category_strip_scroll_speed || 18)));
  const shortcuts = visible.map(item=>`<a class="category-shortcut" href="${esc(item.href)}"><span>${esc(item.title)}</span>${item.image?`<img src="${esc(item.image)}" alt="" />`:""}</a>`).join("");
  return `<div class="category-strip"><div class="container category-strip-inner" data-drag-scroll data-auto-scroll="${autoScroll}" data-scroll-speed="${scrollSpeed}">${repeatingScrollTrack(shortcuts, autoScroll)}</div></div>`;
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
  const configuredPolicies=[
    [footer.store_policy_url,label("سياسة المتجر","Store policy")],
    [footer.shipping_policy_url,label("الشحن والتوصيل","Shipping & delivery")],
    [footer.privacy_policy_url,label("سياسة الخصوصية","Privacy policy")]
  ].map(([url,title])=>({url:footerLinkUrl(url),title})).filter(item=>item.url);
  const dynamicPages=state.pages.filter(page=>page.is_active!==false&&page.show_in_footer!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(page=>({url:`/page/${encodeURIComponent(page.slug)}`,title:(english?page.footer_title_en:page.footer_title_ar)||(english?page.title_en:page.title_ar)||page.title_ar||page.title_en}));
  const policies=dynamicPages.length?dynamicPages:configuredPolicies;
  const aboutPage=state.pages.find(page=>page.slug==="about-us"&&page.is_active!==false);
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
    <section class="footer-column footer-navigation"><h3>${label("روابط تهمك","Explore")}</h3><nav aria-label="${label("روابط الفوتر","Footer navigation")}"><a href="/products">${label("تسوقي المنتجات","Shop all")}</a><a href="/cart">${label("سلة التسوق","Shopping bag")}</a>${footer.show_policies!==false?policies.map(item=>`<a href="${esc(item.url)}">${esc(item.title)}</a>`).join(""):aboutPage?`<a href="/page/about-us">${label("من نحن","About us")}</a>`:""}</nav></section>
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
  openOverlay(`<aside class="side-drawer"><div class="drawer-head"><img src="${esc(company.logo_url)}" alt="" /><button class="close-button" data-overlay-close aria-label="إغلاق">${icon("x")}</button></div><div class="drawer-body"><nav class="drawer-menu"><a href="/">الرئيسية</a><a href="/products">المتجر</a><a href="/cart">السلة</a><a href="/checkout">إتمام الطلب</a><a href="${state.customer?"/account":"/login.html"}">${state.customer?"حسابي وعناويني":"تسجيل الدخول"}</a><a href="#footer" data-overlay-close>تواصل معنا</a><a href="/page/about-us">من نحن</a></nav></div><div class="drawer-foot"><a class="primary-button" href="/products">تسوق الآن</a></div></aside>`);
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
  bindAutoScroll();
  bindProductCardNavigation();
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
      if(event.pointerType!=="mouse"||event.button!==0||rail.scrollWidth<=rail.clientWidth+1||event.target.closest("a,button,input,select,textarea,[data-card-href],[role='button']"))return;
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

function homeRail(rows, id, renderer = product => productCard(product, true), settings = {}) {
  const autoScroll = settings.auto_scroll !== false;
  const scrollSpeed = Math.max(8, Math.min(36, Number(settings.auto_scroll_speed || 18)));
  const cards = rows.map(renderer).join("");
  return `<div class="home-rail-shell"><button class="rail-arrow rail-prev" type="button" data-rail-target="${id}" data-rail-direction="1" aria-label="السابق">${icon("chevron-right",24)}</button><div class="home-rail" id="${id}" data-drag-scroll data-auto-scroll="${autoScroll}" data-scroll-speed="${scrollSpeed}">${repeatingScrollTrack(cards, autoScroll)}</div><button class="rail-arrow rail-next" type="button" data-rail-target="${id}" data-rail-direction="-1" aria-label="التالي">${icon("chevron-left",24)}</button></div>`;
}

function homeCategory(category) {
  return `<a class="category-card" href="/products?category=${encodeURIComponent(category.slug)}"><img src="${esc(category.image_url)}" alt="${esc(category.name_ar)}" loading="lazy" /><span>${esc(category.name_ar)}</span></a>`;
}

function featuredProductCard(product) {
  const compare=comparePrice(product);
  const soldOut=!productInStock(product);
  return `<article class="featured-product-card" data-card-href="/product/${product.id}" tabindex="0" aria-label="${esc(product.name_ar || product.name_en)}"><a class="featured-product-image ${soldOut?"is-out-of-stock":""}" href="/product/${product.id}">${soldOut?`<span class="stock-badge">Out of Stock</span>`:""}<img src="${esc(product.main_photo_url||product.image_url)}" alt="${esc(product.name_ar)}" loading="lazy" /></a><div class="featured-product-info"><div class="product-meta">${esc(productCategoryName(product))}</div><a class="featured-product-title" href="/product/${product.id}">${esc(product.name_ar||product.name_en)}</a><div class="featured-stars" aria-label="التقييم">★★★★★</div><div class="price">${compare?`<del>${money(compare)}</del>`:""}<strong>${money(productPrice(product))}</strong></div>${productCardActions(product)}</div></article>`;
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

function bindAutoScroll() {
  document.querySelectorAll('[data-auto-scroll="true"]').forEach((rail) => {
    if (rail.dataset.autoScrollBound === "true") return;
    rail.dataset.autoScrollBound = "true";
    rail.querySelectorAll("[data-scroll-clone] a,[data-scroll-clone] button,[data-scroll-clone] input,[data-scroll-clone] select,[data-scroll-clone] textarea,[data-scroll-clone] [tabindex]").forEach((element) => {
      element.tabIndex = -1;
    });
    let paused = false;
    const isRtl = getComputedStyle(rail).direction === "rtl";
    const segments = [...rail.querySelectorAll(":scope > [data-scroll-segment]")];
    const loopSpan = segments.length > 1 ? Math.abs(segments[1].offsetLeft - segments[0].offsetLeft) : 0;
    let direction = isRtl ? -1 : 1;
    let position = rail.scrollLeft;
    let lastFrame = performance.now();
    const speed = Math.max(8, Math.min(36, Number(rail.dataset.scrollSpeed || 18)));
    const normalizeLoop = () => {
      if (loopSpan <= 1) return;
      if (isRtl) {
        while (position <= -loopSpan) position += loopSpan;
        while (position > 0) position -= loopSpan;
      } else {
        while (position >= loopSpan) position -= loopSpan;
        while (position < 0) position += loopSpan;
      }
    };
    const pause = () => { paused = true; };
    const resume = () => { paused = false; position = rail.scrollLeft; normalizeLoop(); rail.scrollLeft = position; lastFrame = performance.now(); };
    rail.addEventListener("pointerenter", pause);
    rail.addEventListener("pointerleave", resume);
    rail.addEventListener("focusin", pause);
    rail.addEventListener("focusout", (event) => { if (!rail.contains(event.relatedTarget)) resume(); });
    rail.addEventListener("pointerdown", pause);
    rail.addEventListener("pointerup", resume);
    rail.addEventListener("pointercancel", resume);
    const tick = (now) => {
      if (!rail.isConnected) return;
      const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
      if (!paused && maxScroll > 2) {
        const elapsed = Math.min(64, now - lastFrame);
        position += direction * speed * elapsed / 1000;
        if (loopSpan > 1) {
          normalizeLoop();
        } else {
          const minScroll = isRtl ? -maxScroll : 0;
          const maxScrollValue = isRtl ? 0 : maxScroll;
          if (position <= minScroll) { position = minScroll; direction = 1; }
          else if (position >= maxScrollValue) { position = maxScrollValue; direction = -1; }
        }
        rail.scrollLeft = position;
      } else if (paused) {
        position = rail.scrollLeft;
      }
      lastFrame = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function bindProductCardNavigation() {
  document.querySelectorAll("[data-card-href]").forEach((card) => {
    if (card.dataset.cardNavigationBound === "true") return;
    card.dataset.cardNavigationBound = "true";
    const navigate = () => { if (card.dataset.cardHref) location.href = card.dataset.cardHref; };
    card.addEventListener("click", (event) => {
      if (event.target.closest("a,button,input,select,textarea,[role='button'],[contenteditable='true']")) return;
      navigate();
    });
    card.addEventListener("keydown", (event) => {
      if (event.target !== card || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      navigate();
    });
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
    : homeRail(visible, railId, (item) => collectionItemCard(item, collection, true), section);
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
  const categoryRank=(category)=>{const index=categoryOrder.indexOf(category.name_ar);return index<0?categoryOrder.length:index;};
  const categoryRows=state.categories.filter(category=>!category.parent_id&&category.show_on_home!==false).sort((a,b)=>categoryRank(a)-categoryRank(b));
  const eidProducts=state.products.slice(0,8);
  const sectionSettings = (key) => (state.builder?.sections || []).find((section) => {
    const source = String(section.source || "").toLowerCase();
    const type = String(section.type || "").toLowerCase();
    if (key === "categories") return type === "categories" || source === "categories";
    if (key === "offers") return source === "sale" || String(section.id || "").includes("offer");
    return false;
  }) || {};
  const fixed = {
    offers:`<section class="section home-offers"><div class="container"><div class="section-head"><h2>أفضل عروض رداء الحشمة</h2><a class="section-link" href="/products">مشاهدة الكل</a></div>${homeRail(saleProducts.length?saleProducts:state.products.slice(0,8),"offersRail",product=>productCard(product,true),sectionSettings("offers"))}</div></section>`,
    categories:`<section class="section home-categories"><div class="container"><div class="section-head center"><h2>تسوق التصنيفات</h2></div>${homeRail(categoryRows,"categoriesRail",homeCategory,sectionSettings("categories"))}</div></section>`,
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

function categoryIncludesProduct(category, product) {
  if(category?.category_type==="smart")return (category.product_ids||[]).map(Number).includes(Number(product.id));
  if(category?.parent_id)return (product.subcategory_ids||[]).map(Number).includes(Number(category.id));
  return Number(product.category_id)===Number(category?.id) || String(product.category_slug||product.category?.slug)===String(category?.slug) || (product.categories||[]).some(item=>String(item.slug)===String(category?.slug));
}

function optionMatches(variant, value=state.option) { return !value || String(variant.value||variant.option||"")===value; }
function colorMatches(variant, value=state.color) { return !value || String(variant.color||variant.color_id||"").toLowerCase()===String(value).toLowerCase(); }
function matchingCatalogProducts(omit="") {
  let rows=[...state.products];
  if(omit!=="category"&&state.category){const category=state.categories.find(item=>!item.parent_id&&String(item.slug)===state.category);rows=rows.filter(product=>categoryIncludesProduct(category,product));}
  if(omit!=="subcategory"&&state.subcategory){const subcategory=state.categories.find(item=>item.parent_id&&String(item.slug)===state.subcategory);rows=rows.filter(product=>categoryIncludesProduct(subcategory,product));}
  if(omit!=="facet"&&state.facet)rows=rows.filter(product=>(product.facet_ids||[]).map(String).includes(state.facet));
  if(omit!=="collection"&&state.collection){const collection=state.collections.find(item=>String(item.slug)===state.collection);const ids=new Set(collectionItems(collection).map(item=>Number(item.product_id||item.product?.id)));rows=rows.filter(product=>ids.has(Number(product.id)));}
  if((omit!=="color"&&state.color)||(omit!=="option"&&state.option))rows=rows.filter(product=>activeVariants(product).some(variant=>colorMatches(variant,omit==="color"?"":state.color)&&optionMatches(variant,omit==="option"?"":state.option)));
  if(omit!=="price")rows=rows.filter(product=>{const price=productPrice(product);return price>=Number(state.minPrice||0)&&(!Number.isFinite(state.maxPrice)||price<=state.maxPrice);});
  return rows;
}
function filteredProducts() {
  const rows=matchingCatalogProducts();
  const selectedCategory=state.categories.find(category=>String(category.slug)===state.category);
  if(state.sort==="price-asc")rows.sort((a,b)=>productPrice(a)-productPrice(b));
  else if(state.sort==="price-desc")rows.sort((a,b)=>productPrice(b)-productPrice(a));
  else if(state.sort==="name")rows.sort((a,b)=>(a.name_ar||"").localeCompare(b.name_ar||"","ar"));
  else if(selectedCategory?.category_type==="smart"){const ranks=new Map((selectedCategory.product_ids||[]).map((id,index)=>[Number(id),index]));rows.sort((a,b)=>(ranks.get(Number(a.id))??9999)-(ranks.get(Number(b.id))??9999));}
  return rows;
}

function renderProducts() {
  const allPrices=state.products.flatMap(product=>[productPrice(product),...activeVariants(product).map(variant=>variantPrice(product,variant))]);
  const maxCatalog=Math.ceil(Math.max(...allPrices,100)/10)*10;
  if(!Number.isFinite(state.maxPrice))state.maxPrice=maxCatalog;
  const rows=filteredProducts();
  const perPage=12;
  const pages=Math.max(1,Math.ceil(rows.length/perPage));
  state.page=Math.min(state.page,pages);
  const visible=rows.slice((state.page-1)*perPage,state.page*perPage);
  const visibleBundles=state.page===1&&!state.category&&!state.subcategory&&!state.facet&&!state.color&&!state.option&&!state.collection?state.bundles:[];
  const selectedCategory=state.categories.find(category=>!category.parent_id&&String(category.slug)===state.category);
  const selectedSubcategory=state.categories.find(category=>category.parent_id&&String(category.slug)===state.subcategory);
  const pageTitle=selectedSubcategory?.name_ar||selectedSubcategory?.name_en||selectedCategory?.name_ar||selectedCategory?.name_en||"المتجر";
  shell(`${breadcrumbs(pageTitle)}<section class="container"><div class="shop-head"><h1>${esc(pageTitle)}</h1>${selectedCategory?.description_ar?`<p>${esc(selectedCategory.description_ar)}</p>`:""}</div><div class="shop-layout"><div><div class="shop-toolbar"><div class="view-tools"><button class="view-button active">${icon("grid-3x3",19)}</button><button class="view-button">${icon("list",19)}</button><button class="mobile-filter-button mobile-only" id="mobileFilter">${icon("sliders-horizontal",17)}فلترة</button></div><div class="sort-tools"><label>الترتيب الافتراضي</label><select class="store-select" id="sortProducts"><option value="default">الترتيب الافتراضي</option><option value="price-asc">السعر: من الأقل للأعلى</option><option value="price-desc">السعر: من الأعلى للأقل</option><option value="name">الاسم</option></select></div></div>${visibleBundles.length?`<div class="bundle-shop-heading"><span>وفر أكثر</span><h2>أطقم مختارة لك</h2></div>`:""}<div class="product-grid shop-grid">${visibleBundles.map(bundleCard).join("")}${visible.map(productCard).join("")}</div>${visible.length?`<div class="pagination">${Array.from({length:pages},(_,index)=>`<button class="page-button ${index+1===state.page?"active":""}" data-page="${index+1}">${index+1}</button>`).join("")}</div>`:`<div class="no-results"><div><h2>لا توجد منتجات</h2><p>جرّبي اختيار تصنيف أو سعر مختلف.</p></div></div>`}</div>${filterHtml(maxCatalog)}</div></section>`);
  document.getElementById("sortProducts").value=state.sort;
  document.getElementById("sortProducts").onchange=event=>{state.sort=event.target.value;state.page=1;renderProducts();};
  document.querySelectorAll("[data-page]").forEach(button=>button.onclick=()=>{state.page=Number(button.dataset.page);renderProducts();scrollTo({top:0,behavior:"smooth"});});
  bindFilters();
}

function filterHtml(maxCatalog) {
  const countFor=(omit,predicate)=>matchingCatalogProducts(omit).filter(predicate).length;
  const categories=state.categories.filter(category=>!category.parent_id&&category.show_in_filters!==false&&category.is_active!==false).map(category=>({...category,count:countFor("category",product=>categoryIncludesProduct(category,product))})).filter(category=>category.count||state.category===category.slug);
  const selectedRoot=state.categories.find(category=>!category.parent_id&&String(category.slug)===state.category);
  const subcategories=state.categories.filter(category=>category.parent_id&&Number(category.parent_id)===Number(selectedRoot?.id)&&category.show_in_filters!==false&&category.is_active!==false).map(category=>({...category,count:countFor("subcategory",product=>categoryIncludesProduct(category,product))})).filter(category=>category.count||state.subcategory===category.slug);
  const facets=state.facets.filter(facet=>facet.is_active!==false&&facet.isActive!==false).map(facet=>({...facet,count:countFor("facet",product=>(product.facet_ids||[]).map(String).includes(String(facet.id)))})).filter(facet=>facet.count||state.facet===String(facet.id));
  const colorMap=new Map();matchingCatalogProducts("color").forEach(product=>{const seen=new Set();activeVariants(product).filter(variant=>optionMatches(variant)).forEach(variant=>{const value=String(variant.color||"").trim();const key=value.toLowerCase();if(!key||seen.has(key))return;seen.add(key);const row=colorMap.get(key)||{value,hex:variant.hex_code||variant.hex||"#ddd",count:0};row.count++;colorMap.set(key,row);});});
  if(state.color&&!colorMap.has(state.color.toLowerCase())){const variant=state.products.flatMap(activeVariants).find(item=>String(item.color||"").toLowerCase()===state.color.toLowerCase());if(variant)colorMap.set(state.color.toLowerCase(),{value:state.color,hex:variant.hex_code||variant.hex||"#ddd",count:0});}
  const colors=[...colorMap.values()].sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value,"ar"));
  const visibleColors=state.showAllColors?colors:colors.slice(0,12);
  const optionMap=new Map();matchingCatalogProducts("option").forEach(product=>{const seen=new Set();activeVariants(product).filter(variant=>colorMatches(variant)).forEach(variant=>{const value=String(variant.value||variant.option||"").trim();if(!value||seen.has(value))return;seen.add(value);const row=optionMap.get(value)||{value,group:variant.option||"خيارات المنتج",count:0};row.count++;optionMap.set(value,row);});});
  if(state.option&&!optionMap.has(state.option))optionMap.set(state.option,{value:state.option,group:"خيارات المنتج",count:0});
  const options=[...optionMap.values()].sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value,"ar"));
  const collections=state.collections.filter(item=>item.is_active!==false).map(item=>({...item,count:countFor("collection",product=>collectionItems(item).some(entry=>Number(entry.product_id||entry.product?.id)===Number(product.id)))})).filter(item=>item.count||state.collection===item.slug);
  const min=Math.min(Number(state.minPrice||0),maxCatalog),max=Math.max(Number(state.maxPrice||maxCatalog),min);
  const list=(rows,key,valueOf,nameOf)=>`<div class="filter-list">${rows.map(row=>{const value=String(valueOf(row));return `<button type="button" class="${state[key]===value?"active":""}" data-filter-key="${key}" data-filter-value="${esc(value)}" aria-pressed="${state[key]===value}"><span>${esc(nameOf(row))}</span><small>${row.count}</small></button>`}).join("")}</div>`;
  return `<aside class="filter-sidebar" id="filterSidebar"><div class="mobile-filter-close mobile-only"><button class="close-button" id="closeFilter">${icon("x")}</button></div><div class="filter-sidebar-head"><strong>فلترة المنتجات</strong><button type="button" data-clear-filters>مسح الكل</button></div><section class="filter-panel"><h2 class="filter-title">التصنيفات</h2><div class="filter-list"><button type="button" class="${!state.category?"active":""}" data-filter-key="category" data-filter-value=""><span>كل المنتجات</span></button></div>${list(categories,"category",row=>row.slug,row=>row.name_ar||row.name_en)}</section>${subcategories.length?`<section class="filter-panel"><h2 class="filter-title">التصنيفات الفرعية</h2>${list(subcategories,"subcategory",row=>row.slug,row=>row.name_ar||row.name_en)}</section>`:""}${facets.length?`<section class="filter-panel"><h2 class="filter-title">الفئات</h2>${list(facets,"facet",row=>row.id,row=>row.name_ar||row.nameAr||row.name_en||row.nameEn)}</section>`:""}${colors.length?`<section class="filter-panel"><h2 class="filter-title">الألوان <small>${colors.length}</small></h2><div class="filter-color-grid" role="group" aria-label="الألوان">${visibleColors.map(color=>`<button type="button" class="filter-color-dot ${state.color===color.value?"active":""}" data-filter-key="color" data-filter-value="${esc(color.value)}" title="${esc(color.value)} · ${color.count} منتجات" aria-label="${esc(color.value)}" aria-pressed="${state.color===color.value}"><span style="background:${esc(color.hex)}"></span></button>`).join("")}</div>${colors.length>12?`<button type="button" class="filter-more" id="toggleAllColors">${state.showAllColors?"عرض أقل":`عرض كل الألوان (${colors.length})`}</button>`:""}${state.color?`<small class="filter-selected-value">${esc(state.color)}</small>`:""}</section>`:""}${options.length?`<section class="filter-panel"><h2 class="filter-title">${esc(options[0].group.replace(/^أختر\s*/, ""))}</h2>${list(options,"option",row=>row.value,row=>row.value)}</section>`:""}${collections.length?`<section class="filter-panel"><h2 class="filter-title">المجموعات</h2>${list(collections,"collection",row=>row.slug,row=>row.name_ar||row.name_en)}</section>`:""}<section class="filter-panel"><h2 class="filter-title">نطاق السعر</h2><div class="price-range-dual"><input class="price-range price-range-min" id="minPrice" type="range" min="0" max="${maxCatalog}" step="5" value="${min}" aria-label="الحد الأدنى للسعر"/><input class="price-range price-range-max" id="maxPrice" type="range" min="0" max="${maxCatalog}" step="5" value="${max}" aria-label="الحد الأقصى للسعر"/></div><div class="price-filter-copy"><span><b id="minPriceCopy">${money(min)}</b> - <b id="maxPriceCopy">${money(max)}</b></span><button class="filter-apply" id="applyPrice">تصفية</button></div></section></aside>`;
}

function bindFilters() {
  const updateUrl=()=>{const url=new URL(location.href);[["category",state.category],["subcategory",state.subcategory],["facet",state.facet],["color",state.color],["option",state.option],["collection",state.collection],["min_price",state.minPrice||""],["max_price",Number.isFinite(state.maxPrice)&&state.maxPrice<Math.ceil(Math.max(...state.products.flatMap(product=>[productPrice(product),...activeVariants(product).map(variant=>variantPrice(product,variant))]),100)/10)*10?state.maxPrice:""]].forEach(([key,value])=>value?url.searchParams.set(key,value):url.searchParams.delete(key));url.searchParams.delete("label");history.replaceState(null,"",url.pathname+url.search);};
  document.querySelectorAll("[data-filter-key]").forEach(button=>button.onclick=()=>{const key=button.dataset.filterKey,value=button.dataset.filterValue;state[key]=state[key]===value?"":value;if(key==="category"){const root=state.categories.find(item=>!item.parent_id&&String(item.slug)===state.category);const sub=state.categories.find(item=>item.parent_id&&String(item.slug)===state.subcategory);if(!root||!sub||Number(sub.parent_id)!==Number(root.id))state.subcategory="";}state.page=1;updateUrl();renderProducts();});
  document.querySelector("[data-clear-filters]")?.addEventListener("click",()=>{Object.assign(state,{category:"",subcategory:"",facet:"",color:"",option:"",collection:"",minPrice:0,maxPrice:Infinity,page:1});updateUrl();renderProducts();});
  document.getElementById("toggleAllColors")?.addEventListener("click",()=>{state.showAllColors=!state.showAllColors;renderProducts();});
  const min=document.getElementById("minPrice"),max=document.getElementById("maxPrice");
  const sync=()=>{if(Number(min.value)>Number(max.value)){if(document.activeElement===min)max.value=min.value;else min.value=max.value;}document.getElementById("minPriceCopy").innerHTML=money(min.value);document.getElementById("maxPriceCopy").innerHTML=money(max.value);};
  min.oninput=max.oninput=sync;document.getElementById("applyPrice").onclick=()=>{state.minPrice=Number(min.value);state.maxPrice=Number(max.value);state.page=1;updateUrl();renderProducts();};
  const sidebar=document.getElementById("filterSidebar");document.getElementById("mobileFilter")?.addEventListener("click",()=>{sidebar.classList.add("mobile-open");document.body.classList.add("is-locked")});document.getElementById("closeFilter")?.addEventListener("click",()=>{sidebar.classList.remove("mobile-open");document.body.classList.remove("is-locked")});
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

const externalScriptPromises=new Map();

function loadExternalScript(src,key){
  if(externalScriptPromises.has(key))return externalScriptPromises.get(key);
  const existing=document.querySelector(`script[data-payment-widget="${key}"]`);
  const promise=new Promise((resolve,reject)=>{
    if(existing?.dataset.loaded==="true")return resolve();
    const script=existing||document.createElement("script");
    const loaded=()=>{script.dataset.loaded="true";resolve();};
    const failed=()=>{externalScriptPromises.delete(key);reject(new Error(`${key.toUpperCase()}_WIDGET_LOAD_FAILED`));};
    script.addEventListener("load",loaded,{once:true});script.addEventListener("error",failed,{once:true});
    if(!existing){script.src=src;script.async=true;script.dataset.paymentWidget=key;document.head.appendChild(script);}
  });
  externalScriptPromises.set(key,promise);return promise;
}

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
  widget.id=`${root.id||"product"}-tamara-widget`;
  widget.setAttribute("type","tamara-summary");
  widget.setAttribute("amount",amount.toFixed(2));
  widget.setAttribute("currency",context.currency);
  widget.setAttribute("inline-type","2");
  widget.setAttribute("config",JSON.stringify({badgePosition:context.language==="ar"?"right":"left",showExtraContent:""}));
  box.appendChild(widget);
  root.appendChild(box);
  try{await loadExternalScript("https://cdn.tamara.co/widget-v2/tamara-widget.js","tamara");}catch{box.remove();}
}

let productPaymentWidgetRenderId=0;
async function renderInstallmentWidgets(product,price){
  const root=document.getElementById("productPaymentWidgets");if(!root)return;
  const methods=state.paymentMethods?.methods||[];
  const widgets=state.paymentMethods?.widgets;
  const tabby=methods.find(item=>item.id==="tabby"&&item.public_key);
  const tamara=widgets?widgets.tamara:methods.find(item=>item.id==="tamara"&&item.public_key);
  const amount=Number(price||0),context=paymentWidgetContext();
  const tabbyAllowed=tabby&&paymentAmountAllowed(tabby,amount,context);
  const tamaraAllowed=paymentAmountAllowed(tamara,amount,context);
  const renderId=++productPaymentWidgetRenderId;
  if(!tabbyAllowed&&!tamaraAllowed){root.innerHTML="";root.hidden=true;root.classList.remove("is-loading");root.style.removeProperty("--product-payment-height");return;}
  const expectedHeight=(tabbyAllowed?88:0)+(tamaraAllowed?80:0)+(tabbyAllowed&&tamaraAllowed?8:0);
  const reservedHeight=Math.max(Math.ceil(root.getBoundingClientRect().height),expectedHeight);
  root.style.setProperty("--product-payment-height",`${reservedHeight}px`);
  root.innerHTML="";root.hidden=false;root.classList.add("is-loading");
  const tasks=[];
  if(tabbyAllowed){
    const box=document.createElement("div");box.id="tabbyPromoWidget";box.className="installment-widget";root.appendChild(box);
    tasks.push((async()=>{try{await loadExternalScript("https://checkout.tabby.ai/tabby-promo.js","tabby");if(renderId!==productPaymentWidgetRenderId||!box.isConnected)return;window.TabbyPromo?.({selector:"#tabbyPromoWidget",currency:context.currency,price:amount.toFixed(2),lang:context.language,publicKey:tabby.public_key,merchantCode:tabby.merchant_code||context.country});}catch{if(renderId===productPaymentWidgetRenderId)box.remove();}})());
  }
  if(tamaraAllowed)tasks.push(renderTamaraProductWidget(root,tamara,amount,context));
  await Promise.all(tasks);
  if(renderId!==productPaymentWidgetRenderId||document.getElementById("productPaymentWidgets")!==root)return;
  root.hidden=!root.children.length;root.classList.remove("is-loading");
  if(root.children.length){requestAnimationFrame(()=>{if(renderId===productPaymentWidgetRenderId&&root.isConnected)root.style.setProperty("--product-payment-height",`${Math.max(reservedHeight,Math.ceil(root.scrollHeight))}px`);});}
}

let checkoutPaymentWidgetRenderId=0;
async function renderCheckoutPaymentWidgets(amount){
  const methods=state.paymentMethods?.methods||[],widgets=state.paymentMethods?.widgets||{},context=paymentWidgetContext(),total=Number(amount||0);
  const signature=[total.toFixed(2),context.currency,context.country,context.language].join(":");
  const tamara=widgets.tamara||methods.find(item=>item.id==="tamara"&&item.public_key),tamaraRoot=document.getElementById("checkout-tamara-widget");
  const tabby=methods.find(item=>item.id==="tabby"&&item.public_key),tabbyRoot=document.getElementById("checkout-tabby-widget");
  if(tamaraRoot?.dataset.paymentWidgetSignature===signature&&tabbyRoot?.dataset.paymentWidgetSignature===signature)return;
  const renderId=++checkoutPaymentWidgetRenderId;
  if(tamaraRoot){tamaraRoot.innerHTML="";tamaraRoot.dataset.paymentWidgetSignature=signature;if(paymentAmountAllowed(tamara,total,context))await renderTamaraProductWidget(tamaraRoot,tamara,total,context);}
  if(renderId!==checkoutPaymentWidgetRenderId)return;
  if(tabbyRoot){tabbyRoot.innerHTML="";tabbyRoot.dataset.paymentWidgetSignature=signature;if(paymentAmountAllowed(tabby,total,context)){try{await loadExternalScript("https://checkout.tabby.ai/tabby-promo.js","tabby");if(renderId===checkoutPaymentWidgetRenderId&&document.getElementById("checkout-tabby-widget")===tabbyRoot)window.TabbyPromo?.({selector:"#checkout-tabby-widget",currency:context.currency,price:total.toFixed(2),lang:context.language,publicKey:tabby.public_key,merchantCode:tabby.merchant_code||context.country});}catch{if(renderId===checkoutPaymentWidgetRenderId)tabbyRoot.innerHTML="";}}}
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
  let displayedVariant=selectedVariant;
  let quantity=1;
  const media=productMedia(product);
  const initialImage=selectedVariant?.image_url || media.find(item=>item.type === "image")?.url || product.main_photo_url;
  let mediaIndex=Math.max(0,media.findIndex(item=>item.url===initialImage));
  const mediaKey=value=>String(value||"").split("?")[0];
  const mediaIsOutOfStock=(item,variant=displayedVariant)=>{
    if(!productInStock(product))return true;
    if(!item||item.type!=="image")return false;
    const itemKey=mediaKey(item.url);
    const relatedVariants=variants.filter(row=>mediaKey(row.image_url)===itemKey);
    if(variant&&mediaKey(variant.image_url)===itemKey)return !variantInStock(variant);
    return relatedVariants.length>0&&relatedVariants.every(row=>!variantInStock(row));
  };
  const updateMediaStockState=()=>{
    const unavailable=mediaIsOutOfStock(media[mediaIndex]);
    const galleryStage=document.getElementById("productGalleryStage"),stockOverlay=document.getElementById("productStockOverlay");
    galleryStage?.classList.toggle("is-out-of-stock",unavailable);
    if(stockOverlay)stockOverlay.hidden=!unavailable;
    document.querySelectorAll("[data-gallery-index]").forEach((button,index)=>button.classList.toggle("is-out-of-stock",mediaIsOutOfStock(media[index])));
  };
  const thumbnail=(item,index)=>`<button class="gallery-thumb ${index===mediaIndex?"active":""} ${item.type==="video"?"is-video":""}" type="button" data-gallery-index="${index}" aria-label="${item.type==="video"?"تشغيل فيديو المنتج":`عرض صورة ${index+1}`}">${item.type==="video"?`<video src="${esc(item.url)}" muted preload="metadata" playsinline></video><span>${icon("play",17)}</span>`:`<img src="${esc(item.url)}" alt="" loading="lazy" />`}</button>`;
  const shortDescription=descriptionExcerpt(product.short_description_ar||"");
  const fullDescription=richDescriptionHtml(product.description_ar||product.short_description_ar||"");
  shell(`${breadcrumbs(product.name_ar)}<section class="container product-page"><div class="product-detail"><div class="product-gallery"><div class="gallery-thumbs" id="galleryThumbs">${media.map(thumbnail).join("")}</div><div class="gallery-main" id="productGalleryStage" aria-live="polite"><div id="galleryStageContent"></div><span class="product-stock-overlay" id="productStockOverlay" hidden>Out of Stock</span>${media.length>1?`<button class="gallery-nav gallery-prev" id="galleryPrev" type="button" aria-label="الوسائط السابقة">${icon("chevron-left")}</button><button class="gallery-nav gallery-next" id="galleryNext" type="button" aria-label="الوسائط التالية">${icon("chevron-right")}</button>`:""}<button class="zoom-hint" id="zoomProduct" type="button" aria-label="عرض بالحجم الكامل">${icon("maximize-2")}</button></div></div><div class="product-summary"><div class="product-meta">${esc(productCategoryName(product))}</div><h1>${esc(product.name_ar)}</h1>${shortDescription?`<p class="short-description">${esc(shortDescription)}</p>`:""}<div class="product-rating-summary" id="productRatingSummary" hidden></div><div class="price detail-price" id="detailPrice"></div><p class="tax-inclusive">السعر شامل الضريبة</p><div class="product-sales-proof" id="productSalesProof" hidden></div><div id="productPaymentWidgets" class="product-payment-widgets"></div><div id="variantControls"></div><p class="variant-stock-state" id="variantStockState" role="status" hidden>${icon("circle-alert",17)}نفدت كمية هذا الاختيار</p><div class="purchase-row"><div class="quantity-control"><button id="qtyPlus" aria-label="زيادة الكمية">+</button><strong id="qtyValue">1</strong><button id="qtyMinus" aria-label="تقليل الكمية">−</button></div><button class="primary-button" id="addProduct">${icon("shopping-cart")}إضافة إلى السلة</button></div><button class="secondary-button buy-now" id="buyNow">اشتري الآن</button><div class="product-trust"><span>${icon("shield-check",18)}دفع آمن وبيانات محمية</span><span>${icon("badge-check",18)}منتج أصلي من رداء الحشمة</span></div></div></div>${fullDescription?`<section class="detail-description"><h2>وصف المنتج</h2><div class="rich-description">${fullDescription}</div></section>`:""}<section class="product-reviews-root" id="productReviewsRoot" data-product-id="${esc(product.id)}" aria-live="polite"><div class="reviews-loading" aria-label="جاري تحميل التقييمات"><span></span><span></span><span></span></div></section></section><section class="section soft"><div class="container"><div class="section-head"><h2>منتجات قد تعجبك</h2></div><div class="product-grid">${state.products.filter(item=>item.id!==product.id).slice(0,4).map(productCard).join("")}</div></div></section>`);

  const openCurrentMedia=()=>{
    if(!media[mediaIndex])return;
    openOverlay(`<div class="lightbox" role="dialog" aria-modal="true" aria-label="معرض صور المنتج"><button class="close-button" data-overlay-close aria-label="إغلاق">${icon("x")}</button><div class="lightbox-media" id="lightboxMedia"></div>${media.length>1?`<button class="lightbox-nav lightbox-prev" type="button" aria-label="الوسائط السابقة">${icon("chevron-left",28)}</button><button class="lightbox-nav lightbox-next" type="button" aria-label="الوسائط التالية">${icon("chevron-right",28)}</button>`:""}<span class="lightbox-counter" id="lightboxCounter"></span></div>`);
    const draw=()=>{const item=media[mediaIndex],target=document.getElementById("lightboxMedia");if(!target)return;target.innerHTML=item.type==="video"?`<video src="${esc(item.url)}" controls autoplay playsinline></video>`:`<img src="${esc(item.url)}" alt="${esc(product.name_ar)}" />`;document.getElementById("lightboxCounter").textContent=`${mediaIndex+1} / ${media.length}`;};
    const move=direction=>{renderMedia(mediaIndex+direction);draw();};
    overlayRoot.querySelector(".lightbox-prev")?.addEventListener("click",()=>move(-1));
    overlayRoot.querySelector(".lightbox-next")?.addEventListener("click",()=>move(1));
    draw();hydrateIcons();
  };
  const renderMedia=(nextIndex)=>{
    if(!media.length)return;
    mediaIndex=(nextIndex+media.length)%media.length;
    const item=media[mediaIndex];
    const stage=document.getElementById("galleryStageContent");
    stage.innerHTML=item.type==="video"?`<video id="mainProductVideo" src="${esc(item.url)}" controls preload="metadata" playsinline></video>`:`<img id="mainProductImage" src="${esc(item.url)}" alt="${esc(product.name_ar)}" draggable="false" /><span class="image-zoom-lens" id="imageZoomLens" aria-hidden="true"></span>`;
    document.querySelectorAll("[data-gallery-index]").forEach((button,index)=>button.classList.toggle("active",index===mediaIndex));
    const zoom=document.getElementById("zoomProduct");
    zoom.innerHTML=item.type==="video"?icon("maximize"):icon("maximize-2");
    zoom.onclick=openCurrentMedia;
    if(item.type==="image"&&matchMedia("(hover:hover) and (pointer:fine)").matches){
      const image=stage.querySelector("img"),lens=document.getElementById("imageZoomLens");
      stage.onpointermove=event=>{const rect=image.getBoundingClientRect();const x=Math.max(0,Math.min(rect.width,event.clientX-rect.left));const y=Math.max(0,Math.min(rect.height,event.clientY-rect.top));lens.style.left=`${x}px`;lens.style.top=`${y}px`;lens.style.backgroundImage=`url("${String(item.url).replaceAll('"','%22')}")`;lens.style.backgroundSize=`${rect.width*2.4}px ${rect.height*2.4}px`;lens.style.backgroundPosition=`${-(x*2.4-lens.offsetWidth/2)}px ${-(y*2.4-lens.offsetHeight/2)}px`;lens.classList.add("visible");};
      stage.onpointerleave=()=>lens.classList.remove("visible");
      image.onclick=openCurrentMedia;
    } else { stage.onpointermove=null;stage.onpointerleave=null; }
    updateMediaStockState();
    hydrateIcons();
  };
  const selectMediaByUrl=url=>{const index=media.findIndex(item=>item.url===url);if(index>=0)renderMedia(index);};
  renderMedia(mediaIndex);
  document.querySelectorAll("[data-gallery-index]").forEach(button=>button.onclick=()=>renderMedia(Number(button.dataset.galleryIndex)));
  document.getElementById("galleryPrev")?.addEventListener("click",()=>renderMedia(mediaIndex-1));
  document.getElementById("galleryNext")?.addEventListener("click",()=>renderMedia(mediaIndex+1));
  let touchStart=null;
  document.getElementById("productGalleryStage")?.addEventListener("touchstart",event=>{touchStart=event.touches[0]?.clientX??null;},{passive:true});
  document.getElementById("productGalleryStage")?.addEventListener("touchend",event=>{if(touchStart===null)return;const end=event.changedTouches[0]?.clientX??touchStart;if(Math.abs(touchStart-end)>48)renderMedia(mediaIndex+(touchStart>end?1:-1));touchStart=null;},{passive:true});
  const currentVariant=()=>selectedVariant || variants.find(variant=>(!selectedColor||variant.color===selectedColor)&&(!selectedValue||variant.value===selectedValue)) || variants.find(variant=>!selectedColor||variant.color===selectedColor) || variants[0] || null;
  const update=()=>{
    const colorRows=uniqueColors(product);
    const valueRows=variants.filter(variant=>!selectedColor||variant.color===selectedColor);
    const values=[...new Set(valueRows.map(variant=>variant.value).filter(Boolean))];
    if(values.length&&!values.includes(selectedValue))selectedValue=valueRows.find(variantInStock)?.value||values[0];
    if(!values.length)selectedValue="";
    const variant=currentVariant();
    displayedVariant=variant;
    document.getElementById("variantControls").innerHTML=`${colorRows.length?`<div class="variant-group"><div class="variant-group-title"><span>اللون</span><small>${esc(selectedColor)}</small></div><div class="variant-options">${colorRows.map(color=>{const unavailable=!variants.some(row=>row.color===color.name&&variantInStock(row));return `<button class="color-option ${color.name===selectedColor?"selected":""} ${unavailable?"is-out-of-stock":""}" style="--color:${esc(color.hex)}" title="${esc(color.name)}${unavailable?" - نفدت الكمية":""}" aria-label="${esc(color.name)}${unavailable?" - نفدت الكمية":""}" aria-pressed="${color.name===selectedColor}" data-select-color="${esc(color.name)}"><span class="color-chip" aria-hidden="true"></span><span>${esc(color.name)}</span>${unavailable?`<small>نفد</small>`:""}</button>`;}).join("")}</div></div>`:""}${values.length?`<div class="variant-group"><div class="variant-group-title"><span>${esc(variant?.option||"الاختيار")}</span><small>${esc(selectedValue)}</small></div><div class="variant-options">${values.map(value=>{const unavailable=!valueRows.some(row=>row.value===value&&variantInStock(row));return `<button class="text-option ${value===selectedValue?"selected":""} ${unavailable?"is-out-of-stock":""}" aria-label="${esc(value)}${unavailable?" - نفدت الكمية":""}" aria-pressed="${value===selectedValue}" data-select-value="${esc(value)}"><span>${esc(value)}</span>${unavailable?`<small>نفد</small>`:""}</button>`;}).join("")}</div></div>`:""}`;
    const price=variantPrice(product,variant);const compare=variant?.compare_at_price!==null&&variant?.compare_at_price!==undefined?Number(variant.compare_at_price):comparePrice(product);document.getElementById("detailPrice").innerHTML=`${compare>price?`<del>${money(compare)}</del>`:""}<strong>${money(price)}</strong>`;renderInstallmentWidgets(product,price);
    const unavailable=!productInStock(product)||Boolean(variant&&!variantInStock(variant)),stockState=document.getElementById("variantStockState"),addButton=document.getElementById("addProduct"),buyButton=document.getElementById("buyNow");
    stockState.hidden=!unavailable;stockState.innerHTML=unavailable?`${icon("circle-alert",17)}${variant?"نفدت كمية هذا الاختيار":"نفدت كمية المنتج"}`:"";addButton.disabled=unavailable;buyButton.disabled=unavailable;addButton.innerHTML=unavailable?`${icon("circle-x",18)}نفدت الكمية`:`${icon("shopping-cart")}إضافة إلى السلة`;buyButton.textContent=unavailable?"هذا الاختيار غير متاح":"اشتري الآن";
    if(variant?.image_url)selectMediaByUrl(variant.image_url);
    else updateMediaStockState();
    updateVariantUrl(variant);
    document.querySelectorAll("[data-select-color]").forEach(button=>button.onclick=()=>{selectedVariant=null;selectedColor=button.dataset.selectColor;update();[...document.querySelectorAll("[data-select-color]")].find(el=>el.dataset.selectColor===selectedColor)?.focus({preventScroll:true});});
    document.querySelectorAll("[data-select-value]").forEach(button=>button.onclick=()=>{selectedVariant=null;selectedValue=button.dataset.selectValue;update();[...document.querySelectorAll("[data-select-value]")].find(el=>el.dataset.selectValue===selectedValue)?.focus({preventScroll:true});});
    hydrateIcons();
  };
  update();
  trackCommerceEventOnce(`view_item:${product.id}:${currentVariant()?.id||"default"}`,"view_item",[{...product,product_id:product.id,price:variantPrice(product,currentVariant()),quantity:1,variant_id:currentVariant()?.id||null,variant_label:variantLabel(currentVariant()||{})}],{value:variantPrice(product,currentVariant())});
  document.getElementById("qtyPlus").onclick=()=>{quantity+=1;document.getElementById("qtyValue").textContent=quantity;};
  document.getElementById("qtyMinus").onclick=()=>{quantity=Math.max(1,quantity-1);document.getElementById("qtyValue").textContent=quantity;};
  document.getElementById("addProduct").onclick=()=>{const variant=currentVariant();if(!productInStock(product)||(variant&&!variantInStock(variant))){toast("نفدت كمية هذا الاختيار");return;}addToCart(product,variant,quantity);};
  document.getElementById("buyNow").onclick=()=>{const variant=currentVariant();if(!productInStock(product)||(variant&&!variantInStock(variant))){toast("نفدت كمية هذا الاختيار");return;}addToCart(product,variant,quantity,false);location.href="/cart";};
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

function dynamicPageContentHtml(content="") {
  const lines=String(content||"").replace(/\r/g,"").split("\n"),html=[];
  let paragraph=[],list=[];
  const flushParagraph=()=>{if(paragraph.length){html.push(`<p>${paragraph.map(esc).join("<br />")}</p>`);paragraph=[];}};
  const flushList=()=>{if(list.length){html.push(`<ul>${list.map(item=>`<li>${esc(item)}</li>`).join("")}</ul>`);list=[];}};
  lines.forEach(raw=>{const line=raw.trim();if(!line){flushParagraph();flushList();return;}if(line.startsWith("## ")){flushParagraph();flushList();html.push(`<h2>${esc(line.slice(3).trim())}</h2>`);return;}if(/^[-*]\s+/.test(line)){flushParagraph();list.push(line.replace(/^[-*]\s+/,""));return;}flushList();paragraph.push(line);});
  flushParagraph();flushList();return html.join("");
}

function renderDynamicPage(page) {
  const english=document.documentElement.lang==="en"||localStorage.getItem("language")==="en";
  const title=(english?page.title_en:page.title_ar)||page.title_ar||page.title_en||"";
  const content=(english?page.content_en:page.content_ar)||page.content_ar||page.content_en||"";
  const description=(english?page.meta_description_en:page.meta_description_ar)||page.meta_description_ar||page.meta_description_en||"";
  const company=state.appearance?.company||{};
  document.title=`${title} | ${(english?company.site_name_en:company.site_name_ar)||company.site_name_ar||"رداء الحشمة"}`;
  const meta=document.querySelector('meta[name="description"]');if(meta&&description)meta.content=description;
  shell(`${breadcrumbs(title)}<article class="dynamic-page"><header class="dynamic-page-head"><div class="container"><span>${english?"Information":"معلومات المتجر"}</span><h1>${esc(title)}</h1>${description?`<p>${esc(description)}</p>`:""}</div></header><div class="container dynamic-page-layout"><nav class="dynamic-page-index" aria-label="${english?"Store pages":"صفحات المتجر"}">${state.pages.filter(row=>row.is_active!==false&&row.show_in_footer!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)).map(row=>`<a href="/page/${encodeURIComponent(row.slug)}" class="${row.slug===page.slug?"active":""}">${esc((english?row.footer_title_en:row.footer_title_ar)||(english?row.title_en:row.title_ar)||row.title_ar||row.title_en)}</a>`).join("")}</nav><section class="dynamic-page-body">${dynamicPageContentHtml(content)}</section></div></article>`);
}

async function refreshCustomerProfile(){const result=await api("/api/users/profile");state.customer=result.user||result;return state.customer;}

function customerAddressIcon(type){return type==="work"?"briefcase-business":type==="other"?"map-pinned":"house";}

function accountAddressCard(address){
  return `<article class="account-address-card ${address.is_default?"is-default":""}"><header><span>${icon(customerAddressIcon(address.type),20)}</span><div><h3>${esc(address.label||"العنوان")}</h3><small>${address.is_default?"العنوان الافتراضي":address.type==="work"?"العمل":address.type==="home"?"المنزل":"عنوان محفوظ"}</small></div>${address.is_default?`<b>افتراضي</b>`:""}</header><p>${esc(addressSummary(address))}</p><dl><div><dt>الرمز المختصر</dt><dd><bdi>${esc(address.short_address||"-")}</bdi></dd></div><div><dt>المستلم</dt><dd>${esc(address.full_name||[address.first_name,address.last_name].filter(Boolean).join(" "))}</dd></div><div><dt>الجوال</dt><dd><bdi>${esc(address.phone||"")}</bdi></dd></div></dl><footer>${address.is_default?"":`<button type="button" data-address-default="${address.id}">${icon("check",15)}تعيين كافتراضي</button>`}<button type="button" data-address-edit="${address.id}">${icon("pencil",15)}تعديل</button><button class="danger" type="button" data-address-delete="${address.id}">${icon("trash-2",15)}حذف</button></footer></article>`;
}

function accountAddressForm(address={}){
  const countries=state.market?.countries||[],countryCode=address.country_code||state.market?.settings?.default_country_code||"SA";
  return `<form class="account-address-dialog" id="accountAddressForm"><header><div><span>دفتر العناوين</span><h2>${address.id?"تعديل العنوان":"إضافة عنوان جديد"}</h2></div><button type="button" class="close-button" data-overlay-close aria-label="إغلاق">${icon("x")}</button></header><div class="account-address-dialog-body"><section class="address-kind-picker"><label><input type="radio" name="type" value="home" ${!address.type||address.type==="home"?"checked":""}/><span>${icon("house",18)}المنزل</span></label><label><input type="radio" name="type" value="work" ${address.type==="work"?"checked":""}/><span>${icon("briefcase-business",18)}العمل</span></label><label><input type="radio" name="type" value="other" ${address.type==="other"?"checked":""}/><span>${icon("map-pinned",18)}آخر</span></label></section><div class="account-address-grid"><label>اسم العنوان<input name="label" value="${esc(address.label||"")}" maxlength="60" placeholder="مثال: المنزل الرئيسي" required /></label><label>الدولة<select name="country_code" required>${countries.map(country=>`<option value="${country.code}" ${country.code===countryCode?"selected":""}>${country.code==="SA"?"🇸🇦 ":""}${esc(country.name_ar||country.name_en)}</option>`).join("")}</select></label><label>الاسم الأول<input name="first_name" value="${esc(address.first_name||state.customer?.name?.split(/\s+/)[0]||"")}" required /></label><label>اسم العائلة<input name="last_name" value="${esc(address.last_name||state.customer?.name?.split(/\s+/).slice(1).join(" ")||"")}" required /></label><label>رقم الجوال<input name="phone" value="${esc(address.phone||state.customer?.phone||"")}" required /></label><label>الرمز الوطني المختصر<div class="account-short-address"><input name="short_address" value="${esc(address.short_address||"")}" maxlength="9" required /><button type="button" id="resolveAccountAddress">${icon("map-pin-check",17)}تحقق</button></div></label><label>المنطقة<input name="province" value="${esc(address.province||"")}" required /></label><label>المدينة<input name="city" value="${esc(address.city||"")}" required /></label><label>الحي<input name="district" value="${esc(address.district||"")}" required /></label><label>الشارع<input name="street" value="${esc(address.street||"")}" required /></label><label>رقم المبنى<input name="building_number" value="${esc(address.building_number||"")}" required /></label><label>الرمز البريدي<input name="postal_code" value="${esc(address.postal_code||"")}" required /></label><label>الرقم الإضافي<input name="additional_number" value="${esc(address.additional_number||"")}" /></label><label class="full">ملاحظات العنوان<textarea name="address_notes">${esc(address.address_notes||"")}</textarea></label><input name="latitude" type="hidden" value="${esc(address.latitude??"")}"/><input name="longitude" type="hidden" value="${esc(address.longitude??"")}"/></div><p class="account-address-message" id="accountAddressMessage"></p></div><footer><button type="button" class="secondary-button" data-overlay-close>إلغاء</button><button type="submit" class="primary-button">${icon("check",17)}حفظ العنوان</button></footer></form>`;
}

function openAccountAddressEditor(address={}){
  openOverlay(accountAddressForm(address));const form=document.getElementById("accountAddressForm"),message=document.getElementById("accountAddressMessage");
  document.getElementById("resolveAccountAddress")?.addEventListener("click",async event=>{const button=event.currentTarget,code=String(form.elements.short_address.value||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(!/^[A-Z]{4}[0-9]{4}$/.test(code)){message.textContent="أدخل 4 أحرف ثم 4 أرقام.";return;}button.disabled=true;message.textContent="جاري التحقق من العنوان...";try{const result=await api("/api/store/address/sa/resolve",{method:"POST",body:JSON.stringify({short_address:code})});Object.entries(result.address||{}).forEach(([name,value])=>{if(form.elements[name]&&value!==null)form.elements[name].value=value;});form.elements.short_address.value=code;message.textContent="تم التحقق وملء بيانات العنوان.";}catch(error){message.textContent=error.message;}finally{button.disabled=false;}});
  form.onsubmit=async event=>{event.preventDefault();if(!form.reportValidity())return;const button=form.querySelector('[type="submit"]');button.disabled=true;message.textContent="جاري حفظ العنوان...";const body=Object.fromEntries(new FormData(form));try{await api(address.id?`/api/users/addresses/${address.id}`:"/api/users/addresses",{method:address.id?"PATCH":"POST",body:JSON.stringify(body)});await refreshCustomerProfile();closeOverlay();renderAccount();toast("تم حفظ العنوان");}catch(error){message.textContent=error.message;button.disabled=false;}};
}

async function renderAccount(){
  if(!state.customer){location.href="/login.html";return;}
  const customer=state.customer,addresses=customer.addresses||[],ordersPayload=await api("/api/orders/my-orders").catch(()=>({orders:[]})),orders=ordersPayload.orders||[];
  shell(`${breadcrumbs("حسابي")}<section class="container account-page"><header class="account-hero"><div><span>حساب العميل</span><h1>مرحبًا، ${esc(customer.name||customer.full_name||"")}</h1><p>تحكمي في بياناتك وعناوين التوصيل من مكان واحد.</p></div><a class="secondary-button" href="/products">متابعة التسوق</a></header><div class="account-layout"><aside class="account-nav"><a href="#profileSection">البيانات الشخصية</a><a href="#addressesSection">عناويني <b>${addresses.length}</b></a><a href="#ordersSection">طلباتي <b>${orders.length}</b></a></aside><div class="account-content"><section class="account-panel" id="profileSection"><header><div><span>الملف الشخصي</span><h2>بيانات الحساب</h2></div></header><form class="account-profile-form" id="accountProfileForm"><label>الاسم الكامل<input name="name" value="${esc(customer.name||customer.full_name||"")}" required /></label><label>البريد الإلكتروني<input name="email" type="email" value="${esc(customer.email||"")}" required /></label><label>رقم الجوال<input name="phone" type="tel" value="${esc(customer.phone||"")}" /></label><button class="primary-button" type="submit">${icon("save",17)}حفظ البيانات</button></form></section><section class="account-panel" id="addressesSection"><header><div><span>دفتر العناوين</span><h2>عناوين التوصيل</h2><p>اختاري عنوانًا افتراضيًا ليظهر تلقائيًا عند إتمام الطلب.</p></div><button class="primary-button" type="button" id="addAccountAddress">${icon("plus",17)}إضافة عنوان</button></header><div class="account-address-list">${addresses.length?addresses.map(accountAddressCard).join(""):`<div class="account-empty"><span>${icon("map-pin",28)}</span><h3>لا توجد عناوين محفوظة</h3><p>أضيفي عنوان المنزل أو العمل لتسريع إتمام الطلب.</p></div>`}</div></section><section class="account-panel" id="ordersSection"><header><div><span>سجل الطلبات</span><h2>طلباتي</h2></div></header><div class="account-orders">${orders.length?orders.slice(0,12).map(order=>`<article><div><strong>طلب #${esc(order.id)}</strong><span>${esc(order.status||"pending")}</span></div><p>${esc(addressSummary(order.shipping_address||order.customer||{}))}</p><b>${money(order.total||0)}</b></article>`).join(""):`<div class="account-empty"><h3>لا توجد طلبات حتى الآن</h3></div>`}</div></section></div></div></section>`);
  document.getElementById("addAccountAddress").onclick=()=>openAccountAddressEditor();
  document.querySelectorAll("[data-address-edit]").forEach(button=>button.onclick=()=>openAccountAddressEditor(addresses.find(row=>String(row.id)===button.dataset.addressEdit)||{}));
  document.querySelectorAll("[data-address-default]").forEach(button=>button.onclick=async()=>{button.disabled=true;try{await api(`/api/users/addresses/${button.dataset.addressDefault}/default`,{method:"PATCH",body:"{}"});await refreshCustomerProfile();renderAccount();toast("تم تغيير العنوان الافتراضي");}catch(error){toast(error.message);button.disabled=false;}});
  document.querySelectorAll("[data-address-delete]").forEach(button=>button.onclick=async()=>{if(!confirm("هل تريد حذف هذا العنوان؟"))return;button.disabled=true;try{await api(`/api/users/addresses/${button.dataset.addressDelete}`,{method:"DELETE"});await refreshCustomerProfile();renderAccount();toast("تم حذف العنوان");}catch(error){toast(error.message);button.disabled=false;}});
  document.getElementById("accountProfileForm").onsubmit=async event=>{event.preventDefault();const button=event.currentTarget.querySelector("button");button.disabled=true;try{const body=Object.fromEntries(new FormData(event.currentTarget));const result=await api("/api/users/profile",{method:"PATCH",body:JSON.stringify(body)});state.customer=result.user;renderAccount();toast("تم حفظ بيانات الحساب");}catch(error){toast(error.message);button.disabled=false;}};
}

function renderStoreRoute() {
  const path=location.pathname.replace(/\/$/,"")||"/";
  trackCommerceEventOnce(`page_view:${location.pathname}${location.search}`,"page_view",[],{value:0});
  if(path==="/")renderHome();
  else if(path==="/products"||path==="/shop")renderProducts();
  else if(path.startsWith("/product/")){const id=decodeURIComponent(path.split("/").pop());const product=state.products.find(item=>String(item.id)===id||item.slug===id);const migratedBundle=state.bundles.find(item=>String(item.legacy_product_id||"")===id||String(item.legacy_product_slug||"")===id);if(product)renderProduct(product);else if(migratedBundle)location.replace(`/bundle/${encodeURIComponent(migratedBundle.slug||migratedBundle.id)}`);else renderNotFound();}
  else if(path.startsWith("/collection/")){const slug=decodeURIComponent(path.split("/").pop());const collection=state.collections.find(item=>String(item.id)===slug||item.slug===slug);collection?renderCollection(collection):renderNotFound();}
  else if(path.startsWith("/bundle/")){const id=decodeURIComponent(path.split("/").pop());const bundle=state.bundles.find(item=>String(item.id)===id||item.slug===id);bundle?renderBundle(bundle):renderNotFound();}
  else if(path.startsWith("/page/")){const slug=decodeURIComponent(path.split("/").pop());const page=state.pages.find(item=>item.slug===slug&&item.is_active!==false);page?renderDynamicPage(page):renderNotFound();}
  else if(path==="/account")renderAccount();
  else if(path==="/cart")renderCart(false);
  else if(path==="/checkout")renderCart(true);
  else if(path.startsWith("/payment/tamara/"))renderTamaraReturn(path.split("/").pop());
  else if(path==="/payment/edfapay/return")renderEdfaPayReturn();
  else if(path.startsWith("/payment/tabby/"))renderTabbyReturn(path.split("/").pop());
  else renderNotFound();
}

function renderBundle(bundle) {
  let quantity=1;
  const options=(bundle.variants||bundle.bundle_variants||[]).filter(option=>option.is_active!==false);
  let selected=options.find(option=>String(option.id)===String(bundle.default_variant_id))||options.find(option=>Number(option.available_stock)!==0)||options[0]||null;
  const current=()=>selected||bundle;
  const draw=()=>{
    const active=current(),items=active.items||bundle.items||[],compare=Number(active.compare_at_price||active.regular_total||bundle.compare_at_price||bundle.regular_total||0),price=Number(active.price??bundle.price??0),saving=Math.max(0,Number(active.savings??active.regular_total-price));
    const shortDescription=descriptionExcerpt(bundle.short_description_ar||bundle.description_ar||"",240);
    const fullDescription=richDescriptionHtml(bundle.description_ar||bundle.short_description_ar||"");
    const optionButtons=options.map(option=>{const soldOut=Number(option.available_stock)===0;return `<button type="button" data-bundle-option="${esc(option.id)}" class="${String(option.id)===String(selected?.id)?"active":""} ${soldOut?"is-out-of-stock":""}" ${soldOut?"disabled":""}>${option.hex_code?`<i style="--bundle-color:${esc(option.hex_code)}"></i>`:""}<b>${esc(option.label_ar||option.label_en||option.color||"خيار")}</b><small>${soldOut?"نفد":money(option.price)}</small></button>`;}).join("");
    shell(`${breadcrumbs(bundle.name_ar||"أطقم المنتجات")}<section class="container product-page bundle-page"><div class="product-detail"><div class="bundle-main-visual">${active.image_url?`<img src="${esc(active.image_url)}" alt="${esc(active.label_ar||active.label_en||bundle.name_ar||"")}"/>`:bundleVisual({...bundle,items})}</div><div class="product-summary"><div class="product-meta">طقم خاص · ${Number(active.item_count||items.length||0)} قطع</div><h1>${esc(bundle.name_ar||bundle.name_en)}</h1><div class="price detail-price">${compare>price?`<del>${money(compare)}</del>`:""}<strong>${money(price)}</strong></div>${saving?`<div class="bundle-saving">وفّري ${money(saving)} عند شراء الطقم</div>`:""}${shortDescription?`<p class="short-description">${esc(shortDescription)}</p>`:""}</div></div><section class="bundle-includes"><div class="section-head center"><h2>الطقم يحتوي على</h2></div><div class="bundle-items-row">${items.map((item,index)=>`${index?`<span class="bundle-item-plus">+</span>`:""}<a class="bundle-item-card" href="/product/${item.product_id}"><img src="${esc(item.image_url)}" alt="${esc(item.name_ar)}" /><div><span>${item.quantity>1?`${item.quantity} × `:""}منتج #${item.product_id}</span><strong>${esc(item.name_ar||item.name_en)}</strong>${item.variant_label?`<em>${esc(item.variant_label)}</em>`:""}<small>${money(item.unit_price)}</small></div></a>`).join("")}</div></section>${fullDescription?`<section class="detail-description"><h2>وصف الطقم</h2><div class="rich-description">${fullDescription}</div></section>`:""}<section class="bundle-configurator" id="bundleConfigurator"><header><span>اختيارات الطقم</span><h2>اختاري اللون ونوع الشرشف</h2><p>اللون المختار يطبّق على السجادة والشرشف معًا، ثم حددي خياطة الشرشف المناسبة.</p></header>${options.length?`<div class="bundle-option-picker"><span>اللون والخياطة</span><div>${optionButtons}</div></div>`:""}<div class="bundle-configurator-summary"><div><small>سعر الاختيار</small><div class="price detail-price">${compare>price?`<del>${money(compare)}</del>`:""}<strong>${money(price)}</strong></div>${saving?`<span class="bundle-saving">وفّري ${money(saving)}</span>`:""}</div><div class="bundle-purchase-actions"><div class="purchase-row"><div class="quantity-control"><button id="bundleQtyPlus" aria-label="زيادة الكمية">+</button><strong id="bundleQtyValue">${quantity}</strong><button id="bundleQtyMinus" aria-label="تقليل الكمية">−</button></div><button class="primary-button" id="addBundle" ${active.available_stock===0?"disabled":""}>${icon("shopping-cart")}${active.available_stock===0?"نفد هذا الاختيار":"إضافة الطقم للسلة"}</button></div><button class="secondary-button buy-now" id="buyBundleNow" ${active.available_stock===0?"disabled":""}>اشتري الآن</button></div></div></section></section>`);
    document.querySelectorAll("[data-bundle-option]").forEach(button=>button.onclick=()=>{selected=options.find(option=>String(option.id)===button.dataset.bundleOption)||selected;quantity=1;draw();requestAnimationFrame(()=>document.getElementById("bundleConfigurator")?.scrollIntoView({block:"start"}));});
    const update=()=>document.getElementById("bundleQtyValue").textContent=quantity;
    document.getElementById("bundleQtyPlus").onclick=()=>{const max=current().available_stock;quantity=max===null||max===undefined?quantity+1:Math.min(Number(max),quantity+1);update();};
    document.getElementById("bundleQtyMinus").onclick=()=>{quantity=Math.max(1,quantity-1);update();};
    document.getElementById("addBundle").onclick=()=>addBundleToCart(bundle,selected,quantity);
    document.getElementById("buyBundleNow").onclick=()=>{if(addBundleToCart(bundle,selected,quantity,false)!==false)location.href="/cart";};
    hydrateIcons();
  };
  draw();
}

function addBundleToCart(bundle, option=null, quantity=1, notify=true) {
  const selected=option||bundle, optionId=option?.id||null;
  const available=selected.available_stock;
  if(available!==null&&available!==undefined&&Number(quantity||1)>Number(available)){toast("نفدت كمية هذا الاختيار");return false;}
  const key=`bundle:${bundle.id}:${optionId||"default"}`;
  const item={key,item_type:"bundle",bundle_id:bundle.id,bundle_variant_id:optionId,variant_id:optionId,product_id:0,name_ar:bundle.name_ar,name_en:bundle.name_en,image_url:option?.image_url||bundle.main_photo_url||selected.items?.[0]?.image_url||"",bundle_main_photo_url:bundle.main_photo_url||"",variant_label:option?(option.label_ar||option.label_en||option.color||""):`${bundle.item_count||bundle.items?.length||0} منتجات`,price:Number(selected.price??bundle.price??0),quantity:Number(quantity||1),bundle_items:selected.items||bundle.items||[]};
  const existing=state.cart.find(entry=>entry.key===key);if(existing)existing.quantity+=item.quantity;else state.cart.push(item);
  saveLocalCart();api("/api/cart",{method:"POST",body:JSON.stringify(item)}).catch(()=>{});trackCommerceEvent("add_to_cart",[item],{value:item.price*item.quantity});if(notify)toast("تمت إضافة الطقم إلى السلة");
  return true;
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
  trackCommerceEvent("add_to_cart",[item],{value:item.price*item.quantity});
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

function cartPageName(){return location.pathname==="/checkout"?"checkout":"cart";}

function checkoutFormState(){
  const form=document.getElementById("checkoutForm");if(!form)return null;
  return [...new FormData(form).entries()].reduce((result,[key,value])=>{result[key]=value;return result;},{});
}

function restoreCheckoutFormState(values){
  const form=document.getElementById("checkoutForm");if(!form||!values)return;
  Object.entries(values).forEach(([name,value])=>{
    const controls=[...form.querySelectorAll(`[name="${String(name).replaceAll('"','\\"')}"]`)];
    controls.forEach(control=>{if(control.type==="radio"||control.type==="checkbox")control.checked=String(control.value)===String(value);else control.value=value;});
  });
  form.querySelector('[name="payment_method"]:checked')?.dispatchEvent(new Event("change",{bubbles:true}));
}

async function revalidateCartDiscount(){
  let discount=null;try{discount=JSON.parse(localStorage.getItem("slyrah_discount")||"null");}catch{}
  const codes=appliedPromotionCodes(discount);if(!codes.length)return;
  try{const tracking=await promotionTrackingFields();const result=await api("/api/store/promotions/evaluate",{method:"POST",body:JSON.stringify({codes,order_total:state.cart.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||1),0),items:state.cart,tracking_action:"revalidate",...tracking})});localStorage.setItem("slyrah_discount",JSON.stringify(result));}
  catch{clearDiscount();}
}

function cartChangeTitle(change={}){
  if(change.type==="price_changed")return "تم تحديث السعر";
  if(change.type==="quantity_adjusted")return "تم تعديل الكمية المتاحة";
  if(change.type==="item_updated")return "تم تحديث بيانات المنتج";
  if(change.type==="out_of_stock")return "نفدت الكمية";
  return "لم يعد المنتج متاحًا";
}

function showCartChanges(changes=[]){
  if(!changes.length)return;
  const rows=changes.map(change=>`<article class="cart-update-line"><span class="cart-update-icon">${icon(change.type==="price_changed"?"badge-dollar-sign":change.type==="quantity_adjusted"?"package-check":change.type==="item_updated"?"refresh-cw":"package-x",20)}</span><div><strong>${esc(change.name_ar||change.name_en||"منتج في السلة")}</strong><small>${cartChangeTitle(change)}</small>${change.type==="price_changed"?`<p><del>${money(change.previous_price)}</del>${icon("arrow-left",15)}<b>${money(change.current_price)}</b></p>`:""}${change.type==="quantity_adjusted"?`<p><del>${Number(change.previous_quantity||0)}</del>${icon("arrow-left",15)}<b>${Number(change.current_quantity||0)}</b></p>`:""}${["out_of_stock","item_removed"].includes(change.type)?`<p class="is-removed">تم حذف هذا الاختيار من السلة حتى لا يتم طلبه بالخطأ.</p>`:""}</div></article>`).join("");
  overlayRoot.innerHTML=`<span class="drawer-backdrop cart-update-backdrop"></span><section class="cart-update-dialog" role="dialog" aria-modal="true" aria-labelledby="cartUpdateTitle"><header><span>${icon("refresh-cw",22)}</span><div><small>تحديث السلة</small><h2 id="cartUpdateTitle">تم تحديث بعض بيانات سلتك</h2><p>راجع التغييرات التالية قبل المتابعة.</p></div></header><div class="cart-update-list">${rows}</div><footer><p>${icon("shield-check",17)}تم حساب الإجمالي والخصومات والشحن مرة أخرى بالبيانات الحالية.</p><button class="primary-button" type="button" id="acceptCartUpdates">مراجعة السلة والمتابعة</button></footer></section>`;
  document.body.classList.add("is-locked");document.getElementById("acceptCartUpdates").onclick=()=>{state.pendingCartChanges=[];closeOverlay();};hydrateIcons();
}

function showCartValidationError(){
  overlayRoot.innerHTML=`<span class="drawer-backdrop cart-update-backdrop"></span><section class="cart-update-dialog is-error" role="alertdialog" aria-modal="true"><header><span>${icon("wifi-off",22)}</span><div><small>تعذر التحقق</small><h2>لا يمكن تأكيد أسعار السلة الآن</h2><p>لن نسمح بإتمام الطلب قبل التأكد من الأسعار والمخزون الحاليين.</p></div></header><footer><p>${icon("shield-alert",17)}تحققي من الاتصال ثم أعيدي المحاولة.</p><button class="primary-button" type="button" id="retryCartValidation">إعادة التحقق</button></footer></section>`;
  document.body.classList.add("is-locked");document.getElementById("retryCartValidation").onclick=()=>location.reload();hydrateIcons();
}

async function reconcileCart({ page=cartPageName(), force=false }={}){
  if(!state.cart.length){state.cartRevisionToken="";state.cartVerifiedAt=Date.now();return {items:[],changes:[]};}
  if(!force&&state.cartRevisionToken&&Date.now()-state.cartVerifiedAt<30_000)return {items:state.cart,changes:[]};
  if(state.cartReconcilePromise)return state.cartReconcilePromise;
  state.cartReconcilePromise=(async()=>{
    const recovery=state.checkoutRecovery||storedCheckoutRecovery()||{};
    const result=await api("/api/store/cart/reconcile",{method:"POST",body:JSON.stringify({items:state.cart,page,checkout_session_id:recovery.session_id,checkout_session_token:recovery.session_token})});
    state.cart=Array.isArray(result.items)?result.items:[];state.cartRevisionToken=result.revision_token||"";state.cartVerifiedAt=Date.now();state.checkoutQuote=null;
    saveLocalCart({invalidateRevision:false});
    if(result.changes?.length){state.pendingCartChanges=result.changes;clearPaymentAttempt();await revalidateCartDiscount();}
    return result;
  })().finally(()=>{state.cartReconcilePromise=null;});
  return state.cartReconcilePromise;
}

async function revalidateVisibleCart({ force=true }={}){
  if(!["/cart","/checkout"].includes(location.pathname)||document.visibilityState==="hidden")return true;
  const checkout=location.pathname==="/checkout",formValues=checkoutFormState();
  try{
    const result=await reconcileCart({page:checkout?"checkout":"cart",force});
    if(result.changes?.length){renderCart(checkout);restoreCheckoutFormState(formValues);if(checkout)refreshCheckoutQuote();showCartChanges(result.changes);}
    return !result.changes?.length;
  }catch(error){
    if(checkout){const button=document.getElementById("placeOrder");if(button){button.disabled=true;button.textContent="تعذر التحقق من الأسعار";}}
    toast("تعذر التحقق من أسعار السلة. تحققي من الاتصال وحاولي مرة أخرى.");return false;
  }
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
  const normalized=String(message||"").toUpperCase(),lower=String(message||"").toLowerCase();
  if(normalized.includes("INVALID_SAUDI_PHONE"))return "أدخلي رقم جوال سعودي صحيح: 9 أرقام بعد +966 ويبدأ بالرقم 5";
  if(normalized.includes("MISSING CHECKOUT FIELDS"))return "راجعي بيانات الاسم والعنوان المطلوبة قبل تأكيد الطلب";
  if(normalized.includes("PAYMENT_ATTEMPT_EXPIRED"))return "انتهت محاولة الدفع السابقة. اضغطي تأكيد الطلب لبدء محاولة جديدة";
  if(normalized.includes("PAYMENT_ATTEMPT_CLOSED"))return "محاولة الدفع السابقة مغلقة. راجعي حالة الطلب أو ابدئي محاولة جديدة";
  if(normalized.includes("PAYMENT_REDIRECT"))return "تم إيقاف التحويل لحمايتك من حلقة إعادة توجيه. حاولي مرة أخرى أو اختاري طريقة دفع أخرى";
  if(normalized.includes("TAMARA_CUSTOMER_NOT_ELIGIBLE"))return "تمارا غير متاحة لهذا الطلب حاليًا. يمكنك اختيار طريقة دفع أخرى";
  if(normalized.includes("TAMARA_COUNTRY_OR_CURRENCY_NOT_SUPPORTED"))return "تمارا غير متاحة لدولة أو عملة هذا الطلب";
  if(normalized.includes("TAMARA_ORDER_AMOUNT_NOT_SUPPORTED"))return "قيمة الطلب خارج الحدود المسموحة للدفع عبر تمارا";
  if(normalized.includes("TAMARA"))return "تعذر بدء الدفع عبر تمارا الآن. حاولي مرة أخرى أو اختاري الدفع عند الاستلام";
  if(normalized.includes("EDFAPAY_EMAIL_REQUIRED"))return "البريد الإلكتروني مطلوب للدفع عبر ادفع باي";
  if(normalized.includes("EDFAPAY_CALLBACK_UPDATE_REQUIRED"))return "ادفع باي متوقفة مؤقتًا لحين تحديث رابط إشعارات الدفع";
  if(normalized.includes("EDFAPAY_COUNTRY_OR_CURRENCY_NOT_SUPPORTED"))return "ادفع باي غير متاحة لدولة أو عملة هذا الطلب";
  if(normalized.includes("EDFAPAY_ORDER_AMOUNT_NOT_SUPPORTED"))return "قيمة الطلب خارج الحدود المسموحة للدفع عبر ادفع باي";
  if(normalized.includes("EDFAPAY"))return "تعذر بدء الدفع عبر ادفع باي الآن. حاولي مرة أخرى أو اختاري طريقة دفع أخرى";
  if(normalized.includes("TABBY_CUSTOMER_DETAILS_REQUIRED"))return "رقم الجوال والبريد الإلكتروني مطلوبان للدفع عبر تابي";
  if(normalized.includes("TABBY_COUNTRY_OR_CURRENCY_NOT_SUPPORTED"))return "تابي غير متاحة لدولة أو عملة هذا الطلب";
  if(normalized.includes("TABBY_ORDER_AMOUNT_NOT_SUPPORTED"))return "قيمة الطلب خارج الحدود المسموحة للدفع عبر تابي";
  if(normalized.includes("TABBY"))return "تعذر بدء الدفع عبر تابي الآن. حاولي مرة أخرى أو اختاري طريقة دفع أخرى";
  if(normalized.includes("PROMO_ALREADY_USED"))return "تم استخدام هذا الكود لهذا العميل من قبل";
  if(normalized.includes("PROMO_CURRENTLY_RESERVED"))return "الكود محجوز حاليًا لطلب آخر";
  if(normalized.includes("PROMO_FIRST_ORDER_ONLY"))return "هذا العرض متاح لأول طلب فقط";
  if(normalized.includes("PROMO_GUESTS_NOT_ALLOWED"))return "سجّلي الدخول لاستخدام هذا الكود";
  if(normalized.includes("PROMO_MANUAL_LIMIT"))return "وصلتِ للحد المسموح من أكواد الخصم";
  if(normalized.includes("PROMO_EXCLUSIVE_CONFLICT"))return "لا يمكن جمع هذا الكود مع عرض حصري";
  if(normalized.includes("PROMO_SAME_GROUP_CONFLICT"))return "تم تطبيق العرض الأفضل من هذه المجموعة";
  if(normalized.includes("PROMO_NOT_COMPATIBLE"))return "لا يمكن جمع هذين العرضين";
  if(lower.includes("not found"))return "كود الخصم غير موجود";
  if(lower.includes("not active"))return "كود الخصم غير نشط";
  return "كود الخصم غير صالح لهذا الطلب";
}

function checkoutErrorMessage(message=""){
  const normalized=String(message||"").toUpperCase();
  if(/PAYMENT|TAMARA|TABBY|EDFAPAY|GATEWAY|REDIRECT|INVALID_SAUDI_PHONE|MISSING CHECKOUT FIELDS/.test(normalized))return promotionErrorMessage(message);
  if(normalized.includes("PROMO")||String(message||"").toLowerCase().includes("discount"))return promotionErrorMessage(message);
  return "تعذر إتمام الطلب الآن. راجعي البيانات وحاولي مرة أخرى";
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
  const customer=state.customer||{};const saved=(customer.addresses||[]).find(address=>address.is_default)||(customer.addresses||[])[0]||{};const source={...customer,...saved};const parts=String(source.full_name||source.name||customer.full_name||customer.name||"").trim().split(/\s+/).filter(Boolean);
  const first_name=source.first_name||parts.shift()||"",last_name=source.last_name||parts.join(" ")||"";
  let phone=String(source.phone||"").replace(/\D/g,"");if((source.country_code||defaultCountry)==="SA")phone=phone.replace(/^966/,"").replace(/^0(?=5\d{8}$)/,"");
  return {...source,first_name,last_name,phone};
}

function addressSummary(address={}){return [address.city,address.district,address.street,address.building_number?`مبنى ${address.building_number}`:""].filter(Boolean).join("، ");}

function checkoutAddressBookMarkup(){
  const addresses=state.customer?.addresses||[];if(!state.customer)return "";
  return `<section class="checkout-address-book full"><header><div><span>عنوان التوصيل</span><h2>اختاري عنوانًا محفوظًا</h2></div><a href="/account">إدارة العناوين</a></header><div class="checkout-address-options" id="checkoutAddressOptions">${addresses.map((address,index)=>`<label class="checkout-address-option"><input type="radio" name="address_id" value="${esc(address.id)}" ${address.is_default||(!addresses.some(row=>row.is_default)&&index===0)?"checked":""}/><span class="checkout-address-check">${icon(address.type==="work"?"briefcase-business":"house",18)}</span><span><strong>${esc(address.label||address.type||"العنوان")}${address.is_default?`<small>افتراضي</small>`:""}</strong><b>${esc(addressSummary(address))}</b><em>${esc(address.short_address||"")}</em></span></label>`).join("")}<label class="checkout-address-option is-new"><input type="radio" name="address_id" value="" ${addresses.length?"":"checked"}/><span class="checkout-address-check">${icon("plus",18)}</span><span><strong>عنوان جديد</strong><b>إضافة عنوان توصيل آخر</b></span></label></div></section>`;
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
  const savedAddresses=state.customer?.addresses||[];
  return `<form class="checkout-form ${savedAddresses.length?"has-saved-address":""}" id="checkoutForm">
    ${checkoutAddressBookMarkup()}
    <div class="checkout-address-editor full ${savedAddresses.length?"is-collapsed":""}" id="checkoutAddressEditor">
    <header class="checkout-address-editor-head"><div><span>${savedAddresses.length?"تعديل بيانات التوصيل":"بيانات التوصيل"}</span><strong id="checkoutAddressEditorTitle">${savedAddresses.length?"العنوان المختار":"أضيفي عنوان التوصيل"}</strong></div>${savedAddresses.length?`<button type="button" id="toggleCheckoutAddressEditor">تعديل العنوان</button>`:""}</header>
    <div class="checkout-address-fields">
    <label><span class="checkout-label-text">الاسم الأول<i>*</i></span><input name="first_name" autocomplete="given-name" value="${esc(defaults.first_name||"")}" required /></label>
    <label><span class="checkout-label-text">اسم العائلة<i>*</i></span><input name="last_name" autocomplete="family-name" value="${esc(defaults.last_name||"")}" required /></label>
    <label><span class="checkout-label-text">رقم الجوال<i>*</i></span><div class="checkout-phone-control" id="checkoutPhoneControl"><span id="checkoutPhonePrefix">+966</span><input name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="5XXXXXXXX" value="${esc(defaults.phone||"")}" required /></div><small class="checkout-field-hint" id="checkoutPhoneHint">9 أرقام بعد +966</small></label>
    <label>البريد الإلكتروني<input name="email" type="email" autocomplete="email" value="${esc(defaults.email||"")}" /></label>
    <label><span class="checkout-label-text">الدولة<i>*</i></span><select name="country_code" required>${countries.map(country=>`<option value="${country.code}" ${country.code===(defaults.country_code||defaultCountry)?"selected":""}>${country.code==="SA"?"🇸🇦 ":""}${esc(country.name_ar||country.name_en)}</option>`).join("")}</select></label>
    ${splEnabled?`<section class="national-address-card full" id="saudiAddressPanel">
      <div class="national-address-head"><div><span>العنوان الوطني السعودي <i class="checkout-required-star">*</i></span><strong>اكتبي الرمز المختصر لملء العنوان تلقائيًا</strong></div><span class="address-verification-state" id="addressVerificationState">جاهز للتحقق</span></div>
      <div class="national-address-control"><input name="short_address" id="shortAddress" maxlength="9" autocomplete="off" placeholder="AAAA 0000" aria-label="العنوان الوطني المختصر" value="${esc(defaults.short_address||"")}" required /><button type="button" id="verifyShortAddress">${icon("map-pin-check",18)}تحقق واملأ العنوان</button></div>
      <p id="nationalAddressMessage">يتكون الرمز من 4 أحرف و4 أرقام.</p>
      <input name="address_verification_token" type="hidden" />
      <input name="latitude" type="hidden" value="${esc(defaults.latitude??"")}" />
      <input name="longitude" type="hidden" value="${esc(defaults.longitude??"")}" />
    </section>`:`<label><span class="checkout-label-text">الرمز الوطني المختصر<i>*</i></span><input name="short_address" maxlength="9" autocomplete="off" placeholder="AAAA 0000" style="direction:ltr;text-transform:uppercase" value="${esc(defaults.short_address||"")}" required /></label>`}
    <label><span class="checkout-label-text">المنطقة<i>*</i></span><input name="province" autocomplete="address-level1" value="${esc(defaults.province||"")}" required data-address-field /></label>
    <label><span class="checkout-label-text">المدينة<i>*</i></span><input name="city" autocomplete="address-level2" value="${esc(defaults.city||"")}" required data-address-field /></label>
    <label><span class="checkout-label-text">الحي<i>*</i></span><input name="district" autocomplete="address-level3" value="${esc(defaults.district||"")}" required data-address-field /></label>
    <label><span class="checkout-label-text">الشارع<i>*</i></span><input name="street" autocomplete="street-address" value="${esc(defaults.street||"")}" required data-address-field /></label>
    <label><span class="checkout-label-text">رقم المبنى<i>*</i></span><input name="building_number" inputmode="numeric" value="${esc(defaults.building_number||"")}" required data-address-field /></label>
    <label><span class="checkout-label-text">الرمز البريدي<i>*</i></span><input name="postal_code" inputmode="numeric" autocomplete="postal-code" value="${esc(defaults.postal_code||"")}" required data-address-field /></label>
    <label>الرقم الإضافي للعنوان<input name="additional_number" inputmode="numeric" value="${esc(defaults.additional_number||"")}" data-address-field /></label>
    <label class="full checkout-save-address" ${state.customer?"":"hidden"}><input type="checkbox" name="save_address" value="true" /><span>حفظ هذا العنوان في حسابي</span><select name="address_type"><option value="home">المنزل</option><option value="work">العمل</option><option value="other">عنوان آخر</option></select><input name="address_label" placeholder="اسم العنوان" /></label>
    </div></div>
    <fieldset class="checkout-shipping-methods full" id="checkoutShippingMethods" hidden><legend>شركة الشحن</legend><div id="checkoutShippingChoices"></div></fieldset>
    <fieldset class="checkout-payment-methods full"><legend>طريقة الدفع</legend>${paymentChoices||`<p>لا توجد طريقة دفع متاحة حاليًا.</p>`}</fieldset>
    <label class="full">ملاحظات العنوان أو الطلب<textarea name="address_notes">${esc(defaults.address_notes||"")}</textarea></label>
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
  trackCommerceEventOnce(checkout?"begin_checkout":"view_cart",checkout?"begin_checkout":"view_cart",state.cart,{value:totals.total});
  document.querySelectorAll("[data-cart-plus]").forEach(button=>button.onclick=()=>changeCartQuantity(Number(button.dataset.cartPlus),1,checkout));
  document.querySelectorAll("[data-cart-minus]").forEach(button=>button.onclick=()=>changeCartQuantity(Number(button.dataset.cartMinus),-1,checkout));
  document.querySelectorAll("[data-cart-remove]").forEach(button=>button.onclick=()=>removeCartItem(Number(button.dataset.cartRemove),checkout));
  document.getElementById("applyCoupon").onclick=applyCoupon;
  document.querySelectorAll("[data-remove-promo]").forEach(button=>button.onclick=()=>removePromotionCode(button.dataset.removePromo,checkout));
  document.getElementById("placeOrder")?.addEventListener("click",placeOrder);
  if(checkout){bindSaudiAddressVerification();bindCheckoutPhoneInput();bindCheckoutAddressBook();renderCheckoutPaymentWidgets(totals.total);const form=document.getElementById("checkoutForm"),email=form.elements.email;const syncEmailRequirement=()=>{email.required=["tamara","edfapay","tabby"].includes(form.elements.payment_method.value);};form.querySelectorAll('[name="payment_method"]').forEach(input=>input.addEventListener("change",event=>{syncEmailRequirement();if(event.isTrusted)trackCommerceEvent("add_payment_info",state.cart,{value:cartTotals().total});}));syncEmailRequirement();bindCheckoutRecovery(form);let quoteTimer;const quoteFields=new Set(["address_id","country_code","province","city","district","street","building_number","postal_code","short_address","latitude","longitude","payment_method"]);form.addEventListener("change",event=>{if(!quoteFields.has(event.target?.name))return;clearTimeout(quoteTimer);quoteTimer=setTimeout(()=>refreshCheckoutQuote(),250);});}
}

function bindCheckoutPhoneInput(){
  const form=document.getElementById("checkoutForm");if(!form)return;const country=form.elements.country_code,phone=form.elements.phone,prefix=document.getElementById("checkoutPhonePrefix"),hint=document.getElementById("checkoutPhoneHint"),control=document.getElementById("checkoutPhoneControl");
  const normalizeSaudi=()=>{let value=phone.value.replace(/\D/g,"").replace(/^966/,"");if(value.length===10&&value.startsWith("0"))value=value.slice(1);phone.value=value.slice(0,9);phone.setCustomValidity(value&&/^5\d{8}$/.test(phone.value)?"":"أدخلي 9 أرقام تبدأ بالرقم 5");};
  const update=()=>{const saudi=country.value==="SA";control.classList.toggle("is-saudi",saudi);prefix.hidden=!saudi;hint.textContent=saudi?"9 أرقام بعد +966":"أدخلي رقم الهاتف مع مفتاح الدولة";phone.maxLength=saudi?10:18;phone.inputMode=saudi?"numeric":"tel";phone.placeholder=saudi?"5XXXXXXXX":"+971...";if(form.elements.short_address)form.elements.short_address.required=saudi;phone.setCustomValidity("");if(saudi)normalizeSaudi();};
  phone.addEventListener("input",()=>{if(country.value==="SA")normalizeSaudi();else phone.setCustomValidity("");});country.addEventListener("change",update);update();
}

function bindCheckoutAddressBook(){
  const form=document.getElementById("checkoutForm"),editor=document.getElementById("checkoutAddressEditor");if(!form||!editor||!state.customer)return;
  const addresses=state.customer.addresses||[],saveRow=form.querySelector(".checkout-save-address"),toggle=document.getElementById("toggleCheckoutAddressEditor"),title=document.getElementById("checkoutAddressEditorTitle");
  const fields=["first_name","last_name","phone","email","country_code","short_address","province","city","district","street","building_number","postal_code","additional_number","address_notes","latitude","longitude"];
  const setValue=(name,value)=>{const input=form.elements[name];if(!input)return;let next=value??"";if(name==="phone"&&String(value||"").startsWith("+966"))next=String(value).replace(/^\+966/,"");input.value=next;};
  const applyAddress=address=>{fields.forEach(name=>setValue(name,address?.[name]));form.elements.address_verification_token&&(form.elements.address_verification_token.value="");editor.classList.add("is-collapsed");if(saveRow)saveRow.hidden=true;if(title)title.textContent=address?.label||"العنوان المختار";bindCheckoutPhoneInput();};
  const useNewAddress=(preserve=false)=>{if(!preserve){["short_address","province","city","district","street","building_number","postal_code","additional_number","address_notes","latitude","longitude"].forEach(name=>setValue(name,""));}editor.classList.remove("is-collapsed");if(saveRow){saveRow.hidden=false;form.elements.save_address.checked=true;}if(title)title.textContent="عنوان توصيل جديد";};
  form.querySelectorAll('[name="address_id"]').forEach(input=>input.addEventListener("change",()=>{const address=addresses.find(row=>String(row.id)===String(input.value));if(address)applyAddress(address);else useNewAddress(false);refreshCheckoutQuote({force:true});}));
  toggle?.addEventListener("click",()=>{const current=addresses.find(row=>String(row.id)===String(form.elements.address_id?.value));if(current)applyAddress(current);const newOption=[...form.querySelectorAll('[name="address_id"]')].find(input=>!input.value);if(newOption)newOption.checked=true;useNewAddress(true);toggle.hidden=true;});
}

function checkoutCustomerValues(form){
  const values=Object.fromEntries(new FormData(form));
  if(values.country_code==="SA"){let local=String(values.phone||"").replace(/\D/g,"").replace(/^966/,"");if(local.length===10&&local.startsWith("0"))local=local.slice(1);values.phone=`+966${local}`;}
  return values;
}

const CHECKOUT_RECOVERY_KEY="siteyfy_checkout_recovery";
let checkoutRecoveryTimer=null;
let checkoutRecoveryPagehideBound=false;

function storedCheckoutRecovery(){
  try{return JSON.parse(localStorage.getItem(CHECKOUT_RECOVERY_KEY)||"null");}catch{return null;}
}

function checkoutRecoverySnapshot(form=document.getElementById("checkoutForm")){
  const values=form?checkoutCustomerValues(form):{};
  const payment_provider=String(values.payment_method||form?.elements?.payment_method?.value||"");
  delete values.payment_method;delete values.shipping_quote_choice;delete values.address_verification_token;
  const required=form?[...form.querySelectorAll("[required]")]:[];
  const missing=required.filter(input=>!String(input.value||"").trim()).map(input=>input.name||input.id).filter(Boolean);
  const hasContact=Boolean(values.first_name||values.last_name||values.phone||values.email);
  const hasAddress=Boolean(values.city||values.district||values.street||values.short_address);
  const stage=missing.length===0&&form?"ready_to_submit":hasAddress?"address_started":hasContact?"contact_started":"checkout_started";
  return { customer:values,items:state.cart,total:cartTotals().total,payment_provider,stage,locale:"ar_SA",missing };
}

async function ensureCheckoutRecovery(){
  if(state.checkoutRecovery?.session_id&&state.checkoutRecovery?.session_token)return state.checkoutRecovery;
  if(state.checkoutRecoveryPromise)return state.checkoutRecoveryPromise;
  state.checkoutRecoveryPromise=(async()=>{
    const stored=storedCheckoutRecovery()||{};
    try{
      const result=await api("/api/store/checkout-recovery/session",{method:"POST",body:JSON.stringify({...checkoutRecoverySnapshot(),session_id:stored.session_id,session_token:stored.session_token})});
      if(!result.enabled)return null;
      state.checkoutRecovery={session_id:result.session_id,session_token:result.session_token,status:result.status,stage:result.stage};
      localStorage.setItem(CHECKOUT_RECOVERY_KEY,JSON.stringify(state.checkoutRecovery));
      return state.checkoutRecovery;
    }catch{return null;}
    finally{state.checkoutRecoveryPromise=null;}
  })();
  return state.checkoutRecoveryPromise;
}

async function syncCheckoutRecovery(event_type="checkout_updated",overrides={},useBeacon=false){
  const recovery=state.checkoutRecovery||(!useBeacon?await ensureCheckoutRecovery():storedCheckoutRecovery());
  if(!recovery?.session_id||!recovery?.session_token)return null;
  const snapshot={...checkoutRecoverySnapshot(),...overrides,event_type,session_token:recovery.session_token};
  const url=`/api/store/checkout-recovery/session/${encodeURIComponent(recovery.session_id)}/sync`;
  if(useBeacon&&navigator.sendBeacon){navigator.sendBeacon(url,new Blob([JSON.stringify(snapshot)],{type:"application/json"}));return recovery;}
  try{const result=await api(url,{method:"POST",body:JSON.stringify(snapshot)});state.checkoutRecovery={...recovery,status:result.status,stage:result.stage};localStorage.setItem(CHECKOUT_RECOVERY_KEY,JSON.stringify(state.checkoutRecovery));return result;}catch{return null;}
}

function clearCheckoutRecovery(){state.checkoutRecovery=null;state.checkoutRecoveryPromise=null;localStorage.removeItem(CHECKOUT_RECOVERY_KEY);}

function bindCheckoutRecovery(form){
  const pendingChanges=state.pendingCartChanges.slice();ensureCheckoutRecovery().then(()=>{if(pendingChanges.length)syncCheckoutRecovery("cart_revalidated",{message:`${pendingChanges.length} cart change(s) were applied before checkout.`,page:"checkout",cart_changes:pendingChanges});});
  const schedule=()=>{clearTimeout(checkoutRecoveryTimer);checkoutRecoveryTimer=setTimeout(()=>syncCheckoutRecovery("checkout_updated"),900);};
  form.addEventListener("input",schedule);
  form.querySelectorAll('[name="payment_method"]').forEach(input=>input.addEventListener("change",()=>syncCheckoutRecovery("payment_method_selected",{payment_provider:input.value})));
  if(!checkoutRecoveryPagehideBound){checkoutRecoveryPagehideBound=true;window.addEventListener("pagehide",()=>{if(location.pathname==="/checkout")syncCheckoutRecovery("checkout_left",{},true);});}
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

let checkoutQuoteFingerprint="";
let checkoutQuoteRequestController=null;
async function refreshCheckoutQuote({force=false}={}){
  const form=document.getElementById("checkoutForm");if(!form)return;const required=[...form.querySelectorAll("[required]")];if(required.some(input=>!input.value.trim()))return;
  const values=checkoutCustomerValues(form);const payment_method=values.payment_method||"cod",address_id=values.address_id||undefined;delete values.payment_method;delete values.shipping_quote_choice;delete values.address_id;delete values.save_address;delete values.address_type;delete values.address_label;const status=document.getElementById("shippingQuoteState");if(status)status.textContent="جاري حساب الشحن...";
  const quoteCustomer={country_code:values.country_code,province:values.province,city:values.city,district:values.district,street:values.street,building_number:values.building_number,postal_code:values.postal_code,short_address:values.short_address,latitude:values.latitude,longitude:values.longitude};
  const fingerprint=JSON.stringify({address_id,customer:quoteCustomer,payment_method,items:state.cart.map(item=>[item.key,item.quantity])});
  if(!force&&fingerprint===checkoutQuoteFingerprint){if(status)status.textContent="تم تحديث تكلفة الشحن";return;}
  checkoutQuoteRequestController?.abort();const controller=new AbortController();checkoutQuoteRequestController=controller;
  try{const result=await api("/api/store/shipping/quote",{method:"POST",signal:controller.signal,body:JSON.stringify({address_id,customer:values,payment_method,items:state.cart})});if(controller!==checkoutQuoteRequestController)return;checkoutQuoteFingerprint=fingerprint;state.checkoutQuotes=result.quotes||[result.quote].filter(Boolean);const previous=state.checkoutQuote?.id;state.checkoutQuote=state.checkoutQuotes.find(quote=>quote.id===previous)||result.quote;renderCheckoutShippingChoices(state.checkoutQuotes);const totals=cartTotals();const shippingAmount=document.getElementById("checkoutShippingAmount");if(shippingAmount)shippingAmount.innerHTML=checkoutShippingPrice(totals.shipping);const total=document.getElementById("checkoutTotalAmount");if(total)total.innerHTML=money(totals.total);renderCheckoutPaymentWidgets(totals.total);if(status)status.textContent=result.quote?.fallback_used?"تم استخدام سعر الشحن الاحتياطي":"تم تحديث تكلفة الشحن";}catch(error){if(error.name!=="AbortError"&&status)status.textContent="سيتم تأكيد تكلفة الشحن عند إرسال الطلب";}finally{if(checkoutQuoteRequestController===controller)checkoutQuoteRequestController=null;}
}

function changeCartQuantity(index,delta,checkout) {
  const item=state.cart[index];if(!item)return;item.quantity=Math.max(1,Number(item.quantity||1)+delta);saveLocalCart();api(`/api/cart/${encodeURIComponent(item.key)}`,{method:"PUT",body:JSON.stringify({quantity:item.quantity})}).catch(()=>{});clearDiscount();renderCart(checkout);
}

function removeCartItem(index,checkout) {
  const [item]=state.cart.splice(index,1);saveLocalCart();if(item){api(`/api/cart/${encodeURIComponent(item.key)}`,{method:"DELETE"}).catch(()=>{});trackCommerceEvent("remove_from_cart",[item],{value:Number(item.price||0)*Number(item.quantity||1)});}clearDiscount();renderCart(checkout);
}

function clearDiscount(){localStorage.removeItem("slyrah_discount");}

async function promotionTrackingFields(){
  const recovery=await ensureCheckoutRecovery();
  return recovery?.session_id&&recovery?.session_token?{checkout_session_id:recovery.session_id,checkout_session_token:recovery.session_token}:{};
}

async function applyCoupon() {
  const code=document.getElementById("couponCode").value.trim().toUpperCase();const message=document.getElementById("couponMessage");if(!code)return;message.className="coupon-message";message.textContent="جاري التحقق...";const existing=appliedPromotionCodes(cartTotals().discount);const codes=[...new Set([...existing,code])];
  try{const tracking=await promotionTrackingFields();const result=await api("/api/store/promotions/evaluate",{method:"POST",body:JSON.stringify({codes,order_total:cartTotals().subtotal,product_ids:state.cart.map(item=>item.product_id),category_slugs:state.cart.map(item=>item.category_slug),items:state.cart,tracking_action:"apply",attempted_code:code,...tracking})});const rejected=(result.rejected_promotions||[]).find(item=>item.code===code);if(rejected)throw new Error(rejected.reason);localStorage.setItem("slyrah_discount",JSON.stringify(result));renderCart(location.pathname==="/checkout");}catch(error){message.className="coupon-message error";message.textContent=promotionErrorMessage(error.message);}
}

async function removePromotionCode(code,checkout){const codes=appliedPromotionCodes(cartTotals().discount).filter(item=>item!==code);if(!codes.length){clearDiscount();syncCheckoutRecovery("promotion_removed",{promotion_action:"remove",removed_code:code,message:`Promotion code ${code} was removed.`});renderCart(checkout);return;}try{const tracking=await promotionTrackingFields();const result=await api("/api/store/promotions/evaluate",{method:"POST",body:JSON.stringify({codes,order_total:cartTotals().subtotal,items:state.cart,tracking_action:"remove",removed_code:code,...tracking})});localStorage.setItem("slyrah_discount",JSON.stringify(result));}catch{clearDiscount();}renderCart(checkout);}

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
  syncCheckoutRecovery("payment_redirected",{stage:"payment_redirected",status:"payment_pending",payment_provider:result.payment_provider||attempt.provider,payment_attempt_id:attempt.id},true);
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

async function placeOrder(options={}) {
  const retryClosedAttempt=options?.retryClosedAttempt!==false;
  const initialButton=document.getElementById("placeOrder");if(!initialButton)return;initialButton.disabled=true;initialButton.textContent="جاري التحقق من الأسعار...";
  const cartCurrent=await revalidateVisibleCart({force:true});if(!cartCurrent)return;
  const form=document.getElementById("checkoutForm"),button=document.getElementById("placeOrder");if(!form||!button)return;
  if(!form.reportValidity()){const missing=[...form.querySelectorAll(":invalid")].map(input=>input.name||input.id).filter(Boolean);syncCheckoutRecovery("validation_failed",{stage:"validation_failed",reason_code:"CHECKOUT_FORM_INVALID",message:"Required checkout fields are incomplete",field_names:missing});button.disabled=false;button.textContent="تأكيد الطلب";return;}
  const formValues=checkoutFormState(),values=checkoutCustomerValues(form),payment_method=values.payment_method||"cod",address_id=values.address_id||undefined,save_address=values.save_address==="true",address_type=values.address_type||"home",address_label=values.address_label||"";delete values.payment_method;delete values.shipping_quote_choice;delete values.address_id;delete values.save_address;delete values.address_type;delete values.address_label;const customer=values,discount=cartTotals().discount;button.disabled=true;button.textContent="جاري تأكيد الطلب...";
  const attempt=payment_method==="cod"?null:paymentAttempt(payment_method);
  try{
    const recovery=await ensureCheckoutRecovery();await syncCheckoutRecovery("checkout_submitted",{stage:"ready_to_submit",status:"active",payment_provider:payment_method,payment_attempt_id:attempt?.id});
    const result=await api("/api/orders",{method:"POST",body:JSON.stringify({customer,address_id,save_address,address_type,address_label,payment_method,payment_attempt_id:attempt?.id||undefined,checkout_session_id:recovery?.session_id,checkout_session_token:recovery?.session_token,cart_revision_token:state.cartRevisionToken,shipping_quote_token:state.checkoutQuote?.quote_token||undefined,locale:"ar_SA",items:state.cart,discount_codes:appliedPromotionCodes(discount)})});
    if(result.payment_redirect_url){continueGatewayPayment(result,attempt,button);return;}
    trackPurchase(result.order||{});clearPaymentAttempt(result.order?.id);clearCheckoutRecovery();state.cart=[];saveLocalCart();clearDiscount();shell(`${breadcrumbs("تم استلام الطلب")}<section class="container empty-cart"><div>${icon("circle-check-big",58)}<h1>تم استلام طلبك بنجاح</h1><p class="muted">رقم الطلب: ${esc(result.order?.id||"")}</p><a class="primary-button" href="/products">متابعة التسوق</a></div></section>`);
  }catch(error){
    if(error.code==="CART_REVALIDATION_REQUIRED"&&error.data){state.cart=error.data.items||[];state.cartRevisionToken=error.data.revision_token||"";state.cartVerifiedAt=Date.now();state.checkoutQuote=null;saveLocalCart({invalidateRevision:false});clearPaymentAttempt();await revalidateCartDiscount();renderCart(true);restoreCheckoutFormState(formValues);refreshCheckoutQuote();if(error.data.changes?.length)showCartChanges(error.data.changes);else toast("تم تحديث التحقق من السلة. راجعي الإجمالي ثم أكدي الطلب مرة أخرى.");return;}
    if(["PAYMENT_ATTEMPT_EXPIRED","PAYMENT_ATTEMPT_CLOSED"].includes(error.message)){clearPaymentAttempt();if(retryClosedAttempt){button.disabled=false;button.textContent="جاري إنشاء جلسة دفع جديدة...";return placeOrder({retryClosedAttempt:false});}}const gatewayError=/(PAYMENT|TAMARA|TABBY|EDFAPAY|GATEWAY|REDIRECT)/i.test(String(error.message||""));syncCheckoutRecovery("client_error",{stage:gatewayError?"payment_failed":"checkout_failed",status:"active",payment_provider:payment_method,payment_attempt_id:attempt?.id,reason_code:String(error.message||"CHECKOUT_FAILED").split(":")[0],message:error.message});toast(checkoutErrorMessage(error.message));button.disabled=false;button.textContent="تأكيد الطلب";
  }
}

async function renderTamaraReturn(outcome="success"){
  const params=new URLSearchParams(location.search),orderId=params.get("order_id"),token=params.get("token");
  shell(`${breadcrumbs("حالة الدفع")}<section class="container payment-return"><div class="payment-return-state is-loading">${icon("loader-circle",54)}<span>تمارا</span><h1>جاري تأكيد حالة الدفع</h1><p>نراجع العملية مباشرة مع تمارا، انتظري لحظة.</p></div></section>`);
  try{const result=await api(`/api/store/payments/tamara/status?order_id=${encodeURIComponent(orderId||"")}&token=${encodeURIComponent(token||"")}&outcome=${encodeURIComponent(outcome)}`),order=result.order||{},paid=["authorised","captured","partially_captured"].includes(order.payment_status);if(paid){trackPurchase(order);clearPaymentAttempt(order.id||orderId);clearCheckoutRecovery();state.cart=[];saveLocalCart();clearDiscount();localStorage.removeItem("siteyfy_pending_payment");shell(`${breadcrumbs("تم الدفع")}<section class="container payment-return"><div class="payment-return-state is-success">${icon("circle-check-big",58)}<span>تمارا</span><h1>تم تأكيد الدفع بنجاح</h1><p>تم استلام طلبك رقم <b>#${esc(order.id||orderId||"")}</b> وربطه بعملية Tamara.</p><a class="primary-button" href="/products">متابعة التسوق</a></div></section>`);return;}const cancelled=["cancelled","failed","expired"].includes(order.payment_status)||outcome!=="success";if(cancelled){clearPaymentAttempt(order.id||orderId);localStorage.removeItem("siteyfy_pending_payment");}shell(`${breadcrumbs(cancelled?"لم يكتمل الدفع":"الدفع قيد التأكيد")}<section class="container payment-return"><div class="payment-return-state ${cancelled?"is-failed":"is-pending"}">${icon(cancelled?"circle-x":"clock",58)}<span>تمارا</span><h1>${cancelled?"لم تكتمل عملية الدفع":"الدفع قيد التأكيد"}</h1><p>${cancelled?"لم يتم خصم الطلب ويمكنك العودة لإتمامه بطريقة أخرى.":"استلمنا العملية وننتظر تأكيد Tamara النهائي. سيتم تحديث الطلب تلقائيًا."}</p><a class="primary-button" href="/checkout">${cancelled?"العودة لإتمام الطلب":"مراجعة الطلب"}</a></div></section>`);}catch(error){shell(`${breadcrumbs("تعذر التحقق")}<section class="container payment-return"><div class="payment-return-state is-failed">${icon("circle-x",58)}<span>تمارا</span><h1>تعذر التحقق من العملية</h1><p>${esc(promotionErrorMessage(error.message))}</p><a class="primary-button" href="/checkout">العودة لإتمام الطلب</a></div></section>`);}
  hydrateIcons();
}

async function renderHostedPaymentReturn(provider,outcome="success"){
  const labels={edfapay:"ادفع باي",tabby:"تابي"},label=labels[provider]||provider;
  const params=new URLSearchParams(location.search),orderId=params.get("order_id"),token=params.get("token");
  shell(`${breadcrumbs("حالة الدفع")}<section class="container payment-return"><div class="payment-return-state is-loading">${icon("loader-circle",54)}<span class="${provider}-return-mark">${esc(label)}</span><h1>جاري تأكيد حالة الدفع</h1><p>نراجع آخر حالة مسجلة للعملية، انتظري لحظة.</p></div></section>`);
  try{
    const query=`order_id=${encodeURIComponent(orderId||"")}&token=${encodeURIComponent(token||"")}&outcome=${encodeURIComponent(outcome||"")}`;
    const result=await api(`/api/store/payments/${provider}/status?${query}`),order=result.order||{},paid=["authorised","captured","partially_captured"].includes(order.payment_status);
    if(paid){trackPurchase(order);clearPaymentAttempt(order.id||orderId);clearCheckoutRecovery();state.cart=[];saveLocalCart();clearDiscount();localStorage.removeItem("siteyfy_pending_payment");shell(`${breadcrumbs("تم الدفع")}<section class="container payment-return"><div class="payment-return-state is-success">${icon("circle-check-big",58)}<span class="${provider}-return-mark">${esc(label)}</span><h1>تم تأكيد الدفع بنجاح</h1><p>تم استلام طلبك رقم <b>#${esc(order.id||orderId||"")}</b> وربطه بعملية ${esc(label)}.</p><a class="primary-button" href="/products">متابعة التسوق</a></div></section>`);return;}
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
    const [appearance,currencies,market,builder,categories,productsResponse,bundlesResponse,collectionsResponse,labelsResponse,facetsResponse,pagesResponse,addressConfig,paymentMethods,marketingPixels,profile] = await Promise.all([
      api("/api/store/appearance"),api("/api/store/currencies"),api("/api/store/market"),api("/api/store/home-builder"),api("/api/categories"),api("/api/products"),api("/api/bundles"),api("/api/store/collections").catch(()=>({collections:[]})),api("/api/store/labels").catch(()=>({labels:[]})),api("/api/store/facets").catch(()=>({facets:[]})),api("/api/pages").catch(()=>({pages:[]})),api("/api/store/address/sa/config").catch(()=>({enabled:false,format:"AAAA0000"})),api("/api/store/payment-methods").catch(()=>({methods:[{id:"cod",title_ar:"الدفع عند الاستلام"}]})),api("/api/store/marketing-pixels").catch(()=>null),customerAuthToken()?api("/api/users/profile").catch(()=>null):Promise.resolve(null)
    ]);
    state.appearance=appearance;state.currencies=currencies;state.market=market;state.builder=builder;state.categories=categories.categories||categories||[];state.products=productsResponse.products||productsResponse||[];state.bundles=bundlesResponse.bundles||bundlesResponse||[];state.collections=collectionsResponse.collections||collectionsResponse||[];state.labels=labelsResponse.labels||labelsResponse||[];state.facets=facetsResponse.facets||facetsResponse||[];state.pages=pagesResponse.pages||pagesResponse||[];state.addressConfig=addressConfig||{enabled:false,format:"AAAA0000"};state.paymentMethods=paymentMethods||{methods:[]};state.customer=profile?.user||null;initializeMarketingPixels(marketingPixels||{});
    const oldFacetNames={"شراشف-منقطة":"منقط","شراشف-مشجرة":"مشجر","شراشف-سادة":"سادة"};
    if(state.category==="شراشف-صلاة")state.category="شراشف";
    else if(state.category==="كل-المنتجات")state.category="";
    else if(oldFacetNames[state.category]){const legacyName=oldFacetNames[state.category];const legacySubcategory=state.categories.find(item=>item.parent_id&&item.name_ar===legacyName);const shraash=state.categories.find(item=>!item.parent_id&&(item.slug==="شراشف"||item.name_ar==="شراشف"));state.category=shraash?.slug||"";state.subcategory=legacySubcategory?.slug||"";}
    if(state.subcategory){const sub=state.categories.find(item=>item.parent_id&&String(item.slug)===state.subcategory);const root=state.categories.find(item=>Number(item.id)===Number(sub?.parent_id));if(sub&&root)state.category=root.slug;else state.subcategory="";}
    if(new URLSearchParams(location.search).has("category")||new URLSearchParams(location.search).has("subcategory")){const url=new URL(location.href);state.category?url.searchParams.set("category",state.category):url.searchParams.delete("category");state.subcategory?url.searchParams.set("subcategory",state.subcategory):url.searchParams.delete("subcategory");if(state.facet)url.searchParams.set("facet",state.facet);history.replaceState(null,"",url.pathname+url.search);}

    if(["/cart","/checkout"].includes(location.pathname)&&state.cart.length){try{await reconcileCart({page:cartPageName(),force:true});}catch(error){state.cartValidationError=error;}}
    applyTheme();
    renderStoreRoute();
    if(state.cartValidationError)showCartValidationError();else if(state.pendingCartChanges.length)showCartChanges(state.pendingCartChanges);
  } catch(error) {
    app.innerHTML=`<section class="store-loading"><h1>تعذر تحميل المتجر</h1><p>${esc(error.message)}</p><button class="primary-button" onclick="location.reload()">إعادة المحاولة</button></section>`;
  }
}

document.addEventListener("keydown",event=>{if(event.key==="Escape"){if(overlayRoot.querySelector(".cart-update-dialog"))return;closeOverlay();document.getElementById("filterSidebar")?.classList.remove("mobile-open");document.body.classList.remove("is-locked");}});
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
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&["/cart","/checkout"].includes(location.pathname)&&Date.now()-state.cartVerifiedAt>30_000)revalidateVisibleCart({force:true});});
window.addEventListener("focus",()=>{if(["/cart","/checkout"].includes(location.pathname)&&Date.now()-state.cartVerifiedAt>30_000)revalidateVisibleCart({force:true});});
window.addEventListener("storage",event=>{if(event.key!=="slyrah_cart"||!["/cart","/checkout"].includes(location.pathname))return;state.cart=readLocalCart();state.cartRevisionToken="";state.cartVerifiedAt=0;revalidateVisibleCart({force:true});});
setInterval(()=>{if(location.pathname==="/checkout"&&document.visibilityState==="visible"&&Date.now()-state.cartVerifiedAt>60_000)revalidateVisibleCart({force:true});},30_000);
init();
