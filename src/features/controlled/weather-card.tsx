"use client";

import { useAui, useAuiState } from "@assistant-ui/react";
import type { WeatherOutput } from "@/features/controlled/weather-contract";

const rideLabels: Record<WeatherOutput["riding"]["rating"], string> = {
  good: "Good for riding",
  fair: "Ride with care",
  poor: "Better to wait",
};

export function WeatherCard({
  city,
  condition,
  humidity,
  riding,
  temperature,
  unit,
  windKph,
}: WeatherOutput) {
  const aui = useAui();
  const isRunning = useAuiState((state) => state.thread.isRunning);
  const unitLabel = unit === "celsius" ? "C" : "F";

  function planRide() {
    void aui.thread.append({
      content: [
        {
          type: "text",
          text: `Plan a short ride in ${city} using the weather result above.`,
        },
      ],
    });
  }

  return (
    <section className="weather-card" aria-label={`${city} weather`}>
      <header className="weather-card-header">
        <div>
          <span>Demo weather</span>
          <h3>{city}</h3>
        </div>
        <span className={`ride-status ride-status-${riding.rating}`}>
          <span aria-hidden="true" />
          {rideLabels[riding.rating]}
        </span>
      </header>

      <div className="weather-reading">
        <strong>
          {temperature}°{unitLabel}
        </strong>
        <span>{condition}</span>
      </div>

      <dl className="weather-details">
        <div>
          <dt>Humidity</dt>
          <dd>{humidity}%</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>{windKph} km/h</dd>
        </div>
        <div>
          <dt>Data source</dt>
          <dd>Local sample</dd>
        </div>
      </dl>

      <footer className="weather-card-footer">
        <p>{riding.summary}</p>
        <button disabled={isRunning} onClick={planRide} type="button">
          Plan a ride
        </button>
      </footer>
    </section>
  );
}

export function WeatherCardError({ city }: { city?: string }) {
  const aui = useAui();
  const isRunning = useAuiState((state) => state.thread.isRunning);

  function retryWithShanghai() {
    void aui.thread.append({
      content: [
        {
          type: "text",
          text: "Show the weather for Shanghai in Celsius.",
        },
      ],
    });
  }

  return (
    <div className="weather-error" role="alert">
      <div>
        <strong>Weather unavailable{city ? ` for ${city}` : ""}</strong>
        <span>
          This demo has local samples for Shanghai, Beijing, and Shenzhen.
        </span>
      </div>
      <button disabled={isRunning} onClick={retryWithShanghai} type="button">
        Try Shanghai
      </button>
    </div>
  );
}
