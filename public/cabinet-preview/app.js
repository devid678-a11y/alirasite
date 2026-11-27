import {setupPwa, syncPush} from "./pwa.js?v=push-errors";
import {readRegister} from "./import.js";

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const iso = date => date.toISOString().slice(0,10);
const now = new Date();
const today = iso(now);
const shifted = days => iso(new Date(+now + days * 86400000));
const fmt = value => value ? new Date(value+"T12:00:00").toLocaleDateString("ru-RU") : "—";
const uid = () => crypto.randomUUID();
const sections = {
  overview:["⌂","Обзор"], instruments:["▤","Приборы"], schedule:["▦","Сроки"], requests:["◷","Заявки"],
  documents:["▧","Документы"], import:["⇧","Импорт"], reports:["▥","Отчёты"],
  activity:["≡","История"], settings:["⚙","Настройки"]
};
const fields = [
  ["name","Наименование",["прибор","тип","наименование си","средство измерений","название","type","instrument","name"]],
  ["code","Учётный номер",["инвентарный номер","контрольный номер","номер си","control no","control number","asset number"]],
  ["serial","Заводской номер",["серийный номер","зав номер","зав no","serial number","serial no","sn"]],
  ["maker","Производитель",["изготовитель","manufacturer"]],
  ["model","Модель",["марка","model"]],
  ["location","Подразделение",["место","местоположение","location"]],
  ["last","Дата последней поверки",["дата поверки","последняя поверка","last calibrated","last calibration date"]],
  ["due","Дата следующей поверки",["срок поверки","следующая поверка","действительна до","next due","next due date"]],
  ["certificate","Номер свидетельства",["свидетельство","номер записи","certificate","certificate reference"]]
];
const initial = [
  ["Штангенциркуль","Mitutoyo","CD-15APX","43719","ОТК",-6],
  ["Манометр","WIKA","111.10","54821","Цех № 1",8],
  ["Рулетка измерительная","Stanley","PowerLock 5 м","32891","Склад",22],
  ["Мультиметр","Fluke","87V","60912","Лаборатория",68],
  ["Анализатор спектра","Keysight","N9020B","78124","Лаборатория",115],
  ["Линейка измерительная","","300 мм","83143","ОТК",null]
].map(([name,maker,model,serial,location,days],i)=>({
  id:"demo-"+i, name,maker,model,serial,location,code:"СИ-00"+(i+1),
  due:days===null?"":shifted(days), records:days===null?[]:[{date:shifted(days-365),result:"Годен",provider:"Демонстрационная лаборатория",certificate:"ДЕМО-"+(i+1),due:shifted(days)}]
}));
const storage = "alira-cabinet-preview-v1";
const importFields = [["name","Название",["наименование","прибор"]],["model","Тип",["модель"]],["registry","№ Госреестра",["номер госреестра","госреестр"]],["serial","Заводской номер",["серийный номер","зав номер"]]];
let arshin = new Map(), lookup = null;
const pair = i => JSON.stringify([i.registry,i.serial]);
const arshinLink = url => /^https:\/\/fgis\.gost\.ru\/fundmetrology\/cm\/results\/[\w.-]+$/.test(url||"") ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Аршин ↗</a>` : "";
const defaultState = {instruments:initial, requests:[], activity:[], settings:{company:"Демо организация",email:"",days:[30,14,7]}, views:[]};
let state;
try { state = JSON.parse(localStorage.getItem(storage)) || defaultState; } catch { state = defaultState; }
let filter = "", dueFilter = "all", sort = "code", month = new Date(now.getFullYear(),now.getMonth(),1), scheduleMode = "list";
let registerStatus = "all", compact = false, pageNumber = 0, pageSize = 25, sortDescending = false, scheduleWindow = "30";
const selected = new Set(), hiddenColumns = new Set();
const registerColumns = {code:"Учётный №",name:"Название",model:"Тип",registry:"№ Госреестра",serial:"Заводской номер",status:"Статус",due:"Следующая поверка"};
let imported, mapping, importError = "", fileVersion = 0;
let noticeTimer;

function notify(message) {
  $("notice").textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(()=>$("notice").textContent="",4300);
}
function change(description, mutate) {
  const next = structuredClone(state);
  mutate(next);
  next.activity.unshift({time:new Date().toISOString(),description});
  try { localStorage.setItem(storage,JSON.stringify(next)); }
  catch { notify("Не удалось сохранить изменения. Проверьте свободное место в браузере."); return false; }
  state = next;
  void syncPush();
  return true;
}
const heading = (title, description="", action="") => `<div class="heading"><div><h1>${title}</h1>${description ? `<span class="muted">${description}</span>` : ""}</div>${action}</div>`;
const button = (action,label,primary=false) => `<button type="button" data-action="${action}" ${primary?'class="primary"':''}>${label}</button>`;
const link = (route,label) => `<a class="action" href="#${route}">${label}</a>`;
const active = () => state.instruments.filter(i=>!i.archived);
const instrumentLink = i => `<a href="#instrument/${i.id}"><strong>${esc(i.name)}</strong></a>`;
const status = i => !i.due ? "none" : i.due<today ? "late" : i.due<=shifted(30) ? "soon" : "ok";
const statusLabels = {none:"Без даты",late:"Просрочена",soon:"Скоро поверка",ok:"Действует"};
const badge = i => `<span class="badge ${status(i)}">${statusLabels[status(i)]}</span>`;
const empty = message => `<p class="panel muted">${message}</p>`;
const newRequest = button("request","Заявка на поверку",true);

function instrumentList(items) {
  if(!items.length) return empty("Приборы не найдены.");
  return `<div class="panel scroll desktop-table"><table><thead><tr><th>Прибор</th><th>Учётный №</th><th>Заводской №</th><th>Подразделение</th><th>Следующая поверка</th><th>Состояние</th></tr></thead><tbody>
    ${items.map(i=>`<tr><td>${instrumentLink(i)} <small>${esc([i.maker,i.model].filter(Boolean).join(" "))}</small></td><td>${esc(i.code)||"—"}</td><td>${esc(i.serial)||"—"}</td><td>${esc(i.location)||"—"}</td><td>${fmt(i.due)}</td><td>${badge(i)}</td></tr>`).join("")}</tbody></table></div>
    <div class="mobile-list">${items.map(i=>`<article class="card"><div class="row">${instrumentLink(i)}${badge(i)}</div><p class="muted">${esc([i.maker,i.model,i.code,i.serial&&"зав. № "+i.serial].filter(Boolean).join(" · "))}</p><small>Следующая поверка</small><br><strong>${fmt(i.due)}</strong></article>`).join("")}</div>`;
}
function filtered() {
  return state.instruments.filter(i=>registerStatus==="all"||(registerStatus==="archived" ? i.archived : !i.archived))
    .filter(i=>["all","archived"].includes(dueFilter)||status(i)===dueFilter)
    .filter(i=>[i.name,i.code,i.maker,i.model,i.serial,i.registry].join(" ").toLowerCase().includes(filter.trim().toLowerCase()))
    .sort((a,b)=>{
      if(sort==="status") return (Number(!!a.archived)-Number(!!b.archived))*(sortDescending?-1:1);
      return String(a[sort]||"").localeCompare(String(b[sort]||""),"ru",{numeric:true})*(sortDescending?-1:1);
    });
}
function registerRows() {
  const rows = filtered();
  const pages = Math.max(1,Math.ceil(rows.length/pageSize));
  pageNumber = Math.min(pageNumber,pages-1);
  const start = pageNumber*pageSize, items = rows.slice(start,start+pageSize);
  const columns = Object.keys(registerColumns).filter(key=>!hiddenColumns.has(key));
  const checkbox = i => `<input type="checkbox" data-pick="${i.id}" aria-label="Выбрать ${esc(i.code||i.name)}" ${selected.has(i.id)?"checked":""}>`;
  const life = i => `<span class="badge ${i.archived?"":"ok"}">${i.archived?"В архиве":"Активен"}</span>`;
  const due = i => `${fmt(i.due)} ${arshinLink(i.arshinUrl)} ${["late","soon"].includes(status(i))&&!i.archived?badge(i):""}`;
  const code = i => `<a class="instrument-code" href="#instrument/${i.id}">${esc(i.code||i.name)}</a>`;
  const cells = i => ({code:code(i),name:esc(i.name),model:esc(i.model)||"—",registry:esc(i.registry)||"—",serial:esc(i.serial)||"—",status:life(i),due:due(i)});
  return `<div class="register-options"><details class="column-picker"><summary>Столбцы</summary><div>${Object.entries(registerColumns).filter(([key])=>key!=="code").map(([key,label])=>`<label class="check"><input type="checkbox" data-column="${key}" ${hiddenColumns.has(key)?"":"checked"}>${label}</label>`).join("")}</div></details>
    <button data-action="compact" aria-pressed="${compact}">Компактный вид ${compact?"вкл.":"выкл."}</button>
    <span class="muted count">${rows.length?start+1:0}–${start+items.length} из ${rows.length}</span></div>
    ${items.length?`<div class="scroll desktop-table"><table class="register-table"><thead><tr><th><input type="checkbox" id="pickPage" aria-label="Выбрать страницу" ${items.every(i=>selected.has(i.id))?"checked":""}></th>${columns.map(key=>`<th><button data-action="sort/${key}">${registerColumns[key]}${sort===key?(sortDescending?" ↓":" ↑"):""}</button></th>`).join("")}</tr></thead><tbody>
    ${items.map(i=>{const row=cells(i);return `<tr class="${status(i)==="late"&&!i.archived?"overdue":""}"><td>${checkbox(i)}</td>${columns.map(key=>`<td>${row[key]}</td>`).join("")}</tr>`;}).join("")}</tbody></table></div>
    <div class="mobile-list">${items.map(i=>`<div class="register-mobile-row">${checkbox(i)}<article class="${status(i)==="late"&&!i.archived?"overdue":""}"><div class="row">${code(i)}${columns.includes("status")?life(i):""}</div>
    <p class="muted">${esc([columns.includes("name")&&i.name,columns.includes("model")&&i.model,columns.includes("registry")&&i.registry&&"Госреестр № "+i.registry,columns.includes("serial")&&i.serial&&"Зав. № "+i.serial].filter(Boolean).join(" · "))}</p>
    ${columns.includes("due")?`<div>Поверка: ${due(i)}</div>`:""}</article></div>`).join("")}</div>`:empty("Приборы не найдены.")}
    <div class="register-footer"><label>Строк на странице <select id="pageSize">${[25,50,100].map(n=>`<option ${n===pageSize?"selected":""}>${n}</option>`).join("")}</select></label>
    <div class="row"><button data-action="page/prev" ${pageNumber===0?"disabled":""}>Назад</button><small>${pageNumber+1} из ${pages}</small><button data-action="page/next" ${pageNumber+1===pages?"disabled":""}>Далее</button></div></div>`;
}
function refreshRegister() {
  $("instrumentResults").classList.toggle("compact",compact);
  $("instrumentResults").innerHTML = registerRows();
}
function overview() {
  const instruments = active();
  const metrics = [["Все приборы",instruments.length,"instruments"],["Просрочена поверка",instruments.filter(i=>status(i)==="late").length,"instruments/late"],["В ближайшие 30 дней",instruments.filter(i=>status(i)==="soon").length,"instruments/soon"],["Заявки",state.requests.length,"requests"]];
  return heading("Обзор",esc(state.settings.company))+`<section class="hero"><h2>Поверка средств измерений</h2><p>Следите за сроками поверки и оформляйте заявки из кабинета.</p>${newRequest}</section>
    <div class="grid">${metrics.map(([label,value,route])=>`<a class="card" href="#${route}">${label}<strong class="metric">${value}</strong></a>`).join("")}</div>
    <h2>Ближайшие сроки</h2>${instrumentList(instruments.filter(i=>i.due).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4))}`;
}
function instruments() {
  const buckets = {all:"Все",late:"Просрочены",soon:"Скоро поверка",none:"Без даты",ok:"Действует"};
  const items=state.instruments;
  return heading("Приборы",`В реестре: ${items.length}`,`<div class="heading-actions">${button("labels","Печать этикеток")}${button("add","Добавить прибор",true)}</div>`)+
    `<section class="panel register"><div class="register-search"><input id="search" type="search" aria-label="Поиск приборов" placeholder="Номер, тип, производитель, подразделение" value="${esc(filter)}">
    <select id="registerStatus" aria-label="Статус прибора">${Object.entries({all:"Все статусы",active:"Активен",archived:"В архиве"}).map(([key,label])=>`<option value="${key}" ${registerStatus===key?"selected":""}>${label}</option>`).join("")}</select></div>
    <div class="register-filters">${Object.entries(buckets).map(([key,label])=>`<a href="#instruments${key==="all"?"":"/"+key}" ${key===dueFilter?'aria-current="true"':""}>${label} <span>${items.filter(i=>key==="all"||status(i)===key).length}</span></a>`).join("")}</div>
    <div id="instrumentResults" class="${compact?"compact":""}">${registerRows()}</div></section>`;
}
function details(i) {
  return heading(esc(i.name),esc([i.maker,i.model].filter(Boolean).join(" ")),newRequest)+
    `<div class="panel"><div class="row"><strong>Следующая поверка: ${fmt(i.due)}</strong>${arshinLink(i.arshinUrl)}${badge(i)}</div></div>
    <div class="grid">${[fields[1],...importFields.slice(1)].map(([key,label])=>`<div class="card"><small>${label}</small><br><strong>${esc(i[key])||"—"}</strong></div>`).join("")}</div>
    <div class="tools">${button("edit","Редактировать")}${button("clone","Копировать")}${button("log","Записать результат поверки")}${button("label","Печать этикетки")}${button("archive",i.archived?"Вернуть из архива":"В архив")}</div>
    <h2>История поверок</h2>${i.records.length ? i.records.map(r=>`<article class="card"><div class="row"><strong>${fmt(r.date)}</strong><span>${esc(r.result||"Нет результата")}</span></div><p>${esc(r.provider||"")}</p><small>Свидетельство: ${esc(r.certificate)||"—"} · Следующая поверка: ${fmt(r.due)}</small></article>`).join("") : empty("Записей о поверке пока нет.")}`;
}
function schedule() {
  const instruments = active();
  const items = instruments.filter(i=>i.due).sort((a,b)=>a.due.localeCompare(b.due));
  const inWindow = (i,key) => key==="none" ? !i.due : key==="late" ? !!i.due&&i.due<today : !!i.due&&i.due<=shifted(Number(key));
  const title = heading("График поверки",`Просрочено: ${instruments.filter(i=>inWindow(i,"late")).length} · В ближайшие 30 дней: ${instruments.filter(i=>status(i)==="soon").length}`,
    `<div class="register-filters switcher">${[["list","Список"],["month","Месяц"]].map(([key,label])=>`<a href="#schedule/${key}" ${scheduleMode===key?'aria-current="true"':""}>${label}</a>`).join("")}</div>`);
  if(scheduleMode==="list") {
    const windows = {late:"Просрочены",7:"7 дней",14:"14 дней",30:"30 дней",60:"60 дней",90:"90 дней",180:"180 дней",none:"Без даты"};
    return title+`<div class="register-filters schedule-filters">${["late","7","14","30","60","90","180","none"].map(key=>`<a href="#schedule/list-${key}" ${scheduleWindow===key?'aria-current="true"':""}>${windows[key]} <span>${instruments.filter(i=>inWindow(i,key)).length}</span></a>`).join("")}</div>`+instrumentList(instruments.filter(i=>inWindow(i,scheduleWindow)).sort((a,b)=>a.due.localeCompare(b.due)));
  }
  const pad = (month.getDay()+6)%7, count = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const cells = Array.from({length:pad},()=>"<div></div>");
  for(let day=1;day<=count;day++){
    const date = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    cells.push(`<div class="day"><strong>${day}</strong>${items.filter(i=>i.due===date).map(i=>instrumentLink(i)).join("")}</div>`);
  }
  return title+`<section class="panel"><div class="row">${button("prev-month","← Пред.")}<h2>${month.toLocaleDateString("ru-RU",{month:"long",year:"numeric"})}</h2>${button("next-month","След. →")}</div>
    <div class="calendar">${["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(day=>`<small>${day}</small>`).join("")}${cells.join("")}</div></section>`;
}
function requests() {
  return heading("Заявки на поверку","Черновики заявок в этом кабинете",newRequest)+(state.requests.length ?
    state.requests.map(r=>`<article class="card"><div class="row"><b>Заявка № ${r.number}</b><span class="badge">Черновик</span></div>
    <p>${r.items.map(i=>esc(i.name)+" × "+i.count).join(", ") || "Без перечня приборов"}</p><small>${fmt(r.date)} · ${esc(r.contact)}</small>${r.comment?`<p>${esc(r.comment)}</p>`:""}</article>`).join("") : empty("Заявок пока нет."));
}
function documents() {
  const docs = state.instruments.flatMap(i=>i.records.filter(r=>r.certificate).map(r=>({i,r})));
  return heading("Документы","Номера свидетельств из истории поверок")+(docs.length ? docs.map(({i,r})=>
    `<article class="card"><strong>${esc(r.certificate)}</strong><p>${instrumentLink(i)}</p><small>${fmt(r.date)} · ${esc(r.provider)}</small></article>`).join("") : empty("Свидетельств пока нет."));
}

const normalize = text => String(text ?? "").toLowerCase().replace(/ё/g,"е").replace(/[№._-]+/g," ").replace(/\s+/g," ").trim();
function rowsForImport() {
  const seen = new Set(state.instruments.filter(i=>i.registry&&i.serial).map(pair));
  return imported.rows.slice(1).map((row,index)=>{
    const item = Object.fromEntries(importFields.map(([key])=>[key,String(row[mapping[key]] ?? "").trim()]));
    const key = pair(item);
    let error = "";
    if(!item.name) error = "Нет наименования";
    else if(!/^\d{1,10}-\d{2,4}$/.test(item.registry)) error = "Проверьте № Госреестра";
    else if(!item.serial || item.serial.length>100) error = "Проверьте заводской номер";
    else if(seen.has(key)) error = "Прибор уже в файле или реестре";
    if(!error) seen.add(key);
    return {item,result:arshin.get(key),error,line:index+2};
  });
}
async function checkArshin() {
  if(lookup || !imported) return;
  const rows = rowsForImport().filter(r=>!r.error);
  const controller = new AbortController();
  lookup = controller;
  for(const [index,{item}] of rows.entries()){
    if(controller.signal.aborted) return;
    const review = $("review");
    if(review) review.innerHTML = `<p role="status">Проверено ${index} из ${rows.length} · ${button("cancel-arshin","Отменить")}</p>`;
    try {
      const query = new URLSearchParams({registry:item.registry,serial:item.serial});
      const response = await fetch("/api/cabinet/arshin?"+query,{signal:controller.signal});
      const result = await response.json();
      if(!controller.signal.aborted) arshin.set(pair(item),result);
    } catch {
      if(!controller.signal.aborted) arshin.set(pair(item),{status:"unavailable"});
    }
  }
  if(controller.signal.aborted) return;
  lookup = null;
  if($("review")) $("review").innerHTML = importReview();
}
function importReview() {
  if(!imported) return "";
  if(lookup) return `<p role="status">Идёт поиск в «Аршине» · ${button("cancel-arshin","Отменить")}</p>`;
  const rows = rowsForImport(), valid = rows.filter(r=>!r.error);
  const checked = valid.every(r=>r.result);
  const labels = {missing:"Не найдено",unavailable:"Аршин недоступен",ambiguous:"Несколько записей",invalid:"Проверьте номера"};
  return `<p>${valid.length} к импорту · ${rows.length-valid.length} с ошибками</p>
    <div class="scroll"><table><thead><tr><th>Строка</th>${importFields.map(([,label])=>`<th>${label}</th>`).join("")}<th>Дата следующей поверки</th><th>Аршин</th></tr></thead>
    <tbody>${rows.slice(0,10).map(({item,result,error,line})=>`<tr><td>${line}</td>${importFields.map(([key])=>`<td>${esc(item[key])}</td>`).join("")}<td>${fmt(result?.due)}</td><td>${error||(result?.status==="found"?(result.unsuitable?"Непригоден · ":"")+arshinLink(result.url):labels[result?.status]||"Ожидает поиска")}</td></tr>`).join("")}</tbody></table></div>
    <p class="muted">Показано до 10 строк. Дата берётся из поля «Действительна до». Если её получить не удалось, поле останется пустым.</p>
    <div class="tools">${valid.length?button("check-arshin",checked?"Повторить поиск в Аршине":"Найти поверки в Аршине",!checked):""}
    ${valid.length&&checked?button("commit-import",`Импортировать (${valid.length})`,true):""}</div>`;
}
function importScreen() {
  return heading("Импорт приборов","Загрузите существующий реестр из Excel или CSV.",button("sample","Скачать пример CSV"))+
    `<section class="panel drop" id="drop"><h2>Выберите или перетащите файл</h2><p class="muted">XLSX или CSV, до 10 МБ. Первая строка — заголовки. Из XLSX читается первый лист.</p>
    <input type="file" id="importFile" accept=".xlsx,.csv" aria-label="Файл реестра"></section>
    ${importError?`<p role="alert" class="panel late">${esc(importError)}</p>`:""}
    ${imported?`<section class="panel"><h2>Сопоставление столбцов</h2><p>${esc(imported.name)}</p><div class="grid">
    ${importFields.map(([key,label])=>`<label>${label}${key!=="model"?" *":""}<select data-map="${key}"><option value="">Пропустить</option>
    ${Array.from(imported.rows[0],(title,index)=>`<option value="${index}" ${mapping[key]===index?"selected":""}>${esc(title||"Столбец "+(index+1))}</option>`).join("")}</select></label>`).join("")}</div></section>
    <section class="panel"><h2>Предпросмотр</h2><div id="review">${importReview()}</div></section>`:""}`;
}
async function selectFile(file) {
  if(!file) return;
  lookup?.abort();
  lookup = null;
  arshin.clear();
  const version = ++fileVersion;
  imported = undefined;
  importError = "";
  try {
    const result = await readRegister(file);
    if(version!==fileVersion) return;
    imported = {...result,name:file.name};
    const headers = imported.rows[0].map(normalize);
    mapping = Object.fromEntries(importFields.map(([key,label,aliases])=>{
      const index = headers.findIndex(h=>[label,...aliases].map(normalize).includes(h));
      return [key,index<0?"":index];
    }));
  } catch(error) {
    if(version!==fileVersion) return;
    importError = error instanceof RangeError ? "Не удалось прочитать файл. Проверьте его формат." : error.message;
  }
  if(location.hash==="#import") render();
}
function commitImport() {
  const valid = rowsForImport().filter(r=>!r.error);
  if(lookup || !valid.length || valid.some(r=>!r.result)) return;
  if(!change("Импортировано приборов: "+valid.length,next=>{
    for(const {item,result} of valid){
      const found = result.status==="found";
      const due = found ? result.due : "";
      next.instruments.push({...item,id:uid(),due,arshinUrl:found?result.url:"",
        records:found?[{date:result.date,result:result.unsuitable?"Не годен":"",provider:result.provider,due}]:[]});
    }
  })) return;
  imported = undefined;
  filter = "";
  location.hash = "instruments";
  notify("Импортировано приборов: "+valid.length);
}

const reportTypes = {all:"Реестр приборов",late:"Просроченные поверки",soon:"Поверки в ближайшие 30 дней",history:"История поверок"};
function reports() {
  return heading("Отчёты","Выгрузки для работы с реестром",button("save-view","Сохранить свой отчёт",true))+
    `<div class="grid">${[...Object.entries(reportTypes).map(([key,name])=>({key,name})),...state.views]
      .map(r=>`<article class="card"><h2>${esc(r.name)}</h2><div class="tools">${button("export/"+r.key,"Скачать CSV")}${button("print/"+r.key,"Печать / PDF")}</div></article>`).join("")}</div>`;
}
function activity() {
  return heading("История действий","Изменения в локальном реестре")+(state.activity.length ?
    state.activity.map(e=>`<article class="card"><strong>${esc(e.description)}</strong><br><small>${new Date(e.time).toLocaleString("ru-RU")}</small></article>`).join("") : empty("Изменений пока нет."));
}
function settings() {
  return heading("Настройки")+`<form class="panel" data-form="settings"><h2>Организация и напоминания</h2>
    ${field("company","Название организации",state.settings.company,true)}${field("email","Email для напоминаний",state.settings.email,false,"email")}
    <p class="muted">Выберите, за сколько дней до поверки присылать пуши.</p>
    ${[60,30,14,7,3,1,0].map(day=>`<label class="check"><input type="checkbox" name="days" value="${day}" ${state.settings.days.includes(day)?"checked":""}>${day?"За "+day+" дн.":"В день поверки"}</label>`).join("")}
    <button class="primary">Сохранить настройки</button></form>`;
}

function field(key,label,value="",required=false,type="text") {
  return `<label>${label}${required?" *":""}<input name="${key}" type="${type}" value="${esc(value)}" ${required?"required":""}></label>`;
}
function modal(title,inner,form,submit="Сохранить") {
  const d = $("dialog");
  d.innerHTML = `<div class="row"><h2>${title}</h2>${button("close","Закрыть")}</div>
    <form data-form="${form}">${inner}<button class="primary">${submit}</button></form>`;
  if(!d.open) d.showModal();
}
function instrumentForm(i={},editing=false) {
  modal(editing?"Редактировать прибор":"Добавить прибор",
    [fields[1],...importFields].map(([key,label])=>field(key,label,i[key],key==="name")).join("")+
    field("due","Следующая поверка",i.due,false,"date"),editing?"edit":"add");
}
function itemRow(name="") {
  return `<div class="line-item"><input name="item" aria-label="Прибор" placeholder="Например, манометр" value="${esc(name)}">
  <input type="number" name="count" min="1" max="99999" value="1" aria-label="Количество">${button("remove-row","×")}</div>`;
}
function requestForm(i) {
  modal("Заявка на поверку",
    field("contact","Телефон или email",state.settings.email,true)+
    `<label>Комментарий<textarea name="comment" rows="3"></textarea></label><strong>Список приборов</strong>
    <div id="items">${i?itemRow(i.name):""}</div><p>${button("add-row","Добавить прибор")}</p>`,"request","Сохранить заявку");
}
function route() {
  const [page,arg] = location.hash.slice(1).split("/");
  return {page:page||"instruments",arg};
}
function render() {
  const {page,arg} = route();
  if(page==="schedule"){
    scheduleMode=arg==="month"?"month":"list";
    if(arg?.startsWith("list-")) scheduleWindow=arg.slice(5);
  }
  const current = ["instrument","log"].includes(page)?"instruments":page;
  $("nav").innerHTML = ["instruments","import","schedule","reports","activity","requests","settings"].map(key=>
    `<a href="#${key}" ${key===current?'aria-current="page"':""}>${key==="schedule"?"График":sections[key][1]}</a>`).join("");
  const screens = {overview,instruments,schedule,requests,documents,import:importScreen,reports,activity,settings};
  const i = state.instruments.find(item=>item.id===arg);
  $("content").innerHTML = ["instrument","log"].includes(page) ? i?(page==="log"?logScreen(i):details(i)):empty("Прибор не найден.") : (screens[page]||instruments)();
}
function logScreen(i) {
  const next = new Date(today+"T12:00:00Z");
  next.setUTCFullYear(next.getUTCFullYear()+1);
  const radio = (key,options) => `<div class="segments">${options.map((value,index)=>`<label><input type="radio" name="${key}" value="${value}" ${index?"":"checked"}><span>${value}</span></label>`).join("")}</div>`;
  return `<a class="back" href="#instrument/${i.id}">← ${esc(i.code||i.name)}</a>`+
    heading("Запись о поверке",esc([i.code,i.name].filter(Boolean).join(" · ")))+
    `<form class="panel log-form" data-form="log">${field("date","Дата поверки",today,true,"date")}
    <p class="input-title">Исполнитель</p>${radio("providerType",["Сотрудник","Лаборатория"])}
    ${field("provider","Имя или организация",i.records[0]?.provider||"")}
    <p class="input-title">Результат поверки</p>${radio("result",["Годен","Не годен","Не указан"])}
    ${field("certificate","Номер свидетельства")}
    <div class="log-footer">${field("due","Следующая поверка",iso(next),false,"date")}<div class="heading-actions"><a href="#instrument/${i.id}">Отмена</a><button class="primary">Сохранить поверку</button></div></div></form>`;
}
function csv(rows,name) {
  const escapeCell = cell => {
    let value = String(cell??"");
    if(/^\s*[=+@-]/.test(value)) value = "'"+value;
    return '"'+value.replaceAll('"','""')+'"';
  };
  const blob = new Blob(["\uFEFF"+rows.map(row=>row.map(escapeCell).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=name+".csv"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function reportRows(key) {
  const columns = ["Наименование","Учётный номер","Заводской номер","Модель","Дата следующей поверки"];
  if(key==="history") return [["Прибор","Дата поверки","Результат","Свидетельство"],...state.instruments.flatMap(i=>i.records.map(r=>[i.name,r.date,r.result,r.certificate]))];
  return [columns,...active().filter(i=>key==="all"||status(i)===key).map(i=>[i.name,i.code,i.serial,i.model,i.due])];
}
function printTable(title,rows) {
  const win = window.open("","_blank");
  if(!win) { notify("Разрешите открытие окна для печати."); return; }
  win.opener=null;
  win.document.write(`<!doctype html><html lang="ru"><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:16px Arial;padding:24px}td,th{padding:8px;border-bottom:1px solid #aaa;text-align:left}</style><h1>${esc(title)}</h1><table>${rows.map((row,index)=>`<tr>${row.map(cell=>index?`<td>${esc(cell)}</td>`:`<th>${esc(cell)}</th>`).join("")}</tr>`).join("")}</table></html>`);
  win.document.close();
  win.print();
}
document.addEventListener("click",event=>{
  const target = event.target.closest("[data-action]");
  if(!target) return;
  const [action,key] = target.dataset.action.split("/");
  const {arg} = route();
  const i = state.instruments.find(item=>item.id===arg);
  const actions = {
    close:()=>$("dialog").close(), add:()=>instrumentForm(), edit:()=>instrumentForm(i,true),
    clone:()=>instrumentForm({...i,code:"",serial:"",due:""}), request:()=>requestForm(i),
    "add-row":()=>$("items").insertAdjacentHTML("beforeend",itemRow()),
    "remove-row":()=>target.closest(".line-item").remove(),
    "prev-month":()=>{month.setMonth(month.getMonth()-1);render();}, "next-month":()=>{month.setMonth(month.getMonth()+1);render();},
    "commit-import":commitImport,
    "check-arshin":checkArshin,
    "cancel-arshin":()=>{lookup?.abort();lookup=null;$("review").innerHTML=importReview();},
    compact:()=>{compact=!compact;refreshRegister();},
    sort:()=>{sortDescending=sort===key&&!sortDescending;sort=key;pageNumber=0;refreshRegister();},
    page:()=>{pageNumber+=key==="next"?1:-1;refreshRegister();},
    labels:()=>{
      const items=selected.size?state.instruments.filter(i=>selected.has(i.id)):filtered();
      if(!items.length){notify("Нет приборов для печати.");return;}
      printTable("АЛИРА · Этикетки приборов",[["Учётный №","Прибор","Заводской №","Следующая поверка"],...items.map(i=>[i.code,i.name,i.serial,fmt(i.due)])]);
    },
    sample:()=>csv([[...importFields.map(([,label])=>label),"Дата следующей поверки"],["Манометр","111.10","12345-20","000123",""]],"Пример реестра"),
    export:()=>csv(reportRows(key),target.closest("article").querySelector("h2").textContent),
    print:()=>printTable(target.closest("article").querySelector("h2").textContent,reportRows(key)),
    label:()=>printTable("АЛИРА · "+i.name,[["Учётный номер","Заводской номер","Следующая поверка"],[i.code,i.serial,fmt(i.due)]]),
    archive:()=>{if(change(i.archived?"Прибор возвращён из архива":"Прибор перенесён в архив",next=>{next.instruments.find(x=>x.id===i.id).archived=!i.archived;}))render();},
    log:()=>{location.hash="log/"+i.id;},
    "save-view":()=>modal("Сохранить отчёт",field("name","Название","",true)+
      `<label>Данные<select name="key">${Object.entries(reportTypes).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label>`,"view")
  };
  actions[action]?.();
});
document.addEventListener("submit",event=>{
  const form = event.target.dataset.form;
  if(!form) return;
  event.preventDefault();
  const data = new FormData(event.target);
  const values = Object.fromEntries([...data].map(([key,value])=>[key,value.trim()]));
  const {arg} = route();
  if((form==="add"||form==="edit"||form==="view")&&!values.name) { notify("Введите название.");return; }
  if(form==="request"&&!values.contact) { notify("Укажите телефон или email.");return; }
  if((form==="add"||form==="edit")&&values.code&&state.instruments.some(i=>i.id!==arg&&normalize(i.code)===normalize(values.code))){
    notify("Прибор с таким учётным номером уже есть.");return;
  }
  const id = form==="edit"?arg:uid();
  const changes = {
    add:["Добавлен прибор «"+values.name+"»",next=>next.instruments.push({...values,id,records:[]})],
    edit:["Изменён прибор «"+values.name+"»",next=>Object.assign(next.instruments.find(i=>i.id===id),values)],
    log:["Добавлена запись о поверке",next=>{const i=next.instruments.find(i=>i.id===arg);i.records.unshift(values);i.records.sort((a,b)=>b.date.localeCompare(a.date));i.due=i.records[0].due;}],
    request:["Сохранена заявка на поверку",next=>{
      const counts=data.getAll("count");
      const items=data.getAll("item").map((name,index)=>({name:name.trim(),count:Number(counts[index])||1})).filter(i=>i.name);
      next.requests.unshift({number:next.requests.length+1,date:today,contact:values.contact,comment:values.comment,items});
    }],
    settings:["Обновлены настройки",next=>{next.settings={company:values.company,email:values.email,days:data.getAll("days").map(Number)};}],
    view:["Сохранён отчёт",next=>next.views.push(values)]
  };
  if(!changes[form]||!change(...changes[form])) return;
  if($("dialog").open) $("dialog").close();
  if(form==="add") location.hash="instrument/"+id;
  if(form==="request") location.hash="requests";
  if(form==="log") location.hash="instrument/"+arg;
  render();
  notify(form==="request"?"Черновик сохранён в кабинете.":"Изменения сохранены.");
});
document.addEventListener("input",event=>{
  if(event.target.id==="search"){
    filter=event.target.value;
    pageNumber=0;
    refreshRegister();
  }
});
document.addEventListener("change",event=>{
  const input=event.target;
  if(input.id==="importFile") selectFile(input.files[0]);
  if(input.id==="registerStatus"){registerStatus=input.value;pageNumber=0;refreshRegister();}
  if(input.id==="pageSize"){pageSize=Number(input.value);pageNumber=0;refreshRegister();}
  if(input.dataset.column){
    if(input.checked)hiddenColumns.delete(input.dataset.column);else hiddenColumns.add(input.dataset.column);
    refreshRegister();$("instrumentResults").querySelector("details").open=true;
  }
  if(input.id==="pickPage"||input.dataset.pick){
    const ids=input.dataset.pick?[input.dataset.pick]:filtered().slice(pageNumber*pageSize,(pageNumber+1)*pageSize).map(i=>i.id);
    ids.forEach(id=>input.checked?selected.add(id):selected.delete(id));
    refreshRegister();
  }
  if(input.dataset.map){
    lookup?.abort();
    lookup = null;
    arshin.clear();
    mapping[input.dataset.map]=input.value===""?"":Number(input.value);
    $("review").innerHTML=importReview();
  }
});
document.addEventListener("dragover",event=>{if(event.target.closest("#drop"))event.preventDefault();});
document.addEventListener("drop",event=>{
  if(!event.target.closest("#drop"))return;
  event.preventDefault();
  selectFile(event.dataTransfer.files[0]);
});
window.addEventListener("hashchange",()=>{
  const {page,arg}=route();
  if(page==="instruments"){dueFilter=arg||"all";pageNumber=0;}
  document.querySelector(".account").open=false;
  render();
  window.scrollTo(0,0);
});
if(route().page==="instruments") dueFilter=route().arg||"all";
render();

setupPwa(() => {
  const dates = {};
  for (const instrument of active()) {
    if (instrument.due && !instrument.id.startsWith("demo-")) {
      dates[instrument.due] = (dates[instrument.due] || 0) + 1;
    }
  }
  return {dates,days:state.settings.days};
});
