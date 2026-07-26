import { describe, expect, it } from "vitest";
import {
  assertClientCannotSetVerified,
  validateAdminSubmission,
  validateManagerSubmission,
} from "@/app/lib/traits/validation";

describe("trait submission validation", () => {
  const validUuid = "c3bd4d79-d00e-489d-8a45-8d6180133c1c";

  it("rejects invalid trait keys and scores", () => {
    expect(validateManagerSubmission({
      pedigreeHorseId: validUuid,
      traitKey: "not_a_trait",
      score: 3,
      confidence: "medium",
    })).toMatch(/Invalid trait key/);

    expect(validateManagerSubmission({
      pedigreeHorseId: validUuid,
      traitKey: "jumping_scope",
      score: 6,
      confidence: "medium",
    })).toMatch(/between 1 and 5/);
  });

  it("rejects forged verified status from client payloads", () => {
    expect(() => assertClientCannotSetVerified(true)).toThrow(/verified status is not permitted/);
    expect(() => assertClientCannotSetVerified(undefined)).not.toThrow();
  });

  it("allows admin-only source types and rejects manager source types on admin create", () => {
    expect(validateAdminSubmission({
      pedigreeHorseId: validUuid,
      traitKey: "jumping_scope",
      score: 4,
      confidence: "high",
      sourceType: "admin_assessed",
    })).toBeNull();

    expect(validateAdminSubmission({
      pedigreeHorseId: validUuid,
      traitKey: "jumping_scope",
      score: 4,
      confidence: "high",
      sourceType: "owner_reported",
    })).toMatch(/not permitted for admin structured entry/);
  });
});
