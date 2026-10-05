# SITEYFY Project Memory

Last verified: 2026-09-10

## Purpose

This is a bilingual Arabic/English e-commerce system running as one Docker deployment. The storefront is being adapted to match Redaa Alhishma while all identity, catalog, promotions, shipping, payment, and content remain dynamic in the admin.

Reference sites:

- Current deployment: `https://ecommerce.siteyfy.com`
- Visual/content reference: `https://redaa-alhishma.com/shop/`
- Historical implementation reference: `https://premiumbrandeg.com/`

Do not copy header or footer markup into individual pages. They are shared, dynamic storefront chrome and must reflect later admin changes everywhere.

## Runtime Architecture

- `server.js`: Express application, SQLite initialization, persistence helpers, public/admin APIs, payment and shipping integrations, webhook handlers, report synchronization, server-rendered storefront chrome, and scheduled jobs.
- `public/storefront/index.html`: active storefront shell served for home, products, cart, checkout, and payment return routes.
- `public/storefront/store.js`: active storefront state and interactions, product/cart rendering, promotion application, shipping quote selection, checkout submission, and payment redirects.
- `public/storefront/store.css`: active storefront styling.
- `public/admin/index.html`: admin shell.
- `public/admin/assets/app.js`: hash-routed admin SPA, API client, forms, tables, dialogs, integrations, reports, and bilingual labels.
- `public/admin/assets/app.css`: admin design system and responsive behavior.
- `scripts/import-redaa.mjs`: Redaa catalog/content import tooling.
- `scripts/import-komrz-orders.mjs`: legacy Komrz order import and product/variant matching.
- `docker-compose.yml`: production container definition and persistent mounts.

`mirror-front/`, `mirror-admin/`, and `public/_next/` are historical or compiled reference material. They are not the active application source.

## Persistence Model

SQLite is the source of truth. The database has two important patterns:

- `settings`: key/value JSON for store configuration, appearance, integrations, payment gateways, AI, shipping rules, and other singleton configuration.
- `records`: entity name plus JSON payload for products, variants, orders, users, reviews, collections, bundles, payment transactions, shipments, bills, reports, audit findings, and logs.

Use `getSetting`, `setSetting`, `entityRows`, `getRecord`, and the established record helpers. Normalize settings through their existing `normalize*` functions before persistence or public exposure. Public responses must use `public*` serializers so encrypted secrets never leave the server.

## Checkout Relationship

The storefront cart is maintained by `public/storefront/store.js` and synchronized with `/api/cart`. The checkout path combines several systems:

1. Cart rows identify product, selected variant/options/colors, quantity, price, image, bundle or collection context.
2. Promotion codes are evaluated server-side. Eligibility can target all products, selected products, categories, bundle contents, first orders, users, or guests. Combined-promotion rules prevent uncontrolled stacking.
3. Shipping rules and carrier quotes are evaluated after product-level discounts. Free shipping only changes the customer shipping amount; carrier cost remains a separate operational value.
4. `/api/orders` revalidates products, promotions, shipping selection, customer/address information, inventory semantics, totals, and payment method before writing the order.
5. Hosted gateways create idempotent payment attempts. Return URLs and callbacks derive from the configured website domain.
6. Successful payment/webhook processing updates the payment ledger and store order. Redirect attempts are bounded to prevent payment redirect loops.
7. Shipment creation is provider-specific and must use the persisted order, selected shipping quote/provider, address, package/product metadata, and payment collection type.

Never trust totals, discounts, shipping prices, or payment status sent by the browser.

## Catalog Relationship

- Products reference category, brand, images, bilingual names/descriptions, SEO fields, base price, compare-at price, cost, and stock behavior.
- Product variants may contain color, another option, or both. Each variant may have its own price, compare-at price, cost, image, stock, and active state.
- Empty or zero stock means unlimited stock under the current business rule. Stock quantity is not exposed to storefront customers.
- Collections can include the same product more than once with different selected variants. Storefront links must open the normal product page with the collection's selected variant preselected.
- Bundles group products at a bundle price. Bundle stock normally derives from component products, with optional independent stock. Discounts must evaluate bundle eligibility without losing component traceability.
- Reviews can be customer-submitted or admin-created. Verified purchase derives from the logged-in user's orders. Publication/visibility is controlled in admin.
- Displayed sales count is the real count plus an optional admin offset.

