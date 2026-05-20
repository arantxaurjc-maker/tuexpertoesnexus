// src/lib/emails.ts
// Sistema para enviar emails automatizados de confirmación

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tuexpertoesnexus.com';

interface ConfirmationEmailParams {
  clientEmail: string;
  clientName: string;
  expertName: string;
  amount: number;
  sessionId: string;
}

interface ExpertNotificationParams {
  expertEmail: string;
  expertName: string;
  clientName: string;
  amount: number;
  sessionId: string;
}

/**
 * Envía email de confirmación al cliente después del pago
 */
export async function sendConfirmationEmail({
  clientEmail,
  clientName,
  expertName,
  amount,
  sessionId,
}: ConfirmationEmailParams) {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .success-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 4px; margin-bottom: 20px; }
            .details { background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Pago Confirmado! ✓</h1>
              <p>Tu reserva de sesión ha sido procesada exitosamente</p>
            </div>
            
            <div class="content">
              <p>Hola ${clientName},</p>
              
              <p>Gracias por confiar en <strong>Tu Expertos es Nexus</strong>. Tu pago ha sido procesado correctamente.</p>
              
              <div class="success-badge">TRANSACCIÓN COMPLETADA</div>
              
              <h2>Detalles de tu sesión:</h2>
              
              <div class="details">
                <p><strong>Experto:</strong> ${expertName}</p>
                <p><strong>Monto pagado:</strong> €${amount.toFixed(2)}</p>
                <p><strong>ID de sesión:</strong> ${sessionId}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
              </div>
              
              <p>El experto se pondrá en contacto contigo pronto para confirmar la fecha y hora de tu sesión.</p>
              
              <p><strong>¿Necesitas ayuda?</strong> Responde este correo o contacta a nuestro equipo.</p>
              
              <a href="https://tuexpertoesnexus.vercel.app" class="button">Ver mis sesiones</a>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Tu Expertos es Nexus. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: `✓ Confirmación de pago - Sesión con ${expertName}`,
      html: htmlContent,
    });

    console.log(`📧 Email de confirmación enviado a ${clientEmail}`);
    return result;
  } catch (error) {
    console.error('Error enviando email de confirmación:', error);
    throw error;
  }
}

/**
 * Notifica al experto que tiene una nueva sesión reservada
 */
export async function sendExpertNotificationEmail({
  expertEmail,
  expertName,
  clientName,
  amount,
  sessionId,
}: ExpertNotificationParams) {
  try {
    const expertCommission = amount; // Ya es el 70%

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .earnings { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
            .earnings-amount { font-size: 28px; font-weight: bold; color: #10b981; }
            .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Nueva Sesión Reservada! 🎉</h1>
              <p>Un cliente ha confirmado su sesión contigo</p>
            </div>
            
            <div class="content">
              <p>Hola ${expertName},</p>
              
              <p>¡Felicidades! <strong>${clientName}</strong> ha reservado una sesión 1:1 contigo.</p>
              
              <div class="earnings">
                <p style="margin: 0 0 10px 0; color: #047857;">Tu ganancia por esta sesión:</p>
                <div class="earnings-amount">€${expertCommission.toFixed(2)}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #047857;">Se transferirá a tu cuenta dentro de 3-5 días hábiles</p>
              </div>
              
              <h3>Detalles de la sesión:</h3>
              <ul>
                <li><strong>Cliente:</strong> ${clientName}</li>
                <li><strong>ID de sesión:</strong> ${sessionId}</li>
                <li><strong>Monto:</strong> €${amount.toFixed(2)}</li>
                <li><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</li>
              </ul>
              
              <p>El cliente espera que te comuniques con él pronto para confirmar la fecha y hora de la sesión.</p>
              
              <a href="https://tuexpertoesnexus.vercel.app/dashboard" class="button">Ver en mi panel</a>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} Tu Expertos es Nexus. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: expertEmail,
      subject: `🎉 Nueva sesión reservada con ${clientName}`,
      html: htmlContent,
    });

    console.log(`📧 Email de notificación enviado a ${expertEmail}`);
    return result;
  } catch (error) {
    console.error('Error enviando email al experto:', error);
    throw error;
  }
}

/**
 * Envía email de recepción de error (para casos de fallo en pago)
 */
export async function sendErrorNotificationEmail(
  userEmail: string,
  errorMessage: string
) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Problema con tu pago - Tu Expertos es Nexus',
      html: `
        <p>Hola,</p>
        <p>Hemos detectado un problema al procesar tu pago.</p>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p>Por favor, intenta de nuevo. Si el problema persiste, contacta a nuestro equipo.</p>
        <p>Gracias,<br>Tu Expertos es Nexus</p>
      `,
    });

    return result;
  } catch (error) {
    console.error('Error enviando email de error:', error);
    throw error;
  }
}