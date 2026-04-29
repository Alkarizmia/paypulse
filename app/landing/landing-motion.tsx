"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const STAR_PRESETS = [
  { x: 6, y: 12, s: 0.45, d: 4.2, o: 0.12 },
  { x: 14, y: 28, s: 0.35, d: 5.1, o: 0.18 },
  { x: 22, y: 8, s: 0.5, d: 3.6, o: 0.14 },
  { x: 31, y: 42, s: 0.4, d: 4.8, o: 0.16 },
  { x: 38, y: 18, s: 0.32, d: 5.4, o: 0.1 },
  { x: 47, y: 55, s: 0.48, d: 3.9, o: 0.15 },
  { x: 55, y: 22, s: 0.38, d: 4.5, o: 0.13 },
  { x: 63, y: 68, s: 0.42, d: 5.7, o: 0.11 },
  { x: 71, y: 38, s: 0.36, d: 4.1, o: 0.17 },
  { x: 79, y: 14, s: 0.44, d: 3.7, o: 0.12 },
  { x: 88, y: 48, s: 0.33, d: 5.2, o: 0.14 },
  { x: 92, y: 72, s: 0.4, d: 4.4, o: 0.1 },
  { x: 11, y: 62, s: 0.37, d: 4.9, o: 0.09 },
  { x: 29, y: 78, s: 0.46, d: 3.8, o: 0.13 },
  { x: 52, y: 6, s: 0.34, d: 5.5, o: 0.11 },
  { x: 68, y: 88, s: 0.41, d: 4.3, o: 0.15 },
  { x: 84, y: 32, s: 0.39, d: 4.6, o: 0.12 },
  { x: 95, y: 18, s: 0.36, d: 5.0, o: 0.1 },
  { x: 18, y: 88, s: 0.43, d: 4.0, o: 0.14 },
  { x: 41, y: 92, s: 0.35, d: 5.3, o: 0.09 },
] as const;

/** Very subtle starfield / paillettes — landing background only */
export function LandingStarfield() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {STAR_PRESETS.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white shadow-[0_0_6px_rgba(167,139,250,0.35)]"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.s * 2.25,
            height: dot.s * 2.25,
          }}
          initial={{ opacity: dot.o * 0.35 }}
          animate={{
            opacity: [dot.o * 0.35, dot.o * 1.05, dot.o * 0.45, dot.o * 0.9, dot.o * 0.35],
            scale: [1, 1.15, 1, 1.08, 1],
          }}
          transition={{
            duration: dot.d,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Scroll-in: fade + slight rise */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-56px 0px -24px 0px" }}
      transition={{ duration: 0.52, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Halo type « aile » / aurora derrière le hero — animation continue (violet + accent),
 * léger et non intrusif. Aucun hook tiers.
 */
export function HeroWingAurora() {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-[4vh] h-[min(78vh,640px)] w-[min(920px,135vw)] -translate-x-1/2 rounded-[44%] opacity-[0.38]"
          style={{
            background:
              "radial-gradient(ellipse 68% 46% at 50% 48%, rgba(139,92,246,0.22) 0%, rgba(61,255,138,0.08) 48%, transparent 72%)",
            filter: "blur(56px)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Aile principale — violet / indigo */}
      <div className="absolute left-1/2 top-[2vh] flex w-[min(960px,140vw)] -translate-x-1/2 justify-center sm:top-0">
        <motion.div
          className="relative h-[min(82vh,700px)] w-full max-w-[920px]"
          style={{ transformOrigin: "50% 42%" }}
        >
          <motion.div
            className="absolute inset-[-8%] rounded-[42%]"
            style={{
              background:
                "radial-gradient(ellipse 72% 44% at 50% 46%, rgba(167,139,250,0.34) 0%, rgba(109,40,217,0.14) 42%, rgba(15,23,42,0) 70%)",
              filter: "blur(52px)",
              transformOrigin: "50% 48%",
            }}
            animate={{
              rotate: [-9, 11, -7, 9, -9],
              scale: [0.9, 1.08, 0.94, 1.04, 0.9],
              opacity: [0.32, 0.48, 0.36, 0.44, 0.32],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* Contre-aile — accent vert PayPulse, phase décalée */}
      <div className="absolute left-1/2 top-[10vh] flex w-[min(780px,120vw)] -translate-x-1/2 justify-center sm:top-[6vh]">
        <motion.div
          className="relative h-[min(58vh,480px)] w-full max-w-[760px]"
          style={{ transformOrigin: "52% 55%" }}
        >
          <motion.div
            className="absolute inset-[-12%] rounded-[48%] mix-blend-screen"
            style={{
              background:
                "radial-gradient(ellipse 58% 38% at 48% 52%, rgba(61,255,138,0.22) 0%, rgba(52,211,153,0.1) 38%, transparent 68%)",
              filter: "blur(44px)",
              transformOrigin: "48% 52%",
            }}
            animate={{
              rotate: [8, -12, 6, -8, 8],
              scale: [1.04, 0.9, 1.02, 0.95, 1.04],
              opacity: [0.18, 0.34, 0.22, 0.3, 0.18],
            }}
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: -3 }}
          />
        </motion.div>
      </div>

      {/* Noyau très doux au centre — pulse lent */}
      <motion.div
        className="absolute left-1/2 top-[22vh] h-[min(42vh,360px)] w-[min(520px,90vw)] -translate-x-1/2 rounded-full sm:top-[18vh]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(196,181,253,0.12) 0%, rgba(61,255,138,0.06) 35%, transparent 62%)",
          filter: "blur(36px)",
        }}
        animate={{
          scale: [1, 1.12, 0.96, 1.08, 1],
          opacity: [0.35, 0.55, 0.4, 0.5, 0.35],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: -1.5 }}
      />
    </div>
  );
}

/** Pulsing soft glow under hero headline */
export function HeroHeadlineGlow() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="pointer-events-none absolute left-[-10%] right-[-10%] top-[68%] z-0 h-40 sm:h-44"
      aria-hidden
      initial={false}
      animate={
        reduce
          ? { opacity: 0.78, scale: 1 }
          : {
              opacity: [0.7, 0.92, 0.74, 0.88, 0.72],
              scale: [1, 1.04, 1.01, 1.03, 1],
            }
      }
      transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        background:
          "radial-gradient(ellipse 88% 58% at 50% 0%, rgba(61, 255, 138, 0.24), rgba(139, 92, 246, 0.12) 45%, transparent 72%)",
        filter: "blur(22px)",
      }}
    />
  );
}

