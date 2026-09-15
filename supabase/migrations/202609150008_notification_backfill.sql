begin;
-- Restore pre-notification history without duplicating events or resetting read state.
insert into public.notifications(recipient_id,issue_id,history_id,event_type,created_at)
select i.reporter_id,h.issue_id,h.id,h.to_status::text,h.created_at
from public.status_history h join public.issues i on i.id=h.issue_id
on conflict(history_id) do nothing;
commit;
