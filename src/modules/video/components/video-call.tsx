"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { completeAppointment, getConsultationNotes, getJoinInfo, getPatientSummary, saveConsultationNotes, type ConsultationNotes, type DoctorPatientSummary, type JoinInfo } from "../api/video.api";
import { useVideoCall } from "../hooks/use-video-call";

const timeFmt = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" });
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function VideoCallScreen({ appointmentId, portal }: { appointmentId: number; portal: "patient" | "doctor" }) {
  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getJoinInfo(appointmentId).then(setInfo).catch((e: Error) => setLoadError(e.message));
  }, [appointmentId]);

  const back = portal === "doctor" ? "/doctor/appointments" : "/patient/appointments";

  if (loadError)
    return (
      <Centered>
        <h1 className="text-2xl font-semibold">Call not available</h1>
        <p className="mt-2 text-copy-muted">{loadError}</p>
        <Link href={back} className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white">Back to appointments</Link>
      </Centered>
    );
  if (!info) return <Centered><p className="text-copy-muted">Preparing your consultation room…</p></Centered>;
  return <CallRoom info={info} portal={portal} back={back} />;
}

function CallRoom({ info, portal, back }: { info: JoinInfo; portal: "patient" | "doctor"; back: string }) {
  const call = useVideoCall(info.appointmentId, info.iceServers);
  const [panel, setPanel] = useState<"chat" | "brief" | "notes">(portal === "doctor" ? "brief" : "chat");
  const [showPanel, setShowPanel] = useState(true);
  const [completed, setCompleted] = useState(false);
  const peerLabel = portal === "doctor" ? info.peer.name : `Dr. ${info.peer.name}`;
  const opensAt = new Date(info.opensAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  const canJoin = info.canJoin || (now >= opensAt.getTime() && now <= new Date(info.closesAt).getTime());

  useEffect(() => {
    void call.startPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (call.phase === "ended")
    return (
      <Centered>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-surface text-brand"><Icon name="check" /></span>
        <h1 className="mt-5 text-2xl font-semibold">Call ended</h1>
        <p className="mt-2 text-copy-muted">{portal === "doctor" ? "Save your notes and prescription, then mark the consultation as completed." : "Your doctor will share notes and any prescription in Medical Records."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {portal === "doctor" && (
            <button
              disabled={completed}
              onClick={async () => { await completeAppointment(info.appointmentId); setCompleted(true); }}
              className="h-11 rounded-xl bg-brand px-5 font-semibold text-white disabled:opacity-60"
            >{completed ? "Marked as completed" : "Mark consultation completed"}</button>
          )}
          <Link href={back} className="inline-flex h-11 items-center rounded-xl border border-brand/30 px-5 font-semibold text-brand">Back to appointments</Link>
        </div>
      </Centered>
    );

  const joined = call.phase === "waiting" || call.phase === "in-call" || call.phase === "connecting";

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="flex flex-wrap items-center gap-4 border-b border-border bg-white px-5 py-4 sm:px-8">
        <Link href={back} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-copy"><Icon name="back" /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Video consultation</p>
          <h1 className="truncate text-lg font-semibold">with {peerLabel}</h1>
        </div>
        <StatusPill phase={call.phase} />
        <p className="hidden text-sm text-copy-muted sm:block">{timeFmt.format(new Date(info.startAt))}</p>
      </header>

      {!joined ? (
        <main className="mx-auto grid max-w-5xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-[#0d3437]">
            <VideoTile stream={call.localStream} muted mirrored />
            {!call.localStream && <div className="absolute inset-0 flex items-center justify-center text-sm text-[#a9d6d2]">Camera preview</div>}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
              <RoundButton label={call.micOn ? "Mute microphone" : "Unmute microphone"} active={call.micOn} onClick={call.toggleMic} icon={call.micOn ? "mic" : "mic-off"} />
              <RoundButton label={call.camOn ? "Turn camera off" : "Turn camera on"} active={call.camOn} onClick={call.toggleCam} icon={call.camOn ? "cam" : "cam-off"} />
            </div>
          </div>
          <section className="flex flex-col gap-5 rounded-3xl border border-border bg-white p-6">
            <div className="flex items-center gap-4">
              <Avatar name={info.peer.name} />
              <div><p className="font-semibold">{peerLabel}</p><p className="text-sm text-copy-muted">{timeFmt.format(new Date(info.startAt))}</p></div>
            </div>
            <p className="text-sm leading-6 text-copy">
              {canJoin ? "Your consultation room is open. Check your camera and microphone, then join." : `The room opens 10 minutes before the appointment, at ${timeFmt.format(opensAt)}.`}
            </p>
            {call.error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{call.error}</p>}
            <button onClick={() => void call.join()} disabled={!canJoin} className="mt-auto flex h-12 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
              <Icon name="cam" /> Join consultation
            </button>
            <p className="text-xs text-copy-muted">Calls are private and peer-to-peer. Only you and {peerLabel} can join.</p>
          </section>
        </main>
      ) : (
        <main className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row">
          <div className="relative min-h-[60vh] flex-1 overflow-hidden rounded-3xl bg-[#0d3437]">
            <VideoTile stream={call.remoteStream} />
            {(!call.remoteStream || !call.peerMedia.video) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center text-[#d8efec]">
                <Avatar name={info.peer.name} large />
                <p className="font-semibold">{call.phase === "in-call" ? `${peerLabel} turned the camera off` : `Waiting for ${peerLabel} to join…`}</p>
              </div>
            )}
            {call.phase === "in-call" && !call.peerMedia.audio && <span className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs text-white">{peerLabel} is muted</span>}
            <div className="absolute bottom-24 right-4 aspect-video w-40 overflow-hidden rounded-2xl border-2 border-white/70 bg-[#174d55] sm:w-56">
              <VideoTile stream={call.localStream} muted mirrored />
            </div>
            {call.error && <p className="absolute left-1/2 top-4 -translate-x-1/2 rounded-xl bg-danger px-4 py-2 text-sm text-white">{call.error}</p>}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3 rounded-2xl bg-black/30 p-2 backdrop-blur">
              <RoundButton label={call.micOn ? "Mute" : "Unmute"} active={call.micOn} onClick={call.toggleMic} icon={call.micOn ? "mic" : "mic-off"} />
              <RoundButton label={call.camOn ? "Camera off" : "Camera on"} active={call.camOn} onClick={call.toggleCam} icon={call.camOn ? "cam" : "cam-off"} />
              <RoundButton label="Toggle side panel" active={showPanel} onClick={() => setShowPanel((v) => !v)} icon="chat" />
              <button aria-label="End call" onClick={call.hangUp} className="flex h-12 items-center gap-2 rounded-xl bg-[#c2412d] px-5 font-semibold text-white"><Icon name="phone" /> End</button>
            </div>
          </div>
          {showPanel && (
            <aside className="flex w-full flex-col rounded-3xl border border-border bg-white lg:w-[360px]">
              <div className="flex gap-1 border-b border-border p-2">
                {portal === "doctor" && <Tab active={panel === "brief"} onClick={() => setPanel("brief")}>Patient brief</Tab>}
                {portal === "doctor" && <Tab active={panel === "notes"} onClick={() => setPanel("notes")}>Notes</Tab>}
                <Tab active={panel === "chat"} onClick={() => setPanel("chat")}>Chat{call.messages.length ? ` (${call.messages.length})` : ""}</Tab>
              </div>
              {panel === "brief" && portal === "doctor" ? <PatientBrief appointmentId={info.appointmentId} /> : panel === "notes" && portal === "doctor" ? <NotesPanel appointmentId={info.appointmentId} /> : <ChatPanel messages={call.messages} me={info.role} onSend={call.sendChat} />}
            </aside>
          )}
        </main>
      )}
    </div>
  );
}

/** Consultation notes the doctor can type while the call is running. Saved to the patient's record. */
function NotesPanel({ appointmentId }: { appointmentId: number }) {
  const [notes, setNotes] = useState<ConsultationNotes | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getConsultationNotes(appointmentId).then(setNotes).catch((e: Error) => setError(e.message));
  }, [appointmentId]);

  async function save() {
    if (!notes) return;
    setStatus("saving");
    try {
      await saveConsultationNotes(appointmentId, notes);
      setStatus("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save notes");
      setStatus("error");
    }
  }
  const set = (k: keyof ConsultationNotes, v: string) => { setStatus("idle"); setError(null); setNotes((n) => (n ? { ...n, [k]: v } : n)); };
  const field = "mt-1 w-full rounded-xl border border-border bg-surface-input px-3 py-2 text-sm outline-none focus:border-brand";

  if (!notes && !error) return <p className="p-5 text-sm text-copy-muted">Loading notes…</p>;
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
      {notes && (
        <>
          <label className="block font-semibold">Symptoms<textarea value={notes.symptoms} onChange={(e) => set("symptoms", e.target.value)} className={`${field} min-h-16`} /></label>
          <label className="block font-semibold">Diagnosis<input value={notes.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} className={`${field} h-10`} /></label>
          <label className="block font-semibold">Clinical notes<textarea value={notes.notes} onChange={(e) => set("notes", e.target.value)} className={`${field} min-h-20`} /></label>
          <label className="block font-semibold">Advice<textarea value={notes.advice} onChange={(e) => set("advice", e.target.value)} className={`${field} min-h-16`} /></label>
          <button onClick={save} disabled={status === "saving"} className="h-11 w-full rounded-xl bg-brand font-semibold text-white hover:bg-brand-hover disabled:opacity-60">{status === "saving" ? "Saving…" : "Save notes"}</button>
          {status === "saved" && <p className="text-center text-xs font-semibold text-brand">Notes saved to the patient&apos;s record.</p>}
          <p className="text-xs text-copy-muted">Add the prescription after the call from the appointment page.</p>
        </>
      )}
      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}

function PatientBrief({ appointmentId }: { appointmentId: number }) {
  const [brief, setBrief] = useState<DoctorPatientSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getPatientSummary(appointmentId).then(setBrief).catch((e: Error) => setError(e.message));
  }, [appointmentId]);
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-brand"><Icon name="spark" /> AI summary</p>
      {error && <p className="text-danger">{error}</p>}
      {!brief && !error && <p className="text-copy-muted">Reading patient history…</p>}
      {brief && (
        <>
          <p className="leading-6 text-copy">{brief.summary || "No history recorded yet."}</p>
          {brief.redFlags.length > 0 && (
            <div className="rounded-2xl bg-danger-soft p-4">
              <p className="font-semibold text-danger">Watch out</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#7a2a20]">{brief.redFlags.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}
          {brief.keyPoints.length > 0 && <ul className="space-y-2">{brief.keyPoints.map((p) => <li key={p} className="rounded-xl bg-surface-muted px-3 py-2">{p}</li>)}</ul>}
          {!brief.aiGenerated && <p className="text-xs text-copy-muted">AI is busy – showing the raw health profile.</p>}
        </>
      )}
    </div>
  );
}

function ChatPanel({ messages, me, onSend }: { messages: { from: string; name?: string; text: string; at: string }[]; me: string; onSend: (t: string) => void }) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "60vh" }}>
        {!messages.length && <p className="text-center text-sm text-copy-muted">Messages you send here are only visible during this call.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.from === me ? "ml-auto rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-surface-muted text-ink"}`}>{m.text}</div>
        ))}
        <div ref={end} />
      </div>
      <form
        className="flex gap-2 border-t border-border p-3"
        onSubmit={(e) => { e.preventDefault(); onSend(text); setText(""); }}
      >
        <label className="sr-only" htmlFor="call-chat">Message</label>
        <input id="call-chat" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" className="h-11 flex-1 rounded-xl border border-border bg-surface-input px-3 text-sm outline-none focus:border-brand" />
        <button className="h-11 rounded-xl bg-brand px-4 text-sm font-semibold text-white">Send</button>
      </form>
    </>
  );
}

function VideoTile({ stream, muted, mirrored }: { stream: MediaStream | null; muted?: boolean; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={`h-full w-full object-cover ${mirrored ? "-scale-x-100" : ""}`} />;
}

function StatusPill({ phase }: { phase: string }) {
  const map = useMemo<Record<string, [string, string]>>(() => ({
    idle: ["Not joined", "bg-surface-muted text-copy"],
    connecting: ["Connecting…", "bg-[#fff1dc] text-[#8a4b0f]"],
    waiting: ["Waiting room", "bg-[#fff1dc] text-[#8a4b0f]"],
    "in-call": ["Live", "bg-brand-soft text-[#00545a]"],
    error: ["Problem", "bg-danger-soft text-danger"],
  }), []);
  const [label, cls] = map[phase] ?? map.idle;
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

function Avatar({ name, large }: { name: string; large?: boolean }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#d9f3ef] font-bold text-[#00545a] ${large ? "h-24 w-24 text-3xl" : "h-12 w-12"}`}>{initials(name)}</span>;
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${active ? "bg-brand-surface text-brand" : "text-copy-muted"}`}>{children}</button>;
}

function RoundButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: IconName }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={`flex h-12 w-12 items-center justify-center rounded-xl ${active ? "bg-white text-[#00545a]" : "bg-[#c2412d] text-white"}`}>
      <Icon name={icon} />
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center bg-canvas px-5"><div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center">{children}</div></div>;
}

type IconName = "mic" | "mic-off" | "cam" | "cam-off" | "chat" | "phone" | "back" | "check" | "spark";
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    "mic-off": <><path d="M15 9.3V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 5 2.2M5 11a7 7 0 0 0 11.5 5.4M19 11a7 7 0 0 1-.6 2.8M12 18v3M3 3l18 18" /></>,
    cam: <><rect x="2" y="6" width="14" height="12" rx="3" /><path d="M16 10l6-3v10l-6-3" /></>,
    "cam-off": <><path d="M16 16v1a1 1 0 0 1-1 1H5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h1M10 6h5a1 1 0 0 1 1 1v3l6-3v10M3 3l18 18" /></>,
    chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
    phone: <path d="M10.7 13.3a15 15 0 0 0 3.3 2.4l1.6-1.6a1 1 0 0 1 1-.2 11 11 0 0 0 3.5.6 1 1 0 0 1 1 1V19a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .6 3.5 1 1 0 0 1-.2 1z" transform="rotate(135 12 12)" />,
    back: <path d="M15 18l-6-6 6-6" />,
    check: <path d="M20 6L9 17l-5-5" />,
    spark: <path d="M12 3l1.9 4.6L19 9l-4 3.4L16.2 18 12 15.3 7.8 18 9 12.4 5 9l5.1-1.4z" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
