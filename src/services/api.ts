import {
  Client, Coach, Plan, Payment, Session, Assessment, Transaction,
  CoachReview, ContentPost, EquipmentNeed, Target, DashboardMetrics, HealthScreening
} from '../types/database';
import {
  mockClients, mockCoaches, mockPlans, mockPayments, mockSessions,
  mockAttendance, mockAssessments, mockTransactions, mockCoachReviews,
  mockContentPosts, mockEquipmentNeeds, mockTargets, mockHealthScreenings
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabase';
import { defaultPaymentProvider } from './payments/manualProvider';
import { format, subDays, addDays, isAfter, isBefore, parseISO, differenceInDays } from 'date-fns';

// In-Memory & LocalStorage State
class LocalState {
  clients: Client[] = [];
  coaches: Coach[] = [];
  plans: Plan[] = [];
  payments: Payment[] = [];
  sessions: Session[] = [];
  attendance: { session_id: string; client_id: string }[] = [];
  assessments: Assessment[] = [];
  transactions: Transaction[] = [];
  coachReviews: CoachReview[] = [];
  contentPosts: ContentPost[] = [];
  equipmentNeeds: EquipmentNeed[] = [];
  targets: Target[] = [];
  healthScreenings: HealthScreening[] = [];

  constructor() {
    this.load();
  }

  load() {
    const saved = localStorage.getItem('pffi_local_db_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.clients = parsed.clients || mockClients;
        this.coaches = parsed.coaches || mockCoaches;
        this.plans = parsed.plans || mockPlans;
        this.payments = parsed.payments || mockPayments;
        this.sessions = parsed.sessions || mockSessions;
        this.attendance = parsed.attendance || mockAttendance;
        this.assessments = parsed.assessments || mockAssessments;
        this.transactions = parsed.transactions || mockTransactions;
        this.coachReviews = parsed.coachReviews || mockCoachReviews;
        this.contentPosts = parsed.contentPosts || mockContentPosts;
        this.equipmentNeeds = parsed.equipmentNeeds || mockEquipmentNeeds;
        this.targets = parsed.targets || mockTargets;
        this.healthScreenings = parsed.healthScreenings || mockHealthScreenings;
        return;
      } catch (e) {
        console.error('Failed to parse local PFFI storage:', e);
      }
    }
    // Seed default
    this.clients = [...mockClients];
    this.coaches = [...mockCoaches];
    this.plans = [...mockPlans];
    this.payments = [...mockPayments];
    this.sessions = [...mockSessions];
    this.attendance = [...mockAttendance];
    this.assessments = [...mockAssessments];
    this.transactions = [...mockTransactions];
    this.coachReviews = [...mockCoachReviews];
    this.contentPosts = [...mockContentPosts];
    this.equipmentNeeds = [...mockEquipmentNeeds];
    this.targets = [...mockTargets];
    this.healthScreenings = [...mockHealthScreenings];
    this.save();
  }

  save() {
    localStorage.setItem('pffi_local_db_v1', JSON.stringify({
      clients: this.clients,
      coaches: this.coaches,
      plans: this.plans,
      payments: this.payments,
      sessions: this.sessions,
      attendance: this.attendance,
      assessments: this.assessments,
      transactions: this.transactions,
      coachReviews: this.coachReviews,
      contentPosts: this.contentPosts,
      equipmentNeeds: this.equipmentNeeds,
      targets: this.targets,
      healthScreenings: this.healthScreenings,
    }));
  }
}

const local = new LocalState();

