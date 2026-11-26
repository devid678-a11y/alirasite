"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const PRODUCTS_FILE = "./src/data/products.json";
const BRANDS_FILE = "./src/data/brands.json";
const DOCS_FILE = "./src/data/docs.json";
const PAGES_FILE = "./src/data/pages.json";
const SUBMISSIONS_FILE = "./src/data/submissions.json";

const DATA_CACHE_TTL_MS = 60_000;
type DataCacheEntry<T> = { expiresAt: number; promise: Promise<T> };
let productsCache: DataCacheEntry<any[]> | undefined;
let docsCache: DataCacheEntry<any[]> | undefined;

async function fetchFromStrapi(endpoint: string) {
    try {
        const res = await fetch(`${STRAPI_URL}/api/${endpoint}?pagination[limit]=10000`, { next: { revalidate: 60 } });
        if (!res.ok) throw new Error(`Strapi error: ${res.status}`);
        const json = await res.json();
        return json.data.map((item: any) => ({
            id: item.uid,
            ...item
        }));
    } catch (err) {
        return [];
    }
}

export async function getProducts() {
    if (productsCache && productsCache.expiresAt > Date.now()) {
        return productsCache.promise;
    }

    const promise = (async () => {
        const fromStrapi = await fetchFromStrapi('products');
        if (fromStrapi && fromStrapi.length > 0) {
            return fromStrapi;
        }
        try {
            const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "products.json"), "utf-8");
            return JSON.parse(fileData);
        } catch (err) {
            return [];
        }
    })();

    productsCache = { expiresAt: Date.now() + DATA_CACHE_TTL_MS, promise };
    return promise;
}

export async function saveProduct(updatedProduct: any) {
  const products = await getProducts();
  const index = products.findIndex((p: any) => p.id === updatedProduct.id);
  
  if (index !== -1) {
    products[index] = updatedProduct;
  } else {
    if (!updatedProduct.id) {
      updatedProduct.id = updatedProduct.name.toLowerCase().replace(/[^a-z0-9а-яё]+/g, "-");
    }
    products.push(updatedProduct);
  }

  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  productsCache = { expiresAt: Date.now() + DATA_CACHE_TTL_MS, promise: Promise.resolve(products) };
  revalidatePath("/");
  revalidatePath("/catalog");
  
  notifyIndexNow([
    "https://xn--80aapko5acgl.xn--p1ai/",
    "https://xn--80aapko5acgl.xn--p1ai/catalog"
  ]);
  
  return { success: true };
}

export async function deleteProduct(id: string) {
  const products = await getProducts();
  const filtered = products.filter((p: any) => p.id !== id);
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  productsCache = { expiresAt: Date.now() + DATA_CACHE_TTL_MS, promise: Promise.resolve(filtered) };
  revalidatePath("/");
  revalidatePath("/catalog");

  notifyIndexNow([
    "https://xn--80aapko5acgl.xn--p1ai/",
    "https://xn--80aapko5acgl.xn--p1ai/catalog"
  ]);

  return { success: true };
}

export async function getBrands() {
    try {
        const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "brands.json"), "utf-8");
        return JSON.parse(fileData);
    } catch (err) {
        return [];
    }
}

export async function saveBrand(updatedBrand: any) {
  const brands = await getBrands();
  const index = brands.findIndex((b: any) => b.id === updatedBrand.id);

  if (index !== -1) {
    brands[index] = updatedBrand;
  } else {
    if (!updatedBrand.id) {
      updatedBrand.id = updatedBrand.name.toLowerCase().replace(/[^a-z0-9а-яё]+/g, "-");
    }
    brands.push(updatedBrand);
  }

  await fs.writeFile(BRANDS_FILE, JSON.stringify(brands, null, 2), "utf-8");
  revalidatePath("/");
  revalidatePath("/brands");
  return { success: true };
}

export async function deleteBrand(id: string) {
  const brands = await getBrands();
  const filtered = brands.filter((b: any) => b.id !== id);
  await fs.writeFile(BRANDS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  revalidatePath("/");
  revalidatePath("/brands");
  return { success: true };
}

export async function getDocs() {
    if (docsCache && docsCache.expiresAt > Date.now()) {
        return docsCache.promise;
    }

    const promise = (async () => {
        const fromStrapi = await fetchFromStrapi('docs');
        if (fromStrapi && fromStrapi.length > 0) {
            return fromStrapi;
        }
        try {
            const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "docs.json"), "utf-8");
            return JSON.parse(fileData);
        } catch (err) {
            return [];
        }
    })();

    docsCache = { expiresAt: Date.now() + DATA_CACHE_TTL_MS, promise };
    return promise;
}

