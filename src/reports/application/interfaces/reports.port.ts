import type {
  ReportsExportDataset,
  ReportsPreview,
  ReportsQueryFilter,
} from './reports.interface';

export const REPORTS_REPOSITORY = Symbol('REPORTS_REPOSITORY');

export interface ReportsRepositoryPort {
  getPreview(filter: ReportsQueryFilter): Promise<ReportsPreview>;
  getExportDataset(filter: ReportsQueryFilter): Promise<ReportsExportDataset>;
}
