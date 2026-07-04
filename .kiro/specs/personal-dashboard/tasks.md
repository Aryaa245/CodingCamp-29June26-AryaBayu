# Implementation Plan: Personal Dashboard

## Overview

Implement a cat-themed personal dashboard using vanilla HTML, CSS, and JavaScript. Everything lives in three files: `index.html`, `css/style.css`, and `js/script.js`. No frameworks, no bundlers, no test framework. Verification is manual smoke-testing in the browser.

**Four widgets:** Greeting/Clock · Focus Timer · To-Do List · Quick Links
**Three challenges:** Light/Dark Mode · Custom Name · Duplicate Task Prevention

---

## Tasks

- [x] 1. Create `index.html` — page shell and widget containers
  - Create `index.html` with `<!DOCTYPE html>`, `lang="en"`, `<meta charset="UTF-8">`, and viewport meta tag
  - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
  - Add a `<header>` element above `.dashboard-grid` containing a page title and `<button id="theme-toggle" aria-label="Toggle theme">🌙</button>`
  - Add `<div id="storage-warning" hidden>` banner below `<header>`
  - Add `<main class="dashboard-grid">` containing four `<section>` elements with class `widget` and IDs: `#widget-greeting`, `#widget-timer`, `#widget-todo`, `#widget-quicklinks`; each section should have an `<h3>` heading with the widget title
  - Add `<script src="js/script.js" defer></script>` before `</body>`
  - Create empty placeholder files `css/style.css` and `js/script.js`
  - _Requirements: 1.1, 1.3_

- [ ] 2. Implement storage helpers in `js/script.js`
  - Implement `storageAvailable()` — probes localStorage with a test write/read/delete; returns `true` or `false`
  - Implement `storageRead(key)` — calls `JSON.parse(localStorage.getItem(key))`; returns `null` on missing key or parse error; calls `console.warn('pd: corrupted key', key)` on parse errors
  - Implement `storageWrite(key, value)` — calls `localStorage.setItem(key, JSON.stringify(value))`; catches `QuotaExceededError` and returns `false`; returns `true` on success
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 3. Implement helpers in `js/script.js`
  - Implement `getTimeOfDay(hour)` — returns `"morning"` for hours 5–11, `"afternoon"` for 12–17, `"evening"` for 0–4 and 18–23
  - Implement `formatTime(date)` — returns `"HH:MM:SS"` using zero-padded `getHours/getMinutes/getSeconds`
  - Implement `formatDate(date)` — returns `"Weekday, DD Month YYYY"` (e.g., `"Friday, 4 July 2025"`) using day/month name arrays or `Intl.DateTimeFormat`
  - Implement `validateName(name)` — returns `false` if trimmed value is empty or string is longer than 50 chars
  - Implement `validateTaskTitle(title)` — returns `false` if trimmed value is empty or string is longer than 100 chars
  - Implement `validateUrl(url)` — returns `true` only if string starts with `"http://"` or `"https://"` and length is ≤ 2048
  - Implement `validateLinkTitle(title)` — returns `false` if trimmed value is empty or longer than 50 chars
  - Implement `showError(el, msg)` — sets `el.textContent = msg`, `el.style.display = 'block'`
  - Implement `clearError(el)` — sets `el.textContent = ''`, `el.style.display = 'none'`
  - _Requirements: 2.4, 2.7, 4.3, 4.4, 5.3_

