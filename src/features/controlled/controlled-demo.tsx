"use client";

import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { ChatRuntime } from "@/components/chat-runtime";
import {
  weatherInputSchema,
  weatherOutputSchema,
} from "@/features/controlled/weather-contract";
import {
  WeatherCard,
  WeatherCardError,
} from "@/features/controlled/weather-card";
import type { ChatAvailability } from "@/lib/chat";

const prompts = [
  "Is Shanghai good for cycling today?",
  "Show Beijing weather in Fahrenheit.",
  "What is the weather in Atlantis?",
];

function WeatherTool({
  args,
  isError,
  result,
}: ToolCallMessagePartProps) {
  const input = weatherInputSchema.safeParse(args);

  if (isError) {
    return (
      <WeatherCardError
        city={input.success ? input.data.city : undefined}
      />
    );
  }

  if (result !== undefined) {
    const output = weatherOutputSchema.safeParse(result);

    return output.success ? (
      <WeatherCard {...output.data} />
    ) : (
      <WeatherCardError city={input.success ? input.data.city : undefined} />
    );
  }

  return (
    <div className="generated-ui-loading">
      <span aria-hidden="true" />
      {input.success
        ? `Checking the local weather sample for ${input.data.city}…`
        : "Receiving typed weather arguments…"}
    </div>
  );
}

const toolComponents = {
  get_weather: WeatherTool,
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
          The agent chooses a typed backend tool. The host maps its streamed
          state and validated result to one React component.
        </p>
        <div className="prompt-list">
          {prompts.map((prompt) => (
            <span className="prompt-item" key={prompt}>
              {prompt}
            </span>
          ))}
        </div>
        <div className="prompt-note">
          Boundary: the Agent supplies city and unit. The tool returns weather
          data. The Host owns the card, states, accessibility, and actions.
        </div>
      </aside>
      <section className="chat-panel" aria-label="Controlled UI chat demo">
        <ChatRuntime
          availability={availability}
          inputPlaceholder="Ask about cycling weather…"
          mode="controlled"
          toolComponents={toolComponents}
          welcomeMessage="Ask about Shanghai, Beijing, or Shenzhen weather. The result will use a host-owned React component."
        />
      </section>
    </div>
  );
}
