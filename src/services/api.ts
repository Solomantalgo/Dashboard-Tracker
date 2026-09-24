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
import { format, subDays, addDays, parseISO, differenceInDays } from 'date-fns';

// In-Memory & LocalStorage State (Fallback Demo Mode)
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
  userRoles: { user_id: string; role: 'admin' | 'coach' | 'client'; email?: string }[] = [];

  constructor() {
    this.load();
  }

  load() {
    const saved = localStorage.getItem('pffi_local_db_v2');
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
        this.userRoles = parsed.userRoles || [
          { user_id: 'm1_auth', role: 'client', email: 'robert@pffi.ug' },
          { user_id: 'c1_auth', role: 'coach', email: 'david@pffi.ug' },
          { user_id: 'admin_auth', role: 'admin', email: 'owner@pffi.ug' }
        ];
        return;
      } catch (e) {
        console.error('Failed to parse local PFFI storage:', e);
      }
    }
    // Seed defaults
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
    this.userRoles = [
      { user_id: 'm1_auth', role: 'client', email: 'robert@pffi.ug' },
      { user_id: 'c1_auth', role: 'coach', email: 'david@pffi.ug' },
      { user_id: 'admin_auth', role: 'admin', email: 'owner@pffi.ug' }
    ];
    this.save();
  }

  save() {
    localStorage.setItem('pffi_local_db_v2', JSON.stringify({
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
      userRoles: this.userRoles
    }));
  }
}

const local = new LocalState();

