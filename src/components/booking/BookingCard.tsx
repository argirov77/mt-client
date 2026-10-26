"use client";

import BookingFlow from "@/components/booking/BookingFlow";

type Props = {
  forcedFromId?: number;
  forcedToId?: number;
  onFlowChange?: (active: boolean) => void;
};

export default function BookingCard({ forcedFromId, forcedToId, onFlowChange }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <BookingFlow forcedFromId={forcedFromId} forcedToId={forcedToId} onFlowChange={onFlowChange} />
    </div>
  );
}
