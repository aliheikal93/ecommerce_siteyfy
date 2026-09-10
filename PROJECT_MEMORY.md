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