export async function saveDoc(updatedDoc: any) {
  const docs = await getDocs();
  const index = docs.findIndex((d: any) => d.id === updatedDoc.id);

  if (index !== -1) {
    docs[index] = updatedDoc;
  } else {
    if (!updatedDoc.id) {
      updatedDoc.id = updatedDoc.title.toLowerCase().replace(/[^a-z0-9а-яё]+/g, "-");
    }
    docs.push(updatedDoc);
  }

  await fs.writeFile(DOCS_FILE, JSON.stringify(docs, null, 2), "utf-8");
  docsCache = { expiresAt: Date.now() + DATA_CACHE_TTL_MS, promise: Promise.resolve(docs) };
  revalidatePath("/");
  revalidatePath("/services");
  return { success: true };
}

export async function deleteDoc(id: string) {
  const docs = await getDocs();
  const filtered = docs.filter((d: any) => d.id !== id);
  await fs.writeFile(DOCS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  docsCache = { expiresAt: Date.now() + DATA_CACHE_TTL_MS, promise: Promise.resolve(filtered) };
  revalidatePath("/");
  revalidatePath("/services");
  return { success: true };
}

export async function getPagesData() {
    try {
        const res = await fetch(`${STRAPI_URL}/api/pages?pagination[limit]=100`, { next: { revalidate: 60 } });
        if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.length > 0) {
                const pages: any = {};
                json.data.forEach((item: any) => {
                    pages[item.name] = item.data;
                });
                return pages;
            }
        }
    } catch (err) { }
    try {
        const fileData = await fs.readFile(path.join(process.cwd(), "src", "data", "pages.json"), "utf-8");
        return JSON.parse(fileData);
    } catch (err) {
        return {};
    }
}

export async function savePageData(pageName: string, data: any) {
  const allPages = await getPagesData();
  allPages[pageName] = data;
  await fs.writeFile(PAGES_FILE, JSON.stringify(allPages, null, 2), "utf-8");
  revalidatePath("/");
  revalidatePath("/services");

  const pageUrl = pageName === "home" ? "" : `/${pageName}`;
  notifyIndexNow([
    `https://xn--80aapko5acgl.xn--p1ai${pageUrl}`,
    "https://xn--80aapko5acgl.xn--p1ai/"
  ]);

  return { success: true };
}

import nodemailer from "nodemailer";

