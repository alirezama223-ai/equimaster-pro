"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Skip animation for above-the-fold / LCP content. */
  immediate?: boolean;
};

export default function FadeUp({ children, immediate = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) {
      return;
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <div ref={ref} className={visible ? "fade-up fade-up-visible" : "fade-up"}>
      {children}
    </div>
  );
}
