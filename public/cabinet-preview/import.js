function delimited(source) {
  const text = source.replace(/^\uFEFF/, "");
  const header = text.split(/\r?\n/, 1)[0];
  const separator = [";", "\t", ","].sort((a,b) => header.split(b).length - header.split(a).length)[0];
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && (quoted || !cell)) {
      if (quoted && text[i+1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (ch === separator || ch === "\n" || ch === "\r")) {
      row.push(cell); cell = "";
      if (ch !== separator) {
        if (ch === "\r" && text[i+1] === "\n") i++;
        rows.push(row); row = [];
      }
    } else cell += ch;
  }
  if (quoted) throw Error("Проверьте кавычки в CSV.");
  if (row.length || cell) rows.push([...row, cell]);
  return rows;
}

async function workbook(buffer) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end,true) !== 0x06054b50) end--;
  if (end < Math.max(0, bytes.length - 65557)) throw Error("Файл XLSX повреждён.");
  const decoder = new TextDecoder(), entries = new Map();
  let offset = view.getUint32(end+16,true);
  for(let i=0;i<view.getUint16(end+10,true);i++){
    if(view.getUint32(offset,true)!==0x02014b50) throw Error("Файл XLSX повреждён.");
    const length = view.getUint16(offset+28,true);
    entries.set(decoder.decode(bytes.slice(offset+46,offset+46+length)), {
      method:view.getUint16(offset+10,true), size:view.getUint32(offset+20,true),
      expanded:view.getUint32(offset+24,true), local:view.getUint32(offset+42,true)
    });
    offset += 46+length+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);
  }
  async function xml(path) {
    const entry = entries.get(path);
    if (!entry) return null;
    if(entry.expanded > 16_000_000 || ![0,8].includes(entry.method)) throw Error("Файл XLSX слишком большой или использует неподдерживаемое сжатие.");
    const start = entry.local+30+view.getUint16(entry.local+26,true)+view.getUint16(entry.local+28,true);
    let data = bytes.slice(start,start+entry.size);
    if(entry.method===8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      data = await new Response(stream).arrayBuffer();
    }
    const doc = new DOMParser().parseFromString(decoder.decode(data),"application/xml");
    if(doc.querySelector("parsererror")) throw Error("Не удалось прочитать лист Excel.");
    return doc;
  }
  const book = await xml("xl/workbook.xml");
  const relations = await xml("xl/_rels/workbook.xml.rels");
  const first = book?.querySelector("sheet");
  const id = first?.getAttribute("r:id");
  const target = [...(relations?.querySelectorAll("Relationship") || [])].find(r=>r.getAttribute("Id")===id)?.getAttribute("Target");
  const sheet = await xml(target ? new URL(target,"https://local.invalid/xl/workbook.xml").pathname.slice(1) : "xl/worksheets/sheet1.xml");
  if(!sheet) throw Error("В файле нет листа с приборами.");
  const strings = [...((await xml("xl/sharedStrings.xml"))?.querySelectorAll("si") || [])]
    .map(item=>[...item.querySelectorAll("t")].map(t=>t.textContent).join(""));
  const epoch = book?.querySelector("workbookPr")?.getAttribute("date1904");
  const rows = [...sheet.querySelectorAll("sheetData row")].map(row=>{
    const values=[];
    for(const cell of row.querySelectorAll("c")){
      const letters = (cell.getAttribute("r") || "").match(/^[A-Z]+/)?.[0];
      const column = letters ? [...letters].reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0)-1 : values.length;
      if(column>511) continue;
      const raw = cell.querySelector("v")?.textContent ?? "";
      const type = cell.getAttribute("t");
      values[column] = type==="s" ? strings[Number(raw)] ?? "" : type==="inlineStr"
        ? [...cell.querySelectorAll("t")].map(t=>t.textContent).join("") : raw;
    }
    return values;
  });
  return {rows, epoch: epoch==="1" || epoch==="true" ? 1904 : 1900};
}

export async function readRegister(file) {
  if(file.size>10_000_000) throw Error("Выберите файл размером до 10 МБ.");
  const buffer = await file.arrayBuffer();
  let result;
  if (/\.xlsx$/i.test(file.name)) result = await workbook(buffer);
  else if (/\.csv$/i.test(file.name)) {
    let source = new TextDecoder().decode(buffer);
    if(source.includes("\uFFFD")) source = new TextDecoder("windows-1251").decode(buffer);
    result = {rows:delimited(source)};
  } else throw Error("Поддерживаются файлы XLSX и CSV.");
  result.rows = result.rows.filter(row=>row.some(value=>String(value ?? "").trim()));
  if(result.rows.length<2) throw Error("Нужны заголовки и хотя бы одна строка с прибором.");
  if(result.rows.length>10001) throw Error("В одном файле можно загрузить до 10 000 строк.");
  return result;
}

export function importDate(value, epoch) {
  if(!value) return "";
  if(epoch && /^\d{4,5}(?:\.\d+)?$/.test(value)) {
    return new Date(Date.UTC(epoch,0,epoch===1904 ? 1 : -1)+Math.floor(Number(value))*86400000).toISOString().slice(0,10);
  }
  const russian = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  const iso = russian ? [russian[3], russian[2].padStart(2,"0"), russian[1].padStart(2,"0")].join("-")
    : value.match(/^\d{4}-\d{2}-\d{2}(?:T|$)/)?.[0].slice(0,10);
  const date = new Date(iso);
  return Number.isFinite(+date) && date.toISOString().slice(0,10)===iso ? iso : null;
}
