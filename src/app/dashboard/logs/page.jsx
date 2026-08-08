import { auth } from "../../../../auth.js";
import { redirect } from "next/navigation";
import LogsClient from "./LogsClient.jsx";

export default async function LogsPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (!session.isServerAdmin) redirect("/dashboard");

  return <LogsClient />;
}
