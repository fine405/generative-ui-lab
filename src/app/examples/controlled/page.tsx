import type { Metadata } from "next";
import { ExampleShell } from "@/components/example-shell";
import { ControlledDemo } from "@/features/controlled/controlled-demo";
import { getChatAvailability } from "@/lib/env";

export const metadata: Metadata = {
  title: "Controlled Generative UI",
  description:
    "A typed backend tool mapped to a host-owned React weather card.",
};

export default async function ControlledExamplePage() {
  const availability = await getChatAvailability();

  return (
    <ExampleShell
      eyebrow="01 · CONTROLLED GENERATIVE UI"
      title="The agent chooses. The host renders."
      description="The agent supplies a city and unit. A backend tool returns validated weather data, the project protocol carries each state, and the host renders the card and owns its actions."
      facts={[
        { label: "Agent output", value: "get_weather + input" },
        { label: "Tool output", value: "Validated weather data" },
        { label: "Renderer", value: "Host WeatherCard" },
      ]}
    >
      <ControlledDemo availability={availability} />
    </ExampleShell>
  );
}
