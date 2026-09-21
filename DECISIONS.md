# PFFI Member Tracker - Architecture & Design Decisions

This document logs key design choices, assumptions, and simple sensible defaults chosen during the development of the PFFI Member Tracker application.

## 1. Environment & Dual-Mode Data Layer
- **Decision**: Implemented an explicit dual-mode API service layer (`src/services/api.ts`).
- **Rationale**: If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in `.env`, the app queries Supabase directly with standard RLS rules. If credentials are empty or unconfigured, the app seamlessly uses a local mock service (`src/services/mockData.ts`) pre-seeded with 20 invented members, 8 weeks of sessions, payment logs, and baseline/latest fitness assessments. This allows offline testing, quick live previews, and instant demonstration without requiring a active Supabase backend.

## 2. Currency & Locale
- **Decision**: All financial values are formatted as `UGX 50,000` using standard Uganda locale formatting (`en-UG` / `UGX`).
- **Rationale**: Confirmed by the flyer and brief requirements.

## 3. Date & Timezone Handling
- **Decision**: All date calculations, alerts, and attendance tracking reference Kampala local time (`Africa/Kampala`, UTC+3) using helper functions equivalent to Supabase's `kampala_today()`.
- **Rationale**: Prevents date shifts around midnight UTC when coaches or admins log sessions outdoors in Uganda.

## 4. Business Rules & Thresholds
- **Show-up Rate Window**: Evaluated over a rolling 30-day window (`v_attendance_rate_30d`). Sessions conducted prior to a member's joining date are excluded.
- **At-Risk Member Trigger**: Members who have not attended any session in 14+ days (excluding members who joined within the last 14 days) are flagged as "Stopped coming".
- **Assessment Due Reminder**: Members whose last assessment was more than 28 days ago (4 weeks) are flagged as "Assessment Due".
- **Plan Duration**: Default monthly plan lasts 30 calendar days (`duration_days = 30`).

## 5. Security & Privacy Defaults
- **Health Screening Access**: Health screening medical conditions are restricted to Admin view only and marked with a prominent privacy banner. Health data is strictly excluded from export CSVs and WhatsApp share progress cards.
- **Member Portal Isolation**: Member login (`role = client`) strictly filters queries by `client_id` associated with `auth.uid()`, preventing access to other members' records, company finance, coach reviews, or administrative alerts.

## 6. Payment System Seam
- **Decision**: Implemented `PaymentProvider` interface seam with `ManualProvider` as default.
- **Rationale**: As requested by brief section 8, `VITE_ONLINE_PAYMENTS=false` disables online payment options while keeping UI buttons visible in a disabled state for future Mobile Money (MTN MoMo / Airtel Money) integrations.
