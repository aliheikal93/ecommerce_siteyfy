# SITEYFY Codex Handoff

Last updated: 2026-09-10

هذه الوثيقة هي نقطة البداية الرسمية عند نقل العمل إلى محادثة Codex جديدة أو إلى Codex يعمل محليًا ويتصل بالـVPS عبر SSH.

## 1. مصادر الحقيقة

- الشيفرة: `https://github.com/aliheikal93/ecommerce_siteyfy`
- الفرع الرئيسي: `main`
- المشروع العامل على الـVPS: `/root/slyrah-clone`
- الدومين: `https://ecommerce.siteyfy.com`
- الداشبورد: `https://ecommerce.siteyfy.com/admin/`
- ذاكرة المشروع: `PROJECT_MEMORY.md`
- تعليمات وكيل البرمجة: `AGENTS.md`
- العلاقات البرمجية: `.codegraph/` على الـVPS
- تقرير العلاقات الإضافي: `graphify-out/` على الـVPS

GitHub هو مصدر الشيفرة، لكن قاعدة البيانات والملفات المرفوعة والمفاتيح والتقارير التشغيلية تظل على الـVPS وليست داخل Git.

## 2. طريقة العمل الموصى بها

الأفضل أن يعمل Codex داخل Remote Workspace متصل بالـVPS، أو ينفذ أوامره من الجهاز المحلي عبر SSH. لا تنشئ نسخة إنتاج منفصلة على الجهاز المحلي ثم تستبدل مجلد السيرفر بالكامل.

SSH key المستخدم للدخول إلى الـVPS لا يحتاج passphrase. استخدم اسم الـHost الموجود في `~/.ssh/config` على الجهاز المحلي بدل `<VPS_SSH_ALIAS>`.

اختبار الاتصال:

```bash
ssh -o BatchMode=yes <VPS_SSH_ALIAS> 'hostname && test -d /root/slyrah-clone && echo SITEYFY_READY'
```

## 3. تحميل السياق في بداية المحادثة

نفّذ هذا الأمر من الجهاز المحلي:

```bash
ssh <VPS_SSH_ALIAS> 'cd /root/slyrah-clone && ./scripts/codex-context.sh'
```

يمكن تمرير سؤال معماري مباشرة:

```bash
ssh <VPS_SSH_ALIAS> 'cd /root/slyrah-clone && ./scripts/codex-context.sh "Trace checkout through promotions, shipping, payment, and shipment creation"'
```

بعد ذلك يجب على Codex قراءة:

```bash
cd /root/slyrah-clone
sed -n '1,260p' AGENTS.md
sed -n '1,320p' PROJECT_MEMORY.md
codegraph status
```

## 4. ربط CodeGraph مع Codex Local

إذا كان Codex المحلي يصل إلى المشروع عن طريق SSH فقط، أضف التالي إلى `~/.codex/config.toml` على الجهاز المحلي:

```toml
[mcp_servers.siteyfy_codegraph]
command = "ssh"
args = ["-T", "-o", "BatchMode=yes", "<VPS_SSH_ALIAS>", "cd /root/slyrah-clone && exec codegraph serve --mcp"]
```

أعد تشغيل Codex بعد تعديل الإعداد. بهذه الطريقة يستخدم Codex المحلي فهرس العلاقات الموجود على الـVPS مباشرة.

عند عدم تفعيل MCP، يمكن تشغيل CodeGraph عبر SSH:

```bash
ssh <VPS_SSH_ALIAS> 'cd /root/slyrah-clone && codegraph explore "Trace the requested feature end to end"'
```

الفهرس الحالي مركز على ملفات التطبيق الفعلية ويستبعد `node_modules` والنسخ التاريخية وملفات Next المجمعة. آخر حالة موثقة:

- 7 ملفات مصدر مفهرسة.
- 975 عقدة.
- 5,678 علاقة.
- 206 مسارات API.

استخدم CodeGraph قبل البحث العام أو قراءة الملفات الكبيرة:

```bash
codegraph explore "<question>"
codegraph node <symbol>
codegraph callers <symbol>
codegraph impact <symbol>
```

وبعد أي تعديل للشيفرة:

```bash
codegraph sync
```

