"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { archiveProduct, deleteAdminRecord, duplicateProduct, saveAdminRecord } from "@/app/admin/actions";
import type { AdminModule, Role } from "@/lib/types";

function valueForInput(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AdminModuleView({ module, rows, role, message, error }: { module: AdminModule; rows: Record<string, any>[]; role: Role; message?: string; error?: string }) {
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const canWrite = module.writeRoles.includes(role);
  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-gold">Modulo</p>
          <h2 className="font-serif text-4xl">{module.title}</h2>
          <p className="mt-2 max-w-3xl leading-7 text-neutral-600">{module.description}</p>
        </div>
        {canWrite && <button onClick={() => setEditing({})} className="bg-ink px-5 py-3 text-sm font-bold text-white">Novo registro</button>}
      </div>

      {message && <p className="border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-3 border border-line bg-white p-4">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-64 flex-1 border border-line px-4 py-2" placeholder="Pesquisar e filtrar" />
        <button onClick={() => exportCsv(filtered, module.key)} className="border border-ink px-4 py-2 text-sm font-bold">Exportar CSV</button>
        {module.key === "produtos" && <label className="border border-dashed border-line px-4 py-2 text-sm font-bold">Importar CSV<input type="file" accept=".csv" className="hidden" /></label>}
        {selected.length > 0 && <span className="px-3 py-2 text-sm text-neutral-600">{selected.length} selecionados para edicao em lote</span>}
      </div>

      <div className="overflow-x-auto border border-line bg-white admin-scrollbar">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-ivory text-xs uppercase text-neutral-500">
            <tr>
              <th className="p-3"><input type="checkbox" onChange={(event) => setSelected(event.target.checked ? filtered.map((row) => row.id) : [])} /></th>
              {module.columns.slice(0, 6).map((column) => <th className="p-3" key={column.key}>{column.label}</th>)}
              <th className="p-3">Atualizado</th>
              <th className="p-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-line align-top">
                <td className="p-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={(event) => setSelected((prev) => event.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id))} /></td>
                {module.columns.slice(0, 6).map((column) => <td className="max-w-64 truncate p-3" key={column.key}>{valueForInput(row[column.key])}</td>)}
                <td className="p-3 text-neutral-500">{row.updated_at ? new Date(row.updated_at).toLocaleDateString("pt-BR") : "-"}</td>
                <td className="space-x-2 whitespace-nowrap p-3">
                  {canWrite && <button onClick={() => setEditing(row)} className="font-bold text-ink">Editar</button>}
                  {module.key === "produtos" && <Link href={`/r/${row.slug}`} target="_blank" className="font-bold text-moss">Abrir</Link>}
                  {module.key === "produtos" && canWrite && <button onClick={() => startTransition(() => duplicateProduct(row.id))} className="font-bold text-clay">Duplicar</button>}
                  {module.key === "produtos" && canWrite && <button onClick={() => startTransition(() => archiveProduct(row.id))} className="font-bold text-neutral-600">Arquivar</button>}
                  {canWrite && <button onClick={() => confirm("Excluir este registro?") && startTransition(() => deleteAdminRecord(module.key, row.id))} className="font-bold text-red-700">Excluir</button>}
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td className="p-6 text-center text-neutral-500" colSpan={9}>Nenhum registro encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 p-4">
          <form action={saveAdminRecord.bind(null, module.key)} className="mx-auto grid max-w-4xl gap-5 bg-paper p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase text-gold">{module.title}</p><h3 className="font-serif text-3xl">{editing.id ? "Editar registro" : "Novo registro"}</h3></div>
              <button type="button" onClick={() => setEditing(null)} className="border border-ink px-3 py-2 text-sm font-bold">Fechar</button>
            </div>
            <input type="hidden" name="id" value={editing.id ?? ""} />
            <div className="grid gap-4 md:grid-cols-2">
              {module.columns.map((column) => (
                <label key={column.key} className={column.type === "textarea" ? "grid gap-2 md:col-span-2" : "grid gap-2"}>
                  <span className="text-sm font-bold">{column.label}</span>
                  {column.type === "textarea" ? <textarea name={column.key} defaultValue={valueForInput(editing[column.key])} className="min-h-28 border border-line bg-white p-3" /> : column.type === "select" ? <select name={column.key} defaultValue={valueForInput(editing[column.key])} className="border border-line bg-white p-3">{(column.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select> : column.type === "checkbox" ? <input type="checkbox" name={column.key} defaultChecked={Boolean(editing[column.key])} className="h-5 w-5" /> : <input name={column.key} type={column.type === "number" ? "number" : column.type === "email" ? "email" : column.type === "url" ? "url" : "text"} step="0.01" defaultValue={valueForInput(editing[column.key])} className="border border-line bg-white p-3" />}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className="border border-line px-5 py-3 font-bold">Cancelar</button>
              <button disabled={isPending} className="bg-ink px-5 py-3 font-bold text-white">{isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function exportCsv(rows: Record<string, any>[], name: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
