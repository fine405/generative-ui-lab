"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { ChatRuntime } from "@/components/chat-runtime";
import type { ChatAvailability } from "@/lib/chat";

const prompts = [
  "Build a tiny compound-interest calculator with two inputs and a live result.",
  "Create an interactive explanation of how a binary search narrows its range.",
  "Make a compact color contrast explorer with editable foreground and background.",
];

const designSkill = `Build compact, useful interfaces for a dark product UI.
Use clear hierarchy, generous spacing, and accessible contrast.
Prefer one focused interaction over a dashboard with many panels.
Keep visible copy short. Avoid gradients unless they communicate state.`;

export function OpenDemo({
  availability,
}: {
  availability: ChatAvailability;
}) {
  return (
    <div className="demo-grid">
      <aside className="prompt-panel">
        <h2>Try a prompt</h2>
        <p>
          The agent authors a complete interface and CopilotKit streams it into
          an isolated iframe.
        </p>
        <div className="prompt-list">
          {prompts.map((prompt) => (
            <span className="prompt-item" key={prompt}>
              {prompt}
            </span>
          ))}
        </div>
        <div className="prompt-note">
          Boundary: the Agent provides HTML, CSS, and interaction logic. The
          Host keeps the sandbox and communication bridge.
        </div>
      </aside>
      <section className="chat-panel" aria-label="Open UI chat demo">
        <ChatRuntime
          availability={availability}
          openGenerativeUI={{ designSkill }}
          runtimeUrl="/api/copilotkit-open"
        >
          <CopilotChat
            className="h-full"
            labels={{
              chatInputPlaceholder: "Ask for a small interactive UI…",
              modalHeaderTitle: "Open Generative UI",
              welcomeMessageText:
                "Describe a focused interface. I will build it in a sandbox.",
            }}
          />
        </ChatRuntime>
      </section>
    </div>
  );
}
