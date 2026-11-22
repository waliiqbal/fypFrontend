"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/shared/api";
import { fmtDateTime, rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Appointment } from "@/shared/types";
import { Card, LinkButton } from "@/shared/ui";

/** Stripe sends the patient back here. The URL is not proof of payment: we poll our own API (webhook-driven). */
function PaymentReturn() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const cancelled = params.get("cancelled") === "1";
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [state, setState] = useState<"checking" | "authorized" | "waiting" | "cancelled" | "missing">(cancelled ? "cancelled" : "checking");

  useEffect(() => {
    if (cancelled) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let savedId: number | null = null;
    try { savedId = Number(sessionStorage.getItem("askare.checkout.appointmentId")) || null; } catch { /* optional */ }
    const check = async () => {
      tries++;
      try {
        const res = await api.get<Appointment[]>("/api/doctors/appointments/mine");
        const found = res.data.find((a) => (sessionId ? a.stripeCheckoutSessionId === sessionId : a.id === savedId)) ?? null;
        setAppointment(found);
        if (found && found.paymentStatus !== "PENDING") return setState("authorized");
        if (tries < 15) timer = setTimeout(check, 2500);
        else setState(found ? "waiting" : "missing");
      } catch {
        if (tries < 15) timer = setTimeout(check, 2500);
        else setState("missing");
      }
    };
    void check();
    return () => clearTimeout(timer);
  }, [cancelled, sessionId]);

  const view = {
    checking: { icon: "clock", tone: "bg-brand-surface text-brand", title: "Confirming your payment…", text: "This usually takes a few seconds." },
    authorized: { icon: "check", tone: "bg-brand-surface text-brand", title: "Request sent to the doctor", text: `${appointment ? rs(appointment.consultationFee) : "The fee"} is on hold on your card. You will be charged only when the doctor accepts – otherwise the hold is released.` },
    waiting: { icon: "clock", tone: "bg-[#fff1dc] text-[#8a4b0f]", title: "Payment is still processing", text: "We haven't received confirmation from Stripe yet. Check your appointments in a minute." },
    cancelled: { icon: "x", tone: "bg-danger-soft text-danger", title: "Payment was not completed", text: "No money was taken. The slot is held for a short time – you can book again from the doctor's page." },
    missing: { icon: "alert", tone: "bg-[#fff1dc] text-[#8a4b0f]", title: "We couldn't find this booking", text: "If money was held, it appears in your appointments shortly. Otherwise please book again." },
  }[state] as { icon: "check"; tone: string; title: string; text: string };

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${view.tone}`}><Icon name={view.icon} size={28} /></span>
        <h1 className="font-display text-2xl font-extrabold">{view.title}</h1>
        <p className="max-w-sm text-sm leading-6 text-copy">{view.text}</p>
        {appointment && <p className="text-sm font-semibold">Dr. {appointment.doctor?.name} · {fmtDateTime(appointment.slot.startAt)}</p>}
        <LinkButton href="/patient/appointments" className="mt-2">Go to my appointments</LinkButton>
      </Card>
    </div>
  );
}

export default function PaymentReturnPage() {
  return <Suspense><PaymentReturn /></Suspense>;
}
