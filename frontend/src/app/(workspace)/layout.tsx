import { ReactNode } from "react";
import { Shell } from "../../components/Shell";

export const metadata = { title: "Workspace | BlockPass", robots: { index: false } };

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}
