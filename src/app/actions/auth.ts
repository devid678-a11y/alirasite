"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "alira_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

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

async function clientKey() {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || "unknown";
}

function isRateLimited(key: string) {
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= Date.now()) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
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

  const key = await clientKey();
  if (isRateLimited(key)) {
    redirect("/admin/login?error=locked");
  }

  const valid = typeof username === "string"
    && typeof password === "string"
    && safeEqual(username, expectedUsername)
    && safeEqual(password, expectedPassword);

  if (!valid) {
    recordFailedAttempt(key);
    redirect("/admin/login?error=1");
  }

  loginAttempts.delete(key);
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
