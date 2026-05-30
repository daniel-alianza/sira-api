import ExcelJS from 'exceljs';
import type { ReportsExportDataset } from '../interfaces/reports.interface';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0A2240' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

function styleHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 22;
}

function addSheetWithRows(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): void {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  const headerRow = sheet.addRow([...headers]);
  styleHeaderRow(headerRow);

  for (const rowValues of rows) {
    sheet.addRow([...rowValues]);
  }

  sheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value?.toString() ?? '';
      maxLength = Math.max(maxLength, Math.min(value.length + 2, 48));
    });
    column.width = maxLength;
  });
}

export async function buildReportsWorkbookBuffer(
  dataset: ReportsExportDataset,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIRA';
  workbook.created = new Date();

  addSheetWithRows(workbook, 'Acciones', [
    'Folio recorrido',
    'Folio acción',
    'Empresa',
    'Sucursal',
    'Área',
    'Inspector',
    'Responsable',
    'Fecha recorrido',
    'Fecha detección',
    'Fecha compromiso inicial',
    'Fecha compromiso vigente',
    'Estatus',
    'Leyenda plazo',
    'Descripción',
    'Plan de acción',
    'Evidencia inicial',
    'Firmó enterado',
    'Reprogramó fecha',
    'Foto resolución',
    'Cierre validado',
    'Cierre rechazado',
    'Motivo rechazo',
    'Motivos cambio fecha',
    'Fecha firma enterado',
    'Fecha foto resolución',
    'Minutos resolución',
    'Cumplió en plazo',
  ], dataset.actions.map((row) => [
    row.walkthroughFolio,
    row.detectionFolio,
    row.companyName,
    row.branchName,
    row.areaName,
    row.inspectorName,
    row.responsibleName,
    row.tourDate,
    row.detectedAt,
    row.initialCommitmentDate,
    row.currentCommitmentDate,
    row.statusLabel,
    row.deadlineLegend,
    row.description,
    row.correctivePlan,
    row.hasInitialEvidence ? 'Sí' : 'No',
    row.hasSignedAcknowledgment ? 'Sí' : 'No',
    row.hasDateReschedule ? 'Sí' : 'No',
    row.hasResolutionPhoto ? 'Sí' : 'No',
    row.isClosureApproved ? 'Sí' : 'No',
    row.hasClosureRejection ? 'Sí' : 'No',
    row.closureRejectionReason,
    row.dateChangeReasons,
    row.signedAt,
    row.resolutionAt,
    row.resolutionMinutes,
    row.closedOnTime,
  ]));

  addSheetWithRows(workbook, 'Fechas compromiso', [
    'Folio acción',
    'Tipo',
    'Fecha compromiso',
    'Fecha firma',
    'Responsable',
    'Motivo cambio',
    'Foto resolución',
    'Vigente',
  ], dataset.commitments.map((row) => [
    row.detectionFolio,
    row.sequenceLabel,
    row.commitmentDate,
    row.signedAt,
    row.signedByName,
    row.changeReason,
    row.hasResolutionPhoto ? 'Sí' : 'No',
    row.isCurrent ? 'Sí' : 'No',
  ]));

  addSheetWithRows(workbook, 'Recorridos', [
    'Folio',
    'Fecha recorrido',
    'Inspector',
    'Finalizado',
    'Detecciones',
    'Con acción correctiva',
  ], dataset.walkthroughs.map((row) => [
    row.folio,
    row.tourDate,
    row.inspectorName,
    row.isCompleted ? 'Sí' : 'No',
    String(row.detectionsCount),
    String(row.actionsCount),
  ]));

  addSheetWithRows(workbook, 'Detecciones', [
    'Folio recorrido',
    'Folio detección',
    'Empresa',
    'Área',
    'Tipo',
    'Responsable',
    'Descripción',
    'Evidencia inicial',
    'Generó acción',
  ], dataset.detections.map((row) => [
    row.walkthroughFolio,
    row.detectionFolio,
    row.companyName,
    row.areaName,
    row.detectionTypeLabel,
    row.responsibleName,
    row.description,
    row.hasInitialEvidence ? 'Sí' : 'No',
    row.hasCorrectiveAction ? 'Sí' : 'No',
  ]));

  addSheetWithRows(workbook, 'Resumen', ['Indicador', 'Valor'], dataset.summary.map((row) => [
    row.metric,
    row.value,
  ]));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
