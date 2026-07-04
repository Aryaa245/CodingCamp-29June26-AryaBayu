# Design Document

## Feature: Personal Dashboard

---

## Overview

The Personal Dashboard is a client-side-only single-page application built with **vanilla HTML, CSS, and JavaScript** — no frameworks, no bundlers, no build steps, no external libraries. All JavaScript lives in a single `js/script.js` file. All styles live in `css/style.css`. The page is opened directly in a browser with no server required.

The four widgets — Greeting/Clock, Focus Timer, To-Do List, and Quick Links — are implemented as named function groups within `script.js`. The dashboard uses a warm cat-themed aesthetic: pastel color palette, cat-ear pseudo-element decorations on widget headings, rounded corners, and cat-themed microcopy. Three challenges extend the base app: Light/Dark Mode toggle, Custom Name in Greeting, and Duplicate Task Prevention. Data is persisted through `localStorage`. No external APIs, no test framework.

### Key Design Decisions

- **Single JS file** — all widget logic, helpers, and initialization in `js/script.js`. No modules, no imports.
- **Single CSS file** — all styles in `css/style.css`.
- **No test framework** — verification is manual smoke-testing in the browser.
- **No external dependencies** — no CDN scripts, no npm packages.
- **Fail gracefully** — localStorage errors and unsupported APIs are caught and surfaced inline.

---

## Architecture

### File Structure

```
/
├── index.html       ← Single HTML shell; all widget containers declared here
├── css/
│   └── style.css    ← All styles: reset, custom properties, grid, widgets
└── js/
    └── script.js    ← All JavaScript: helpers, widget logic, initialization
```

### `script.js` Internal Organization

```
script.js
├── Storage helpers          ← storageRead(), storageWrite(), storageAvailable()
├── Time/date helpers        ← formatTime(), formatDate(), getTimeOfDay()
├── Validation helpers       ← validateName(), validateTaskTitle(), validateUrl(), validateLinkTitle()
├── Greeting/Clock widget    ← initGreeting(), startClock()
├── Focus Timer widget       ← initTimer()
├── To-Do widget             ← initTodo()
├── Quick Links widget       ← initQuickLinks()
└── Bootstrap                ← DOMContentLoaded → check storage → init all widgets
```

### Initialization Sequence

```
Browser loads index.html
  └─► style.css loads (render-blocking, intentional)
  └─► script.js loads (defer)
        └─► DOMContentLoaded fires
              ├─► storageAvailable() — if false, show #storage-warning banner
              ├─► initGreeting()     — reads pd_name → prompt or display
              ├─► startClock()       — setInterval 1000ms, updates time/date
              ├─► initTimer()        — sets up 25:00 countdown UI
              ├─► initTodo()         — reads pd_tasks → renders list
              └─► initQuickLinks()   — reads pd_links → renders links
```

---

## HTML Structure

### `index.html` Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personal Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- LocalStorage unavailability banner (hidden by default) -->
  <div id="storage-warning" hidden>
    Data cannot be saved in this session — LocalStorage is unavailable.
  </div>

  <main class="dashboard-grid">
    <!-- Widget 1: Greeting + Clock -->
    <section id="widget-greeting" class="widget">
      <!-- JS renders: name prompt OR greeting + clock display -->
    </section>

    <!-- Widget 2: Focus Timer -->
    <section id="widget-timer" class="widget">
      <!-- JS renders: countdown display + Start/Pause/Reset controls -->
    </section>

    <!-- Widget 3: To-Do List -->
    <section id="widget-todo" class="widget">
      <!-- JS renders: input, task list, incomplete count -->
    </section>

    <!-- Widget 4: Quick Links -->
    <section id="widget-quicklinks" class="widget">
      <!-- JS renders: link list + Add Link form -->
    </section>
  </main>

  <script src="js/script.js" defer></script>
</body>
</html>
```

---

## JavaScript Design (`js/script.js`)

### Storage Helpers

```js
function storageAvailable() {
  // Probe with test write/read/delete; returns boolean
}

function storageRead(key) {
  // JSON.parse(localStorage.getItem(key))
  // Returns null on missing key or JSON parse error
  // Calls console.warn('pd: corrupted key', key) on parse error
}

