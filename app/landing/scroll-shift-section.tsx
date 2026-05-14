"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

type ScrollShiftSectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
  /** Sens du glissement (alterner entre sections pour effet « Revolut »). */
  shift?: 1 | -1;
};

/**
 * Déplacement horizontal très léger lié au scroll (transform GPU uniquement).
 * Désactivé si reduced motion ou appareil modeste (RAM).
 */
export function ScrollShiftSection({ id, className, children, shift = 1 }: ScrollShiftSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = usePreferMinimalMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "end 0.08"],
  });
  const x = useTransform(scrollYProgress, [0, 0.42, 1], [22 * shift, 0, -14 * shift]);

  if (reduce) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }

  return (
    <motion.section ref={ref} id={id} className={className} style={{ x }}>
      {children}
    </motion.section>
  );
}
