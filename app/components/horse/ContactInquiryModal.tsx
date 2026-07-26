"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ContactInquiryForm from "@/app/components/horse/ContactInquiryForm";

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
  triggerLabel = "Contact Seller",
  fullWidth = false,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function handleOpen() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }

    setIsOpen(true);
  }

  const defaultTriggerClass = fullWidth
    ? "w-full py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
    : "bg-blue-600 px-8 py-4 rounded-xl hover:bg-blue-500 transition text-white font-semibold";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`${defaultTriggerClass} ${triggerClassName}`.trim()}
      >
        {triggerLabel}
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-[#111C2E] border border-white/10 p-6 sm:p-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-inquiry-title"
          >
            <div className="mb-6">
              <p className="uppercase tracking-[4px] text-blue-500 text-xs font-semibold">
                Contact Seller
              </p>
              <h2 id="contact-inquiry-title" className="text-2xl sm:text-3xl font-bold text-white mt-3">
                Contact seller about {horseName}
              </h2>
              <p className="mt-3 text-gray-400">
                Send a private inquiry. Your contact details are shared only with
                the seller.
              </p>
            </div>

            <ContactInquiryForm
              horseName={horseName}
              listingId={listingId}
              buyerPrefill={buyerPrefill}
              returnPath={returnPath}
              onSuccess={() => undefined}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
