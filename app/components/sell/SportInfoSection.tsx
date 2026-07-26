import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import { ListingFormErrors } from "@/app/lib/listing-validation";
import {
  DISCIPLINES,
  DRESSAGE_LEVELS,
  ListingFormData,
  SHOW_JUMPING_LEVELS,
} from "@/app/types/listing";

type Props = {
  data: ListingFormData;
  errors: ListingFormErrors;
  onChange: <K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => void;
};

export default function SportInfoSection({ data, errors, onChange }: Props) {
  const levels =
    data.discipline === "Show Jumping"
      ? SHOW_JUMPING_LEVELS
      : data.discipline === "Dressage"
        ? DRESSAGE_LEVELS
        : ["Training", "Competition Ready", "Advanced", "Professional"];

  return (
    <FormSection
      title="Sport Information"
      subtitle="Help buyers understand the horse's discipline and competition level."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Discipline"
          htmlFor="discipline"
          error={errors.discipline}
          required
        >
          <select
            id="discipline"
            value={data.discipline}
            onChange={(e) => {
              onChange("discipline", e.target.value);
              onChange("level", "");
            }}
            className={sellInputClassName}
          >
            {DISCIPLINES.map((discipline) => (
              <option key={discipline} value={discipline}>
                {discipline}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Competition / Training Level"
          htmlFor="level"
          error={errors.level}
          required
        >
          <select
            id="level"
            value={data.level}
            onChange={(e) => onChange("level", e.target.value)}
            className={sellInputClassName}
          >
            <option value="">Select level</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </FormSection>
  );
}
