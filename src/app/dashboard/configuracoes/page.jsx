import { auth } from "../../../../auth.js";
import { redirect } from "next/navigation";
import ConfiguracoesClient from "./ConfiguracoesClient.jsx";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (!session.isServerAdmin) redirect("/dashboard");

  return <ConfiguracoesClient />;
}
