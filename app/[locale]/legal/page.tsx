import Navbar from "@/app/components/navbar/Navbar";

const content = {
  en: {
    title: "Legal Information",
    intro: "Important information about using Shabdiz. This page is prepared for the pre-launch stage and will be completed with the registered business details before paid commercial launch.",
    terms: "Terms & Conditions",
    termsText: "Shabdiz provides an online platform for equestrian discovery, listings, services and digital tools. Users are responsible for the accuracy of information they submit and for their interactions with other users. Platform features, availability and pricing may change as the service develops.",
    privacy: "Privacy Policy",
    privacyText: "Shabdiz processes account, listing and service information needed to operate the platform. Personal data is handled for authentication, communication, platform functionality, security and legal obligations. A final privacy policy with the responsible business entity and contact details will be published before commercial launch.",
    cancellation: "Cancellation & Refunds",
    cancellationText: "Paid subscriptions are subject to the plan terms shown at checkout and in the account area. Cancellation stops future renewal according to the applicable billing terms. Any refund rights will be handled according to applicable law and the final published refund policy.",
    ai: "AI & Information Disclaimer",
    aiText: "AI-assisted features are provided as decision-support tools and do not replace professional veterinary, medical, legal, financial or equestrian advice. Users should independently verify important information before acting on it.",
    business: "Business Details",
    businessText: "Registered business name, legal form, registered address, registration number, VAT information and official contact details will be added here after business registration.",
    contact: "Contact",
    contactText: "For legal or privacy questions, please use the contact channel provided on the website. Official business contact details will be published before commercial launch.",
    updated: "Pre-launch version — September 2026",
  },
  de: {
    title: "Rechtliche Informationen",
    intro: "Wichtige Informationen zur Nutzung von Shabdiz. Diese Seite ist für die Vorbereitungsphase erstellt und wird vor dem kommerziellen Start mit den registrierten Unternehmensdaten ergänzt.",
    terms: "Allgemeine Geschäftsbedingungen",
    termsText: "Shabdiz bietet eine Online-Plattform für Pferde, Reitsportangebote, Dienstleistungen und digitale Werkzeuge. Nutzer sind für die Richtigkeit ihrer Angaben und ihre Interaktionen mit anderen Nutzern verantwortlich. Funktionen, Verfügbarkeit und Preise können während der Weiterentwicklung geändert werden.",
    privacy: "Datenschutzerklärung",
    privacyText: "Shabdiz verarbeitet Konto-, Inserats- und Serviceinformationen, die für den Betrieb der Plattform erforderlich sind. Personenbezogene Daten werden für Authentifizierung, Kommunikation, Funktionen, Sicherheit und gesetzliche Pflichten verarbeitet. Eine endgültige Datenschutzerklärung mit den verantwortlichen Unternehmens- und Kontaktdaten wird vor dem kommerziellen Start veröffentlicht.",
    cancellation: "Kündigung & Erstattung",
    cancellationText: "Kostenpflichtige Abonnements unterliegen den beim Checkout und im Konto angegebenen Bedingungen. Eine Kündigung verhindert die zukünftige Verlängerung gemäß den geltenden Abrechnungsbedingungen. Erstattungen richten sich nach dem anwendbaren Recht und der endgültig veröffentlichten Erstattungsrichtlinie.",
    ai: "Hinweis zu KI und Informationen",
    aiText: "KI-gestützte Funktionen dienen als Entscheidungshilfe und ersetzen keine professionelle tierärztliche, medizinische, rechtliche, finanzielle oder pferdesportliche Beratung. Wichtige Informationen sollten vor einer Entscheidung unabhängig geprüft werden.",
    business: "Unternehmensangaben",
    businessText: "Eingetragener Unternehmensname, Rechtsform, Geschäftsanschrift, Registernummer, USt-Informationen und offizielle Kontaktdaten werden nach der Unternehmensregistrierung ergänzt.",
    contact: "Kontakt",
    contactText: "Für rechtliche oder datenschutzbezogene Fragen nutzen Sie bitte den auf der Website angegebenen Kontaktweg. Die offiziellen Unternehmensdaten werden vor dem kommerziellen Start veröffentlicht.",
    updated: "Vorabversion — September 2026",
  },
  fr: {
    title: "Informations légales",
    intro: "Informations importantes concernant l'utilisation de Shabdiz. Cette page est préparée pour la phase de pré-lancement et sera complétée avec les informations de l'entreprise enregistrée avant le lancement commercial.",
    terms: "Conditions générales",
    termsText: "Shabdiz fournit une plateforme en ligne dédiée aux chevaux, aux services équestres et aux outils numériques. Les utilisateurs sont responsables de l'exactitude des informations qu'ils publient et de leurs échanges avec les autres utilisateurs. Les fonctionnalités, la disponibilité et les tarifs peuvent évoluer.",
    privacy: "Politique de confidentialité",
    privacyText: "Shabdiz traite les informations de compte, d'annonces et de services nécessaires au fonctionnement de la plateforme. Les données personnelles sont traitées pour l'authentification, la communication, les fonctionnalités, la sécurité et les obligations légales. Une politique définitive avec les coordonnées de l'entité responsable sera publiée avant le lancement commercial.",
    cancellation: "Résiliation et remboursements",
    cancellationText: "Les abonnements payants sont soumis aux conditions affichées lors du paiement et dans le compte utilisateur. La résiliation empêche le renouvellement futur selon les conditions de facturation applicables. Les remboursements sont soumis au droit applicable et à la politique de remboursement définitive.",
    ai: "IA et informations",
    aiText: "Les fonctionnalités assistées par IA sont des outils d'aide à la décision et ne remplacent pas les conseils professionnels vétérinaires, médicaux, juridiques, financiers ou équestres. Les informations importantes doivent être vérifiées avant toute décision.",
    business: "Informations sur l'entreprise",
    businessText: "Le nom légal, la forme juridique, l'adresse, le numéro d'enregistrement, les informations TVA et les coordonnées officielles seront ajoutés après l'enregistrement de l'entreprise.",
    contact: "Contact",
    contactText: "Pour toute question juridique ou relative à la confidentialité, utilisez le moyen de contact indiqué sur le site. Les coordonnées officielles de l'entreprise seront publiées avant le lancement commercial.",
    updated: "Version pré-lancement — septembre 2026",
  },
  es: {
    title: "Información legal",
    intro: "Información importante sobre el uso de Shabdiz. Esta página está preparada para la fase previa al lanzamiento y se completará con los datos de la empresa registrada antes del lanzamiento comercial.",
    terms: "Términos y condiciones",
    termsText: "Shabdiz ofrece una plataforma online para caballos, servicios ecuestres y herramientas digitales. Los usuarios son responsables de la exactitud de la información que publican y de sus interacciones con otros usuarios. Las funciones, disponibilidad y precios pueden cambiar durante el desarrollo del servicio.",
    privacy: "Política de privacidad",
    privacyText: "Shabdiz procesa la información de cuentas, anuncios y servicios necesaria para operar la plataforma. Los datos personales se tratan para autenticación, comunicación, funcionamiento, seguridad y obligaciones legales. Antes del lanzamiento comercial se publicará una política definitiva con los datos de la entidad responsable.",
    cancellation: "Cancelación y reembolsos",
    cancellationText: "Las suscripciones de pago están sujetas a las condiciones mostradas durante el pago y en la cuenta. La cancelación evita la renovación futura según las condiciones de facturación aplicables. Los reembolsos se gestionarán conforme a la legislación aplicable y a la política definitiva de reembolsos.",
    ai: "IA y uso de la información",
    aiText: "Las funciones asistidas por IA son herramientas de apoyo a la decisión y no sustituyen el asesoramiento profesional veterinario, médico, jurídico, financiero o ecuestre. La información importante debe verificarse de forma independiente antes de actuar.",
    business: "Datos de la empresa",
    businessText: "El nombre legal, forma jurídica, domicilio, número de registro, información de IVA y datos oficiales de contacto se añadirán después del registro de la empresa.",
    contact: "Contacto",
    contactText: "Para cuestiones legales o de privacidad, utiliza el canal de contacto indicado en el sitio web. Los datos oficiales de la empresa se publicarán antes del lanzamiento comercial.",
    updated: "Versión previa al lanzamiento — septiembre de 2026",
  },
  nl: {
    title: "Juridische informatie",
    intro: "Belangrijke informatie over het gebruik van Shabdiz. Deze pagina is voorbereid voor de pre-launchfase en wordt vóór de commerciële lancering aangevuld met de gegevens van de geregistreerde onderneming.",
    terms: "Algemene voorwaarden",
    termsText: "Shabdiz biedt een online platform voor paarden, paardensportdiensten en digitale hulpmiddelen. Gebruikers zijn verantwoordelijk voor de juistheid van informatie die zij plaatsen en voor hun interacties met andere gebruikers. Functies, beschikbaarheid en prijzen kunnen tijdens de ontwikkeling veranderen.",
    privacy: "Privacybeleid",
    privacyText: "Shabdiz verwerkt account-, advertentie- en servicegegevens die nodig zijn om het platform te laten functioneren. Persoonsgegevens worden verwerkt voor authenticatie, communicatie, functionaliteit, beveiliging en wettelijke verplichtingen. Een definitief privacybeleid met de verantwoordelijke bedrijfs- en contactgegevens wordt vóór de commerciële lancering gepubliceerd.",
    cancellation: "Opzegging en terugbetalingen",
    cancellationText: "Betaalde abonnementen vallen onder de voorwaarden die bij het afrekenen en in het account worden getoond. Opzegging voorkomt toekomstige verlenging volgens de toepasselijke factureringsvoorwaarden. Terugbetalingen worden behandeld volgens de toepasselijke wetgeving en het definitieve terugbetalingsbeleid.",
    ai: "AI en informatie",
    aiText: "AI-ondersteunde functies zijn hulpmiddelen voor besluitvorming en vervangen geen professioneel veterinair, medisch, juridisch, financieel of paardensportadvies. Belangrijke informatie moet onafhankelijk worden gecontroleerd voordat je handelt.",
    business: "Bedrijfsgegevens",
    businessText: "De geregistreerde bedrijfsnaam, rechtsvorm, adres, registratienummer, btw-informatie en officiële contactgegevens worden toegevoegd na de bedrijfsregistratie.",
    contact: "Contact",
    contactText: "Gebruik voor juridische of privacyvragen het contactkanaal dat op de website wordt vermeld. De officiële bedrijfsgegevens worden vóór de commerciële lancering gepubliceerd.",
    updated: "Pre-launchversie — september 2026",
  },
} as const;

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = content[locale as keyof typeof content] ?? content.en;
  const sections = [
    [c.terms, c.termsText],
    [c.privacy, c.privacyText],
    [c.cancellation, c.cancellationText],
    [c.ai, c.aiText],
    [c.business, c.businessText],
    [c.contact, c.contactText],
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#081223] px-4 pb-24 pt-28 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <header className="rounded-3xl border border-blue-500/20 bg-[#111827] p-7 sm:p-12">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-blue-400">Shabdiz</span>
            <h1 className="mt-4 text-4xl font-black sm:text-5xl">{c.title}</h1>
            <p className="mt-5 max-w-3xl leading-8 text-gray-400">{c.intro}</p>
          </header>
          <div className="mt-8 space-y-5">
            {sections.map(([title, text]) => (
              <section key={title} className="rounded-3xl border border-white/10 bg-[#111827] p-7 sm:p-9">
                <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
                <p className="mt-4 leading-8 text-gray-400">{text}</p>
              </section>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-gray-500">{c.updated}</p>
        </div>
      </main>
    </>
  );
}
