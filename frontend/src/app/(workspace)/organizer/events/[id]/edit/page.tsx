"use client";

import { useParams } from "next/navigation";
import { EventForm } from "../../../../../../components/EventForm";
import { ErrorState, LoadingState, PageHeader } from "../../../../../../components/ui";
import * as api from "../../../../../../lib/api";
import { useResource } from "../../../../../../lib/useResource";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, reload } = useResource(() => api.getOrganizerEvent(id));

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <LoadingState />;

  return (
    <div className="form-page">
      <PageHeader title="Edit event" description={data.event.title} />
      <EventForm event={data.event} />
    </div>
  );
}
