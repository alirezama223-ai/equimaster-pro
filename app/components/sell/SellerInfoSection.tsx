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

export default function SellerInfoSection({ data, errors, onChange }: Props) {
  const t = useTranslations("sell");

  return (
    <FormSection title={t("sellerInfo.title")} subtitle={t("sellerInfo.subtitle")}>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label={t("sellerInfo.sellerName")}
          htmlFor="sellerName"
          error={errors.sellerName}
          required
        >
          <input
            id="sellerName"
            value={data.sellerName}
            onChange={(e) => onChange("sellerName", e.target.value)}
            className={sellInputClassName}
            placeholder={t("sellerInfo.sellerNamePlaceholder")}
          />
        </FormField>

        <FormField label={t("sellerInfo.email")} htmlFor="email" error={errors.email} required>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={sellInputClassName}
            placeholder={t("sellerInfo.emailPlaceholder")}
          />
        </FormField>

        <FormField label={t("sellerInfo.phone")} htmlFor="phone" error={errors.phone} required>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={sellInputClassName}
            placeholder={t("sellerInfo.phonePlaceholder")}
          />
        </FormField>

        <FormField label={t("sellerInfo.stable")} htmlFor="stableName">
          <input
            id="stableName"
            value={data.stableName}
            onChange={(e) => onChange("stableName", e.target.value)}
            className={sellInputClassName}
            placeholder={t("sellerInfo.stablePlaceholder")}
          />
        </FormField>
      </div>
    </FormSection>
  );
}