function storageWrite(key, value) {
  // localStorage.setItem(key, JSON.stringify(value))
  // Returns false on QuotaExceededError; true on success
}
```

**localStorage keys used:**

| Key | Type | Widget |
|-----|------|--------|
| `pd_name` | string | Greeting |
| `pd_tasks` | Task[] | To-Do |
| `pd_links` | Link[] | Quick Links |
| `pd_theme` | string (`"light"` \| `"dark"`) | Theme toggle |

---

### Time/Date Helpers

```js
function getTimeOfDay(hour)   // → "morning" | "afternoon" | "evening"
function formatTime(date)     // → "HH:MM:SS" (zero-padded)
function formatDate(date)     // → "Weekday, DD Month YYYY"
```

- `getTimeOfDay`: 5–11 → `"morning"`, 12–17 → `"afternoon"`, 0–4 and 18–23 → `"evening"`
- `formatTime`: zero-pads hours, minutes, seconds from `getHours/getMinutes/getSeconds`
- `formatDate`: uses `Intl.DateTimeFormat` or manual arrays for weekday/month names

---

### Validation Helpers

```js
function validateName(name)        // false if empty/whitespace or > 50 chars
function validateTaskTitle(title)  // false if empty/whitespace or > 100 chars
function validateUrl(url)          // true only if starts with http:// or https:// and ≤ 2048 chars
function validateLinkTitle(title)  // false if empty/whitespace or > 50 chars
```

---

### Greeting / Clock Widget — `initGreeting()` + `startClock()`

**Container:** `#widget-greeting`

**Design principle:** The clock and time-of-day greeting are always visible from the first page load. A name is optional personalization — it enhances the greeting but is never a gate.

**Greeting text logic:**
- No name stored → `"Good [morning/afternoon/evening]! 🐱"`
- Name stored → `"Good [morning/afternoon/evening], [Name]! 🐱"`

**Name edit flow (inline, non-blocking):**

```
Always visible: clock + greeting text + "✏️ Edit name" button

On "Edit name" click:
  └── Show inline input (pre-filled if name exists) + Save + Cancel
  └── Clock and greeting text remain visible above

On Save (valid name):
  └── storageWrite('pd_name', name) → update greeting text → hide input

On Save (empty/whitespace):
  └── Show inline error, input stays open

On Cancel:
  └── Hide input, no change
```

**DOM rendered by `initGreeting()`:**

```html
<div class="clock-time" id="clock-time">HH:MM:SS</div>
<div class="clock-date" id="clock-date">Weekday, DD Month YYYY</div>
<p id="greeting-text">Good morning! 🐱</p>
<button id="name-edit" aria-label="Edit name">✏️ Edit name</button>
<!-- Inline edit form, hidden by default -->
<div id="name-edit-form" hidden>
  <input id="name-input" type="text" maxlength="50" placeholder="Your name">
  <button id="name-submit">Save</button>
  <button id="name-cancel">Cancel</button>
  <span class="widget-error" id="name-error" role="alert"></span>
</div>
```

**`startClock()`** — called immediately from `initGreeting()`:
- `setInterval(tick, 1000)` where `tick()` sets `#clock-time` via `formatTime(new Date())` and `#clock-date` via `formatDate(new Date())`

---

### Focus Timer Widget — `initTimer()`

**Container:** `#widget-timer`

**Internal state (variables in closure):**
- `totalSeconds = 25 * 60` (1500)
- `remainingSeconds` — current countdown value
- `intervalId` — the `setInterval` handle, or `null` when stopped

**State machine:**

```
[idle: 25:00]
  └── Start → [running]

[running]
  └── Pause → [paused] (retains remainingSeconds)
  └── reaches 0 → [complete]

[paused]
  └── Start → [running] (resumes from remainingSeconds)
  └── Reset → [idle: 25:00]

[complete]
  └── Reset → [idle: 25:00]
```

**DOM rendered by `initTimer()`:**

