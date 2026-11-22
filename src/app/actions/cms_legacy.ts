"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

const getCwd = () => process.cwd();
const PRODUCTS_FILE = "./src/data/products.json";
const BRANDS_FILE = "./src/data/brands.json";
const DOCS_FILE = "./src/data/docs.json";
const PAGES_FILE = "./src/data/pages.json";

export async function getProducts() {
  const fileData = await fs.readFile(PRODUCTS_FILE, "utf-8");
  return JSON.parse(fileData);
}

export async function saveProduct(updatedProduct: any) {
  const products = await getProducts();
  const index = products.findIndex((p: any) => p.id === updatedProduct.id);
  
  if (index !== -1) {
    products[index] = updatedProduct;
  } else {
    // New product
    if (!updatedProduct.id) {
      updatedProduct.id = updatedProduct.name.toLowerCase().replace(/[^a-z0-9а-яё]+/g, "-");
    }
    products.push(updatedProduct);
  }

  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  revalidatePath("/"); // Revalidate cache so changes appear immediately
  revalidatePath("/catalog");
  revalidatePath("/catalog/optical");
  revalidatePath("/catalog/analytical");
  revalidatePath("/catalog/rf");

  // Asynchronously notify IndexNow
  let categoryPath = "optical";
  if (updatedProduct.category === "Радиочастотные приборы" || updatedProduct.category === "rf") {
    categoryPath = "rf";
  } else if (updatedProduct.category === "Лабораторные приборы" || updatedProduct.category === "analytical") {
    categoryPath = "analytical";
  }
  notifyIndexNow([
    "https://xn--80aapko5acgl.xn--p1ai/",
    "https://xn--80aapko5acgl.xn--p1ai/catalog",
    `https://xn--80aapko5acgl.xn--p1ai/catalog/${categoryPath}/${updatedProduct.id}`
  ]);
  
  return { success: true };
}

export async function deleteProduct(id: string) {
  const products = await getProducts();
  const filtered = products.filter((p: any) => p.id !== id);
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  revalidatePath("/");
  revalidatePath("/catalog");

  // Asynchronously notify IndexNow
  notifyIndexNow([
    "https://xn--80aapko5acgl.xn--p1ai/",
    "https://xn--80aapko5acgl.xn--p1ai/catalog"
  ]);

  return { success: true };
}

// BRANDS ACTIONS
export async function getBrands() {
  const fileData = await fs.readFile(BRANDS_FILE, "utf-8");
  return JSON.parse(fileData);
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
  revalidatePath("/catalog/rf");
  revalidatePath("/brands");
  return { success: true };
}

export async function deleteBrand(id: string) {
  const brands = await getBrands();
  const filtered = brands.filter((b: any) => b.id !== id);
  await fs.writeFile(BRANDS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  revalidatePath("/");
  revalidatePath("/catalog/rf");
  return { success: true };
}

// DOCS ACTIONS
export async function getDocs() {
  const fileData = await fs.readFile(DOCS_FILE, "utf-8");
  return JSON.parse(fileData);
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
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/docs");
  return { success: true };
}

export async function deleteDoc(id: string) {
  const docs = await getDocs();
  const filtered = docs.filter((d: any) => d.id !== id);
  await fs.writeFile(DOCS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath("/docs");
  return { success: true };
}

// UPLOAD ACTION
export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file selected");
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, file.name);
  await fs.writeFile(filePath, buffer);

  return { 
    url: `/uploads/${file.name}`, 
    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
  };
}

// PAGE TEXT EDITING
export async function getPagesData() {
  const fileData = await fs.readFile(PAGES_FILE, "utf-8");
  return JSON.parse(fileData);
}

export async function savePageData(pageName: string, data: any) {
  const allPages = await getPagesData();
  allPages[pageName] = data;
  await fs.writeFile(PAGES_FILE, JSON.stringify(allPages, null, 2), "utf-8");
  revalidatePath("/");
  revalidatePath("/services");

  // Asynchronously notify IndexNow
  const pageUrl = pageName === "home" ? "" : `/${pageName}`;
  notifyIndexNow([
    `https://xn--80aapko5acgl.xn--p1ai${pageUrl}`,
    "https://xn--80aapko5acgl.xn--p1ai/"
  ]);

  return { success: true };
}

const SUBMISSIONS_FILE = "./src/data/submissions.json";

export async function saveSubmission(data: any) {
  let submissions = [];
  try {
    const fileData = await fs.readFile(SUBMISSIONS_FILE, "utf-8");
    submissions = JSON.parse(fileData);
  } catch (e) {
    // File may not exist yet
  }
  submissions.push({
    id: Math.random().toString(36).substring(2, 9),
    ...data
  });
  
  // Make sure src/data directory exists
  await fs.mkdir(path.dirname(SUBMISSIONS_FILE), { recursive: true });
  await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
  return { success: true };
}

export async function suggestParty(query: string) {
  try {
    const token = process.env.DADATA_API_TOKEN;
    if (!token) return [];
    const res = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Token ${token}`
      },
      body: JSON.stringify({ query, count: 5 })
    });
    if (!res.ok) {
      throw new Error(`DaData API returned status ${res.status}`);
    }
    const data = await res.json();
    return data.suggestions || [];
  } catch (err) {
    console.error("DaData suggestParty error:", err);
    return [];
  }
}

// IndexNow Notification function
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