## Shipping Relationship

Supported providers currently include OTO and iMile. OTO is the correct name, not O2.

- Shipping integration settings are normalized by `normalizeShippingIntegrations` and exposed through `publicShippingIntegrations`.
- Main controls are provider enabled, show at checkout, and default provider. Availability still depends on required credentials/configuration.
- OTO supplies multi-carrier quotes and can create orders/shipments and receive status webhooks.
- iMile supports direct shipment creation/tracking. Its OMS connector is also used to synchronize operational and financial data.
- iMile OMS synchronization stores new/changed rows locally. Reports must be browsable from local data without redownloading old periods on every page load.
- COD Bill represents collections; Fee Bill represents carrier charges. Weekly closings, shipment rows, fee breakdowns, tracking events, and store orders should be linked by waybill/order identifiers.
- Audit findings must explain the source report/bill, expected value, actual value, formula, difference, and shipment/order timeline.
- Cash-to-POS changes are informational, low-priority notices, not financial errors.
- A cancelled order before carrier pickup should not incur a carrier fee. A dispatched shipment without a closing after the configured age threshold may become a review issue.
- Expected versus billed weight is reviewed using a configurable tolerance. Never infer fee meanings without evidence from returned OMS/bill fields.

Admin routes:

- `#integrationCenter`
- `#shippingIntegrations`
- `#shippingShipments`
- `#shippingClosings`
- `#shippingAudit`

## Payment Relationship

Supported methods currently include Tamara, Tabby, EdfaPay, and cash on delivery.

- Gateway settings are normalized by `normalizePaymentGateways` and exposed through `publicPaymentGateways`.
- Each hosted provider has separate `is_enabled` and `show_at_checkout` states. A preferred provider can also be selected.
- Credentials are encrypted in SQLite. Never put secret keys in admin/storefront JavaScript.
- Callback, webhook, success, failure, and cancellation URLs are derived from the configured store domain where the provider permits it.
- Payment attempts and provider events are stored in the payment transaction ledger and linked to store orders.
- Redirect-loop protection uses idempotent attempts, HTTPS validation, a redirect limit, and an attempt lifetime. Preserve this behavior for every new gateway.
- Provider webhooks are authoritative only after signature/authentication and idempotency checks.

Admin routes:

- `#integrationCenter`
- `#paymentGateways`

State last verified before this memory file was written:

- OTO enabled, visible at checkout, and default shipping provider.
- iMile disabled as a checkout provider; OMS/report configuration exists separately.
- Tamara, Tabby, EdfaPay, and COD enabled.
- Tabby preferred payment provider.

Do not toggle these values merely to test a UI. Read current state first and submit the same value, or restore it immediately.

## Country, Currency, and Addressing

- Store country and currency are dynamic settings; Saudi Arabia and SAR are the current defaults.
- Saudi National Address short code remains visible because it is needed for shipping documentation.
- Verification/autofill UI appears only when its configured API integration is enabled.
- If the API is disabled, customers still enter the short code manually and checkout retains it for shipment creation.

## Admin UX Rules

- Navigation groups are accordion sections; opening one closes the previous group.
- Active/inactive states use switch controls.
- Dialog close, save, and cancel controls remain fixed outside scrollable dialog content; Escape closes dialogs.
- Images use file upload, preview, persistence, and ownership metadata rather than global URL-only fields.
- Product/category/brand/color/option selection uses searchable dialogs or appropriate dropdowns and color swatches.
- The admin is light, professional, bilingual, responsive, and optimized for dense repeated work.

## Operations

