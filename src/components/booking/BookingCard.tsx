"use client";

import BookingFlow from "@/components/booking/BookingFlow";

type Props = {
  forcedFromId?: number;
  forcedToId?: number;
};

export default function BookingCard({ forcedFromId, forcedToId }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <BookingFlow forcedFromId={forcedFromId} forcedToId={forcedToId} />
    </div>
  );
}
