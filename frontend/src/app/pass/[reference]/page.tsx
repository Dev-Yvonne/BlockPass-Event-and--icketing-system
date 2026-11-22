import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { PassView } from "../../../components/PassView";

export const metadata: Metadata = {
  title: "Mobile pass | BlockPass",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#14151a" };

export default async function PassPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <Suspense>
      <PassView reference={reference} />
    </Suspense>
  );
}
