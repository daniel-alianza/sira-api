import {
  getCalendarDateInTimeZone,
  resolveCurrentWeekPeriod,
} from '../../../common/days-and-hours-work';
import type { ReportsPeriodPreset } from '../interfaces/reports.interface';

export interface ResolvedReportsPeriod {
  readonly from: string;
  readonly to: string;
  readonly preset: ReportsPeriodPreset;
  readonly label: string;
}

export function resolveReportsPeriod(input: {
  readonly preset: ReportsPeriodPreset;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly timeZone: string;
}): ResolvedReportsPeriod {
  if (input.preset === 'daily') {
    const today = getCalendarDateInTimeZone(new Date(), input.timeZone);
    return {
      from: today,
      to: today,
      preset: 'daily',
      label: `Hoy (${today})`,
    };
  }

  if (input.preset === 'weekly') {
    const week = resolveCurrentWeekPeriod(input.timeZone);
    return {
      from: week.from,
      to: week.to,
      preset: 'weekly',
      label: week.label,
    };
  }

  if (!input.dateFrom || !input.dateTo) {
    throw new Error('REPORTS_CUSTOM_DATES_REQUIRED');
  }

  if (input.dateFrom > input.dateTo) {
    throw new Error('REPORTS_INVALID_DATE_RANGE');
  }

  return {
    from: input.dateFrom,
    to: input.dateTo,
    preset: 'custom',
    label: `${input.dateFrom} – ${input.dateTo}`,
  };
}