- Container: `slyrah-commerce`
- Compose service: `slyrah`
- Host-to-container port: `3010:3000`
- Database in container: `/app/data/slyrah.sqlite`
- Uploaded media mount: `./public/uploads:/app/public/uploads`
- Image cache mount: `./public/image-cache:/app/public/image-cache`
- Lighthouse report mount: `./public/lighthouse-reports:/app/public/lighthouse-reports`

Back up the database with the installed `better-sqlite3` package because the container does not include the `sqlite3` CLI.

## Code Intelligence and Memory

The project is initialized with CodeGraph in `.codegraph/`. Start investigations with:

```bash
codegraph status
codegraph explore "Trace <feature or problem> end to end"
codegraph node <symbol>
codegraph callers <symbol>
codegraph impact <symbol>
```

After edits:

```bash
codegraph sync
```

The VPS Codex configuration already contains a CodeGraph MCP server entry. If Codex opens this directory as a true remote workspace, a normal local CodeGraph MCP entry is enough:

```toml
[mcp_servers.codegraph]
command = "codegraph"
args = ["serve", "--mcp"]
```

If Codex runs locally and reaches the VPS only by SSH commands, configure an SSH-backed MCP server in the local `~/.codex/config.toml` instead. Replace `<VPS_SSH_ALIAS>` with the Host alias that already uses the passwordless SSH key:

```toml
[mcp_servers.siteyfy_codegraph]
command = "ssh"
args = ["-T", "-o", "BatchMode=yes", "<VPS_SSH_ALIAS>", "cd /root/slyrah-clone && exec codegraph serve --mcp"]
```

Restart Codex after changing its local MCP configuration. The local agent can also bootstrap context without MCP by running:

```bash
ssh <VPS_SSH_ALIAS> 'cd /root/slyrah-clone && ./scripts/codex-context.sh'
```

The `.codegraph/` directory and this file live with the project, so they survive conversation changes. Session memory products such as `claude-mem` are machine-local and do not automatically move between the VPS and a developer workstation.

## Known Risk

CodeGraph currently reports that the major checkout, shipping, payment, and financial reconciliation functions have no covering test files. Treat changes to these paths as high risk and verify them with API-level tests plus Playwright flows on desktop and mobile.

## Responsive storefront repair — 2026-09-10

- Restored missing homepage artwork using the reference site's three desktop and three genuinely separate mobile images; added the reference mobile promotional image. Files live in `public/uploads/redaa/home/reference-*-v1.webp` on the persistent uploads mount.
- Hero and promotional images retain their natural proportions. Do not reinstate a fixed mobile crop or reuse the first hero as an automatic promotional banner.
- Banner sections in Home Builder now own `desktop_image_url`, `mobile_image_url`, and `link_url`; both upload fields are labeled by device. Empty mobile artwork falls back to desktop. The repair script `scripts/repair-redaa-banners.cjs` is a targeted, explicit `--apply` maintenance operation; copy it into `/app/` in the container to run. It backs up SQLite and uses a compare-and-swap update on `homeBuilder`.
- Pre-change database backup: `/root/hst_backups/siteyfy-ui-20260910/before.sqlite`. No catalog/order/provider settings were imported or rewritten.
- Product normalization now preserves `color_id` and a validated `hex_code`; public variants resolve current color catalog values by ID or Arabic/English name. Cost and stock remain excluded. Product color choices display the color name, actual swatch, and selected state; gallery photos use `contain`.
- The compact navigation layout also covers tablet widths up to 1100px. Mobile product prices retain their detail-page sizing.
- Static asset version strings in storefront/admin HTML must be bumped after frontend changes so existing browsers receive updated JS/CSS.
- Verified responsive homepage artwork on 375, 390, 768, 844 landscape, and 1440px; variant selection and add-to-cart preserve selected color, ID, quantity and price on mobile/desktop. Test cart cleared without placing an order.

## Footer repair — 2026-09-10

