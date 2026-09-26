import { deflateRawSync } from "node:zlib";

const xml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[char]);
const column = number => { let result=""; for(let n=number+1;n;n=Math.floor((n-1)/26)) result=String.fromCharCode(65+(n-1)%26)+result; return result; };
let crcTable;
function crc32(bytes) {
  crcTable ||= Array.from({length:256}, (_,index) => { let value=index; for(let bit=0;bit<8;bit++) value=value&1?0xedb88320^(value>>>1):value>>>1; return value>>>0; });
  let crc=0xffffffff;
  for(const byte of bytes) crc=crcTable[(crc^byte)&255]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}
function zip(entries) {
  const local=[], central=[]; let offset=0;
  for(const [name, content] of entries) {
    const filename=Buffer.from(name), raw=Buffer.from(content), compressed=deflateRawSync(raw), crc=crc32(raw);
    const header=Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20,4); header.writeUInt16LE(8,6); header.writeUInt16LE(8,8); header.writeUInt32LE(crc,14); header.writeUInt32LE(compressed.length,18); header.writeUInt32LE(raw.length,22); header.writeUInt16LE(filename.length,26);
    local.push(header,filename,compressed);
    const directory=Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20,4); directory.writeUInt16LE(20,6); directory.writeUInt16LE(8,8); directory.writeUInt16LE(8,10); directory.writeUInt32LE(crc,16); directory.writeUInt32LE(compressed.length,20); directory.writeUInt32LE(raw.length,24); directory.writeUInt16LE(filename.length,28); directory.writeUInt32LE(offset,42);
    central.push(directory,filename); offset+=header.length+filename.length+compressed.length;
  }
  const directory=Buffer.concat(central), end=Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length,8); end.writeUInt16LE(entries.length,10); end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directory,end]);
}
export function workbook(sheets) {
  const entries=[];
  const types=['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'];
  const sheetXml=sheets.map((sheet,index)=>{
    types.push(`<Override PartName="/xl/worksheets/sheet${index+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    const rows=sheet.rows.map((row,rowIndex)=>`<row r="${rowIndex+1}">${row.map((value,colIndex)=>{const ref=`${column(colIndex)}${rowIndex+1}`;return typeof value==="number"&&Number.isFinite(value)?`<c r="${ref}"><v>${value}</v></c>`:`<c r="${ref}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;}).join("")}</row>`).join("");
    entries.push([`xl/worksheets/sheet${index+1}.xml`,`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`]);
    return `<sheet name="${xml(sheet.name.slice(0,31))}" sheetId="${index+1}" r:id="rId${index+1}"/>`;
  });
  types.push('</Types>');
  entries.push(['[Content_Types].xml',types.join('')]);
  entries.push(['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
  entries.push(['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetXml.join('')}</sheets></workbook>`]);
  entries.push(['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,index)=>`<Relationship Id="rId${index+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index+1}.xml"/>`).join('')}</Relationships>`]);
  return zip(entries);
}
