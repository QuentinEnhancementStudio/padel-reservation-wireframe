# Enhancement Studio — Design Chart

Brand reference extracted from [code.enhancement.studio](https://code.enhancement.studio/).
Use this as the source of truth for colors, typography, and styling on Enhancement Studio surfaces.

**Personality:** dark, high-contrast, tech-forward. A deep aubergine/plum canvas with a soft
center glow and faint linen-grid texture, lit by an electric cyan + magenta accent duo, set in a
clean geometric sans (Poppins) with a neutral workhorse body (Montserrat).

---

## 1. Colors

### Background (base)

The site background is **not** flat black — it's a deep aubergine/plum with a subtle radial glow
toward the center and a faint grid texture.

| Role | Color | Hex |
|------|-------|-----|
| Base background | Aubergine / plum | `#2B1A29` |
| Center glow (radial highlight) | Lighter plum | `#3A2237` |
| Edge / vignette | Dark plum | `#241420` |

### Accents

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary accent | Cyan | `#48D9F3` | active nav, links, primary CTAs, "Contact Us" tab, highlights |
| Secondary accent | Magenta | `#F72585` | emphasis word in headlines, contrast pairing |
| Tertiary accent | Blue | `#1A6AFF` / `#5E97FF` | inline links, interactive states |
| Alert | Red | `#FF4040` | errors, warnings |

### Surfaces & neutrals

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Deep navy panel | Navy | `#131946` | alternate section panels |
| Charcoal surface | Charcoal | `#171921` | cards, raised surfaces |
| Near-black | Black | `#080808` | deepest contrast, footers |
| Primary text (on dark) | White | `#FFFFFF` | headings, logo |
| Body text (on dark) | Off-white | `#E4DCE2` | paragraph copy |
| Muted text | Slate | `#8F96AF` | captions, secondary labels |
| Soft accent text | Periwinkle | `#B8C1E0` | subtle highlights on dark |
| Nav text | Mauve-grey | `#C9BCC8` | inactive nav items |

### Pairing rules

- **Cyan + magenta is the core duo.** Use them sparingly against the dark base so they pop.
- Keep large surfaces dark (aubergine base, navy/charcoal panels); reserve accents for type,
  borders, icons, and interactive elements.
- White for primary text, off-white for body, slate for secondary — always on dark backgrounds.
- One accent word per headline (e.g. magenta "Enhancement" in an otherwise white title).

---

## 2. Typography

| Family | Weights | Usage |
|--------|---------|-------|
| **Poppins** | 700 / 600 display, 300 light | Headings, hero, nav active, buttons, stats. The brand voice. |
| **Montserrat** | 400 / 500 | Body copy, UI labels, nav, paragraphs. |

- Font stack: `'Poppins', sans-serif` for headings, `'Montserrat', sans-serif` for body.
- Both are free Google Fonts.
- Hero headline: Poppins 700, ~46px, `letter-spacing: -0.5px`, `line-height: 1.1`.
- Body: Montserrat 400, ~15px, `line-height: 1.6`.
- Casing: sentence case for body; brand title uses Title Case ("Code Enhancement Studio").

---

## 3. Technical reference (CSS)

Drop-in tokens and helpers. Agents should reference these variables rather than hardcoding hex.

### Font import

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Montserrat:wght@400;500&display=swap');
```

### Design tokens (`:root`)

```css
:root {
  /* Background */
  --ces-bg-base:        #2B1A29; /* aubergine plum */
  --ces-bg-glow:        #3A2237; /* center radial highlight */
  --ces-bg-edge:        #241420; /* vignette / edge */

  /* Accents */
  --ces-cyan:           #48D9F3; /* primary accent */
  --ces-magenta:        #F72585; /* secondary accent */
  --ces-blue:           #1A6AFF;
  --ces-blue-light:     #5E97FF;
  --ces-red:            #FF4040; /* alert */

  /* Surfaces */
  --ces-navy:           #131946;
  --ces-charcoal:       #171921;
  --ces-black:          #080808;

  /* Text */
  --ces-text:           #FFFFFF; /* primary */
  --ces-text-body:      #E4DCE2; /* paragraph */
  --ces-text-muted:     #8F96AF; /* secondary */
  --ces-text-soft:      #B8C1E0; /* soft accent */
  --ces-text-nav:       #C9BCC8; /* inactive nav */

  /* Typography */
  --ces-font-head: 'Poppins', sans-serif;
  --ces-font-body: 'Montserrat', sans-serif;

  /* Radius */
  --ces-radius-sm: 6px;
  --ces-radius-md: 8px;
  --ces-radius-lg: 12px;
}
```

### Page background (aubergine base + glow + texture)

```css
body {
  font-family: var(--ces-font-body);
  color: var(--ces-text-body);
  background:
    radial-gradient(circle at 50% 38%,
      var(--ces-bg-glow) 0%,
      var(--ces-bg-base) 45%,
      var(--ces-bg-edge) 100%);
  min-height: 100vh;
}

/* Faint linen-grid texture overlay */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
  background-size: 7px 7px;
}
```

### Components

```css
/* Headline with accent word */
.ces-headline {
  font-family: var(--ces-font-head);
  font-weight: 700;
  font-size: 46px;
  line-height: 1.1;
  letter-spacing: -0.5px;
  color: var(--ces-text);
}
.ces-headline .accent { color: var(--ces-magenta); }