- The shared storefront footer now uses four desktop columns, two tablet columns, and a stacked mobile layout with compact business registration details and a separate white-backed payment image. Phone display is explicitly LTR; social icons are inline SVGs independent of the limited Lucide bundle.
- All five footer visibility settings are honored, including description/social/business groups. Empty contact fields and business identifiers are omitted; links opened in new tabs use `noopener noreferrer`.
- Footer policy URLs are configurable in the existing Storefront Layout editor: `store_policy_url`, `shipping_policy_url`, `privacy_policy_url`. Only configured valid HTTP(S) or local destinations render; removed misleading policy links to `/products`. No policy text or local policy pages were invented.
- Changed only `brandIdentity.footer_color` from the old brown preset to the saved `primary_dark_color`, matching the purple reference identity while keeping the footer color editable in admin. Database backup before this change: `/root/hst_backups/siteyfy-ui-20260910/before-footer.sqlite`.
- Verified footer at 375/390/768/1440px, image loading, three social SVGs, phone direction, payment contrast, visibility flags, and safe policy destinations. Storefront/admin asset versions bumped.

## Bundle option semantics and prayer-set migration — 2026-09-24

- A bundle option may combine one master color with one master product option. The color applies to every color-bearing component in that bundle option.
- Generated bundle labels identify the component type before its option value. Bedsheet sewing choices therefore display as لون · شرشف بسحاب, لون · شرشف بدون سحاب مفتوح من الامام, and similar labels. A rug with no secondary option contributes only its matching color variant.
- Bundle inventory inherits from exact component variants unless independent bundle stock is explicitly enabled. The available bundle quantity is the minimum available component quantity after component quantities are applied.
- Legacy prayer sets from category 105 are migrated into bundle records while the original product records remain archived for order history and carry a migrated_bundle_id. Storefront legacy product URLs redirect to the replacement bundle.
- scripts/migrate-prayer-sets-to-bundles.cjs is an idempotent preview/apply migration. It only maps exact color and option matches from existing standalone products and records the mapping policy in each bundle.

## Arabic set terminology and detail-page content — 2026-09-24

- Arabic customer and admin copy uses طقم / أطقم for bundle products. The English interface and internal entity/API name remain `bundle`.
- Set selection is the final control inside the side product summary beside the image, immediately after the short description; purchase actions remain with it. Available options retain their saved order first and sold-out options are grouped at the end.
- Migrated set detail pages use a real gallery. Selecting a set option makes that option image the lead image; the preserved legacy set cover, exact component images, and distinct option images remain navigable with thumbnails and previous/next arrows.
- Imported product and set descriptions are rendered through a browser-side allowlist sanitizer. Import metadata attributes and unsafe elements are removed, literal escaped newlines are normalized, explicit line breaks are preserved, and semantic paragraphs, headings, lists, emphasis, and safe links remain formatted. Whitespace-only HTML indentation must not become visible breaks.
- Legacy saved Arabic bundle name `بندل 2` was normalized to `طقم 2`. Pre-change database backup: `/root/hst_backups/siteyfy-set-language-20260924/siteyfy-before-set-language.sqlite`.

## Storefront hierarchical products navigation — 2026-09-24

- The desktop header labels the catalog entry as `المنتجات`. Hovering or focusing it opens a two-panel mega menu sourced from active catalog categories.
- Parent categories appear in the first panel. Hovering or focusing a parent switches the second panel to its subcategories; each subcategory link preserves both `category` and `subcategory` query parameters so the products page opens with the correct filters.
- The mobile drawer uses the same category tree as a two-level accordion: products first, then per-category subcategories. Links and images are generated from current catalog data rather than a manual menu.
- Categories marked `migration_status: replaced_by_bundles` are excluded from this navigation because those legacy categories no longer represent a sellable catalog route.
- Verified at 1440x1000 and 390x844 with Playwright: desktop hover/focus, شراشف panel switching, سادة/مشجر/منقط links, mobile nested expansion, and actual navigation to the filtered سادة products page. No browser runtime errors were reported.

## Compact products navigation refinement — 2026-09-24

