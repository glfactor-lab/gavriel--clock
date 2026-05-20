const STORAGE_KEY = "work-clock-v2-records";
const RECORDS_DATASET_KEY = "gavriel-clock-records-dataset";
const REAL_SHIFT_DATASET_VERSION = "real-shifts-2026-05-20";
const PREFS_KEY = "gavriel-clock-preferences";
const DEFAULT_SCHEDULE = {
  mon: 8.5,
  tue: 8.5,
  wed: 8.5,
  thu: 8.5,
  fri: 7,
  defaultBreakMinutes: 0,
};
const REAL_SHIFT_RECORDS = [
  {
    id: "real-2026-05-19",
    date: "2026-05-19",
    clockIn: "2026-05-19T12:52:16.000Z",
    clockOut: "2026-05-19T22:13:56.000Z",
    duration: "09:21:39",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
  {
    id: "real-2026-05-18",
    date: "2026-05-18",
    clockIn: "2026-05-18T12:26:21.000Z",
    clockOut: "2026-05-18T21:04:43.000Z",
    duration: "08:38:21",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
  {
    id: "real-2026-05-15",
    date: "2026-05-15",
    clockIn: "2026-05-15T12:19:13.000Z",
    clockOut: "2026-05-15T18:20:03.000Z",
    duration: "06:00:49",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
  {
    id: "real-2026-05-14",
    date: "2026-05-14",
    clockIn: "2026-05-14T12:50:34.000Z",
    clockOut: "2026-05-14T21:34:16.000Z",
    duration: "08:43:41",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
  {
    id: "real-2026-05-13",
    date: "2026-05-13",
    clockIn: "2026-05-13T12:59:14.000Z",
    clockOut: "2026-05-13T21:29:56.000Z",
    duration: "08:30:41",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
  {
    id: "real-2026-05-12",
    date: "2026-05-12",
    clockIn: "2026-05-12T12:31:10.000Z",
    clockOut: "2026-05-12T21:05:19.000Z",
    duration: "08:34:08",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
  {
    id: "real-2026-05-11",
    date: "2026-05-11",
    clockIn: "2026-05-11T12:32:22.000Z",
    clockOut: "2026-05-11T21:06:10.000Z",
    duration: "08:33:47",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
  {
    id: "real-2026-05-08",
    date: "2026-05-08",
    clockIn: "2026-05-08T12:26:49.000Z",
    clockOut: "2026-05-08T18:34:50.000Z",
    duration: "06:08:01",
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  },
];
const DEFAULT_PREFERENCES = {
  accent: "blue",
  hideOvertime: false,
};
const ACCENT_OPTIONS = {
  blue: "#2563eb",
  green: "#0f766e",
};

const els = {
  addShiftButton: document.querySelector("#addShiftButton"),
  clockInButton: document.querySelector("#clockInButton"),
  clockInTime: document.querySelector("#clockInTime"),
  clockOutButton: document.querySelector("#clockOutButton"),
  currentDate: document.querySelector("#currentDate"),
  currentTime: document.querySelector("#currentTime"),
  editAdjustmentField: document.querySelector("#editAdjustmentField"),
  editBreakField: document.querySelector("#editBreakField"),
  editClockInField: document.querySelector("#editClockInField"),
  editClockOutField: document.querySelector("#editClockOutField"),
  editDateField: document.querySelector("#editDateField"),
  editShiftDialog: document.querySelector("#editShiftDialog"),
  editShiftDialogTitle: document.querySelector("#editShiftDialogTitle"),
  editShiftError: document.querySelector("#editShiftError"),
  editShiftNotesField: document.querySelector("#editShiftNotesField"),
  historyList: document.querySelector("#historyList"),
  launchScreen: document.querySelector("#launchScreen"),
  nextClockOut: document.querySelector("#nextClockOut"),
  notesDialog: document.querySelector("#notesDialog"),
  notesDialogTitle: document.querySelector("#notesDialogTitle"),
  notesField: document.querySelector("#notesField"),
  notesShiftDetails: document.querySelector("#notesShiftDetails"),
  remainingTime: document.querySelector("#remainingTime"),
  confirmDeleteButton: document.querySelector("#confirmDeleteButton"),
  confirmDeleteDialog: document.querySelector("#confirmDeleteDialog"),
  saveShiftButton: document.querySelector("#saveShiftButton"),
  saveNotesButton: document.querySelector("#saveNotesButton"),
  shiftTimer: document.querySelector("#shiftTimer"),
  accentChoices: document.querySelector("#accentChoices"),
  smartClockOutCard: document.querySelector("#smartClockOutCard"),
  statusText: document.querySelector("#statusText"),
  topClock: document.querySelector("#topClock"),
  undoDeleteButton: document.querySelector("#undoDeleteButton"),
  undoToast: document.querySelector("#undoToast"),
};

let records = loadRecords();
let preferences = loadPreferences();
let selectedDateKey = toDateKey(new Date());
let editingDateKey = selectedDateKey;
let editingShiftId = null;
let isCreatingShift = false;
let pendingDeleteId = null;
let lastDeletedShift = null;
let undoTimer = null;
let launchTouchStartY = null;

function mergePreferences(saved) {
  const nextAccent = ACCENT_OPTIONS[saved?.accent] ? saved.accent : DEFAULT_PREFERENCES.accent;
  return {
    accent: nextAccent,
    hideOvertime: Boolean(saved?.hideOvertime),
  };
}

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY));
    return mergePreferences(saved);
  } catch {
    return mergePreferences();
  }
}

function savePreferences() {
  localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
}

function cloneRealShiftRecords() {
  return REAL_SHIFT_RECORDS.map((record) => ({ ...record }));
}

function loadRecords() {
  try {
    if (localStorage.getItem(RECORDS_DATASET_KEY) !== REAL_SHIFT_DATASET_VERSION) {
      const realRecords = cloneRealShiftRecords();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(realRecords));
      localStorage.setItem(RECORDS_DATASET_KEY, REAL_SHIFT_DATASET_VERSION);
      return realRecords;
    }

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : cloneRealShiftRecords();
  } catch {
    return cloneRealShiftRecords();
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function normalizeRecords() {
  records = records.map((record) => {
    const normalized = {
      ...record,
      id: record.id || crypto.randomUUID(),
      date: record.date || toDateKey(record.clockIn),
      notes: record.notes || "",
      adjustmentMinutes: Number(record.adjustmentMinutes) || 0,
      breakMinutes: Number(record.breakMinutes) || 0,
    };
    normalized.duration = normalized.duration || (normalized.clockOut ? formatDuration(recordDuration(normalized)) : null);
    return normalized;
  });
  saveRecords();
}

function getOpenShift() {
  return records.find((record) => !record.clockOut);
}

function shouldHideOvertime() {
  return preferences.hideOvertime;
}

function msBetween(start, end) {
  return Math.max(0, new Date(end).getTime() - new Date(start).getTime());
}

function durationToMs(duration) {
  if (typeof duration !== "string") return null;
  const parts = duration.split(":").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [hours, minutes, seconds] = parts;
  return ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000;
}

function recordDuration(record, now = new Date()) {
  if (record.clockOut) {
    const storedDuration = durationToMs(record.duration);
    if (storedDuration !== null) return storedDuration;
  }
  return rawShiftMs(record, now) - breakMs(record) + adjustmentMs(record);
}

function adjustmentMs(record) {
  return (Number(record.adjustmentMinutes) || 0) * 60 * 1000;
}

function breakMs(record) {
  return Math.max(0, Number(record.breakMinutes) || 0) * 60 * 1000;
}

function rawShiftMs(record, now = new Date()) {
  return msBetween(record.clockIn, record.clockOut || now);
}

function shiftMs(record, now = new Date()) {
  return Math.max(0, recordDuration(record, now));
}

function totalMs(recordsToTotal, now = new Date()) {
  return recordsToTotal.reduce((sum, record) => sum + shiftMs(record, now), 0);
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatTime(date) {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

function formatAmbientTime(date) {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDateInput(date) {
  return toDateKey(date);
}

function formatTimeInput(date) {
  const local = new Date(date);
  return `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;
}

function parseLocalDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const parsed = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateKey(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
}

function startOfDay(date) {
  return new Date(new Date(date).setHours(0, 0, 0, 0));
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function recordsInRange(start, end) {
  return records.filter((record) => {
    const clockIn = new Date(record.clockIn);
    return clockIn >= start && clockIn < end;
  });
}

function recordsForDate(date) {
  const start = startOfDay(date);
  return recordsInRange(start, addDays(start, 1));
}

function recordsForDateKey(dateKey) {
  return recordsForDate(new Date(`${dateKey}T12:00:00`));
}

function monthBounds(date) {
  const month = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstVisible = startOfDay(month);
  firstVisible.setDate(firstVisible.getDate() - firstVisible.getDay());
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const lastVisible = startOfDay(lastDay);
  lastVisible.setDate(lastVisible.getDate() + (6 - lastVisible.getDay()));
  return { month, firstVisible, lastVisible };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function getClockOutRule(clockIn) {
  const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = weekdayKeys[new Date(clockIn).getDay()];
  const hours = Number(DEFAULT_SCHEDULE[key] || 0);
  return hours > 0 ? hours * 60 * 60 * 1000 : null;
}

function getTargetClockOut(record) {
  const ruleMs = getClockOutRule(record.clockIn);
  if (!ruleMs) return null;
  return new Date(new Date(record.clockIn).getTime() + ruleMs);
}

function overtimeMs(record) {
  if (!record.clockOut) return 0;
  const ruleMs = getClockOutRule(record.clockIn);
  if (!ruleMs) return 0;
  return Math.max(0, shiftMs(record) - ruleMs);
}

function undertimeMs(record) {
  if (!record.clockOut) return 0;
  const ruleMs = getClockOutRule(record.clockIn);
  if (!ruleMs) return 0;
  return Math.max(0, ruleMs - shiftMs(record));
}

function formatCompactDuration(ms) {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function longestShift(now = new Date()) {
  return records.reduce((longest, record) => {
    if (!longest) return record;
    return shiftMs(record, now) > shiftMs(longest, now) ? record : longest;
  }, null);
}

function mostWorkedDay(now = new Date()) {
  const totals = Array(7).fill(0);
  records.forEach((record) => {
    totals[new Date(record.clockIn).getDay()] += shiftMs(record, now);
  });
  const max = Math.max(...totals);
  if (!max) return "None yet";
  return new Intl.DateTimeFormat([], { weekday: "long" }).format(new Date(2024, 0, totals.indexOf(max) + 7));
}

function renderTop(now) {
  const activeShift = getOpenShift();
  const target = activeShift ? getTargetClockOut(activeShift) : null;

  els.currentTime.textContent = formatAmbientTime(now);
  els.currentDate.textContent = new Intl.DateTimeFormat([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  els.statusText.textContent = activeShift ? "Clocked In" : "Clocked Out";
  els.shiftTimer.textContent = activeShift ? formatDuration(shiftMs(activeShift, now)) : "00:00:00";
  els.clockInTime.textContent = activeShift ? formatTime(activeShift.clockIn) : "--";
  els.clockInButton.disabled = Boolean(activeShift);
  els.clockOutButton.disabled = !activeShift;
  els.topClock.classList.toggle("is-clocked-in", Boolean(activeShift));

  els.smartClockOutCard.hidden = !activeShift || !target;
  if (activeShift && target) {
    const isEndOfShift = now >= target;
    els.smartClockOutCard.classList.toggle("is-alert", isEndOfShift);
    els.nextClockOut.textContent = `Expected clock-out: ${formatAmbientTime(target)}`;
    els.remainingTime.textContent = isEndOfShift
      ? "End of shift reached"
      : `Remaining today: ${formatDuration(target.getTime() - now.getTime())}`;
  } else {
    els.smartClockOutCard.classList.remove("is-alert");
  }
}

function dismissLaunchScreen() {
  if (!els.launchScreen || els.launchScreen.classList.contains("leaving")) return;
  document.body.classList.add("launch-leaving");
  els.launchScreen.classList.add("leaving");
  setTimeout(() => {
    els.launchScreen.hidden = true;
    document.body.classList.remove("launch-active", "launch-leaving");
  }, 980);
}

function applyPreferences() {
  const accent = ACCENT_OPTIONS[preferences.accent] || ACCENT_OPTIONS.blue;
  document.documentElement.style.setProperty("--accent", accent);
  document.documentElement.style.setProperty("--accent-soft", `${accent}22`);
}

function syncSettingsControls() {
  els.accentChoices.innerHTML = Object.entries(ACCENT_OPTIONS).map(([name, color]) => (
    `<button class="color-swatch ${preferences.accent === name ? "active" : ""}" data-accent="${name}" style="--swatch:${color}" aria-label="${name}" type="button"><span></span>${name}</button>`
  )).join("");
}

function updatePreferences(mutator) {
  mutator(preferences);
  preferences = mergePreferences(preferences);
  savePreferences();
  applyPreferences();
  syncSettingsControls();
  render();
}

function renderHistory(now) {
  if (!records.length) {
    els.historyList.innerHTML = '<article class="empty-state">No shifts recorded yet.</article>';
    return;
  }

  const { month, firstVisible, lastVisible } = monthBounds(new Date(`${selectedDateKey}T12:00:00`));
  const days = [];
  for (let day = new Date(firstVisible); day <= lastVisible; day = addDays(day, 1)) {
    days.push(new Date(day));
  }

  els.historyList.innerHTML = `
    <section class="calendar-card" aria-label="Shift calendar">
      <div class="calendar-head">
        <button class="ghost-button icon-button" data-calendar-move="-1" aria-label="Previous month" type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <strong>${new Intl.DateTimeFormat([], { month: "long", year: "numeric" }).format(month)}</strong>
        <button class="ghost-button icon-button" data-calendar-move="1" aria-label="Next month" type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
      <div class="calendar-weekdays" aria-hidden="true">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span>${day}</span>`).join("")}
      </div>
      <div class="calendar-grid">
        ${days.map((day) => {
          const dateKey = toDateKey(day);
          const dayRecords = recordsForDateKey(dateKey);
          const hasRecords = dayRecords.length > 0;
          const isSelected = dateKey === selectedDateKey;
          const isCurrentMonth = day.getMonth() === month.getMonth();
          return `
            <button class="calendar-day ${isCurrentMonth ? "" : "muted"} ${hasRecords ? "has-shift" : ""} ${isSelected ? "selected" : ""}" data-date-key="${dateKey}" type="button">
              <span>${day.getDate()}</span>
              ${hasRecords ? `<i aria-hidden="true"></i><small>${formatCompactDuration(totalMs(dayRecords, now))}</small>` : ""}
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderShiftDetailCard(record) {
  const overtime = shouldHideOvertime() ? 0 : overtimeMs(record);
  const undertime = shouldHideOvertime() ? 0 : undertimeMs(record);
  const adjustment = adjustmentMs(record);
  const unpaidBreak = breakMs(record);
  const notes = record.notes?.trim();
  return `
    <article class="shift-detail-card">
      <div class="shift-detail-grid">
        <p><span>Date</span><b>${new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" }).format(new Date(record.clockIn))}</b></p>
        <p><span>Clock in</span><b>${formatTime(record.clockIn)}</b></p>
        <p><span>Clock out</span><b>${record.clockOut ? formatTime(record.clockOut) : "In progress"}</b></p>
        <p><span>Total duration</span><b>${formatDuration(shiftMs(record))}</b></p>
        ${unpaidBreak ? `<p><span>Break</span><b>${formatCompactDuration(unpaidBreak)}</b></p>` : ""}
        ${adjustment ? `<p><span>Manual adjustment</span><b>${adjustment > 0 ? "+" : ""}${formatCompactDuration(Math.abs(adjustment))}</b></p>` : ""}
        ${overtime ? `<p class="notes-overtime-row"><span>Overtime</span><b>${formatDuration(overtime)}</b></p>` : ""}
        ${undertime ? `<p class="notes-under-row"><span>Under-time</span><b>${formatDuration(undertime)}</b></p>` : ""}
        ${notes ? `<p class="notes-existing-note"><span>Notes</span><b>${escapeHtml(notes).replace(/\n/g, "<br>")}</b></p>` : ""}
      </div>
      <div class="shift-detail-actions">
        <button class="subtle-button" data-edit-shift="${record.id}" type="button">Edit shift</button>
        <button class="delete-button" data-delete-shift="${record.id}" type="button">Delete shift</button>
      </div>
    </article>
  `;
}

function openShiftDetail(dateKey) {
  editingDateKey = dateKey;
  selectedDateKey = dateKey;
  const date = new Date(`${dateKey}T12:00:00`);
  const dayRecords = recordsForDateKey(dateKey);
  const title = new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" }).format(date);

  els.notesDialogTitle.textContent = title;
  els.notesShiftDetails.innerHTML = dayRecords.length
    ? dayRecords.map(renderShiftDetailCard).join("")
    : '<p class="current-date">No shifts recorded for this day yet.</p>';
  els.notesField.disabled = !dayRecords.length;
  els.saveNotesButton.disabled = !dayRecords.length;
  els.notesField.placeholder = dayRecords.length
    ? "Worked remotely\nLate due to train\nMeeting day"
    : "Add a shift first, then save notes for this work day.";
  els.notesField.value = dayRecords.find((record) => record.notes?.trim())?.notes || dayRecords[0]?.notes || "";
  els.notesDialog.showModal();
  render();
}

function openNotesEditor(dateKey) {
  openShiftDetail(dateKey);
}

function saveNotes() {
  const dayRecords = recordsForDateKey(editingDateKey);
  if (!dayRecords.length) {
    els.notesDialog.close();
    return;
  }
  const notes = els.notesField.value.trim();
  records = records.map((record) => (
    dayRecords.some((dayRecord) => dayRecord.id === record.id)
      ? { ...record, notes }
      : record
  ));
  saveRecords();
  els.notesDialog.close();
  render();
}

function openShiftEditor(id = null) {
  const record = id ? records.find((item) => item.id === id) : null;
  const now = new Date();
  const defaultClockIn = new Date(now);
  defaultClockIn.setHours(9, 0, 0, 0);

  editingShiftId = id;
  isCreatingShift = !record;
  const clockIn = record ? new Date(record.clockIn) : defaultClockIn;
  const clockOut = record?.clockOut ? new Date(record.clockOut) : null;
  const title = record
    ? new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" }).format(clockIn)
    : "Add manual shift";

  els.editShiftDialogTitle.textContent = title;
  els.editDateField.value = formatDateInput(clockIn);
  els.editClockInField.value = formatTimeInput(clockIn);
  els.editClockOutField.value = clockOut ? formatTimeInput(clockOut) : "";
  els.editBreakField.value = record?.breakMinutes ?? DEFAULT_SCHEDULE.defaultBreakMinutes ?? "";
  els.editAdjustmentField.value = record?.adjustmentMinutes || "";
  els.editShiftNotesField.value = record?.notes || "";
  els.editShiftError.textContent = "";
  els.editShiftDialog.showModal();
}

function saveShiftEdit() {
  const record = records.find((item) => item.id === editingShiftId);
  if (!record && !isCreatingShift) return;

  const shiftDate = els.editDateField.value;
  const clockIn = els.editClockInField.value;
  const clockOut = els.editClockOutField.value;
  const breakMinutes = Number(els.editBreakField.value || 0);
  const adjustmentMinutes = Number(els.editAdjustmentField.value || 0);
  const clockInDate = parseLocalDateTime(shiftDate, clockIn);
  let clockOutDate = parseLocalDateTime(shiftDate, clockOut);

  if (!clockInDate) {
    els.editShiftError.textContent = "Date and clock in are required.";
    return;
  }

  if (clockOut && !clockOutDate) {
    els.editShiftError.textContent = "Clock out time is invalid.";
    return;
  }

  if (clockOutDate && clockOutDate <= clockInDate) {
    clockOutDate = addDays(clockOutDate, 1);
  }

  if (clockOutDate && clockOutDate <= clockInDate) {
    els.editShiftError.textContent = "Clock out must be after clock in.";
    return;
  }

  const otherOpenShift = getOpenShift();
  if (!clockOutDate && otherOpenShift && otherOpenShift.id !== editingShiftId) {
    els.editShiftError.textContent = "Clock out is required while another shift is active.";
    return;
  }

  if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
    els.editShiftError.textContent = "Break must be zero or more minutes.";
    return;
  }

  if (clockOutDate && breakMinutes * 60000 >= msBetween(clockInDate, clockOutDate)) {
    els.editShiftError.textContent = "Break must be shorter than the shift.";
    return;
  }

  if (!Number.isFinite(adjustmentMinutes)) {
    els.editShiftError.textContent = "Adjustment must be a number of minutes.";
    return;
  }

  const originalDateKey = record ? toDateKey(record.clockIn) : toDateKey(clockInDate);
  const nextDateKey = toDateKey(clockInDate);
  const notes = els.editShiftNotesField.value.trim();
  const nextRecord = {
    ...(record || {}),
    id: record?.id || crypto.randomUUID(),
    date: toDateKey(clockInDate),
    clockIn: clockInDate.toISOString(),
    clockOut: clockOutDate ? clockOutDate.toISOString() : null,
    duration: clockOutDate ? formatDuration(msBetween(clockInDate, clockOutDate) - (breakMinutes * 60000) + (adjustmentMinutes * 60000)) : null,
    breakMinutes,
    adjustmentMinutes,
    notes,
  };

  if (record) {
    records = records.map((item) => {
      if (item.id === editingShiftId) return nextRecord;

      if (toDateKey(item.clockIn) === originalDateKey && originalDateKey === nextDateKey) {
        return { ...item, notes };
      }

      return item;
    });
  } else {
    records = records.concat(nextRecord);
  }

  editingShiftId = null;
  isCreatingShift = false;
  saveRecords();
  els.editShiftDialog.close();
  render();
}

function requestDeleteShift(id) {
  pendingDeleteId = id;
  const record = records.find((item) => item.id === id);
  if (record && els.confirmDeleteDialog) {
    const detail = els.confirmDeleteDialog.querySelector("[data-delete-shift-detail]");
    if (detail) {
      const date = new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric" }).format(new Date(record.clockIn));
      detail.textContent = `${date}, ${formatTime(record.clockIn)} - ${record.clockOut ? formatTime(record.clockOut) : "In progress"}`;
    }
  }
  els.confirmDeleteDialog.showModal();
}

function deleteShift() {
  if (!pendingDeleteId) return;
  const index = records.findIndex((record) => record.id === pendingDeleteId);
  if (index === -1) return;
  lastDeletedShift = records[index];
  records = records.filter((record) => record.id !== pendingDeleteId);
  pendingDeleteId = null;
  saveRecords();
  els.confirmDeleteDialog.close();
  showUndoToast();
  render();
}

function showUndoToast() {
  els.undoToast.hidden = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    els.undoToast.hidden = true;
    lastDeletedShift = null;
  }, 6000);
}

function undoDelete() {
  if (!lastDeletedShift) return;
  records = records.concat(lastDeletedShift);
  lastDeletedShift = null;
  els.undoToast.hidden = true;
  clearTimeout(undoTimer);
  saveRecords();
  render();
}

function tapFeedback() {
  if (navigator.vibrate) navigator.vibrate(8);
}

function render() {
  const now = new Date();
  renderTop(now);
  renderHistory(now);
}

function clockIn() {
  if (getOpenShift()) return;
  tapFeedback();
  const clockInDate = new Date();
  records.push({
    id: crypto.randomUUID(),
    date: toDateKey(clockInDate),
    clockIn: clockInDate.toISOString(),
    clockOut: null,
    duration: null,
    notes: "",
    breakMinutes: 0,
    adjustmentMinutes: 0,
  });
  saveRecords();
  render();
}

function clockOut() {
  const openShift = getOpenShift();
  if (!openShift) return;
  tapFeedback();
  const clockOutDate = new Date();
  openShift.clockOut = clockOutDate.toISOString();
  openShift.duration = formatDuration(recordDuration(openShift, clockOutDate));
  saveRecords();
  render();
}

els.clockInButton.addEventListener("click", clockIn);
els.clockOutButton.addEventListener("click", clockOut);
els.launchScreen.addEventListener("click", dismissLaunchScreen);
els.launchScreen.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    dismissLaunchScreen();
  }
});
els.launchScreen.addEventListener("touchstart", (event) => {
  launchTouchStartY = event.touches[0]?.clientY ?? null;
}, { passive: true });
els.launchScreen.addEventListener("touchend", (event) => {
  const touchEndY = event.changedTouches[0]?.clientY;
  if (launchTouchStartY === null || touchEndY === undefined) return;
  if (launchTouchStartY - touchEndY > 44) dismissLaunchScreen();
  launchTouchStartY = null;
}, { passive: true });
els.addShiftButton.addEventListener("click", () => openShiftEditor());
els.accentChoices.addEventListener("click", (event) => {
  const accent = event.target.closest("[data-accent]")?.dataset.accent;
  if (accent) updatePreferences((prefs) => { prefs.accent = accent; });
});

els.historyList.addEventListener("click", (event) => {
  const calendarMove = event.target.closest("[data-calendar-move]")?.dataset.calendarMove;
  if (calendarMove) {
    const selected = new Date(`${selectedDateKey}T12:00:00`);
    selected.setMonth(selected.getMonth() + Number(calendarMove));
    selectedDateKey = toDateKey(selected);
    render();
    return;
  }

  const day = event.target.closest("[data-date-key]");
  if (day) {
    openShiftDetail(day.dataset.dateKey);
    return;
  }
});

document.addEventListener("click", (event) => {
  const editId = event.target.closest("[data-edit-shift]")?.dataset.editShift;
  if (editId) {
    if (els.notesDialog.open) els.notesDialog.close();
    openShiftEditor(editId);
    return;
  }

  const deleteId = event.target.closest("[data-delete-shift]")?.dataset.deleteShift;
  if (deleteId) {
    if (els.notesDialog.open) els.notesDialog.close();
    requestDeleteShift(deleteId);
  }
});

els.saveNotesButton?.addEventListener("click", saveNotes);
els.saveShiftButton.addEventListener("click", saveShiftEdit);
els.confirmDeleteButton.addEventListener("click", deleteShift);
els.undoDeleteButton.addEventListener("click", undoDelete);

function switchTab(view) {
  document.querySelectorAll(".tab, .view").forEach((node) => node.classList.remove("active"));
  document.querySelector(`.tab[data-view="${view}"]`)?.classList.add("active");
  document.querySelector(`#${view}View`)?.classList.add("active");
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.view));
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js");
}

normalizeRecords();
applyPreferences();
syncSettingsControls();
render();
setInterval(render, 1000);
