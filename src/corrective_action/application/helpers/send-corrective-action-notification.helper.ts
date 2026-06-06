import { Logger } from '@nestjs/common';
import axios from 'axios';

const logger = new Logger('CorrectiveActionNotification');

interface CorrectiveActionNotificationPayload {
  readonly recipientEmail: string;
  readonly subject: string;
  readonly body: string;
  readonly actionUrl: string;
}

export async function sendCorrectiveActionNotification(
  payload: CorrectiveActionNotificationPayload,
): Promise<void> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL?.trim();

  logger.log(
    JSON.stringify({
      event: 'corrective_action_notification',
      recipientEmail: payload.recipientEmail,
      subject: payload.subject,
      actionUrl: payload.actionUrl,
    }),
  );

  if (!webhookUrl) {
    return;
  }

  const response = await axios.post(
    webhookUrl,
    {
      email: {
        to: payload.recipientEmail,
        subject: payload.subject,
        body: payload.body,
      },
      actionUrl: payload.actionUrl,
    },
    {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    },
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `Notification delivery failed: ${response.status} ${response.statusText}`,
    );
  }
}

export function buildCorrectiveActionNotificationContent(input: {
  readonly responsibleName: string;
  readonly detectionFolio: string;
  readonly actionUrl: string;
  readonly status: string;
}): { readonly subject: string; readonly body: string } {
  const statusMessage =
    input.status === 'pending_acceptance'
      ? 'Debes firmar el enterado y responder con tu plan de corrección.'
      : 'Tienes una acción correctiva abierta que requiere tu atención.';

  return {
    subject: `SIRA - Recordatorio de acción correctiva ${input.detectionFolio}`,
    body: [
      `Hola ${input.responsibleName},`,
      '',
      statusMessage,
      '',
      `Folio: ${input.detectionFolio}`,
      `Revisa tu acción en: ${input.actionUrl}`,
    ].join('\n'),
  };
}
