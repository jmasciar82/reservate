import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private isMockMode = true;
  private whatsappToken: string | null = null;
  private whatsappPhoneId: string | null = null;
  private logFilePath: string;

  constructor(private configService: ConfigService) {
    this.whatsappToken = this.configService.get<string>('WHATSAPP_TOKEN') ?? null;
    this.whatsappPhoneId = this.configService.get<string>('WHATSAPP_PHONE_ID') ?? null;

    if (this.whatsappToken && this.whatsappPhoneId && this.whatsappToken !== 'placeholder') {
      this.isMockMode = false;
      this.logger.log('WhatsApp Cloud API configurada y lista para producción.');
    } else {
      this.logger.log('Sin credenciales reales de WhatsApp. Usando modo Sandbox simulado.');
    }

    // Ubicación del archivo de log del sandbox
    const baseBrainDir = 'C:\\Users\\juanp\\.gemini\\antigravity\\brain\\0404d1e4-10e2-458d-95cd-b130662bc2c8';
    this.logFilePath = path.join(baseBrainDir, 'scratch', 'whatsapp_notifications.log');
  }

  async sendConfirmation(phone: string, text: string): Promise<boolean> {
    if (!phone || phone.trim() === '') {
      this.logger.warn('No se puede enviar WhatsApp: Teléfono no provisto.');
      return false;
    }

    const timestamp = new Date().toISOString();

    if (this.isMockMode) {
      // Registrar mensaje en el archivo de simulación
      try {
        const scratchDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(scratchDir)) {
          fs.mkdirSync(scratchDir, { recursive: true });
        }

        const logEntry = `[${timestamp}] TO: ${phone}\nMESSAGE: ${text}\n----------------------------------------\n`;
        fs.appendFileSync(this.logFilePath, logEntry, 'utf-8');
      } catch (err) {
        this.logger.error('Error al guardar log de WhatsApp simulado:', err);
      }

      // Imprimir el globo de WhatsApp de forma ultra estética en la consola del servidor
      const border = '═'.repeat(50);
      const headerText = '📱 SIMULACIÓN WHATSAPP ENVIADO 📱';
      const paddedHeader = headerText.padStart(Math.floor((50 + headerText.length) / 2)).padEnd(50);
      
      console.log(`
╔${border}╗
║${paddedHeader}║
╠═ Destinatario: ${phone.padEnd(35)} ═╣
╠═ Fecha/Hora:  ${timestamp.slice(0, 19).replace('T', ' ').padEnd(35)} ═╣
╟${'─'.repeat(50)}╢
║ [Mensaje Entregado]:                               ║
${text.split('\n').map(line => `║   ${line.padEnd(46)}   ║`).join('\n')}
╚${border}╝
`);
      return true;
    } else {
      // Integración real con Meta Cloud API
      try {
        const url = `https://graph.facebook.com/v18.0/${this.whatsappPhoneId}/messages`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phone,
            type: 'text',
            text: {
              preview_url: false,
              body: text,
            },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          this.logger.error(`Error al enviar mensaje real vía Meta API: ${errBody}`);
          return false;
        }

        this.logger.log(`WhatsApp real enviado con éxito a ${phone}.`);
        return true;
      } catch (err) {
        this.logger.error('Error de red al enviar WhatsApp real:', err);
        return false;
      }
    }
  }
}
