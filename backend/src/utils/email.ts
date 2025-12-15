// backend/src/utils/email.ts
import nodemailer from 'nodemailer';

type Transporter = nodemailer.Transporter | null;
let transporter: Transporter = null;

function getSmtpConfig() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      'SMTP config incompleta. Revisa SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM en .env'
    );
  }

  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE ?? '').toLowerCase() === 'true', // true = 465, false = 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    from: SMTP_FROM,
  };
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const cfg = getSmtpConfig();
  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth,
  });

  return transporter;
}

/**
 * Verifica la conexión SMTP al iniciar el servidor (opcional, pero útil).
 */
export async function verifySmtpConnection(): Promise<void> {
  try {
    // Verificar que la configuración esté completa antes de intentar conectar
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM,
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      console.log('[SMTP] Configuración incompleta - emails deshabilitados ⚠️');
      return;
    }

    const t = getTransporter();
    await t.verify();
    console.log('[SMTP] Conexión verificada correctamente ✔️');
  } catch (err) {
    console.error('[SMTP] Error verificando conexión ❌', err);
    console.log('[SMTP] Emails deshabilitados ⚠️');
  }
}

function buildResetTemplates(params: {
  to: string;
  resetUrl: string;
  minutes: number;
  productName?: string;
}) {
  const product = params.productName ?? 'EduConecta';
  const subject = `Restablecer contraseña - ${product}`;

  const text = [
    `Has solicitado restablecer tu contraseña en ${product}.`,
    `Abre el siguiente enlace para continuar (expira en ${params.minutes} minutos):`,
    `${params.resetUrl}`,
    ``,
    `Si no fuiste tú, ignora este mensaje.`,
  ].join('\n');

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell, Noto Sans, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji';background:#f5f6f8;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaeaea">
      <tr>
        <td style="padding:24px 24px 0 24px;">
          <h2 style="margin:0 0 8px 0;color:#111827;">Restablecer contraseña</h2>
          <p style="margin:0;color:#374151;">Has solicitado restablecer tu contraseña en <b>${product}</b>.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;">
          <a href="${params.resetUrl}"
             style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">
             Cambiar mi contraseña
          </a>
          <p style="color:#6b7280;margin:12px 0 0 0;font-size:14px;">
            El enlace expira en <b>${params.minutes} minutos</b>. Si no fuiste tú, puedes ignorar este mensaje.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 24px 24px;border-top:1px solid #f1f5f9;color:#9ca3af;font-size:12px;">
          Si el botón no funciona, copia y pega esta URL en tu navegador:<br/>
          <a href="${params.resetUrl}" style="color:#2563eb;">${params.resetUrl}</a>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, text, html };
}

/**
 * Envía el correo de reset de contraseña.
 * @param to Destinatario
 * @param resetUrl Link absoluto hacia /reset-password con token y email como query params
 * @param minutes Minutos de expiración mostrados en el email (opcional, default 30)
 * @param productName Nombre del producto (opcional, default "EduConecta")
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  minutes = 30,
  productName = 'EduConecta'
): Promise<void> {
  const cfg = getSmtpConfig();
  const t = getTransporter();
  const { subject, text, html } = buildResetTemplates({
    to,
    resetUrl,
    minutes,
    productName,
  });

  await t.sendMail({
    from: cfg.from,
    to,
    subject,
    text,
    html,
  });
}
