"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { Icon } from "@/shared/icons";
import { Button, Card, DataTable, EmptyState, ErrorBox, Input, Loading, Notice, PageHeader } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Spec = { id: number; name: string; _count: { doctors: number } };

export default function AdminSpecializations() {
  const { data, error, loading, reload } = useApi(() => api.get<Spec[]>("/api/super-admin/specializations"));
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const action = useAction();
  const done = (m: string) => { setFlash(m); void reload(); };

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Catalogue" title="Specializations" description="Doctors pick from this list, and the AI symptom checker only recommends specialities listed here." />
      <Card className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1"><Input aria-label="New specialization" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Endocrinology" className="mt-0" /></div>
        <Button icon="plus" disabled={name.trim().length < 2} loading={action.busy === "add"} onClick={async () => { if (await action.run("add", () => api.post("/api/super-admin/specializations", { name }))) { setName(""); done("Specialization added."); } }}>Add</Button>
      </Card>
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} /></div>}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(s) => s.id} empty={<EmptyState icon="tag" title="No specializations" />} columns={[
            { header: "Name", cell: (s) => editing?.id === s.id ? <Input aria-label="Name" value={editing.name} onChange={(e) => setEditing({ id: s.id, name: e.target.value })} className="mt-0 max-w-xs" /> : <b>{s.name}</b> },
            { header: "Doctors", cell: (s) => s._count.doctors },
            { header: "", className: "text-right", cell: (s) => editing?.id === s.id ? (
              <div className="flex justify-end gap-1.5">
                <Button className="h-9" loading={action.busy === `e${s.id}`} onClick={async () => { if (await action.run(`e${s.id}`, () => api.patch(`/api/super-admin/specializations/${s.id}`, { name: editing.name }))) { setEditing(null); done("Renamed."); } }}>Save</Button>
                <Button className="h-9" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex justify-end gap-1.5">
                <Button className="h-9" variant="secondary" onClick={() => setEditing({ id: s.id, name: s.name })}>Rename</Button>
                <button aria-label={`Delete ${s.name}`} disabled={s._count.doctors > 0} title={s._count.doctors ? "In use by doctors" : "Delete"} onClick={async () => { if (await action.run(`d${s.id}`, () => api.del(`/api/super-admin/specializations/${s.id}`))) done("Deleted."); }} className="flex h-9 w-9 items-center justify-center rounded-xl text-copy-muted hover:text-danger disabled:opacity-30"><Icon name="trash" size={17} /></button>
              </div>
            ) },
          ]} />
        )}
      </Card>
    </div>
  );
}
