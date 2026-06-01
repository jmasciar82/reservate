import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { Court, CourtDocument } from '../courts/schemas/court.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  async getStats(clubId: string, range: string) {
    if (!Types.ObjectId.isValid(clubId)) {
      return this.emptyStats();
    }

    // 1. Calcular rango de fechas
    const startDate = new Date();
    let daysCount = 30;

    if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
      daysCount = 7;
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
      daysCount = 30;
    } else if (range === '12m') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      daysCount = 365;
    } else {
      startDate.setDate(startDate.getDate() - 30);
      daysCount = 30;
    }

    // 2. Buscar canchas de la sede
    const courts = await this.courtModel.find({ clubId: new Types.ObjectId(clubId) }).exec();
    const courtIds = courts.map((c) => c._id);

    if (courtIds.length === 0) {
      return this.emptyStats();
    }

    // 3. Buscar reservas activas en ese rango
    const reservations = await this.reservationModel
      .find({
        courtId: { $in: courtIds },
        startTime: { $gte: startDate },
        status: { $ne: 'cancelled' },
      })
      .populate('courtId')
      .exec();

    // 4. Ocupación por cancha
    const courtStatsMap = new Map<string, { name: string; sport: string; count: number; hours: number }>();
    courts.forEach((c) => {
      courtStatsMap.set(c._id.toString(), { name: c.name, sport: c.sport, count: 0, hours: 0 });
    });

    let totalReservedHours = 0;

    reservations.forEach((r) => {
      const cid = r.courtId?._id?.toString() || (r.courtId as any)?.toString();
      if (cid && courtStatsMap.has(cid)) {
        const val = courtStatsMap.get(cid)!;
        val.count++;
        const duration = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60 * 60);
        val.hours += duration;
        totalReservedHours += duration;
      }
    });

    // 14 horas operativas por día (de 8 a 22)
    const availableHoursPerCourt = 14 * daysCount;
    const occupancyByCourt = Array.from(courtStatsMap.values()).map((c) => {
      const occupancyRate = availableHoursPerCourt > 0 
        ? Math.min(100, Math.round((c.hours / availableHoursPerCourt) * 100))
        : 0;

      return {
        name: c.name,
        sport: c.sport,
        count: c.count,
        occupancyRate,
      };
    });

    // 5. Ocupación por deporte
    const sportStatsMap = new Map<string, number>();
    reservations.forEach((r) => {
      const sport = (r.courtId as any)?.sport || 'padel';
      sportStatsMap.set(sport, (sportStatsMap.get(sport) || 0) + 1);
    });
    const occupancyBySport = Array.from(sportStatsMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // 6. Horarios Pico
    const hourStatsMap = new Map<number, number>();
    for (let h = 8; h <= 22; h++) {
      hourStatsMap.set(h, 0);
    }

    reservations.forEach((r) => {
      const startHour = new Date(r.startTime).getHours();
      if (startHour >= 8 && startHour <= 22) {
        hourStatsMap.set(startHour, (hourStatsMap.get(startHour) || 0) + 1);
      }
    });

    const peakHours = Array.from(hourStatsMap.entries())
      .map(([hour, count]) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        count,
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    // 7. Tendencia de Ingresos
    const trendMap = new Map<string, { dateLabel: string; revenue: number; deposits: number }>();

    if (range === '7d' || range === '30d') {
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        const key = d.toISOString().slice(0, 10);
        trendMap.set(key, { dateLabel: label, revenue: 0, deposits: 0 });
      }

      reservations.forEach((r) => {
        const key = new Date(r.startTime).toISOString().slice(0, 10);
        if (trendMap.has(key)) {
          const val = trendMap.get(key)!;
          val.revenue += r.totalPrice || 0;
          if (r.paymentStatus === 'paid') {
            val.deposits += r.depositAmount || 0;
          }
        }
      });
    } else {
      // 12 meses
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        trendMap.set(key, { dateLabel: label, revenue: 0, deposits: 0 });
      }

      reservations.forEach((r) => {
        const d = new Date(r.startTime);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (trendMap.has(key)) {
          const val = trendMap.get(key)!;
          val.revenue += r.totalPrice || 0;
          if (r.paymentStatus === 'paid') {
            val.deposits += r.depositAmount || 0;
          }
        }
      });
    }

    const revenueTrend = Array.from(trendMap.values()).map((val) => ({
      label: val.dateLabel,
      revenue: val.revenue,
      deposits: val.deposits,
    }));

    // 8. Relación de pagos e Ingresos por Canchas vs Productos
    let paidOnline = 0;
    let pendingAtFrontDesk = 0;
    let totalRevenue = 0;
    let courtRevenue = 0;
    let productsRevenue = 0;

    // Mapa para el ranking de productos
    const productSalesMap = new Map<string, { quantity: number; revenue: number }>();

    reservations.forEach((r) => {
      totalRevenue += r.totalPrice || 0;
      const rProductsPrice = (r as any).productsPrice || 0;
      productsRevenue += rProductsPrice;
      courtRevenue += ((r.totalPrice || 0) - rProductsPrice);

      if (r.paymentStatus === 'paid') {
        paidOnline += r.depositAmount || 0;
        pendingAtFrontDesk += (r.totalPrice - r.depositAmount) || 0;
      } else {
        pendingAtFrontDesk += r.totalPrice || 0;
      }

      // Procesar productos/extras de esta reserva
      const rProducts = (r as any).products || [];
      if (Array.isArray(rProducts)) {
        rProducts.forEach((p: any) => {
          if (p && p.name) {
            const pName = p.name.trim();
            const pQty = p.quantity || 0;
            const pPrice = p.price || 0;
            const pRev = pQty * pPrice;

            const existing = productSalesMap.get(pName) || { quantity: 0, revenue: 0 };
            productSalesMap.set(pName, {
              quantity: existing.quantity + pQty,
              revenue: existing.revenue + pRev,
            });
          }
        });
      }
    });

    const paymentBreakdown = {
      totalRevenue,
      paidOnline,
      pendingAtFrontDesk,
      courtRevenue,
      productsRevenue,
    };

    // Compilar y ordenar el Top 5 productos
    const topProducts = Array.from(productSalesMap.entries())
      .map(([name, val]) => ({
        name,
        quantity: val.quantity,
        revenue: val.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // KPIs generales
    const totalAvailableHours = 14 * daysCount * courts.length;
    const averageOccupancy = totalAvailableHours > 0 
      ? Math.min(100, Math.round((totalReservedHours / totalAvailableHours) * 100))
      : 0;

    return {
      averageOccupancy,
      totalReservations: reservations.length,
      revenueTrend,
      paymentBreakdown,
      occupancyByCourt,
      occupancyBySport,
      peakHours,
      topProducts,
    };
  }

  private emptyStats() {
    return {
      averageOccupancy: 0,
      totalReservations: 0,
      revenueTrend: [],
      paymentBreakdown: {
        totalRevenue: 0,
        paidOnline: 0,
        pendingAtFrontDesk: 0,
        courtRevenue: 0,
        productsRevenue: 0,
      },
      occupancyByCourt: [],
      occupancyBySport: [],
      peakHours: [],
      topProducts: [],
    };
  }
}