- [x] 4. Implement `initGreeting()` and `startClock()` in `js/script.js`
  - [ ] 4.1 Render greeting and clock HTML into `#widget-greeting`
    - Inject into `#widget-greeting`: `<div class="clock-time" id="clock-time"></div>`, `<div class="clock-date" id="clock-date"></div>`, `<p id="greeting-text"></p>`, `<button id="name-edit">✏️ Edit name</button>`, and a hidden `<div id="name-edit-form">` containing `#name-input` (maxlength 50), `#name-submit`, `#name-cancel`, and `<span class="widget-error" id="name-error">`
    - Read `storageRead('pd_name')` to build the initial greeting text: if name exists use `"Good [salutation], [Name]! 🐱"`, otherwise use `"Good [salutation]! 🐱"`
    - Set `#greeting-text` innerHTML immediately; call `startClock()` immediately — do not wait for a name
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 9.1_
  - [ ] 4.2 Implement name edit controls (Challenge B)
    - `#name-edit` click: remove `hidden` from `#name-edit-form`; if name stored, pre-fill `#name-input`
    - `#name-submit` click: read `#name-input` value; call `validateName()`; if invalid call `showError(nameError, 'Name cannot be empty')`; if valid call `storageWrite('pd_name', name.trim())`, update `#greeting-text`, add `hidden` back to form, call `clearError(nameError)`
    - `#name-cancel` click: add `hidden` back to form, call `clearError(nameError)`
    - _Requirements: 9.3, 9.4, 9.5, 9.6_
  - [ ] 4.3 Implement `startClock()`
    - Immediately call `tick()` once to populate the display without waiting 1 second
    - `tick()`: set `#clock-time.textContent = formatTime(new Date())` and `#clock-date.textContent = formatDate(new Date())`
    - Start `setInterval(tick, 1000)`
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Implement `initTimer()` in `js/script.js`
  - [ ] 5.1 Render timer HTML and initialise state
    - Inject into `#widget-timer`: `<div class="timer-display" id="timer-display">25:00</div>`, a `.timer-controls` div with `#timer-start`, `#timer-pause` (disabled), `#timer-reset` buttons, and `<p class="timer-message" id="timer-message" hidden>Focus session done, stretch like a cat! 🐱</p>`
    - Declare closure variables: `let remainingSeconds = 1500`, `let intervalId = null`
    - Implement `formatTimerDisplay(s)` — returns `"MM:SS"` with zero-padded minutes and seconds
    - _Requirements: 3.1_
  - [ ] 5.2 Implement Start, Pause, Reset, and completion logic
    - `#timer-start` click: `intervalId = setInterval(timerTick, 1000)`; disable `#timer-start`; enable `#timer-pause`; hide `#timer-message`
    - `timerTick()`: `remainingSeconds--`; update `#timer-display` via `formatTimerDisplay(remainingSeconds)`; if `remainingSeconds <= 0` call `timerComplete()`
    - `#timer-pause` click: `clearInterval(intervalId)`; enable `#timer-start`; disable `#timer-pause`
    - `#timer-reset` click: `clearInterval(intervalId)`; `remainingSeconds = 1500`; update `#timer-display` to `"25:00"`; enable `#timer-start`; disable `#timer-pause`; hide `#timer-message`
    - `timerComplete()`: `clearInterval(intervalId)`; set `#timer-display` to `"00:00"`; remove `hidden` from `#timer-message`; disable both `#timer-start` and `#timer-pause`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 6. Implement `initTodo()` in `js/script.js`
  - [ ] 6.1 Render todo HTML and restore tasks from localStorage
    - Inject into `#widget-todo`: `<p id="todo-count"></p>`, an input row with `#todo-input` (maxlength 100) and `#todo-add`, `<span class="widget-error" id="todo-error">`, `<ul id="todo-list"></ul>`
    - Load `tasks = storageRead('pd_tasks') || []`; call `renderTasks()` and `updateCount()`
    - _Requirements: 4.1, 4.7, 4.8_
  - [ ] 6.2 Implement `addTask()` with duplicate prevention (Challenge C)
    - On `#todo-add` click (and Enter key on `#todo-input`): read `#todo-input.value`
    - Call `validateTaskTitle()`; if empty/whitespace: `showError(todoError, 'Title cannot be empty')`; return
    - If title exceeds 100 chars: `showError(todoError, 'Title is too long (max 100 characters)')`; return
    - Duplicate check: `const norm = s => s.trim().toLowerCase(); if (tasks.some(t => norm(t.title) === norm(title))) { showError(todoError, 'This task already exists'); return; }`
    - On all valid: create `{ id: 'task_' + Date.now(), title: title.trim(), completed: false, createdAt: Date.now() }`, push to `tasks`, call `storageWrite('pd_tasks', tasks)`, `renderTasks()`, `updateCount()`, clear input, `clearError(todoError)`
    - _Requirements: 4.2, 4.3, 4.4, 10.1, 10.2, 10.3_
  - [ ] 6.3 Implement `renderTasks()`, `toggleTask(id)`, `deleteTask(id)`, and `updateCount()`
    - `renderTasks()`: clear `#todo-list`; if `tasks.length === 0` show `<li class="empty-state">No tasks yet — time for a cat nap 🐱</li>`; otherwise for each task append `<li class="todo-item${task.completed ? ' completed' : ''}" data-id="${task.id}">` containing a toggle button (`.todo-toggle`), `<span class="todo-title">${task.title}</span>`, and a delete button (`.todo-delete`); wire click events
    - `toggleTask(id)`: find task by id; flip `completed`; `storageWrite`; `renderTasks()`; `updateCount()`
    - `deleteTask(id)`: filter out by id; `storageWrite`; `renderTasks()`; `updateCount()`
    - `updateCount()`: set `#todo-count.textContent` to `"${n} remaining"` where n is count of `!task.completed`
    - _Requirements: 4.5, 4.6, 4.8, 4.9_

