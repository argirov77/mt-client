export type TicketStatus = "pending" | "paid" | "canceled";

export type TicketSegment = {
  fromName: string;
  toName: string;
  date: string;
  departure_time: string;
  arrival_time: string;
  seatNumbers: number[];
  extraBaggage: boolean[];
};

export type ElectronicTicketPassenger = {
  name: string;
  seatOutbound: number | null;
  seatReturn: number | null;
  extraBaggageOutbound: boolean;
  extraBaggageReturn: boolean;
};

export type ElectronicTicketData = {
  ticketNumber: string;
  purchaseId: number;
  action: "book" | "purchase";
  total: number;
  createdAt: string;
  status: TicketStatus;
  contact: {
    phone: string;
    email: string;
  };
  outbound: TicketSegment | null | undefined;
  inbound?: TicketSegment | null;
  passengers: ElectronicTicketPassenger[];
};
