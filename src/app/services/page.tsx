import React from "react";
import ServicesClient from "./ServicesClient";
import { getPagesData, getDocs } from "@/app/actions/cms";

export const metadata = {
  "title": "Метрологические услуги для предприятий",
  "description": "Поверка, калибровка, испытания средств измерений, внесение в Госреестр и метрологическое сопровождение. Обсудим задачу и сроки работ.",
  "alternates": {
    "canonical": "/services"
  }
};

export default async function ServicesPage() {
  const pagesData = await getPagesData();
  const servicesData = pagesData.services;
  const allDocs = await getDocs();
  const labDocs = allDocs.filter((d: any) => d.category === "lab");

  return <ServicesClient servicesData={servicesData} labDocs={labDocs} />;
}
