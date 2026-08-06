"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import NavDrawer from "../NavDrawer.jsx";

function slugKey(v) {
  return v
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function emptyModal() {
  return { id: null, name: "", title: "", output_template: "", fields: [] };
}

function emptyCommand() {
  return {
    id: null,
    name: "",
    description: "",
    title: "",
    body_text: "",
    image_url: "",
    color: "#5865F2",
    buttons: [],
  };
}

function Card({ children }) {
  return <div className="bg-surface border border-border rounded-2xl p-5 mb-4">{children}</div>;
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm font-mono";

function ModalEditor({ modal, onChange, onSave, onDelete, saving }) {
  function updateField(i, patch) {
    const fields = modal.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f));
    onChange({ ...modal, fields });
  }

  function addField() {
    onChange({
      ...modal,
      fields: [...modal.fields, { field_key: "", label: "", style: "short", required: true }],
    });
  }

  function removeField(i) {
    onChange({ ...modal, fields: modal.fields.filter((_, idx) => idx !== i) });
  }

  return (
    <Card>
      <Field label="Nome interno do formulário">
        <input
          className={inputClass}
          value={modal.name}
          onChange={(e) => onChange({ ...modal, name: e.target.value })}
          placeholder="ex: anuncio"
        />
      </Field>
      <Field label="Título que aparece no formulário (janela)">
        <input
          className={inputClass}
          value={modal.title}
          onChange={(e) => onChange({ ...modal, title: e.target.value })}
          placeholder="ex: Criar anúncio"
        />
      </Field>

      <p className="text-sm text-muted mb-2">Campos do formulário</p>
      {modal.fields.map((f, i) => (
        <div key={i} className="border border-border rounded-lg p-3 mb-2">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              className={inputClass}
              value={f.field_key}
              onChange={(e) => updateField(i, { field_key: slugKey(e.target.value) })}
              placeholder="chave (ex: titulo)"
            />
            <input
              className={inputClass}
              value={f.label}
              onChange={(e) => updateField(i, { label: e.target.value })}
              placeholder="rótulo (ex: Título)"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              className={inputClass + " w-auto"}
              value={f.style}
              onChange={(e) => updateField(i, { style: e.target.value })}
            >
              <option value="short">Linha única</option>
              <option value="paragraph">Parágrafo</option>
            </select>
            <label className="text-sm text-muted flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={!!f.required}
                onChange={(e) => updateField(i, { required: e.target.checked })}
              />
              obrigatório
            </label>
            <button
              type="button"
              onClick={() => removeField(i)}
              className="text-sm text-danger ml-auto"
            >
              remover
            </button>
          </div>
          {f.field_key && (
            <p className="text-xs text-muted mt-2 font-mono">
              use {"{" + f.field_key + "}"} no texto de saída pra mostrar o que a pessoa preencheu aqui
            </p>
          )}
        </div>
      ))}
      <button type="button" onClick={addField} className="text-sm text-accent mb-4">
        + adicionar campo
      </button>

      <Field label="Texto que o bot envia depois que a pessoa preenche o formulário">
        <textarea
          className={inputClass}
          rows={4}
          value={modal.output_template}
          onChange={(e) => onChange({ ...modal, output_template: e.target.value })}
          placeholder={"ex: 📢 **{titulo}**\\n{descricao}"}
        />
      </Field>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="text-sm bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition"
        >
          {saving ? "salvando…" : "Salvar formulário"}
        </button>
        {modal.id && (
          <button type="button" onClick={onDelete} className="text-sm text-danger px-4 py-2">
            Excluir
          </button>
        )}
      </div>
    </Card>
  );
}

const STYLE_LOOK = {
  Primary: "bg-[#5865F2] text-white",
  Secondary: "bg-[#4E5058] text-white",
  Success: "bg-[#248046] text-white",
  Danger: "bg-[#DA373C] text-white",
};

