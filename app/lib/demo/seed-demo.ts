import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  DEMO_FEELINGS,
  DEMO_HORSE_TEMPLATES,
  DEMO_PLAN_NAMES,
} from "@/app/lib/demo/constants";
import {
  addDays,
  daysAgo,
  genderLabel,
  pickFrom,
  pickSessionDates,
} from "@/app/lib/demo/helpers";
import { upsertDemoUserState } from "@/app/lib/demo/preferences";
import { buildListingSlug } from "@/app/lib/marketplace/slug";
import { syncHorseEventsFromAnalytics } from "@/app/lib/events/sync-horse-events";
import { normalizePedigreeName } from "@/app/lib/pedigree";
import { fetchHorseTrainingAnalytics } from "@/app/lib/training/horse-analytics";
import type { DemoHorseTemplate } from "@/app/types/demo";

type SystemExercise = { id: string; category: string; discipline: string | null };
type SeededHorse = { template: DemoHorseTemplate; pedigreeId: string; listingId: string; planId: string };

export type SeedDemoResult = {
  horseIds: string[];
  listingIds: string[];
  planIds: string[];
  primaryHorseId: string | null;
};

function sessionRating(template: DemoHorseTemplate, index: number, date: string) {
  const daysFromToday = Math.floor(
    (Date.parse(`${daysAgo(new Date(), 0)}T12:00:00`) - Date.parse(`${date}T12:00:00`)) /
      86400000,
  );
  if (template.name === "Dawn") return 5 + (index % 3);
  if (template.name === "Comet" && daysFromToday <= 10) return Math.max(5, 8 - (index % 4));
  if (template.name === "Atlas") return 7 + (index % 3);
  return 7 + (index % 4);
}

function sessionFeeling(template: DemoHorseTemplate, index: number, date: string) {
  const daysFromToday = Math.floor(
    (Date.parse(`${daysAgo(new Date(), 0)}T12:00:00`) - Date.parse(`${date}T12:00:00`)) /
      86400000,
  );
  if (template.name === "Comet" && daysFromToday <= 10) return pickFrom(DEMO_FEELINGS.fatigue, index);
  if (template.name === "Dawn") return pickFrom(DEMO_FEELINGS.mixed, index);
  return pickFrom(DEMO_FEELINGS.positive, index);
}

function sessionDuration(template: DemoHorseTemplate, date: string) {
  const isRecent = Date.parse(`${date}T12:00:00`) >= Date.parse(`${daysAgo(new Date(), 6)}T12:00:00`);
  if (template.name === "Atlas" && isRecent) return 58 + (Date.parse(date) % 8);
  if (template.sessionDensity === "low") return 35 + (Date.parse(date) % 10);
  return 42 + (Date.parse(date) % 15);
}

async function fetchSystemExercises(supabase: SupabaseClient): Promise<{ exercises: SystemExercise[]; error?: string }> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, category, discipline")
    .eq("source", "system")
    .order("category", { ascending: true });
  if (error) return { exercises: [], error: error.message };
  return { exercises: (data ?? []) as SystemExercise[] };
}

async function seedHorseListingAndPedigree(
  supabase: SupabaseClient,
  userId: string,
  template: DemoHorseTemplate,
  sellerName: string,
  sellerEmail: string,
) {
  const pedigreeId = randomUUID();
  const listingId = randomUUID();
  const birthYear = new Date().getFullYear() - template.age;

  const { error: pedigreeError } = await supabase.from("pedigree_horses").insert({
    id: pedigreeId,
    name: template.name,
    normalized_name: normalizePedigreeName(template.name),
    sex: template.sex,
    birth_year: birthYear,
    breed: template.breed,
    color: template.color,
    country: template.country,
    description: template.description,
    created_by: userId,
  });
  if (pedigreeError) return { pedigreeId, listingId, error: pedigreeError.message };

  const { error: listingError } = await supabase.from("horse_listings").insert({
    id: listingId,
    user_id: userId,
    pedigree_horse_id: pedigreeId,
    name: template.name,
    breed: template.breed,
    gender: genderLabel(template.sex),
    age: template.age,
    height: template.height,
    color: template.color,
    country: template.country,
    discipline: template.discipline,
    level: template.level,
    price_on_request: true,
    sire: "Demo Sire",
    dam: "Demo Dam",
    dam_sire: "Demo Dam Sire",
    description: template.description,
    seller_name: sellerName,
    seller_email: sellerEmail,
    seller_phone: "+1 555 0100",
    stable_name: "EquiMaster Demo Stable",
    status: "draft",
    slug: buildListingSlug(template.name, listingId),
  });
  if (listingError) {
    await supabase.from("pedigree_horses").delete().eq("id", pedigreeId);
    return { pedigreeId, listingId, error: listingError.message };
  }
  return { pedigreeId, listingId };
}

