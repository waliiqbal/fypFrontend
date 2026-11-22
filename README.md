# AskCare Frontend (Next.js)

Four portals in one app, teal "AskCare" design:

| Portal | URL | Login as |
|---|---|---|
| Patient | `/patient/dashboard` | Patient |
| Doctor | `/doctor/dashboard` | Doctor |
| Hospital Admin | `/hospital/dashboard` | Admin (hospital admin account) |
| Super Admin | `/admin/dashboard` | Admin (super admin account) |

After login everyone is sent to their own portal automatically; opening another portal's URL redirects back.

## Run

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                    # http://localhost:3001
```

The backend (`fypBackend`) must be running on port 3000. All API endpoints are documented in the backend's `API.md`.

## Screens

- **Patient:** dashboard, AI symptom checker, find a doctor (filters), doctor profile + slot booking + Stripe checkout, appointments (cancel, join call, review), payment return, personal AI health assistant (chat), medical records (timeline, prescriptions, consultations, report upload), health profile, account.
- **Doctor:** dashboard, appointment requests (**Accept / Reject** with AI patient summary), appointments, appointment workspace (notes, prescription, AI safety check, complete / no-show), schedule (weekly hours, time off, publish slots), patients + full record, earnings, profile & specializations, video call.
- **Hospital Admin:** dashboard, doctors (approve / reject / add / fee / activate), appointments (cancel on doctor's behalf), revenue (+CSV), patients, hospital profile.
- **Super Admin:** platform dashboard, hospitals (create with admin, suspend), doctor verification, patients (block), appointments & payments (refunds), specializations, review moderation, AI monitoring, commission & audit log.
- **Video call:** `/patient/call/[id]`, `/doctor/call/[id]` – free peer-to-peer WebRTC.

## Structure

```
src/
  app/(auth)        login, register, verify-otp, forgot-password
  app/(portals)     patient/ doctor/ hospital/ admin/  (each with its own layout = sidebar shell)
  app/(call)        full-screen video call pages
  shared/           UI kit (ui.tsx), app shell, API client, hooks, types, formatters
  modules/          auth, doctor schedule, video call
```
