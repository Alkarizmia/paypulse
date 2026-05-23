"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import { useHydrated } from "@/lib/use-hydrated";

type ScrollShiftSectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Sens du glissement (alterner entre sections pour effet « Revolut »). */
  shift?: 1 | -1;
};

function ScrollShiftSectionMotion({
  id,
  className,
  children,
  shift,
}: ScrollShiftSectionProps & { shift: 1 | -1 }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "end 0.08"],
  });
  const x = useTransform(scrollYProgress, [0, 0.42, 1], [22 * shift, 0, -14 * shift]);

  return (
    <motion.section ref={ref} id={id} className={className} style={{ x }}>
      {children}
    </motion.section>
  );
}

/**
 * Déplacement horizontal très léger lié au scroll (transform GPU uniquement).
 * Désactivé si reduced motion ou appareil modeste (RAM).
 */
export function ScrollShiftSection({ id, className, children, shift = 1 }: ScrollShiftSectionProps) {
  const hydrated = useHydrated();
  const reduce = usePreferMinimalMotion();

  if (reduce || !hydrated) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <ScrollShiftSectionMotion id={id} className={className} shift={shift}>
      {children}
    </ScrollShiftSectionMotion>
  );
}
