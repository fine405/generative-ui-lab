"use client";

import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { ChatRuntime } from "@/components/chat-runtime";
import {
  MetricSnapshot,
  metricSnapshotSchema,
} from "@/features/controlled/metric-snapshot";
import type { ChatAvailability } from "@/lib/chat";

const prompts = [
  "Show a launch snapshot: 2,480 signups (+18%), 41% activation (+6%), 8.2% churn (-1.4%).",
  "Create a compact weekly metrics card for an AI coding assistant.",
  "Summarize three fictional support KPIs and render them visually.",
];

function MetricSnapshotTool({
  args,
  isError,
}: ToolCallMessagePartProps) {
  if (isError) {
    return (
      <div className="generated-ui-error" role="alert">
        The metric snapshot could not be rendered.
      </div>
    );
  }

  const parsed = metricSnapshotSchema.safeParse(args);

  return parsed.success ? (
    <MetricSnapshot {...parsed.data} />
  ) : (
    <div className="generated-ui-loading">
      <span aria-hidden="true" />
      Receiving typed component props…
    </div>
  );
}

const toolComponents = {
  render_metric_snapshot: MetricSnapshotTool,
};

export function ControlledDemo({
  availability,
}: {
  availability: ChatAvailability;
}) {
  return (
    <div className="demo-grid">
      <aside className="prompt-panel">
        <h2>Try a prompt</h2>
        <p>
          The agent can choose one component and fill only the props allowed by
          its schema.
        </p>
        <div className="prompt-list">
          {prompts.map((prompt) => (
            <span className="prompt-item" key={prompt}>
              {prompt}
            </span>
          ))}
        </div>
        <div className="prompt-note">
          Boundary: the Agent provides typed props. The Host keeps the component,
          styles, accessibility, and behavior.
        </div>
      </aside>
      <section className="chat-panel" aria-label="Controlled UI chat demo">
        <ChatRuntime
          availability={availability}
          inputPlaceholder="Ask for a metric snapshot…"
          mode="controlled"
          toolComponents={toolComponents}
          welcomeMessage="Ask me to turn a few metrics into the host-owned React component."
        />
      </section>
    </div>
  );
}
