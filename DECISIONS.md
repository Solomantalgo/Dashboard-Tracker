# PFFI Member Tracker - Architecture & Design Decisions

This document logs key design choices, assumptions, and simple sensible defaults implemented in the PFFI Member Tracker application.

---

## 1. Dual-Mode Data Layer (`src/services/api.ts`)
- **Implementation:** Explicit branching via `isSupabaseConfigured`.
- **Supabase Connected Mode:** When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, all API operations perform real queries (`select`, `insert`, `update`, `upsert`, `delete`) against Supabase tables and calculated views (`v_attendance_rate_30d`, `v_at_risk_clients`, `v_membership_status`, `v_finance_ledger`).
- **Local Fallback Mode:** When unconfigured or when `VITE_DEMO_MODE=true`, the API seamlessly queries an in-memory & `localStorage` store pre-seeded with invented demo data (20 demo members, 8 weeks of session history, payments, and assessments).

---

## 2. Real Authentication & Role-Based Scoping
- **Authentication:** Supabase Auth handles email + password authentication. User sessions are persisted and listened to via `onAuthStateChange`.
- **Roles Boundary (`user_roles`):** Upon login, `AuthContext` queries `user_roles` table to retrieve the user's role (`admin`, `client`, or `coach`).
- **Role Switcher UI:** The free role switcher in the app header is removed from standard production builds and is rendered **only** when `VITE_DEMO_MODE=true` for developer testing.
- **Coach Role Scoping:** Coaches logging in land in `/coach` (Coach Portal). Views are restricted to today's session (attendance marking) and assigned athletes only (`clients.coach_id = coach.id`). Financial transactions, coach reviews, and other coaches' clients are excluded by RLS and UI routing.

---

## 3. Member Portal Invites & Account Provisioning
- **Invite Flow:** Admin triggers "Invite to Member Portal" from an athlete's profile.
- **Provisioning Choice:** Creating an Auth user via Supabase Auth generates a user account, inserts a row into `user_roles` (`role = 'client'`), and links `clients.user_id`. A one-time temporary password is generated for the admin to hand to the athlete for immediate sign in.
- **Revocation:** Admin can click "Revoke Access" on the member profile or coach record, which deletes the corresponding `user_roles` entry and resets `clients.user_id` to `null` while keeping all member data intact.

---

## 4. Member Deactivation vs. Permanent Deletion
- **Deactivation (`status = 'inactive'`):** Deactivating a member excludes them from active member counts, attendance session checklists, and alert widgets. Their payment, attendance, and assessment history remains fully intact. Admin can search and filter inactive members to reactivate them anytime.
- **Permanent Delete:** A rare, irreversible privacy action. Gated behind a modal requiring the admin to type the member's full name to confirm. Performs a SQL cascading delete.

---

## 5. Currency & Timezone Formatting
- **Currency:** All monetary amounts are formatted as `UGX 50,000` (`en-UG` / `UGX`).
- **Timezone:** Dates and timestamps reference Kampala local time (`Africa/Kampala`, UTC+3) using `kampala_today()` to prevent date shifts around midnight UTC during outdoor session logging.

---

## 6. Payment System Seam
- **Seam Pattern:** Implemented `PaymentProvider` interface with `ManualProvider` as default.
- **Feature Flag:** `VITE_ONLINE_PAYMENTS=false` keeps online mobile money collection options disabled in the UI until provider webhooks are configured.
