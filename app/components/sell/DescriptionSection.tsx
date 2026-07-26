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
  const remaining = DESCRIPTION_MAX_LENGTH - data.description.length;

  return (
    <FormSection
      title="Description"
      subtitle="Describe temperament, rideability, competition history, and suitability."
    >
      <FormField
        label="Seller Description"
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
          placeholder="Tell buyers what makes this horse special..."
        />
        <div className="mt-2 flex justify-end text-sm text-gray-400">
          {remaining} characters remaining
        </div>
      </FormField>
    </FormSection>
  );
}
