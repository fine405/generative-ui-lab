"use client";

import { z } from "zod";

export const metricSnapshotSchema = z.object({
  title: z.string().describe("A short title for the metric group"),
  summary: z.string().describe("One concise sentence explaining the snapshot"),
  period: z.string().describe("The reporting period, such as This week"),
  metrics: z
    .array(
      z.object({
        label: z.string().describe("A short metric label"),
        value: z.string().describe("Formatted metric value"),
        change: z.string().describe("Short change label, such as +12%"),
        trend: z.enum(["up", "down", "steady"]),
      }),
    )
    .min(2)
    .max(4),
});

type MetricSnapshotProps = z.infer<typeof metricSnapshotSchema>;

export function MetricSnapshot({
  title,
  summary,
  period,
  metrics,
}: MetricSnapshotProps) {
  return (
    <section className="metric-snapshot" aria-label={title}>
      <div className="metric-snapshot-header">
        <div>
          <h3>{title}</h3>
          <p>{summary}</p>
        </div>
        <span>{period}</span>
      </div>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <div className="metric-card" key={metric.label}>
            <span title={metric.label}>{metric.label}</span>
            <div className="metric-card-value">
              <strong title={metric.value}>{metric.value}</strong>
              <small className={`trend-${metric.trend}`}>
                {metric.change}
              </small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
