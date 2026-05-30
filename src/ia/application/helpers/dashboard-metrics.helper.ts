const STATUS_LABELS: Record<string, string> = {
  PENDING_ACCEPTANCE: 'Pendiente de aceptación',
  OPEN: 'Abierta',
  PENDING: 'Pendiente',
  EXPIRED: 'Expirada',
  CLOSURE_REVIEW: 'En revisión de cierre',
  CLOSED: 'Cerrada',
  REJECTED: 'Rechazada',
  REOPENED: 'Reabierta',
};

export function mapCorrectiveStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatDashboardGeneratedAt(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

