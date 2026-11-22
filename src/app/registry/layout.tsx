import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Реестр средств измерений. Госреестр СИ — ООО «Алира»",
  description: "Реестр средств измерений. Госреестр СИ (ФГИС «АРШИН»). Поиск приборов, скачивание описаний типов и методик поверки.",
};

export default function RegistryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
