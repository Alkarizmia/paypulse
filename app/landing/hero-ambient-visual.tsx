"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

/** Petites étincelles — positions %, durée s, opacité max */
const SPARKS = [
  { x: 8, y: 18, d: 5.8, s: 0.22 },
  { x: 22, y: 62, d: 4.9, s: 0.18 },
  { x: 78, y: 28, d: 6.2, s: 0.16 },
  { x: 88, y: 72, d: 5.1, s: 0.2 },
  { x: 45, y: 8, d: 4.4, s: 0.14 },
  { x: 62, y: 88, d: 5.5, s: 0.17 },
  { x: 15, y: 88, d: 6.8, s: 0.12 },
  { x: 92, y: 42, d: 4.2, s: 0.15 },
] as const;

/** Lignes courbes multicouleurs — animation CSS sur `stroke-dashoffset` (moins cher que Framer sur le fil JS). Quatre traits seulement pour limiter les couches peintes. */
function HeroColorFlowLines() {
  const paths = [
    {
      d: "M -90 486 C 210 538, 352 298, 612 418 S 968 548, 1310 392",
      dash: "16 132 4 198",
      width: 2.2,
      dur: 26,
      delay: 0,
      grad: "pp-hero-flow-g1",
    },
    {
      d: "M 1280 168 C 940 248, 712 118, 468 278 S 188 508, -80 362",
      dash: "10 168 14 142",
      width: 1.85,
      dur: 22,
      delay: -4,
      grad: "pp-hero-flow-g2",
    },
    {
      d: "M 160 772 C 388 628, 528 758, 718 582 S 1028 298, 1260 468",
      dash: "22 116 8 174",
      width: 2.05,
      dur: 28,
      delay: -7,
      grad: "pp-hero-flow-g3",
    },
    {
      d: "M -40 268 C 228 392, 412 208, 608 332 S 912 442, 1240 276",
      dash: "12 188 18 156",
      width: 1.55,
      dur: 24,
      delay: -2,
      grad: "pp-hero-flow-g4",
    },
  ] as const;

  return (
    <svg
      className="pp-hero-flow-lines-svg absolute left-1/2 top-[38%] z-[1] h-[min(88vh,820px)] w-[min(135%,1500px)] -translate-x-1/2 -translate-y-1/2 overflow-visible opacity-[0.62] [mix-blend-mode:soft-light]"
      viewBox="0 0 1200 780"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="pp-hero-flow-g1" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#34D399" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="pp-hero-flow-g2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.92" />
          <stop offset="55%" stopColor="#f472b6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="pp-hero-flow-g3" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#34D399" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="pp-hero-flow-g4" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#a78bfa" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {paths.map((p, i) => (
        <path
          key={i}
          className="pp-hero-flow-path"
          d={p.d}
          stroke={`url(#${p.grad})`}
          strokeWidth={p.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={p.dash}
          style={{
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </svg>
  );
}

/**
 * Fond hero animé (sans Spline) : mesh, sheen CSS, particules, anneaux SVG,
 * grille + grain. Animations lentes, premium ; désactivées si reduced-motion.
 */
function useHeroMobileCoarse(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return coarse;
}

export function HeroAmbientVisual() {
  const reduce = usePreferMinimalMotion();
  const mobile = useHeroMobileCoarse();

  /** Reduced motion : halos statiques. */
  if (reduce) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.72]"
          style={{
            background:
              "radial-gradient(ellipse 88% 52% at 50% 40%, rgba(37,99,235,0.45), rgba(59,130,246,0.16) 40%, transparent 66%), radial-gradient(ellipse 82% 48% at 50% 14%, rgba(109,40,217,0.22), rgba(139,92,246,0.1) 38%, transparent 58%), radial-gradient(ellipse 68% 42% at 88% 72%, rgba(61,255,138,0.14), transparent 54%)",
          }}
        />
      </div>
    );
  }

  /**
   * Mobile : un seul layer aurora CSS doux (transform + opacity uniquement).
   * On retire le second layer, le mix-blend-mode et la couche "color lines"
   * pour éliminer les saccades de scroll/navigation sur appareils tactiles.
   */
  if (mobile) {
    return (
      <div className="pp-hero-mobile-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="pp-hero-mobile-ambient-layer pp-hero-mobile-ambient-layer--a absolute rounded-[48%]" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Halo bleu / indigo central — lecture « premium » type agence */}
      <motion.div
        className="absolute left-1/2 top-[40%] h-[min(95vmin,920px)] w-[min(110vmin,1040px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(59,130,246,0.58) 0%, rgba(37,99,235,0.28) 28%, rgba(30,58,138,0.12) 48%, transparent 68%)",
          filter: "blur(48px)",
        }}
        animate={{
          opacity: [0.68, 0.98, 0.78, 0.92, 0.68],
          scale: [1, 1.04, 0.98, 1.02, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Flux de couleur large (CSS) */}
      <div
        className="pp-hero-gradient-flow absolute inset-[-25%] opacity-[0.44]"
        style={{
          backgroundImage:
            "linear-gradient(118deg, rgba(109,40,217,0.55) 0%, transparent 26%, rgba(61,255,138,0.32) 42%, transparent 56%, rgba(56,189,248,0.38) 72%, rgba(167,139,250,0.32) 88%, transparent 100%)",
          filter: "blur(1px)",
        }}
      />

      <HeroColorFlowLines />

      {/* Blobs volumétriques — mouvements plus lisibles */}
      <motion.div
        className="absolute -left-[18%] top-[-8%] h-[min(78%,620px)] w-[min(78vw,620px)] rounded-full"
        style={{
          background: "radial-gradient(circle at 42% 42%, rgba(167,139,250,0.62), rgba(109,40,217,0.22) 48%, transparent 68%)",
          filter: "blur(72px)",
        }}
        animate={{
          x: [0, 48, -28, 12, 0],
          y: [0, 28, 18, -8, 0],
          opacity: [0.34, 0.52, 0.4, 0.46, 0.34],
          scale: [1, 1.1, 0.94, 1.04, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[12%] top-[18%] h-[min(62%,520px)] w-[min(65vw,520px)] rounded-full"
        style={{
          background: "radial-gradient(circle at 48% 48%, rgba(61,255,138,0.46), rgba(52,211,153,0.18) 42%, transparent 65%)",
          filter: "blur(64px)",
        }}
        animate={{
          x: [0, -40, 24, -12, 0],
          y: [0, 22, -14, 16, 0],
          opacity: [0.26, 0.46, 0.34, 0.4, 0.26],
          scale: [1.06, 0.92, 1.08, 1, 1.06],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: -3 }}
      />
      <motion.div
        className="absolute bottom-[-8%] left-1/2 h-[min(50%,420px)] w-[min(90vw,720px)] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(56,189,248,0.34), rgba(139,92,246,0.22) 45%, transparent 62%)",
          filter: "blur(70px)",
        }}
        animate={{
          opacity: [0.24, 0.42, 0.32, 0.38, 0.24],
          scale: [1, 1.12, 0.96, 1.06, 1],
          x: ["-50%", "-48%", "-52%", "-50%"],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: -1.5 }}
      />

      {/* Sheen traversant (CSS) */}
      <div
        className="pp-hero-sheen absolute left-1/2 top-[32%] h-[140%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), rgba(196,181,253,0.2), transparent)",
          filter: "blur(20px)",
        }}
      />
      <div
        className="pp-hero-sheen pp-hero-sheen--delayed absolute left-1/2 top-[58%] h-[90%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(61,255,138,0.12), transparent)",
          filter: "blur(16px)",
        }}
      />

      {/* Faisceaux diagonaux — rotation + opacité */}
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[min(140vw,1400px)] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(118deg, transparent 38%, rgba(251,146,60,0.55) 49%, rgba(244,114,182,0.38) 51.5%, transparent 62%)",
        }}
        animate={{ rotate: [-4, 8, -2, -4], opacity: [0.1, 0.22, 0.14, 0.1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[min(120vw,1100px)] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(72deg, transparent 40%, rgba(167,139,250,0.62) 50%, rgba(61,255,138,0.38) 52%, transparent 64%)",
        }}
        animate={{ rotate: [2, -10, 4, 2], opacity: [0.09, 0.2, 0.12, 0.09] }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut", delay: -6 }}
      />

      {/* Particules flottantes */}
      {SPARKS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white shadow-[0_0_10px_rgba(167,139,250,0.45)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s * 14,
            height: p.s * 14,
          }}
          animate={{
            opacity: [p.s * 0.35, p.s * 1.1, p.s * 0.45, p.s * 0.9, p.s * 0.35],
            y: [0, -14, 4, -8, 0],
            scale: [1, 1.25, 1, 1.15, 1],
          }}
          transition={{
            duration: p.d,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.35,
          }}
        />
      ))}

      {/* Anneaux SVG — rotation + pulsation */}
      <svg
        className="absolute left-1/2 top-[42%] h-[min(70vmin,520px)] w-[min(70vmin,520px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.3]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <defs>
          <linearGradient id="pp-hero-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#34D399" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <motion.g
          style={{ transformOrigin: "200px 200px" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
        >
          <motion.circle
            cx="200"
            cy="200"
            r="168"
            fill="none"
            stroke="url(#pp-hero-ring)"
            strokeWidth="1.25"
            animate={{ strokeOpacity: [0.38, 0.68, 0.44, 0.6, 0.38] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
        <motion.g
          style={{ transformOrigin: "200px 200px" }}
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 72, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="200" cy="200" r="148" stroke="rgba(61,255,138,0.18)" strokeWidth="1" strokeDasharray="6 14" />
        </motion.g>
        <motion.circle
          cx="200"
          cy="200"
          r="122"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          animate={{ strokeOpacity: [0.06, 0.18, 0.08, 0.14, 0.06] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: -2 }}
        />
      </svg>

      {/* Grain + grille (CSS animés) */}
      <div
        className="pp-hero-noise-breathe absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />
      <div
        className="pp-hero-grid-drift absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(100,116,139,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.11) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 78% 72% at 50% 38%, black 12%, transparent 74%)",
        }}
      />
    </div>
  );
}
