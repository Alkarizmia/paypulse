-- Événement d’audit quand une fiche client est ignorée (même e-mail + même créneau qu’une autre fiche).

alter table public.reminder_events
  drop constraint if exists reminder_events_event_type_check;

alter table public.reminder_events
  add constraint reminder_events_event_type_check
  check (
    event_type in (
      'queued',
      'processing',
      'sent',
      'failed',
      'skipped_paid',
      'skipped_not_due',
      'retry_scheduled',
      'skipped_duplicate_email'
    )
  );
