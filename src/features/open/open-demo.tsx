"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { ChatRuntime } from "@/components/chat-runtime";
import type { ChatAvailability } from "@/lib/chat";

const prompts = [
  "Build a tiny compound-interest calculator with two inputs and a live result.",
  "Create an interactive explanation of how a binary search narrows its range.",
  "Make a compact color contrast explorer with editable foreground and background.",
];

const designSkill = `Build compact, useful interfaces in the Vercel design language.
Use a light #FAFAFA canvas, #171717 text, Geist-style typography, and a 4px spacing grid.
Keep surfaces achromatic, use shadow rings instead of CSS borders, and reserve blue for interaction and focus.
Use 6px controls, 12px cards, and font weights 400, 500, or 600 only.
Prefer one focused interaction, concise copy, and no decorative gradients or transform-based hover effects.`;

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
