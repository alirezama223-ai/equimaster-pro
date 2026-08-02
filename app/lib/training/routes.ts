/** Canonical App Router path: /training/session/[id] */
export const TRAINING_SESSION_PATH_PREFIX = "/training/session";

export function trainingSessionPath(sessionId: string): string {
  return `${TRAINING_SESSION_PATH_PREFIX}/${sessionId}`;
}
