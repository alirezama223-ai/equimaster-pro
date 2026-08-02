"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  url: string;
  title: string;
};

export default function ShareListingButton({ url, title }: Props) {
  const t = useTranslations("marketplace");
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const absoluteUrl = `${window.location.origin}${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: absoluteUrl });
        return;
      } catch {
        // fall through to copy
      }
    }

    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full py-4 rounded-xl border border-white/30 hover:bg-white/10 transition font-semibold"
    >
      {copied ? t("share.copied") : t("share.label")}
    </button>
  );
}
