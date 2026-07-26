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
  return (
    <FormSection
      title="Pedigree"
      subtitle="Present the bloodlines that matter to sport-horse buyers."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Sire" htmlFor="sire" error={errors.sire} required>
          <input
            id="sire"
            value={data.sire}
            onChange={(e) => onChange("sire", e.target.value)}
            className={sellInputClassName}
            placeholder="Emerald van't Ruytershof"
          />
        </FormField>

        <FormField label="Dam" htmlFor="dam" error={errors.dam} required>
          <input
            id="dam"
            value={data.dam}
            onChange={(e) => onChange("dam", e.target.value)}
            className={sellInputClassName}
            placeholder="Baloubet Dream"
          />
        </FormField>

        <FormField label="Dam Sire" htmlFor="damSire" error={errors.damSire} required>
          <input
            id="damSire"
            value={data.damSire}
            onChange={(e) => onChange("damSire", e.target.value)}
            className={sellInputClassName}
            placeholder="Quidam de Revel"
          />
        </FormField>
      </div>
    </FormSection>
  );
}
