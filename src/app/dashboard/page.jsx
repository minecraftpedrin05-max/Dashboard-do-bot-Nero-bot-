import { auth } from "../../../auth.js";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient.jsx";
import AccessDeniedActions from "./AccessDeniedActions.jsx";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");

  if (!session.isServerAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold mb-2">Sem acesso</p>
          <p className="text-muted">
            {session.user?.name ? `A conta ${session.user.name}` : "Sua conta"} não tem permissão de administrador
            nesse servidor.
          </p>
          <AccessDeniedActions />
        </div>
      </main>
    );
  }

  return <DashboardClient userName={session.user?.name} />;
}
