"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FeedbackWidget = dynamic(() => import("@/app/components/feedback/FeedbackWidget"), {
  ssr: false,
  loading: () => null,
});

type Props = {
  isAuthenticated: boolean;
};

export default function LazyFeedbackWidget({ isAuthenticated }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idleCallback = window.requestIdleCallback;
    if (idleCallback) {
      const id = idleCallback(() => setReady(true), { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return null;
  }

  return <FeedbackWidget isAuthenticated={isAuthenticated} />;
}
