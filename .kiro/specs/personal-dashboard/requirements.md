# Requirements Document

## Introduction

The Personal Dashboard is a single-page web application built with vanilla HTML, CSS, and JavaScript — no frameworks, no bundlers, no build steps. It serves as a lightweight browser homepage or personal productivity hub. All logic lives in a single `js/script.js` file and all styles in `css/style.css`. The dashboard has a warm cat-themed aesthetic (pastel palette, cat-ear widget headings, cat-themed microcopy) and provides four widgets: a combined Greeting and Clock display, a 25-minute Focus Timer, a To-Do list, and a Quick Links bookmarks section. Three optional challenges extend the app: Light/Dark Mode toggle, Custom Name in Greeting, and Duplicate Task Prevention. All user data is persisted through the browser's `localStorage` API. No backend, no external APIs, and no test framework are required.

## Glossary

- **Dashboard**: The single-page web application defined in this document.
- **Widget**: A self-contained UI section within the Dashboard.
- **User**: The person using the Dashboard in a web browser.
- **LocalStorage**: The browser's built-in `localStorage` API used to persist data across sessions.
- **Greeting_Widget**: The Widget that displays the current date/time, a time-of-day greeting, and optionally a personalized name.
- **Timer_Widget**: The Widget that provides a 25-minute countdown focus timer.
- **Todo_Widget**: The Widget that provides a task list for the User to manage to-do items.
- **QuickLinks_Widget**: The Widget that displays a collection of user-defined bookmarks.
- **Task**: An individual to-do item managed within the Todo_Widget.

---

## Requirements

### Requirement 1: Dashboard Shell and Layout

**User Story:** As a User, I want a clean single-page layout that loads all widgets at once, so that I can see all my personal information at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four Widgets on a single HTML page without requiring page navigation.
2. THE Dashboard SHALL display Widgets in a responsive grid layout that switches to a single-column layout at or below 640px and a multi-column layout at or above 1024px.
3. WHEN the Dashboard page loads, THE Dashboard SHALL render all Widget containers with visible content in the DOM within 3 seconds.
4. IF the browser does not support LocalStorage, THEN THE Dashboard SHALL display a persistent warning banner at the top of the page informing the User that data cannot be saved.

---

### Requirement 2: Greeting and Clock

**User Story:** As a User, I want to see the current time, date, and a time-of-day greeting the moment I open the dashboard, so that I always know the time without any setup required.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in HH:MM:SS format on initial page render, with no dependency on a stored name.
2. THE Greeting_Widget SHALL display the current local date including the full day name, day number, month name, and year (e.g., "Monday, 30 June 2025").
3. WHILE the Dashboard page is open, THE Greeting_Widget SHALL update the time display every 1000 milliseconds or fewer.
4. THE Greeting_Widget SHALL derive the salutation from the current local hour: "Good morning" for 05:00–11:59, "Good afternoon" for 12:00–17:59, and "Good evening" for 18:00–04:59.
5. WHEN no name is stored in LocalStorage, THE Greeting_Widget SHALL display a generic greeting in the format "Good [morning/afternoon/evening]! 🐱".
6. WHEN a name is stored in LocalStorage, THE Greeting_Widget SHALL display a personalized greeting in the format "Good [morning/afternoon/evening], [Name]! 🐱".
7. THE Greeting_Widget SHALL never block the clock or greeting display behind a name-entry gate; the clock and greeting SHALL be visible immediately on every page load.

---

### Requirement 3: Focus Timer

**User Story:** As a User, I want a 25-minute countdown timer on my dashboard so that I can use the Pomodoro technique to stay focused.

#### Acceptance Criteria

