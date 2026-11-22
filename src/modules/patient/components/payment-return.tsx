"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyAppointments, openAppointmentCheckout } from "../api/doctor.api";
import type { PatientAppointment } from "../types/doctor.types";
import { PatientShell } from "./patient-shell";
import { PortalIcon } from "./portal-icon";

export function PaymentReturn() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const leftCheckout = params.get("cancelled") === "1";
  const [appointment, setAppointment] = useState<PatientAppointment | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let count = 0;
    async function check() {
      try {
        let savedId: number | null = null;
        try { savedId = Number(sessionStorage.getItem("askare.checkout.appointmentId")); } catch { /* Storage is optional. */ }
        if (!sessionId && (!leftCheckout || !savedId)) throw new Error("No checkout reference found. Please return to appointments.");
        const response = await getMyAppointments(controller.signal);
        if (controller.signal.aborted) return;
        const found = response.data.find((item) => sessionId ? item.stripeCheckoutSessionId === sessionId : item.id === savedId);
        setAppointment(found ?? null);
        setCheckedAt(Date.now());
        setError(null);
        count += 1;
        const pending = !found || (found.paymentStatus === "PENDING" && found.status === "PENDING");
        if (pending && !leftCheckout && count < 20) {
          timer = setTimeout(check, 3000);
        } else {
          setLoading(false);
          if (!found) setError("This checkout could not be found in your account. Try checking again shortly.");
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not verify payment status.");
        setLoading(false);
      }
    }
    void check();
    return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [sessionId, leftCheckout, attempt]);

  async function resumeCheckout() {
    if (!appointment || redirecting) return;
    setRedirecting(true);
    setError(null);
    try { await openAppointmentCheckout(appointment.slotId); }
    catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resume checkout.");
      setRedirecting(false);
    }
  }

  const authorized = appointment?.paymentStatus === "AUTHORIZED";
  const paid = appointment?.paymentStatus === "PAID";
  const cancelled = appointment?.status === "CANCELLED" || appointment?.paymentStatus === "CANCELLED";
  const failed = appointment?.paymentStatus === "FAILED";
  const confirmed = appointment?.status === "CONFIRMED" && paid;
  const title = confirmed ? "Your appointment is confirmed" : authorized ? "Payment authorized. Awaiting doctor acceptance." : paid ? "Payment collected" : cancelled ? "Appointment request cancelled" : failed ? "Payment was not authorized" : leftCheckout ? "You left checkout" : loading ? "Verifying your payment" : "Payment confirmation is still pending";
  const detail = confirmed ? "Your payment and appointment have been confirmed." : authorized ? "Your payment is reserved and has not been collected. Your appointment is not confirmed yet." : paid ? "Your payment has been collected. Check the appointment status below for confirmation." : cancelled ? "This reservation is no longer active. Any payment-hold release can take time to appear at your bank." : failed ? "Your last payment attempt failed. You can retry while your reservation remains active." : leftCheckout ? "Leaving Stripe does not automatically cancel your reservation. You can resume checkout while the slot is held." : "We are checking your account for Stripe's payment update. Please do not make another payment while confirmation is pending.";
  const canResume = appointment && !authorized && !paid && !cancelled && leftCheckout && appointment.slot.holdExpiresAt && new Date(appointment.slot.holdExpiresAt).getTime() > checkedAt;
  const buttonClass = "inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50";

  return (
    <PatientShell patientName={appointment?.patient.name} patientId={appointment?.patient.id}>
      <main className="mx-auto min-h-[650px] max-w-4xl px-5 py-10 sm:px-9 lg:py-14">
        <Link href="/patient/appointments" className="text-sm font-semibold text-brand">Back to specialists</Link>
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Sandbox payments — no real money is charged.</p>
        <section className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-border sm:p-9">
          <PortalIcon name="payment" className="h-12 w-12 text-brand" />
          <div role="status" aria-live="polite">
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink">{error && !appointment ? "Unable to verify payment" : title}</h1>
            <p className="mt-4 text-sm leading-7 text-copy-muted">{error && !appointment ? "We cannot confirm your payment right now. Sign in to the same patient account and try again." : detail}</p>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
          {appointment && <dl className="mt-8 grid gap-6 border-y border-border py-6 sm:grid-cols-2">
            <div><dt className="text-xs text-copy-muted">Doctor</dt><dd className="mt-1 font-semibold">{appointment.doctor.name}</dd></div>
            <div><dt className="text-xs text-copy-muted">Consultation fee</dt><dd className="mt-1 font-semibold">PKR {Number(appointment.consultationFee).toLocaleString("en-PK")}</dd></div>
            <div><dt className="text-xs text-copy-muted">Date and time (Pakistan)</dt><dd className="mt-1 font-semibold">{new Date(appointment.slot.startAt).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" })}</dd></div>
            <div><dt className="text-xs text-copy-muted">Appointment #{appointment.id}</dt><dd className="mt-1 font-semibold">{appointment.status.replaceAll("_", " ")}</dd><dd className="mt-1 text-sm">Payment: {appointment.paymentStatus}</dd></div>
          </dl>}
          <div className="mt-7 flex flex-wrap gap-3">
            {canResume && <button type="button" disabled={redirecting} onClick={resumeCheckout} className={`${buttonClass} bg-brand text-white`}>{redirecting ? "Redirecting..." : "Resume Stripe Checkout"}</button>}
            <button type="button" disabled={loading || redirecting} onClick={() => { setLoading(true); setError(null); setAttempt((value) => value + 1); }} className={`${buttonClass} border border-border text-brand`}>{loading ? "Checking status..." : "Check status again"}</button>
            <Link href="/patient/dashboard" className={`${buttonClass} bg-brand text-white`}>Back to dashboard</Link>
          </div>
        </section>
      </main>
    </PatientShell>
  );
}