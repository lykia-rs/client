# Theme

## Overview

`useTheme` composable manages light/dark mode. `ThemeToggle` button (in the sidebar footer) triggers the switch.

## State

```typescript
theme: Ref<'light' | 'dark'>
```

## Initialization

1. Check `localStorage.getItem('lykiadb-theme')`.
2. If stored value exists, use it.
3. Otherwise, check `window.matchMedia('(prefers-color-scheme: dark)').matches`.
4. Apply by toggling `document.documentElement.classList` with `'dark'`.

## Toggle

1. `theme.value` flips to opposite.
2. `document.documentElement.classList.toggle('dark', theme === 'dark')`.
3. `localStorage.setItem('lykiadb-theme', newTheme)`.

## ThemeToggle Button

- Location: bottom of `ConnectionPanel` sidebar.
- Dark mode: shows Sun icon, title "Switch to light mode".
- Light mode: shows Moon icon, title "Switch to dark mode".

## Storage

- Key: `lykiadb-theme`
- Values: `"light"` or `"dark"`

## CSS

Tailwind's `dark:` variant is used throughout. The `dark` class on `<html>` activates dark styles.

## DOM Selectors

| Element          | Selector / Attribute                   |
|------------------|----------------------------------------|
| Toggle button    | `button[title*="Switch to"]`           |
| Dark mode class  | `document.documentElement.classList`    |
