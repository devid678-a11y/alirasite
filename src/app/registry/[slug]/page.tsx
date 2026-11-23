import React from "react";
import type { Metadata } from "next";
import { cache } from "react";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { getGrsiDetail } from "@/app/actions/grsi";
import RegistryDetailClient from "./RegistryDetailClient";

const getCachedGrsiDetail = cache(getGrsiDetail);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedGrsiDetail(slug);
  const canonical = `/registry/${encodeURIComponent(slug)}`;

  if (!data.success) {
    return {
      title: `Средство измерений ${slug} — Госреестр СИ`,
      description: "Карточка средства измерений в реестре ФГИС «АРШИН».",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }

  const gosnum = data.specs?.["Номер в госреестре"];
  const manufacturer = data.specs?.["Изготовитель"];
  const mpi = data.specs?.["МПИ (интервал между поверками)"];
  const description = [
    data.title,
    gosnum ? `номер в Госреестре ${gosnum}` : "сведения ФГИС «АРШИН»",
    manufacturer ? `изготовитель: ${manufacturer}` : "",
    mpi ? `межповерочный интервал: ${mpi}` : "",
  ].filter(Boolean).join("; ").slice(0, 160);

  return {
    title: `${data.title}${gosnum ? ` — ГРСИ ${gosnum}` : " — Госреестр СИ"}`,
    description,
    alternates: { canonical },
  };
}


export default async function GrsiDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const res = await getCachedGrsiDetail(slug);

  if (!res.success) {
    notFound();
  }

  return (
    <RegistryDetailClient data={res} slug={slug} />
  );
}
