import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

// Redirects to the new /regalos module
export default async function ListaDeseosRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/eventos/${id}/regalos`);
}