## 5. علاقة الذاكرة ببعضها

طبقات الذاكرة المستخدمة هي:

1. `PROJECT_MEMORY.md`: القرارات التجارية، قواعد الشحن والدفع، بنية البيانات، والحالة التشغيلية.
2. `AGENTS.md`: قواعد العمل الإلزامية التي يقرأها Codex عند فتح المشروع.
3. `.codegraph/`: العلاقات الحقيقية بين الدوال والـAPIs والملفات ومسارات الاستدعاء.
4. `graphify-out/`: تقرير مجتمعات وعلاقات أوسع يمكن الاستعلام منه.
5. `claude-mem`: ذاكرة جلسات محلية للآلة، وهي مساعدة فقط ولا تنتقل تلقائيًا من الـVPS إلى الجهاز المحلي.
6. Git history: سجل دائم لكل تعديل تمت مراجعته ورفعه.

لا تعتمد على ذاكرة المحادثة وحدها. أي قرار دائم يجب إضافته إلى `PROJECT_MEMORY.md` أو وثيقة متخصصة ثم رفعه إلى GitHub.

## 6. Git Workflow

في بداية كل شيفت:

```bash
ssh <VPS_SSH_ALIAS>
cd /root/slyrah-clone
git status --short --branch
git fetch origin
git pull --ff-only origin main
codegraph sync
```

قبل التعديل، تأكد من عدم وجود تغييرات غير معروفة. لا تمسح تعديلات المستخدم أو الملفات التشغيلية.

بعد التنفيذ والتحقق:

```bash
git status --short
git diff --check -- . ':(exclude)public/admin-original/**'
git add <changed-files>
git commit -m "Describe the completed change"
git push origin main
```

لا تستخدم `git add .` بعد بدء التطوير إلا بعد مراجعة كل ملف. لا تضف `.env` أو قواعد البيانات أو customer data أو تقارير شركات الشحن.

## 7. قاعدة البيانات والنسخ الاحتياطي

- قاعدة البيانات داخل الحاوية: `/app/data/slyrah.sqlite`
- Docker volume يحتفظ بالبيانات عند إعادة بناء الحاوية.
- لا يوجد `sqlite3` CLI داخل الحاوية؛ استخدم `better-sqlite3` للنسخ الاحتياطي.

قبل migrations أو imports أو تعديل إعدادات شامل:

```bash
BACKUP_DIR="/root/hst_backups/siteyfy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
docker exec slyrah-commerce node -e '
const Database=require("better-sqlite3");
const db=new Database("/app/data/slyrah.sqlite");
db.backup("/tmp/siteyfy-before-change.sqlite")
  .then(()=>db.close())
  .catch(error=>{ console.error(error); process.exit(1); });
'
docker cp slyrah-commerce:/tmp/siteyfy-before-change.sqlite "$BACKUP_DIR/siteyfy-before-change.sqlite"
ls -lh "$BACKUP_DIR/siteyfy-before-change.sqlite"
```

لا ترفع النسخة الاحتياطية إلى GitHub.

## 8. التحقق والنشر

نفّذ فحوص الصياغة أولًا:

```bash
node --check server.js
node --check public/admin/assets/app.js
node --check public/storefront/store.js
bash -n scripts/codex-context.sh
codegraph sync
```

ثم انشر:

```bash
docker compose up -d --build
docker compose ps
docker logs --tail 100 slyrah-commerce
```

أي تعديل في الواجهة أو Checkout يحتاج اختبار Playwright على desktop وmobile باستخدام الدومين الحقيقي. لا تغيّر حالة بوابة دفع أو شركة شحن أثناء الاختبار إلا إذا أعدتها فورًا.

## 9. الحالة الحالية المهمة

- OTO هي شركة الشحن الافتراضية ومفعلة وظاهرة في Checkout.
- iMile غير مفعلة كاختيار Checkout، بينما تكامل OMS والتقارير له إعدادات مستقلة.
- Tamara وTabby وEdfaPay وCOD مفعلة.
- Tabby هي بوابة الدفع المفضلة وقت آخر تحقق.
- إعدادات التكاملات: `/admin/#integrationCenter`
- شركات الشحن: `/admin/#shippingIntegrations`
- بوابات الدفع: `/admin/#paymentGateways`
- المشروع يستخدم SQLite JSON records/settings وليس ORM تقليديًا.
- أغلب checkout/payment/shipping/reconciliation paths لا تملك اختبارات آلية كافية؛ اعتبرها عالية الخطورة.

