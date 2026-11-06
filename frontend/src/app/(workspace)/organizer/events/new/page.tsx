import { EventForm } from "../../../../../components/EventForm";
import { PageHeader } from "../../../../../components/ui";

export default function NewEventPage() {
  return (
    <div className="form-page">
      <PageHeader title="Create event" description="Attendees can register as soon as you publish." />
      <EventForm />
    </div>
  );
}
