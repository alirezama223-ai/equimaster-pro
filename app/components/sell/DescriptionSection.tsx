import { useTranslations } from "next-intl";
import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import { ListingFormErrors } from "@/app/lib/listing-validation";
import { DESCRIPTION_MAX_LENGTH, ListingFormData } from "@/app/types/listing";

type Props = {
  data: ListingFormData;
  errors: ListingFormErrors;
  onChange: <K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => void;
};

export default function DescriptionSection({ data, errors, onChange }: Props) {
  const t = useTranslations("sell");
  const remaining = DESCRIPTION_MAX_LENGTH - data.description.length;

  return (
    <FormSection title={t("description.title")} subtitle={t("description.subtitle")}>
      <FormField
        label={t("description.sellerDescription")}
        htmlFor="description"
        error={errors.description}
        required
      >
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange("description", e.target.value)}
          maxLength={DESCRIPTION_MAX_LENGTH}
          rows={8}
          className={`${sellInputClassName} resize-y min-h-40`}
          placeholder={t("description.placeholder")}
        />
        <div className="mt-2 flex justify-end text-sm text-gray-400">
          {t("description.charactersRemaining", { count: remaining })}
        </div>
      </FormField>
    </FormSection>
  );
}
