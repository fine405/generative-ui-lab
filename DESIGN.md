# Generative UI Lab — Design Language

This project uses a light-first adaptation of the
[Vercel design language reference](https://github.com/educlopez/design-bites/blob/main/design-mds/vercel.com/DESIGN.md).
This file is the local design contract for all future UI work.

## Product direction

- Keep the interface quiet, precise, and function-led.
- Preserve the existing information architecture unless a product change calls
  for something different.
- Use light mode by default. Do not follow the operating-system dark-mode
  preference and do not add dark styling unless a task explicitly requests it.
- Prefer spacing and surface changes to decorative dividers.
- Do not add decoration that cannot be tied to hierarchy, state, or interaction.

## Foundation

### Color

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#FAFAFA` | Page background |
| Surface | `#FFFFFF` | Cards, panels, menus |
| Recessed | `#F2F2F2` | Inputs, quiet notes, disabled states |
| Hover | `#EBEBEB` | Neutral hover fill |
| Text | `#171717` | Headings and primary content |
| Secondary text | `#4D4D4D` | Body copy and navigation |
| Muted text | `#8F8F8F` | Captions and disabled content |
| Interaction | `#0072F5` | Links and keyboard focus |
| Input focus | `#005FCC` | Native input outlines |

The product is achromatic. Blue is reserved for interaction and focus. Semantic
colors may appear only as small status indicators, approximately 8–10px:

- Success: `#45A557`
- Error: `#E5484D`
- Neutral: `#8F8F8F`

Do not use semantic colors as large fills or decoration.

### Typography

- Use Geist Sans for interface text and Geist Mono for code and technical
  labels.
- Enable standard ligatures.
- Use only weights `400`, `500`, and `600`.
- Reserve `600` for display headings. Do not use `700` or heavier.
- Use dense negative tracking on display text:
  - 48px heading: `-2.28px`
  - 32px heading: `-1.28px`
  - 14px section label: `-0.28px`
- Recommended hierarchy:
  - Page heading: 48–64px / 600 / line-height 1
  - Section heading: 32–40px / 600 / line-height 1.2–1.25
  - UI heading: 14px / 500 / 20px
  - Body: 14–16px / 400 / 20–24px
  - Caption: 12px / 400 / 16px
  - Code: 13px / 500 / 20px

### Spacing and layout

Use a 4px base grid. Prefer these values:

`4, 8, 12, 16, 24, 32, 40, 48, 64, 96px`

- Standard page width: `1200px`
- Wide content ceiling: `1400px`
- Desktop page margin: `24px`
- Mobile page margin: `16px`
- Header height: `64px`
- Default component height: `40px`
- Small component height: `32px`
- Large component height: `48px`

Use component-level responsive changes. At minimum, check:

- 400px narrow mobile
- 640px mobile
- 960px tablet/small desktop
- 1200px standard desktop
- 1400px wide desktop

## Components

### Surfaces and elevation

Use shadow rings instead of CSS borders for cards, controls, panels, and menus:

```css
--shadow-border: 0 0 0 1px rgba(0, 0, 0, 0.08);
--shadow-small:
  0 0 0 1px rgba(0, 0, 0, 0.08),
  0 2px 2px rgba(0, 0, 0, 0.04);
--shadow-medium:
  0 0 0 1px rgba(0, 0, 0, 0.08),
  0 2px 2px rgba(0, 0, 0, 0.04),
  0 8px 8px -8px rgba(0, 0, 0, 0.04);
```

Use radii consistently:

- `6px` for controls and compact surfaces
- `12px` for cards and elevated panels
- `9999px` only for pills and circular status indicators

Do not use a functional radius larger than 12px.

### Interaction

- Neutral navigation and ghost controls use `#4D4D4D` text.
- Hover changes only background, color, or shadow. Do not translate, scale, or
  fade interactive elements.
- Buttons and links use the double focus ring:

```css
box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #0072f5;
```

- Inputs use `outline: 1px auto #005FCC`.
- All focus states must remain visible against both the canvas and white
  surfaces.
- Respect `prefers-reduced-motion`.

### Content and states

- Keep visible copy concise and specific.
- Prefer one primary action per surface.
- Use realistic content in examples and generated interfaces.
- Never rely on color alone to communicate status.
- Status colors must be paired with text or another accessible signal.

## Prohibited patterns

- Dark mode as the default or automatic system-theme switching
- Decorative gradients, background patterns, or colored card washes
- CSS borders around functional containers when a shadow ring works
- New accent colors outside tiny semantic indicators
- Font weights above 600
- Transform- or opacity-based hover effects
- Functional corner radii above 12px
- Divider-heavy layouts when spacing or surface changes can establish hierarchy

## Review checklist

Before finishing UI work, verify:

- The page loads in light mode with `color-scheme: light`.
- Geist typography, weights, tracking, and line heights follow this file.
- Spacing values sit on the 4px grid.
- Containers use the approved shadow and radius scale.
- Blue appears only in interaction and focus states.
- Hover, focus, disabled, loading, empty, success, and error states are legible.
- Keyboard focus is visible and the page has no horizontal overflow.
- The primary flow works at mobile, tablet, and desktop widths.
- New agent-generated UI instructions also reference this design language.
