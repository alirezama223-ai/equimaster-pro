"use client";

import { copyTextToClipboard } from "@/app/lib/browser-compat";
import { useTranslations } from "next-intl";
import { useState } from "react";
import MarketplaceCardQuickAction from "@/app/components/marketplace/MarketplaceCardQuickAction";

type Props = {
  url: string;
  title: string;
};

export default function MarketplaceCardShareButton({ url, title }: Props) {
  const t = useTranslations("marketplace");
  const [copied, setCopied] = useState(false);

  async function handleShare(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const absoluteUrl = `${window.location.origin}${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: absoluteUrl });
        return;
      } catch {
        // fall through to copy
      }
    }

    const didCopy = await copyTextToClipboard(absoluteUrl);
    if (didCopy) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  const label = copied ? t("share.copied") : t("share.label");

  return (
    <MarketplaceCardQuickAction
      onClick={handleShare}
      aria-label={label}
      title={label}
      className={copied ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : ""}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {copied ? "✓" : "↗"}
      </span>
    </MarketplaceCardQuickAction>
  );
}