const BRAND = "PayPulse";

/** Kicker line — word stagger with Framer Motion */
export function MotionKicker({ text, className }: { text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  const reduce = useReducedMotion();
  if (reduce) return <p className={className}>{text}</p>;
  return (
    <p className={className}>
      {words.map((w, i) => (
        <span key={`${i}-${w}`} className="inline">
          {i > 0 ? "\u00a0" : null}
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.052, duration: 0.44, ease: EASE }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </p>
  );
}

/** Hero title: animated gradient on PayPulse + letter stagger on remainder */
export function MotionHeroTitle({
  title,
  className,
}: {
  title: string;
  className: string;
}) {
  const reduce = useReducedMotion();
  const hasBrand = title.startsWith(BRAND);
  const tail = hasBrand ? title.slice(BRAND.length).trimStart() : title;

  if (reduce) {
    return (
      <h1 className={className} aria-label={title}>
        {title}
      </h1>
    );
  }

  const tailChars = Array.from(tail);
  let idx = 0;

  return (
    <h1 className={className} aria-label={title}>
      <span className="block max-w-xl ps-[0.12em] text-balance">
        {hasBrand ? (
          <>
            <motion.span
              className="inline-block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #ddd6fe, #e9d5ff, #c4b5fd, #f0abfc, #a78bfa, #ddd6fe)",
                backgroundSize: "240% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)", backgroundPosition: "0% 50%" }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                opacity: { duration: 0.55, ease: EASE },
                y: { duration: 0.55, ease: EASE },
                filter: { duration: 0.55, ease: EASE },
                backgroundPosition: { duration: 7, repeat: Infinity, ease: "linear", delay: 0.35 },
              }}
            >
              {BRAND}
            </motion.span>
            {tailChars.length > 0 ? <span className="inline">&nbsp;</span> : null}
          </>
        ) : null}
        {tailChars.map((ch, i) => {
          const delay = (hasBrand ? 0.16 : 0) + idx++ * 0.022;
          const isSpace = ch === " ";
          return (
            <motion.span
              key={`${i}-${ch}`}
              className={isSpace ? "inline" : "inline-block"}
              initial={{ opacity: 0, y: 10, filter: "blur(7px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay, duration: 0.36, ease: EASE }}
            >
              {isSpace ? "\u00a0" : ch}
            </motion.span>
          );
        })}
      </span>
    </h1>
  );
}

/** Gentle vertical float for mockups (replaces CSS pp-float) */
export function SoftFloat({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Stronger float for dashboard preview */
export function SoftFloatDashboard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