1. THE Timer_Widget SHALL display a countdown starting at 25:00 (minutes:seconds) on initial page render.
2. WHEN the User activates the Start control, THE Timer_Widget SHALL begin counting down one second per second.
3. WHILE the timer is running, THE Timer_Widget SHALL update the displayed time every second.
4. WHEN the User activates the Pause control while the timer is running, THE Timer_Widget SHALL stop the countdown and retain the current remaining time.
5. WHEN the User activates the Start control after a pause, THE Timer_Widget SHALL resume counting down from the retained time.
6. WHEN the User activates the Reset control, THE Timer_Widget SHALL stop the countdown and reset the displayed time to 25:00.
7. WHEN the countdown reaches 00:00, THE Timer_Widget SHALL stop automatically and display a visible completion message: "Focus session done, stretch like a cat! 🐱".
8. THE Timer_Widget SHALL NOT persist timer state to LocalStorage; each page load starts fresh at 25:00.

---

### Requirement 4: To-Do / Task List

**User Story:** As a User, I want to manage a personal to-do list on my dashboard, so that I can track tasks and stay organized.

#### Acceptance Criteria

1. THE Todo_Widget SHALL display an input field and a submit control that allows the User to add a new Task.
2. WHEN the User submits a non-empty Task title of 100 characters or fewer, THE Todo_Widget SHALL add the Task to the list and persist all Tasks to LocalStorage.
3. IF the User submits an empty or whitespace-only Task title, THEN THE Todo_Widget SHALL display an inline validation message and SHALL NOT add the Task.
4. IF the User submits a Task title exceeding 100 characters, THEN THE Todo_Widget SHALL display an inline validation message indicating the title is too long and SHALL NOT add the Task.
5. IF the User submits a Task title that matches an existing task's title (case-insensitive, whitespace-trimmed), THEN THE Todo_Widget SHALL display an inline validation message (e.g., "This task already exists") and SHALL NOT add the duplicate.
5. WHEN the User activates the complete control on an incomplete Task, THE Todo_Widget SHALL visually mark the Task as completed using strikethrough text and reduced opacity, and update LocalStorage; WHEN the User activates the complete control on a completed Task, THE Todo_Widget SHALL reverse the styling and update LocalStorage.
6. WHEN the User activates the delete control on a Task, THE Todo_Widget SHALL remove the Task from the list and update LocalStorage.
7. WHEN the Dashboard loads and Tasks exist in LocalStorage, THE Todo_Widget SHALL restore and display all saved Tasks with their correct completion states.
8. THE Todo_Widget SHALL display the count of remaining incomplete Tasks.
9. WHEN the task list is empty, THE Todo_Widget SHALL display the text "No tasks yet — time for a cat nap 🐱".

---

### Requirement 5: Quick Links / Bookmarks

**User Story:** As a User, I want to save and access my frequently visited links directly from the dashboard, so that I can navigate to important sites with a single click.

#### Acceptance Criteria

1. THE QuickLinks_Widget SHALL display an "Add Link" control that opens a form requesting a link title and URL.
2. WHEN the User submits a title that is non-empty after trimming and 50 characters or fewer, and a URL that starts with "http://" or "https://" and is 2048 characters or fewer, THE QuickLinks_Widget SHALL add the link to the list and persist all links to LocalStorage.
3. IF the User submits a link with a title that is empty or whitespace-only, or a URL that does not start with "http://" or "https://", THEN THE QuickLinks_Widget SHALL display inline validation messages identifying each invalid field and SHALL NOT save the link.
4. WHEN the User activates a saved link, THE QuickLinks_Widget SHALL verify the stored URL begins with "http://" or "https://" and, IF valid, SHALL open the URL in a new browser tab; IF the URL is invalid at open time, THE QuickLinks_Widget SHALL display an inline error message and SHALL NOT navigate.
5. WHEN the User activates the delete control on a saved link, THE QuickLinks_Widget SHALL remove the link from the list and update LocalStorage.
6. WHEN the Dashboard loads and links exist in LocalStorage, THE QuickLinks_Widget SHALL restore and display all previously saved links.
7. WHEN the links list is empty, THE QuickLinks_Widget SHALL display the text "No links saved yet 🐾".

---

### Requirement 6: Data Persistence

**User Story:** As a User, I want my dashboard data to be saved between sessions, so that my tasks, links, and name are still there when I reopen the browser.

