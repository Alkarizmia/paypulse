"use client";

import { useMoney } from "@/app/display-currency-context";

type DashboardStatsProps = {
  clientCount: number;
  totalAmountDue: number;
  paidCount: number;
  unpaidCount: number;
  paymentRate: number;
};

export function DashboardStats({
  clientCount,
  totalAmountDue,
  paidCount,
  unpaidCount,
  paymentRate,
}: DashboardStatsProps) {
  const money = useMoney();
  const items = [
    {
      label: "Clients totaux",
      value: String(clientCount),
      hint: "Tous vos clients",
      accent: "text-blue-600 dark:text-sky-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.813-4.003M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>
      ),
    },
    {
      label: "Montant total à recevoir",
      value: money.format(totalAmountDue),
      hint: "Somme des factures",
      accent: "text-violet-600 dark:text-violet-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M2.25 8.25h19.5m-18 7.5h15a1.5 1.5 0 0 0 1.5-1.5V6.75a1.5 1.5 0 0 0-1.5-1.5h-15a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5Zm0 0v2.25m15-2.25v2.25"
          />
        </svg>
      ),
    },
    {
      label: "Factures payées / impayées",
      value: `${paidCount} / ${unpaidCount}`,
      hint: "Etat du portefeuille",
      accent: "text-emerald-600 dark:text-emerald-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
    {
      label: "Taux de paiement",
      value: `${paymentRate}%`,
      hint: "Factures payées",
      accent: "text-amber-600 dark:text-amber-400",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M3 3v1.5m0 0V21h16.5m-6-12 3 3-6 6-3-3"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="pp-rise grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="pp-dashboard-card-interactive relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-white/5 hover:border-slate-300 dark:hover:border-slate-600"
        >
          <div className={`mb-3 inline-flex rounded-lg bg-slate-50 p-2 dark:bg-slate-800/80 ${item.accent}`}>{item.icon}</div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{item.value}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}