- The desktop products dropdown is compact by default (310px). `عرض كل المنتجات` is the first item in the same list instead of a separate mega-menu header action.
- Catalog parents are intentionally ordered with categories that own subcategories first, ordinary categories next, and Best Sellers last. Current order is شراشف, سجاد صلاة, الأكثر مبيعًا.
- Only categories with children render an expansion arrow. Hovering or focusing شراشف expands the menu to 650px and reveals its subcategories; moving to a direct category collapses it back to the compact width.
- The mobile drawer uses the same order and renders exactly one nested-expansion control for شراشف. Direct categories have no misleading arrows.
- Verified with Playwright: 310px collapsed width, 650px expanded width, one expandable desktop/mobile category, correct ordering, automatic collapse, all three subcategories, and no runtime errors.

## Fixed products submenu expansion anchor — 2026-09-24

- The compact desktop products column is pinned by its right edge and keeps a fixed 288px width and content height when a nested category opens.
- The subcategory panel expands only to the left. Its spacing and separator belong to the expanding panel, so the original category list does not recenter, resize, or shift.
- Verified with Playwright at 1440px: the category list remained at x=807.046875, width=288px, height=244px, and right edge=1095px before and after opening شراشف. No browser runtime errors were reported.

## Configurable storefront loading GIF — 2026-09-25

