const STORAGE_KEY = "work-clock-v2-records";
const PRIVACY_KEY = "gavriel-clock-show-earnings";
const MONTHLY_SALARY = 5219.73;
const WEEKLY_HOURS = 40;

const els = {
  calendarMonth: document.querySelector("#calendarMonth"),
  clockInButton: document.querySelector("#clockInButton"),
  clockInTime: document.querySelector("#clockInTime"),
  clockOutButton: document.querySelector("#clockOutButton"),
  currentDate: document.querySelector("#currentDate"),
  currentTime: document.querySelector("#currentTime"),
  dailyEstimate: document.querySelector("#dailyEstimate"),
  dailyList: document.querySelector("#dailyList"),
  daysWorked: document.querySelector("#daysWorked"),
  earningsCard: document.querySelector("#earningsCard"),
  historyList: document.querySelector("#historyList"),
  hourlyRate: document.querySelector("#hourlyRate"),
  miniCalendar: document.querySelector("#miniCalendar"),
  monthToDateEarnings: document.querySelector("#monthToDateEarnings"),
  monthTotal: document.querySelector("#monthTotal"),
  monthlyEarnings: document.querySelector("#monthlyEarnings"),
  monthlyEarningsRow: document.querySelector("#monthlyEarningsRow"),
  nextClockOut: document.querySelector("#nextClockOut"),
  overviewMetrics: document.querySelector("#overviewMetrics"),
  remainingTime: document.querySelector("#remainingTime"),
  selectedDaySummary: document.querySelector("#selectedDaySummary"),
  shiftTimer: document.querySelector("#shiftTimer"),
  showEarningsToggle: document.querySelector("#showEarningsToggle"),
  smartClockOutCard: document.querySelector("#smartClockOutCard"),
  statusText: document.querySelector("#statusText"),
  weekTotal: document.querySelector("#weekTotal"),
  weeklyEstimate: document.querySelector("#weeklyEstimate"),
};

let records = loadRecords();
let showEarnings = localStorage.getItem(PRIVACY_KEY) === "true";
let selectedDateKey = toDateKey(new Date());

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getOpenShift() {
  return records.find((record) => !record.clockOut);
}

function hourlyEquivalent() {
  return MONTHLY_SALARY / ((WEEKLY_HOURS * 52) / 12);
}

function msBetween(start, end) {
  return Math.max(0, new Date(end).getTime() - new Date(start).getTime());
}

