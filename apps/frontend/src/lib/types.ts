export interface Club {
  _id: string;
  name: string;
  location?: string;
  sports?: string[];
  description?: string;
  bookingEnabled?: boolean;
  depositType?: "percentage" | "fixed" | "none";
  depositValue?: number;
  mpAccessToken?: string;
  mpPublicKey?: string;
}

export interface Court {
  _id: string;
  name: string;
  sport: string;
  clubId: string;
  isActive: boolean;
  isCovered: boolean;
  pricePerHour: number;
  isAvailable?: boolean;
}

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "pending" | "paid";

export interface Reservation {
  _id: string;
  courtId?: Court | null;
  userId?: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isPublic?: boolean;
  depositAmount?: number;
  isRecurring?: boolean;
  recurrenceGroupId?: string;
}
