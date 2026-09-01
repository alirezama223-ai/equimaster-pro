"use client";

import { useEffect, useMemo, useState } from "react";
import type { EquestrianServiceProvider } from "@/app/actions/equestrianServices";
import { createClient } from "@/app/lib/supabase/client";

type Props = { locale: string; providers: EquestrianServiceProvider[] };

const categories = ["riding_school", "trainer", "horse_training", "livery", "veterinary", "farrier", "physiotherapy", "transport", "shop", "competition_coaching", "other"];
const labels: Record<string, Record<string, string>> = {
  en: { riding_school: "Riding School", trainer: "Trainer", horse_training: "Horse Training", livery: "Livery / Boarding", veterinary: "Veterinary", farrier: "Farrier", physiotherapy: "Equine Physiotherapy", transport: "Horse Transport", shop: "Equestrian Shop", competition_coaching: "Competition Coaching", other: "Other" },
  de: { riding_school: "Reitschule", trainer: "Trainer", horse_training: "Pferdetraining", livery: "Pferdepension", veterinary: "Tierarzt", farrier: "Hufschmied", physiotherapy: "Pferdephysiotherapie", transport: "Pferdetransport", shop: "Reitsportgeschäft", competition_coaching: "Turniertraining", other: "Sonstiges" },
  fr: { riding_school: "Centre équestre", trainer: "Entraîneur", horse_training: "Entraînement du cheval", livery: "Pension", veterinary: "Vétérinaire", farrier: "Maréchal-ferrant", physiotherapy: "Physiothérapie équine", transport: "Transport de chevaux", shop: "Magasin équestre", competition_coaching: "Coaching concours", other: "Autre" },
  es: { riding_school: "Centro hípico", trainer: "Entrenador", horse_training: "Entrenamiento de caballos", livery: "Pupilaje", veterinary: "Veterinario", farrier: "Herrador", physiotherapy: "Fisioterapia equina", transport: "Transporte de caballos", shop: "Tienda ecuestre", competition_coaching: "Coaching de competición", other: "Otro" },
  nl: { riding_school: "Manege", trainer: "Trainer", horse_training: "Paardentraining", livery: "Paardenpension", veterinary: "Dierenarts", farrier: "Hoefsmid", physiotherapy: "Paardenfysiotherapie", transport: "Paardentransport", shop: "Ruitersportwinkel", competition_coaching: "Wedstrijdcoaching", other: "Overig" },
};
const text: Record<string, Record<string, string>> = {
  en: { title: "Find Equestrian Services Near You", sub: "Riding lessons, trainers, horse training and more — search by location and distance.", search: "Search name, city or discipline", all: "All services", radius: "Radius", locate: "Use my location", active: "Location active", no: "No matching services found yet.", verified: "Verified", maps: "Open in Maps", add: "Are you a service provider? Add your service through the Services page.", loading: "Loading services…", loadError: "We couldn't load services right now. Please refresh and try again." },
  de: { title: "Reitsportangebote in Ihrer Nähe", sub: "Reitunterricht, Trainer, Pferdetraining und mehr — suchen Sie nach Ort und Entfernung.", search: "Name, Stadt oder Disziplin", all: "Alle Angebote", radius: "Umkreis", locate: "Meinen Standort verwenden", active: "Standort aktiv", no: "Noch keine passenden Angebote gefunden.", verified: "Verifiziert", maps: "In Maps öffnen", add: "Sie bieten eine Dienstleistung an? Fügen Sie Ihr Angebot über die Services-Seite hinzu.", loading: "Angebote werden geladen…", loadError: "Angebote konnten gerade nicht geladen werden. Bitte aktualisieren Sie die Seite." },
  fr: { title: "Services équestres près de chez vous", sub: "Cours d'équitation, entraîneurs, entraînement et plus — recherchez par lieu et distance.", search: "Nom, ville ou discipline", all: "Tous les services", radius: "Rayon", locate: "Utiliser ma position", active: "Position active", no: "Aucun service correspondant pour le moment.", verified: "Vérifié", maps: "Ouvrir dans Maps", add: "Vous êtes prestataire ? Ajoutez votre service depuis la page Services.", loading: "Chargement des services…", loadError: "Impossible de charger les services pour le moment. Actualisez la page et réessayez." },
  es: { title: "Servicios ecuestres cerca de ti", sub: "Clases de equitación, entrenadores, entrenamiento y más — busca por ubicación y distancia.", search: "Nombre, ciudad o disciplina", all: "Todos los servicios", radius: "Radio", locate: "Usar mi ubicación", active: "Ubicación activa", no: "Aún no hay servicios coincidentes.", verified: "Verificado", maps: "Abrir en Maps", add: "¿Eres proveedor? Añade tu servicio desde la página de Servicios.", loading: "Cargando servicios…", loadError: "No se han podido cargar los servicios. Actualiza la página e inténtalo de nuevo." },
  nl: { title: "Paardensportdiensten bij jou in de buurt", sub: "Lessen, trainers, paardentraining en meer — zoek op locatie en afstand.", search: "Naam, stad of discipline", all: "Alle diensten", radius: "Straal", locate: "Mijn locatie gebruiken", active: "Locatie actief", no: "Nog geen passende diensten gevonden.", verified: "Geverifieerd", maps: "Openen in Maps", add: "Ben je aanbieder? Voeg je dienst toe via de Services-pagina.", loading: "Diensten worden geladen…", loadError: "De diensten konden niet worden geladen. Vernieuw de pagina en probeer het opnieuw." },
};

