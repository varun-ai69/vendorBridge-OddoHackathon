# VendorBridge Theme Guide

This file captures the current website theme so mobile app implementations can match the UI without drift.

## Purpose

- Share the exact visual design tokens used by `frontend/src/app/globals.css`
- Provide both light and dark theme values
- Give mobile developers a direct mapping for colors, typography, surfaces, and spacing
- Preserve the same look and feel across web and mobile

---

## Typography

- Primary font: `Plus Jakarta Sans`
- Fallback stack: `system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- Body text: `font-family: Plus Jakarta Sans, system-ui, sans-serif`
- Text smoothing: antialiased

### Recommended mobile tokens

```js
const typography = {
  fontFamily: 'Plus Jakarta Sans',
  fontFamilyFallback: ['System', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
  body: 16,
  label: 14,
  title: 20,
  heading: 24,
  largeHeading: 32,
  lineHeight: 1.5,
};
```

---

## Global color tokens

### Light theme

- `background`: #fdfbf7
- `foreground`: #1e1d19
- `surface`: #ffffff
- `surfaceElevated`: rgba(255, 255, 255, 0.75)
- `border`: rgba(180, 83, 9, 0.08)
- `borderStrong`: rgba(180, 83, 9, 0.16)
- `muted`: #78716c
- `accent`: #b45309
- `accentHover`: #92400e
- `accentMuted`: rgba(180, 83, 9, 0.07)
- `success`: #16a34a
- `warning`: #ca8a04
- `danger`: #dc2626
- `glassBg`: rgba(253, 251, 247, 0.65)
- `glassBorder`: rgba(180, 83, 9, 0.08)

### Dark theme

- `background`: #13100c
- `foreground`: #f5ede0
- `surface`: #1c1813
- `surfaceElevated`: rgba(28, 24, 19, 0.8)
- `border`: rgba(245, 238, 224, 0.08)
- `borderStrong`: rgba(245, 238, 224, 0.16)
- `muted`: #9a907e
- `accent`: #f59e0b
- `accentHover`: #fbbf24
- `accentMuted`: rgba(245, 158, 11, 0.12)
- `success`: #10b981
- `warning`: #f59e0b
- `danger`: #ef4444
- `glassBg`: rgba(28, 24, 19, 0.65)
- `glassBorder`: rgba(245, 158, 11, 0.12)

---

## Shadows & elevation

### Light theme shadows

- `shadowSm`: 0 1px 2px rgba(180, 83, 9, 0.02), 0 1px 3px rgba(0, 0, 0, 0.04)
- `shadowMd`: 0 4px 16px rgba(180, 83, 9, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)
- `shadowLg`: 0 12px 40px rgba(180, 83, 9, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)

### Dark theme shadows

- `shadowSm`: 0 1px 2px rgba(0, 0, 0, 0.2)
- `shadowMd`: 0 4px 16px rgba(0, 0, 0, 0.3)
- `shadowLg`: 0 12px 40px rgba(0, 0, 0, 0.45)

---

## Glass style

The site uses a frosted glass effect on key cards and panels.

- `glassBg` + blur
- `backdropFilter: blur(16px) saturate(180%)`
- `border: 1px solid glassBorder`

Mobile mapping:

```js
const glassCard = {
  backgroundColor: 'rgba(253, 251, 247, 0.65)',
  borderColor: 'rgba(180, 83, 9, 0.08)',
  borderWidth: 1,
  borderRadius: 16,
  overflow: 'hidden',
  // use native blur support if available
  backdropFilter: 'blur(16px) saturate(180%)',
};
```

For dark mode, swap `backgroundColor` and `borderColor` with the dark theme glass tokens.

---

## Interaction and focus

- Accent buttons: `background: accent`, `color: white`
- Accent hover: `accentHover`
- Disabled / muted text: `muted`
- Selection highlight color: `accentMuted`

### Suggested button styles

```js
const button = {
  backgroundColor: accent,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 20,
  alignItems: 'center',
  justifyContent: 'center',
};
```

---

## Layout and spacing

The site uses a clean, spacious layout with subtle cards and panels. Use consistent spacing values like:

- `spacing-1`: 8
- `spacing-2`: 12
- `spacing-3`: 16
- `spacing-4`: 24
- `spacing-5`: 32
- `spacing-6`: 40

These values map well to mobile padding, margins, and list gaps.

---

## Component recommendations for mobile

### App background

```js
const appBackground = {
  backgroundColor: theme.background,
  color: theme.foreground,
};
```

### Card surface

```js
const surfaceCard = {
  backgroundColor: theme.surface,
  borderColor: theme.border,
  borderWidth: 1,
  borderRadius: 16,
  padding: 16,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 16,
  elevation: 4,
};
```

### Text styles

```js
const text = {
  color: theme.foreground,
  fontFamily: theme.fontFamily,
};

const mutedText = {
  color: theme.muted,
};
```

### Status chips

Use state colors from the website constants:

- `success`: #16a34a / #10b981
- `warning`: #ca8a04 / #f59e0b
- `danger`: #dc2626 / #ef4444

---

## Theme mapping example

```js
const themeLight = {
  background: '#fdfbf7',
  foreground: '#1e1d19',
  surface: '#ffffff',
  border: 'rgba(180, 83, 9, 0.08)',
  accent: '#b45309',
  accentHover: '#92400e',
  muted: '#78716c',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626',
  glassBg: 'rgba(253, 251, 247, 0.65)',
  glassBorder: 'rgba(180, 83, 9, 0.08)',
  shadowSm: '0 1px 2px rgba(180, 83, 9, 0.02)',
  shadowMd: '0 4px 16px rgba(180, 83, 9, 0.04)',
  shadowLg: '0 12px 40px rgba(180, 83, 9, 0.08)',
  fontFamily: 'Plus Jakarta Sans',
};
```

```js
const themeDark = {
  background: '#13100c',
  foreground: '#f5ede0',
  surface: '#1c1813',
  border: 'rgba(245, 238, 224, 0.08)',
  accent: '#f59e0b',
  accentHover: '#fbbf24',
  muted: '#9a907e',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  glassBg: 'rgba(28, 24, 19, 0.65)',
  glassBorder: 'rgba(245, 158, 11, 0.12)',
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.2)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.3)',
  shadowLg: '0 12px 40px rgba(0, 0, 0, 0.45)',
  fontFamily: 'Plus Jakarta Sans',
};
```

---

## Notes for mobile developers

- Match the color palette exactly to keep the brand consistent.
- Use the same accent and state colors for buttons, badges, and status indicators.
- Emulate glass panels with blur and transparency where platform support exists.
- Keep spacing generous and use elevated cards for content sections.
- Preserve light/dark mode by switching the full theme object.

If the mobile platform does not support CSS blur, use a lightly translucent surface with the same border and background tones.
