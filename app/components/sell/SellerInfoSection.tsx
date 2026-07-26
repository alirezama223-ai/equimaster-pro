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
  return (
    <FormSection
      title="Seller Information"
      subtitle="Buyers will use these details to contact you about the horse."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Seller Name"
          htmlFor="sellerName"
          error={errors.sellerName}
          required
        >
          <input
            id="sellerName"
            value={data.sellerName}
            onChange={(e) => onChange("sellerName", e.target.value)}
            className={sellInputClassName}
            placeholder="Your full name"
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email} required>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={sellInputClassName}
            placeholder="seller@example.com"
          />
        </FormField>

        <FormField label="Phone" htmlFor="phone" error={errors.phone} required>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className={sellInputClassName}
            placeholder="+49 ..."
          />
        </FormField>

        <FormField label="Stable / Company (Optional)" htmlFor="stableName">
          <input
            id="stableName"
            value={data.stableName}
            onChange={(e) => onChange("stableName", e.target.value)}
            className={sellInputClassName}
            placeholder="Stable or company name"
          />
        </FormField>
      </div>
    </FormSection>
  );
}