function km(a: number, b: number, c: number, d: number) {
  const r = (x: number) => x * Math.PI / 180;
  const x = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function LocalServicesFinder({ locale, providers: initialProviders }: Props) {
  const l = labels[locale] ?? labels.en;
  const t = text[locale] ?? text.en;
  const [providers, setProviders] = useState<EquestrianServiceProvider[]>(initialProviders);
  const [loading, setLoading] = useState(initialProviders.length === 0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [radius, setRadius] = useState(25);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialProviders.length > 0) return;
    let cancelled = false;
    const supabase = createClient();

    async function loadProviders() {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("equestrian_service_providers")
        .select("id,name,category,description,country,city,postal_code,address,latitude,longitude,phone,email,website,languages,disciplines,price_from,verified")
        .eq("status", "active")
        .order("verified", { ascending: false })
        .order("name", { ascending: true })
        .limit(200);

      if (cancelled) return;
      if (queryError) {
        setError(t.loadError);
        setProviders([]);
      } else {
        setProviders((data ?? []) as EquestrianServiceProvider[]);
        setError("");
      }
      setLoading(false);
    }

    void loadProviders();
    return () => { cancelled = true; };
  }, [initialProviders, t.loadError]);

  const locate = () => {
    if (!navigator.geolocation) return setError("Geolocation is not supported by this browser.");
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setError(""); },
      () => setError("Location access was not granted. You can still search by name or city.")
    );
  };

  const results = useMemo(() => providers.map((p) => ({ ...p, distance: pos && p.latitude != null && p.longitude != null ? km(pos.lat, pos.lng, p.latitude, p.longitude) : null }))
    .filter((p) => category === "all" || p.category === category)
    .filter((p) => !query.trim() || [p.name, p.city, p.country, p.description ?? "", ...p.disciplines].join(" ").toLowerCase().includes(query.toLowerCase().trim()))
    .filter((p) => p.distance == null || p.distance <= radius)
    .sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9)), [providers, pos, query, category, radius]);

  return <section className="mx-auto mt-8 max-w-[1400px] rounded-3xl border border-blue-500/20 bg-[#111827] p-6 sm:p-8">
    <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">Services</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{t.title}</h2><p className="mt-2 max-w-3xl text-gray-400">{t.sub}</p></div><button type="button" onClick={locate} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold">📍 {t.locate}</button></div>
    <div className="grid gap-4 lg:grid-cols-[1fr_220px_150px]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3"><option value="all">{t.all}</option>{categories.map((c) => <option key={c} value={c}>{l[c]}</option>)}</select><select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="rounded-xl border border-white/10 bg-[#081223] px-4 py-3"><option value="5">5 km</option><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="100">100 km</option></select></div>
    {pos && <p className="mt-3 text-sm text-emerald-300">✓ {t.active} · {radius} km</p>}{error && <p className="mt-3 text-sm text-amber-300">{error}</p>}
    {loading ? <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-12 text-center text-gray-400">{t.loading}</div> : results.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-12 text-center text-gray-400">{t.no}</div> : <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{results.map((p) => { const q = encodeURIComponent([p.name, p.address, p.city, p.country].filter(Boolean).join(", ")); return <article key={p.id} className="rounded-2xl border border-white/10 bg-[#081223] p-5"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-400">{l[p.category] ?? p.category}</p><h3 className="mt-1 text-lg font-bold">{p.name}</h3></div>{p.verified && <span className="h-fit rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">✓ {t.verified}</span>}</div><p className="mt-2 text-sm text-gray-400">{p.city}, {p.country}</p>{p.distance != null && <p className="mt-1 text-sm font-semibold">{p.distance < 10 ? p.distance.toFixed(1) : Math.round(p.distance)} km</p>}{p.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-400">{p.description}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{p.disciplines.slice(0, 5).map((d) => <span key={d} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-300">{d}</span>)}</div><div className="mt-4 flex flex-wrap gap-2">{p.phone && <a href={`tel:${p.phone}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs">☎ {p.phone}</a>}{p.website && <a href={p.website} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs">Website</a>}<a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noreferrer" className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold">{t.maps}</a></div></article>; })}</div>}
    <p className="mt-6 text-center text-xs text-gray-500">{t.add}</p>
  </section>;
}
