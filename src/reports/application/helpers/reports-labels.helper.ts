import { CorrectiveActionStatus } from '../../../../generated/prisma/client';
import type { TourCorrectiveActionStatus } from '../../../tours/application/interfaces/tours.interface';
import { mapCorrectiveActionStatusFromPrisma } from '../../../tours/application/mappers/tours-enum.mapper';

const STATUS_LABELS: Record<TourCorrectiveActionStatus, string> = {
  pending_acceptance: 'Pendiente de aceptación',
  open: 'Abierta',
  pending: 'Pendiente',
  expired: 'Expirada',
  closure_review: 'En revisión de cierre',
  closed: 'Cerrada',
  rejected: 'Rechazada',
  reopened: 'Reabierta',
};

export function resolveCorrectiveStatusLabel(
  status: CorrectiveActionStatus,
): string {
  const mapped = mapCorrectiveActionStatusFromPrisma(status);
  return STATUS_LABELS[mapped];
}

export function resolveDetectionTypeLabel(type: 'UNSAFE_ACT' | 'UNSAFE_CONDITION'): string {
  return type === 'UNSAFE_ACT' ? 'Acto inseguro' : 'Condición insegura';
}

export function resolveBooleanLabel(value: boolean): string {
  return value ? 'Sí' : 'No';
}

export function resolveDeadlineLegend(
  status: CorrectiveActionStatus,
  currentCommitmentDate: Date | null,
  now: Date,
): string {
  if (
    status === CorrectiveActionStatus.CLOSED ||
    status === CorrectiveActionStatus.REJECTED
  ) {
    return '—';
  }

  if (!currentCommitmentDate) {
    return '—';
  }

  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const commitment = Date.UTC(
    currentCommitmentDate.getUTCFullYear(),
    currentCommitmentDate.getUTCMonth(),
    currentCommitmentDate.getUTCDate(),
  );

  if (status === CorrectiveActionStatus.EXPIRED || today > commitment) {
    return 'Expirado';
  }

  return 'Pendiente';
}

export function resolveClosedOnTimeLabel(
  status: CorrectiveActionStatus,
  currentCommitmentDate: Date | null,
  closedAt: Date | null,
): string {
  if (status !== CorrectiveActionStatus.CLOSED || !currentCommitmentDate || !closedAt) {
    return 'N/A';
  }

  const closedDay = Date.UTC(
    closedAt.getUTCFullYear(),
    closedAt.getUTCMonth(),
    closedAt.getUTCDate(),
  );
  const commitmentDay = Date.UTC(
    currentCommitmentDate.getUTCFullYear(),
    currentCommitmentDate.getUTCMonth(),
    currentCommitmentDate.getUTCDate(),
  );

  return closedDay <= commitmentDay ? 'Sí' : 'No';
}
