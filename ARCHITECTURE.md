# Askare frontend architecture

The frontend uses a domain-first modular architecture. Routes compose screens;
business code belongs to its owning module.

## Target structure

```text
src/
|-- app/                         # Next.js routes and layouts
|   |-- (auth)/
|   |   |-- login/page.tsx
|   |   |-- register/page.tsx
|   |   `-- verify-otp/page.tsx
|   |-- (portals)/
|   |   |-- admin/               # URLs start with /admin
|   |   |-- doctor/              # URLs start with /doctor
|   |   `-- patient/             # URLs start with /patient
|   |-- layout.tsx
|   |-- error.tsx
|   |-- loading.tsx
|   `-- not-found.tsx
|-- modules/                     # Business domains
|   |-- auth/
|   |-- appointments/
|   |-- doctors/
|   |-- patients/
|   |-- prescriptions/
|   |-- medical-records/
|   |-- payments/
|   `-- notifications/
|-- shared/                      # Domain-independent reusable code
|   |-- components/
|   |-- hooks/
|   |-- types/
|   |-- constants/
|   `-- utils/
|-- infrastructure/             # HTTP, storage, external integrations
|   |-- http/
|   |-- auth/
|   |-- storage/
|   `-- monitoring/
|-- config/                      # Environment and app configuration
`-- providers/                   # Application-wide React providers
```

Only folders with real implementation should be created. This target tree defines
where future code belongs; empty placeholder directories are intentionally avoided.

## Module template

```text
modules/<domain>/
|-- api/                         # Domain endpoints
|-- components/                  # Domain UI
|-- hooks/                       # Domain workflows and state
|-- schemas/                     # Form/API validation
|-- types/                       # Domain TypeScript types
|-- utils/                       # Domain-only helpers
`-- index.ts                     # Public module API
```

Small modules do not need every directory. Add a layer when it has a real use.

## Dependency rules

1. `app` imports module public APIs, shared code, config, and infrastructure.
2. Modules may import shared code, config, and infrastructure.
3. A module must not import another module's internal files; use its `index.ts`.
4. Shared code must not contain business logic or import modules.
5. Infrastructure must not import React components or business modules.
6. Components must not construct API URLs or duplicate HTTP error handling.
7. Only browser-safe values may use `NEXT_PUBLIC_` environment variables.

## Portal routing

Route groups such as `(doctor)` do not appear in URLs. Separate
`(doctor)/dashboard` and `(patient)/dashboard` routes would therefore conflict.
Role portals use actual URL segments:

```text
app/(portals)/admin/dashboard/page.tsx    -> /admin/dashboard
app/(portals)/doctor/dashboard/page.tsx   -> /doctor/dashboard
app/(portals)/patient/dashboard/page.tsx  -> /patient/dashboard
```

Each portal can own a `layout.tsx` for navigation and authorization boundaries.

## Request flow

```text
app route
  -> module component
  -> module hook (when workflow complexity requires it)
  -> module API function
  -> infrastructure HTTP client
  -> NestJS API
```