```html
<h3>Focus Timer</h3>
<div class="timer-display" id="timer-display">25:00</div>
<div class="timer-controls">
  <button id="timer-start">Start</button>
  <button id="timer-pause" disabled>Pause</button>
  <button id="timer-reset">Reset</button>
</div>
<p class="timer-message" id="timer-message" hidden>Focus session done, stretch like a cat! 🐱</p>
```

**`formatTimerDisplay(seconds)`** — converts total seconds to `"MM:SS"` string.

Timer state is **not** persisted to localStorage. Every page load resets to 25:00.

---

### To-Do Widget — `initTodo()`

**Container:** `#widget-todo`

**Data model (stored under `pd_tasks`):**

```json
[
  {
    "id": "task_1720000000000",
    "title": "Buy groceries",
    "completed": false,
    "createdAt": 1720000000000
  }
]
```

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | `"task_"` + `Date.now()` |
| `title` | string | 1–100 chars, non-whitespace-only |
| `completed` | boolean | `false` on creation |
| `createdAt` | number | Unix timestamp (ms) |

**Internal operations (functions inside `initTodo` closure):**
- `addTask(title)` — validates title (empty, too long, duplicate); on success pushes, writes, re-renders; on failure shows error message
- `toggleTask(id)` — flips `completed`, writes to storage, re-renders
- `deleteTask(id)` — filters array, writes to storage, re-renders
- `renderTasks()` — clears `<ul>`; if empty shows `"No tasks yet — time for a cat nap 🐱"`; otherwise appends `<li>` per task; updates count
- `updateCount()` — sets count element to number of incomplete tasks
- **Duplicate check in `addTask`**: before adding, compare `title.trim().toLowerCase()` against each existing task's `title.trim().toLowerCase()`; if match found, show `"This task already exists"` and return

**DOM rendered by `initTodo()`:**

```html
<h3>To-Do <span id="todo-count">0 remaining</span></h3>
<div class="todo-input-row">
  <input id="todo-input" type="text" maxlength="100" placeholder="Add a task...">
  <button id="todo-add">Add</button>
</div>
<span class="widget-error" id="todo-error" role="alert"></span>
<ul id="todo-list"></ul>
```

Each task `<li>`:

```html
<li class="todo-item [completed]" data-id="task_...">
  <button class="todo-toggle" aria-label="Toggle complete">✓</button>
  <span class="todo-title">Buy groceries</span>
  <button class="todo-delete" aria-label="Delete task">✕</button>
</li>
```

Completed tasks get class `completed` → CSS applies `text-decoration: line-through` and reduced opacity.

---

### Quick Links Widget — `initQuickLinks()`

**Container:** `#widget-quicklinks`

**Data model (stored under `pd_links`):**

```json
[
  {
    "id": "link_1720000001000",
    "title": "GitHub",
    "url": "https://github.com"
  }
]
```

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | `"link_"` + `Date.now()` |
| `title` | string | 1–50 chars, non-whitespace-only |
| `url` | string | Starts with `http://` or `https://`, ≤ 2048 chars |

**Internal operations:**
- `addLink(title, url)` — validates both fields; on success pushes, writes, re-renders; on failure shows per-field errors
- `openLink(id)` — re-validates URL at open time; if valid opens `window.open(url, '_blank', 'noopener')`; if invalid shows inline error
- `deleteLink(id)` — filters array, writes, re-renders
- `renderLinks()` — clears container; if empty shows `"No links saved yet 🐾"`; otherwise appends one link card per entry

**DOM rendered by `initQuickLinks()`:**

```html
<h3>Quick Links</h3>
<div id="links-list"></div>
<button id="add-link-toggle">+ Add Link</button>
<div id="add-link-form" hidden>
  <input id="link-title-input" type="text" maxlength="50" placeholder="Title">
  <span class="widget-error" id="link-title-error" role="alert"></span>
  <input id="link-url-input" type="url" placeholder="https://...">
  <span class="widget-error" id="link-url-error" role="alert"></span>
  <button id="link-submit">Save</button>
  <button id="link-cancel">Cancel</button>
</div>
```

Each link card:

```html
<div class="link-card" data-id="link_...">
  <a class="link-anchor" href="#" rel="noopener">GitHub</a>
  <button class="link-delete" aria-label="Delete link">✕</button>
</div>
```

