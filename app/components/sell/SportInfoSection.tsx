import { useTranslations } from "next-intl";
import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import { getDisciplineSelectOptions } from "@/app/lib/constants/disciplines";
import { ListingFormErrors } from "@/app/lib/listing-validation";
import {
  DRESSAGE_LEVELS,
  ListingFormData,
  SHOW_JUMPING_LEVELS,
} from "@/app/types/listing";

const disciplineOptions = getDisciplineSelectOptions();

type Props = {
  data: ListingFormData;
  errors: ListingFormErrors;
  onChange: <K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => void;
};

export default function SportInfoSection({ data, errors, onChange }: Props) {
  const t = useTranslations("sell");
  const levels =
    data.discipline === "Show Jumping"
      ? SHOW_JUMPING_LEVELS
      : data.discipline === "Dressage"
        ? DRESSAGE_LEVELS
        : ["Training", "Competition Ready", "Advanced", "Professional"];

  return (
    <FormSection title={t("sportInfo.title")} subtitle={t("sportInfo.subtitle")}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t("sportInfo.discipline")}
          htmlFor="discipline"
          error={errors.discipline}
          required
        >
          <SearchableSelect
            id="discipline"
            value={data.discipline}
            onChange={(value) => {
              onChange("discipline", value);
              onChange("level", "");
            }}
            options={disciplineOptions}
            placeholder={t("sportInfo.disciplinePlaceholder")}
            required
            inputClassName={sellInputClassName}
          />
        </FormField>

        <FormField
          label={t("sportInfo.level")}
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
            <option value="">{t("sportInfo.selectLevel")}</option>
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
