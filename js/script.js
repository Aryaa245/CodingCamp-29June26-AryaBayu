// Personal Dashboard — script.js
// Cat-themed personal productivity dashboard
// Vanilla HTML/CSS/JS — no frameworks, no build step

// =============================================================================
// STORAGE HELPERS
// =============================================================================

/**
 * Probes whether localStorage is available and usable.
 * Attempts a test write, read, and delete to confirm the API works.
 * Returns true if localStorage is accessible, false otherwise
 * (e.g. in private browsing with storage blocked, or when storage is full).
 *
 * @returns {boolean}
 */
function storageAvailable() {
  const TEST_KEY = '__pd_storage_test__';
  try {
    localStorage.setItem(TEST_KEY, '1');
    const readBack = localStorage.getItem(TEST_KEY);
    localStorage.removeItem(TEST_KEY);
    return readBack === '1';
  } catch (e) {
    return false;
  }
}

/**
 * Reads and JSON-parses a value from localStorage.
 *
 * - Returns null silently when the key is not present.
 * - Returns null and logs a console warning when the stored value
 *   exists but cannot be parsed as valid JSON (corrupted data).
 *
 * @param {string} key - The localStorage key to read.
 * @returns {*} The parsed value, or null if missing or unparseable.
 */
function storageRead(key) {
  const raw = localStorage.getItem(key);

  // Key is absent — return null silently
  if (raw === null) {
    return null;
  }

  // Key exists — attempt to parse
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Value exists but is not valid JSON — treat as absent and warn
    console.warn('pd: corrupted key', key);
    return null;
  }
}

/**
 * JSON-serialises a value and writes it to localStorage.
 *
 * Returns true on success.
 * Returns false if the write fails due to a QuotaExceededError
 * (storage is full) or any other storage error.
 *
 * @param {string} key   - The localStorage key to write.
 * @param {*}      value - The value to serialise and store.
 * @returns {boolean} True on success, false on failure.
 */
function storageWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // QuotaExceededError (and its vendor-prefixed variants) land here
    return false;
  }
}

// =============================================================================
// TIME / DATE HELPERS
// =============================================================================

/**
 * Maps an hour (0–23) to a time-of-day salutation string.
 *
 *   morning   → 05:00–11:59
 *   afternoon → 12:00–17:59
 *   evening   → 00:00–04:59 and 18:00–23:59
 *
 * @param {number} hour - Integer hour in the range 0–23.
 * @returns {"morning"|"afternoon"|"evening"}
 */
function getTimeOfDay(hour) {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  return 'evening'; // covers 0–4 and 18–23
}

/**
 * Formats a Date object as a zero-padded "HH:MM:SS" string.
 *
 * @param {Date} date
 * @returns {string} e.g. "09:05:03"
 */
function formatTime(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Formats a Date object as a human-readable date string.
 * Uses explicit arrays so the output is locale-independent and predictable.
 *
 * @param {Date} date
 * @returns {string} e.g. "Friday, 4 July 2025"  (day is NOT zero-padded)
 */
function formatDate(date) {
  const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
  ];
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
  ];

  const weekday = DAY_NAMES[date.getDay()];
  const day     = date.getDate();          // not zero-padded
  const month   = MONTH_NAMES[date.getMonth()];
  const year    = date.getFullYear();

  return `${weekday}, ${day} ${month} ${year}`;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validates a display name.
 * Returns false if the trimmed value is empty or the raw string exceeds 50 chars.
 *
 * @param {string} name
 * @returns {boolean}
 */
function validateName(name) {
  if (name.trim() === '') return false;
  if (name.length > 50)  return false;
  return true;
}

/**
 * Validates a to-do task title.
 * Returns false if the trimmed value is empty or the raw string exceeds 100 chars.
 *
 * @param {string} title
 * @returns {boolean}
 */
function validateTaskTitle(title) {
  if (title.trim() === '') return false;
  if (title.length > 100)  return false;
  return true;
}

/**
 * Validates a URL for the Quick Links widget.
 * Returns true only when the string begins with "http://" or "https://"
 * AND its total length is at most 2048 characters.
 *
 * @param {string} url
 * @returns {boolean}
 */
function validateUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  if (url.length > 2048) return false;
  return true;
}

/**
 * Validates a Quick Links card title.
 * Returns false if the trimmed value is empty or the raw string exceeds 50 chars.
 *
 * @param {string} title
 * @returns {boolean}
 */
function validateLinkTitle(title) {
  if (title.trim() === '') return false;
  if (title.length > 50)  return false;
  return true;
}

// =============================================================================
// DOM ERROR HELPERS
// =============================================================================

/**
 * Displays an error message in the given element by setting its text content
 * and making it visible.
 *
 * @param {HTMLElement} el  - The error container element (e.g. a <span class="widget-error">).
 * @param {string}      msg - The error message to display.
 */
function showError(el, msg) {
  el.textContent    = msg;
  el.style.display  = 'block';
}

/**
 * Clears and hides the given error element.
 *
 * @param {HTMLElement} el - The error container element to clear.
 */
function clearError(el) {
  el.textContent   = '';
  el.style.display = 'none';
}

// =============================================================================
// GREETING WIDGET
// =============================================================================

/**
 * Initialises the Greeting & Clock widget (Subtasks 4.1 + 4.2).
 *
 * 1. Injects all widget markup into #widget-greeting (after the existing <h3>).
 * 2. Reads any previously saved name from localStorage.
 * 3. Builds and displays the initial greeting immediately.
 * 4. Wires the Edit / Save / Cancel name buttons.
 * 5. Starts the live clock by calling startClock().
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 9.1, 9.3, 9.4, 9.5, 9.6
 */
function initGreeting() {
  const widget = document.getElementById('widget-greeting');

  // ------------------------------------------------------------------
  // 4.1 — Inject widget markup after the existing <h3>
  // ------------------------------------------------------------------
  widget.insertAdjacentHTML('beforeend', `
    <div class="clock-time" id="clock-time"></div>
    <div class="clock-date" id="clock-date"></div>
    <p id="greeting-text"></p>
    <button id="name-edit">✏️ Edit name</button>
    <div id="name-edit-form" hidden>
      <input
        type="text"
        id="name-input"
        maxlength="50"
        placeholder="Enter your name"
      >
      <button id="name-submit">Save</button>
      <button id="name-cancel">Cancel</button>
      <span class="widget-error" id="name-error"></span>
    </div>
  `);

  // Grab the elements we'll need throughout this function
  const greetingText = document.getElementById('greeting-text');
  const nameEditBtn  = document.getElementById('name-edit');
  const nameEditForm = document.getElementById('name-edit-form');
  const nameInput    = document.getElementById('name-input');
  const nameSubmit   = document.getElementById('name-submit');
  const nameCancel   = document.getElementById('name-cancel');
  const nameError    = document.getElementById('name-error');

  // ------------------------------------------------------------------
  // Helper: builds the greeting string from the current hour + saved name.
  // If a name is stored  → "Good morning, Alice! 🐱"
  // If no name is stored → "Good morning! 🐱"
  // ------------------------------------------------------------------
  function buildGreeting(name) {
    const salutation = getTimeOfDay(new Date().getHours());
    if (name) {
      return `Good ${salutation}, ${name}! 🐱`;
    }
    return `Good ${salutation}! 🐱`;
  }

  // Set the initial greeting immediately
  const savedName = storageRead('pd_name');
  greetingText.innerHTML = buildGreeting(savedName);

  // Start the live clock right away — no need to wait for a name
  startClock();

  // ------------------------------------------------------------------
  // 4.2 — Name edit controls
  // ------------------------------------------------------------------

  // ✏️ Edit name — show form and pre-fill with saved name if available
  nameEditBtn.addEventListener('click', function () {
    nameEditForm.removeAttribute('hidden');
    const currentName = storageRead('pd_name');
    if (currentName) {
      nameInput.value = currentName;
    }
    nameInput.focus();
  });

  // 💾 Save — validate, persist, update greeting, hide form
  nameSubmit.addEventListener('click', function () {
    const value = nameInput.value;

    if (!validateName(value)) {
      showError(nameError, 'Name cannot be empty');
      return;
    }

    const trimmedName = value.trim();
    storageWrite('pd_name', trimmedName);
    greetingText.innerHTML = buildGreeting(trimmedName);
    nameEditForm.setAttribute('hidden', '');
    clearError(nameError);
  });

  // ✕ Cancel — hide form without saving, clear any error
  nameCancel.addEventListener('click', function () {
    nameEditForm.setAttribute('hidden', '');
    clearError(nameError);
  });
}

