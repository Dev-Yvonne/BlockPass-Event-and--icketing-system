"use client";

import { MessageSquareText } from "lucide-react";
import { ReviewList, ReviewSummary } from "../../../../components/ReviewSummary";
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel } from "../../../../components/ui";
import * as api from "../../../../lib/api";
import { useResource } from "../../../../lib/useResource";

export default function FeedbackPage() {
  const { data: reviews, error, reload } = useResource(api.getOrganizerFeedback);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!reviews) return <LoadingState />;

  return (
    <>
      <PageHeader title="Attendee feedback" description="Ratings and reviews from ticket holders across your events." />
      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No reviews yet">
          Ticket holders can review your events from each event page.
        </EmptyState>
      ) : (
        <div className="workspace-grid reverse">
          <Panel title="All reviews">
            <ReviewList reviews={reviews} showEvent />
          </Panel>
          <Panel title="Overall rating">
            <ReviewSummary reviews={reviews} />
          </Panel>
        </div>
      )}
    </>
  );
}
