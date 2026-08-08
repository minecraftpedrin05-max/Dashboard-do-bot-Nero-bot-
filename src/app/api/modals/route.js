import { auth } from "../../../../auth.js";
import {
  listModals,
  createModal,
  updateModal,
  deleteModal,
  listModalFields,
  setModalFields,
} from "../../../lib/db.js";

async function requireAdmin() {
  const session = await auth();
  if (!session?.isServerAdmin || !session?.userGuild) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const modals = listModals(session.userGuild).map((m) => ({ ...m, fields: listModalFields(m.id) }));
  return Response.json({ modals });
}

export async function POST(req) {
  const session = await requireAdmin();
  if (session === null) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.name || !body.title) {
    return Response.json({ error: "Nome e título são obrigatórios" }, { status: 400 });
  }

  try {
    let id = body.id;
    if (id) {
      updateModal(id, body);
    } else {
      id = createModal(session.userGuild, body);
    }
    setModalFields(id, body.fields || []);
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[api/modals] erro ao salvar:", err);
    return Response.json({ error: "Não foi possível salvar o formulário" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (session === null) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id obrigatório" }, { status: 400 });

  try {
    deleteModal(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/modals] erro ao excluir:", err);
    return Response.json({ error: "Não foi possível excluir o formulário" }, { status: 500 });
  }
}
