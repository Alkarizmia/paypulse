"use client";

import { motion, useReducedMotion } from "framer-motion";

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

/**
 * Fond hero animé (sans Spline) : mesh, sheen CSS, particules, anneaux SVG,
 * grille + grain. Animations lentes, premium ; désactivées si reduced-motion.
 */
export function HeroAmbientVisual() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 90% 55% at 50% 42%, rgba(37,99,235,0.28), rgba(30,64,175,0.08) 45%, transparent 62%), radial-gradient(ellipse 85% 50% at 50% 18%, rgba(139,92,246,0.16), transparent 58%), radial-gradient(ellipse 70% 45% at 85% 75%, rgba(61,255,138,0.08), transparent 55%)",
          }}
        />
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
            "radial-gradient(ellipse at 50% 45%, rgba(59,130,246,0.42) 0%, rgba(37,99,235,0.2) 28%, rgba(30,58,138,0.08) 48%, transparent 68%)",
          filter: "blur(48px)",
        }}
        animate={{
          opacity: [0.55, 0.85, 0.62, 0.78, 0.55],
          scale: [1, 1.04, 0.98, 1.02, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Flux de couleur large (CSS) */}
      <div
        className="pp-hero-gradient-flow absolute inset-[-25%] opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(118deg, rgba(109,40,217,0.45) 0%, transparent 28%, rgba(61,255,138,0.22) 42%, transparent 58%, rgba(56,189,248,0.28) 72%, rgba(167,139,250,0.2) 88%, transparent 100%)",
          filter: "blur(1px)",
        }}
      />

      {/* Blobs volumétriques — mouvements plus lisibles */}
      <motion.div
        className="absolute -left-[18%] top-[-8%] h-[min(78%,620px)] w-[min(78vw,620px)] rounded-full"
        style={{
          background: "radial-gradient(circle at 42% 42%, rgba(167,139,250,0.5), rgba(109,40,217,0.14) 48%, transparent 68%)",
          filter: "blur(72px)",
        }}
        animate={{
          x: [0, 48, -28, 12, 0],
          y: [0, 28, 18, -8, 0],
          opacity: [0.22, 0.38, 0.28, 0.32, 0.22],
          scale: [1, 1.1, 0.94, 1.04, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[12%] top-[18%] h-[min(62%,520px)] w-[min(65vw,520px)] rounded-full"
        style={{
          background: "radial-gradient(circle at 48% 48%, rgba(61,255,138,0.34), rgba(52,211,153,0.12) 42%, transparent 65%)",
          filter: "blur(64px)",
        }}
        animate={{
          x: [0, -40, 24, -12, 0],
          y: [0, 22, -14, 16, 0],
          opacity: [0.16, 0.32, 0.22, 0.28, 0.16],
          scale: [1.06, 0.92, 1.08, 1, 1.06],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: -3 }}
      />
      <motion.div
        className="absolute bottom-[-8%] left-1/2 h-[min(50%,420px)] w-[min(90vw,720px)] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(56,189,248,0.22), rgba(139,92,246,0.14) 45%, transparent 62%)",
          filter: "blur(70px)",
        }}
        animate={{
          opacity: [0.14, 0.28, 0.18, 0.24, 0.14],
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
        animate={{ rotate: [-4, 8, -2, -4], opacity: [0.06, 0.14, 0.09, 0.06] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[min(120vw,1100px)] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "linear-gradient(72deg, transparent 40%, rgba(167,139,250,0.55) 50%, rgba(61,255,138,0.3) 52%, transparent 64%)",
        }}
        animate={{ rotate: [2, -10, 4, 2], opacity: [0.05, 0.12, 0.07, 0.05] }}
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
        className="absolute left-1/2 top-[42%] h-[min(70vmin,520px)] w-[min(70vmin,520px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.18]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <defs>
          <linearGradient id="pp-hero-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#3DFF8A" stopOpacity="0.55" />
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
            animate={{ strokeOpacity: [0.28, 0.55, 0.32, 0.5, 0.28] }}
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
        className="pp-hero-grid-drift absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 78% 72% at 50% 38%, black 12%, transparent 74%)",
        }}
      />
    </div>
  );
}
