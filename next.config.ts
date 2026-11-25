/** @type {import('next').NextConfig} */
const legacyCatalogRedirectSources = [
    "/catalog/lls-elementy-upravleniya-izlucheniem/lls-elektroopticheskie-modulyatory/lls-amplitudnye-volokonnye-modulyatory/lls-modulyator-intensivnosti-serii-mx2000-ln-01-dlya-chastoty-1-ggts-i-dliny-volny-2000-nm",
    "/catalog/lls-kontrolno-izmeritelnoe-oborudovanie/lls-spektrometry-i-kamery/lls-modulnie-spektrometry/lls-spektrometry-serii-flame",
    "/catalog/lls-lazery-i-lazernye-sistemy/lls-nepreryvnye-lazery/lls-nepreryvnye-pryamye-diodnye-lazery/lls-pryamoy-diodnyy-lazer-serii-bdl-cw2000-940",
    "/catalog/lls-opticheskie-i-elektricheskie-razemy/lls-vysokonadezhnye-germetichnye-razemy-i-sborki-ip65-67-68/lls-mnogokanalnye-zashchishchennye-razemy-s-mt-ferrulami/lls-mnogokanalnyy-razem-serii-j599mt",
    "/catalog/lls-opticheskie-kristally/lls-lazernye-kristally/lls-tmyag-lazernyj-kristall-ittrij-alyuminievogo-granata-legirovannyj-tuliem",
    "/catalog/lls-optika/lls-opticheskie-filtry/lls-45-gradusnye-dikhroichnye-luchevye-svetodeliteli/lls-di03-r514-t1-25x36-dikhroichnyy-filtr-serii-brightline-s-kraem-na-514-nm",
    "/catalog/lls-optika/lls-opticheskie-filtry/lls-45-gradusnye-dikhroichnye-luchevye-svetodeliteli/lls-ff347-di01-25x36-dikhroichnyy-filtr-serii-brightline-s-kraem-na-347-nm-",
    "/catalog/lls-optika/lls-opticheskie-filtry/lls-45-gradusnye-dikhroichnye-luchevye-svetodeliteli/lls-ff872-di01-25x36x2-0-dikhroichnyy-filtr-serii-brightline-s-kraem-na-872-nm",
    "/catalog/lls-optomekhanika/lls-bazy-krepleniya-i-aksessuary/lls-07srt-5-adapter-rezby-vinta-1-4-20-m4-10-sht-v-upakovke",
    "/catalog/lls-optomekhanika/lls-opravy/lls-opravy-dlya-zerkal/lls-opravy-dlya-zerkal-serii-polaris/lls-opravy-dlya-zerkal-polaris-s-fiksatsiey-optiki/lls-oprava-polaris-dlya-optiki-12-7-mm/lls-hkts-5-64-shestigrannyy-klyuch-5-64",
    "/catalog/lls-optomekhanika/lls-opravy/lls-opravy-dlya-zerkal/lls-opravy-dlya-zerkal-serii-polaris/lls-opravy-dlya-zerkal-polaris-s-fiksatsiey-optiki/lls-oprava-polaris-dlya-optiki-19-mm/lls-polaris-k19s4-derzhatel-zerkal-polaris-19-mm-2-regulirovochnykh-vinta",
    "/catalog/lls-optomekhanika/lls-opravy/lls-opravy-dlya-zerkal/lls-opravy-dlya-zerkal-serii-polaris/lls-opravy-dlya-zerkal-polaris-s-fiksatsiey-optiki/lls-opravy-polaris-dlya-optiki-25-4-mm/lls-polaris-k1s4-derzhatel-zerkal-polaris-1-2-regulirovochnykh-vinta-monolitnaya-perednyaya-panel",
    "/catalog/lls-optomekhanika/lls-optovolokonnaya-mekhanika/lls-p3-trehosevoj-xyz-25x-fleksurnyj-nanopozitsioner",
    "/catalog/lls-optomekhanika/lls-optovolokonnaya-mekhanika/lls-p3r-povorotnaya-fleksurnaya-platforma",
    "/catalog/lls-optomekhanika/lls-sistemy-upravleniya-izlucheniem/lls-attenyuatory/lls-motorizirovannye-attenyuatory-lazernogo-izlucheniya-lpa",
    "/catalog/lls-passivnye-volokonnye-komponenty/lls-obediniteli-nakachki-i-signala/lls-obediniteli-6-1-h1/lls-obedinitel-nakachki-61x1-volokna-nakachka-105-125-mkm-vvod-8-125-mkm-vyvod-8-125-mkm",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-instrumenty-i-raskhodnye-materialy/lls-testery-celostnosti-detektory-povrezhdenij-lazernye-ukazki/lls-etalonnye-opticheskie-patch-kordy",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-interferometry-dlya-3d-analiza-geometrii-opticheskikh-konnektorov/lls-interferometry/lls-interferometr-dlya-odno-i-mnogovolokonnykh-razemov-max-quantum",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-interferometry-dlya-3d-analiza-geometrii-opticheskikh-konnektorov/lls-opravy-dlya-interferometrov/lls-oprava-dlya-konnektorov-e2000-s-polirovkoy-apc",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-cfp-cfp2-cfp4-transivery/lls-opticheskij-transiver-cfp-100-m-40gbase-sr4",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-cfp-cfp2-cfp4-transivery/lls-opticheskij-transiver-cfp-40gbase-fr-i-oc-768-vsr-nrz-mnogoskorostnoj",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-cfp-cfp2-cfp4-transivery/lls-opticheskij-transiver-cfp2-10-km-100gbase-lr4-i-dvuhskorostnoj-otu4",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-cfp-cfp2-cfp4-transivery/lls-opticheskij-transiver-cfp2-300-m-10x10gbase-sr-i-100gbase-sr10-s-uvelichennoj-dalnostyu",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-cfp-cfp2-cfp4-transivery/lls-opticheskij-transiver-sfp-1310-nm-15-km-besprovodnoj-3g-cpri",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-sff-2-h-volokonnye-bidi/lls-opticheskij-transiver-sff-2x5-oc-3-sr-1-stm-i-1-or-oc-3-ir-1-stm-s-11",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-sfp-sfp-2-h-volokonnye-bidi/lls-opticheskij-transiver-850-nm-8-5g-4-25g-2-125g-1-0625g-300-m",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-sfp-sfp-2-h-volokonnye-bidi/lls-opticheskij-transiver-sfp-1310-nm-10gbase-lrm-220-m",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-sfp-sfp-2-h-volokonnye-bidi/lls-opticheskij-transiver-sfp-3-go-pokoleniya-1310-nm-1000base-lx-i-1g-fibre-channel-1gfc-10-km",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-sfp-sfp-2-h-volokonnye-bidi/lls-opticheskij-transiver-sfp-850-nm-16gfc-35-100-m",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-sfp-sfp-wdm/lls-opticheskij-transiver-sfp-4-25g-cwdm-40-km",
    "/catalog/lls-volokonno-opticheskie-linii-svyazi-VOLS-i-Radiofotonika/lls-volokonno-opticheskie-transivery/lls-sfp28-qsfp28-qsfp/lls-opticheskij-transiver-qsfp-uproshchennyj-2-km-40gbase-lr4",
];

const nextConfig = {
  async redirects() {
    return legacyCatalogRedirectSources.map((source) => ({
      source,
      destination: source.replace(/(^|\/)lls-/gi, "$1"),
      permanent: true,
    }));
  },
  // Keep each production build in a fresh directory. The PM2 process runs as root,
  // while deployment builds run as alira-deploy; isolating outputs avoids ownership conflicts.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  // User uploads are persistent runtime data, not deployment artifacts. Excluding them
  // prevents Next.js from copying gigabytes of images into every standalone build;
  // scripts/prepare-standalone.mjs links the live uploads directory at runtime.
  outputFileTracingExcludes: {
    "/*": ["./public/uploads/**/*"],
    "next-server": ["./public/uploads/**/*"],
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
