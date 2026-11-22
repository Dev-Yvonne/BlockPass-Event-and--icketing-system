"use client";

import { GateScanner } from "../../../../components/GateScanner";
import { PageHeader } from "../../../../components/ui";

export default function GateScannerPage() {
  return (
    <>
      <PageHeader
        title="Gate scanner"
        description="Scan attendee passes. Each ticket is checked against the Stellar ledger and can be used once."
      />
      <GateScanner />
    </>
  );
}