#### Acceptance Criteria

1. THE Dashboard SHALL use LocalStorage as the sole persistence mechanism for: user name (`pd_name`), Tasks (`pd_tasks`), quick links (`pd_links`), and theme preference (`pd_theme`).
2. WHEN any user data changes (Task added, completion toggled, or deleted; link added or deleted; name saved or updated), THE Dashboard SHALL synchronously write the complete updated data set for that type to LocalStorage.
3. WHEN the Dashboard loads, THE Dashboard SHALL read `pd_name`, `pd_tasks`, `pd_links`, and `pd_theme` from LocalStorage and restore each Widget's state before rendering.
4. IF LocalStorage is unavailable or a write operation throws an error, THEN THE Dashboard SHALL display a persistent, non-blocking warning banner at the top of the page.
5. IF a LocalStorage read returns data that cannot be parsed as valid JSON for a given key, THEN THE Dashboard SHALL treat that key as absent, initialize the Widget with an empty default state, and log a console warning identifying the corrupted key.

---

### Requirement 7: Cat Theme

**User Story:** As a User, I want the dashboard to have a warm, playful cat-themed visual design, so that it feels friendly and personal.

#### Acceptance Criteria

1. THE Dashboard SHALL use a warm pastel color palette: cream background (`#fdf6ee`), soft ginger/burnt orange accent (`#c96b30`), warm brown text (`#3b2a1a`), and light ginger tint for hover states (`#fef0e0`).
2. Each Widget heading SHALL display decorative cat-ear shapes using CSS `::before` and `::after` pseudo-elements — no image assets.
3. Widget cards and buttons SHALL use rounded corners for a soft, friendly appearance.

---

### Requirement 8: Challenge A — Light/Dark Mode Toggle

**User Story:** As a User, I want to switch between light and dark mode, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL display a toggle button (sun/moon icon or equivalent label) in the page header.
2. WHEN the User activates the toggle, THE Dashboard SHALL switch between light and dark color schemes by setting a `data-theme` attribute on `<html>` or `<body>`.
3. WHEN the User activates the toggle, THE Dashboard SHALL persist the chosen theme to LocalStorage under `pd_theme`.
4. WHEN the Dashboard loads, THE Dashboard SHALL read `pd_theme` from LocalStorage and apply the stored theme before rendering; IF no preference is stored, THE Dashboard SHALL default to light mode.

---

### Requirement 9: Challenge B — Custom Name in Greeting

**User Story:** As a User, I want to optionally set my name so that my greeting feels more personal, without it ever blocking the clock from showing.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display a small "Edit name" control (pencil icon or "Edit" link) near the greeting text at all times.
2. WHEN the User activates the edit control, THE Greeting_Widget SHALL show an inline input field for entering or updating a name, without hiding the clock or the generic greeting.
3. WHEN the User submits a non-empty name of 50 characters or fewer, THE Greeting_Widget SHALL save it to LocalStorage under `pd_name` and update the greeting to the personalized format.
4. WHEN the User activates a cancel control, THE Greeting_Widget SHALL hide the input without changing any stored value.
5. IF the User submits an empty or whitespace-only name, THEN THE Greeting_Widget SHALL display an inline error message and SHALL NOT save the name.
6. THE name input SHALL be additive only — it SHALL never replace or block the clock and time-of-day greeting display.

---

### Requirement 10: Challenge C — Prevent Duplicate Tasks

**User Story:** As a User, I want the dashboard to warn me when I try to add a task that already exists, so that I don't clutter my list with duplicates.

#### Acceptance Criteria

1. WHEN the User submits a Task title, THE Todo_Widget SHALL compare the trimmed, lowercase version of the new title against the trimmed, lowercase title of every existing task.
2. IF a matching task exists, THEN THE Todo_Widget SHALL display an inline validation message ("This task already exists") and SHALL NOT add the duplicate.
3. THE duplicate check SHALL be case-insensitive and whitespace-trimmed (e.g., "Buy milk" and "buy milk " SHALL be treated as duplicates).
