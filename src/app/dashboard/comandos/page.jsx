import { auth } from "../../../../auth.js";
import { redirect } from "next/navigation";
import ComandosClient from "./ComandosClient.jsx";

export default async function ComandosPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (!session.isServerAdmin) redirect("/dashboard");

  return <ComandosClient />;
}
