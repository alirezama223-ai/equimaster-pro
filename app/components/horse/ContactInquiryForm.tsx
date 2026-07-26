"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInquiry } from "@/app/actions/inquiries";
import {
  buildDefaultInquiryMessage,
  INQUIRY_MESSAGE_MAX,
  InquiryFormData,
  InquiryFormErrors,
} from "@/app/types/inquiry";
import {
  validateInquiryForm,
} from "@/app/lib/inquiry-validation";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horseName: string;
  listingId: string;
  buyerPrefill?: BuyerPrefill;
  returnPath: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ContactInquiryForm({
  horseName,
  listingId,
  buyerPrefill,
  returnPath,
  onSuccess,
  onCancel,
}: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<InquiryFormData>(() => ({
    buyerName: buyerPrefill?.buyerName ?? "",
    buyerEmail: buyerPrefill?.buyerEmail ?? "",
    buyerPhone: "",
    message: buildDefaultInquiryMessage(horseName),
  }));
  const [errors, setErrors] = useState<InquiryFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function updateField<K extends keyof InquiryFormData>(
    field: K,
    value: InquiryFormData[K]
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isSuccess) return;

    const nextErrors = validateInquiryForm(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await createInquiry(listingId, formData);

      if (result.unauthenticated) {
        router.push(`/login?next=${encodeURIComponent(returnPath)}`);
        return;
      }

      if (result.error) {
        setFormError(result.error);
        return;
      }

      setIsSuccess(true);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-6">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-white">Inquiry sent successfully</h3>
        <p className="mt-3 text-gray-400 leading-7">
          Your message about <strong className="text-white">{horseName}</strong>{" "}
          has been sent to the seller. They can review it in their account
          dashboard.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-8 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="buyerName" className="block text-sm font-medium text-gray-300 mb-2">
          Name
        </label>
        <input
          id="buyerName"
          type="text"
          value={formData.buyerName}
          onChange={(event) => updateField("buyerName", event.target.value)}
          className="w-full rounded-xl bg-[#08111F] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="Your name"
        />
        {errors.buyerName ? (
          <p className="mt-2 text-sm text-red-400">{errors.buyerName}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="buyerEmail" className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          id="buyerEmail"
          type="email"
          value={formData.buyerEmail}
          onChange={(event) => updateField("buyerEmail", event.target.value)}
          className="w-full rounded-xl bg-[#08111F] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="you@example.com"
        />
        {errors.buyerEmail ? (
          <p className="mt-2 text-sm text-red-400">{errors.buyerEmail}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="buyerPhone" className="block text-sm font-medium text-gray-300 mb-2">
          Phone <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="buyerPhone"
          type="tel"
          value={formData.buyerPhone}
          onChange={(event) => updateField("buyerPhone", event.target.value)}
          className="w-full rounded-xl bg-[#08111F] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="+31 6 12345678"
        />
        {errors.buyerPhone ? (
          <p className="mt-2 text-sm text-red-400">{errors.buyerPhone}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          value={formData.message}
          onChange={(event) => updateField("message", event.target.value)}
          maxLength={INQUIRY_MESSAGE_MAX}
          className="w-full rounded-xl bg-[#08111F] border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-y"
        />
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>{errors.message ? null : "You can edit the suggested message."}</span>
          <span>
            {formData.message.length}/{INQUIRY_MESSAGE_MAX}
          </span>
        </div>
        {errors.message ? (
          <p className="mt-2 text-sm text-red-400">{errors.message}</p>
        ) : null}
      </div>

      {formError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition"
        >
          {isSubmitting ? "Sending Inquiry..." : "Send Inquiry"}
        </button>
      </div>
    </form>
  );
}
