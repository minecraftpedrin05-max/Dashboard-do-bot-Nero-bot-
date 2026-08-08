import { auth } from "../../../../auth.js";
import { getActivityLog, getActivityLogAll } from "../../../lib/db.js";

const GUILD_ID = process.env.DISCORD_GUILD_ID;

function toCsv(rows) {
  const header = "data,tipo,quem_fez,alvo,detalhe";
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = rows.map((r) =>
    [new Date(r.created_at).toISOString(), r.type, r.actor_tag, r.target_tag, r.detail].map(esc).join(",")
  );
  return [header, ...lines].join("\n");
}

export async function GET(req) {
  const session = await auth();
  if (!session?.isServerAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const q = searchParams.get("q") || undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const exportCsv = searchParams.get("export") === "csv";

  try {
    if (exportCsv) {
      const rows = getActivityLogAll(GUILD_ID, { type, q });
      const csv = toCsv(rows);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="logs.csv"`,
        },
      });
    }

    const result = getActivityLog(GUILD_ID, { type, q, page, pageSize: 25 });
    return Response.json(result);
  } catch (err) {
    console.error("[api/logs] erro:", err);
    return Response.json({ error: "Não foi possível carregar os logs" }, { status: 500 });
  }
}
