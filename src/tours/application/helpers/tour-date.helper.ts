import type { TourPeriod } from '../interfaces/tours.interface';

const WEEKDAY_LABELS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const;

export function resolvePeriodStartDate(period: TourPeriod, referenceDate: Date): Date {
  if (period === 'day') {
    const startOfDay = new Date(referenceDate);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  const startOfWeek = new Date(referenceDate);
  const dayOfWeek = startOfWeek.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

export function formatTourDateLabel(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCommitmentDateLabel(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTourDateTimeLabel(date: Date): string {
  const dateLabel = date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeLabel = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateLabel} · ${timeLabel}`;
}

export function resolveWeekdayLabel(date: Date): string {
  return WEEKDAY_LABELS[date.getDay()];
}

export function resolveWeekdayOrder(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}
