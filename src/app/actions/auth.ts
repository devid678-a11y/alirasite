"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "alira_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function sessionSignature() {
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update("alira-admin-session").digest("hex");
}

export async function loginAdmin(formData: FormData) {
  const username = formData.get("username");
  const password = formData.get("password");
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const signature = sessionSignature();

  if (!expectedUsername || !expectedPassword || !signature) {
    redirect("/admin/login?error=config");
  }

  const valid = typeof username === "string"
    && typeof password === "string"
    && safeEqual(username, expectedUsername)
    && safeEqual(password, expectedPassword);

  if (!valid) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signature, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL_SECONDS,
    path: "/admin",
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/admin",
  });
  redirect("/admin/login");
}

export async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  const expected = sessionSignature();
  if (!cookie || !expected) return false;
  return safeEqual(cookie.value, expected);
}
