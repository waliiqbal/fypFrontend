"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/shared/api";
import { Icon } from "@/shared/icons";
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Loading, Modal, Notice, PageHeader, Textarea } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Department = { id: number; name: string; description?: string | null; doctors: { id: number; name: string; status: string }[] };

export default function HospitalDepartments() {
  const { data, error, loading, reload } = useApi(() => api.get<Department[]>("/api/hospital/departments"));
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const action = useAction();

  async function remove(d: Department) {
    const r = await action.run(`del${d.id}`, () => api.del(`/api/hospital/departments/${d.id}`));
    setDeleting(null);
    if (r) { setFlash(`${d.name} deleted.`); void reload(); }
  }

  return (
    <div>
      <PageHeader eyebrow="Organisation" title="Departments" description="Group your doctors into departments such as Cardiology or Paediatrics. Assign a doctor to a department from the doctor's page." actions={<Button icon="plus" onClick={() => setEditing("new")}>New department</Button>} />
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} onRetry={reload} /></div>}
      {loading && !data ? <Loading /> : data && data.length === 0 ? (
        <Card><EmptyState icon="building" title="No departments yet" text="Create your first department, then assign doctors to it." action={<Button icon="plus" onClick={() => setEditing("new")}>New department</Button>} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((d) => (
            <Card key={d.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-bold">{d.name}</h2>
                  <p className="text-[13px] text-copy-muted">{d.doctors.length} doctor{d.doctors.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex gap-1">
                  <button aria-label={`Edit ${d.name}`} onClick={() => setEditing(d)} className="flex h-9 w-9 items-center justify-center rounded-xl text-copy hover:bg-surface-muted"><Icon name="settings" size={17} /></button>
                  <button aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)} className="flex h-9 w-9 items-center justify-center rounded-xl text-copy-muted hover:text-danger"><Icon name="trash" size={17} /></button>
                </div>
              </div>
              {d.description && <p className="text-sm leading-6 text-copy">{d.description}</p>}
              <div className="mt-auto flex flex-wrap gap-1.5">
                {d.doctors.length ? d.doctors.map((doc) => (
                  <Link key={doc.id} href={`/hospital/doctors/${doc.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f7f6] px-3 py-1 text-xs font-semibold text-[#00545a] hover:bg-[#e3f4f2]">
                    Dr. {doc.name}{doc.status !== "ACTIVE" && <Badge value={doc.status} className="px-1.5 py-0 text-[9px]" />}
                  </Link>
                )) : <span className="text-xs text-copy-muted">No doctors assigned</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <DepartmentModal target={editing} onClose={() => setEditing(null)} onDone={(m) => { setEditing(null); setFlash(m); void reload(); }} />
      <Modal open={!!deleting} title={`Delete ${deleting?.name}?`} onClose={() => setDeleting(null)} footer={<Button variant="danger" loading={action.busy === `del${deleting?.id}`} onClick={() => deleting && remove(deleting)}>Delete department</Button>}>
        <p className="text-sm leading-6">{deleting?.doctors.length ? `${deleting.doctors.length} doctor(s) still belong to this department. Move them to another department first, otherwise deletion is refused.` : "This department has no doctors, so it can be removed safely."}</p>
      </Modal>
    </div>
  );
}

function DepartmentModal({ target, onClose, onDone }: { target: Department | "new" | null; onClose: () => void; onDone: (msg: string) => void }) {
  const editing = target && target !== "new" ? target : null;
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const { busy, error, run } = useAction();
  if (!target) return null;

  async function save() {
    const body = { name: name.trim(), description: description.trim() || undefined };
    const r = await run("save", () => (editing ? api.patch(`/api/hospital/departments/${editing.id}`, body) : api.post("/api/hospital/departments", body)));
    if (r) onDone(editing ? "Department updated." : `${name.trim()} created.`);
  }
  return (
    // key resets the form whenever a different department is opened
    <Modal key={editing?.id ?? "new"} open title={editing ? "Edit department" : "New department"} onClose={onClose} footer={<Button loading={busy === "save"} disabled={name.trim().length < 2} onClick={save}>{editing ? "Save changes" : "Create department"}</Button>}>
      <div className="flex flex-col gap-4">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cardiology" /></Field>
        <Field label="Description (optional)"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-20" /></Field>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  );
}