async function sendEmailNotification(data: any) {
  const recipient = "info@aliracert.ru";
  
  const flatData: any = {
    ...data,
    ...(data.contact || {}),
    ...(data.formData || {})
  };

  let subject = `[Заявка с сайта Алира] ${flatData.name || flatData.orgName || flatData.applicant || "Новое обращение"}`;
  const isVerification = flatData.type === "verification" || flatData.serviceSubtype === "verification";
  const isCalibration = flatData.type === "calibration" || flatData.serviceSubtype === "calibration";

  if (flatData.type === "callback") {
    subject = `[Заказан звонок] ${flatData.name || flatData.phone}`;
  } else if (flatData.type === "kp") {
    subject = `[Запрос КП: ${flatData.productName || "Оборудование"}] ${flatData.name || ""}`;
  } else if (flatData.type === "inquiry") {
    subject = `[Заявка на прибор: ${flatData.productName || "Оборудование"}] ${flatData.name || ""}`;
  } else if (isVerification) {
    subject = `[Заявка на Поверку СИ] ${flatData.orgName || flatData.name || flatData.phone || ""}`;
  } else if (isCalibration) {
    subject = `[Заявка на Калибровку СИ] ${flatData.orgName || flatData.name || flatData.phone || ""}`;
  } else if (flatData.type === "testing") {
    subject = `[Заявка на Испытания СИ (ГРСИ)] ${flatData.applicant || flatData.siName || ""}`;
  } else if (flatData.type === "equipment_repair") {
    subject = `[Заявка на Ремонт СИ] ${flatData.deviceModel ? flatData.deviceModel + " — " : ""}${flatData.name || ""}`;
  }

  const dateStr = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">Новая заявка с сайта ООО «Алира»</h2>
      <p style="color: #64748b; font-size: 13px;">Время получения: ${dateStr}</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
  `;

  const addRow = (label: string, value: any) => {
    if (!value) return;
    const formattedVal = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value).replace(/\n/g, "<br/>");
    htmlContent += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 35%; color: #334155;">${label}:</td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${formattedVal}</td>
      </tr>
    `;
  };

  let typeLabel = flatData.serviceName || (flatData.type || "Заявка");
  if (isVerification) typeLabel = "Поверка средств измерений";
  else if (isCalibration) typeLabel = "Калибровка средств измерений";
  else if (flatData.type === "callback") typeLabel = "Заказ звонка";
  else if (flatData.type === "kp") typeLabel = "Запрос коммерческого предложения";
  else if (flatData.type === "inquiry") typeLabel = "Заявка на прибор";
  else if (flatData.type === "testing") typeLabel = "Испытания СИ (ГРСИ)";
  else if (flatData.type === "equipment_repair") typeLabel = "Ремонт средств измерений";

  addRow("Услуга / Тип заявки", typeLabel);
  if (flatData.productName) addRow("Прибор / Продукция", flatData.productName);
  if (flatData.name) addRow("Имя / Организация", flatData.name);
  if (flatData.orgName) addRow("Организация", flatData.orgName);
  if (flatData.applicant) addRow("Заявитель", flatData.applicant);
  if (flatData.phone) addRow("Телефон", flatData.phone);
  if (flatData.email) addRow("Email", flatData.email);
  if (flatData.deviceModel) addRow("Модель прибора (Ремонт)", flatData.deviceModel);
  if (flatData.serialNumber) addRow("Заводской номер (Ремонт)", flatData.serialNumber);
  if (flatData.defectDescription) addRow("Описание неисправности", flatData.defectDescription);
  if (flatData.needVerification) addRow("Поверка после ремонта", flatData.needVerification);
  if (flatData.message) addRow("Сообщение / Комментарий", flatData.message);
  
  if (flatData.siName) addRow("Наименование СИ (Испытания)", flatData.siName);
  if (flatData.modifications) addRow("Модификации СИ", flatData.modifications);
  if (flatData.credentials) addRow("Документ полномочий", flatData.credentials);
  if (flatData.manufacturer) addRow("Изготовитель", flatData.manufacturer);
  if (flatData.purpose) addRow("Назначение СИ", flatData.purpose);
  if (flatData.scope) addRow("Область применения (102-ФЗ)", flatData.scope);
  if (flatData.prodType) addRow("Характер производства", flatData.prodType);
  if (flatData.serialNumbers) addRow("Заводские номера", flatData.serialNumbers);
  if (flatData.software) addRow("Программное обеспечение", flatData.software);
  if (flatData.characteristics) addRow("Метрологические характеристики", flatData.characteristics);
  if (flatData.documents) addRow("Документы на изготовление", flatData.documents);
  if (flatData.protocols) addRow("Протоколы испытаний", flatData.protocols);
  if (flatData.startActivity) addRow("Начало деятельности", flatData.startActivity);
  if (flatData.minpromtorg) addRow("Заключение Минпромторга", flatData.minpromtorg);
  if (flatData.paymentDetails) addRow("Платежные реквизиты", flatData.paymentDetails);

  if (flatData.attachedFile && flatData.attachedFile.url) {
    const fileUrl = `https://xn--80aapko5acgl.xn--p1ai${flatData.attachedFile.url}`;
    addRow("Прикрепленный файл", `<a href="${fileUrl}" target="_blank" style="color: #2563eb; font-weight: bold;">${flatData.attachedFile.name || "Скачать файл"} (${flatData.attachedFile.size || ""})</a>`);
  }

  if (Array.isArray(flatData.devices) && flatData.devices.length > 0) {
    const listLabel = isCalibration ? "Позиции приборов (Калибровка)" : "Позиции приборов (Поверка)";
    addRow(listLabel, flatData.devices.map((d: any, i: number) => {
      const details = [
        d.type ? `Тип: ${d.type}` : "",
        d.serial ? `Зав.№: ${d.serial}` : "",
        `Кол-во: ${d.quantity || 1}`,
        d.photoUrl ? `Фото: ${d.photoUrl}` : "",
      ].filter(Boolean).join(", ");
      return `${i + 1}. ${d.name || "Прибор"} (${details})`;
    }).join("<br/>"));
  }

  htmlContent += `
      </table>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #94a3b8;">
        Сообщение отправлено автоматически с сайта алирасерт.рф
      </div>
    </div>
  `;

  let plainTextContent = `Новая заявка с сайта ООО «Алира» (${dateStr})\n`;
  plainTextContent += `----------------------------------------\n`;
  plainTextContent += `Услуга: ${typeLabel}\n`;
  if (flatData.productName) plainTextContent += `Прибор / Продукция: ${flatData.productName}\n`;
  if (flatData.name) plainTextContent += `Имя / Организация: ${flatData.name}\n`;
  if (flatData.orgName) plainTextContent += `Организация: ${flatData.orgName}\n`;
  if (flatData.applicant) plainTextContent += `Заявитель: ${flatData.applicant}\n`;
  if (flatData.phone) plainTextContent += `Телефон: ${flatData.phone}\n`;
  if (flatData.email) plainTextContent += `Email: ${flatData.email}\n`;
  if (flatData.deviceModel) plainTextContent += `Модель прибора (Ремонт): ${flatData.deviceModel}\n`;
  if (flatData.serialNumber) plainTextContent += `Заводской номер: ${flatData.serialNumber}\n`;
  if (flatData.defectDescription) plainTextContent += `Описание неисправности: ${flatData.defectDescription}\n`;
  if (flatData.needVerification) plainTextContent += `Поверка после ремонта: ${flatData.needVerification}\n`;
  if (flatData.message) plainTextContent += `Сообщение / Комментарий: ${flatData.message}\n`;
  if (flatData.attachedFile && flatData.attachedFile.url) {
    plainTextContent += `Прикрепленный файл: https://xn--80aapko5acgl.xn--p1ai${flatData.attachedFile.url} (${flatData.attachedFile.name || "Файл"})\n`;
  }
  plainTextContent += `----------------------------------------\n`;

  try {
    const smtpHost = process.env.SMTP_HOST || "smtp.yandex.ru";
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;

    if (!smtpUser || !smtpPass || !smtpFrom) {
      console.error("Email notifications are not configured: set SMTP_USER, SMTP_PASS, and SMTP_FROM.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: smtpFrom,
      to: recipient,
      subject: subject,
      text: plainTextContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email notification sent to ${recipient}: ${info.response}`);
  } catch (err) {
    console.error("Error sending email notification:", err);
  }
}

async function sendTelegramNotification(data: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const flatData: any = {
    ...data,
    ...(data.contact || {}),
    ...(data.formData || {})
  };

  const dateStr = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
  
  const isVerification = flatData.type === "verification" || flatData.serviceSubtype === "verification";
  const isCalibration = flatData.type === "calibration" || flatData.serviceSubtype === "calibration";

  let emoji = "📩";
  let serviceName = flatData.serviceName || "Заявка";
  if (isVerification) { emoji = "🔬"; serviceName = "Поверка средств измерений"; }
  else if (isCalibration) { emoji = "⚙️"; serviceName = "Калибровка средств измерений"; }
  else if (flatData.type === "callback") { emoji = "📞"; serviceName = "Заказ звонка"; }
  else if (flatData.type === "kp") { emoji = "📄"; serviceName = "Запрос КП"; }
  else if (flatData.type === "inquiry") { emoji = "🔬"; serviceName = "Заявка на прибор"; }
  else if (flatData.type === "testing") { emoji = "📜"; serviceName = "Испытания СИ (ГРСИ)"; }
  else if (flatData.type === "equipment_repair") { emoji = "🔧"; serviceName = "Ремонт СИ"; }

  let text = `${emoji} <b>НОВАЯ ЗАЯВКА С САЙТА АЛИРА</b>\n\n`;
  text += `<b>Дата:</b> ${dateStr}\n`;
  text += `<b>Услуга:</b> ${serviceName}\n`;

  if (flatData.productName) text += `<b>Прибор:</b> ${flatData.productName}\n`;
  if (flatData.name) text += `<b>Заявитель / ФИО:</b> ${flatData.name}\n`;
  if (flatData.orgName) text += `<b>Организация:</b> ${flatData.orgName}\n`;
  if (flatData.applicant) text += `<b>Заявитель:</b> ${flatData.applicant}\n`;
  if (flatData.phone) text += `<b>Телефон:</b> <code>${flatData.phone}</code>\n`;
  if (flatData.email) text += `<b>Email:</b> ${flatData.email}\n`;
  if (flatData.message) text += `<b>Комментарий:</b> ${flatData.message}\n`;

  if (flatData.siName) text += `<b>Наименование СИ:</b> ${flatData.siName}\n`;
  if (flatData.manufacturer) text += `<b>Изготовитель:</b> ${flatData.manufacturer}\n`;

  if (flatData.attachedFile && flatData.attachedFile.url) {
    const fileUrl = `https://xn--80aapko5acgl.xn--p1ai${flatData.attachedFile.url}`;
    text += `<b>Прикрепленный файл:</b> <a href="${fileUrl}">${flatData.attachedFile.name || "Файл"}</a> (${flatData.attachedFile.size || ""})\n`;
  }

  if (Array.isArray(flatData.devices) && flatData.devices.length > 0) {
    text += `\n<b>Позиции приборов (Поверка):</b>\n`;
    flatData.devices.forEach((d: any, idx: number) => {
      const details = [
        d.type ? `Тип: ${d.type}` : "",
        d.serial ? `Зав.№: ${d.serial}` : "",
        `Кол-во: ${d.quantity || 1}`,
      ].filter(Boolean).join(", ");
      text += `${idx + 1}. ${d.name || "Прибор"} (${details})\n`;
    });
  }

  if (data.siName) text += `<b>Наименование СИ:</b> ${data.siName}\n`;
  if (data.manufacturer) text += `<b>Изготовитель:</b> ${data.manufacturer}\n`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: false
      })
    });
    if (!res.ok) {
      console.error("Telegram API error:", await res.text());
    } else {
      console.log("Telegram notification sent successfully");
    }
  } catch (err) {
    console.error("Telegram send error (or timeout):", err);
  }
}

