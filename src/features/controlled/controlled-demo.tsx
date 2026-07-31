"use client";

import {
  CopilotChat,
  useComponent,
} from "@copilotkit/react-core/v2";
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

function ControlledChat() {
  useComponent({
    name: "render_metric_snapshot",
    description:
      "Render a compact, read-only metric dashboard from two to four KPIs.",
    parameters: metricSnapshotSchema,
    render: MetricSnapshot,
  });

  return (
    <CopilotChat
      className="h-full"
      labels={{
        chatInputPlaceholder: "Ask for a metric snapshot…",
        modalHeaderTitle: "Controlled Generative UI",
        welcomeMessageText:
          "Ask me to turn a few metrics into the host-owned React component.",
      }}
    />
  );
}

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
          runtimeUrl="/api/copilotkit"
        >
          <ControlledChat />
        </ChatRuntime>
      </section>
    </div>
  );
}
