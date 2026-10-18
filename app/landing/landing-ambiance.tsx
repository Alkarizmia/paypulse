"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Emplacement photo ambiance (freelance au téléphone).
 * Affiche un placeholder tant que /ambiance-freelance.jpg est absent.
 */
export function LandingAmbiance() {
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setHasImage(true);
    };
    img.onerror = () => {
      if (!cancelled) setHasImage(false);
    };
    img.src = "/ambiance-freelance.jpg";
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="pp-ambiance px-4 py-12 sm:px-6 sm:py-16" aria-label="Ambiance">
      <div className="pp-ambiance-frame mx-auto max-w-3xl overflow-hidden rounded-2xl">
        {hasImage ? (
          <Image
            src="/ambiance-freelance.jpg"
            alt="Personne concentrée regardant son téléphone dans un bureau le soir"
            width={1200}
            height={750}
            className="pp-ambiance-img h-auto w-full object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        ) : (
          <div className="pp-ambiance-placeholder" aria-hidden>
            <span className="pp-ambiance-placeholder-mark" />
          </div>
        )}
        <div className="pp-ambiance-veil" aria-hidden />
      </div>
    </section>
  );
}