/* Inline link */
.ces-link { color: var(--ces-blue-light); text-decoration: none; }

/* Primary button (cyan) */
.ces-btn-primary {
  font-family: var(--ces-font-head);
  font-weight: 600;
  font-size: 13px;
  color: var(--ces-black);
  background: var(--ces-cyan);
  border: none;
  border-radius: var(--ces-radius-md);
  padding: 11px 22px;
  cursor: pointer;
}

/* Secondary button (magenta) */
.ces-btn-secondary {
  font-family: var(--ces-font-head);
  font-weight: 600;
  color: var(--ces-text);
  background: var(--ces-magenta);
  border: none;
  border-radius: var(--ces-radius-md);
  padding: 11px 22px;
  cursor: pointer;
}

/* Ghost button (outline) */
.ces-btn-ghost {
  color: var(--ces-text);
  background: transparent;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: var(--ces-radius-md);
  padding: 11px 22px;
  cursor: pointer;
}

/* White pill button (hero CTA) */
.ces-btn-light {
  font-family: var(--ces-font-body);
  font-weight: 500;
  color: #1a1a1a;
  background: #fff;
  border: none;
  border-radius: var(--ces-radius-sm);
  padding: 13px 26px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.35);
  cursor: pointer;
}

/* Card / raised surface */
.ces-card {
  background: var(--ces-charcoal);
  border: 0.5px solid rgba(255,255,255,0.06);
  border-radius: var(--ces-radius-lg);
  padding: 20px;
}

/* Nav: active item */
.ces-nav-active {
  font-family: var(--ces-font-head);
  color: var(--ces-cyan);
  border-bottom: 2px solid var(--ces-cyan);
  padding-bottom: 2px;
}
.ces-nav-item { color: var(--ces-text-nav); font-size: 13px; }

/* Vertical "Contact Us" tab (pinned top-right) */
.ces-contact-tab {
  position: fixed;
  top: 0;
  right: 0;
  background: var(--ces-cyan);
  color: #081016;
  font-family: var(--ces-font-head);
  font-weight: 600;
  font-size: 10px;
  letter-spacing: 0.5px;
  padding: 14px 5px;
  writing-mode: vertical-rl;
  border-radius: 0 0 0 4px;
}
```

### Accent-tinted icon chips (used on cards)

```css
.ces-icon-cyan    { background: rgba(72,217,243,0.12);  color: var(--ces-cyan); }
.ces-icon-magenta { background: rgba(247,37,133,0.12);  color: var(--ces-magenta); }
.ces-icon-blue    { background: rgba(26,106,255,0.14);  color: var(--ces-blue-light); }
```

---

## 4. Notes & provenance

- Colors extracted from the raw page source (hex/rgba frequency); the aubergine background is a
  textured image, so its color was sampled visually from the live site, not the CSS.
- `#116DFF` appears in the source but is Wix's default editor UI blue — **not** a brand color; excluded.
- The site is built on Wix Studio; Helvetica, Avenir, Wix Madefor, and DIN in the source are Wix
  system/UI fonts, **not** brand fonts. Brand fonts are Poppins (headings) and Montserrat (body).
