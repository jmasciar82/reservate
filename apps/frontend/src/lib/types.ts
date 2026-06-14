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
  subdomain?: string;
  customDomain?: string;
}

export interface Court {
  _id: string;
  name: string;
  sport: string;
  clubId: string;
  isActive: boolean;
  isCovered: boolean;
  pricePerHour: number;
  capacity?: number;
  isAvailable?: boolean;
}

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "pending" | "paid";

export interface ReservationStudent {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  paidAbono?: boolean;
}

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
  isLastOfSeries?: boolean;
  paymentDate?: string | Date;
  reservationType?: string;
  teacherId?: string | Teacher | null;
  teacherPrice?: number;
  students?: ReservationStudent[];
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Teacher {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  pricePerHour: number;
  sport: string;
  isActive: boolean;
  clubId: string;
  availability?: AvailabilitySlot[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  icon?: string;
  isActive: boolean;
  clubId: string;
  createdAt?: string;
  updatedAt?: string;
}