async function seedTrainingPlan(supabase: SupabaseClient, userId: string, template: DemoHorseTemplate, pedigreeId: string) {
  const planId = randomUUID();
  const startDate = daysAgo(new Date(), 29);
  const endDate = addDays(startDate, 56);
  const planName = DEMO_PLAN_NAMES[template.discipline] ?? "Foundation Training Block";
  const { error: planError } = await supabase.from("training_plans").insert({
    id: planId,
    created_by: userId,
    name: `${planName} · ${template.name}`,
    description: `Demo training plan for ${template.name} covering rhythm, suppleness, and competition preparation.`,
    status: "active",
    start_date: startDate,
    end_date: endDate,
  });
  if (planError) return { planId, error: planError.message };
  const { error: assignmentError } = await supabase.from("training_plan_assignments").insert({
    training_plan_id: planId,
    pedigree_horse_id: pedigreeId,
    created_by: userId,
  });
  if (assignmentError) {
    await supabase.from("training_plans").delete().eq("id", planId);
    return { planId, error: assignmentError.message };
  }
  return { planId };
}

async function seedSessionsForHorse(
  supabase: SupabaseClient,
  userId: string,
  horse: SeededHorse,
  systemExercises: SystemExercise[],
): Promise<{ error?: string }> {
  const sessionDates = pickSessionDates(horse.template.sessionDensity);
  const disciplineExercises = systemExercises.filter(
    (exercise) => exercise.discipline === horse.template.discipline || exercise.discipline === null,
  );
  const exercises = disciplineExercises.length > 0 ? disciplineExercises : systemExercises;

  const sessions = sessionDates.map((sessionDate, index) => ({
    id: randomUUID(),
    created_by: userId,
    pedigree_horse_id: horse.pedigreeId,
    training_plan_id: horse.planId,
    session_date: sessionDate,
    title: `${horse.template.discipline} session · ${horse.template.name}`,
    notes: index % 4 === 0 ? `${horse.template.name} stayed balanced and responsive through the main exercises.` : null,
    session_goal: "Maintain rhythm, straightness, and quality transitions.",
    energy_level: horse.template.name === "Atlas" ? "high" : "moderate",
    confidence: "high",
    status: "completed",
    duration_minutes: sessionDuration(horse.template, sessionDate),
    rider_rating: sessionRating(horse.template, index, sessionDate),
    horse_feeling: sessionFeeling(horse.template, index, sessionDate),
    coach_notes: index % 3 === 0
      ? `Good progress on ${horse.template.discipline.toLowerCase()} fundamentals—keep the same warm-up routine before increasing intensity.`
      : null,
  }));

  const { error: sessionError } = await supabase.from("training_sessions").insert(sessions);
  if (sessionError) return { error: sessionError.message };
  if (exercises.length === 0) return {};

  const sessionExercises = sessions.flatMap((session, sessionIndex) => {
    const categories = ["warmup", "flatwork", "cooldown"];
    if (horse.template.discipline === "Show Jumping") categories.splice(2, 0, "polework", "jumping");
    else if (horse.template.discipline === "Eventing") categories.splice(2, 0, "conditioning", "jumping");

    const usedExerciseIds = new Set<string>();
    return categories.map((category, sortOrder) => {
      let exercise = exercises.find((item) => item.category === category && !usedExerciseIds.has(item.id));
      if (!exercise) exercise = exercises.find((item) => !usedExerciseIds.has(item.id));
      if (!exercise) return null;
      usedExerciseIds.add(exercise.id);
      return {
        id: randomUUID(),
        training_session_id: session.id,
        exercise_id: exercise.id,
        sort_order: sortOrder,
        duration_minutes: 10 + sortOrder * 5,
        status: "completed",
      };
    }).filter((row): row is NonNullable<typeof row> => row !== null);
  });

  if (sessionExercises.length === 0) return {};
  const { error } = await supabase.from("training_session_exercises").insert(sessionExercises);
  return error ? { error: error.message } : {};
}

