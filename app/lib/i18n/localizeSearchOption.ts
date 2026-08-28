import { COUNTRIES } from "@/app/lib/constants/countries";
import { DISCIPLINES } from "@/app/lib/constants/disciplines";

const disciplineTranslations: Record<string, Record<string, string>> = {
  de: {
    barrel_racing: "Barrel Racing", breakaway_roping: "Breakaway Roping", breeding_stallion: "Zuchthengst", broodmare: "Zuchtstute", circus: "Zirkus", combined_driving: "Vielseitigkeitsfahren", cutting: "Cutting", dressage: "Dressur", driving: "Fahren", endurance: "Distanzreiten", equitation: "Reitkunst", eventing: "Vielseitigkeit", flat_racing: "Flachrennen", gaited_horses: "Gangpferde", harness_racing: "Trabrennen", horseball: "Horseball", hunter: "Hunter", hunter_jumper: "Hunter-Jumper", icelandic: "Islandpferd", leisure: "Freizeitreiten", military_horse: "Militärpferd", mounted_archery: "Mounted Archery", mounted_games: "Mounted Games", other: "Sonstiges", pleasure_riding: "Freizeitreiten", pole_bending: "Pole Bending", police_horse: "Polizeipferd", polo: "Polo", ranch_riding: "Ranch Riding", ranch_trail: "Ranch Trail", reining: "Reining", roping: "Roping", show_jumping: "Springreiten", steeplechase: "Hindernisrennen", team_penning: "Team Penning", therapy_horse: "Therapiepferd", trec: "TREC", trail: "Trail", vaulting: "Voltigieren", western_pleasure: "Western Pleasure", working_equitation: "Working Equitation", young_horse: "Jungpferd"
  },
  fr: {
    barrel_racing: "Barrel Racing", breakaway_roping: "Breakaway Roping", breeding_stallion: "Étalon reproducteur", broodmare: "Jument poulinière", circus: "Cirque", combined_driving: "Attelage combiné", cutting: "Cutting", dressage: "Dressage", driving: "Attelage", endurance: "Endurance", equitation: "Équitation", eventing: "Concours complet", flat_racing: "Courses de plat", gaited_horses: "Chevaux à allures", harness_racing: "Trot attelé", horseball: "Horseball", hunter: "Hunter", hunter_jumper: "Hunter-Jumper", icelandic: "Islandais", leisure: "Loisir", military_horse: "Cheval militaire", mounted_archery: "Tir à l'arc à cheval", mounted_games: "Jeux équestres", other: "Autre", pleasure_riding: "Équitation de loisir", pole_bending: "Pole Bending", police_horse: "Cheval de police", polo: "Polo", ranch_riding: "Ranch Riding", ranch_trail: "Ranch Trail", reining: "Reining", roping: "Roping", show_jumping: "Saut d'obstacles", steeplechase: "Steeple-chase", team_penning: "Team Penning", therapy_horse: "Cheval de thérapie", trec: "TREC", trail: "Trail", vaulting: "Voltige", western_pleasure: "Western Pleasure", working_equitation: "Équitation de travail", young_horse: "Jeune cheval"
  },
  nl: {
    barrel_racing: "Barrel Racing", breakaway_roping: "Breakaway Roping", breeding_stallion: "Fokhengst", broodmare: "Fokmerrie", circus: "Circus", combined_driving: "Gecombineerd mennen", cutting: "Cutting", dressage: "Dressuur", driving: "Mennen", endurance: "Endurance", equitation: "Rijkunst", eventing: "Eventing", flat_racing: "Vlakke rennen", gaited_horses: "Gangpaarden", harness_racing: "Draverij", horseball: "Horseball", hunter: "Hunter", hunter_jumper: "Hunter-Jumper", icelandic: "IJslander", leisure: "Recreatief rijden", military_horse: "Militair paard", mounted_archery: "Boogschieten te paard", mounted_games: "Ruiterspelen", other: "Overig", pleasure_riding: "Recreatief paardrijden", pole_bending: "Pole Bending", police_horse: "Politiepaard", polo: "Polo", ranch_riding: "Ranch Riding", ranch_trail: "Ranch Trail", reining: "Reining", roping: "Roping", show_jumping: "Springen", steeplechase: "Steeplechase", team_penning: "Team Penning", therapy_horse: "Therapiepaard", trec: "TREC", trail: "Trail", vaulting: "Voltige", western_pleasure: "Western Pleasure", working_equitation: "Working Equitation", young_horse: "Jong paard"
  },
  es: {
    barrel_racing: "Carreras de barriles", breakaway_roping: "Breakaway Roping", breeding_stallion: "Semental reproductor", broodmare: "Yegua de cría", circus: "Circo", combined_driving: "Enganche combinado", cutting: "Cutting", dressage: "Doma clásica", driving: "Enganche", endurance: "Raid", equitation: "Equitación", eventing: "Concurso completo", flat_racing: "Carreras lisas", gaited_horses: "Caballos de aires", harness_racing: "Trote con arnés", horseball: "Horseball", hunter: "Hunter", hunter_jumper: "Hunter-Jumper", icelandic: "Caballo islandés", leisure: "Ocio", military_horse: "Caballo militar", mounted_archery: "Tiro con arco a caballo", mounted_games: "Juegos ecuestres", other: "Otros", pleasure_riding: "Equitación de ocio", pole_bending: "Pole Bending", police_horse: "Caballo policía", polo: "Polo", ranch_riding: "Ranch Riding", ranch_trail: "Ranch Trail", reining: "Reining", roping: "Roping", show_jumping: "Salto de obstáculos", steeplechase: "Steeplechase", team_penning: "Team Penning", therapy_horse: "Caballo de terapia", trec: "TREC", trail: "Trail", vaulting: "Volteo", western_pleasure: "Western Pleasure", working_equitation: "Equitación de trabajo", young_horse: "Caballo joven"
  }
};

const countryLabelsByValue = new Map(COUNTRIES.map((country) => [country.name, country.alpha2]));
const disciplineIdsByValue = new Map(DISCIPLINES.map((discipline) => [discipline.label, discipline.id]));

export function localizeSearchOptionLabel(value: string, fallbackLabel: string, locale: string): string {
  const countryCode = countryLabelsByValue.get(value);
  if (countryCode) {
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(countryCode) ?? fallbackLabel;
    } catch {
      return fallbackLabel;
    }
  }

  const disciplineId = disciplineIdsByValue.get(value);
  if (disciplineId) return disciplineTranslations[locale]?.[disciplineId] ?? fallbackLabel;

  return fallbackLabel;
}