function shiftMs(record, now = new Date()) {
  return msBetween(record.clockIn, record.clockOut || now);
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

function formatMoney(value) {
  return new Intl.NumberFormat([], { style: "currency", currency: "USD" }).format(value || 0);
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

function startOfWeek(date) {
  const day = startOfDay(date);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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

function getClockOutRule(clockIn) {
  const weekday = new Date(clockIn).getDay();
  if (weekday >= 1 && weekday <= 4) return 8.5 * 60 * 60 * 1000;
  if (weekday === 5) return 5 * 60 * 60 * 1000;
  return null;
}

function getTargetClockOut(record) {
  const ruleMs = getClockOutRule(record.clockIn);
  if (!ruleMs) return null;
  return new Date(new Date(record.clockIn).getTime() + ruleMs);
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

function metric(label, value) {
  return `<article><span>${label}</span><strong>${value}</strong></article>`;
}

function renderTop(now) {
  const openShift = getOpenShift();
  const target = openShift ? getTargetClockOut(openShift) : null;

  els.currentTime.textContent = formatTime(now);
  els.currentDate.textContent = new Intl.DateTimeFormat([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
  els.statusText.textContent = openShift ? "Clocked In" : "Clocked Out";
  els.shiftTimer.textContent = openShift ? formatDuration(shiftMs(openShift, now)) : "00:00:00";
  els.clockInTime.textContent = openShift ? formatTime(openShift.clockIn) : "--";
  els.clockInButton.disabled = Boolean(openShift);
  els.clockOutButton.disabled = !openShift;

  els.smartClockOutCard.hidden = !openShift || !target;
  if (openShift && target) {
    els.nextClockOut.textContent = `Next clock out: ${formatTime(target)}`;
    els.remainingTime.textContent = `Countdown: ${formatDuration(target.getTime() - now.getTime())}`;
  }
}

function renderOverview(now) {
  const lifetime = totalMs(records, now);
  const average = records.length ? lifetime / records.length : 0;
  const longest = longestShift(now);

  els.overviewMetrics.innerHTML = [
    metric("Lifetime Hours", formatDuration(lifetime)),
    metric("Average Shift", formatDuration(average)),
    metric("Longest Shift", longest ? formatDuration(shiftMs(longest, now)) : "00:00:00"),
    metric("Most Worked Day", mostWorkedDay(now)),
  ].join("");
}

function renderEarnings(now) {
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthMs = totalMs(recordsInRange(monthStart, monthEnd), now);
  const hourly = hourlyEquivalent();

  els.showEarningsToggle.checked = showEarnings;
  els.earningsCard.hidden = !showEarnings;
  els.monthlyEarningsRow.hidden = !showEarnings;
  if (!showEarnings) return;

  els.hourlyRate.textContent = formatMoney(hourly);
  els.dailyEstimate.textContent = formatMoney(hourly * (WEEKLY_HOURS / 5));
  els.weeklyEstimate.textContent = formatMoney(hourly * WEEKLY_HOURS);
  els.monthToDateEarnings.textContent = formatMoney((monthMs / 3600000) * hourly);
  els.monthlyEarnings.textContent = formatMoney((monthMs / 3600000) * hourly);
}

function renderTimeOverview(now) {
  const weekStart = startOfWeek(now);
  const weekEnd = addDays(weekStart, 7);
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const weekRecords = recordsInRange(weekStart, weekEnd);
  const monthRecords = recordsInRange(monthStart, monthEnd);

  els.weekTotal.textContent = formatDuration(totalMs(weekRecords, now));
  els.monthTotal.textContent = formatDuration(totalMs(monthRecords, now));
  els.daysWorked.textContent = String(new Set(monthRecords.map((record) => toDateKey(record.clockIn))).size);

  els.dailyList.innerHTML = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    const label = new Intl.DateTimeFormat([], { weekday: "short" }).format(day);
    return `<p><span>${label}</span><strong>${formatDuration(totalMs(recordsForDate(day), now))}</strong></p>`;
  }).join("");

  renderMiniCalendar(now);
}

function renderMiniCalendar(now) {
  const monthStart = startOfMonth(now);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = monthStart.getDay();
  const headers = ["S", "M", "T", "W", "T", "F", "S"].map((day) => `<span class="calendar-head">${day}</span>`);
  const blanks = Array.from({ length: offset }, () => "<span></span>");
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    const key = toDateKey(date);
    const hasWork = recordsForDate(date).length > 0;
    return `<button class="calendar-day ${hasWork ? "has-work" : ""} ${selectedDateKey === key ? "selected" : ""}" data-date="${key}" type="button">${index + 1}</button>`;
  });

  els.calendarMonth.textContent = new Intl.DateTimeFormat([], { month: "long" }).format(now);
  els.miniCalendar.innerHTML = [...headers, ...blanks, ...days].join("");
  renderSelectedDay(now);
}

function renderSelectedDay(now) {
  const selected = new Date(`${selectedDateKey}T12:00:00`);
  const selectedRecords = recordsForDate(selected);
  const label = new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric" }).format(selected);
  els.selectedDaySummary.textContent = `${label}: ${formatDuration(totalMs(selectedRecords, now))}`;
}

function renderHistory(now) {
  const sorted = [...records].sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn));
  if (!sorted.length) {
    els.historyList.innerHTML = '<article class="empty-state">No shifts recorded yet.</article>';
    return;
  }

  els.historyList.innerHTML = sorted.map((record) => {
    const out = record.clockOut ? formatTime(record.clockOut) : "In progress";
    return `
      <article class="history-item">
        <strong>${new Intl.DateTimeFormat([], { weekday: "short", month: "short", day: "numeric" }).format(new Date(record.clockIn))}</strong>
        <p><span>Clock in</span><b>${formatTime(record.clockIn)}</b></p>
        <p><span>Clock out</span><b>${out}</b></p>
        <p><span>Duration</span><b>${formatDuration(shiftMs(record, now))}</b></p>
      </article>
    `;
  }).join("");
}

function render() {
  const now = new Date();
  renderTop(now);
  renderOverview(now);
  renderEarnings(now);
  renderTimeOverview(now);
  renderHistory(now);
}

function clockIn() {
  if (getOpenShift()) return;
  records.push({
    id: crypto.randomUUID(),
    clockIn: new Date().toISOString(),
    clockOut: null,
  });
  saveRecords();
  render();
}

function clockOut() {
  const openShift = getOpenShift();
  if (!openShift) return;
  openShift.clockOut = new Date().toISOString();
  saveRecords();
  render();
}

els.clockInButton.addEventListener("click", clockIn);
els.clockOutButton.addEventListener("click", clockOut);
els.showEarningsToggle.addEventListener("change", () => {
  showEarnings = els.showEarningsToggle.checked;
  localStorage.setItem(PRIVACY_KEY, String(showEarnings));
  render();
});
els.miniCalendar.addEventListener("click", (event) => {
  const button = event.target.closest(".calendar-day");
  if (!button) return;
  selectedDateKey = button.dataset.date;
  render();
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab, .view").forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}View`).classList.add("active");
  });
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js");
}

render();
setInterval(render, 1000);
