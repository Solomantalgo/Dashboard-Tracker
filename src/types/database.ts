export type ClientStatus = 'active' | 'inactive';
export type ClientLevel = 'A' | 'B' | 'C'; // Beginner | Intermediate | Advanced
export type PlanType = 'monthly' | 'session_pass';
export type TxnType = 'revenue' | 'expense';
export type PaymentStatus = 'pending' | 'confirmed' | 'failed';
export type AppRole = 'admin' | 'coach' | 'client';
export type PriorityLevel = 'low' | 'normal' | 'high';

export interface UserRole {
  user_id: string;
  role: AppRole;
}

export interface Coach {
  id: string;
  user_id?: string;
  portal_email?: string;
  full_name: string;
  phone?: string;
  active: boolean;
}

export interface Client {
  id: string;
  member_code: string;
  user_id?: string;
  portal_email?: string;
  full_name: string;
  status: ClientStatus;
  phone?: string;
  area?: string;
  age_at_joining?: number;
  date_joined?: string;
  coach_id?: string;
  coach_name?: string;
  goals: string[];
  level?: ClientLevel;
  consent_given_at?: string;
  created_at?: string;
}

export interface HealthScreening {
  id: string;
  client_id: string;
  screened_on: string;
  conditions: string[];
  notes?: string;
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price_ugx: number;
  duration_days?: number;
  session_count?: number;
  active: boolean;
}

export interface Payment {
  id: string;
  client_id: string;
  client_name?: string;
  plan_id: string;
  plan_name?: string;
  amount_ugx: number;
  paid_on: string;
  expires_on?: string;
  method?: string;
  status: PaymentStatus;
  provider_ref?: string;
  notes?: string;
  created_at?: string;
}

export interface Session {
  id: string;
  session_date: string;
  start_time?: string;
  coach_id?: string;
  coach_name?: string;
  title?: string;
  attended_count?: number;
}

export interface Attendance {
  session_id: string;
  client_id: string;
}

export interface Assessment {
  id: string;
  client_id: string;
  client_name?: string;
  assessed_on: string;
  height_cm?: number;
  weight_kg?: number;
  waist_cm?: number;
  pushups?: number;
  pushups_proper_form?: boolean;
  plank_seconds?: number;
  run_time_seconds?: number;
  notes?: string;
  bmi?: number;
}

export interface Transaction {
  id: string;
  txn_date: string;
  type: TxnType;
  description: string;
  amount_ugx: number;
}

export interface CoachReview {
  id: string;
  coach_id: string;
  coach_name?: string;
  reviewed_on: string;
  leadership: number;
  session_quality: number;
  punctuality: number;
  attendance_tracking: number;
  notes?: string;
}

export interface ContentPost {
  id: string;
  post_date: string;
  platform: string;
  content_type: string;
  posted: boolean;
  notes?: string;
}

export interface EquipmentNeed {
  id: string;
  item: string;
  quantity: number;
  priority: PriorityLevel;
  resolved: boolean;
  notes?: string;
  created_at?: string;
}

export interface Target {
  metric: 'active_members' | 'attendance_rate' | 'monthly_revenue';
  goal: number;
}

// Derived Views & Metrics
export interface AttendanceRate30d {
  client_id: string;
  full_name: string;
  sessions_held: number;
  sessions_attended: number;
  show_up_rate_pct: number;
}

export interface AtRiskClient {
  client_id: string;
  full_name: string;
  last_attended?: string;
  days_absent: number;
}

export interface MembershipStatusView {
  client_id: string;
  full_name: string;
  paid_on?: string;
  expires_on?: string;
  membership_status: 'active' | 'expired' | 'due_soon' | 'never_paid';
}

export interface DashboardMetrics {
  activeMembers: number;
  checkinsThisWeek: number;
  showUpRatePct: number;
  revenueMtdUgx: number;
  outstandingUgx: number;
  expiredCount: number;
  expiringCount: number;
  stoppedComingCount: number;
  equipmentNeedsCount: number;
}
