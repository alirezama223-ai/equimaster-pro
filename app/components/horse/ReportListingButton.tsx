"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { memo, useCallback, useState } from "react";
import FeedbackModal from "@/app/components/feedback/FeedbackModal";
import { detectBrowserName, detectOperatingSystem } from "@/app/lib/feedback/client-env";
import { loginRedirectPath } from "@/app/lib/auth/paths";

type Props = {
  isAuthenticated: boolean;
  returnPath: string;
  listingName: string;
  className?: string;
};

function ReportListingButton({
  isAuthenticated,
  returnPath,
  listingName,
  className = "",
}: Props) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    if (!isAuthenticated) {
      router.push(loginRedirectPath(returnPath));
      return;
    }
    setIsOpen(true);
  }, [isAuthenticated, returnPath, router]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Report listing: ${listingName}`}
        title="Report listing"
        className={className}
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ⚑
        </span>
      </button>

      {isOpen ? (
        <FeedbackModal
          pagePath={pathname}
          browser={detectBrowserName()}
          os={detectOperatingSystem()}
          locale={locale}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}

export default memo(ReportListingButton);
