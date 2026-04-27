"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { useLocale } from "./locale-context";
import { useAuth } from "./auth-context";

export function GlobalTopBar() {
  const { locale, setLocale } = useLocale();
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/") || false;

  const t =
    locale === "fr"
      ? {
          features: "Fonctionnalités",
          preview: "Aperçu",
          pricing: "Tarifs",
          faq: "FAQ",
          cta: "Essai gratuit",
          dashboard: "Dashboard",
          settings: "Paramètres",
          login: "Login",
          logout: "Déconnexion",
          goDashboard: "Aller au dashboard",
        }
      : {
          features: "Features",
          preview: "Preview",
          pricing: "Pricing",
          faq: "FAQ",
          cta: "Try free",
          dashboard: "Dashboard",
          settings: "Settings",
          login: "Login",
          logout: "Logout",
          goDashboard: "Go to dashboard",
        };

  async function handleSignOut() {
    const { error } = await signOut();
    if (!error) {
      router.push("/");
      return;
    }
    window.alert(error);
  }

  if (isDashboard) {
    return null;
  }

  return (
    <div
      className={
        isHome
          ? "sticky top-0 z-50 border-b border-white/10 bg-[#071528]/92 backdrop-blur-md"
          : "sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur"
      }
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:flex-initial">
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 ${
              isHome ? "text-[#3DFF8A] ring-[#3DFF8A]/35" : "text-blue-600 ring-blue-500/40"
            }`}
          >
            <PayPulseLogo className={`h-8 w-8 shrink-0 ${isHome ? "text-[#3DFF8A]" : "text-blue-600"}`} />
            <span className={`truncate text-sm font-semibold tracking-tight ${isHome ? "text-white" : "text-slate-900"}`}>
              PayPulse
            </span>
          </Link>
          {isHome ? (
            <nav className="hidden items-center gap-0.5 md:flex">
              <a
                href="#features"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {t.features}
              </a>
              <a
                href="#demo"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {t.preview}
              </a>
              <a
                href="#pricing"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {t.pricing}
              </a>
              <a
                href="#faq"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {t.faq}
              </a>
            </nav>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <nav
            className={`flex flex-wrap items-center gap-2 text-xs font-medium ${isHome ? "text-slate-300" : "text-slate-600"}`}
          >
            {isHome ? (
              <>
                <a href="#features" className="rounded-lg px-1.5 py-1 md:hidden hover:text-white">
                  {t.features}
                </a>
                <a href="#demo" className="rounded-lg px-1.5 py-1 md:hidden hover:text-white">
                  {t.preview}
                </a>
                <a href="#pricing" className="rounded-lg px-1.5 py-1 md:hidden hover:text-white">
                  {t.pricing}
                </a>
                <a href="#faq" className="rounded-lg px-1.5 py-1 md:hidden hover:text-white">
                  {t.faq}
                </a>
              </>
            ) : null}
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className={isHome ? "rounded-lg px-2 py-1 hover:text-white" : "rounded-lg px-2 py-1 hover:text-slate-900"}>
                  {t.dashboard}
                </Link>
                <Link href="/settings" className={isHome ? "rounded-lg px-2 py-1 hover:text-white" : "rounded-lg px-2 py-1 hover:text-slate-900"}>
                  {t.settings}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isHome
                      ? "border border-white/30 text-white hover:bg-white/10"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={isHome ? "rounded-lg px-2 py-1 hover:text-white" : "rounded-lg px-2 py-1 hover:text-slate-900"}>
                  {t.dashboard}
                </Link>
                <Link href="/login" className={isHome ? "rounded-lg px-2 py-1 hover:text-white" : "rounded-lg px-2 py-1 hover:text-slate-900"}>
                  {t.login}
                </Link>
                <Link
                  href="/signup"
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isHome
                      ? "bg-[#3DFF8A] text-[#041018] hover:bg-[#5cff9e]"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {t.cta}
                </Link>
              </>
            )}
          </nav>
          {isAuthenticated && user?.email && (
            <span
              className={`max-w-[180px] truncate rounded-full px-2 py-1 text-[10px] ${
                isHome ? "bg-white/10 text-slate-200" : "bg-slate-100 text-slate-600"
              }`}
              title={user.email}
            >
              {user.email}
            </span>
          )}
          <div
            className={`inline-flex overflow-hidden rounded-full border text-xs font-semibold ${
              isHome ? "border-white/15 bg-white/5 text-slate-200" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <button
              type="button"
              onClick={() => setLocale("fr")}
              className={`px-3 py-1 ${
                locale === "fr"
                  ? isHome
                    ? "bg-[#3DFF8A] text-[#041018]"
                    : "bg-blue-600 text-white"
                  : isHome
                    ? "hover:bg-white/10"
                    : "hover:bg-slate-50"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-3 py-1 ${
                locale === "en"
                  ? isHome
                    ? "bg-[#3DFF8A] text-[#041018]"
                    : "bg-blue-600 text-white"
                  : isHome
                    ? "hover:bg-white/10"
                    : "hover:bg-slate-50"
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
