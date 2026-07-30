import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

type ExampleShellProps = {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  facts: Array<{ label: string; value: string }>;
};

export function ExampleShell({
  children,
  eyebrow,
  title,
  description,
  facts,
}: ExampleShellProps) {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="example-main">
        <Link className="example-back" href="/">
          <span aria-hidden="true">←</span>
          All examples
        </Link>
        <section className="example-intro">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <dl className="example-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        {children}
      </main>
    </div>
  );
}
