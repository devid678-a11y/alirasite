import React from "react";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { getGrsiDetail } from "@/app/actions/grsi";
import RegistryDetailClient from "./RegistryDetailClient";

export default async function GrsiDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const res = await getGrsiDetail(slug);

  if (!res.success) {
    notFound();
  }

  return (
    <RegistryDetailClient data={res} slug={slug} />
  );
}