async function seedHealthForHorse(supabase: SupabaseClient, userId: string, horse: SeededHorse): Promise<{ error?: string }> {
  const profile = horse.template.healthProfile;
  const checks = [];
  for (let offset = 0; offset < 14; offset += 2) {
    const checkDate = daysAgo(new Date(), offset);
    const lameness = profile === "lameness" && offset <= 6 ? true : profile === "recovery" && offset === 2;
    checks.push({
      created_by: userId,
      pedigree_horse_id: horse.pedigreeId,
      check_date: checkDate,
      temperature_celsius: lameness ? 38.2 : 37.8,
      appetite: lameness ? "reduced" : "good",
      hydration: "good",
      attitude: lameness ? "dull" : "normal",
      manure: "normal",
      lameness_observed: lameness,
      lameness_notes: lameness ? "Mild stiffness observed at trot on left rein." : null,
      fever_observed: false,
      notes: lameness ? "Monitor after light flatwork only." : "Normal daily check.",
    });
  }
  const { error: checkError } = await supabase.from("horse_health_checks").insert(checks);
  if (checkError) return { error: checkError.message };

  const farrierVisitDate = profile === "overdue_care" ? daysAgo(new Date(), 52) : daysAgo(new Date(), 21);
  const farrierNextDue = profile === "overdue_care" ? daysAgo(new Date(), 7) : addDays(farrierVisitDate, 42);
  const { error: farrierError } = await supabase.from("horse_farrier_visits").insert({
    created_by: userId, pedigree_horse_id: horse.pedigreeId, visit_date: farrierVisitDate,
    next_due_date: farrierNextDue, work_done: "Full trim and balance.",
    notes: profile === "overdue_care" ? "Follow-up overdue—schedule reset." : "Hooves in good shape.",
  });
  if (farrierError) return { error: farrierError.message };

  const vaccinationDate = profile === "overdue_care" ? daysAgo(new Date(), 400) : daysAgo(new Date(), 120);
  const vaccinationDue = profile === "overdue_care" ? daysAgo(new Date(), 35) : addDays(vaccinationDate, 365);
  const { error: vaccinationError } = await supabase.from("horse_vaccinations").insert({
    created_by: userId, pedigree_horse_id: horse.pedigreeId, vaccine_name: "Equine Influenza / Tetanus",
    administered_date: vaccinationDate, next_due_date: vaccinationDue,
    notes: profile === "overdue_care" ? "Booster overdue." : "Annual booster on schedule.",
  });
  if (vaccinationError) return { error: vaccinationError.message };

  const { error: vetError } = await supabase.from("horse_vet_visits").insert({
    created_by: userId, pedigree_horse_id: horse.pedigreeId, visit_date: daysAgo(new Date(), 45),
    reason: profile === "overdue_care" ? "Lameness evaluation" : "Routine wellness exam",
    diagnosis: profile === "overdue_care" ? "Mild superficial flexor strain" : "Healthy",
    treatment: profile === "overdue_care" ? "Rest, cold hosing, NSAIDs as directed." : "None required",
    follow_up_date: profile === "overdue_care" ? addDays(daysAgo(new Date(), 0), 7) : null,
    notes: "Demo veterinary record.",
  });
  if (vetError) return { error: vetError.message };

  if (profile === "lameness" || profile === "overdue_care") {
    const { error } = await supabase.from("horse_injuries").insert({
      created_by: userId, pedigree_horse_id: horse.pedigreeId,
      injury_date: daysAgo(new Date(), profile === "overdue_care" ? 12 : 18),
      body_area: profile === "overdue_care" ? "Left fore tendon" : "Right hind fetlock",
      severity: "mild", status: profile === "lameness" ? "recovering" : "active",
      description: profile === "overdue_care" ? "Mild strain after jumping session—monitor swelling." : "Soft tissue sensitivity after cross-country schooling.",
      treatment_notes: "Controlled exercise only until cleared.",
    });
    if (error) return { error: error.message };
  }

  if (profile === "recovery") {
    const { error } = await supabase.from("horse_injuries").insert({
      created_by: userId, pedigree_horse_id: horse.pedigreeId, injury_date: daysAgo(new Date(), 25),
      body_area: "Back / sacroiliac", severity: "mild", status: "recovering",
      description: "Mild back sensitivity during saddle-up.", treatment_notes: "Light flatwork and physiotherapy exercises.",
    });
    if (error) return { error: error.message };
  }
  return {};
}

