export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type RoomType = 'standard' | 'deluxe' | 'cottage' | 'dormitory';
export type Floor = 'ground' | 'first' | 'cottage';
export type ProofType = 'aadhar' | 'pan' | 'driving_license';
export type BookingStatus = 'checked_in' | 'checked_out' | 'cancelled' | 'reserved';
export type PaymentMethod = 'cash' | 'qr' | 'mixed';

export interface Room {
  id: string;
  room_number: string;
  floor: Floor;
  room_type: RoomType;
  max_occupancy: number;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  name: string;
  address: string;
  proof_type: ProofType | null;
  proof_number: string | null;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  room_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string | null;
  actual_check_in_time?: string | null;
  actual_check_out_time?: string | null;
  number_of_guests: number;
  base_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  qr_amount: number;
  cash_amount: number;
  extended_amount: number;
  cancellation_charge: number;
  refund_amount: number;
  cancelled_at: string | null;
  gstin?: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  room?: Room;
  guest?: Guest;
}

export interface RoomStatusLog {
  id: string;
  room_id: string;
  booking_id: string | null;
  status: RoomStatus;
  cleaned_at: string | null;
  notes?: string;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface CheckInFormData {
  guestName: string;
  address: string;
  proofType: ProofType;
  proofNumber: string;
  phone?: string;
  email?: string;
  gstin?: string;
  numberOfGuests: number;
  checkInDate: string;
  checkOutDate?: string;
  baseAmount: number;
  gstRate: number;
  qrAmount: number;
  cashAmount: number;
}

