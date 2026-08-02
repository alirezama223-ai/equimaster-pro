import { useTranslations } from "next-intl";
import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import { ListingFormErrors } from "@/app/lib/listing-validation";
import { ListingFormData } from "@/app/types/listing";

type Props = {
  data: ListingFormData;
  errors: ListingFormErrors;
  onChange: <K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => void;
};

export default function PedigreeSection({ data, errors, onChange }: Props) {
  const t = useTranslations("sell");

  return (
    <FormSection title={t("pedigree.title")} subtitle={t("pedigree.subtitle")}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label={t("pedigree.sire")} htmlFor="sire" error={errors.sire} required>
          <input
            id="sire"
            value={data.sire}
            onChange={(e) => onChange("sire", e.target.value)}
            className={sellInputClassName}
            placeholder={t("pedigree.sirePlaceholder")}
          />
        </FormField>

        <FormField label={t("pedigree.dam")} htmlFor="dam" error={errors.dam} required>
          <input
            id="dam"
            value={data.dam}
            onChange={(e) => onChange("dam", e.target.value)}
            className={sellInputClassName}
            placeholder={t("pedigree.damPlaceholder")}
          />
        </FormField>

        <FormField label={t("pedigree.damSire")} htmlFor="damSire" error={errors.damSire} required>
          <input
            id="damSire"
            value={data.damSire}
            onChange={(e) => onChange("damSire", e.target.value)}
            className={sellInputClassName}
            placeholder={t("pedigree.damSirePlaceholder")}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
