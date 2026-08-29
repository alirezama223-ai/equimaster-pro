"use client";

import { useState, useTransition } from "react";
import type { EquiMarketListing } from "@/app/actions/equimarket";
import { createEquiMarketListing } from "@/app/actions/equimarket";

type Copy = {
  title: string; subtitle: string; rental: string; wanted: string; post: string; browse: string;
  emptyRental: string; emptyWanted: string; signInHint: string; submitted: string;
  fields: { title: string; description: string; horse: string; discipline: string; level: string; country: string; city: string; price: string; period: string; from: string; to: string; duration: string; competition: string; coach: string; submit: string };
};

const copyByLocale: Record<string, Copy> = {
  en: { title: "EquiMarket Services", subtitle: "Rent a sport horse or publish a request for the horse you need.", rental: "Horses for Rent", wanted: "Wanted Horses", post: "Post a listing", browse: "Browse", emptyRental: "No rental horses are listed yet.", emptyWanted: "No wanted-horse requests are listed yet.", signInHint: "Sign in to submit a listing. New submissions are reviewed before publication.", submitted: "Submitted for review. We will publish it after approval.", fields: { title: "Listing title", description: "Description", horse: "Horse name", discipline: "Discipline", level: "Level", country: "Country", city: "City", price: "Price", period: "Price period", from: "Available from", to: "Available to", duration: "Minimum duration (weeks)", competition: "Competition use allowed", coach: "Coach included", submit: "Submit for review" } },
  de: { title: "EquiMarket Services", subtitle: "Sportpferde mieten oder eine Anfrage für das gewünschte Pferd veröffentlichen.", rental: "Pferde zur Miete", wanted: "Gesuchte Pferde", post: "Anzeige erstellen", browse: "Anzeigen", emptyRental: "Noch keine Mietpferde gelistet.", emptyWanted: "Noch keine Gesuche gelistet.", signInHint: "Zum Erstellen einer Anzeige anmelden. Neue Anzeigen werden vor der Veröffentlichung geprüft.", submitted: "Zur Prüfung eingereicht. Nach der Freigabe wird die Anzeige veröffentlicht.", fields: { title: "Titel", description: "Beschreibung", horse: "Pferdename", discipline: "Disziplin", level: "Niveau", country: "Land", city: "Stadt", price: "Preis", period: "Preiszeitraum", from: "Verfügbar ab", to: "Verfügbar bis", duration: "Mindestdauer (Wochen)", competition: "Turniere erlaubt", coach: "Trainer inklusive", submit: "Zur Prüfung einreichen" } },
  fr: { title: "Services EquiMarket", subtitle: "Louez un cheval de sport ou publiez une demande pour le cheval recherché.", rental: "Chevaux à louer", wanted: "Chevaux recherchés", post: "Publier une annonce", browse: "Parcourir", emptyRental: "Aucun cheval à louer pour le moment.", emptyWanted: "Aucune demande pour le moment.", signInHint: "Connectez-vous pour publier. Les nouvelles annonces sont vérifiées avant publication.", submitted: "Annonce envoyée pour vérification.", fields: { title: "Titre", description: "Description", horse: "Nom du cheval", discipline: "Discipline", level: "Niveau", country: "Pays", city: "Ville", price: "Prix", period: "Période", from: "Disponible dès", to: "Disponible jusqu'au", duration: "Durée minimale (semaines)", competition: "Concours autorisés", coach: "Coach inclus", submit: "Envoyer pour vérification" } },
  es: { title: "Servicios EquiMarket", subtitle: "Alquila un caballo deportivo o publica una solicitud para encontrar el caballo que necesitas.", rental: "Caballos en alquiler", wanted: "Caballos buscados", post: "Publicar anuncio", browse: "Explorar", emptyRental: "Aún no hay caballos en alquiler.", emptyWanted: "Aún no hay solicitudes.", signInHint: "Inicia sesión para publicar. Los anuncios nuevos se revisan antes de publicarse.", submitted: "Enviado para revisión. Se publicará tras su aprobación.", fields: { title: "Título", description: "Descripción", horse: "Nombre del caballo", discipline: "Disciplina", level: "Nivel", country: "País", city: "Ciudad", price: "Precio", period: "Periodo", from: "Disponible desde", to: "Disponible hasta", duration: "Duración mínima (semanas)", competition: "Competiciones permitidas", coach: "Coach incluido", submit: "Enviar para revisión" } },
  nl: { title: "EquiMarket Services", subtitle: "Huur een sportpaard of plaats een zoekopdracht voor het paard dat je nodig hebt.", rental: "Paarden te huur", wanted: "Gezochte paarden", post: "Advertentie plaatsen", browse: "Bekijken", emptyRental: "Er zijn nog geen huurpaarden.", emptyWanted: "Er zijn nog geen zoekopdrachten.", signInHint: "Log in om een advertentie te plaatsen. Nieuwe advertenties worden eerst gecontroleerd.", submitted: "Ter beoordeling verzonden. Na goedkeuring wordt de advertentie gepubliceerd.", fields: { title: "Titel", description: "Beschrijving", horse: "Naam paard", discipline: "Discipline", level: "Niveau", country: "Land", city: "Stad", price: "Prijs", period: "Prijsperiode", from: "Beschikbaar vanaf", to: "Beschikbaar tot", duration: "Minimumduur (weken)", competition: "Wedstrijdgebruik toegestaan", coach: "Coach inbegrepen", submit: "Ter beoordeling verzenden" } },
};