function CommandPreview({ command }) {
  const botName = process.env.NEXT_PUBLIC_BOT_NAME || "Meu Bot";
  const normalButtons = command.buttons.filter((b) => b.action_type !== "select");
  const selectMenus = command.buttons.filter((b) => b.action_type === "select");

  return (
    <div className="bg-[#313338] rounded-2xl p-4 sticky top-4">
      <p className="text-xs text-muted mb-3 font-mono">
        preview — como vai aparecer no Discord {command.is_public === false ? "🔒 (só quem usou vê)" : "🌐 (todo mundo vê)"}
      </p>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-display font-bold shrink-0">
          {botName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[#F2F3F5] font-semibold text-sm">{botName}</span>
            <span className="bg-accent text-white text-[10px] font-semibold px-1.5 py-[1px] rounded">BOT</span>
            <span className="text-[#949BA4] text-xs">agora</span>
          </div>

          {(command.title || command.body_text || command.image_url) && (
            <div
              className="mt-1.5 rounded bg-[#2B2D31] pl-3 pr-4 py-3 border-l-4 max-w-sm"
              style={{ borderColor: command.color || "#5865F2" }}
            >
              {command.title && <p className="text-[#F2F3F5] font-semibold text-sm mb-1">{command.title}</p>}
              {command.body_text && (
                <p className="text-[#DBDEE1] text-sm whitespace-pre-wrap">{command.body_text}</p>
              )}
              {command.image_url && (
                <img
                  src={command.image_url}
                  alt=""
                  className="mt-2 rounded max-h-40 object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
            </div>
          )}

          {normalButtons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 max-w-sm">
              {normalButtons.map((b, i) => (
                <span
                  key={i}
                  className={`text-xs font-medium px-3 py-1.5 rounded ${STYLE_LOOK[b.style] || STYLE_LOOK.Primary} ${
                    b.action_type === "link" ? "opacity-90" : ""
                  }`}
                >
                  {b.label || "botão"} {b.action_type === "link" ? "↗" : ""}
                </span>
              ))}
            </div>
          )}

          {selectMenus.map((s, i) => (
            <div key={i} className="mt-2 max-w-sm">
              <div className="bg-[#383A40] border border-black/20 rounded px-3 py-2 flex items-center justify-between text-sm text-[#DBDEE1]">
                <span>{s.label || "Escolha uma opção"}</span>
                <span className="text-[#949BA4]">▾</span>
              </div>
              <p className="text-[10px] text-[#949BA4] mt-0.5">
                {s.multi ? "pode escolher várias opções" : "escolhe só uma opção"} · {(s.options || []).length} opç
                {(s.options || []).length === 1 ? "ão" : "ões"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommandEditor({ command, modals, onChange, onSave, onDelete, saving }) {
  function updateButton(i, patch) {
    const buttons = command.buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
    onChange({ ...command, buttons });
  }

  function addButton() {
    onChange({
      ...command,
      buttons: [...command.buttons, { label: "", style: "Primary", action_type: "modal", modal_id: "", url: "" }],
    });
  }

  function removeButton(i) {
    onChange({ ...command, buttons: command.buttons.filter((_, idx) => idx !== i) });
  }

  return (
    <Card>
      <Field label="Nome do comando (vira /comando nome:isso)">
        <input
          className={inputClass}
          value={command.name}
          onChange={(e) => onChange({ ...command, name: e.target.value })}
          placeholder="ex: anuncio"
        />
      </Field>
      <Field label="Descrição (só pra você lembrar pra que serve)">
        <input
          className={inputClass}
          value={command.description}
          onChange={(e) => onChange({ ...command, description: e.target.value })}
        />
      </Field>
      <Field label="Título da mensagem">
        <input
          className={inputClass}
          value={command.title}
          onChange={(e) => onChange({ ...command, title: e.target.value })}
        />
      </Field>
      <Field label="Texto da mensagem">
        <textarea
          className={inputClass}
          rows={3}
          value={command.body_text}
          onChange={(e) => onChange({ ...command, body_text: e.target.value })}
        />
      </Field>
      <Field label="URL da imagem (opcional — sobe uma imagem em algum lugar tipo imgur e cola o link aqui)">
        <input
          className={inputClass}
          value={command.image_url || ""}
          onChange={(e) => onChange({ ...command, image_url: e.target.value })}
          placeholder="https://..."
        />
      </Field>
      <Field label="Cor">
        <input
          type="color"
          className="h-9 w-16 bg-bg border border-border rounded-lg"
          value={command.color || "#5865F2"}
          onChange={(e) => onChange({ ...command, color: e.target.value })}
        />
      </Field>

      <Field label="Quem vê a resposta">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...command, is_public: true })}
            className={`text-sm rounded-lg px-3 py-1.5 border transition ${
              command.is_public !== false
                ? "bg-accent border-accent text-white font-semibold"
                : "border-border text-muted hover:text-ink"
            }`}
          >
            🌐 Todo mundo vê
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...command, is_public: false })}
            className={`text-sm rounded-lg px-3 py-1.5 border transition ${
              command.is_public === false
                ? "bg-accent border-accent text-white font-semibold"
                : "border-border text-muted hover:text-ink"
            }`}
          >
            🔒 Só quem usou
          </button>
        </div>
      </Field>

      <p className="text-sm text-muted mb-2">Botões</p>
      {command.buttons.map((b, i) => (
        <div key={i} className="border border-border rounded-lg p-3 mb-2">
          <div className={b.action_type === "select" ? "mb-2" : "grid grid-cols-2 gap-2 mb-2"}>
            <input
              className={inputClass}
              value={b.label}
              onChange={(e) => updateButton(i, { label: e.target.value })}
              placeholder={b.action_type === "select" ? "texto do placeholder (ex: Escolha uma opção)" : "texto do botão"}
            />
            {b.action_type !== "select" && (
              <select
                className={inputClass}
                value={b.style}
                onChange={(e) => updateButton(i, { style: e.target.value })}
              >
                <option value="Primary">Azul</option>
                <option value="Secondary">Cinza</option>
                <option value="Success">Verde</option>
                <option value="Danger">Vermelho</option>
              </select>
            )}
          </div>
          <div className="flex gap-2 mb-2">
            <select
              className={inputClass + " w-auto"}
              value={b.action_type}
              onChange={(e) => updateButton(i, { action_type: e.target.value })}
            >
              <option value="modal">Abrir formulário</option>
              <option value="link">Abrir link</option>
              <option value="select">Menu de seleção</option>
            </select>
            {b.action_type === "modal" && (
              <select
                className={inputClass}
                value={b.modal_id || ""}
                onChange={(e) => updateButton(i, { modal_id: e.target.value })}
              >
                <option value="">selecione um formulário</option>
                {modals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            {b.action_type === "link" && (
              <input
                className={inputClass}
                value={b.url || ""}
                onChange={(e) => updateButton(i, { url: e.target.value })}
                placeholder="https://..."
              />
            )}
          </div>

          {b.action_type === "select" && (
            <div className="bg-bg border border-border rounded-lg p-3 mb-2">
              <p className="text-xs text-muted mb-2">Opções do menu</p>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => updateButton(i, { multi: false })}
                  className={`text-xs rounded-lg px-2.5 py-1 border transition ${
                    !b.multi ? "bg-accent border-accent text-white font-semibold" : "border-border text-muted"
                  }`}
                >
                  escolhe só 1
                </button>
                <button
                  type="button"
                  onClick={() => updateButton(i, { multi: true })}
                  className={`text-xs rounded-lg px-2.5 py-1 border transition ${
                    b.multi ? "bg-accent border-accent text-white font-semibold" : "border-border text-muted"
                  }`}
                >
                  pode escolher várias
                </button>
              </div>
              {(b.options || []).map((opt, oi) => (
                <div key={oi} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-1.5">
                  <input
                    className={inputClass}
                    value={opt.label}
                    onChange={(e) => {
                      const options = [...(b.options || [])];
                      options[oi] = { ...options[oi], label: e.target.value };
                      updateButton(i, { options });
                    }}
                    placeholder="texto (ex: Vermelho)"
                  />
                  <input
                    className={inputClass}
                    value={opt.description || ""}
                    onChange={(e) => {
                      const options = [...(b.options || [])];
                      options[oi] = { ...options[oi], description: e.target.value };
                      updateButton(i, { options });
                    }}
                    placeholder="descrição (opcional)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const options = (b.options || []).filter((_, idx) => idx !== oi);
                      updateButton(i, { options });
                    }}
                    className="text-danger text-sm px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateButton(i, { options: [...(b.options || []), { label: "", description: "" }] })}
                className="text-xs text-accent mt-1"
              >
                + adicionar opção
              </button>

              <label className="block mt-3">
                <span className="block text-xs text-muted mb-1">
                  Mensagem enviada depois de escolher (use {"{selecionado}"} pra mostrar a opção)
                </span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={b.output_template || ""}
                  onChange={(e) => updateButton(i, { output_template: e.target.value })}
                  placeholder="Você escolheu: {selecionado}"
                />
              </label>
            </div>
          )}

          <button type="button" onClick={() => removeButton(i)} className="text-sm text-danger">
            remover botão
          </button>
        </div>
      ))}
      <button type="button" onClick={addButton} className="text-sm text-accent mb-4">
        + adicionar botão
      </button>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="text-sm bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2 transition"
        >
          {saving ? "salvando…" : "Salvar comando"}
        </button>
        {command.id && (
          <button type="button" onClick={onDelete} className="text-sm text-danger px-4 py-2">
            Excluir
          </button>
        )}
      </div>
    </Card>
  );
}

export default function ComandosClient() {
  const { data: session } = useSession();
  const [modals, setModals] = useState([]);
  const [commands, setCommands] = useState([]);
  const [editingModal, setEditingModal] = useState(null);
  const [editingCommand, setEditingCommand] = useState(null);
  const [savingModal, setSavingModal] = useState(false);
  const [savingCommand, setSavingCommand] = useState(false);
  const [error, setError] = useState(null);
  const [deployingCommands, setDeployingCommands] = useState(false);
  const [deployMessage, setDeployMessage] = useState(null);
  const [loaded, setLoaded] = useState(false);

  if (!session?.userGuild) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
        <header className="mb-10">
          <Link href="/dashboard" className="text-sm text-muted">
            ← voltar
          </Link>
        </header>
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <h1 className="font-display text-2xl font-bold mb-3">Configure o servidor primeiro</h1>
          <p className="text-muted mb-6">
            Você precisa rodar o comando <code className="font-mono bg-bg px-2 py-1 rounded">/colocar</code> no Discord pra
            indicar em qual servidor quer criar comandos personalizados.
          </p>
          <ol className="text-left text-sm space-y-2 mb-6 bg-bg rounded-lg p-4">
            <li>1. Abra o Discord e vá pro seu servidor</li>
            <li>2. Digite o comando: <code className="font-mono">/colocar</code></li>
            <li>3. Um formulário vai aparecer pedindo o ID do servidor</li>
            <li>4. Clique direito no nome do servidor → "Copiar ID" e cole no formulário</li>
            <li>5. Volte aqui e recarregue a página</li>
          </ol>
          <p className="text-xs text-muted">Você só precisa fazer isso uma vez.</p>
        </div>
      </main>
    );
  }

  async function deployToDiscord() {
    setDeployingCommands(true);
    setDeployMessage(null);
    try {
      const res = await fetch("/api/deploy-commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "erro ao fazer deploy");
      setDeployMessage(json.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeployingCommands(false);
    }
  }

  async function loadAll() {
    const [mRes, cRes] = await Promise.all([fetch("/api/modals"), fetch("/api/commands")]);
    const mJson = await mRes.json();
    const cJson = await cRes.json();
    if (!mJson.error) setModals(mJson.modals);
    if (!cJson.error) setCommands(cJson.commands);
    setLoaded(true);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveModal() {
    setSavingModal(true);
    setError(null);
    try {
      const res = await fetch("/api/modals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingModal),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "erro");
      setEditingModal(null);
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingModal(false);
    }
  }

  async function deleteModal(id) {
    await fetch(`/api/modals?id=${id}`, { method: "DELETE" });
    setEditingModal(null);
    await loadAll();
  }

  async function saveCommand() {
    setSavingCommand(true);
    setError(null);
    try {
      const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCommand),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "erro");
      setEditingCommand(null);
      await loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingCommand(false);
    }
  }

  async function deleteCommand(id) {
    await fetch(`/api/commands?id=${id}`, { method: "DELETE" });
    setEditingCommand(null);
    await loadAll();
  }

  if (!loaded) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted font-mono text-sm">carregando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-3">
          <NavDrawer />
          <h1 className="font-display text-2xl font-bold">Comandos personalizados</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={deployingCommands}
            onClick={deployToDiscord}
            className="text-sm bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-1.5 transition"
          >
            {deployingCommands ? "registrando…" : "Registrar no Discord"}
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-ink border border-border rounded-lg px-3 py-1.5 hover:border-accent hover:text-accent transition"
          >
            voltar
          </Link>
        </div>
      </header>

      {deployMessage && <p className="text-sm text-accent mb-4">{deployMessage}</p>}
      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">Formulários</h2>
          {!editingModal && (
            <button
              type="button"
              onClick={() => setEditingModal(emptyModal())}
              className="text-sm text-accent"
            >
              + novo formulário
            </button>
          )}
        </div>
        <p className="text-sm text-muted mb-4">
          Um formulário é o que abre quando alguém clica num botão — ex: nome, título, descrição de um
          anúncio. Cria o formulário primeiro, depois usa ele num botão de comando.
        </p>

        {editingModal && (
          <ModalEditor
            modal={editingModal}
            onChange={setEditingModal}
            onSave={saveModal}
            onDelete={() => deleteModal(editingModal.id)}
            saving={savingModal}
          />
        )}

        {modals.map((m) => (
          <div
            key={m.id}
            className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex items-center justify-between cursor-pointer"
            onClick={() => setEditingModal({ ...m })}
          >
            <div>
              <p className="font-semibold text-sm">{m.name}</p>
              <p className="text-xs text-muted">{m.fields.length} campo(s)</p>
            </div>
            <span className="text-xs text-muted">editar</span>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">Comandos</h2>
          {!editingCommand && (
            <button
              type="button"
              onClick={() => setEditingCommand(emptyCommand())}
              className="text-sm text-accent"
            >
              + novo comando
            </button>
          )}
        </div>
        <p className="text-sm text-muted mb-4">
          No Discord, roda com <code className="font-mono">/comando nome:{"<nome que você der aqui>"}</code>.
        </p>

        {editingCommand && (
          <div className="grid md:grid-cols-[1fr_320px] gap-4 items-start">
            <CommandEditor
              command={editingCommand}
              modals={modals}
              onChange={setEditingCommand}
              onSave={saveCommand}
              onDelete={() => deleteCommand(editingCommand.id)}
              saving={savingCommand}
            />
            <CommandPreview command={editingCommand} />
          </div>
        )}

        {commands.map((c) => (
          <div
            key={c.id}
            className="bg-surface border border-border rounded-xl px-4 py-3 mb-2 flex items-center justify-between cursor-pointer"
            onClick={() => setEditingCommand({ ...c })}
          >
            <div>
              <p className="font-semibold text-sm">/comando nome:{c.name}</p>
              <p className="text-xs text-muted">{c.buttons.length} botão(ões)</p>
            </div>
            <span className="text-xs text-muted">editar</span>
          </div>
        ))}
      </section>
    </main>
  );
}
