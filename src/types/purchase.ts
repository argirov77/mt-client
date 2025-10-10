export type PurchaseStatus = "pending" | "paid" | "canceled" | "expired" | string;

export type PurchaseSummary = {
  id: number | string;
  status: PurchaseStatus;
  created_at: string;
  amount_due: number;
  currency: string;
  deadline?: string | null;
};

export type PurchasePassenger = {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type PurchaseCustomer = {
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type PurchaseSegment = {
  stop_id: number | string;
  stop_name: string;
  time: string;
  is_departure: boolean;
  is_arrival: boolean;
};

export type PurchaseTour = {
  id: number | string;
  date: string;
  route_id?: number | string;
  route_name?: string;
};

export type PurchaseTicket = {
  id: number | string;
  passenger_id: number | string;
  status: PurchaseStatus;
  seat_id?: number | string | null;
  seat_num?: number | string | null;
  extra_baggage?: number | null;
  tour: PurchaseTour;
  segments: PurchaseSegment[];
  route?: {
    id?: number | string;
    name?: string;
    stops?: Array<{
      id: number | string;
      order?: number;
      name: string;
      arrival_time?: string | null;
      departure_time?: string | null;
      description?: string | null;
    }>;
  };
  pricing?: {
    price?: number | null;
    currency?: string | null;
  };
  segment_details?: {
    departure?: {
      id?: number | string;
      name?: string;
      order?: number;
      time?: string;
    } | null;
    arrival?: {
      id?: number | string;
      name?: string;
      order?: number;
      time?: string;
    } | null;
    intermediate_stops?: Array<{
      id?: number | string;
      name?: string;
      order?: number;
      arrival_time?: string | null;
      departure_time?: string | null;
    }>;
    duration_minutes?: number | null;
    duration_human?: string | null;
  };
};

export type PurchaseTrip = {
  direction: "outbound" | "return";
  tickets: Array<PurchaseTicket["id"]>;
};

export type PurchaseTotals = {
  paid: number;
  due: number;
  refundable_now?: number;
  baggage_count: number;
  pax_count: number;
};

export type PurchaseHistoryEvent = {
  id?: string | number;
  date: string;
  category: string;
  amount?: number | null;
  currency?: string | null;
  method?: string | null;
  comment?: string | null;
};

export type PurchaseView = {
  purchase: PurchaseSummary;
  passengers: PurchasePassenger[];
  tickets: PurchaseTicket[];
  trips: PurchaseTrip[];
  totals: PurchaseTotals;
  history?: PurchaseHistoryEvent[];
  customer?: PurchaseCustomer | null;
};

export type CancelPreview = {
  total_refund: number;
  currency: string;
};

export type BaggageQuote = {
  can_apply: boolean;
  delta: number;
  currency: string;
  breakdown?: Array<{
    ticket_id: number | string;
    old?: number | null;
    new?: number | null;
    delta?: number | null;
  }>;
};