// =============================================================================
// CLOCK
// =============================================================================

/**
 * Starts the live clock (Subtask 4.3).
 *
 * Defines an inner tick() function that writes the current time and date
 * into the #clock-time and #clock-date elements.
 * Calls tick() immediately so the display is populated without a 1-second
 * delay, then schedules it to run every second via setInterval.
 *
 * Requirements: 2.1, 2.2, 2.3
 */
function startClock() {
  /**
   * One clock update: refresh both the time and date displays.
   */
  function tick() {
    const now = new Date();
    document.getElementById('clock-time').textContent = formatTime(now);
    document.getElementById('clock-date').textContent = formatDate(now);
  }

  // Populate the display immediately — no blank second on load
  tick();

  // Keep ticking every second
  setInterval(tick, 1000);
}

// =============================================================================
// FOCUS TIMER WIDGET
// =============================================================================

/**
 * Initialises the Focus Timer widget (Subtasks 5.1 + 5.2).
 *
 * 1. Injects the timer display, control buttons, and completion message
 *    into #widget-timer (after the existing <h3>).
 * 2. Maintains countdown state in closure variables so each button handler
 *    can safely read and mutate shared state without globals.
 * 3. Wires Start, Pause, Reset buttons and handles timer completion.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
function initTimer() {
  const widget = document.getElementById('widget-timer');

  // ------------------------------------------------------------------
  // 5.1 — Inject timer markup after the existing <h3>
  // ------------------------------------------------------------------
  widget.insertAdjacentHTML('beforeend', `
    <div class="timer-display" id="timer-display">25:00</div>
    <div class="timer-controls">
      <button id="timer-start">Start</button>
      <button id="timer-pause" disabled>Pause</button>
      <button id="timer-reset">Reset</button>
    </div>
    <p class="timer-message" id="timer-message" hidden>Focus session done, stretch like a cat! 🐱</p>
  `);

  // Grab button and display elements
  const timerDisplay  = document.getElementById('timer-display');
  const btnStart      = document.getElementById('timer-start');
  const btnPause      = document.getElementById('timer-pause');
  const btnReset      = document.getElementById('timer-reset');
  const timerMessage  = document.getElementById('timer-message');

  // ------------------------------------------------------------------
  // Closure state — shared by all inner functions below
  // ------------------------------------------------------------------
  let remainingSeconds = 1500; // 25 minutes × 60
  let intervalId       = null;

  // ------------------------------------------------------------------
  // formatTimerDisplay(s) — converts total seconds to "MM:SS"
  //
  // Both minutes and seconds are zero-padded to two digits.
  // e.g.  90 → "01:30"   |   5 → "00:05"   |   1500 → "25:00"
  //
  // @param {number} s - Total seconds remaining (≥ 0).
  // @returns {string}
  // ------------------------------------------------------------------
  function formatTimerDisplay(s) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const pad  = n => String(n).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  }

  // ------------------------------------------------------------------
  // timerTick() — called every second while the timer is running.
  //
  // Decrements remainingSeconds, refreshes the display, and triggers
  // timerComplete() when the countdown reaches zero.
  // ------------------------------------------------------------------
  function timerTick() {
    remainingSeconds--;
    timerDisplay.textContent = formatTimerDisplay(remainingSeconds);

    if (remainingSeconds <= 0) {
      timerComplete();
    }
  }

  // ------------------------------------------------------------------
  // timerComplete() — called when the countdown reaches 00:00.
  //
  // Stops the interval, locks the display at "00:00", shows the
  // completion message, and disables both Start and Pause.
  // ------------------------------------------------------------------
  function timerComplete() {
    clearInterval(intervalId);
    intervalId = null;

    timerDisplay.textContent = '00:00';
    timerMessage.removeAttribute('hidden'); // show completion message

    btnStart.disabled = true;
    btnPause.disabled = true;
  }

  // ------------------------------------------------------------------
  // 5.2 — Button event handlers
  // ------------------------------------------------------------------

  // ▶ Start — begin (or resume) the countdown
  btnStart.addEventListener('click', function () {
    intervalId = setInterval(timerTick, 1000);

    btnStart.disabled = true;
    btnPause.disabled = false;

    // Hide any stale completion message from a previous session
    timerMessage.setAttribute('hidden', '');
  });

  // ⏸ Pause — freeze the countdown without resetting remaining time
  btnPause.addEventListener('click', function () {
    clearInterval(intervalId);
    intervalId = null;

    btnStart.disabled = false;
    btnPause.disabled = true;
  });

  // 🔄 Reset — cancel any running interval and restore to 25:00
  btnReset.addEventListener('click', function () {
    clearInterval(intervalId);
    intervalId = null;

    remainingSeconds         = 1500;
    timerDisplay.textContent = '25:00';

    btnStart.disabled = false;
    btnPause.disabled = true;

    // Hide the completion message if it was visible
    timerMessage.setAttribute('hidden', '');
  });
}

// =============================================================================
// TO-DO LIST WIDGET
// =============================================================================

/**
 * Initialises the To-Do List widget (Subtasks 6.1 + 6.2 + 6.3).
 *
 * 1. Injects all widget markup into #widget-todo (after the existing <h3>).
 * 2. Restores the task list from localStorage.
 * 3. Wires Add button and Enter key to addTask().
 * 4. Implements renderTasks(), toggleTask(), deleteTask(), updateCount()
 *    as inner functions that close over the shared `tasks` array.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 10.1, 10.2, 10.3
 */