- Brand Studio now includes a dedicated page-loading icon card with an actual-size animated preview, GIF upload, saved-file status, and a reset action that restores the built-in spinner.
- Loader uploads are restricted on both client and server to .gif files with GIF MIME type and a 5 MB maximum. The storefront accepts only normalized local /uploads/*.gif paths.
- The initial storefront shell requests the configured loading icon before the main storefront data finishes. A valid custom GIF replaces the CSS spinner; a missing or failed file leaves the default spinner visible.
- The public loader endpoint redirects to the saved GIF without caching the setting response. With no custom icon it returns 404 so the inline fallback remains active.
- Verified at 1440x1050 and 390x844: instant local preview, successful upload, 128x128 animated asset rendering at 64x64, reset behavior, mobile width without overflow, persisted storefront replacement, and automatic fallback. Invalid PNG upload returns 422. Temporary test settings, history, and files were removed.

## Product variant editor refinement — 2026-09-26

- Combination generation appears only while creating a variable product. Existing products retain their variant cards and individual editing controls without the generator.
- Admin catalog color and option rows may use camelCase names (
ameAr, groupAr, hex_code); variant generation, color picking, and card summaries resolve those fields so Arabic names and actual swatches remain visible.
- The shared product catalog section is a compact disclosure. It starts collapsed on edit and expanded on create, and explains categories, subcategories, filter facets, and card labels.
- Variant cards show the main thumbnail, color swatch/name, option group/value, price, and stock state. Editing moves the live row to a viewport-centered overlay and restores it to its original list position before save; the serialized variant list keeps its original order and count.

## Finance and catalog admin restructuring — 2026-09-27

- Finance navigation separates Sales & Profit, Costs, Expense Items, Expense Ledger, and Reports. The expense-item list has search/status filters and a focused add/edit form; the ledger shows each due date with paid, skipped, and reset actions. A skipped date is excluded from operating cost.
- Recurring expense edits keep prior schedule versions. A change starts at an explicit effective date without moving the original monthly/weekly anchor, so earlier reports remain stable. Pausing an item closes future dates. `finance_expense_occurrences` stores per-date overrides.
- Product and bundle editors now use horizontal tabs, with one visible section at a time and the item name in the edit heading. Bundle option generation is available only during creation; compact option cards show their image, color, choice, price, and component count. Legacy options with a saved color/choice name but no lookup ID can still be saved.
- Mobile data tables with many columns become expandable cards. Form controls have consistent padding and select-arrow spacing. The gallery usage index scans media fields that belong to each entity, rather than joined brand/category objects; brand logos no longer claim usage by every linked product.
- Validated on an isolated database/server: expense revisions retained the first-of-month schedule, paid/skipped states, and skipped-cost exclusion; gallery logo use resolved only to the brand. Desktop and Arabic mobile browser checks covered the finance pages, table cards, product/bundle tabs, and successful saves.
- Production smoke checks found one horizontal overflow caused by a long Arabic bundle name in the edit header. The header child now shrinks and wraps at mobile width; the same long-name case was retested at 390px on the isolated server.

## Finance cost visibility and period consistency — 2026-10-04
- Finance defaults are month-to-date (configured financial timezone); overview now always filters orders using the same range as operating expenses. Admin finance pages reset stale stored date filters on entry and offer a current-month button. Dashboard defaults to month-to-date; explicit 7/30/90 periods remain. Manual reports use the current month; automatic report cadence remains configured.
- Costs now list each operating expense with category, date, frequency, amount and status; Excel includes payment status/date. One-time items default to today and count directly (`recorded`) without claiming cash payment. Paid/due/recorded subtotals are separate; recording payment does not duplicate expense.
- Paid occurrences remain included when a schedule is paused/changed and new overrides snapshot name/category/frequency/amount. No live finance data was rewritten. Live existing item 204348 (5,000 SAR, paid October 3) is visible in costs.
- Regression script: `node scripts/finance-regression.cjs` covers direct one-time recognition, payment deduplication, paid history after pause, skipped exclusion, month-end recurrence, timezone boundary, default month filtering and invalid range.
- Production desktop 1440/mobile 390 Playwright checks passed: October 1–4 range despite stale stored dates, paid item visible, no horizontal overflow, optional one-time date, recurring required date, no page errors. Deployed admin cache version finance-20261004c.
- Payment fee/balance/settlement expansion is a PLAN only: `docs/payment-finance-plan.md`. Actual provider rates/dates need merchant contracts and settlement exports. Missing fees are not proven zeros; payment APIs do not by themselves establish settlement data access. Separate recognized profit, provider receivable, expected transfer and bank-confirmed receipt. Google Analytics remains deferred by user.

## Saudi Address Pro checkout — 2026-10-05
- Address provider choice added to existing Shipping providers > National Address settings: Saudi Address Pro or direct SPL. Unconfigured UI defaults to Pro; existing live settings/provider states were not rewritten. Select Pro, enter its key, save/enable and use Test. Storefront domain must be registered with provider.
- Pro adapter uses the provider's published widget contract: GET https://saudiaddresspro.com/api/address/search?q=<short-code>&language=ar|en and X-API-Key header. Requests stay server-side; secret remains encrypted and is omitted from public responses. Direct SPL adapter remains. Exact short-code matching prevents using a loose-search result for another address; aliases include postalCode/buildingNumber/region and known city-region fallbacks. Cache entries are separated by provider; address verification tokens preserve provider identity.
- Checkout has a prominent 8-character Short National Address card before contact details when integration is active. It auto-resolves after 450ms on 4 Latin letters + 4 digits, displays loading/success/error, cancels obsolete requests and keeps manual fields editable. This is the short address, not a 5-digit postal-code lookup. Disabled integration keeps manual checkout.
- Contact name is one full-name field, split into existing first/last fields before submission. Guest account-save/type/label controls are absent from the DOM. Registered address switching/new-address editing remains functional.
- Email label explicitly says (اختياري). User approved requiring email only for payment methods that need it. COD/Tamara do not require email; EdfaPay/Tabby do, with visible payment-specific hint. Backend rejects missing email for those methods before creating an order. No fabricated customer email.
- Verified: node syntax checks, git diff --check, scripts/address-regression.cjs and finance-regression.cjs. Live-domain Playwright desktop 1440/mobile 390 fixtures covered integration off/on, guest controls, valid full name, incomplete code/no lookup, auto-fill, obsolete request, failed lookup/manual edit, and conditional email. Admin controls/password masking/disabled state checked on both widths. Registered customer fixture tested saved name/phone switching and new-address editing. Checkout recovery/marketing writes were intercepted; no real purchase or live settings changes were made.
- Deployed asset version saudi-address-20261004a. Actual service authentication/domain authorization remains unverified until the owner supplies a Saudi Address Pro API key and runs Test. Contract/mapping tests used fixtures; do not claim live provider lookup passed.
## Address integration toggle persistence and live verification — 2026-10-05
- Fixed shared form-switch synchronization for `.setting-toggle` and estimate-profile containers: UI switches previously changed appearance but their hidden FormData values remained unchanged. National-address enable/require-verification/manual-fallback controls now persist; same container fix covers shipping controls.
- Saudi Address Pro structured HTTP 404 `errorCode=NOT_FOUND` maps to `SPL_ADDRESS_NOT_FOUND`, preserving unrelated HTTP failures. Admin Test shows clear bilingual not-found, not-configured, unauthorized-key, forbidden-domain and timeout messages.
- Owner requested enabling autofill; retained existing encrypted Pro key and activated only spl_address. Other provider settings remained unchanged in isolated API activation. SQLite backup before settings changes: `/root/address-save-backup.sqlite.gz`.
- Real provider lookup for owner code RAGI2929 returns NOT_FOUND (provider-confirmed). Official sample RRHA8147 returns a verified Riyadh address. Live checkout auto-fill and signed verification tested at desktop 1440/mobile 390 with real config/resolve APIs; cart/recovery/marketing were fixtures/intercepted, no order placed. Admin real save/reload retains enabled state; enable/verification/manual-fallback toggles synchronize both directions on desktop/mobile, with no overflow in mobile emulation. Invalid-code test displays Arabic explanation.
- Validation: syntax checks for server/admin/store, git diff --check, address regression including structured 404 and existing live checkout fixture suite. Docker build/deployment completed; service healthy. Admin asset version address-save-20261005a.
- Initial builds failed due insufficient VPS disk space. Removed disposable Docker build cache and package-manager download caches only; no volumes or uploaded media removed. Disk had approximately 2.5GB free after deployment. Long-term disk capacity remains tight.
## Checkout contact-first automatic address design — 2026-10-05
- Full name and visibly optional email lead the delivery editor; national-address lookup follows them, then phone and delivery fields. Compact white address panel uses existing storefront type/colors, modest input sizing and an inline map/loader indicator.
- Removed address lookup button completely. Existing complete-code 450ms debounce triggers resolution; inline spinner and live status show progress, clear on success/error/cancellation, and obsolete requests remain guarded. Manual-edit hint now asks to retype the code rather than click a removed button.
- Preserved payment-specific email requirement (EdfaPay/Tabby), guest-only DOM behavior, saved address logic, editable delivery fields and integration-disabled manual checkout.
- Verified deployed desktop 1440/mobile 390: contact fields above code, no search button, spinner visible during delayed lookup and hidden afterward, incomplete code does not call API, stale request ignored, failed lookup remains editable, optional/required email behavior, no page errors/overflow. Existing provider regression and syntax checks passed. Real checkout config/resolve filled a Riyadh address and signed verification at both widths; no order placed and no integration settings changed. Screenshots reviewed. Admin-independent storefront asset version checkout-address-20261005b.
## Checkout contact order and manual-address disclosure — 2026-10-05
- Contact order is full name + phone in first desktop row, optional email full-width next, then short-address lookup. Mobile preserves this logical order. Removed idle autofill badge; status only appears for lookup progress/result/error.
- With address integration enabled, country/province/city/district/street/building/postal/additional fields sit in a closed native details control labeled «املأ بيانات العنوان بنفسك». Fields stay in FormData and auto-fill while collapsed; address summary points to the disclosure for edits. Disabled integration remains directly editable. Non-Saudi defaults start expanded.
- Captured invalid events expand manual fields before browser validation/focus so missing required delivery data cannot remain inaccessible. Manual entry, country changes and stale-request safeguards remain.
- Verified desktop 1440/mobile 390 fixtures: contact order, idle badge hidden, fields initially hidden and remain collapsed after successful auto-fill, disclosure opens editable fields, spinner/stale/error flow, optional payment-specific email, integration off, no overflow/page errors. Real config/resolve and signed verification passed both widths; native missing-field validation opens the disclosure. Screenshots reviewed. No real order or settings mutation. Syntax/address regression passed, Docker deployment healthy, asset version checkout-manual-20261005c.
