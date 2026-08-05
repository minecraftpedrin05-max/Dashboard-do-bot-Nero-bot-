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
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.name || !body.title) {
    return Response.json({ error: "Nome e título são obrigatórios" }, { status: 400 });
  }

  let id = body.id;
  if (id) {
    updateModal(id, body);
  } else {
    id = createModal(session.userGuild, body);
  }
  setModalFields(id, body.fields || []);

  return Response.json({ ok: true, id });
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id obrigatório" }, { status: 400 });

  deleteModal(id);
  return Response.json({ ok: true });
}
