"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TurnstileWidgetApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "auto" | "light" | "dark";
      size?: "normal" | "flexible" | "compact";
      action?: string;
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      "timeout-callback"?: () => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidgetApi;
  }
}

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type Props = {
  onToken: (token: string | null) => void;
  action: "login" | "signup" | "password_reset";
};

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(
  function TurnstileWidget({ onToken, action }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
      onTokenRef.current = onToken;
    }, [onToken]);

    const renderWidget = () => {
      if (!siteKey || !scriptReady || !window.turnstile || !containerRef.current) {
        return;
      }

      if (widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "dark",
        size: "flexible",
        action,
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onTokenRef.current(null),
        "expired-callback": () => onTokenRef.current(null),
        "timeout-callback": () => onTokenRef.current(null),
      });
    };

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        onTokenRef.current(null);
      },
    }));

    useEffect(() => {
      renderWidget();

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }, [scriptReady]);

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => {
            setScriptReady(true);
            window.setTimeout(renderWidget, 0);
          }}
        />
        <div
          ref={containerRef}
          className="min-h-[65px] w-full overflow-hidden rounded-xl"
          aria-label="Security verification"
        />
      </>
    );
  }
);

export default TurnstileWidget;
