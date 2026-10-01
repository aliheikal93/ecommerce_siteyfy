// Reconcile the remaining options on the migrated prayer-rug bundle.
// Run with DB_PATH=<production sqlite path> node scripts/reconcile-migrated-bundle-options.cjs
// Add --apply only after reviewing the dry-run output and taking a SQLite backup.
const assert=require('node:assert/strict');
const Database=require('better-sqlite3');

const db=new Database(process.env.DB_PATH||'data/slyrah.sqlite',{readonly:!process.argv.includes('--apply')});
const record=(entity,id)=>{
  const row=db.prepare('SELECT id,payload FROM records WHERE entity=? AND id=? AND is_deleted=0').get(entity,id);
  assert(row,`Missing ${entity} #${id}`);
  return {...row,data:JSON.parse(row.payload)};
};
const bundle=record('bundles',200335),legacy=record('products',134);
assert.equal(Number(bundle.data.legacy_product_id),134);
assert.equal(Number(legacy.data.migrated_bundle_id),200335);
const mappings={
  'رمادي':{code:'GRAY',sheet:138},
  'زيتي':{code:'OLIVE',sheet:140},
  'كحلي':{code:'NAVY',sheet:20434}
};
const optionKey=item=>`${item.color||''}|${item.value||''}`;
const existing=new Set((bundle.data.bundle_variants||[]).map(optionKey));
const colors=db.prepare("SELECT id,payload FROM records WHERE entity='colors' AND is_deleted=0").all().map(row=>({id:row.id,...JSON.parse(row.payload)}));
const rug=record('products',133).data;
const ean13=base=>{
  assert(/^\d{12}$/.test(base));
  const sum=[...base].reduce((total,digit,index)=>total+Number(digit)*(index%2?3:1),0);
  return `${base}${(10-sum%10)%10}`;
};
const created=[];
for(const [colorName,mapping] of Object.entries(mappings)){
  const color=colors.find(item=>[item.name_ar,item.nameAr,item.name_en,item.nameEn].includes(colorName));
  assert(color,`Missing color ${colorName}`);
  const rugOption=(rug.variants||[]).find(item=>item.color===colorName&&item.is_active!==false);
  assert(rugOption,`Missing rug variant ${colorName}`);
  const sheet=record('products',mapping.sheet).data;
  const legacyOptions=(legacy.data.variants||[]).filter(item=>item.color===colorName&&item.is_active!==false);
  assert.equal(legacyOptions.length,3,`Expected three legacy options for ${colorName}`);
  for(const [index,old] of legacyOptions.entries()){
    if(existing.has(optionKey(old)))continue;
    const sheetOption=(sheet.variants||[]).find(item=>item.color===colorName&&item.value===old.value&&item.is_active!==false);
    assert(sheetOption,`Missing ${colorName} sheet option ${old.value}`);
    const template=(bundle.data.bundle_variants||[]).find(item=>item.value===old.value);
    assert(template,`Missing bundle template for ${old.value}`);
    const images=[rugOption.image_url,sheetOption.image_url].filter(Boolean);
    const suffix=String(index+1).padStart(2,'0');
    const sku=`SET-200335-${mapping.code}-${suffix}`;
    const barcode=ean13(`200335${String(201+Object.keys(mappings).indexOf(colorName)).padStart(3,'0')}${String(index+1).padStart(3,'0')}`);
    const id=`bundle-reconciled-200335-${mapping.code.toLowerCase()}-${suffix}`;
    assert(!db.prepare("SELECT 1 FROM records WHERE entity IN ('products','bundles') AND payload LIKE ? LIMIT 1").get(`%${sku}%`),`Duplicate SKU ${sku}`);
    assert(!db.prepare("SELECT 1 FROM records WHERE entity IN ('products','bundles') AND payload LIKE ? LIMIT 1").get(`%${barcode}%`),`Duplicate barcode ${barcode}`);
    const variant={...template,id,label_ar:`${colorName} · شرشف ${old.value}`,label_en:`${colorName} · شرشف ${old.value}`,color_id:color.id,color:colorName,color_name_ar:colorName,color_name_en:colorName,hex_code:color.hex_code||color.color,sku,barcode,price:Number(old.price??template.price),compare_at_price:Number(old.compare_at_price??template.compare_at_price),images,image_url:images[0]||'',use_own_stock:false,stock:null,items:[{product_id:133,variant_id:rugOption.id,quantity:1},{product_id:mapping.sheet,variant_id:sheetOption.id,quantity:1}],is_active:true,sort_order:bundle.data.bundle_variants.length+created.length};
    created.push({variant,component_stock:Math.min(Number(rugOption.stock||0),Number(sheetOption.stock||0))});
    existing.add(optionKey(variant));
  }
}
const missing=(legacy.data.variants||[]).filter(item=>item.is_active!==false&&!existing.has(optionKey(item)));
assert.equal(missing.length,0,`Unmapped legacy options: ${missing.map(optionKey).join(', ')}`);
console.log(JSON.stringify({bundle_id:bundle.id,old_options:legacy.data.variants.length,current_options:bundle.data.bundle_variants.length,add:created.map(({variant,component_stock})=>({id:variant.id,color:variant.color,value:variant.value,components:variant.items,component_stock})),final_options:bundle.data.bundle_variants.length+created.length},null,2));
if(process.argv.includes('--apply')&&created.length){
  db.transaction(()=>{
    const fresh=record('bundles',200335);
    assert.equal(fresh.payload,bundle.payload,'Bundle changed since dry run');
    const updated={...fresh.data,bundle_variants:[...fresh.data.bundle_variants,...created.map(row=>row.variant)]};
    db.prepare("UPDATE records SET payload=?,updated_at=CURRENT_TIMESTAMP WHERE entity='bundles' AND id=? AND is_deleted=0").run(JSON.stringify(updated),200335);
  })();
  console.log('Applied');
}
db.close();
