export const WORK_SCHEDULE = {
  startHour: 8,
  startMinute: 30,
  endHour: 18,
  endMinute: 30,
} as const;

export const BUSINESS_MINUTES_PER_DAY =
  WORK_SCHEDULE.endHour * 60 +
  WORK_SCHEDULE.endMinute -
  (WORK_SCHEDULE.startHour * 60 + WORK_SCHEDULE.startMinute);

export const TIME_METRICS_BASIS_LABEL =
  'Días y horas hábiles (lunes a viernes, 8:30 a 18:30, según TIMEZONE del sistema)';

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const WEEKDAY_SHORT_LABELS = [
  'Dom',
  'Lun',
  'Mar',
  'Mié',
  'Jue',
  'Vie',
  'Sáb',
] as const;

interface CalendarParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

interface ZonedTimeParts extends CalendarParts {
  readonly hour: number;
  readonly minute: number;
}

function parseCalendarDate(dateStr: string): CalendarParts {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

function formatCalendarDate(parts: CalendarParts): string {
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${parts.year}-${month}-${day}`;
}

function addCalendarDays(dateStr: string, days: number): string {
  const { year, month, day } = parseCalendarDate(dateStr);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return formatCalendarDate({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  });
}

export function getCalendarDateInTimeZone(
  date: Date,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getZonedTimeParts(date: Date, timeZone: string): ZonedTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
  };
}

function getWeekdayIndexInTimeZone(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(date);
  return WEEKDAY_INDEX[weekday] ?? 0;
}

function isBusinessWeekday(dayIndex: number): boolean {
  return dayIndex >= 1 && dayIndex <= 5;
}

function getWeekdayIndexForCalendarDate(
  dateStr: string,
  timeZone: string,
): number {
  const midday = zonedLocalDateTimeToUtc(dateStr, 12, 0, timeZone);
  return getWeekdayIndexInTimeZone(midday, timeZone);
}

export function zonedLocalDateTimeToUtc(
  calendarDate: string,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const { year, month, day } = parseCalendarDate(calendarDate);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const zoned = getZonedTimeParts(utcGuess, timeZone);
  const desiredMinutes = hour * 60 + minute;
  const actualMinutes = zoned.hour * 60 + zoned.minute;
  const dayDelta =
    year * 372 +
    month * 31 +
    day -
    (zoned.year * 372 + zoned.month * 31 + zoned.day);
  const deltaMinutes = dayDelta * 24 * 60 + (desiredMinutes - actualMinutes);

  return new Date(utcGuess.getTime() + deltaMinutes * 60 * 1000);
}

function listCalendarDaysBetween(
  start: Date,
  end: Date,
  timeZone: string,
): readonly string[] {
  const days: string[] = [];
  let cursor = getCalendarDateInTimeZone(start, timeZone);
  const endDate = getCalendarDateInTimeZone(end, timeZone);

  while (cursor <= endDate) {
    days.push(cursor);
    cursor = addCalendarDays(cursor, 1);
  }

  return days;
}

export function countBusinessMinutesBetween(
  start: Date,
  end: Date,
  timeZone: string,
): number {
  if (end.getTime() <= start.getTime()) {
    return 0;
  }

  let total = 0;

  for (const calendarDate of listCalendarDaysBetween(start, end, timeZone)) {
    if (
      !isBusinessWeekday(getWeekdayIndexForCalendarDate(calendarDate, timeZone))
    ) {
      continue;
    }

    const dayStart = zonedLocalDateTimeToUtc(
      calendarDate,
      WORK_SCHEDULE.startHour,
      WORK_SCHEDULE.startMinute,
      timeZone,
    );
    const dayEnd = zonedLocalDateTimeToUtc(
      calendarDate,
      WORK_SCHEDULE.endHour,
      WORK_SCHEDULE.endMinute,
      timeZone,
    );
    const overlapStart = Math.max(start.getTime(), dayStart.getTime());
    const overlapEnd = Math.min(end.getTime(), dayEnd.getTime());

    if (overlapEnd > overlapStart) {
      total += Math.floor((overlapEnd - overlapStart) / 60_000);
    }
  }

  return total;
}

export function businessMinutesToDays(minutes: number): number {
  if (minutes <= 0) {
    return 0;
  }

  return Math.round((minutes / BUSINESS_MINUTES_PER_DAY) * 10) / 10;
}

export function countBusinessDaysBetween(
  start: Date,
  end: Date,
  timeZone: string,
): number {
  return businessMinutesToDays(
    countBusinessMinutesBetween(start, end, timeZone),
  );
}

export function resolveCurrentWeekPeriod(timeZone: string): {
  readonly from: string;
  readonly to: string;
  readonly label: string;
} {
  const to = getCalendarDateInTimeZone(new Date(), timeZone);
  const weekday = getWeekdayIndexForCalendarDate(to, timeZone);
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  const from = addCalendarDays(to, -daysFromMonday);
  const fromLabel = formatShortDateLabel(from, timeZone);
  const toLabel = formatShortDateLabel(to, timeZone);

  return {
    from,
    to,
    label: `Semana actual (${fromLabel} – ${toLabel})`,
  };
}

function formatShortDateLabel(calendarDate: string, timeZone: string): string {
  const date = zonedLocalDateTimeToUtc(calendarDate, 12, 0, timeZone);
  return new Intl.DateTimeFormat('es-MX', {
    timeZone,
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export function listCalendarDaysInRange(
  from: string,
  to: string,
): readonly string[] {
  const days: string[] = [];
  let cursor = from;

  while (cursor <= to) {
    days.push(cursor);
    cursor = addCalendarDays(cursor, 1);
  }

  return days;
}

export function resolveWeekdayShortLabel(
  calendarDate: string,
  timeZone: string,
): string {
  const index = getWeekdayIndexForCalendarDate(calendarDate, timeZone);
  return WEEKDAY_SHORT_LABELS[index] ?? '—';
}
