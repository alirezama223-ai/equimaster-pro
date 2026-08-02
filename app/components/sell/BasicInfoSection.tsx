import { useTranslations } from "next-intl";
import FormField, { sellInputClassName } from "@/app/components/sell/FormField";
import SearchableSelect from "@/app/components/shared/SearchableSelect";
import { getBreedSelectOptions } from "@/app/lib/breeds";
import { getCountrySelectOptions } from "@/app/lib/constants/countries";
import { ListingFormData, HorseGender } from "@/app/types/listing";
import { ListingFormErrors } from "@/app/lib/listing-validation";
import FormSection from "@/app/components/sell/FormSection";

const countryOptions = getCountrySelectOptions();
const breedOptions = getBreedSelectOptions();

type Props = {
  data: ListingFormData;
  errors: ListingFormErrors;
  onChange: <K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => void;
};

export default function BasicInfoSection({ data, errors, onChange }: Props) {
  const t = useTranslations("sell");

  return (
    <FormSection title={t("basicInfo.title")} subtitle={t("basicInfo.subtitle")}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <FormField label={t("basicInfo.horseName")} htmlFor="name" error={errors.name} required>
          <input
            id="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={sellInputClassName}
            placeholder={t("basicInfo.horseNamePlaceholder")}
          />
        </FormField>

        <FormField label={t("basicInfo.breed")} htmlFor="breed" error={errors.breed} required>
          <SearchableSelect
            id="breed"
            value={data.breed}
            onChange={(value) => onChange("breed", value)}
            options={breedOptions}
            placeholder={t("basicInfo.breedPlaceholder")}
            required
            inputClassName={sellInputClassName}
          />
        </FormField>

        <FormField label={t("basicInfo.age")} htmlFor="age" error={errors.age} required>
          <input
            id="age"
            type="number"
            min={0}
            value={data.age}
            onChange={(e) => onChange("age", e.target.value)}
            className={sellInputClassName}
            placeholder={t("basicInfo.agePlaceholder")}
          />
        </FormField>

        <FormField label={t("basicInfo.gender")} htmlFor="gender" error={errors.gender} required>
          <select
            id="gender"
            value={data.gender}
            onChange={(e) => onChange("gender", e.target.value as HorseGender | "")}
            className={sellInputClassName}
          >
            <option value="">{t("basicInfo.selectGender")}</option>
            <option value="Mare">{t("basicInfo.mare")}</option>
            <option value="Stallion">{t("basicInfo.stallion")}</option>
            <option value="Gelding">{t("basicInfo.gelding")}</option>
          </select>
        </FormField>

        <FormField label={t("basicInfo.color")} htmlFor="color" error={errors.color} required>
          <input
            id="color"
            value={data.color}
            onChange={(e) => onChange("color", e.target.value)}
            className={sellInputClassName}
            placeholder={t("basicInfo.colorPlaceholder")}
          />
        </FormField>

        <FormField label={t("basicInfo.height")} htmlFor="height" error={errors.height} required>
          <input
            id="height"
            type="number"
            min={0}
            value={data.height}
            onChange={(e) => onChange("height", e.target.value)}
            className={sellInputClassName}
            placeholder={t("basicInfo.heightPlaceholder")}
          />
        </FormField>

        <FormField
          label={t("basicInfo.country")}
          htmlFor="country"
          error={errors.country}
          required
          className="sm:col-span-2 lg:col-span-1"
        >
          <SearchableSelect
            id="country"
            value={data.country}
            onChange={(value) => onChange("country", value)}
            options={countryOptions}
            placeholder={t("basicInfo.countryPlaceholder")}
            required
            inputClassName={sellInputClassName}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
