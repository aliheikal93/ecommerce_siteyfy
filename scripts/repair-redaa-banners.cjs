// Run inside the production container after copying this file to /app/.
// Downloads only the verified reference artwork. Never reimports catalog/orders.
const fs = require('node:fs/promises');
const path = require('node:path');
const Database = require('better-sqlite3');
const sharp = require('sharp');
const base = 'https://cdn29114-fc.redaa-alhishma.com/genimage/29114-shahos/2026/';
const sources = [
  ['desktop-1','05/25131303/ChatGPT-Image-May-25-2026-02_51_06-PM.webp'],
  ['desktop-2','07/01161727/ChatGPT-Image-Jul-1-2026-07_01_45-PM.png'],
  ['desktop-3','07/01161732/ChatGPT-Image-Jul-1-2026-06_32_07-PM.png'],
  ['mobile-1','05/25132759/ChatGPT-Image-May-25-2026-02_57_41-PM.webp'],
  ['mobile-2','07/01161719/ChatGPT-Image-Jul-1-2026-07_03_32-PM.png'],
  ['mobile-3','07/01161736/ChatGPT-Image-Jul-1-2026-06_31_58-PM.png'],
  ['promo-mobile','05/25132756/ChatGPT-Image-May-25-2026-03_16_45-PM-1-1.webp']
];
async function main() {
  if (!process.argv.includes('--apply')) { console.log('Use --apply to restore seven banner assets and patch imported home slides only.'); return; }
  const db = new Database('/app/data/slyrah.sqlite');
  const saved = db.prepare("SELECT value FROM settings WHERE key='homeBuilder'").get()?.value;
  if (!saved) throw new Error('Missing homeBuilder');
  const home=JSON.parse(saved);
  if (!home.slides?.some(s=>s.id==='redaa-hero-1')) throw new Error('Imported Redaa slides not found; no changes made');
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const backup=`/tmp/siteyfy-ui-before-${stamp}.sqlite`;
  await db.backup(backup);
  console.log(`BACKUP=${backup}`);
  const dir='/app/public/uploads/redaa/home';
  await fs.mkdir(dir,{recursive:true});
  const images={};
  for (const [name,source] of sources) {
    const response=await fetch(base+source,{signal:AbortSignal.timeout(60000)});
    if(!response.ok) throw new Error(`Artwork ${name}: HTTP ${response.status}`);
    const input=Buffer.from(await response.arrayBuffer());
    const metadata=await sharp(input).metadata();
    if(!metadata.width||!metadata.height) throw new Error(`Invalid artwork ${name}`);
    const target=path.join(dir,`reference-${name}-v1.webp`);
    await sharp(input).resize({width:name.startsWith('desktop')?1983:1580,withoutEnlargement:true}).webp({quality:88}).toFile(target+'.tmp');
    await fs.rename(target+'.tmp',target);
    images[name]=`/uploads/redaa/home/reference-${name}-v1.webp`;
    console.log(`${name}: ${metadata.width}x${metadata.height}`);
  }
  home.slides=home.slides.map(slide=>{
    const n=/^redaa-hero-([123])$/.exec(slide.id)?.[1];
    if(!n) return slide;
    // Do not replace later administrator artwork when rerunning the repair.
    const imported=url=>!url||/^\/uploads\/redaa\/home\/(hero-[123]-|reference-)/.test(url);
    return {...slide,
      desktop_image_url:imported(slide.desktop_image_url)?images[`desktop-${n}`]:slide.desktop_image_url,
      mobile_image_url:imported(slide.mobile_image_url)?images[`mobile-${n}`]:slide.mobile_image_url,
      cta_ar:slide.cta_ar||'تسوقي الآن',cta_en:slide.cta_en||'Shop now'};
  });
  if(!home.sections.some(s=>s.type==='banner')) home.sections.push({id:'redaa-promo',type:'banner',source:'manual',title_ar:'حشمة تليق بك',title_en:'Modesty that suits you',order:2.5,is_active:true,link_url:'/products',desktop_image_url:images['desktop-1'],mobile_image_url:images['promo-mobile']});
  home.updated_at=new Date().toISOString();
  const result=db.prepare("UPDATE settings SET value=? WHERE key='homeBuilder' AND value=?").run(JSON.stringify(home),saved);
  if(result.changes!==1) throw new Error('Homepage changed concurrently; artwork saved but settings untouched.');
  db.close();
  console.log('Repaired responsive banners; catalog, orders and integrations unchanged.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
