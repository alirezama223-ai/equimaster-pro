export type DashboardTranslator = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;
