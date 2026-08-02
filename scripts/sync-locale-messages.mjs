import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const enDir = path.join(root, "messages", "en");
const locales = ["de", "fr", "nl", "es"];

/** Machine translations for common UI keys — extend as namespaces grow. */
const translations = {
  de: {
    common: {
      brand: "EquiMaster Pro",
      loading: "Laden...",
      save: "Speichern",
      cancel: "Abbrechen",
      close: "Schließen",
      delete: "Löschen",
      edit: "Bearbeiten",
      view: "Ansehen",
      back: "Zurück",
      next: "Weiter",
      submit: "Absenden",
      confirm: "Bestätigen",
      search: "Suchen",
      reset: "Zurücksetzen",
      all: "Alle",
      yes: "Ja",
      no: "Nein",
      error: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
      noResults: "Keine Ergebnisse gefunden.",
      about: "Über uns",
      verified: "Verifiziert",
      status: "Status",
      actions: "Aktionen",
      language: "Sprache",
      selectLanguage: "Sprache wählen",
      priceOnRequest: "Preis auf Anfrage",
      listings: "Anzeigen",
      listing: "Anzeige",
    },
    nav: {
      home: "Startseite",
      marketplace: "Marktplatz",
      browse: "Durchsuchen",
      browseHorses: "Pferde durchsuchen",
      favorites: "Favoriten",
      favoritesWithIcon: "❤️ Favoriten",
      stallions: "Hengste",
      breeders: "Züchter",
      bloodlines: "Blutlinien",
      breedingLab: "Zucht-Labor",
      training: "Training",
      stallionMatch: "Hengst-Match",
      sell: "Verkaufen",
      sellAHorse: "Pferd verkaufen",
      sellerDashboard: "Verkäufer-Dashboard",
      about: "Über uns",
      account: "Konto",
      login: "Anmelden",
      signup: "Registrieren",
      logout: "Abmelden",
      notifications: "Benachrichtigungen",
    },
  },
  fr: {
    common: {
      loading: "Chargement...",
      save: "Enregistrer",
      cancel: "Annuler",
      close: "Fermer",
      delete: "Supprimer",
      edit: "Modifier",
      view: "Voir",
      back: "Retour",
      search: "Rechercher",
      reset: "Réinitialiser",
      all: "Tous",
      error: "Une erreur s'est produite. Veuillez réessayer.",
      noResults: "Aucun résultat trouvé.",
      about: "À propos",
      verified: "Vérifié",
      status: "Statut",
      language: "Langue",
      selectLanguage: "Choisir la langue",
      priceOnRequest: "Prix sur demande",
      listings: "Annonces",
      listing: "Annonce",
    },
    nav: {
      home: "Accueil",
      marketplace: "Marketplace",
      browse: "Parcourir",
      browseHorses: "Parcourir les chevaux",
      favorites: "Favoris",
      favoritesWithIcon: "❤️ Favoris",
      stallions: "Étalons",
      breeders: "Éleveurs",
      bloodlines: "Lignées",
      breedingLab: "Labo élevage",
      training: "Entraînement",
      stallionMatch: "Match étalon",
      sell: "Vendre",
      sellAHorse: "Vendre un cheval",
      sellerDashboard: "Tableau vendeur",
      about: "À propos",
      account: "Compte",
      login: "Connexion",
      signup: "Inscription",
      logout: "Déconnexion",
      notifications: "Notifications",
    },
  },
  nl: {
    common: {
      loading: "Laden...",
      save: "Opslaan",
      cancel: "Annuleren",
      close: "Sluiten",
      delete: "Verwijderen",
      edit: "Bewerken",
      view: "Bekijken",
      back: "Terug",
      search: "Zoeken",
      reset: "Resetten",
      all: "Alle",
      error: "Er is iets misgegaan. Probeer het opnieuw.",
      noResults: "Geen resultaten gevonden.",
      about: "Over ons",
      verified: "Geverifieerd",
      status: "Status",
      language: "Taal",
      selectLanguage: "Taal kiezen",
      priceOnRequest: "Prijs op aanvraag",
      listings: "Advertenties",
      listing: "Advertentie",
    },
    nav: {
      home: "Home",
      marketplace: "Marktplaats",
      browse: "Bladeren",
      browseHorses: "Paarden bekijken",
      favorites: "Favorieten",
      favoritesWithIcon: "❤️ Favorieten",
      stallions: "Hengsten",
      breeders: "Fokkers",
      bloodlines: "Bloodlines",
      breedingLab: "Foklab",
      training: "Training",
      stallionMatch: "Hengst match",
      sell: "Verkopen",
      sellAHorse: "Paard verkopen",
      sellerDashboard: "Verkopersdashboard",
      about: "Over ons",
      account: "Account",
      login: "Inloggen",
      signup: "Registreren",
      logout: "Uitloggen",
      notifications: "Meldingen",
    },
  },
  es: {
    common: {
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      close: "Cerrar",
      delete: "Eliminar",
      edit: "Editar",
      view: "Ver",
      back: "Volver",
      search: "Buscar",
      reset: "Restablecer",
      all: "Todos",
      error: "Algo salió mal. Inténtelo de nuevo.",
      noResults: "No se encontraron resultados.",
      about: "Acerca de",
      verified: "Verificado",
      status: "Estado",
      language: "Idioma",
      selectLanguage: "Seleccionar idioma",
      priceOnRequest: "Precio a consultar",
      listings: "Anuncios",
      listing: "Anuncio",
    },
    nav: {
      home: "Inicio",
      marketplace: "Mercado",
      browse: "Explorar",
      browseHorses: "Explorar caballos",
      favorites: "Favoritos",
      favoritesWithIcon: "❤️ Favoritos",
      stallions: "Sementales",
      breeders: "Criadores",
      bloodlines: "Líneas de sangre",
      breedingLab: "Laboratorio de cría",
      training: "Entrenamiento",
      stallionMatch: "Match de sementales",
      sell: "Vender",
      sellAHorse: "Vender un caballo",
      sellerDashboard: "Panel del vendedor",
      about: "Acerca de",
      account: "Cuenta",
      login: "Iniciar sesión",
      signup: "Registrarse",
      logout: "Cerrar sesión",
      notifications: "Notificaciones",
    },
  },
};

function deepMerge(base, overrides) {
  if (!overrides) return structuredClone(base);
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] ?? {}, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const namespaces = fs.readdirSync(enDir).filter((f) => f.endsWith(".json"));

for (const locale of locales) {
  const localeDir = path.join(root, "messages", locale);
  fs.mkdirSync(localeDir, { recursive: true });

  for (const file of namespaces) {
    const namespace = file.replace(".json", "");
    const raw = fs.readFileSync(path.join(enDir, file), "utf8").replace(/^\uFEFF/, "");
    const en = JSON.parse(raw);
    const localized = deepMerge(en, translations[locale]?.[namespace]);
    fs.writeFileSync(
      path.join(localeDir, file),
      `${JSON.stringify(localized, null, 2)}\n`
    );
  }
}

console.log(`Synced ${namespaces.length} namespaces to ${locales.join(", ")}`);
