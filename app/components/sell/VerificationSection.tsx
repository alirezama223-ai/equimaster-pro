import { useTranslations } from "next-intl";
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

export default function VerificationSection({ data, errors, onChange }: Props) {
  const t = useTranslations("sell");

  return (
    <FormSection title={t("verification.title")} subtitle={t("verification.subtitle")}>
      <label className="flex items-start gap-4 rounded-2xl border border-gray-700 bg-[#08111F] px-5 py-4 cursor-pointer">
        <input
          type="checkbox"
          checked={data.confirmed}
          onChange={(e) => onChange("confirmed", e.target.checked)}
          className="mt-1 w-5 h-5"
        />
        <span className="text-white">{t("verification.confirm")}</span>
      </label>
      {errors.confirmed ? (
        <p className="mt-3 text-sm text-red-400">{errors.confirmed}</p>
      ) : null}
    </FormSection>
  );
}
