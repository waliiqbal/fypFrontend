"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { UrgencyBanner } from "@/shared/extras";
import { api } from "@/shared/api";
import { Icon } from "@/shared/icons";
import { Badge, Button, Card, ErrorBox, LinkButton, PageHeader, Textarea } from "@/shared/ui";
import { useAction } from "@/shared/use-api";

type Analysis = {
  detectedSymptoms: string[];
  explanation: string;
  suggestedSpecialization: { id: number; name: string } | null;
  matchStatus: "MATCHED" | "SPECIALIZATION_NOT_AVAILABLE" | "NEEDS_MORE_INFORMATION" | "EMERGENCY";
  urgency: "ROUTINE" | "SOON" | "URGENT" | "EMERGENCY";
  followUpQuestions: string[];
  emergencyMessage: string | null;
  disclaimer: string;
};

function Checker() {
  const params = useSearchParams();
  const [message, setMessage] = useState(params.get("q") ?? "");
  const [result, setResult] = useState<Analysis | null>(null);
  const { busy, error, run } = useAction();
  const ran = useRef(false);

  async function analyze(text = message) {
    if (text.trim().length < 3) return;
    const res = await run("analyze", () => api.post<Analysis>("/api/ai/symptom-analysis", { message: text.trim() }));
    if (res) setResult(res.data);
  }

  useEffect(() => {
    if (!ran.current && params.get("q")) {
      ran.current = true;
      void analyze(params.get("q") ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader eyebrow="AI symptom checker" title="Tell us how you feel" description="Describe your symptoms in your own words – English or Roman Urdu. The AI explains them simply, checks urgency and points you to the right specialist on AskCare." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="flex h-fit flex-col gap-4">
          <Textarea aria-label="Symptoms" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. 3 din se bukhar hai aur gala dard, raat ko khansi zyada hoti hai" className="min-h-40" />
          <Button icon="spark" loading={busy === "analyze"} disabled={message.trim().length < 3} onClick={() => analyze()}>Analyze symptoms</Button>
          {error && <ErrorBox message={error} />}
          <p className="text-xs leading-5 text-copy-muted">For chest pain, breathing trouble, fainting or heavy bleeding call <b>1122</b> immediately – do not wait.</p>
        </Card>

        <div className="flex flex-col gap-4">
          {!result && !busy && (
            <Card className="flex flex-col items-center py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-surface text-brand"><Icon name="spark" size={26} /></span>
              <p className="mt-4 font-semibold">Your result will appear here</p>
              <p className="mt-1 max-w-xs text-sm text-copy-muted">We only suggest specialities that have real doctors on AskCare.</p>
            </Card>
          )}
          {busy && <Card><p className="flex items-center gap-3 text-sm text-copy-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />Reading your symptoms…</p></Card>}
          {result && !busy && (
            <>
              <UrgencyBanner urgency={result.urgency} message={result.emergencyMessage} />
              <Card className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[.12em] text-copy-muted">Urgency</span>
                  <Badge value={result.urgency} />
                </div>
                {result.detectedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{result.detectedSymptoms.map((s) => <span key={s} className="rounded-[10px] bg-[#f0f7f6] px-2.5 py-1 text-[13px] font-medium">{s}</span>)}</div>
                )}
                <p className="text-[15px] leading-7">{result.explanation}</p>
                {result.followUpQuestions.length > 0 && (
                  <div className="rounded-2xl bg-[#f6faf9] p-4">
                    <p className="text-[13px] font-bold">To be more precise, tell us:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-copy">{result.followUpQuestions.map((q) => <li key={q}>{q}</li>)}</ul>
                    <Button variant="soft" className="mt-3" onClick={() => setMessage((m) => `${m}\n`)}>Add more details</Button>
                  </div>
                )}
              </Card>
              {result.suggestedSpecialization ? (
                <div className="flex flex-wrap items-center gap-4 rounded-[24px] bg-[#00646b] p-6 text-white">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[13px] text-[#cdeeea]">Recommended specialist</p>
                    <p className="font-display text-[22px] font-extrabold">{result.suggestedSpecialization.name}</p>
                  </div>
                  <Link href={`/patient/doctors?specializationId=${result.suggestedSpecialization.id}`} className="flex h-12 items-center gap-2 rounded-[14px] bg-white px-5 font-bold text-[#00545a]">See doctors <Icon name="arrow" size={18} /></Link>
                </div>
              ) : result.matchStatus === "SPECIALIZATION_NOT_AVAILABLE" ? (
                <Card><p className="text-sm">We don&apos;t have a matching specialist yet. A <b>General Medicine</b> doctor can examine you and refer you.</p><LinkButton href="/patient/doctors" variant="soft" className="mt-3">Browse all doctors</LinkButton></Card>
              ) : null}
              <p className="text-xs text-copy-muted">{result.disclaimer}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SymptomCheckerPage() {
  return <Suspense><Checker /></Suspense>;
}
