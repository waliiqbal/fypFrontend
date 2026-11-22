"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSpecializations, registerUser } from "@/modules/auth/api/auth.api";
import { api } from "@/shared/api";
import type { RegisterPayload, Specialization, UserType } from "@/modules/auth/types/auth.types";
const inputClass = "mt-2 h-14 w-full rounded-2xl border border-transparent bg-surface-input px-5 text-[15px] text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10";
const labelClass = "block text-xs font-bold uppercase tracking-[0.18em] text-slate-600";

export function RegisterForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<number[]>([]);
  const [isLoadingSpecializations, setIsLoadingSpecializations] = useState(true);
  const [specializationsError, setSpecializationsError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<{ id: number; name: string; city?: string | null }[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    api.public<{ id: number; name: string; city?: string | null }[]>("/api/public/hospitals").then((r) => setHospitals(r.data)).catch(() => setHospitals([]));
  }, []);

  useEffect(() => {
    let active = true;

    getSpecializations()
      .then((result) => {
        if (active) setSpecializations(result.data);
      })
      .catch((error) => {
        if (!active) return;
        setSpecializationsError(
          error instanceof Error ? error.message : "Specializations could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setIsLoadingSpecializations(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function selectRole(role: UserType) {
    setUserType(role);
    if (role === "patient") setSelectedSpecializationIds([]);
    setFeedback(null);
  }

  function toggleSpecialization(id: number) {
    setSelectedSpecializationIds((current) =>
      current.includes(id)
        ? current.filter((specializationId) => specializationId !== id)
        : current.length < 4              
          ? [...current, id]                                
          : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (userType === "doctor" && selectedSpecializationIds.length === 0) {
      setFeedback({ type: "error", message: "Select at least one specialization." });
      setIsSubmitting(false);
      return;
    }
    const commonPayload = {
      userType,
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      phone: String(form.get("phone") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
    };

    const payload: RegisterPayload = userType === "patient"
      ? {
          ...commonPayload,
          userType: "patient",
          gender: String(form.get("gender") ?? ""),
          dateOfBirth: String(form.get("dateOfBirth") ?? ""),
          bloodGroup: String(form.get("bloodGroup") ?? ""),
        }
      : {
          ...commonPayload,
          userType: "doctor",
          specializationIds: selectedSpecializationIds,
          licenseNumber: String(form.get("licenseNumber") ?? "").trim(),
          experience: Number(form.get("experience")),
          consultationFee: Number(form.get("consultationFee")),
          ...(form.get("hospitalId") ? { hospitalId: Number(form.get("hospitalId")) } : {}),
        };

    try {
      const result = await registerUser(payload);
      setFeedback({ type: "success", message: result.message || "Profile created successfully." });
      router.push(`/verify-otp?email=${encodeURIComponent(commonPayload.email)}&userType=${userType}`);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to connect to the server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-8 text-ink sm:px-6 lg:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[35rem] bg-[radial-gradient(circle_at_50%_-20%,_#d4f4f0_0%,_#ecf8f7_45%,_transparent_74%)]" />
      <div className="pointer-events-none absolute -right-24 top-80 h-72 w-72 rounded-full bg-teal-100/35 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-24 h-72 w-72 rounded-full bg-amber-100/35 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16">
        <section className="pt-3 text-center lg:sticky lg:top-12 lg:pt-10 lg:text-left">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-brand-soft to-brand shadow-xl shadow-brand/15 lg:mx-0">
            <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
              <path d="M27 12h10v13h13v10H37v13H27V35H14V25h13V12Z" fill="white" />
              <path d="M11 51c8-5 14-5 22-2 8 3 13 1 20-5" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="mx-auto mt-6 h-1 w-14 rounded-full bg-brand/25 lg:mx-0" />
          <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-[-0.04em] text-ink sm:text-5xl">Begin your wellness journey</h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-500 lg:mx-0 lg:text-lg">Join a trusted healthcare community designed to connect patients with quality care.</p>
          <div className="mt-8 hidden space-y-4 text-sm text-slate-600 lg:block">
            {["Secure registration", "Personalized healthcare profile", "Quick access to trusted care"].map((item) => (
              <div key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand">✓</span>{item}</div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-[0_25px_80px_rgba(28,65,69,0.10)] backdrop-blur sm:p-8 lg:p-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Select your role to continue</p>
          <div className="mt-4 grid grid-cols-2 rounded-2xl bg-surface-muted p-1.5" role="group" aria-label="Select user role">
            {(["patient", "doctor"] as const).map((role) => (
              <button key={role} type="button" onClick={() => selectRole(role)} aria-pressed={userType === role} className={`h-12 rounded-xl text-base font-semibold capitalize transition ${userType === role ? "bg-white text-brand shadow-sm" : "text-copy hover:text-ink"}`}>{role}</button>
            ))}
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>Full name<input className={inputClass} name="name" placeholder={userType === "doctor" ? "Dr. John Doe" : "John Doe"} required /></label>
              <label className={labelClass}>Email<input className={inputClass} name="email" type="email" placeholder="name@clinical.com" autoComplete="email" required /></label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>Phone<input className={inputClass} name="phone" type="tel" placeholder="+92 300 1234567" autoComplete="tel" required /></label>
              <label className={labelClass}>Address<input className={inputClass} name="address" placeholder="City, country" autoComplete="street-address" required /></label>
            </div>
            <label className={labelClass}>Password
              <span className="relative mt-2 block">
                <input className={`${inputClass} mt-0 pr-16`} name="password" type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" minLength={8} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-16 items-center justify-center text-xs normal-case tracking-normal text-copy-muted hover:text-brand" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
              </span>
            </label>

            {userType === "patient" ? (
              <div className="grid gap-5 sm:grid-cols-3">
                <label className={labelClass}>Gender<select className={inputClass} name="gender" defaultValue="" required><option value="" disabled>Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
                <label className={labelClass}>Date of birth<input className={inputClass} name="dateOfBirth" type="date" required /></label>
                <label className={labelClass}>Blood group<select className={inputClass} name="bloodGroup" defaultValue="" required><option value="" disabled>Select</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className={labelClass}>Specializations
                  <details className="group relative mt-2">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between rounded-2xl border border-transparent bg-surface-input px-5 text-[15px] font-normal normal-case tracking-normal text-ink outline-none transition focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10">
                      <span className={selectedSpecializationIds.length ? "text-slate-800" : "text-slate-400"}>
                        {selectedSpecializationIds.length
                          ? `${selectedSpecializationIds.length} selected`
                          : isLoadingSpecializations
                            ? "Loading specializations..."
                            : "Select up to 4"}
                      </span>
                      <span className="text-slate-400 transition group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-sm font-normal normal-case tracking-normal shadow-xl">
                      {specializationsError ? (
                        <p className="p-3 text-rose-600">{specializationsError}</p>
                      ) : (
                        specializations.map((specialization) => {
                          const checked = selectedSpecializationIds.includes(specialization.id);
                          const disabled = !checked && selectedSpecializationIds.length >= 4;
                          return (
                            <label key={specialization.id} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-brand-surface ${disabled ? "cursor-not-allowed opacity-45" : ""}`}>
                              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleSpecialization(specialization.id)} className="h-4 w-4 accent-teal-700" />
                              <span>{specialization.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </details>
                  {selectedSpecializationIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 font-normal normal-case tracking-normal">
                      {specializations.filter(({ id }) => selectedSpecializationIds.includes(id)).map(({ id, name }) => (
                        <button key={id} type="button" onClick={() => toggleSpecialization(id)} className="rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-soft">{name} ×</button>
                      ))}
                    </div>
                  )}
                </div>
                <label className={labelClass}>License number<input className={inputClass} name="licenseNumber" placeholder="Medical license ID" required /></label>
                <label className={labelClass}>Experience (years)<input className={inputClass} name="experience" type="number" min="0" max="70" placeholder="5" required /></label>
                <label className={labelClass}>Consultation fee<input className={inputClass} name="consultationFee" type="number" min="0" step="0.01" placeholder="2500" required /></label>
                <label className={`${labelClass} sm:col-span-2`}>Where do you practise?<select className={inputClass} name="hospitalId" defaultValue=""><option value="">Private practice (approved by AskCare)</option>{hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}{h.city ? ` – ${h.city}` : ""} (approved by hospital)</option>)}</select></label>
              </div>
            )}

            {feedback && <div role="alert" className={`rounded-2xl px-4 py-3 text-sm ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{feedback.message}</div>}
            <button type="submit" disabled={isSubmitting} className="h-14 w-full rounded-2xl bg-brand text-base font-bold text-white shadow-lg shadow-brand/15 transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Creating profile..." : "Create Profile"}</button>
            <p className="text-center text-xs leading-5 text-slate-400">By creating a profile, you agree to our Terms of Service and Privacy Policy.</p>
            <p className="text-center text-sm text-copy-muted">Already registered? <Link href="/login" className="font-semibold text-brand hover:underline">Login</Link></p>
          </form>
        </section>
      </div>
    </main>
  );
}
