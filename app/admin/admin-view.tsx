"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminDashboardData, AdminPeriod } from "@/lib/waitlist-admin-data";

const PERIODS: { id: AdminPeriod; label: string }[] = [
  { id: "24h", label: "24 h" },
  { id: "7d", label: "7 j" },
  { id: "30d", label: "30 j" },
  { id: "all", label: "Tout" },
];

function formatPct(value: number | null, sampleTooSmall: boolean): string {
  if (value === null) return "—";
  const base = `${value}%`;
  if (sampleTooSmall) return `${base} · Trop peu de données pour conclure`;
  return base;
}

function FunnelBar({ count, max }: { count: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
    </div>
  );
}

export function AdminView({ data }: { data: AdminDashboardData }) {
  const router = useRouter();
  const maxFunnel = Math.max(...data.funnel.map((s) => s.count), 1);
  const maxDay = Math.max(...data.dailySignups.map((d) => d.count), 1);

  function setPeriod(p: AdminPeriod) {
    router.push(`/admin?period=${p}`);
  }

  async function exportCsv() {
    const res = await fetch("/api/admin/export", { method: "GET", credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paypulss-waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">PayPulss</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Admin · Liste d&apos;attente</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void exportCsv()}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Exporter en CSV
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Site
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Inscrits total" value={data.totals.all} />
          <StatCard label={"Aujourd'hui"} value={data.totals.today} />
          <StatCard label="7 derniers jours" value={data.totals.last7d} />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Entonnoir</h2>
            <div className="flex flex-wrap gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    data.period === p.id
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-6 space-y-5">
            {data.funnel.map((step) => (
              <li key={step.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-slate-200">{step.label}</span>
                  <span className="text-sm tabular-nums text-slate-300">
                    {step.count}
                    {step.fromPrevPct !== null ? (
                      <span className="ml-2 text-xs text-slate-500">
                        {formatPct(step.fromPrevPct, data.sampleTooSmall)}
                      </span>
                    ) : null}
                  </span>
                </div>
                <FunnelBar count={step.count} max={maxFunnel} />
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-sm font-medium text-amber-200">Ouvert la modale sans s&apos;inscrire</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-amber-100">
              {data.abandonedModal.count}{" "}
              <span className="text-sm font-normal text-amber-200/80">
                ({formatPct(data.abandonedModal.pct, data.sampleTooSmall)})
              </span>
            </p>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            Erreurs d&apos;inscription :{" "}
            <span className="font-medium tabular-nums text-slate-200">{data.signupErrors}</span>
          </p>
          {data.sampleTooSmall ? (
            <p className="mt-2 text-xs text-slate-500">
              Moins de 30 événements sur la période : les pourcentages sont indicatifs.
            </p>
          ) : null}
        </section>

        <BreakdownTable
          title="Par source"
          rows={data.bySource.map((r) => ({
            key: r.key,
            a: r.modalOpen,
            b: r.signupSuccess,
            pct: formatPct(r.conversionPct, data.sampleTooSmall),
          }))}
          colA="Modales"
          colB="Inscrits"
          colPct="Conversion"
        />

        <BreakdownTable
          title="Par langue"
          rows={data.byLang.map((r) => ({
            key: r.key,
            a: r.modalOpen,
            b: r.signupSuccess,
            pct: formatPct(r.conversionPct, data.sampleTooSmall),
          }))}
          colA="Modales"
          colB="Inscrits"
          colPct="Conversion"
        />

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Par emplacement CTA</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2 font-medium">Lieu</th>
                  <th className="pb-2 font-medium">Clics</th>
                  <th className="pb-2 font-medium">Modales</th>
                  <th className="pb-2 font-medium">Ouverture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.byCta.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-slate-500">
                      Aucune donnée
                    </td>
                  </tr>
                ) : (
                  data.byCta.map((r) => (
                    <tr key={r.location}>
                      <td className="py-2.5 text-slate-200">{r.location}</td>
                      <td className="py-2.5 tabular-nums">{r.clicks}</td>
                      <td className="py-2.5 tabular-nums">{r.modalOpen}</td>
                      <td className="py-2.5 text-slate-400">
                        {formatPct(r.openPct, data.sampleTooSmall)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Inscriptions (14 jours)</h2>
          <div className="mt-6 flex h-36 items-end gap-1.5 sm:gap-2">
            {data.dailySignups.map((d) => {
              const h = maxDay > 0 ? Math.max(d.count > 0 ? 8 : 2, Math.round((d.count / maxDay) * 100)) : 2;
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] tabular-nums text-slate-500">{d.count || ""}</span>
                  <div
                    className="w-full rounded-t bg-indigo-500/80"
                    style={{ height: `${h}%` }}
                    title={`${d.day}: ${d.count}`}
                  />
                  <span className="text-[9px] text-slate-600">{d.day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">20 derniers inscrits</h2>
          <ul className="mt-4 divide-y divide-slate-800">
            {data.recent.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Aucun inscrit</li>
            ) : (
              data.recent.map((r, i) => (
                <li key={`${r.createdAt}-${i}`} className="flex flex-col gap-0.5 py-3 text-sm sm:flex-row sm:justify-between">
                  <span className="font-medium text-slate-200">{r.maskedEmail}</span>
                  <span className="text-slate-500">
                    {r.langue} · {r.source} · {new Date(r.createdAt).toLocaleString("fr-BE")}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  colA,
  colB,
  colPct,
}: {
  title: string;
  rows: { key: string; a: number; b: number; pct: string }[];
  colA: string;
  colB: string;
  colPct: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Clé</th>
              <th className="pb-2 font-medium">{colA}</th>
              <th className="pb-2 font-medium">{colB}</th>
              <th className="pb-2 font-medium">{colPct}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-slate-500">
                  Aucune donnée
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key}>
                  <td className="py-2.5 text-slate-200">{r.key}</td>
                  <td className="py-2.5 tabular-nums">{r.a}</td>
                  <td className="py-2.5 tabular-nums">{r.b}</td>
                  <td className="py-2.5 text-slate-400">{r.pct}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