function initTodo() {
  const widget = document.getElementById('widget-todo');

  // ------------------------------------------------------------------
  // 6.1 — Inject widget markup after the existing <h3>
  // ------------------------------------------------------------------
  widget.insertAdjacentHTML('beforeend', `
    <p id="todo-count"></p>
    <div class="todo-input-row">
      <input
        type="text"
        id="todo-input"
        maxlength="100"
        placeholder="Add a task…"
      >
      <button id="todo-add">Add</button>
    </div>
    <span class="widget-error" id="todo-error"></span>
    <ul id="todo-list"></ul>
  `);

  // Grab the elements used throughout this widget
  const todoInput = document.getElementById('todo-input');
  const todoAdd   = document.getElementById('todo-add');
  const todoError = document.getElementById('todo-error');
  const todoList  = document.getElementById('todo-list');
  const todoCount = document.getElementById('todo-count');

  // ------------------------------------------------------------------
  // Restore persisted tasks (or start with an empty array)
  // ------------------------------------------------------------------
  let tasks = storageRead('pd_tasks') || [];

  // Render the initial state immediately
  renderTasks();
  updateCount();

  // ------------------------------------------------------------------
  // 6.3 — renderTasks()
  //
  // Rebuilds the entire <ul> from the current `tasks` array.
  // Shows a friendly empty-state message when there are no tasks.
  // Wires toggle and delete click handlers onto each newly created <li>.
  // ------------------------------------------------------------------
  function renderTasks() {
    todoList.innerHTML = '';

    if (tasks.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty-state';
      emptyItem.textContent = 'No tasks yet — time for a cat nap 🐱';
      todoList.appendChild(emptyItem);
      return;
    }

    tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.completed ? ' completed' : '');
      li.dataset.id = task.id;

      // Toggle button — flips completed state
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'todo-toggle';
      toggleBtn.setAttribute('aria-label', 'Toggle task');
      toggleBtn.textContent = task.completed ? '✅' : '⬜';
      toggleBtn.addEventListener('click', function () {
        toggleTask(task.id);
      });

      // Task title
      const titleSpan = document.createElement('span');
      titleSpan.className = 'todo-title';
      titleSpan.textContent = task.title;

      // Delete button — removes task permanently
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'todo-delete';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', function () {
        deleteTask(task.id);
      });

      li.appendChild(toggleBtn);
      li.appendChild(titleSpan);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });
  }

  // ------------------------------------------------------------------
  // 6.3 — toggleTask(id)
  //
  // Flips the completed flag of the task with the given id,
  // persists the change, and re-renders.
  //
  // @param {string} id - The task's unique id.
  // ------------------------------------------------------------------
  function toggleTask(id) {
    const task = tasks.find(function (t) { return t.id === id; });
    if (!task) return;

    task.completed = !task.completed;
    storageWrite('pd_tasks', tasks);
    renderTasks();
    updateCount();
  }

  // ------------------------------------------------------------------
  // 6.3 — deleteTask(id)
  //
  // Removes the task with the given id from the array,
  // persists the updated list, and re-renders.
  //
  // @param {string} id - The task's unique id.
  // ------------------------------------------------------------------
  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    storageWrite('pd_tasks', tasks);
    renderTasks();
    updateCount();
  }

  // ------------------------------------------------------------------
  // 6.3 — updateCount()
  //
  // Updates the #todo-count paragraph to show how many tasks remain
  // incomplete (e.g. "3 remaining").
  // ------------------------------------------------------------------
  function updateCount() {
    const n = tasks.filter(function (t) { return !t.completed; }).length;
    todoCount.textContent = n + ' remaining';
  }

  // ------------------------------------------------------------------
  // 6.2 — addTask()
  //
  // Reads the input, validates, checks for duplicates (Challenge C),
  // and — on success — creates a new task object, persists it, and
  // re-renders.
  // ------------------------------------------------------------------
  function addTask() {
    const value = todoInput.value;

    // --- Validation ---
    if (!validateTaskTitle(value)) {
      // Distinguish "empty" from "too long"
      if (value.trim() === '') {
        showError(todoError, 'Title cannot be empty');
      } else {
        showError(todoError, 'Title is too long (max 100 characters)');
      }
      return;
    }

    // --- Duplicate check (case-insensitive, trimmed) — Challenge C ---
    const norm = function (s) { return s.trim().toLowerCase(); };
    if (tasks.some(function (t) { return norm(t.title) === norm(value); })) {
      showError(todoError, 'This task already exists');
      return;
    }

    // --- All checks passed — create and persist the new task ---
    const newTask = {
      id:        'task_' + Date.now(),
      title:     value.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    tasks.push(newTask);
    storageWrite('pd_tasks', tasks);
    renderTasks();
    updateCount();

    // Clear the input and any lingering error
    todoInput.value = '';
    clearError(todoError);
  }

  // ------------------------------------------------------------------
  // 6.2 — Wire Add button click and Enter key on the input
  // ------------------------------------------------------------------
  todoAdd.addEventListener('click', addTask);

  todoInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      addTask();
    }
  });
}