export const api = {
  // --- Dashboard Metrics & Calculated Views ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const startOfWeek = subDays(today, 7);
    const startOf30Days = subDays(today, 30);
    const startOfMonth = format(today, 'yyyy-MM-01');

    const activeMembers = local.clients.filter(c => c.status === 'active').length;

    // Check-ins this week
    const weekSessions = local.sessions.filter(s => parseISO(s.session_date) >= startOfWeek);
    const weekSessionIds = new Set(weekSessions.map(s => s.id));
    const checkinsThisWeek = local.attendance.filter(a => weekSessionIds.has(a.session_id)).length;

    // Show-up rate (30 days)
    const recentSessions = local.sessions.filter(s => parseISO(s.session_date) >= startOf30Days);
    const recentSessionIds = new Set(recentSessions.map(s => s.id));
    const totalPossible = activeMembers * Math.max(1, recentSessions.length);
    const actualAttended = local.attendance.filter(a => recentSessionIds.has(a.session_id)).length;
    const showUpRatePct = totalPossible > 0 ? Math.round((actualAttended / totalPossible) * 100) : 0;

    // Revenue MTD
    const revenueMtdUgx = local.payments
      .filter(p => p.status === 'confirmed' && p.paid_on >= startOfMonth)
      .reduce((sum, p) => sum + p.amount_ugx, 0);

    // Outstanding (Expired or never paid members count * 50,000 UGX)
    let expiredCount = 0;
    let expiringCount = 0;
    let outstandingUgx = 0;

    local.clients.filter(c => c.status === 'active').forEach(c => {
      const clientPays = local.payments
        .filter(p => p.client_id === c.id && p.status === 'confirmed')
        .sort((a, b) => b.paid_on.localeCompare(a.paid_on));

      if (clientPays.length === 0) {
        expiredCount++;
        outstandingUgx += 50000;
      } else {
        const latest = clientPays[0];
        if (latest.expires_on) {
          if (latest.expires_on < todayStr) {
            expiredCount++;
            outstandingUgx += 50000;
          } else {
            const diffDays = differenceInDays(parseISO(latest.expires_on), today);
            if (diffDays <= 7 && diffDays >= 0) {
              expiringCount++;
            }
          }
        }
      }
    });

    // Stopped coming (14+ days no attendance)
    const startOf14Days = subDays(today, 14);
    let stoppedComingCount = 0;

    local.clients.filter(c => c.status === 'active').forEach(c => {
      if (c.date_joined && parseISO(c.date_joined) > startOf14Days) return;
      const clientAtt = local.attendance
        .filter(a => a.client_id === c.id)
        .map(a => local.sessions.find(s => s.id === a.session_id))
        .filter(Boolean) as Session[];

      if (clientAtt.length === 0) {
        stoppedComingCount++;
      } else {
        const latestDate = clientAtt.reduce((max, s) => s.session_date > max ? s.session_date : max, '');
        if (latestDate < format(startOf14Days, 'yyyy-MM-dd')) {
          stoppedComingCount++;
        }
      }
    });

    const equipmentNeedsCount = local.equipmentNeeds.filter(e => !e.resolved).length;

    return {
      activeMembers,
      checkinsThisWeek,
      showUpRatePct,
      revenueMtdUgx,
      outstandingUgx,
      expiredCount,
      expiringCount,
      stoppedComingCount,
      equipmentNeedsCount
    };
  },

  // --- Members ---
  async getMembers(): Promise<Client[]> {
    return local.clients.map(c => {
      // Calculate show-up rate 30d
      const startOf30Days = subDays(new Date(), 30);
      const recentSessions = local.sessions.filter(s => parseISO(s.session_date) >= startOf30Days);
      const recentSessionIds = new Set(recentSessions.map(s => s.id));
      const attendedCount = local.attendance.filter(a => a.client_id === c.id && recentSessionIds.has(a.session_id)).length;
      const ratePct = recentSessions.length > 0 ? Math.round((attendedCount / recentSessions.length) * 100) : 0;

      // Membership status
      const latestPay = local.payments
        .filter(p => p.client_id === c.id && p.status === 'confirmed')
        .sort((a, b) => b.paid_on.localeCompare(a.paid_on))[0];

      return {
        ...c,
        show_up_rate_pct: ratePct,
        membership_status: !latestPay ? 'never_paid' : (latestPay.expires_on && latestPay.expires_on < format(new Date(), 'yyyy-MM-dd') ? 'expired' : 'active'),
        expires_on: latestPay?.expires_on
      } as any;
    });
  },

  async getMemberById(id: string): Promise<Client | undefined> {
    const members = await this.getMembers();
    return members.find(m => m.id === id);
  },

  async addMember(input: Omit<Client, 'id' | 'member_code' | 'created_at'>, healthNotes?: string): Promise<Client> {
    const nextNum = local.clients.length + 1;
    const member_code = `PFFI${String(nextNum).padStart(3, '0')}`;
    const newClient: Client = {
      ...input,
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      member_code,
      created_at: new Date().toISOString()
    };
    local.clients.push(newClient);

    if (healthNotes) {
      local.healthScreenings.push({
        id: 'hs_' + Math.random().toString(36).substring(2, 9),
        client_id: newClient.id,
        screened_on: format(new Date(), 'yyyy-MM-dd'),
        conditions: ['Screened on intake'],
        notes: healthNotes
      });
    }

    local.save();
    return newClient;
  },

  async importMembersCsv(rawRows: Array<{ full_name: string; phone?: string; area?: string; age?: string }>): Promise<{ importedCount: number; duplicateCount: number }> {
    let importedCount = 0;
    let duplicateCount = 0;

    rawRows.forEach(row => {
      // Phone normalization: convert e.g. 772123456 to +256772123456
      let phone = row.phone ? row.phone.trim().replace(/\s+/g, '') : '';
      if (phone && !phone.startsWith('+')) {
        if (phone.startsWith('0')) phone = phone.substring(1);
        phone = `+256${phone}`;
      }

      const isDup = local.clients.some(c =>
        (phone && c.phone === phone) ||
        c.full_name.toLowerCase() === row.full_name.toLowerCase().trim()
      );

      if (isDup) {
        duplicateCount++;
      } else {
        const nextNum = local.clients.length + 1;
        local.clients.push({
          id: 'm_' + Math.random().toString(36).substring(2, 9),
          member_code: `PFFI${String(nextNum).padStart(3, '0')}`,
          full_name: row.full_name.trim(),
          status: 'active',
          phone: phone || undefined,
          area: row.area?.trim() || 'Kampala',
          age_at_joining: row.age ? parseInt(row.age, 10) : undefined,
          date_joined: format(new Date(), 'yyyy-MM-dd'),
          goals: ['Fitness'],
          level: 'A',
          consent_given_at: new Date().toISOString()
        });
        importedCount++;
      }
    });

    local.save();
    return { importedCount, duplicateCount };
  },

  // --- Attendance & Sessions ---
  async getSessions(): Promise<Session[]> {
    return local.sessions.sort((a, b) => b.session_date.localeCompare(a.session_date));
  },

  async getSessionDetails(sessionId: string): Promise<{ session: Session; attendedClientIds: string[] }> {
    const session = local.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    const attendedClientIds = local.attendance.filter(a => a.session_id === sessionId).map(a => a.client_id);
    return { session, attendedClientIds };
  },

  async startTodaySession(coachId?: string, title?: string): Promise<Session> {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let existing = local.sessions.find(s => s.session_date === todayStr);
    if (existing) return existing;

    const coach = local.coaches.find(c => c.id === coachId) || local.coaches[0];
    const newSession: Session = {
      id: 'sess_' + Math.random().toString(36).substring(2, 9),
      session_date: todayStr,
      start_time: '07:00',
      coach_id: coach?.id,
      coach_name: coach?.full_name,
      title: title || `PFFI Morning Training (${format(new Date(), 'EEE, MMM d')})`,
      attended_count: 0
    };
    local.sessions.unshift(newSession);
    local.save();
    return newSession;
  },

  async toggleAttendance(sessionId: string, clientId: string, present: boolean): Promise<number> {
    const index = local.attendance.findIndex(a => a.session_id === sessionId && a.client_id === clientId);
    if (present && index === -1) {
      local.attendance.push({ session_id: sessionId, client_id: clientId });
    } else if (!present && index !== -1) {
      local.attendance.splice(index, 1);
    }
    const count = local.attendance.filter(a => a.session_id === sessionId).length;
    const s = local.sessions.find(sess => sess.id === sessionId);
    if (s) s.attended_count = count;
    local.save();
    return count;
  },

  // --- Plans & Payments ---
  async getPlans(): Promise<Plan[]> {
    return local.plans;
  },

  async getPayments(): Promise<Payment[]> {
    return local.payments.map(p => {
      const client = local.clients.find(c => c.id === p.client_id);
      const plan = local.plans.find(pl => pl.id === p.plan_id);
      return {
        ...p,
        client_name: client?.full_name || 'Member',
        plan_name: plan?.name || 'Monthly Plan'
      };
    }).sort((a, b) => b.paid_on.localeCompare(a.paid_on));
  },

  async recordPayment(input: { clientId: string; planId: string; amountUgx: number; paidOn: string; expiresOn?: string; method: string; notes?: string }): Promise<Payment> {
    const response = await defaultPaymentProvider.createPaymentRequest({
      clientId: input.clientId,
      planId: input.planId,
      amountUgx: input.amountUgx,
      method: input.method,
      notes: input.notes
    });

    const client = local.clients.find(c => c.id === input.clientId);
    const plan = local.plans.find(p => p.id === input.planId);

    const newPayment: Payment = {
      id: response.paymentId,
      client_id: input.clientId,
      client_name: client?.full_name,
      plan_id: input.planId,
      plan_name: plan?.name,
      amount_ugx: input.amountUgx,
      paid_on: input.paidOn,
      expires_on: input.expiresOn || format(addDays(parseISO(input.paidOn), 30), 'yyyy-MM-dd'),
      method: input.method,
      status: response.status,
      provider_ref: response.providerRef,
      notes: input.notes,
      created_at: new Date().toISOString()
    };

    local.payments.unshift(newPayment);
    local.save();
    return newPayment;
  },

  // --- Assessments ---
  async getAssessments(clientId?: string): Promise<Assessment[]> {
    let list = local.assessments;
    if (clientId) {
      list = list.filter(a => a.client_id === clientId);
    }
    return list.map(a => {
      const client = local.clients.find(c => c.id === a.client_id);
      return { ...a, client_name: client?.full_name };
    }).sort((a, b) => b.assessed_on.localeCompare(a.assessed_on));
  },

  async addAssessment(input: Omit<Assessment, 'id' | 'bmi'>): Promise<Assessment> {
    let bmi: number | undefined = undefined;
    if (input.height_cm && input.weight_kg && input.height_cm > 0) {
      const hM = input.height_cm / 100;
      bmi = parseFloat((input.weight_kg / (hM * hM)).toFixed(1));
    }
    const newAss: Assessment = {
      ...input,
      id: 'ass_' + Math.random().toString(36).substring(2, 9),
      bmi
    };
    local.assessments.unshift(newAss);
    local.save();
    return newAss;
  },

  // --- Health Screenings (Admin Only) ---
  async getHealthScreening(clientId: string): Promise<HealthScreening | undefined> {
    return local.healthScreenings.find(h => h.client_id === clientId);
  },

  // --- Operations (Finance, Coaches, Equipment, Content, Targets) ---
  async getTransactions(): Promise<Transaction[]> {
    return local.transactions.sort((a, b) => b.txn_date.localeCompare(a.txn_date));
  },

  async addTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTxn: Transaction = {
      ...input,
      id: 'txn_' + Math.random().toString(36).substring(2, 9)
    };
    local.transactions.unshift(newTxn);
    local.save();
    return newTxn;
  },

  async getCoaches(): Promise<Coach[]> {
    return local.coaches;
  },

  async addCoach(input: Omit<Coach, 'id'>): Promise<Coach> {
    const newCoach: Coach = {
      ...input,
      id: 'c_' + Math.random().toString(36).substring(2, 9)
    };
    local.coaches.push(newCoach);
    local.save();
    return newCoach;
  },

  async getCoachReviews(): Promise<CoachReview[]> {
    return local.coachReviews.map(r => {
      const c = local.coaches.find(ch => ch.id === r.coach_id);
      return { ...r, coach_name: c?.full_name };
    });
  },

  async addCoachReview(input: Omit<CoachReview, 'id'>): Promise<CoachReview> {
    const newRev: CoachReview = {
      ...input,
      id: 'cr_' + Math.random().toString(36).substring(2, 9)
    };
    local.coachReviews.unshift(newRev);
    local.save();
    return newRev;
  },

  async getContentPosts(): Promise<ContentPost[]> {
    return local.contentPosts;
  },

  async toggleContentPosted(id: string): Promise<void> {
    const p = local.contentPosts.find(post => post.id === id);
    if (p) p.posted = !p.posted;
    local.save();
  },

  async getEquipmentNeeds(): Promise<EquipmentNeed[]> {
    return local.equipmentNeeds;
  },

  async toggleEquipmentResolved(id: string): Promise<void> {
    const eq = local.equipmentNeeds.find(e => e.id === id);
    if (eq) eq.resolved = !eq.resolved;
    local.save();
  },

  async addEquipmentNeed(input: Omit<EquipmentNeed, 'id' | 'resolved' | 'created_at'>): Promise<EquipmentNeed> {
    const newEq: EquipmentNeed = {
      ...input,
      id: 'eq_' + Math.random().toString(36).substring(2, 9),
      resolved: false,
      created_at: new Date().toISOString()
    };
    local.equipmentNeeds.push(newEq);
    local.save();
    return newEq;
  },

  async getTargets(): Promise<Target[]> {
    return local.targets;
  },

  async updateTarget(metric: Target['metric'], goal: number): Promise<void> {
    const t = local.targets.find(tg => tg.metric === metric);
    if (t) t.goal = goal;
    local.save();
  }
};
