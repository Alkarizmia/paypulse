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
          marketingHome: "Accueil",
          aboutNav: "À propos",
          contactNav: "Contact",
          legalNav: "Légal",
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
          marketingHome: "Home",
          aboutNav: "About",
          contactNav: "Contact",
          legalNav: "Legal",
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
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:flex-initial">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg text-blue-600 outline-none ring-blue-500/40 focus-visible:ring-2"
          >
            <PayPulseLogo className="h-8 w-8 shrink-0 text-blue-600" />
            <span className="truncate text-sm font-semibold tracking-tight text-slate-900">PayPulss</span>
          </Link>
          {isHome ? (
            <nav className="hidden items-center gap-0.5 md:flex">
              <a
                href="#features"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {t.features}
              </a>
              <a
                href="#demo"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {t.preview}
              </a>
              <a
                href="#pricing"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {t.pricing}
              </a>
              <a
                href="#faq"
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {t.faq}
              </a>
            </nav>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <nav
            className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600"
          >
            {isHome ? (
              <>
                <a href="#features" className="rounded-lg px-1.5 py-1 md:hidden hover:text-slate-900">
                  {t.features}
                </a>
                <a href="#demo" className="rounded-lg px-1.5 py-1 md:hidden hover:text-slate-900">
                  {t.preview}
                </a>
                <a href="#pricing" className="rounded-lg px-1.5 py-1 md:hidden hover:text-slate-900">
                  {t.pricing}
                </a>
                <a href="#faq" className="rounded-lg px-1.5 py-1 md:hidden hover:text-slate-900">
                  {t.faq}
                </a>
              </>
            ) : (
              <>
                <Link href="/" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.marketingHome}
                </Link>
                <Link href="/#features" className="hidden md:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.features}
                </Link>
                <Link href="/#demo" className="hidden md:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.preview}
                </Link>
                <Link href="/#pricing" className="hidden lg:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.pricing}
                </Link>
                <Link href="/#faq" className="hidden xl:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.faq}
                </Link>
                <Link href="/a-propos" className="hidden sm:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.aboutNav}
                </Link>
                <Link href="/contact" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.contactNav}
                </Link>
                <Link href="/legal" className="hidden min-[400px]:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.legalNav}
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.dashboard}
                </Link>
                <Link href="/settings" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.settings}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.dashboard}
                </Link>
                <Link href="/login" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.login}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  {t.cta}
                </Link>
              </>
            )}
          </nav>
          {isAuthenticated && user?.email && (
            <span
              className="max-w-[180px] truncate rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600"
              title={user.email}
            >
              {user.email}
            </span>
          )}
          <div
            className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600"
          >
            <button
              type="button"
              onClick={() => setLocale("fr")}
              className={`px-3 py-1 ${
                locale === "fr" ? "bg-blue-600 text-white" : "hover:bg-slate-50"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-3 py-1 ${
                locale === "en" ? "bg-blue-600 text-white" : "hover:bg-slate-50"
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
