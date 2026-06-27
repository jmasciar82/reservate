import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Club, ClubDocument } from '../clubs/schemas/club.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { CreatePublicReservationDto } from './dto/create-public-reservation.dto';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class PublicService {
  private mpClient: MercadoPagoConfig | null = null;
  private isMockMode = true;

  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private whatsappService: WhatsappService,
    private jwtService: JwtService,
  ) {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');
    if (accessToken && accessToken !== 'placeholder' && accessToken.trim() !== '') {
      try {
        this.mpClient = new MercadoPagoConfig({ accessToken });
        this.isMockMode = false;
        console.log('Mercado Pago inicializado correctamente en modo REAL.');
      } catch (err) {
        console.error('Error al inicializar Mercado Pago. Usando modo MOCK/SIMULADO.', err);
      }
    } else {
      console.log('No se detectó MERCADO_PAGO_ACCESS_TOKEN. Usando modo MOCK/SIMULADO.');
    }
  }

  private async cleanAbandonedReservations(): Promise<void> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const result = await this.reservationModel.updateMany(
      {
        isPublic: true,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: { $lt: tenMinutesAgo },
      },
      {
        $set: { status: 'cancelled' },
      }
    ).exec();

    if (result.modifiedCount > 0) {
      console.log(`🧹 Auto-limpieza: Se cancelaron ${result.modifiedCount} reservas públicas abandonadas.`);
    }
  }

  async getClubs(): Promise<Club[]> {
    return this.clubModel.find().select('-mpAccessToken -mpPublicKey -tenantId').exec();
  }

  async findOneByDomain(hostname: string): Promise<Club> {
    if (!hostname) {
      throw new BadRequestException('El nombre de host no es válido.');
    }

    // Limpiar puerto si existe
    const cleanHost = hostname.split(':')[0].toLowerCase();

    // 1. Intentar buscar por customDomain exacto
    let club = await this.clubModel.findOne({ customDomain: cleanHost }).select('-mpAccessToken -mpPublicKey').exec();
    if (club) return club;

    // 2. Intentar extraer subdominio (ej: club.reservate.com o club.localhost)
    const parts = cleanHost.split('.');
    let subdomain = '';

    if (parts.length > 2) {
      subdomain = parts[0];
    } else if (parts.length === 2 && parts[1] === 'localhost') {
      subdomain = parts[0];
    }

    if (subdomain && subdomain !== 'www') {
      club = await this.clubModel.findOne({ subdomain }).select('-mpAccessToken -mpPublicKey').exec();
      if (club) return club;
    }

    throw new NotFoundException('Sede no encontrada para el subdominio indicado.');
  }

  async getAvailableCourts(startTime: string, endTime: string, clubId?: string): Promise<any[]> {
    await this.cleanAbandonedReservations();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new BadRequestException('El rango de horario no es válido.');
    }

    // 1. Buscamos todas las canchas (activas)
    const query: any = { isActive: true };
    if (clubId) {
      if (!Types.ObjectId.isValid(clubId)) {
        throw new BadRequestException('El club indicado no es válido.');
      }
      query.clubId = new Types.ObjectId(clubId);
    }

    const courts = await this.courtModel.find(query).exec();

    // 2. Buscamos las reservas que se solapan
    const activeReservations = await this.reservationModel.find({
      status: { $ne: 'cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).exec();

    const reservedCourtIds = activeReservations.map((r) => r.courtId.toString());

    // 3. Retornamos todas las canchas marcando su disponibilidad
    return courts.map((court) => {
      const courtObj = court.toObject();
      return {
        ...courtObj,
        isAvailable: !reservedCourtIds.includes(court._id.toString()),
      };
    });
  }

  async createPublicReservation(dto: CreatePublicReservationDto) {
    await this.cleanAbandonedReservations();
    const { courtId, startTime, endTime, firstName, lastName, email, phone } = dto;

    if (!courtId || !startTime || !endTime || !firstName || !lastName || !email) {
      throw new BadRequestException('Todos los campos obligatorios deben estar completos (cancha, horario, nombre, apellido, email).');
    }

    if (!Types.ObjectId.isValid(courtId)) {
      throw new BadRequestException('La cancha indicada no es válida.');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new BadRequestException('El horario de la reserva no es válido.');
    }

    // Validar reserva en el pasado
    const now = new Date();
    const threshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 min de holgura
    if (start < threshold) {
      throw new BadRequestException('No se pueden crear reservas en el pasado.');
    }

    // Validar duración
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const MAX_DURATION_HOURS = 12;
    if (durationHours > MAX_DURATION_HOURS || durationHours < 0.5) {
      throw new BadRequestException(
        `La duración de la reserva debe ser entre 30 minutos y ${MAX_DURATION_HOURS} horas.`
      );
    }

    const court = await this.courtModel.findById(courtId).populate('clubId').exec();
    if (!court) {
      throw new NotFoundException('La cancha especificada no existe.');
    }

    // Calcular costos
    const totalPrice = Math.round(durationHours * court.pricePerHour);
    
    // Obtener club
    const club = court.clubId as any;

    // Calcular seña dinámica según la política del club
    let depositAmount = 0;
    const depositType = club?.depositType || 'percentage';
    const depositValue = typeof club?.depositValue === 'number' ? club.depositValue : 30;

    if (depositType === 'percentage') {
      depositAmount = Math.round((totalPrice * depositValue) / 100);
    } else if (depositType === 'fixed') {
      depositAmount = Math.min(depositValue, totalPrice);
    } else {
      depositAmount = 0;
    }

    let savedReservation: ReservationDocument;

    // Intentar transacción
    const session = await this.reservationModel.db.startSession().catch(() => null);
    if (session) {
      session.startTransaction();
      try {
        const overlapping = await this.reservationModel.findOne({
          courtId: new Types.ObjectId(courtId),
          status: { $ne: 'cancelled' },
          startTime: { $lt: end },
          endTime: { $gt: start },
        }).session(session).exec();

        if (overlapping) {
          throw new ConflictException('La cancha ya está reservada en este horario.');
        }

        const newReservation = new this.reservationModel({
          courtId: new Types.ObjectId(courtId),
          startTime: start,
          endTime: end,
          totalPrice,
          depositAmount,
          firstName,
          lastName,
          email,
          phone,
          isPublic: true,
          status: 'pending',
          paymentStatus: 'pending',
        });

        savedReservation = await newReservation.save({ session });
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } else {
      // Fallback sin transacción (por si no es replica set)
      const overlapping = await this.reservationModel.findOne({
        courtId: new Types.ObjectId(courtId),
        status: { $ne: 'cancelled' },
        startTime: { $lt: end },
        endTime: { $gt: start },
      }).exec();

      if (overlapping) {
        throw new ConflictException('La cancha ya está reservada en este horario.');
      }

      const newReservation = new this.reservationModel({
        courtId: new Types.ObjectId(courtId),
        startTime: start,
        endTime: end,
        totalPrice,
        depositAmount,
        firstName,
        lastName,
        email,
        phone,
        isPublic: true,
        status: 'pending',
        paymentStatus: 'pending',
      });

      savedReservation = await newReservation.save();
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const backendUrl = this.configService.get<string>('NEXT_PUBLIC_API_URL') || 'http://localhost:3001';

    // Generar link de pago
    let initPoint = '';
    let preferenceId = '';
    let isMock = this.isMockMode;
    let confirmToken = '';

    if (depositAmount === 0) {
      // SIN SEÑA: Confirmación directa redireccionando al resultado de éxito
      preferenceId = `free_pref_${savedReservation._id}`;
      confirmToken = this.jwtService.sign({ reservationId: savedReservation._id.toString() });
      // Usaremos checkout-mock pero indicando que es gratis para autoconfirmar
      initPoint = `${frontendUrl}/reservar/checkout-mock?preference_id=${preferenceId}&reservation_id=${savedReservation._id}&free=true&token=${encodeURIComponent(confirmToken)}`;
      isMock = true;
    } else {
      // Decide client & mode
      let clubMpClient: MercadoPagoConfig | null = null;

      if (club && club.mpAccessToken && club.mpAccessToken.trim() !== '' && club.mpAccessToken !== 'placeholder') {
        try {
          clubMpClient = new MercadoPagoConfig({ accessToken: club.mpAccessToken.trim() });
          isMock = false;
          console.log(`Mercado Pago inicializado para la sede ${club.name} con token propio.`);
        } catch (err) {
          console.error(`Error al inicializar token de la sede ${club.name}. Usando global.`, err);
          clubMpClient = this.mpClient;
          isMock = this.isMockMode || !this.mpClient;
        }
      } else {
        clubMpClient = this.mpClient;
        isMock = this.isMockMode || !this.mpClient;
      }

      if (isMock || !clubMpClient) {
        // MOCK MODE: link al checkout simulado en el frontend
        preferenceId = `mock_pref_${savedReservation._id}`;
        confirmToken = this.jwtService.sign({ reservationId: savedReservation._id.toString() });
        initPoint = `${frontendUrl}/reservar/checkout-mock?preference_id=${preferenceId}&reservation_id=${savedReservation._id}&token=${encodeURIComponent(confirmToken)}`;
        isMock = true;
      } else {
        // MODO REAL: Mercado Pago
        try {
          const preference = new Preference(clubMpClient);
          const clubName = club?.name || 'Club';
          const response = await preference.create({
            body: {
              items: [
                {
                  id: savedReservation._id.toString(),
                  title: `Seña - ${court.name} en ${clubName} (${startTime.slice(0, 10)})`,
                  quantity: 1,
                  unit_price: depositAmount,
                  currency_id: 'ARS',
                },
              ],
              back_urls: {
                success: `${frontendUrl}/reservar/resultado?status=success&reservation_id=${savedReservation._id}`,
                failure: `${frontendUrl}/reservar/resultado?status=failure&reservation_id=${savedReservation._id}`,
                pending: `${frontendUrl}/reservar/resultado?status=pending&reservation_id=${savedReservation._id}`,
              },
              auto_return: 'approved',
              notification_url: `${backendUrl}/public/payments/webhook?reservation_id=${savedReservation._id}`,
              external_reference: savedReservation._id.toString(),
            },
          });
          
          initPoint = response.init_point!;
          preferenceId = response.id!;
        } catch (err) {
          console.error('Error al crear preferencia en Mercado Pago real. Fallback a MOCK.', err);
          preferenceId = `mock_pref_${savedReservation._id}`;
          confirmToken = this.jwtService.sign({ reservationId: savedReservation._id.toString() });
          initPoint = `${frontendUrl}/reservar/checkout-mock?preference_id=${preferenceId}&reservation_id=${savedReservation._id}&token=${encodeURIComponent(confirmToken)}`;
          isMock = true;
        }
      }
    }

    // Actualizar la reserva con el preferenceId
    savedReservation.preferenceId = preferenceId;
    await savedReservation.save();

    return {
      reservation: savedReservation,
      initPoint,
      isMock,
    };
  }

  async handleWebhook(body: any, reservationId?: string) {
    const isPaymentAction = 
      body.type === 'payment' || 
      body.action === 'payment.created' || 
      body.action === 'payment.updated';

    if (isPaymentAction) {
      const paymentId = body.data?.id || body.id;
      if (!paymentId) return { received: true };
      console.log(`Webhook de pago recibido: ID ${paymentId} para la reserva ${reservationId}`);

      if (reservationId) {
        try {
          const reservation = await this.reservationModel.findById(reservationId).exec();
          if (reservation) {
            // Obtener la cancha y el club para ver las credenciales
            const court = await this.courtModel.findById(reservation.courtId).populate('clubId').exec();
            const club = court?.clubId as any;

            let clubMpClient = this.mpClient;
            let isMock = this.isMockMode;

            if (club && club.mpAccessToken && club.mpAccessToken.trim() !== '' && club.mpAccessToken !== 'placeholder') {
              try {
                clubMpClient = new MercadoPagoConfig({ accessToken: club.mpAccessToken.trim() });
                isMock = false;
              } catch (err) {
                console.error(`Error al inicializar token de la sede ${club.name} para el webhook:`, err);
              }
            }

            if (!isMock && clubMpClient) {
              const payment = new Payment(clubMpClient);
              const paymentData = await payment.get({ id: String(paymentId) });
              const mpStatus = paymentData.status;

              console.log(`Estado del pago ${paymentId} obtenido de Mercado Pago para la reserva ${reservationId}: ${mpStatus}`);

              if (mpStatus === 'approved') {
                await this.confirmReservation(reservationId, String(paymentId), 'success', undefined, true);
              } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
                await this.confirmReservation(reservationId, String(paymentId), 'failure', undefined, true);
              }
            }
          }
        } catch (err) {
          console.error(`Error al procesar webhook de pago ${paymentId} para la reserva ${reservationId}:`, err);
        }
      }
    }
    return { received: true };
  }

  async confirmReservation(
    reservationId: string,
    paymentId: string,
    status: string,
    token?: string,
    isInternal = false,
  ) {
    if (!Types.ObjectId.isValid(reservationId)) {
      throw new BadRequestException('ID de reserva no válido.');
    }

    const reservation = await this.reservationModel.findById(reservationId).exec();
    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada.');
    }

    // Validar token si la llamada es externa (pública)
    if (!isInternal) {
      if (!token) {
        throw new BadRequestException('Se requiere un token de confirmación.');
      }
      try {
        const payload = this.jwtService.verify(token);
        if (payload.reservationId !== reservationId) {
          throw new BadRequestException('El token no corresponde a esta reserva.');
        }
      } catch (err) {
        throw new BadRequestException('Token de confirmación inválido o expirado.');
      }
    }

    if (status === 'success' || status === 'approved') {
      reservation.status = 'confirmed';
      reservation.paymentStatus = 'paid';
      reservation.paymentId = paymentId;
      await reservation.save();
      console.log(`Reserva ${reservationId} confirmada exitosamente con el pago ${paymentId}`);

      // Enviar email de confirmación
      try {
        const populated = await this.reservationModel.findById(reservation._id)
          .populate({
            path: 'courtId',
            populate: { path: 'clubId' }
          })
          .exec();

        if (populated) {
          const courtName = (populated.courtId as any)?.name || 'Cancha';
          const sport = (populated.courtId as any)?.sport || '';
          const clubName = (populated.courtId as any)?.clubId?.name || 'Club';
          
          const dateStr = populated.startTime.toLocaleDateString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          
          const timeStr = populated.startTime.toLocaleTimeString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour: '2-digit',
            minute: '2-digit',
          });

          const durationHours = (populated.endTime.getTime() - populated.startTime.getTime()) / (1000 * 60 * 60);
          const toEmail = populated.email || 'info@reservate.com';
          const customerName = populated.firstName ? `${populated.firstName} ${populated.lastName}` : 'Jugador';

          await this.notificationsService.sendReservationConfirmation(toEmail, customerName, {
            id: populated._id.toString(),
            clubName,
            courtName,
            sport,
            date: dateStr,
            time: timeStr,
            duration: durationHours,
            totalPrice: populated.totalPrice,
            depositAmount: populated.depositAmount,
          });

          // Enviar WhatsApp de confirmación
          if (populated.phone && populated.phone.trim() !== '') {
            try {
              const waMessage = `¡Hola ${customerName}! 🎾
Tu reserva en *${clubName}* ha sido confirmada con éxito.

*Detalles del turno:*
📅 Fecha: ${dateStr}
⏰ Hora: ${timeStr} (${durationHours} hs)
🏟️ Cancha: ${courtName} (${sport.toUpperCase()})
💵 Total: $${populated.totalPrice}
💰 Seña abonada: $${populated.depositAmount}

¡Te esperamos para jugar! 🚀`;
              
              await this.whatsappService.sendConfirmation(populated.phone, waMessage);
            } catch (waErr) {
              console.error('Error al preparar o enviar WhatsApp de confirmación:', waErr);
            }
          }
        }
      } catch (emailErr) {
        console.error('Error al preparar o enviar email de confirmación:', emailErr);
      }
    } else if (status === 'failure' || status === 'rejected') {
      reservation.status = 'cancelled';
      await reservation.save();
      console.log(`Reserva ${reservationId} cancelada por pago fallido.`);
    }

    return reservation;
  }
}
