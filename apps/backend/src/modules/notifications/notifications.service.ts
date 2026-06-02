import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as dns from 'dns';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter | null = null;
  private isTesting = true;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    // Forzar a Node.js a priorizar la resolución IPv4 en todas las llamadas DNS de este servicio.
    // Esto garantiza que Nodemailer e incluso las llamadas TLS utilicen IPv4 para evitar ENETUNREACH en Render.
    dns.setDefaultResultOrder('ipv4first');

    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (user && pass && host) {
      if (pass.startsWith('re_')) {
        this.isTesting = false;
        console.log('Servicio de Email inicializado en modo REAL (API REST de Resend por puerto 443).');
        return;
      }

      const parsedPort = Number(port);
      this.transporter = nodemailer.createTransport({
        host,
        port: parsedPort,
        secure: parsedPort === 465,
        auth: { user, pass },
        lookup: (hostname: string, options: any, callback: any) => {
          dns.lookup(hostname, { ...options, family: 4 }, callback);
        },
      } as any);
      
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Error de conexión SMTP en inicialización:', error);
        } else {
          console.log('✅ El servidor SMTP está listo para enviar mensajes reales.');
        }
      });

      this.isTesting = false;
      console.log('Servicio de Email inicializado en modo REAL (SMTP).');
    } else {
      console.log('No se configuraron variables de SMTP. Inicializando sandbox de pruebas (Ethereal)...');
      try {
        // Creamos una cuenta de prueba en Ethereal.email de forma asíncrona
        nodemailer.createTestAccount((err, account) => {
          if (err) {
            console.error('Error al crear cuenta Ethereal para pruebas:', err);
            return;
          }
          this.transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
              user: account.user,
              pass: account.pass,
            },
          });
          console.log(`Sandbox de Email listo. Usuario: ${account.user}`);
        });
      } catch (err) {
        console.error('Falla al inicializar Ethereal Mailer:', err);
      }
    }
  }

  async sendReservationConfirmation(
    toEmail: string,
    customerName: string,
    reservationDetails: {
      id: string;
      clubName: string;
      courtName: string;
      sport: string;
      date: string;
      time: string;
      duration: number;
      totalPrice: number;
      depositAmount: number;
    }
  ) {
    const from = this.configService.get<string>('SMTP_FROM') || '"Reservate" <noreply@reservate.com>';
    const subject = `¡Tu reserva en ${reservationDetails.clubName} está confirmada! 🎾`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reserva Confirmada</title>
      <style>
        body {
          background-color: #09090b;
          color: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #18181b;
          border: 1px border #27272a;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .logo-container {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }
        .logo-box {
          height: 32px;
          width: 32px;
          background-color: #39ff14;
          color: #09090b;
          border-radius: 8px;
          display: inline-block;
          text-align: center;
          line-height: 32px;
          font-weight: bold;
          font-size: 18px;
          margin-right: 10px;
        }
        .logo-text {
          font-size: 20px;
          font-weight: bold;
          color: #ffffff;
          display: inline-block;
          vertical-align: middle;
        }
        .accent {
          color: #39ff14;
        }
        h1 {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 12px;
        }
        p {
          color: #a1a1aa;
          font-size: 14px;
          line-height: 1.6;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .divider {
          border-top: 1px solid #27272a;
          margin: 24px 0;
        }
        .details-grid {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .details-row {
          display: table;
          width: 100%;
          margin-bottom: 12px;
        }
        .details-row:last-child {
          margin-bottom: 0;
        }
        .details-label {
          display: table-cell;
          width: 40%;
          color: #71717a;
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .details-value {
          display: table-cell;
          width: 60%;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }
        .badge-confirmed {
          display: inline-block;
          background-color: rgba(57, 255, 20, 0.1);
          border: 1px solid rgba(57, 255, 20, 0.2);
          color: #39ff14;
          font-size: 11px;
          font-weight: bold;
          padding: 4px 10px;
          border-radius: 12px;
          text-transform: uppercase;
        }
        .payment-box {
          background-color: rgba(57, 255, 20, 0.05);
          border: 1px solid rgba(57, 255, 20, 0.2);
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          margin-bottom: 24px;
        }
        .payment-title {
          font-size: 11px;
          font-weight: bold;
          color: #39ff14;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .payment-amount {
          font-size: 24px;
          font-weight: 800;
          color: #39ff14;
        }
        .payment-subtitle {
          font-size: 11px;
          color: #a1a1aa;
          margin-top: 4px;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #52525b;
          margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <div class="logo-box">R</div>
          <div class="logo-text">Reservate<span class="accent">.</span></div>
        </div>

        <h1>¡Reserva Confirmada, ${customerName}!</h1>
        <p>Tu seña ha sido recibida con éxito y el turno ya está bloqueado en nuestro sistema. A continuación encontrás los detalles de tu reserva deportiva:</p>

        <div class="details-grid">
          <div class="details-row">
            <div class="details-label">ID de Reserva</div>
            <div class="details-value" style="font-family: monospace; font-size: 13px;">#${reservationDetails.id}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Sede / Club</div>
            <div class="details-value">${reservationDetails.clubName}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Cancha</div>
            <div class="details-value">${reservationDetails.courtName} (${reservationDetails.sport})</div>
          </div>
          <div class="details-row">
            <div class="details-label">Fecha</div>
            <div class="details-value">${reservationDetails.date}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Horario</div>
            <div class="details-value">${reservationDetails.time} (${reservationDetails.duration} ${reservationDetails.duration === 1 ? 'hora' : 'horas'})</div>
          </div>
          <div class="details-row">
            <div class="details-label">Estado de Reserva</div>
            <div class="details-value">
              <span class="badge-confirmed">Confirmada</span>
            </div>
          </div>
        </div>

        <div class="payment-box">
          <div class="payment-title">Monto de Seña Abonado</div>
          <div class="payment-amount">$${reservationDetails.depositAmount.toLocaleString()}</div>
          <div class="payment-subtitle">Saldo restante de $${(reservationDetails.totalPrice - reservationDetails.depositAmount).toLocaleString()} a abonar en el club</div>
        </div>

        <p style="font-size: 13px; text-align: center;">Recordá presentarte en recepción 10 minutos antes de tu horario.</p>
        
        <div class="divider"></div>
        <div class="footer">
          <p>© 2026 Reservate. Todos los derechos reservados.<br>Este es un correo automático, por favor no respondas directamente a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const pass = this.configService.get<string>('SMTP_PASS');

    if (pass && pass.startsWith('re_')) {
      try {
        console.log(`Enviando email via API REST de Resend a: ${toEmail}...`);
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pass}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: from,
            to: toEmail,
            subject: subject,
            html: htmlContent
          })
        });

        const data = await response.json() as any;

        if (response.ok) {
          console.log(`✅ Email enviado con éxito via API de Resend a: ${toEmail}. MessageId: ${data.id}`);
        } else {
          console.error('❌ Error de la API de Resend:', data);
        }
        return;
      } catch (apiError) {
        console.error('❌ Error al conectar con la API REST de Resend:', apiError);
        // Fallback al transportador si falla la API
      }
    }

    if (!this.transporter) {
      console.warn('El transportador de email no está inicializado aún.');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      console.log(`Email enviado con éxito a: ${toEmail}. MessageId: ${info.messageId}`);
      
      if (this.isTesting) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('========================================================================');
        console.log('✉️ PREVIEW DE EMAIL ENVIADO (MODO MOCK):');
        console.log(previewUrl);
        console.log('========================================================================');
        
        // Guardar el link en una ruta para auditorías o fácil acceso
        const logDir = 'C:/Users/juanp/.gemini/antigravity/brain/0404d1e4-10e2-458d-95cd-b130662bc2c8/scratch';
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        fs.writeFileSync(`${logDir}/last_email_preview.txt`, previewUrl || '');
      }
    } catch (error) {
      console.error('Error al enviar email de confirmación:', error);
    }
  }
}
