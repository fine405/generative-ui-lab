"use client";

import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { ChatRuntime } from "@/components/chat-runtime";
import type { ChatAvailability } from "@/lib/chat";

const prompts = [
  "Build a tiny compound-interest calculator with two inputs and a live result.",
  "Create an interactive explanation of how a binary search narrows its range.",
  "Make a compact color contrast explorer with editable foreground and background.",
];

function OpenUITool({ args, isError }: ToolCallMessagePartProps) {
  const title =
    args && typeof args === "object" && typeof args.title === "string"
      ? args.title
      : "";
  const html =
    args && typeof args === "object" && typeof args.html === "string"
      ? args.html
      : "";

  if (isError) {
    return (
      <div className="generated-ui-error" role="alert">
        The generated interface could not be rendered.
      </div>
    );
  }

  if (!title || !html) {
    return (
      <div className="generated-ui-loading">
        <span aria-hidden="true" />
        Receiving the sandbox document…
      </div>
    );
  }

  const contentSecurityPolicy = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data:",
    "connect-src 'none'",
    "form-action 'none'",
  ].join("; ");
  const srcDoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">${html}`;

  return (
    <div className="open-ui-frame">
      <div className="open-ui-frame-header">
        <span>Sandboxed output</span>
        <strong>{title}</strong>
      </div>
      <iframe
        referrerPolicy="no-referrer"
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        title={title}
      />
    </div>
  );
}

const toolComponents = {
  render_open_ui: OpenUITool,
};

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
          The agent authors a complete interface and the host mounts it in an
          isolated iframe.
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
          Host keeps the sandbox and decides when the document is mounted.
        </div>
      </aside>
      <section className="chat-panel" aria-label="Open UI chat demo">
        <ChatRuntime
          availability={availability}
          inputPlaceholder="Ask for a small interactive UI…"
          mode="open"
          toolComponents={toolComponents}
          welcomeMessage="Describe a focused interface. I will build it in a sandbox."
        />
      </section>
    </div>
  );
}
