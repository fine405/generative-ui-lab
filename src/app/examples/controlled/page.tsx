import type { Metadata } from "next";
import { ExampleShell } from "@/components/example-shell";
import { ControlledDemo } from "@/features/controlled/controlled-demo";

export const metadata: Metadata = {
  title: "Controlled Generative UI",
  description:
    "A typed React component selected and populated by a CopilotKit agent.",
};

export default function ControlledExamplePage() {
  return (
    <ExampleShell
      eyebrow="01 · CONTROLLED GENERATIVE UI"
      title="The agent chooses. The host renders."
      description="A Zod schema is the boundary. CopilotKit exposes a host-authored React component as a frontend tool, and the model supplies only its typed props."
      facts={[
        { label: "Agent output", value: "Tool call + props" },
        { label: "Renderer", value: "Host React component" },
        { label: "Isolation", value: "Native component boundary" },
      ]}
    >
      <ControlledDemo />
    </ExampleShell>
  );
}
