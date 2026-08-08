import { auth } from "../../../../auth.js";
import {
  listCommands,
  getCommandByName,
  createCommand,
  updateCommand,
  deleteCommand,
  listCommandButtons,
  setCommandButtons,
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

  const commands = listCommands(session.userGuild).map((c) => ({
    ...c,
    buttons: listCommandButtons(c.id).map((b) => ({
      ...b,
      options: b.options_json ? JSON.parse(b.options_json) : [],
      ticket_container: b.ticket_container_json ? JSON.parse(b.ticket_container_json) : null,
    })),
  }));
  return Response.json({ commands });
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.name) {
    return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  // nomes de comando no Discord: minúsculo, sem espaço
  const cleanName = body.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!cleanName) {
    return Response.json({ error: "Nome inválido" }, { status: 400 });
  }

  try {
    const existing = getCommandByName(session.userGuild, cleanName);
    if (existing && existing.id !== body.id) {
      return Response.json({ error: "Já existe um comando com esse nome" }, { status: 400 });
    }

    let id = body.id;
    const data = { ...body, name: cleanName };
    if (id) {
      updateCommand(id, data);
    } else {
      id = createCommand(session.userGuild, data);
    }
    setCommandButtons(id, body.buttons || []);

    return Response.json({ ok: true, id, name: cleanName });
  } catch (err) {
    console.error("[api/commands] erro ao salvar:", err);
    return Response.json({ error: "Não foi possível salvar o comando" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id obrigatório" }, { status: 400 });

  try {
    deleteCommand(id);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/commands] erro ao excluir:", err);
    return Response.json({ error: "Não foi possível excluir o comando" }, { status: 500 });
  }
}
