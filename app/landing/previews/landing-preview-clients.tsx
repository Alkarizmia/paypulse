"use client";

import { ClientList } from "@/app/dashboard/client-list";
import { LandingPreviewShell } from "@/app/landing/landing-preview-shell";
import type { AppLocale } from "@/lib/app-locale";
import { intlLocaleFor } from "@/lib/app-locale";
import { LANDING_DEMO_CLIENTS } from "@/lib/landing-demo-clients";
import { getDashboardViewCopy } from "@/lib/messages/dashboard-view-copy";
import type { UiResolvedAppearance } from "@/lib/ui-theme";

const noop = () => {};

export function LandingPreviewClients({
  locale,
  appearance,
  onToggleAppearance,
  frameClassName,
}: {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onToggleAppearance: () => void;
  frameClassName?: string;
}) {
  const c = getDashboardViewCopy(locale);

  return (
    <LandingPreviewShell
      locale={locale}
      appearance={appearance}
      onToggleAppearance={onToggleAppearance}
      windowTitle={`PayPulss · ${c.clientsTitle}`}
      frameClassName={frameClassName}
    >
      <div className="p-3 sm:p-4">
        <ClientList
          clients={LANDING_DEMO_CLIENTS}
          appearance={appearance}
          formatLocale={intlLocaleFor(locale)}
          compact
          onSendReminder={noop}
          onDelete={noop}
          onMarkPaid={noop}
          labels={{
            title: c.clientsTitle,
            subtitle: c.clientsSubtitle,
            emptyTitle: c.emptyTitle,
            emptyBody: c.emptyBody,
            paid: c.paid,
            unpaid: c.unpaid,
            due: c.due,
            remind: c.remind,
            delete: c.remove,
            markPaid: c.markPaid,
            nextCycle: c.nextCycle,
          }}
        />
      </div>
    </LandingPreviewShell>
  );
}