---

## CSS Design (`css/style.css`)

### CSS Custom Properties

```css
:root {
  /* Warm pastel cat palette */
  --color-bg:      #fdf6ee;   /* cream */
  --color-surface: #ffffff;
  --color-accent:  #c96b30;   /* soft ginger / burnt orange */
  --color-text:    #3b2a1a;   /* warm brown */
  --color-muted:   #8a6a50;
  --color-hover:   #fef0e0;   /* light ginger tint */
  --color-error:   #c0392b;
  --color-success: #2e7d32;
  --radius:        1rem;
  --radius-btn:    0.5rem;
  --shadow:        0 4px 16px rgba(59, 42, 26, 0.1);
  --font-body:     'Segoe UI', system-ui, sans-serif;
  --font-mono:     'Cascadia Code', 'Courier New', monospace;
}

/* Dark mode overrides */
[data-theme="dark"] {
  --color-bg:      #1a1008;
  --color-surface: #2c1f10;
  --color-accent:  #e07a3a;
  --color-text:    #f5e6d3;
  --color-muted:   #b89070;
  --color-hover:   #3d2810;
  --color-error:   #e57373;
  --color-success: #81c784;
  --shadow:        0 4px 16px rgba(0, 0, 0, 0.4);
}
```

### Responsive Grid Layout

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

@media (min-width: 640px) {
  .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
  /* Greeting spans full width on desktop */
  #widget-greeting { grid-column: 1 / -1; }
}
```

### Widget Card Base

```css
.widget {
  background:    var(--color-surface);
  border-radius: var(--radius);
  box-shadow:    var(--shadow);
  padding:       1.25rem;
  position:      relative; /* needed for cat-ear pseudo-elements */
}
```

### Cat-Ear Decorations on Widget Headings

Each widget `<h3>` gets cat ears via `::before` and `::after` — pure CSS triangles, no image assets:

```css
.widget h3 {
  position: relative;
  padding-top: 0.75rem;
  color: var(--color-accent);
}

.widget h3::before,
.widget h3::after {
  content: '';
  position: absolute;
  top: -0.6rem;
  width: 0;
  height: 0;
  border-left:   10px solid transparent;
  border-right:  10px solid transparent;
  border-bottom: 14px solid var(--color-accent);
}

.widget h3::before { left: 0.75rem; }
.widget h3::after  { left: 1.6rem;  }
```

### Key Widget-Specific Styles

- **Clock time** (`.clock-time`): large monospace font via `--font-mono`, `color: var(--color-accent)`
- **Timer display** (`.timer-display`): very large monospace, centered, `color: var(--color-accent)`
- **Completed tasks** (`.todo-item.completed .todo-title`): `text-decoration: line-through`, `opacity: 0.5`
- **Empty state messages** (`.empty-state`): `color: var(--color-muted)`, centered, italic
- **Error spans** (`.widget-error`): `color: var(--color-error)`, `display: none` by default; shown by setting `display: block`
- **Storage warning** (`#storage-warning`): full-width banner, `background: var(--color-error)`, shown by removing `hidden` attribute
- **Buttons**: `background: var(--color-accent)`, `color: #fff`, `border-radius: var(--radius-btn)`, hover uses `filter: brightness(0.9)`
- **Link/card hover**: `background: var(--color-hover)`, smooth `transition: background 0.2s`
- **Theme toggle** (`#theme-toggle`): in page header, icon swaps between 🌙 (light mode) and ☀️ (dark mode)

---

## Error Handling

