export type HealthCheckAppetite = "good" | "reduced" | "poor";
export type HealthCheckHydration = "good" | "low";
export type HealthCheckAttitude = "normal" | "dull" | "anxious";
export type HealthCheckManure = "normal" | "loose" | "none";

export type InjurySeverity = "mild" | "moderate" | "severe";
export type InjuryStatus = "active" | "recovering" | "resolved";

export type HealthCheck = {
  id: string;
  pedigreeHorseId: string;
  checkDate: string;
  checkDateLabel: string;
  temperatureCelsius: number | null;
  appetite: HealthCheckAppetite | null;
  hydration: HealthCheckHydration | null;
  attitude: HealthCheckAttitude | null;
  manure: HealthCheckManure | null;
  lamenessObserved: boolean;
  lamenessNotes: string | null;
  feverObserved: boolean;
  notes: string | null;
};

export type HorseInjury = {
  id: string;
  pedigreeHorseId: string;
  injuryDate: string;
  injuryDateLabel: string;
  bodyArea: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  description: string | null;
  treatmentNotes: string | null;
  resolvedAt: string | null;
};

export type FarrierVisit = {
  id: string;
  pedigreeHorseId: string;
  visitDate: string;
  visitDateLabel: string;
  nextDueDate: string | null;
  nextDueDateLabel: string | null;
  workDone: string | null;
  notes: string | null;
};

export type VetVisit = {
  id: string;
  pedigreeHorseId: string;
  visitDate: string;
  visitDateLabel: string;
  reason: string;
  diagnosis: string | null;
  treatment: string | null;
  followUpDate: string | null;
  followUpDateLabel: string | null;
  notes: string | null;
};

export type Vaccination = {
  id: string;
  pedigreeHorseId: string;
  vaccineName: string;
  administeredDate: string;
  administeredDateLabel: string;
  nextDueDate: string | null;
  nextDueDateLabel: string | null;
  batchNumber: string | null;
  notes: string | null;
};

export type Medication = {
  id: string;
  pedigreeHorseId: string;
  medicationName: string;
  startDate: string;
  startDateLabel: string;
  endDate: string | null;
  endDateLabel: string | null;
  dosage: string | null;
  frequency: string | null;
  reason: string | null;
  isActive: boolean;
  notes: string | null;
};

export type HealthRuleId =
  | "fever"
  | "lameness"
  | "overdue_farrier"
  | "overdue_vaccination"
  | "active_injury";

export type HealthAlertSeverity = "info" | "watch" | "alert" | "positive";

export type HealthAlert = {
  ruleId: HealthRuleId;
  severity: HealthAlertSeverity;
  title: string;
  explanation: string;
  recommendation: string;
};

export type HorseHealthSnapshot = {
  pedigreeHorseId: string;
  horseName: string;
  latestCheck: HealthCheck | null;
  recentChecks: HealthCheck[];
  activeInjuries: HorseInjury[];
  latestFarrierVisit: FarrierVisit | null;
  overdueVaccinations: Vaccination[];
  activeMedications: Medication[];
  recentVetVisits: VetVisit[];
  vaccinationRecordCount: number;
};

export type HealthEvaluationResult = {
  provider: "rule-engine";
  healthScore: number;
  hasData: boolean;
  alerts: HealthAlert[];
  primaryAlert: HealthAlert | null;
};

export type HorseHealthDashboard = {
  snapshot: HorseHealthSnapshot;
  evaluation: HealthEvaluationResult;
  checks: HealthCheck[];
  injuries: HorseInjury[];
  farrierVisits: FarrierVisit[];
  vetVisits: VetVisit[];
  vaccinations: Vaccination[];
  medications: Medication[];
};

export type HorseHealthDashboardErrors = {
  general?: string;
  checks?: string;
  injuries?: string;
  farrier?: string;
  vet?: string;
  vaccinations?: string;
  medications?: string;
};

export type DailyHealthCheckInput = {
  pedigreeHorseId: string;
  checkDate: string;
  temperatureCelsius?: number | null;
  appetite?: HealthCheckAppetite | null;
  hydration?: HealthCheckHydration | null;
  attitude?: HealthCheckAttitude | null;
  manure?: HealthCheckManure | null;
  lamenessObserved?: boolean;
  lamenessNotes?: string | null;
  feverObserved?: boolean;
  notes?: string | null;
};
