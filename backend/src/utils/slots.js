const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_WORK_DAYS = {
  Sunday: false,
  Monday: true,
  Tuesday: true,
  Wednesday: true,
  Thursday: true,
  Friday: true,
  Saturday: false,
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(date) {
  if (typeof date !== 'string' || !ISO_DATE_RE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === date;
}

function weekdayName(date) {
  const d = new Date(`${date}T00:00:00Z`);
  return WEEKDAYS[d.getUTCDay()];
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

function getBookableSlotsForDate({ availabilityDoc, bookings, date }) {
  const parsed = availabilityDoc ? safeParse(availabilityDoc.workDaysJson, {}) : {};
  const workDays = { ...DEFAULT_WORK_DAYS, ...parsed };
  const wd = weekdayName(date);
  if (!workDays[wd]) return [];

  const offSlots = availabilityDoc ? safeParse(availabilityDoc.offSlotsJson, {}) : {};
  const off = new Set(Array.isArray(offSlots[date]) ? offSlots[date] : []);
  const taken = new Set(
    (bookings || [])
      .filter((b) => b.date === date && ['pending', 'confirmed', 'rescheduled'].includes(b.status))
      .map((b) => b.timeSlot)
  );

  return TIME_SLOTS.filter((t) => !off.has(t) && !taken.has(t));
}

module.exports = {
  TIME_SLOTS,
  WEEKDAYS,
  DEFAULT_WORK_DAYS,
  isValidIsoDate,
  weekdayName,
  getBookableSlotsForDate,
};
