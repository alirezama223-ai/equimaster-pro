"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import ContactInquiryForm from "@/app/components/horse/ContactInquiryForm";
import { useFocusTrap } from "@/app/hooks/useFocusTrap";
import { loginRedirectPath } from "@/app/lib/auth/paths";

type BuyerPrefill = {
  buyerName: string;
  buyerEmail: string;
};

type Props = {
  horseName: string;
  listingId: string;
  returnPath: string;
  buyerPrefill?: BuyerPrefill;
  isAuthenticated: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
  fullWidth?: boolean;
};

export default function ContactInquiryModal({
  horseName,
  listingId,
  returnPath,
  buyerPrefill,
  isAuthenticated,
  triggerClassName = "",
  triggerLabel,
  fullWidth = false,
}: Props) {
  const t = useTranslations("horse");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);
  const resolvedTriggerLabel = triggerLabel ?? t("contact.contactSeller");

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleOpen() {
    if (!isAuthenticated) {
      router.push(loginRedirectPath(returnPath));
      return;
    }

    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  const defaultTriggerClass = fullWidth
    ? triggerClassName
      ? "w-full font-semibold transition"
      : "w-full py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
    : "bg-blue-600 px-8 py-4 rounded-xl hover:bg-blue-500 transition text-white font-semibold";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`${defaultTriggerClass} ${triggerClassName}`.trim()}
      >
        {resolvedTriggerLabel}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-xl rounded-3xl bg-[#111C2E] border border-white/10 p-6 sm:p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-inquiry-title"
            aria-describedby="contact-inquiry-description"
          >
            <div className="mb-6">
              <p className="uppercase tracking-[4px] text-blue-500 text-xs font-semibold">
                {t("inquiry.modalEyebrow")}
              </p>
              <h2 id="contact-inquiry-title" className="text-2xl sm:text-3xl font-bold text-white mt-3">
                {t("inquiry.modalTitle", { name: horseName })}
              </h2>
              <p id="contact-inquiry-description" className="mt-3 text-gray-400">
                {t("inquiry.modalSubtitle")}
              </p>
            </div>

            <ContactInquiryForm
              horseName={horseName}
              listingId={listingId}
              buyerPrefill={buyerPrefill}
              returnPath={returnPath}
              onSuccess={() => undefined}
              onCancel={handleClose}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