- [x] 7. Implement `initQuickLinks()` in `js/script.js`
  - [ ] 7.1 Render links HTML and restore links from localStorage
    - Inject into `#widget-quicklinks`: `<div id="links-list"></div>`, `<button id="add-link-toggle">+ Add Link</button>`, hidden `<div id="add-link-form">` containing `#link-title-input` (maxlength 50), `<span class="widget-error" id="link-title-error">`, `#link-url-input`, `<span class="widget-error" id="link-url-error">`, `#link-submit`, `#link-cancel`
    - Load `links = storageRead('pd_links') || []`; call `renderLinks()`
    - `#add-link-toggle` click: remove `hidden` from `#add-link-form`
    - `#link-cancel` click: add `hidden` to form; clear both inputs and errors
    - _Requirements: 5.1, 5.6_
  - [ ] 7.2 Implement `addLink()`
    - On `#link-submit` click: validate title with `validateLinkTitle()` and URL with `validateUrl()` independently; show per-field errors for each failure; return without saving if either is invalid
    - On both valid: create `{ id: 'link_' + Date.now(), title: title.trim(), url }`, push to `links`, `storageWrite('pd_links', links)`, `renderLinks()`, add `hidden` to form, clear inputs and errors
    - _Requirements: 5.2, 5.3_
  - [ ] 7.3 Implement `renderLinks()`, `openLink(id)`, and `deleteLink(id)`
    - `renderLinks()`: clear `#links-list`; if `links.length === 0` show `<p class="empty-state">No links saved yet 🐾</p>`; otherwise for each link append `<div class="link-card" data-id="${link.id}">` containing `<button class="link-anchor">${link.title}</button>` and `<button class="link-delete">✕</button>`; wire click events
    - `openLink(id)`: find link; re-validate with `validateUrl(link.url)`; if valid `window.open(link.url, '_blank', 'noopener')`; if invalid show error near `#links-list`
    - `deleteLink(id)`: filter out by id; `storageWrite`; `renderLinks()`
    - _Requirements: 5.4, 5.5, 5.6, 5.7_

- [x] 8. Implement `initTheme()` and bootstrap in `js/script.js`
  - [ ] 8.1 Implement `initTheme()` (Challenge A)
    - Read `storageRead('pd_theme')`; apply `document.documentElement.setAttribute('data-theme', theme || 'light')`
    - Update `#theme-toggle` icon: `🌙` when in light mode, `☀️` when in dark mode
    - Wire `#theme-toggle` click: read current `data-theme`; flip to opposite; `setAttribute` to new value; `storageWrite('pd_theme', newTheme)`; update button icon
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 8.2 Bootstrap all widgets
    - Add `document.addEventListener('DOMContentLoaded', () => { ... })` at the bottom of `script.js`
    - Inside: call `storageAvailable()`; if `false`, remove `hidden` from `#storage-warning`
    - Call in order: `initTheme()`, `initGreeting()`, `initTimer()`, `initTodo()`, `initQuickLinks()`
    - _Requirements: 1.1, 1.3, 6.3, 6.4_