async function syncDemoEvents(supabase: SupabaseClient, userId: string, horses: SeededHorse[]): Promise<{ error?: string }> {
  for (const horse of horses) {
    const analyticsResult = await fetchHorseTrainingAnalytics(supabase, userId, horse.pedigreeId, horse.template.name);
    const syncResult = await syncHorseEventsFromAnalytics(supabase, userId, horse.pedigreeId, horse.template.name, analyticsResult.analytics);
    if (syncResult.error) return { error: syncResult.error };
  }
  return {};
}

export async function seedDemoEnvironment(
  supabase: SupabaseClient,
  userId: string,
  sellerName: string,
  sellerEmail: string,
): Promise<{ result: SeedDemoResult | null; error?: string }> {
  const exercisesResult = await fetchSystemExercises(supabase);
  if (exercisesResult.error) return { result: null, error: exercisesResult.error };

  const seededHorses: SeededHorse[] = [];
  const horseIds: string[] = [];
  const listingIds: string[] = [];
  const planIds: string[] = [];
  let primaryHorseId: string | null = null;

  for (const template of DEMO_HORSE_TEMPLATES) {
    const pedigreeResult = await seedHorseListingAndPedigree(supabase, userId, template, sellerName, sellerEmail);
    if (pedigreeResult.error) return { result: null, error: pedigreeResult.error };

    const planResult = await seedTrainingPlan(supabase, userId, template, pedigreeResult.pedigreeId);
    if (planResult.error) return { result: null, error: planResult.error };

    const seededHorse: SeededHorse = {
      template,
      pedigreeId: pedigreeResult.pedigreeId,
      listingId: pedigreeResult.listingId,
      planId: planResult.planId,
    };
    seededHorses.push(seededHorse);
    horseIds.push(pedigreeResult.pedigreeId);
    listingIds.push(pedigreeResult.listingId);
    planIds.push(planResult.planId);
    if (template.primary) primaryHorseId = pedigreeResult.pedigreeId;
  }

  for (const horse of seededHorses) {
    const sessionResult = await seedSessionsForHorse(supabase, userId, horse, exercisesResult.exercises);
    if (sessionResult.error) return { result: null, error: sessionResult.error };
    const healthResult = await seedHealthForHorse(supabase, userId, horse);
    if (healthResult.error) return { result: null, error: healthResult.error };
  }

  const syncResult = await syncDemoEvents(supabase, userId, seededHorses);
  if (syncResult.error) return { result: null, error: syncResult.error };

  const stateResult = await upsertDemoUserState(supabase, userId, {
    demoModeEnabled: true,
    demoSeeded: true,
    demoHorseIds: horseIds,
    demoListingIds: listingIds,
    demoPlanIds: planIds,
    primaryDemoHorseId: primaryHorseId,
    lastResetAt: new Date().toISOString(),
  });
  if (stateResult.error) return { result: null, error: stateResult.error };

  return { result: { horseIds, listingIds, planIds, primaryHorseId } };
}