| Scenario | Widget | Response |
|----------|--------|----------|
| LocalStorage unavailable | All | Show `#storage-warning` banner; widgets still render with empty state |
| Corrupted JSON in localStorage | Per key | Treat as absent; `console.warn('pd: corrupted key', key)`; widget shows empty state |
| Empty/whitespace name | Greeting | Show inline error; do not save |
| Empty/whitespace task title | Todo | Show inline error; do not add |
| Task title > 100 chars | Todo | Show `"Title is too long"` inline error; do not add |
| Duplicate task title | Todo | Show `"This task already exists"` inline error; do not add |
| Todo list empty | Todo | Show `"No tasks yet — time for a cat nap 🐱"` empty state |
| Empty/whitespace link title | QuickLinks | Show per-field inline error; do not save |
| URL missing http(s):// scheme | QuickLinks | Show per-field inline error; do not save |
| Invalid URL at open time | QuickLinks | Show inline error; do not navigate |
| Links list empty | QuickLinks | Show `"No links saved yet 🐾"` empty state |
| Timer reaches 00:00 | Timer | Stop interval; show `"Focus session done, stretch like a cat! 🐱"` |

---

## Challenge Implementations

### Challenge A — Light/Dark Mode (`initTheme()`)

- Add `<header>` with `#theme-toggle` button to `index.html` above `.dashboard-grid`
- `initTheme()` in `script.js`:
  - Read `storageRead('pd_theme')`; apply `document.documentElement.setAttribute('data-theme', theme)` — defaults to `"light"`
  - Wire `#theme-toggle` click: read current `data-theme`, flip to opposite, write to `storageWrite('pd_theme', newTheme)`, update button icon (🌙 for light, ☀️ for dark)
- CSS: `[data-theme="dark"]` custom property overrides defined in `style.css`

### Challenge B — Custom Name in Greeting (part of `initGreeting()`)

- Clock and generic greeting (`"Good [morning/afternoon/evening]! 🐱"`) always render on load, regardless of stored name
- `#name-edit-form` is hidden by default; `#name-edit` button is always visible
- On Save: update `#greeting-text` to personalized format; no page reload needed

### Challenge C — Duplicate Task Prevention (part of `addTask()`)

```js
// Before creating a new task object:
const normalise = s => s.trim().toLowerCase();
const duplicate = tasks.some(t => normalise(t.title) === normalise(title));
if (duplicate) {
  showError(todoError, 'This task already exists');
  return;
}
```

---

## Manual Smoke-Test Checklist

No test framework is used. After implementation, verify the following in a browser:

**Greeting/Clock**
- [ ] Page loads → clock shows immediately, generic greeting shown, no blocking prompt
- [ ] "Edit name" control visible; click → inline input appears (clock still visible)
- [ ] Enter valid name → greeting updates to personalized format; persists after reload
- [ ] Submit empty name → inline error shown, nothing saved
- [ ] Cancel → input hidden, no change

**Focus Timer**
- [ ] Loads at 25:00; Pause disabled
- [ ] Start → countdown ticks; Pause enabled
- [ ] Pause → countdown stops; Start re-enables
- [ ] Resume → continues from paused time
- [ ] Reset → returns to 25:00 from any state
- [ ] Let timer reach 00:00 → stops, "Focus session done, stretch like a cat! 🐱" shown
- [ ] Page reload → timer resets to 25:00

**To-Do**
- [ ] Empty state shows "No tasks yet — time for a cat nap 🐱"
- [ ] Add valid task → appears in list, count updates, persists after reload
- [ ] Add empty task → inline error shown
- [ ] Add task > 100 chars → inline error shown
- [ ] Add duplicate task → "This task already exists" shown
- [ ] Toggle complete → strikethrough + opacity; count updates; persists
- [ ] Toggle again → uncompletes; count updates; persists
- [ ] Delete task → removed from list and localStorage

**Quick Links**
- [ ] Empty state shows "No links saved yet 🐾"
- [ ] Add valid link → appears, persists after reload
- [ ] Add link with empty title → title error shown
- [ ] Add link without http(s) prefix → URL error shown
- [ ] Click link → opens in new tab
- [ ] Delete link → removed from list and localStorage

**Light/Dark Mode**
- [ ] Toggle button visible in header
- [ ] Click → theme switches; preference saved to `pd_theme`
- [ ] Reload → saved theme is restored

**Persistence / Edge Cases**
- [ ] Corrupt `pd_tasks` JSON in DevTools → widget shows empty state, console.warn logged
- [ ] All widgets load correctly on reload with data present
- [ ] Cat-ear shapes visible on all widget headings
- [ ] Warm pastel palette applied (cream bg, ginger accent, warm brown text)
