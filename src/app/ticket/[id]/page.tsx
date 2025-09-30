import TicketClient from "@/components/ticket/TicketClient";

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;

  return <TicketClient ticketId={id} />;
}
