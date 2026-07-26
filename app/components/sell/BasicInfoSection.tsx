import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import { ListingFormData, HorseGender } from "@/app/types/listing";
import { ListingFormErrors } from "@/app/lib/listing-validation";
import FormSection from "@/app/components/sell/FormSection";

type Props = {
  data: ListingFormData;
  errors: ListingFormErrors;
  onChange: <K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => void;
};

export default function BasicInfoSection({ data, errors, onChange }: Props) {
  return (
    <FormSection
      title="Basic Information"
      subtitle="Core details buyers expect on a premium sport-horse listing."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label="Horse Name" htmlFor="name" error={errors.name} required>
          <input
            id="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={sellInputClassName}
            placeholder="Emerald Star Z"
          />
        </FormField>

        <FormField label="Breed" htmlFor="breed" error={errors.breed} required>
          <input
            id="breed"
            value={data.breed}
            onChange={(e) => onChange("breed", e.target.value)}
            className={sellInputClassName}
            placeholder="Hanoverian"
          />
        </FormField>

        <FormField label="Age" htmlFor="age" error={errors.age} required>
          <input
            id="age"
            type="number"
            min={0}
            value={data.age}
            onChange={(e) => onChange("age", e.target.value)}
            className={sellInputClassName}
            placeholder="Years"
          />
        </FormField>

        <FormField label="Gender" htmlFor="gender" error={errors.gender} required>
          <select
            id="gender"
            value={data.gender}
            onChange={(e) => onChange("gender", e.target.value as HorseGender | "")}
            className={sellInputClassName}
          >
            <option value="">Select gender</option>
            <option value="Mare">Mare</option>
            <option value="Stallion">Stallion</option>
            <option value="Gelding">Gelding</option>
          </select>
        </FormField>

        <FormField label="Color" htmlFor="color" error={errors.color} required>
          <input
            id="color"
            value={data.color}
            onChange={(e) => onChange("color", e.target.value)}
            className={sellInputClassName}
            placeholder="Bay"
          />
        </FormField>

        <FormField label="Height (cm)" htmlFor="height" error={errors.height} required>
          <input
            id="height"
            type="number"
            min={0}
            value={data.height}
            onChange={(e) => onChange("height", e.target.value)}
            className={sellInputClassName}
            placeholder="167"
          />
        </FormField>

        <FormField
          label="Country"
          htmlFor="country"
          error={errors.country}
          required
          className="sm:col-span-2 lg:col-span-1"
        >
          <input
            id="country"
            value={data.country}
            onChange={(e) => onChange("country", e.target.value)}
            className={sellInputClassName}
            placeholder="Germany"
          />
        </FormField>
      </div>
    </FormSection>
  );
}
