"use client";

import { useEffect } from "react";

const HIDDEN_CLASS = "pp-doc-hidden";

/**
 * Quand l’onglet n’est pas visible, le navigateur peut quand même animer les keyframes CSS
 * (marquee landing, hero, etc.), ce qui monopolise le CPU/GPU et fait ramer les autres onglets.
 * On marque l’élément racine `html` pour pauser toutes les animations CSS de la page.
 */
export function PageVisibilityHtmlAttrs() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      root.classList.toggle(HIDDEN_CLASS, document.hidden);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      root.classList.remove(HIDDEN_CLASS);
    };
  }, []);

  return null;
}
