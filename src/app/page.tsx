import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const examples = [
  {
    eyebrow: "01 · Controlled",
    title: "Components as tools",
    description:
      "The agent selects a typed React component while the host owns rendering, styles, and behavior.",
    href: "/examples/controlled",
    status: "Runnable",
    tone: "blue",
  },
  {
    eyebrow: "02 · Open",
    title: "Sandboxed UI",
    description:
      "The agent authors HTML, CSS, and interactions that stream into an isolated iframe.",
    href: "/examples/open",
    status: "Runnable",
    tone: "violet",
  },
] as const;

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">COPILOTKIT · NEXT.JS · AG-UI</p>
            <h1>Small, runnable studies in Generative UI.</h1>
            <p className="hero-description">
              A focused lab for comparing what an agent delivers, what the host
              keeps, and how each boundary changes the resulting interface.
            </p>
            <div className="hero-actions">
              <Link className="primary-link" href="/examples/controlled">
                Start with controlled UI
                <span aria-hidden="true">↗</span>
              </Link>
              <a
                className="secondary-link"
                href="https://docs.copilotkit.ai/generative-ui"
                rel="noreferrer"
                target="_blank"
              >
                CopilotKit docs
              </a>
            </div>
          </div>
          <div className="boundary-map" aria-label="Generative UI boundaries">
            <div className="boundary-column">
              <span>Host</span>
              <strong>Component</strong>
              <small>more control</small>
            </div>
            <div className="boundary-arrow" aria-hidden="true">
              →
            </div>
            <div className="boundary-column">
              <span>Shared</span>
              <strong>Spec</strong>
              <small>shared control</small>
            </div>
            <div className="boundary-arrow" aria-hidden="true">
              →
            </div>
            <div className="boundary-column">
              <span>Agent</span>
              <strong>Surface</strong>
              <small>more freedom</small>
            </div>
          </div>
        </section>

        <section className="examples-section" aria-labelledby="examples-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXAMPLES</p>
              <h2 id="examples-heading">Learn one boundary at a time.</h2>
            </div>
            <p>
              Each example keeps its runtime, prompt, component, and page close
              together so the complete interaction is easy to trace.
            </p>
          </div>

          <div className="example-grid">
            {examples.map((example) => (
              <Link
                className={`example-card example-card-${example.tone}`}
                href={example.href}
                key={example.href}
              >
                <div className="example-card-top">
                  <span className="eyebrow">{example.eyebrow}</span>
                  <span className="status-dot">
                    <span aria-hidden="true" />
                    {example.status}
                  </span>
                </div>
                <div>
                  <h3>{example.title}</h3>
                  <p>{example.description}</p>
                </div>
                <span className="card-link">
                  Open example <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="stack-section" aria-labelledby="stack-heading">
          <p className="eyebrow">BASELINE</p>
          <h2 id="stack-heading">One boring stack, on purpose.</h2>
          <div className="stack-grid">
            <div>
              <span>Frontend</span>
              <strong>Next.js 16 + React 19</strong>
            </div>
            <div>
              <span>Agent UI</span>
              <strong>CopilotKit v2 + AG-UI</strong>
            </div>
            <div>
              <span>Model access</span>
              <strong>pi-ai provider layer</strong>
            </div>
            <div>
              <span>Deployment</span>
              <strong>GitHub → Vercel</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