## 10. الأسرار والبيانات الحساسة

- لا تكتب المفاتيح أو كلمات المرور في المحادثة الجديدة.
- لا تنقل أسرارًا من `.env` إلى GitHub.
- مفاتيح بوابات الدفع والشحن محفوظة في البيئة أو مشفرة داخل SQLite.
- لا تطبع payloads كاملة إذا كانت تحتوي بيانات عملاء أو webhook secrets.
- Deploy Key الخاص بـGitHub موجود على الـVPS ولا يحتاج نسخه إلى المحادثة أو إلى repository.

## 11. نص جاهز لبداية المحادثة الجديدة

استخدم النص التالي مع Codex Local:

```text
اعمل على مشروع SITEYFY الموجود على VPS داخل /root/slyrah-clone.
الدخول إلى VPS متاح من خلال SSH alias الموجود في ~/.ssh/config والمفتاح بدون passphrase.
ابدأ باختبار الاتصال، ثم اقرأ AGENTS.md وPROJECT_MEMORY.md وHANDOFF.md من السيرفر.
استخدم CodeGraph الموجود في /root/slyrah-clone/.codegraph قبل البحث أو قراءة الملفات الكبيرة، وشغل codegraph sync بعد أي تعديل.
GitHub repository هو https://github.com/aliheikal93/ecommerce_siteyfy والفرع الرئيسي main.
لا تغيّر أو تحذف قاعدة البيانات أو Docker volumes أو ملفات المستخدم، ولا تعرض أي مفاتيح أو كلمات مرور.
قبل تعديل البيانات أنشئ SQLite backup. بعد تعديل الشيفرة نفذ syntax checks، ثم Docker rebuild، ثم اختبارات API وPlaywright على desktop وmobile، وبعد النجاح اعمل commit وpush.
اعتبر PROJECT_MEMORY.md مصدر قواعد العمل التجارية، وCodeGraph مصدر العلاقات البرمجية الحالية.
```

## 12. نهاية كل شيفت

قبل إنهاء أي محادثة:

1. أكمل التنفيذ والاختبارات المطلوبة.
2. شغّل `codegraph sync`.
3. حدّث `PROJECT_MEMORY.md` عند إضافة قرار أو نظام دائم.
4. اكتب ما تم وما تبقى بوضوح في commit message أو وثيقة مخصصة.
5. ارفع commit إلى `origin/main` بعد التحقق.
6. تأكد أن `git status --short --branch` نظيف ومتزامن.

## Marketing pixel integration — 2026-10-03
- Meta and TikTok enabled through existing normalized settings APIs; IDs stay in settings, not source.
- Catalog feeds: /api/store/catalog/meta.csv and /api/store/catalog/tiktok.csv. Live active product/bundle parent IDs match browser events; SKU mode also uses parent SKU. Legacy migrated products are excluded. Images have safe cached JPEG endpoints. Prices/stock are selected from a purchasable variant and links pin that variant.
- Bundle ViewContent and payment-return bundle identities repaired; Purchase uses deterministic order event ID and browser deduplication. TikTok now uses Purchase and search_string; custom cart/removal events are not misreported as standard TikTok product views. Added wishlist and search events; search includes bundles.
- Platform catalog subscription and final Events Manager receipt require advertiser account access; local event log alone does not prove platform ingestion.
- Verified deployed desktop/mobile: PageView, product/bundle ViewContent, AddToCart, AddToWishlist, InitiateCheckout, AddPaymentInfo and Search; Meta/TikTok event HTTP responses 200. Both feed formats contain 16 active rows and all 16 catalog JPEG endpoints return 200. Purchase serialization and deterministic deduplication validated without creating an order or advertising a synthetic purchase. Meta autoConfig disabled to avoid extra automatic PageView alongside explicit site events.
- Pre-setting backup retained at /root/slyrah-pixel-stage.sqlite.gz.

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
