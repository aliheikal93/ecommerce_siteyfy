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
