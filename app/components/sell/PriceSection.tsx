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

export default function PriceSection({ data, errors, onChange }: Props) {
  const t = useTranslations("sell");

  return (
    <FormSection title={t("price.title")} subtitle={t("price.subtitle")}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t("price.priceEur")}
          htmlFor="price"
          error={errors.price}
          required={!data.priceOnRequest}
        >
          <input
            id="price"
            type="number"
            min={0}
            step={500}
            value={data.price}
            disabled={data.priceOnRequest}
            onChange={(e) => onChange("price", e.target.value)}
            className={`${sellInputClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder={t("price.pricePlaceholder")}
          />
        </FormField>

        <label className="rounded-xl bg-[#08111F] border border-gray-700 px-5 py-4 flex items-center gap-3 text-white cursor-pointer min-h-[58px] mt-auto">
          <input
            type="checkbox"
            checked={data.priceOnRequest}
            onChange={(e) => {
              onChange("priceOnRequest", e.target.checked);
              if (e.target.checked) onChange("price", "");
            }}
            className="w-5 h-5"
          />
          <span>{t("price.priceOnRequest")}</span>
        </label>
      </div>
    </FormSection>
  );
}
