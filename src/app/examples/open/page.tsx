import type { Metadata } from "next";
import { ExampleShell } from "@/components/example-shell";
import { OpenDemo } from "@/features/open/open-demo";

export const metadata: Metadata = {
  title: "Open Generative UI",
  description:
    "Agent-authored HTML, CSS, and interactions streamed into a sandboxed iframe.",
};

export default function OpenExamplePage() {
  return (
    <ExampleShell
      eyebrow="02 · OPEN GENERATIVE UI"
      title="The agent authors a complete surface."
      description="CopilotKit adds the UI-generation tool, streams its output as activity events, and mounts the result inside a sandboxed iframe rather than the host component tree."
      facts={[
        { label: "Agent output", value: "HTML + CSS + JS" },
        { label: "Renderer", value: "Sandboxed iframe" },
        { label: "Isolation", value: "postMessage bridge" },
      ]}
    >
      <OpenDemo />
    </ExampleShell>
  );
}
