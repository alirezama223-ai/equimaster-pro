/**
 * Copy text with Clipboard API when available, falling back to execCommand
 * for Firefox private mode, older Safari, and non-secure contexts.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy copy.
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export const SAFE_AREA_PADDING_STYLE = {
  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
  paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
} as const;

export const SAFE_AREA_BOTTOM_PADDING_STYLE = {
  paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
} as const;