export async function saveSubmission(data: any) {
  try {
    let submissions = [];
    const submissionsPath = path.join(process.cwd(), "src", "data", "submissions.json");
    try {
      const fileData = await fs.readFile(submissionsPath, "utf-8");
      submissions = JSON.parse(fileData);
    } catch (e) { }
    const newSubmission = { id: Math.random().toString(36).substring(2, 9), ...data };
    submissions.push(newSubmission);
    await fs.mkdir(path.dirname(submissionsPath), { recursive: true });
    await fs.writeFile(submissionsPath, JSON.stringify(submissions, null, 2), "utf-8");

    // Send email and Telegram notifications asynchronously without blocking the user request
    sendEmailNotification(newSubmission).catch(err => console.error("Email dispatch error:", err));
    sendTelegramNotification(newSubmission).catch(err => console.error("Telegram dispatch error:", err));

    return { success: true };
  } catch (err: any) {
    console.error("saveSubmission error:", err);
    return { success: false, error: err.message || "Failed to save submission" };
  }
}

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file selected");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    
    const sanitizedName = Date.now() + "_" + (file.name || "uploaded_file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(uploadDir, sanitizedName);
    await fs.writeFile(filePath, buffer);
    return { url: `/uploads/${sanitizedName}`, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` };
  } catch (err: any) {
    console.error("uploadFile error:", err);
    throw new Error(err.message || "File upload failed");
  }
}

export async function suggestParty(query: string) {
  try {
    const token = process.env.DADATA_API_TOKEN;
    if (!token) {
      console.error("DaData suggestions are not configured: set DADATA_API_TOKEN.");
      return [];
    }
    const res = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Token ${token}` },
      body: JSON.stringify({ query, count: 5 })
    });
    if (!res.ok) throw new Error(`DaData API returned status ${res.status}`);
    const data = await res.json();
    return data.suggestions || [];
  } catch (err) {
    console.error("DaData suggestParty error:", err);
    return [];
  }
}

export async function notifyIndexNow(urls: string[]) {
  const host = "xn--80aapko5acgl.xn--p1ai";
  const key = "8d22dfb7f94d4d1685e13cbfe4b26715";
  const keyLocation = `https://${host}/${key}.txt`;

  const payload = {
    host,
    key,
    keyLocation,
    urlList: urls
  };

  const endpoints = [
    "https://yandex.com/indexnow",
    "https://www.bing.com/indexnow"
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      console.log(`IndexNow status for ${endpoint}: ${res.status}`);
    } catch (err) {
      console.error(`IndexNow fetch error for ${endpoint}:`, err);
    }
  }
}
