import Link from "next/link";

type Props = { locale: string };

const labels = {
  en: { about: "About", marketplace: "Marketplace", legal: "Legal Information", tagline: "Equestrian discovery, services and digital tools." },
  de: { about: "Über uns", marketplace: "Marktplatz", legal: "Rechtliche Informationen", tagline: "Pferde, Reitsportservices und digitale Werkzeuge." },
  fr: { about: "À propos", marketplace: "Marché", legal: "Informations légales", tagline: "Chevaux, services équestres et outils numériques." },
  es: { about: "Sobre nosotros", marketplace: "Mercado", legal: "Información legal", tagline: "Caballos, servicios ecuestres y herramientas digitales." },
  nl: { about: "Over ons", marketplace: "Marktplaats", legal: "Juridische informatie", tagline: "Paarden, paardensportdiensten en digitale hulpmiddelen." },
} as const;

export default function SiteFooter({ locale }: Props) {
  const l = labels[locale as keyof typeof labels] ?? labels.en;
  const prefix = `/${locale}`;

  return (
    <footer className="border-t border-white/10 bg-[#07101f] text-gray-400">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href={prefix} className="text-lg font-black tracking-tight text-white">SHABDIZ</Link>
          <p className="mt-1 text-sm">{l.tagline}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link href={`${prefix}/about`} className="transition hover:text-white">{l.about}</Link>
          <Link href={`${prefix}/marketplace`} className="transition hover:text-white">{l.marketplace}</Link>
          <Link href={`${prefix}/legal`} className="font-medium text-gray-300 transition hover:text-white">{l.legal}</Link>
        </nav>
      </div>
    </footer>
  );
}
