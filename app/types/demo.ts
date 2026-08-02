export type DemoOrganizationRole = "owner" | "trainer" | "vet" | "farrier";

export type DemoOrganizationMember = {
  id: string;
  role: DemoOrganizationRole;
  displayName: string;
  title: string;
  contactEmail: string | null;
};

export type DemoOrganization = {
  id: string;
  slug: string;
  name: string;
  description: string;
  members: DemoOrganizationMember[];
};

export type DemoUserState = {
  demoModeEnabled: boolean;
  demoSeeded: boolean;
  demoHorseIds: string[];
  primaryDemoHorseId: string | null;
  lastResetAt: string | null;
};

export type DemoEnvironmentSnapshot = {
  organization: DemoOrganization | null;
  userState: DemoUserState;
  demoHorses: { id: string; name: string; discipline: string }[];
};

export type DemoHorseTemplate = {
  name: string;
  sex: "stallion" | "mare" | "gelding";
  breed: string;
  discipline: string;
  level: string;
  color: string;
  country: string;
  age: number;
  height: number;
  description: string;
  /** Sessions in the last 30 days */
  sessionDensity: "high" | "medium" | "low";
  /** Primary horse for analytics showcase */
  primary?: boolean;
  healthProfile: "healthy" | "workload" | "lameness" | "overdue_care" | "recovery";
};
