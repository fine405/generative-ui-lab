import type { Metadata } from "next";
import { ExampleShell } from "@/components/example-shell";
import { ControlledDemo } from "@/features/controlled/controlled-demo";
import { getChatAvailability } from "@/lib/env";

export const metadata: Metadata = {
  title: "Controlled Generative UI",
  description:
    "A typed React component selected and populated by a pi-agent-core agent.",
};

export default async function ControlledExamplePage() {
  const availability = await getChatAvailability();

  return (
    <ExampleShell
      eyebrow="01 · CONTROLLED GENERATIVE UI"
      title="The agent chooses. The host renders."
      description="A typed tool schema is the boundary. pi-agent-core executes the tool, the project protocol carries its state, and the host supplies the React renderer."
      facts={[
        { label: "Agent output", value: "Tool call + props" },
        { label: "Renderer", value: "Host React component" },
        { label: "Isolation", value: "Native component boundary" },
      ]}
    >
      <ControlledDemo availability={availability} />
    </ExampleShell>
  );
}
