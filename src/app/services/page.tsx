import React from "react";
import ServicesClient from "./ServicesClient";
import { getPagesData, getDocs } from "@/app/actions/cms";

export default async function ServicesPage() {
  const pagesData = await getPagesData();
  const servicesData = pagesData.services;
  const allDocs = await getDocs();
  const labDocs = allDocs.filter((d: any) => d.category === "lab");

  return <ServicesClient servicesData={servicesData} labDocs={labDocs} />;
}
