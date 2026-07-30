import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">
          UI
        </span>
        <span>Generative UI Lab</span>
      </Link>
      <nav className="header-links" aria-label="Primary navigation">
        <Link href="/examples/controlled">Examples</Link>
        <a
          href="https://github.com/fine405/generative-ui-lab"
          rel="noreferrer"
          target="_blank"
        >
          GitHub ↗
        </a>
      </nav>
    </header>
  );
}