// =============================================================================
// QUICK LINKS WIDGET
// =============================================================================

/**
 * Initialises the Quick Links widget (Subtasks 7.1 + 7.2 + 7.3).
 *
 * 1. Injects all widget markup into #widget-quicklinks (after the existing <h3>).
 * 2. Restores saved links from localStorage.
 * 3. Wires the "+ Add Link" toggle, Cancel, and Save buttons.
 * 4. Implements renderLinks(), openLink(), and deleteLink() as inner functions
 *    that close over the shared `links` array.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
function initQuickLinks() {
  const widget = document.getElementById('widget-quicklinks');

  // --------------------------------------------------------------------------
  // 7.1 — Inject widget markup after the existing <h3>
  // --------------------------------------------------------------------------
  widget.insertAdjacentHTML('beforeend', `
    <div id="links-list"></div>
    <button id="add-link-toggle">+ Add Link</button>
    <div id="add-link-form" hidden>
      <input
        type="text"
        id="link-title-input"
        maxlength="50"
        placeholder="Link title"
      >
      <span class="widget-error" id="link-title-error"></span>
      <input
        type="url"
        id="link-url-input"
        placeholder="https://…"
      >
      <span class="widget-error" id="link-url-error"></span>
      <button id="link-submit">Save</button>
      <button id="link-cancel">Cancel</button>
    </div>
  `);

  // Grab all elements used throughout this widget
  const linksList      = document.getElementById('links-list');
  const addLinkToggle  = document.getElementById('add-link-toggle');
  const addLinkForm    = document.getElementById('add-link-form');
  const linkTitleInput = document.getElementById('link-title-input');
  const linkTitleError = document.getElementById('link-title-error');
  const linkUrlInput   = document.getElementById('link-url-input');
  const linkUrlError   = document.getElementById('link-url-error');
  const linkSubmit     = document.getElementById('link-submit');
  const linkCancel     = document.getElementById('link-cancel');

  // --------------------------------------------------------------------------
  // Restore persisted links (or start with an empty array)
  // --------------------------------------------------------------------------
  let links = storageRead('pd_links') || [];

  // Render the initial state immediately
  renderLinks();

  // --------------------------------------------------------------------------
  // 7.1 — "+ Add Link" toggle — reveals the form
  // --------------------------------------------------------------------------
  addLinkToggle.addEventListener('click', function () {
    addLinkForm.removeAttribute('hidden');
    linkTitleInput.focus();
  });

  // --------------------------------------------------------------------------
  // 7.1 — Cancel button — hides form and clears all inputs and errors
  // --------------------------------------------------------------------------
  linkCancel.addEventListener('click', function () {
    addLinkForm.setAttribute('hidden', '');
    linkTitleInput.value = '';
    linkUrlInput.value   = '';
    clearError(linkTitleError);
    clearError(linkUrlError);
  });

  // --------------------------------------------------------------------------
  // 7.2 — addLink()
  //
  // Validates both fields independently (both errors can show simultaneously).
  // On success, creates a new link object, persists it, and re-renders.
  // --------------------------------------------------------------------------
  function addLink() {
    const title = linkTitleInput.value;
    const url   = linkUrlInput.value;

    // --- Validate each field independently (no short-circuit) ---
    let hasError = false;

    if (!validateLinkTitle(title)) {
      showError(linkTitleError, 'Title cannot be empty');
      hasError = true;
    } else {
      clearError(linkTitleError);
    }

    if (!validateUrl(url)) {
      showError(linkUrlError, 'Please enter a valid URL (must start with http:// or https://)');
      hasError = true;
    } else {
      clearError(linkUrlError);
    }

    // If either field failed validation, stop here
    if (hasError) return;

    // --- Both valid — create and persist the new link ---
    const newLink = {
      id:    'link_' + Date.now(),
      title: title.trim(),
      url:   url.trim(),
    };

    links.push(newLink);
    storageWrite('pd_links', links);
    renderLinks();

    // Hide the form and clear inputs + errors
    addLinkForm.setAttribute('hidden', '');
    linkTitleInput.value = '';
    linkUrlInput.value   = '';
    clearError(linkTitleError);
    clearError(linkUrlError);
  }

  // Wire the Save button to addLink()
  linkSubmit.addEventListener('click', addLink);

  // --------------------------------------------------------------------------
  // 7.3 — renderLinks()
  //
  // Rebuilds the #links-list container from the current `links` array.
  // Shows a friendly empty-state message when there are no saved links.
  // Wires open and delete click handlers onto each newly created card.
  // --------------------------------------------------------------------------
  function renderLinks() {
    linksList.innerHTML = '';

    if (links.length === 0) {
      const empty = document.createElement('p');
      empty.className   = 'empty-state';
      empty.textContent = 'No links saved yet 🐾';
      linksList.appendChild(empty);
      return;
    }

    links.forEach(function (link) {
      // Wrapper card
      const card = document.createElement('div');
      card.className      = 'link-card';
      card.dataset.id     = link.id;

      // Anchor button — opens the link in a new tab
      const anchorBtn = document.createElement('button');
      anchorBtn.className   = 'link-anchor';
      anchorBtn.textContent = link.title;
      anchorBtn.addEventListener('click', function () {
        openLink(link.id);
      });

      // Delete button — removes the link
      const deleteBtn = document.createElement('button');
      deleteBtn.className             = 'link-delete';
      deleteBtn.setAttribute('aria-label', 'Delete link');
      deleteBtn.textContent           = '✕';
      deleteBtn.addEventListener('click', function () {
        deleteLink(link.id);
      });

      card.appendChild(anchorBtn);
      card.appendChild(deleteBtn);
      linksList.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // 7.3 — openLink(id)
  //
  // Finds the link by id, re-validates its URL, and opens it in a new tab.
  // If the stored URL has somehow become invalid, shows an inline error
  // near #links-list instead of opening anything.
  //
  // @param {string} id - The link's unique id.
  // --------------------------------------------------------------------------
  function openLink(id) {
    const link = links.find(function (l) { return l.id === id; });
    if (!link) return;

    if (validateUrl(link.url)) {
      window.open(link.url, '_blank', 'noopener');
    } else {
      // Remove any pre-existing inline error to avoid stacking messages
      const existingError = linksList.querySelector('.link-open-error');
      if (existingError) existingError.remove();

      const errMsg = document.createElement('p');
      errMsg.className   = 'widget-error link-open-error';
      errMsg.textContent = 'Cannot open link: URL is invalid.';
      linksList.appendChild(errMsg);
    }
  }

  // --------------------------------------------------------------------------
  // 7.3 — deleteLink(id)
  //
  // Removes the link with the given id, persists the updated array,
  // and re-renders the list.
  //
  // @param {string} id - The link's unique id.
  // --------------------------------------------------------------------------
  function deleteLink(id) {
    links = links.filter(function (l) { return l.id !== id; });
    storageWrite('pd_links', links);
    renderLinks();
  }
}

// =============================================================================
// THEME (Challenge A)
// =============================================================================

/**
 * Initialises the light/dark theme toggle (Subtask 8.1 — Challenge A).
 *
 * 1. Reads the saved theme preference from localStorage.
 * 2. Applies it to <html data-theme="…">; defaults to 'light' if nothing stored.
 * 3. Syncs the #theme-toggle button icon immediately.
 * 4. Wires the button click to flip the theme, persist the choice, and
 *    re-sync the icon.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */
function initTheme() {
  // 1. Read saved preference (may be null if first visit)
  const savedTheme = storageRead('pd_theme');

  // 2. Apply to <html> — default to 'light' when nothing is stored
  document.documentElement.setAttribute('data-theme', savedTheme || 'light');

  // 3. Get the toggle button
  const themeToggle = document.getElementById('theme-toggle');

  // ------------------------------------------------------------------
  // updateIcon() — reads the current data-theme attribute and sets the
  // button icon accordingly:
  //   dark  → ☀️  (switch back to light)
  //   light → 🌙  (switch to dark)
  // ------------------------------------------------------------------
  function updateIcon() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }

  // Sync icon with the theme that was just applied
  updateIcon();

  // ------------------------------------------------------------------
  // Click handler — flip theme, persist, and update icon
  // ------------------------------------------------------------------
  themeToggle.addEventListener('click', function () {
    const current  = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    storageWrite('pd_theme', newTheme);
    updateIcon();
  });
}

// =============================================================================
// BOOTSTRAP
// =============================================================================

/**
 * Entry point — runs after the DOM is fully parsed.
 *
 * 1. Checks whether localStorage is available; if not, reveals the
 *    #storage-warning banner so the user knows data won't be saved.
 * 2. Initialises every widget in the correct order.
 *
 * Requirements: 1.1, 1.3, 6.3, 6.4
 */
document.addEventListener('DOMContentLoaded', function () {
  // Show storage warning banner if localStorage is unavailable
  if (!storageAvailable()) {
    const warning = document.getElementById('storage-warning');
    if (warning) warning.removeAttribute('hidden');
  }

  // Initialise widgets in order
  initTheme();
  initGreeting();
  initTimer();
  initTodo();
  initQuickLinks();
});
