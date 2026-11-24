import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const tokenPath = path.join(process.cwd(), ".mail-test-token");
  let expectedToken = "";
  try {
    const stat = await fs.stat(tokenPath);
    if (Date.now() - stat.mtimeMs > 5 * 60 * 1000) {
      return new NextResponse(null, { status: 404 });
    }
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

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;
  if (!smtpUser || !smtpPass || !smtpFrom) {
    return NextResponse.json({ error: "SMTP is not configured" }, { status: 503 });
  }

  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.yandex.ru",
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.verify();
    const testInfo = await transporter.sendMail({
      from: smtpFrom,
      to: "info@aliracert.ru",
      subject: "[���� ���� �����] �஢�ઠ ���⠢��",
      text: "���� ��ࠢ�� 㢥�������� ᠩ�. ��ଠ ᠩ� �� ������﫠��; ���饭�� � ᯨ᮪ ��� �� ���������.",
    });

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
    const types: Record<string, number> = {};
    for (const submission of submissions) {
      const type = String(submission.type || "unknown");
      types[type] = (types[type] || 0) + 1;
    }
    const dates = submissions.map(dateOf).filter(Boolean).sort();
    let archiveSent = false;

    if (submissions.length) {
      const archive = {
        note: "�� ����� �� �ࢥ୮�� submissions.json. ���� �� ��࠭� ����� ���⠢�� ��ᥬ, ���⮬� ��娢 �� �������� ��।�����, ����� ���쬠 㦥 �뫨 ����祭�.",
        submissions,
      };
      const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(archive, null, 2), "utf8"), { level: 9 });
      await transporter.sendMail({
        from: smtpFrom,
        to: "info@aliracert.ru",
        subject: `[����� ������ �����] ${submissions.length} ��࠭��� ����ᥩ`,
        text: "�� �������� �� ���, ��࠭�� ᠩ⮬. ������ ��ࠢ�� ����� ��ᥬ �� ��࠭﫨��, ���⮬� ᢥ��� ��娢 � 㦥 ����祭�묨 ���쬠��. ���� ᦠ� � gzip.",
        attachments: [{
          filename: "alira-saved-submissions.json.gz",
          content: compressed,
          contentType: "application/gzip",
        }],
      });
      archiveSent = true;
    }

    return NextResponse.json({
      testAccepted: testInfo.accepted.length > 0,
      archiveSent,
      submissions: {
        count: submissions.length,
        earliest: dates[0] || null,
        latest: dates[dates.length - 1] || null,
        types,
      },
      smtpResponse: testInfo.response,
    });
  } catch (error: any) {
    console.error("One-time mail recovery failed:", error?.message || "unknown error");
    return NextResponse.json({ error: "Mail test or submissions archive failed" }, { status: 502 });
  } finally {
    transporter.close();
  }
}

