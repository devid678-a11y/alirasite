import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { constants, createCipheriv, publicEncrypt, randomBytes, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const tokenPath = path.join(process.cwd(), ".mail-test-token");
  let expectedToken = "";
  try {
    const stat = await fs.stat(tokenPath);
    if (Date.now() - stat.mtimeMs > 5 * 60 * 1000) return new NextResponse(null, { status: 404 });
    expectedToken = (await fs.readFile(tokenPath, "utf8")).trim();
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const authorization = request.headers.get("authorization") || "";
  const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expected = Buffer.from(expectedToken);
  const supplied = Buffer.from(suppliedToken);
  if (!expected.length || expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return new NextResponse(null, { status: 404 });
  }

  let publicKey = "";
  try {
    const body = await request.json();
    publicKey = body?.publicKey;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof publicKey !== "string" || publicKey.length > 8192) {
    return NextResponse.json({ error: "Invalid recovery key" }, { status: 400 });
  }

  const missingConfig = ["SMTP_USER", "SMTP_PASS", "SMTP_FROM"].filter(key => !process.env[key]);
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const transporter = missingConfig.length ? null : nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.yandex.ru",
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    const submissionsPath = path.join(process.cwd(), "src", "data", "submissions.json");
    let submissions: any[] = [];
    try {
      submissions = JSON.parse(await fs.readFile(submissionsPath, "utf8"));
    } catch (error: any) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (!Array.isArray(submissions)) throw new Error("Saved submissions file is not an array");

    const dateOf = (submission: any) => {
      const raw = submission.submittedAt || submission.date || submission.createdAt || submission.timestamp;
      const time = Date.parse(raw || "");
      return Number.isFinite(time) ? new Date(time).toISOString() : null;
    };
    const counts: Record<string, number> = {};
    for (const submission of submissions) {
      const type = String(submission.type || "unknown");
      counts[type] = (counts[type] || 0) + 1;
    }
    const dates = submissions.map(dateOf).filter(Boolean).sort();

    let testMailSent = false;
    let archiveMailSent = false;
    let smtpErrorCode: string | null = null;
    if (transporter) {
      try {
        await transporter.verify();
        const testInfo = await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: "info@aliracert.ru",
          subject: "[ТЕСТ ФОРМ АЛИРА] Проверка доставки",
          text: "Тест отправки уведомлений сайта. Форма сайта не заполнялась; обращение в список заявок не добавлено.",
        });
        testMailSent = testInfo.accepted.length > 0;
        if (testMailSent && submissions.length) {
          const archiveText = JSON.stringify({
            note: "Все записи из серверного submissions.json. Сайт не сохранял статус доставки писем, поэтому архив не позволяет определить, какие письма уже были получены.",
            submissions,
          }, null, 2);
          const compressed = zlib.gzipSync(Buffer.from(archiveText, "utf8"), { level: 9 });
          const archiveInfo = await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: "info@aliracert.ru",
            subject: "[АРХИВ ЗАЯВОК АЛИРА] " + submissions.length + " сохранённых записей",
            text: "Во вложении все заявки, сохранённые сайтом. Статусы доставки старых писем не сохранялись; сверьте архив с уже полученными письмами. Файл сжат в gzip.",
            attachments: [{
              filename: "alira-saved-submissions.json.gz",
              content: compressed,
              contentType: "application/gzip",
            }],
          });
          archiveMailSent = archiveInfo.accepted.length > 0;
        }
      } catch (error: any) {
        smtpErrorCode = String(error?.code || "delivery_failed");
        console.error("One-time mail diagnostic failed:", smtpErrorCode);
      }
    }

    const archiveText = JSON.stringify({
      note: "Все записи из серверного submissions.json. Сайт не сохранял статус доставки писем, поэтому архив не позволяет определить, какие письма уже были получены.",
      submissions,
    }, null, 2);
    const compressed = zlib.gzipSync(Buffer.from(archiveText, "utf8"), { level: 9 });
    const aesKey = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
    const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
    const encryptedKey = publicEncrypt({
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    }, aesKey);

    return NextResponse.json({
      testMailSent,
      archiveMailSent,
      missingConfig,
      smtpErrorCode,
      submissions: {
        count: submissions.length,
        earliest: dates[0] || null,
        latest: dates[dates.length - 1] || null,
        types: counts,
      },
      encryptedArchive: {
        key: encryptedKey.toString("base64"),
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64"),
        data: encrypted.toString("base64"),
      },
    });
  } catch (error: any) {
    console.error("One-time submissions recovery failed:", error?.message || "unknown error");
    return NextResponse.json({ error: "Submissions recovery failed" }, { status: 500 });
  } finally {
    transporter?.close();
  }
}
