"use client";

import { useEffect, useRef, useState } from "react";
import { UrgencyBanner } from "@/shared/extras";
import { api } from "@/shared/api";
import { fmtDate } from "@/shared/format";
import { Icon } from "@/shared/icons";
import { Button, cx, ErrorBox, LinkButton, Loading } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Conversation = { id: number; title: string; updatedAt: string };
type Message = { id: number; role: "USER" | "ASSISTANT"; content: string; urgency?: string | null; sources?: { sourceType: string; sourceId: string; preview: string }[] | null; createdAt: string };
type Reply = { message: Message; urgency: string; followUpQuestions: string[]; suggestBooking: boolean; disclaimer: string };

const STARTERS = ["What should I eat with my condition?", "Explain my last prescription", "When is my next follow-up?", "Is my blood pressure medicine safe with paracetamol?"];
const sourceLabel: Record<string, string> = { profile: "Health profile", consultation: "Consultation note", prescription: "Prescription", document: "Report" };

export default function AssistantPage() {
  const conversations = useApi(() => api.get<Conversation[]>("/api/ai/chat/conversations"));
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [extras, setExtras] = useState<Record<number, Reply>>({});
  const [text, setText] = useState("");
  const { busy, error, run } = useAction();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, busy]);

  async function open(id: number) {
    setActiveId(id);
    const res = await run("open", () => api.get<{ messages: Message[] }>(`/api/ai/chat/conversations/${id}`));
    if (res) setMessages(res.data.messages);
  }

  async function send(content = text) {
    const message = content.trim();
    if (!message) return;
    let id = activeId;
    if (!id) {
      const created = await run("new", () => api.post<Conversation>("/api/ai/chat/conversations", { title: message.slice(0, 60) }));
      if (!created) return;
      id = created.data.id;
      setActiveId(id);
      void conversations.reload();
    }
    setText("");
    setMessages((m) => [...m, { id: -Date.now(), role: "USER", content: message, createdAt: new Date().toISOString() }]);
    const res = await run("send", () => api.post<Reply>(`/api/ai/chat/conversations/${id}/messages`, { message }));
    if (res) {
      setMessages((m) => [...m, res.data.message]);
      setExtras((e) => ({ ...e, [res.data.message.id]: res.data }));
      void conversations.reload();
    }
  }

  async function remove(id: number) {
    await run("del", () => api.del(`/api/ai/chat/conversations/${id}`));
    if (id === activeId) { setActiveId(null); setMessages([]); }
    void conversations.reload();
  }

  return (
    <div className="grid h-[calc(100vh-140px)] min-h-[560px] gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="hidden flex-col gap-3 overflow-hidden rounded-[24px] border border-[#e3eeec] bg-white p-4 lg:flex">
        <Button icon="plus" onClick={() => { setActiveId(null); setMessages([]); }}>New chat</Button>
        <div className="flex-1 overflow-y-auto">
          {conversations.loading && <Loading />}
          {conversations.data?.map((c) => (
            <div key={c.id} className={cx("group flex items-center gap-2 rounded-[12px] px-3 py-2.5", c.id === activeId ? "bg-[#e3f4f2]" : "hover:bg-[#f3f8f7]")}>
              <button onClick={() => open(c.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold">{c.title}</p>
                <p className="text-[11px] text-copy-muted">{fmtDate(c.updatedAt)}</p>
              </button>
              <button aria-label="Delete chat" onClick={() => remove(c.id)} className="opacity-0 transition group-hover:opacity-60 hover:opacity-100"><Icon name="trash" size={15} /></button>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#e3eeec] bg-white">
        <header className="flex items-center gap-3 border-b border-[#eef4f3] px-5 py-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Icon name="chat" size={20} /></span>
          <div className="flex-1"><h1 className="text-base font-bold">My AI Health Assistant</h1><p className="text-xs font-semibold text-[#00646b]">Knows your history · Private to you</p></div>
          <button onClick={() => { setActiveId(null); setMessages([]); }} className="text-sm font-semibold text-brand lg:hidden">New chat</button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {!messages.length && (
            <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface text-brand"><Icon name="spark" size={28} /></span>
              <h2 className="text-xl font-bold">Ask me anything about your health</h2>
              <p className="text-sm leading-6 text-copy-muted">I answer using your AskCare records – conditions, prescriptions, consultation notes and reports. You can write in English, Urdu or Roman Urdu.</p>
              <div className="flex flex-wrap justify-center gap-2">{STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-[#dcebe8] px-3.5 py-2 text-[13px] hover:border-brand hover:text-brand">{s}</button>)}</div>
            </div>
          )}
          {messages.map((m) => {
            const extra = extras[m.id];
            return m.role === "USER" ? (
              <div key={m.id} className="ml-auto max-w-[80%] whitespace-pre-wrap rounded-[18px_18px_4px_18px] bg-brand px-4 py-3 text-sm text-white">{m.content}</div>
            ) : (
              <div key={m.id} className="flex max-w-[88%] flex-col gap-2">
                {m.urgency && (m.urgency === "EMERGENCY" || m.urgency === "URGENT") && <UrgencyBanner urgency={m.urgency} />}
                <div className="whitespace-pre-wrap rounded-[18px_18px_18px_4px] bg-[#f0f7f6] px-4 py-3 text-sm leading-6">{m.content}</div>
                {m.sources?.length ? <p className="text-xs text-copy-muted">Sources: {m.sources.map((s) => sourceLabel[s.sourceType] ?? s.sourceType).join(", ")}</p> : null}
                {extra?.followUpQuestions?.length ? <div className="flex flex-wrap gap-1.5">{extra.followUpQuestions.map((q) => <button key={q} onClick={() => send(q)} className="rounded-full border border-[#dcebe8] px-3 py-1.5 text-xs hover:border-brand hover:text-brand">{q}</button>)}</div> : null}
                {extra?.suggestBooking && <LinkButton href="/patient/symptom-checker" variant="soft" icon="stethoscope" className="w-fit">Find the right doctor</LinkButton>}
              </div>
            );
          })}
          {busy === "send" && <div className="flex w-fit items-center gap-2 rounded-[18px] bg-[#f0f7f6] px-4 py-3 text-sm text-copy-muted"><span className="h-2 w-2 animate-bounce rounded-full bg-brand" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:.3s]" /></div>}
          {error && <ErrorBox message={error} />}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="border-t border-[#eef4f3] p-3">
          <div className="flex items-center gap-2 rounded-[16px] border border-[#dcebe8] px-2 py-1.5 focus-within:border-brand">
            <label htmlFor="assistant-input" className="sr-only">Message</label>
            <input id="assistant-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about your health…" className="h-10 flex-1 bg-transparent px-2 text-sm outline-none" />
            <button aria-label="Send" disabled={!text.trim() || busy === "send"} className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand text-white disabled:opacity-40"><Icon name="arrow" size={18} /></button>
          </div>
          <p className="mt-1.5 px-2 text-[11px] text-copy-muted">AI guidance only – not a medical diagnosis. Never change medicines without your doctor.</p>
        </form>
      </section>
    </div>
  );
}
