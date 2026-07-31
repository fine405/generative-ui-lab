<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design system

Before changing any user-facing UI, read and follow `DESIGN.md`.

- The default theme is light and must not automatically follow the operating
  system dark-mode preference.
- Keep new components within the documented color, type, spacing, radius,
  elevation, focus, and motion rules.
- Update `DESIGN.md` first when a deliberate product-level exception becomes
  part of the design system.
