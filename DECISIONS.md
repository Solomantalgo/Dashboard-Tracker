# PFFI Member Tracker - Architecture & Design Decisions

This document logs key design choices, assumptions, and simple sensible defaults implemented in the PFFI Member Tracker application.

---

## 1. Dual-Mode Data Layer (`src/services/api.ts`)
- **Implementation:** Explicit branching via `isSupabaseConfigured`.
- **Supabase Connected Mode (code path):** When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, the code attempts real queries (`select`, `insert`, `update`, `upsert`, `delete`) against Supabase tables and calculated views. This was not live-tested in this verification pass.
- **Local Fallback Mode:** When unconfigured or when `VITE_DEMO_MODE=true`, the API seamlessly queries an in-memory & `localStorage` store pre-seeded with invented demo data (20 demo members, 8 weeks of session history, payments, and assessments).
- **Empty Connected Results:** A successful Supabase list query returns its actual result, including an empty array. Local mock data is used only when Supabase is unconfigured or a query returns an error; connected errors are logged with `console.error`.

---

## 2. Real Authentication & Role-Based Scoping
- **Authentication:** Supabase Auth handles email + password authentication. User sessions are persisted and listened to via `onAuthStateChange`.
- **Roles Boundary (`user_roles`, code path):** Upon login, `AuthContext` queries `user_roles` to retrieve the user's role (`admin`, `client`, or `coach`). Protected routes also require a real user unless `VITE_DEMO_MODE=true`; runtime role and RLS behavior remains unverified.
- **Role Switcher UI:** The free role switcher in the app header is removed from standard production builds and is rendered **only** when `VITE_DEMO_MODE=true` for developer testing.
- **Coach Role Scoping (intended):** The code routes coaches toward `/coach`, and the schema contains policies for assigned athletes. Attendance select/manage policies now use the same assigned-client predicate; financial transactions, coach reviews, and other coaches' clients were not live-tested.

---

## 3. Member Portal Invites & Account Provisioning
- **Invite Flow:** Admin triggers "Invite to Member Portal" from an athlete's profile.
- **Provisioning Choice:** Portal invites use the `supabase/functions/invite-user` Edge Function with a generated temporary password and `email_confirm: true`. The function verifies the caller's JWT and `user_roles.role = 'admin'`, then uses the service-role key server-side to create the Auth user, insert `user_roles`, and link `clients.user_id` or `coaches.user_id`. The service-role key is never sent to the browser. Email invites were not chosen because the existing UI already displays a temporary password.
- **Revocation (code path):** The code deletes the corresponding `user_roles` entry and resets the linked user ID while keeping the domain record. Runtime revocation was not live-tested.

---

## 4. Member Deactivation vs. Permanent Deletion
- **Deactivation (`status = 'inactive'`, code path):** The code updates the status and has active/inactive filtering paths. KPI, attendance, and history behavior was not live-tested.
- **Permanent Delete (code path):** The UI requires the member's full name and the Supabase path deletes the client row; the schema declares cascading foreign keys. Database deletion and history removal were not live-tested.

---

## 5. Currency & Timezone Formatting
- **Currency:** All monetary amounts are formatted as `UGX 50,000` (`en-UG` / `UGX`).
- **Timezone:** Dates and timestamps reference Kampala local time (`Africa/Kampala`, UTC+3) using `kampala_today()` to prevent date shifts around midnight UTC during outdoor session logging.

---

## 6. Payment System Seam
- **Seam Pattern:** Implemented `PaymentProvider` interface with `ManualProvider` as default.
- **Feature Flag:** `VITE_ONLINE_PAYMENTS=false` keeps online mobile money collection options disabled in the UI until provider webhooks are configured.

### Invite Function Deployment

Deploy with `supabase functions deploy invite-user`. Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` inside the Edge Function environment; none belong in the frontend `.env`. The function has not been deployed or live-tested in this environment.

### Portal Password Reset

The same `invite-user` Edge Function accepts `action = 'reset'` for an already-linked client or coach. It verifies the caller as an admin, reads the linked `user_id`, calls `auth.admin.updateUserById` with a newly generated temporary password, and returns that password without storing it. Resetting an uninvited person returns an explicit "Invite them first" error. Live password rotation and old/new credential testing remain unverified until the function is deployed.

---

## Verification status (2026-09-23)

- Static inspection: code paths for Bugs 1, 3, 4, and 5 were found; the local fallbacks and requested actions are present.
- A1 fix: protected routes now require `user` unless explicit `VITE_DEMO_MODE=true`; unconfigured demo-off login displays a warning.
- A2 fix: both coach attendance policies are scoped to clients assigned to the authenticated coach; no other unscoped `is_coach()` policy was found.
- Schema comparison: `pffi_schema_v1.sql` is not text-identical to Appendix A of `PFFI_build_brief.md`; it is an expanded executable migration with idempotent DDL, views, helper functions, RLS, and seed rows. `PFFI_fix_brief.md` is absent from the repository.
- Build: `npm install` succeeded; `npm run build` succeeded with Vite's >500 kB chunk warning.
- Not verified: schema execution, Supabase CRUD, refresh persistence, Auth/RLS tests, deactivation/delete runtime behavior, and member/coach invite/revocation.
- Read-only live table check: the configured project returned HTTP 200 and zero rows for all queried domain tables, including `coaches`, `plans`, and `targets`. No writes or UI verification were performed because the project was not identified as disposable, admin credentials were unavailable, and browser automation was unavailable.
- Portal identity/layout fix: `MemberLayout` demo switcher controls are gated by explicit `VITE_DEMO_MODE=true`; real client and coach records loaded by `AuthContext` are authoritative rather than falling back to the first mock/list record. Member and coach portals use bottom tabs on mobile and desktop side rails with wider responsive content areas. Real-user and three-viewport visual checks remain unverified.

## Portal Login Email Display (2026-09-25)

- Added nullable `portal_email` columns to `clients` and `coaches` in `pffi_schema_v1.sql`, including idempotent `alter table ... add column if not exists` statements so the schema remains the single source of truth.
- The `invite-user` Edge Function writes `portal_email` together with `user_id` after creating the Auth user. Password resets do not update or clear this column.
- The frontend reads the display copy from the existing `clients`/`coaches` query and omits the email when it is null, preserving compatibility with older invited records.
- The schema was not applied to the Supabase test project from this environment, and `invite-user` was not redeployed or live-tested. Apply the schema, then re-run `supabase functions deploy invite-user`; Edge Functions do not auto-deploy on git push. The deployment is required after this function code change.
- The frontend now reads the JSON `error` field from a failed function response, so errors such as "This person has no portal access yet. Invite them first." reach the UI instead of being replaced by the generic non-2xx message. End-to-end failure/success checks remain pending until the test project is updated and the function is deployed.