export default function EquiMarketServices({ locale, rentals, wanted }: { locale: string; rentals: EquiMarketListing[]; wanted: EquiMarketListing[] }) {
  const copy = copyByLocale[locale] ?? copyByLocale.en;
  const [mode, setMode] = useState<"browse" | "post">("browse");
  const [type, setType] = useState<"horse_rental" | "horse_wanted">("horse_rental");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createEquiMarketListing(formData);
      setMessage(result.ok ? copy.submitted : (result.error ?? "Unable to submit."));
    });
  }

  const items = type === "horse_rental" ? rentals : wanted;

  return (
    <main className="min-h-screen bg-[#081223] px-4 pb-24 pt-28 text-white sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#111827] to-[#081223] p-6 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[5px] text-blue-400">EquiMarket</p>
          <h1 className="mt-4 text-3xl font-black sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-400">{copy.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setMode("browse")} className={`rounded-xl px-5 py-3 font-semibold ${mode === "browse" ? "bg-blue-600" : "border border-white/15 bg-white/5"}`}>{copy.browse}</button>
            <button type="button" onClick={() => setMode("post")} className={`rounded-xl px-5 py-3 font-semibold ${mode === "post" ? "bg-blue-600" : "border border-white/15 bg-white/5"}`}>{copy.post}</button>
          </div>
        </section>

        {mode === "browse" ? (
          <section className="mt-8">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setType("horse_rental")} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${type === "horse_rental" ? "bg-white text-[#081223]" : "border border-white/15 text-gray-300"}`}>{copy.rental}</button>
              <button type="button" onClick={() => setType("horse_wanted")} className={`rounded-full px-5 py-2.5 text-sm font-semibold ${type === "horse_wanted" ? "bg-white text-[#081223]" : "border border-white/15 text-gray-300"}`}>{copy.wanted}</button>
            </div>
            {items.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-16 text-center text-gray-400">{type === "horse_rental" ? copy.emptyRental : copy.emptyWanted}</div> : (
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => <article key={item.id} className="rounded-3xl border border-white/10 bg-[#111827] p-6"><div className="text-xs uppercase tracking-[2px] text-blue-400">{type === "horse_rental" ? copy.rental : copy.wanted}</div><h2 className="mt-3 text-xl font-bold">{item.title}</h2><p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-400">{item.description}</p><div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-300">{item.discipline && <span className="rounded-full bg-white/5 px-3 py-1">{item.discipline}</span>}{item.level && <span className="rounded-full bg-white/5 px-3 py-1">{item.level}</span>}{item.city && <span className="rounded-full bg-white/5 px-3 py-1">{item.city}</span>}{item.country && <span className="rounded-full bg-white/5 px-3 py-1">{item.country}</span>}</div>{item.price != null && <p className="mt-5 font-semibold text-white">{item.price} / {item.price_period ?? "period"}</p>}{item.competition_allowed && <p className="mt-2 text-sm text-emerald-300">✓ Competition use</p>}{item.coach_included && <p className="mt-1 text-sm text-emerald-300">✓ Coach included</p>}</article>)}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap gap-3"><button type="button" onClick={() => setType("horse_rental")} className={`rounded-full px-4 py-2 text-sm ${type === "horse_rental" ? "bg-blue-600" : "bg-white/5"}`}>{copy.rental}</button><button type="button" onClick={() => setType("horse_wanted")} className={`rounded-full px-4 py-2 text-sm ${type === "horse_wanted" ? "bg-blue-600" : "bg-white/5"}`}>{copy.wanted}</button></div>
            <p className="mb-6 text-sm text-gray-400">{copy.signInHint}</p>
            <form action={submit} className="grid gap-5 md:grid-cols-2">
              <input type="hidden" name="listing_type" value={type} />
              <label className="md:col-span-2"><span className="mb-2 block text-sm text-gray-300">{copy.fields.title}</span><input required name="title" maxLength={140} className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label className="md:col-span-2"><span className="mb-2 block text-sm text-gray-300">{copy.fields.description}</span><textarea required name="description" maxLength={5000} rows={5} className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              {type === "horse_rental" && <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.horse}</span><input name="horse_name" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>}
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.discipline}</span><input name="discipline" placeholder="Show Jumping" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.level}</span><input name="level" placeholder="1.20m / Advanced" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.country}</span><input name="country" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.city}</span><input name="city" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.price}</span><input name="price" type="number" min="0" step="0.01" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.period}</span><select name="price_period" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3"><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option><option value="season">Season</option><option value="negotiable">Negotiable</option></select></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.from}</span><input name="available_from" type="date" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.to}</span><input name="available_to" type="date" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <label><span className="mb-2 block text-sm text-gray-300">{copy.fields.duration}</span><input name="min_duration_weeks" type="number" min="1" className="w-full rounded-xl border border-white/10 bg-[#081223] px-4 py-3" /></label>
              <div className="flex flex-col justify-end gap-3"><label className="flex items-center gap-3 text-sm"><input name="competition_allowed" type="checkbox" />{copy.fields.competition}</label><label className="flex items-center gap-3 text-sm"><input name="coach_included" type="checkbox" />{copy.fields.coach}</label></div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-4"><button disabled={pending} type="submit" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold disabled:opacity-50">{pending ? "…" : copy.fields.submit}</button>{message && <span className="text-sm text-emerald-300">{message}</span>}</div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