- [x] 9. Implement `css/style.css` — base reset, cat theme, and layout
  - [ ] 9.1 Base reset and cat-theme CSS custom properties
    - Apply `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
    - Declare `:root` custom properties: `--color-bg: #fdf6ee` (cream), `--color-surface: #ffffff`, `--color-accent: #c96b30` (soft ginger/burnt orange), `--color-text: #3b2a1a` (warm brown), `--color-muted: #8a6a50`, `--color-hover: #fef0e0` (light ginger tint), `--color-error: #c0392b`, `--color-success: #2e7d32`, `--radius: 1rem`, `--radius-btn: 0.5rem`, `--shadow: 0 4px 16px rgba(59,42,26,0.1)`, `--font-body`, `--font-mono`
    - Declare `[data-theme="dark"]` overrides: `--color-bg: #1a1008`, `--color-surface: #2c1f10`, `--color-accent: #e07a3a`, `--color-text: #f5e6d3`, `--color-muted: #b89070`, `--color-hover: #3d2810`, `--shadow: 0 4px 16px rgba(0,0,0,0.4)`
    - Set `body`: `background: var(--color-bg)`, `color: var(--color-text)`, `font-family: var(--font-body)`, `min-height: 100vh`
    - _Requirements: 1.1, 7.1_
  - [x] 9.2 Responsive grid layout
    - `.dashboard-grid`: `display: grid`, `grid-template-columns: 1fr`, `gap: 1rem`, `padding: 1rem`
    - `@media (min-width: 640px)`: `grid-template-columns: repeat(2, 1fr)`
    - `@media (min-width: 1024px)`: `repeat(2, 1fr)` with `#widget-greeting { grid-column: 1 / -1; }`
    - _Requirements: 1.2_
  - [ ] 9.3 Widget card styles, cat-ear headings, and component styles
    - `.widget`: `background: var(--color-surface)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow)`, `padding: 1.25rem`, `position: relative`
    - `.widget h3`: `position: relative`, `padding-top: 0.75rem`, `color: var(--color-accent)` — headings use the accent color
    - `.widget h3::before, .widget h3::after`: `content: ''`, `position: absolute`, `top: -0.6rem`, CSS border-trick triangle (`border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 14px solid var(--color-accent)`) to form cat-ear shapes; `::before` at `left: 0.75rem`, `::after` at `left: 1.6rem`
    - `.clock-time`: `font-family: var(--font-mono)`, large font (e.g., `3rem`), `color: var(--color-accent)`
    - `.clock-date`: `color: var(--color-muted)`, smaller size
    - `.timer-display`: `font-family: var(--font-mono)`, very large (e.g., `4rem`), centered, `color: var(--color-accent)`
    - `.todo-item.completed .todo-title`: `text-decoration: line-through`, `opacity: 0.5`
    - `.empty-state`: `color: var(--color-muted)`, `text-align: center`, `font-style: italic`, `padding: 1rem 0`
    - `.widget-error`: `color: var(--color-error)`, `display: none`, `font-size: 0.85rem`
    - `#storage-warning`: full-width, `background: var(--color-error)`, `color: #fff`, `padding: 0.75rem 1rem`, `text-align: center`
    - Buttons: `background: var(--color-accent)`, `color: #fff`, `border: none`, `border-radius: var(--radius-btn)`, `cursor: pointer`, `padding: 0.4rem 0.9rem`; hover: `filter: brightness(0.9)`
    - `.link-card`: `display: flex`, `align-items: center`, `gap: 0.5rem`, `padding: 0.4rem 0.5rem`, `border-radius: var(--radius-btn)`; hover: `background: var(--color-hover)`, `transition: background 0.2s`
    - Form inputs: `border: 1px solid var(--color-muted)`, `border-radius: var(--radius-btn)`, `padding: 0.4rem 0.6rem`, `font-family: var(--font-body)`; focus: `outline: 2px solid var(--color-accent)`, `outline-offset: 2px`
    - `#theme-toggle`: ghost-style button (`background: transparent`, `border: none`, `font-size: 1.2rem`, `cursor: pointer`)
    - _Requirements: 1.2, 7.2, 7.3_

- [ ] 10. Manual smoke-test verification
  - Open `index.html` directly in a browser and verify each item in the checklist below
  - **Greeting/Clock**: clock and generic greeting visible immediately on first load; Edit button present; clicking shows inline input (clock stays visible); save valid name → personalized greeting + persists on reload; empty name → error; cancel → no change
  - **Focus Timer**: loads at 25:00; Start/Pause/Resume cycle works; Reset from any state returns to 25:00; reaches 00:00 → "Focus session done, stretch like a cat! 🐱" shown; reload resets to 25:00
  - **To-Do**: empty state shows "No tasks yet — time for a cat nap 🐱"; add valid task → persists; empty → error; >100 chars → error; duplicate → "This task already exists"; toggle → strikethrough + count updates → persists; delete → gone from list and localStorage
  - **Quick Links**: empty state shows "No links saved yet 🐾"; add valid link → persists; empty title → error; missing http(s) → error; click opens new tab; delete removes entry
  - **Light/Dark Mode**: toggle in header switches theme; preference persists across reload; cat palette correct in both modes
  - **Cat theme**: cat-ear shapes visible on all widget headings; cream background, ginger accent, warm brown text applied; rounded corners on cards and buttons
  - **Edge cases**: corrupt `pd_tasks` in DevTools → empty list + console.warn; LocalStorage disabled → warning banner shown; all widgets load correctly with data on reload
  - _Requirements: all_
