const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const base = process.env.CHART_TEST_URL || 'http://127.0.0.1:3010';
const live = process.argv.includes('--live');
const cases = {
  loss: [{sales:0, net_profit:0},{sales:0, net_profit:-1000}],
  mixed: [{sales:100, net_profit:50},{sales:20, net_profit:-1000}],
  positive: [{sales:300, net_profit:120},{sales:200, net_profit:20}],
  zero: [{sales:0, net_profit:0},{sales:0, net_profit:0}],
  large: [{sales:1e9, net_profit:-2e9}],
  missing: [{sales:null, net_profit:'invalid'}],
  empty: []
};
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/snap/bin/chromium',args:['--no-sandbox']});
  try {
    for(const width of [1440,390]) for(const lang of ['en','ar']) {
      const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
      let current=cases.loss;
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(lang=>{
        localStorage.setItem('slyrah_admin_token','chart-test');
        localStorage.setItem('slyrah_admin_user',JSON.stringify({role:'admin',name:'QA',permissions:['*']}));
        localStorage.setItem('slyrah_admin_lang',lang);
      },lang);
      if(!live)for(const [file,type] of [['app.js','application/javascript'],['app.css','text/css']])await page.route(`**/admin/assets/${file}*`,r=>r.fulfill({contentType:type,body:fs.readFileSync(path.join(root, 'public/admin/assets', file))}));
      await page.route('**/api/admin/**',r=>{
        const url=new URL(r.request().url());
        const finance={summary:{currency:'SAR',sales_before_offers:0,gross_sales:0,total_expenses:1000,net_profit:-1000,paid_operating_costs:1000,projected_net_after_dues:-1000},daily:current};
        const orders={summary:{currency:'SAR',revenue:0,total:3},trend:current.map((_,i)=>({label:`2026-10-0${i+1}`,revenue:0,orders:3})),statuses:[],payment_methods:[]};
        let data={};
        if(url.pathname.endsWith('/auth/me'))data={admin:{role:'admin',name:'QA',permissions:['*']}};
        if(url.pathname.endsWith('/dashboard/overview'))data={modules:{finance,orders}};
        if(url.pathname.endsWith('/finance/overview'))data=finance;
        r.fulfill({contentType:'application/json',body:JSON.stringify({success:true,data})});
      });
      for(const [name,rows] of Object.entries(cases)) for(const hash of ['overview','financeOverview']) {
        current=rows.map((row,i)=>({date:`2026-10-0${i+1}`,...row}));
        await page.goto(`${base}/admin/#${hash}`);
        await page.locator('.finance-equation').waitFor();
        const charts=await page.evaluate(()=>[...document.querySelectorAll('.finance-trend')].map(chart=>{
          const rect=chart.getBoundingClientRect(),zero=parseFloat(chart.style.getPropertyValue('--finance-zero'));
          return {height:rect.height,zero,bars:[...chart.querySelectorAll('i,b')].map(bar=>{const r=bar.getBoundingClientRect();return {height:r.height,top:r.top-rect.top,bottom:r.bottom-rect.top,loss:bar.classList.contains('loss'),pct:parseFloat(bar.style.height)};})};
        }));
        assert.equal(charts.length,rows.length?1:0,`${hash}/${name}: chart presence`);
        for(const chart of charts){
          assert(Number.isFinite(chart.zero));
          for(const b of chart.bars){
            assert(b.pct>=0&&b.pct<=100,`${name}: invalid height`);
            assert(b.top>=-.5&&b.bottom<=chart.height+.5,`${hash}/${name}: escaped chart ${JSON.stringify(b)}`);
            const baseline=chart.zero/100*(chart.height-1);
            if(b.loss)assert(b.top>=baseline-.5,`${name}: loss above zero`);
            else assert(b.bottom<=baseline+.5,`${name}: positive below zero`);
            if(['zero','missing'].includes(name))assert.equal(b.height,0);
          }
        }
        if(hash==='overview') assert(await page.locator('.dashboard-trend span').evaluateAll(bars=>bars.every(b=>b.getBoundingClientRect().height===0)), 'Zero sales must not use order count as money');
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${hash}/${name}: horizontal overflow`);
        if(name==='loss')await page.screenshot({path:`/tmp/chart-${live?'live':'stage'}-${hash}-${width}-${lang}.png`,fullPage:true});
      }
      assert.deepEqual(errors,[]);
      console.log(`${live?'live':'stage'} ${width}px ${lang}: seven cases, overview + finance passed`);
      await page.close();
    }
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