export const api = {
  // --- Dashboard Metrics & Calculated Views ---
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    if (isSupabaseConfigured && supabase) {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const startOfWeek = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        const startOfMonth = format(new Date(), 'yyyy-MM-01');

        const [
          { count: activeMembers },
          { data: attData },
          { data: showUpView },
          { data: paymentsMtd },
          { data: statusView },
          { data: atRiskView },
          { count: equipmentCount }
        ] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('attendance').select('session_id, sessions!inner(session_date)').gte('sessions.session_date', startOfWeek),
          supabase.from('v_attendance_rate_30d').select('show_up_rate_pct'),
          supabase.from('payments').select('amount_ugx').eq('status', 'confirmed').gte('paid_on', startOfMonth),
          supabase.from('v_membership_status').select('*'),
          supabase.from('v_at_risk_clients').select('*'),
          supabase.from('equipment_needs').select('*', { count: 'exact', head: true }).eq('resolved', false)
        ]);

        const checkinsThisWeek = attData?.length || 0;

        let totalRates = 0;
        let validRateCount = 0;
        showUpView?.forEach(r => {
          if (r.show_up_rate_pct !== null && r.show_up_rate_pct !== undefined) {
            totalRates += Number(r.show_up_rate_pct);
            validRateCount++;
          }
        });
        const showUpRatePct = validRateCount > 0 ? Math.round(totalRates / validRateCount) : 0;

        const revenueMtdUgx = paymentsMtd?.reduce((sum, p) => sum + (p.amount_ugx || 0), 0) || 0;

        let expiredCount = 0;
        let expiringCount = 0;
        let outstandingUgx = 0;

        statusView?.forEach(s => {
          if (s.membership_status === 'expired' || s.membership_status === 'never_paid') {
            expiredCount++;
            outstandingUgx += 50000;
          } else if (s.expires_on) {
            const diffDays = differenceInDays(parseISO(s.expires_on), new Date());
            if (diffDays <= 7 && diffDays >= 0) {
              expiringCount++;
            }
          }
        });

        return {
          activeMembers: activeMembers || 0,
          checkinsThisWeek,
          showUpRatePct,
          revenueMtdUgx,
          outstandingUgx,
          expiredCount,
          expiringCount,
          stoppedComingCount: atRiskView?.length || 0,
          equipmentNeedsCount: equipmentCount || 0
        };
      } catch (err) {
        console.warn('Supabase metric query failed, falling back to local calculation:', err);
      }
    }

    // Local Fallback Calculation
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const startOfWeek = subDays(today, 7);
    const startOf30Days = subDays(today, 30);
    const startOfMonth = format(today, 'yyyy-MM-01');

    const activeMembers = local.clients.filter(c => c.status === 'active').length;

    const weekSessions = local.sessions.filter(s => parseISO(s.session_date) >= startOfWeek);
    const weekSessionIds = new Set(weekSessions.map(s => s.id));
    const checkinsThisWeek = local.attendance.filter(a => weekSessionIds.has(a.session_id)).length;

    const recentSessions = local.sessions.filter(s => parseISO(s.session_date) >= startOf30Days);
    const recentSessionIds = new Set(recentSessions.map(s => s.id));
    const totalPossible = activeMembers * Math.max(1, recentSessions.length);
    const actualAttended = local.attendance.filter(a => recentSessionIds.has(a.session_id)).length;
    const showUpRatePct = totalPossible > 0 ? Math.round((actualAttended / totalPossible) * 100) : 0;

    const revenueMtdUgx = local.payments
      .filter(p => p.status === 'confirmed' && p.paid_on >= startOfMonth)
      .reduce((sum, p) => sum + p.amount_ugx, 0);

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
  async getMembers(includeInactive = false): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('clients').select('*, coaches(full_name)');
        if (!includeInactive) {
          query = query.eq('status', 'active');
        }
        const { data: clientsData, error } = await query;
        if (error) throw error;

        const [{ data: showUpData }, { data: statusData }] = await Promise.all([
          supabase.from('v_attendance_rate_30d').select('*'),
          supabase.from('v_membership_status').select('*')
        ]);

        const showUpMap = new Map(showUpData?.map(s => [s.client_id, s.show_up_rate_pct]) || []);
        const statusMap = new Map(statusData?.map(s => [s.client_id, s]) || []);

        return (clientsData || []).map(c => {
          const statusRow = statusMap.get(c.id);
          return {
            ...c,
            coach_name: c.coaches?.full_name,
            show_up_rate_pct: showUpMap.get(c.id) ?? 0,
            membership_status: statusRow?.membership_status || 'never_paid',
            expires_on: statusRow?.expires_on
          };
        });
      } catch (err) {
        console.warn('Supabase fetch members failed, falling back to local state:', err);
      }
    }

    let list = local.clients;
    if (!includeInactive) {
      list = list.filter(c => c.status === 'active');
    }

    return list.map(c => {
      const coach = local.coaches.find(ch => ch.id === c.coach_id);
      const startOf30Days = subDays(new Date(), 30);
      const recentSessions = local.sessions.filter(s => parseISO(s.session_date) >= startOf30Days);
      const recentSessionIds = new Set(recentSessions.map(s => s.id));
      const attendedCount = local.attendance.filter(a => a.client_id === c.id && recentSessionIds.has(a.session_id)).length;
      const ratePct = recentSessions.length > 0 ? Math.round((attendedCount / recentSessions.length) * 100) : 0;

      const latestPay = local.payments
        .filter(p => p.client_id === c.id && p.status === 'confirmed')
        .sort((a, b) => b.paid_on.localeCompare(a.paid_on))[0];

      return {
        ...c,
        coach_name: coach?.full_name,
        show_up_rate_pct: ratePct,
        membership_status: !latestPay ? 'never_paid' : (latestPay.expires_on && latestPay.expires_on < format(new Date(), 'yyyy-MM-dd') ? 'expired' : 'active'),
        expires_on: latestPay?.expires_on
      } as any;
    });
  },

  async getMemberById(id: string): Promise<Client | undefined> {
    const members = await this.getMembers(true);
    return members.find(m => m.id === id);
  },

  async addMember(input: Omit<Client, 'id' | 'member_code' | 'created_at'>, healthNotes?: string): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true });
      const nextNum = (count || 0) + 1;
      const member_code = `PFFI${String(nextNum).padStart(3, '0')}`;

      const insertData = {
        member_code,
        full_name: input.full_name,
        status: input.status || 'active',
        phone: input.phone,
        area: input.area,
        age_at_joining: input.age_at_joining,
        date_joined: input.date_joined || format(new Date(), 'yyyy-MM-dd'),
        coach_id: input.coach_id || null,
        goals: input.goals || ['Fitness'],
        level: input.level || 'A',
        consent_given_at: input.consent_given_at || new Date().toISOString()
      };

      const { data, error } = await supabase.from('clients').insert(insertData).select().single();
      if (error) throw error;

      if (healthNotes && data?.id) {
        await supabase.from('health_screenings').insert({
          client_id: data.id,
          conditions: ['Screened on intake'],
          notes: healthNotes
        });
      }
      return data;
    }

    const nextNum = local.clients.length + 1;
    const member_code = `PFFI${String(nextNum).padStart(3, '0')}`;
    const newClient: Client = {
      ...input,
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      member_code,
      status: input.status || 'active',
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

  async deactivateMember(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('clients').update({ status: 'inactive' }).eq('id', id);
      if (error) throw error;
      return;
    }
    const c = local.clients.find(item => item.id === id);
    if (c) c.status = 'inactive';
    local.save();
  },

  async reactivateMember(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('clients').update({ status: 'active' }).eq('id', id);
      if (error) throw error;
      return;
    }
    const c = local.clients.find(item => item.id === id);
    if (c) c.status = 'active';
    local.save();
  },

  async permanentlyDeleteMember(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    local.clients = local.clients.filter(c => c.id !== id);
    local.attendance = local.attendance.filter(a => a.client_id !== id);
    local.payments = local.payments.filter(p => p.client_id !== id);
    local.assessments = local.assessments.filter(a => a.client_id !== id);
    local.healthScreenings = local.healthScreenings.filter(h => h.client_id !== id);
    local.save();
  },

  async importMembersCsv(rawRows: Array<{ full_name: string; phone?: string; area?: string; age?: string }>): Promise<{ importedCount: number; duplicateCount: number }> {
    let importedCount = 0;
    let duplicateCount = 0;

    const existingMembers = await this.getMembers(true);

    for (const row of rawRows) {
      let phone = row.phone ? row.phone.trim().replace(/\s+/g, '') : '';
      if (phone && !phone.startsWith('+')) {
        if (phone.startsWith('0')) phone = phone.substring(1);
        phone = `+256${phone}`;
      }

      const isDup = existingMembers.some(c =>
        (phone && c.phone === phone) ||
        c.full_name.toLowerCase() === row.full_name.toLowerCase().trim()
      );

      if (isDup) {
        duplicateCount++;
      } else {
        await this.addMember({
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
    }

    return { importedCount, duplicateCount };
  },

  // --- Attendance & Sessions ---
  async getSessions(): Promise<Session[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('sessions').select('*, coaches(full_name)').order('session_date', { ascending: false });
      if (!error) {
        const { data: attData, error: attendanceError } = await supabase.from('attendance').select('session_id');
        if (attendanceError) {
          console.error('getSessions attendance counts failed; returning real sessions with zero counts:', attendanceError);
        }
        const countMap = new Map<string, number>();
        attData?.forEach(a => countMap.set(a.session_id, (countMap.get(a.session_id) || 0) + 1));

        return (data ?? []).map(s => ({
          ...s,
          coach_name: s.coaches?.full_name,
          attended_count: countMap.get(s.id) || 0
        }));
      }
      console.error('getSessions failed, falling back to local data:', error);
    }
    return local.sessions.sort((a, b) => b.session_date.localeCompare(a.session_date));
  },

  async getSessionDetails(sessionId: string): Promise<{ session: Session; attendedClientIds: string[] }> {
    if (isSupabaseConfigured && supabase) {
      const { data: session, error } = await supabase.from('sessions').select('*, coaches(full_name)').eq('id', sessionId).single();
      if (error || !session) throw new Error('Session not found');

      const { data: att } = await supabase.from('attendance').select('client_id').eq('session_id', sessionId);
      return {
        session: { ...session, coach_name: session.coaches?.full_name },
        attendedClientIds: att?.map(a => a.client_id) || []
      };
    }

    const session = local.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    const attendedClientIds = local.attendance.filter(a => a.session_id === sessionId).map(a => a.client_id);
    return { session, attendedClientIds };
  },

  async startTodaySession(coachId?: string, title?: string): Promise<Session> {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase.from('sessions').select('*').eq('session_date', todayStr).maybeSingle();
      if (existing) return existing;

      const coaches = await this.getCoaches();
      const selectedCoachId = coachId || coaches[0]?.id;

      const { data, error } = await supabase.from('sessions').insert({
        session_date: todayStr,
        start_time: '07:00:00',
        coach_id: selectedCoachId,
        title: title || `PFFI Morning Training (${format(new Date(), 'EEE, MMM d')})`
      }).select().single();

      if (error) throw error;
      return data;
    }

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
    if (isSupabaseConfigured && supabase) {
      if (present) {
        await supabase.from('attendance').upsert({ session_id: sessionId, client_id: clientId });
      } else {
        await supabase.from('attendance').delete().eq('session_id', sessionId).eq('client_id', clientId);
      }
      const { count } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('session_id', sessionId);
      return count || 0;
    }

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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('plans').select('*').eq('active', true);
      if (error) {
        console.error('getPlans failed, falling back to local data:', error);
        return local.plans;
      }
      return data ?? [];
    }
    return local.plans;
  },

  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('payments').select('*, clients(full_name), plans(name)').order('paid_on', { ascending: false });
      if (error) {
        console.error('getPayments failed, falling back to local data:', error);
        return local.payments.map(p => {
          const client = local.clients.find(c => c.id === p.client_id);
          const plan = local.plans.find(pl => pl.id === p.plan_id);
          return { ...p, client_name: client?.full_name || 'Member', plan_name: plan?.name || 'Plan' };
        });
      }
      return (data ?? []).map(p => ({
        ...p,
        client_name: p.clients?.full_name,
        plan_name: p.plans?.name
      }));
    }
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

    const expiresOn = input.expiresOn || format(addDays(parseISO(input.paidOn), 30), 'yyyy-MM-dd');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('payments').insert({
        client_id: input.clientId,
        plan_id: input.planId,
        amount_ugx: input.amountUgx,
        paid_on: input.paidOn,
        expires_on: expiresOn,
        method: input.method,
        status: response.status,
        provider_ref: response.providerRef,
        notes: input.notes
      }).select('*, clients(full_name), plans(name)').single();

      if (error) throw error;
      return {
        ...data,
        client_name: data.clients?.full_name,
        plan_name: data.plans?.name
      };
    }

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
      expires_on: expiresOn,
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
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('assessments').select('*, clients(full_name)').order('assessed_on', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) {
        console.error('getAssessments failed, falling back to local data:', error);
        let fallback = local.assessments;
        if (clientId) fallback = fallback.filter(a => a.client_id === clientId);
        return fallback.map(a => ({ ...a, client_name: local.clients.find(c => c.id === a.client_id)?.full_name }))
          .sort((a, b) => b.assessed_on.localeCompare(a.assessed_on));
      }
      return (data ?? []).map(a => ({ ...a, client_name: a.clients?.full_name }));
    }

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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('assessments').insert({
        client_id: input.client_id,
        assessed_on: input.assessed_on || format(new Date(), 'yyyy-MM-dd'),
        height_cm: input.height_cm,
        weight_kg: input.weight_kg,
        waist_cm: input.waist_cm,
        pushups: input.pushups,
        pushups_proper_form: input.pushups_proper_form,
        plank_seconds: input.plank_seconds,
        run_time_seconds: input.run_time_seconds,
        notes: input.notes
      }).select('*, clients(full_name)').single();
      if (error) throw error;
      return { ...data, client_name: data.clients?.full_name };
    }

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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('health_screenings').select('*').eq('client_id', clientId).maybeSingle();
      if (error) {
        console.error('getHealthScreening failed, falling back to local data:', error);
        return local.healthScreenings.find(h => h.client_id === clientId);
      }
      return data ?? undefined;
    }
    return local.healthScreenings.find(h => h.client_id === clientId);
  },

  // --- Operations (Finance, Coaches, Equipment, Content, Targets) ---
  async getTransactions(): Promise<Transaction[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('transactions').select('*').order('txn_date', { ascending: false });
      if (error) {
        console.error('getTransactions failed, falling back to local data:', error);
        return local.transactions.sort((a, b) => b.txn_date.localeCompare(a.txn_date));
      }
      return data ?? [];
    }
    return local.transactions.sort((a, b) => b.txn_date.localeCompare(a.txn_date));
  },

  async addTransaction(input: Omit<Transaction, 'id'>): Promise<Transaction> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('transactions').insert(input).select().single();
      if (error) throw error;
      return data;
    }
    const newTxn: Transaction = {
      ...input,
      id: 'txn_' + Math.random().toString(36).substring(2, 9)
    };
    local.transactions.unshift(newTxn);
    local.save();
    return newTxn;
  },

  async getCoaches(): Promise<Coach[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('coaches').select('*').eq('active', true);
      if (error) {
        console.error('getCoaches failed, falling back to local data:', error);
        return local.coaches;
      }
      return data ?? [];
    }
    return local.coaches;
  },

  async addCoach(input: Omit<Coach, 'id'>): Promise<Coach> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('coaches').insert(input).select().single();
      if (error) throw error;
      return data;
    }
    const newCoach: Coach = {
      ...input,
      id: 'c_' + Math.random().toString(36).substring(2, 9)
    };
    local.coaches.push(newCoach);
    local.save();
    return newCoach;
  },

  async getCoachReviews(): Promise<CoachReview[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('coach_reviews').select('*, coaches(full_name)').order('reviewed_on', { ascending: false });
      if (error) {
        console.error('getCoachReviews failed, falling back to local data:', error);
        return local.coachReviews.map(r => ({ ...r, coach_name: local.coaches.find(ch => ch.id === r.coach_id)?.full_name }));
      }
      return (data ?? []).map(r => ({ ...r, coach_name: r.coaches?.full_name }));
    }
    return local.coachReviews.map(r => {
      const c = local.coaches.find(ch => ch.id === r.coach_id);
      return { ...r, coach_name: c?.full_name };
    });
  },

  async addCoachReview(input: Omit<CoachReview, 'id'>): Promise<CoachReview> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('coach_reviews').insert(input).select('*, coaches(full_name)').single();
      if (error) throw error;
      return { ...data, coach_name: data.coaches?.full_name };
    }
    const newRev: CoachReview = {
      ...input,
      id: 'cr_' + Math.random().toString(36).substring(2, 9)
    };
    local.coachReviews.unshift(newRev);
    local.save();
    return newRev;
  },

  async getContentPosts(): Promise<ContentPost[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('content_posts').select('*').order('post_date', { ascending: false });
      if (error) {
        console.error('getContentPosts failed, falling back to local data:', error);
        return local.contentPosts;
      }
      return data ?? [];
    }
    return local.contentPosts;
  },

  async toggleContentPosted(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: post } = await supabase.from('content_posts').select('posted').eq('id', id).single();
      if (post) {
        await supabase.from('content_posts').update({ posted: !post.posted }).eq('id', id);
      }
      return;
    }
    const p = local.contentPosts.find(post => post.id === id);
    if (p) p.posted = !p.posted;
    local.save();
  },

  async getEquipmentNeeds(): Promise<EquipmentNeed[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('equipment_needs').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('getEquipmentNeeds failed, falling back to local data:', error);
        return local.equipmentNeeds;
      }
      return data ?? [];
    }
    return local.equipmentNeeds;
  },

  async toggleEquipmentResolved(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: eq } = await supabase.from('equipment_needs').select('resolved').eq('id', id).single();
      if (eq) {
        await supabase.from('equipment_needs').update({ resolved: !eq.resolved }).eq('id', id);
      }
      return;
    }
    const eq = local.equipmentNeeds.find(e => e.id === id);
    if (eq) eq.resolved = !eq.resolved;
    local.save();
  },

  async addEquipmentNeed(input: Omit<EquipmentNeed, 'id' | 'resolved' | 'created_at'>): Promise<EquipmentNeed> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('equipment_needs').insert({
        item: input.item,
        quantity: input.quantity,
        priority: input.priority,
        notes: input.notes
      }).select().single();
      if (error) throw error;
      return data;
    }
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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('targets').select('*');
      if (error) {
        console.error('getTargets failed, falling back to local data:', error);
        return local.targets;
      }
      return data ?? [];
    }
    return local.targets;
  },

  async updateTarget(metric: Target['metric'], goal: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('targets').upsert({ metric, goal });
      return;
    }
    const t = local.targets.find(tg => tg.metric === metric);
    if (t) t.goal = goal;
    local.save();
  },

  // --- Invite & Portal Management (Bug 5) ---
  async inviteClientToPortal(clientId: string, email: string): Promise<{ success: boolean; tempPassword?: string }> {
    const tempPassword = `Pffi#${Math.random().toString(36).slice(-6)}`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, targetType: 'client', targetId: clientId }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unable to create member portal access.');
      return data;
    }

    const mockUserId = `auth_client_${clientId}`;
    local.userRoles.push({ user_id: mockUserId, role: 'client', email });
    const c = local.clients.find(item => item.id === clientId);
    if (c) c.user_id = mockUserId;
    local.save();

    return { success: true, tempPassword };
  },

  async resetClientPassword(clientId: string): Promise<{ success: boolean; tempPassword?: string }> {
    const tempPassword = `Pffi#${Math.random().toString(36).slice(-6)}`;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'reset', targetType: 'client', targetId: clientId }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unable to reset the member password.');
      return data;
    }
    return { success: true, tempPassword };
  },

  async revokeClientPortalAccess(clientId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: c } = await supabase.from('clients').select('user_id').eq('id', clientId).single();
      if (c?.user_id) {
        await supabase.from('user_roles').delete().eq('user_id', c.user_id);
        await supabase.from('clients').update({ user_id: null }).eq('id', clientId);
      }
      return;
    }
    const c = local.clients.find(item => item.id === clientId);
    if (c?.user_id) {
      local.userRoles = local.userRoles.filter(r => r.user_id !== c.user_id);
      c.user_id = undefined;
      local.save();
    }
  },

  async inviteCoachToPortal(coachId: string, email: string): Promise<{ success: boolean; tempPassword?: string }> {
    const tempPassword = `Coach#${Math.random().toString(36).slice(-6)}`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, targetType: 'coach', targetId: coachId }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unable to create coach portal access.');
      return data;
    }

    const mockUserId = `auth_coach_${coachId}`;
    local.userRoles.push({ user_id: mockUserId, role: 'coach', email });
    const ch = local.coaches.find(item => item.id === coachId);
    if (ch) ch.user_id = mockUserId;
    local.save();

    return { success: true, tempPassword };
  },

  async resetCoachPassword(coachId: string): Promise<{ success: boolean; tempPassword?: string }> {
    const tempPassword = `Coach#${Math.random().toString(36).slice(-6)}`;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { action: 'reset', targetType: 'coach', targetId: coachId }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unable to reset the coach password.');
      return data;
    }
    return { success: true, tempPassword };
  },

  async revokeCoachPortalAccess(coachId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { data: ch } = await supabase.from('coaches').select('user_id').eq('id', coachId).single();
      if (ch?.user_id) {
        await supabase.from('user_roles').delete().eq('user_id', ch.user_id);
        await supabase.from('coaches').update({ user_id: null }).eq('id', coachId);
      }
      return;
    }
    const ch = local.coaches.find(item => item.id === coachId);
    if (ch?.user_id) {
      local.userRoles = local.userRoles.filter(r => r.user_id !== ch.user_id);
      ch.user_id = undefined;
      local.save();
    }
  }
};
