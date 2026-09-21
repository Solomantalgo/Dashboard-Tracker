import {
  Client, Coach, Plan, Payment, Session, Assessment, Transaction,
  CoachReview, ContentPost, EquipmentNeed, Target, HealthScreening
} from '../types/database';
import { format, subDays, addDays } from 'date-fns';

const today = new Date();
const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const mockCoaches: Coach[] = [
  { id: 'c1', full_name: 'Coach Alex Ssemwanga', phone: '+256772123456', active: true },
  { id: 'c2', full_name: 'Coach Brenda Kigozi', phone: '+256701987654', active: true }
];

export const mockPlans: Plan[] = [
  { id: 'p1', name: 'Monthly Membership', type: 'monthly', price_ugx: 50000, duration_days: 30, active: true },
  { id: 'p2', name: '10-Session Pass', type: 'session_pass', price_ugx: 40000, session_count: 10, active: true }
];

export const mockClients: Client[] = [
  {
    id: 'm1', member_code: 'PFFI001', full_name: 'Robert Mackay', status: 'active',
    phone: '+256772999001', area: 'Kizungu, Kampala', age_at_joining: 32, date_joined: '2024-01-15',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Weight Loss', 'Fitness'], level: 'B',
    consent_given_at: '2024-01-15T08:00:00Z', created_at: '2024-01-15'
  },
  {
    id: 'm2', member_code: 'PFFI002', full_name: 'Grace Namubiru', status: 'active',
    phone: '+256701888002', area: 'Muyenga, Kampala', age_at_joining: 28, date_joined: '2024-02-01',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Fitness', 'Performance'], level: 'A',
    consent_given_at: '2024-02-01T08:00:00Z', created_at: '2024-02-01'
  },
  {
    id: 'm3', member_code: 'PFFI003', full_name: 'David Kizza', status: 'active',
    phone: '+256782777003', area: 'Kabalagala, Kampala', age_at_joining: 35, date_joined: '2024-01-10',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Muscle Gain', 'Fitness'], level: 'C',
    consent_given_at: '2024-01-10T08:00:00Z', created_at: '2024-01-10'
  },
  {
    id: 'm4', member_code: 'PFFI004', full_name: 'Josephine Akello', status: 'active',
    phone: '+256753666004', area: 'Kansanga, Kampala', age_at_joining: 26, date_joined: '2024-03-05',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Weight Loss'], level: 'A',
    consent_given_at: '2024-03-05T08:00:00Z', created_at: '2024-03-05'
  },
  {
    id: 'm5', member_code: 'PFFI005', full_name: 'Patrick Musisi', status: 'active',
    phone: '+256774555005', area: 'Ggaba, Kampala', age_at_joining: 41, date_joined: '2023-11-20',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Fitness', 'Muscle Gain'], level: 'B',
    consent_given_at: '2023-11-20T08:00:00Z', created_at: '2023-11-20'
  },
  {
    id: 'm6', member_code: 'PFFI006', full_name: 'Sarah Tugume', status: 'active',
    phone: '+256702444006', area: 'Makindye, Kampala', age_at_joining: 30, date_joined: '2024-02-15',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Weight Loss', 'Fitness'], level: 'A',
    consent_given_at: '2024-02-15T08:00:00Z', created_at: '2024-02-15'
  },
  {
    id: 'm7', member_code: 'PFFI007', full_name: 'Brian Ochieng', status: 'active',
    phone: '+256781333007', area: 'Bukoto, Kampala', age_at_joining: 29, date_joined: '2024-01-22',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Performance', 'Muscle Gain'], level: 'C',
    consent_given_at: '2024-01-22T08:00:00Z', created_at: '2024-01-22'
  },
  {
    id: 'm8', member_code: 'PFFI008', full_name: 'Ritah Nanteza', status: 'active',
    phone: '+256750222008', area: 'Nsambya, Kampala', age_at_joining: 34, date_joined: '2024-03-01',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Weight Loss'], level: 'B',
    consent_given_at: '2024-03-01T08:00:00Z', created_at: '2024-03-01'
  },
  {
    id: 'm9', member_code: 'PFFI009', full_name: 'Emmanuel Mukasa', status: 'active',
    phone: '+256776111009', area: 'Kizungu, Kampala', age_at_joining: 38, date_joined: '2023-12-10',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Fitness'], level: 'B',
    consent_given_at: '2023-12-10T08:00:00Z', created_at: '2023-12-10'
  },
  {
    id: 'm10', member_code: 'PFFI010', full_name: 'Joan Nabirye', status: 'active',
    phone: '+256704000010', area: 'Muyenga, Kampala', age_at_joining: 27, date_joined: '2024-02-20',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Weight Loss', 'Fitness'], level: 'A',
    consent_given_at: '2024-02-20T08:00:00Z', created_at: '2024-02-20'
  },
  {
    id: 'm11', member_code: 'PFFI011', full_name: 'Dennis Tumusiime', status: 'active',
    phone: '+256788999011', area: 'Kabalagala, Kampala', age_at_joining: 36, date_joined: '2024-01-05',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Muscle Gain'], level: 'B',
    consent_given_at: '2024-01-05T08:00:00Z', created_at: '2024-01-05'
  },
  {
    id: 'm12', member_code: 'PFFI012', full_name: 'Agnes Mbabazi', status: 'active',
    phone: '+256755888012', area: 'Kansanga, Kampala', age_at_joining: 31, date_joined: '2024-03-10',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Fitness'], level: 'A',
    consent_given_at: '2024-03-10T08:00:00Z', created_at: '2024-03-10'
  },
  {
    id: 'm13', member_code: 'PFFI013', full_name: 'Isaac Kato', status: 'active',
    phone: '+256779777013', area: 'Ggaba, Kampala', age_at_joining: 25, date_joined: '2024-01-18',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Performance'], level: 'C',
    consent_given_at: '2024-01-18T08:00:00Z', created_at: '2024-01-18'
  },
  {
    id: 'm14', member_code: 'PFFI014', full_name: 'Claire Babirye', status: 'active',
    phone: '+256708666014', area: 'Makindye, Kampala', age_at_joining: 29, date_joined: '2024-02-12',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Weight Loss'], level: 'B',
    consent_given_at: '2024-02-12T08:00:00Z', created_at: '2024-02-12'
  },
  {
    id: 'm15', member_code: 'PFFI015', full_name: 'Geoffrey Wasswa', status: 'active',
    phone: '+256784555015', area: 'Bukoto, Kampala', age_at_joining: 39, date_joined: '2023-10-15',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Fitness'], level: 'B',
    consent_given_at: '2023-10-15T08:00:00Z', created_at: '2023-10-15'
  },
  {
    id: 'm16', member_code: 'PFFI016', full_name: 'Sandra Nalubega', status: 'active',
    phone: '+256752444016', area: 'Nsambya, Kampala', age_at_joining: 33, date_joined: '2024-01-30',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Weight Loss', 'Fitness'], level: 'A',
    consent_given_at: '2024-01-30T08:00:00Z', created_at: '2024-01-30'
  },
  {
    id: 'm17', member_code: 'PFFI017', full_name: 'Victor Kyagulanyi', status: 'active',
    phone: '+256773333017', area: 'Kizungu, Kampala', age_at_joining: 37, date_joined: '2024-02-25',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Muscle Gain', 'Performance'], level: 'B',
    consent_given_at: '2024-02-25T08:00:00Z', created_at: '2024-02-25'
  },
  {
    id: 'm18', member_code: 'PFFI018', full_name: 'Doreen Atuhaire', status: 'inactive',
    phone: '+256706222018', area: 'Muyenga, Kampala', age_at_joining: 35, date_joined: '2023-09-01',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Fitness'], level: 'A',
    consent_given_at: '2023-09-01T08:00:00Z', created_at: '2023-09-01'
  },
  {
    id: 'm19', member_code: 'PFFI019', full_name: 'Solomon Odhiambo', status: 'active',
    phone: '+256787111019', area: 'Kabalagala, Kampala', age_at_joining: 30, date_joined: '2024-03-12',
    coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', goals: ['Performance'], level: 'C',
    consent_given_at: '2024-03-12T08:00:00Z', created_at: '2024-03-12'
  },
  {
    id: 'm20', member_code: 'PFFI020', full_name: 'Fiona Birungi', status: 'active',
    phone: '+256759000020', area: 'Kansanga, Kampala', age_at_joining: 28, date_joined: '2024-03-15',
    coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', goals: ['Weight Loss'], level: 'A',
    consent_given_at: '2024-03-15T08:00:00Z', created_at: '2024-03-15'
  }
];

export const mockHealthScreenings: HealthScreening[] = [
  { id: 'hs1', client_id: 'm1', screened_on: '2024-01-15', conditions: ['Mild Asthma'], notes: 'Carries inhaler during outdoor cardio sessions.' },
  { id: 'hs2', client_id: 'm5', screened_on: '2023-11-20', conditions: ['Previous Knee Injury (Left)'], notes: 'Avoid deep jump squats without knee wraps.' }
];

export const mockPayments: Payment[] = [
  { id: 'pay1', client_id: 'm1', client_name: 'Robert Mackay', plan_id: 'p1', plan_name: 'Monthly Membership', amount_ugx: 50000, paid_on: formatDate(subDays(today, 5)), expires_on: formatDate(addDays(today, 25)), method: 'MTN MoMo', status: 'confirmed', provider_ref: 'MANUAL-001' },
  { id: 'pay2', client_id: 'm2', client_name: 'Grace Namubiru', plan_id: 'p1', plan_name: 'Monthly Membership', amount_ugx: 50000, paid_on: formatDate(subDays(today, 12)), expires_on: formatDate(addDays(today, 18)), method: 'Cash', status: 'confirmed', provider_ref: 'MANUAL-002' },
  { id: 'pay3', client_id: 'm3', client_name: 'David Kizza', plan_id: 'p1', plan_name: 'Monthly Membership', amount_ugx: 50000, paid_on: formatDate(subDays(today, 28)), expires_on: formatDate(addDays(today, 2)), method: 'Airtel Money', status: 'confirmed', provider_ref: 'MANUAL-003' },
  { id: 'pay4', client_id: 'm4', client_name: 'Josephine Akello', plan_id: 'p1', plan_name: 'Monthly Membership', amount_ugx: 50000, paid_on: formatDate(subDays(today, 45)), expires_on: formatDate(subDays(today, 15)), method: 'Cash', status: 'confirmed', provider_ref: 'MANUAL-004' },
  { id: 'pay5', client_id: 'm5', client_name: 'Patrick Musisi', plan_id: 'p1', plan_name: 'Monthly Membership', amount_ugx: 50000, paid_on: formatDate(subDays(today, 2)), expires_on: formatDate(addDays(today, 28)), method: 'Bank transfer', status: 'confirmed', provider_ref: 'MANUAL-005' },
  { id: 'pay6', client_id: 'm6', client_name: 'Sarah Tugume', plan_id: 'p1', plan_name: 'Monthly Membership', amount_ugx: 50000, paid_on: formatDate(subDays(today, 25)), expires_on: formatDate(addDays(today, 5)), method: 'MTN MoMo', status: 'confirmed', provider_ref: 'MANUAL-006' },
  { id: 'pay7', client_id: 'm7', client_name: 'Brian Ochieng', plan_id: 'p1', plan_name: 'Monthly Membership', amount_ugx: 50000, paid_on: formatDate(subDays(today, 10)), expires_on: formatDate(addDays(today, 20)), method: 'Airtel Money', status: 'confirmed', provider_ref: 'MANUAL-007' }
];

// Seed Sessions for the past 6 weeks (Monday - Thursday)
export const generateMockSessionsAndAttendance = () => {
  const sessions: Session[] = [];
  const attendance: { session_id: string; client_id: string }[] = [];
  
  let dateCursor = subDays(today, 42); // 6 weeks back
  let sessionIdCounter = 1;

  while (dateCursor <= today) {
    const dayOfWeek = dateCursor.getDay(); // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      const sId = `sess_${sessionIdCounter++}`;
      const sessionDateStr = formatDate(dateCursor);
      const coach = sessionIdCounter % 2 === 0 ? mockCoaches[0] : mockCoaches[1];
      
      let count = 0;
      // Randomly assign ~12-16 present members per session out of active members
      mockClients.filter(c => c.status === 'active').forEach(client => {
        // Robert Mackay (m1), Grace (m2), David (m3) attend ~90% of sessions
        const isRegular = ['m1', 'm2', 'm3', 'm5', 'm7', 'm9', 'm11', 'm13', 'm15', 'm17', 'm19'].includes(client.id);
        const chance = isRegular ? 0.88 : 0.45;
        if (Math.random() < chance) {
          attendance.push({ session_id: sId, client_id: client.id });
          count++;
        }
      });

      sessions.push({
        id: sId,
        session_date: sessionDateStr,
        start_time: '07:00',
        coach_id: coach.id,
        coach_name: coach.full_name,
        title: `PFFI Morning Group Training (${format(dateCursor, 'EEE, MMM d')})`,
        attended_count: count
      });
    }
    dateCursor = addDays(dateCursor, 1);
  }

  return { sessions, attendance };
};

const sessionData = generateMockSessionsAndAttendance();
export const mockSessions = sessionData.sessions;
export const mockAttendance = sessionData.attendance;

export const mockAssessments: Assessment[] = [
  { id: 'ass1', client_id: 'm1', client_name: 'Robert Mackay', assessed_on: formatDate(subDays(today, 60)), height_cm: 178, weight_kg: 86.5, waist_cm: 94, pushups: 22, pushups_proper_form: true, plank_seconds: 45, run_time_seconds: 360, bmi: 27.3, notes: 'Baseline intake assessment.' },
  { id: 'ass2', client_id: 'm1', client_name: 'Robert Mackay', assessed_on: formatDate(subDays(today, 10)), height_cm: 178, weight_kg: 82.0, waist_cm: 89, pushups: 35, pushups_proper_form: true, plank_seconds: 75, run_time_seconds: 300, bmi: 25.9, notes: 'Great progress in 1km sprint & pushup endurance.' },
  { id: 'ass3', client_id: 'm2', client_name: 'Grace Namubiru', assessed_on: formatDate(subDays(today, 40)), height_cm: 165, weight_kg: 68.0, waist_cm: 78, pushups: 15, pushups_proper_form: true, plank_seconds: 40, run_time_seconds: 410, bmi: 25.0, notes: 'Baseline assessment.' },
  { id: 'ass4', client_id: 'm2', client_name: 'Grace Namubiru', assessed_on: formatDate(subDays(today, 5)), height_cm: 165, weight_kg: 64.5, waist_cm: 74, pushups: 24, pushups_proper_form: true, plank_seconds: 65, run_time_seconds: 350, bmi: 23.7, notes: 'Noticeable waist trim & core strength.' }
];

export const mockTransactions: Transaction[] = [
  { id: 't1', txn_date: formatDate(subDays(today, 15)), type: 'expense', description: 'Resistance bands & cones replacement', amount_ugx: 120000 },
  { id: 't2', txn_date: formatDate(subDays(today, 8)), type: 'expense', description: 'Safe Fields Boston venue reservation fee', amount_ugx: 200000 },
  { id: 't3', txn_date: formatDate(subDays(today, 3)), type: 'revenue', description: 'Corporate wellness day session', amount_ugx: 350000 }
];

export const mockCoachReviews: CoachReview[] = [
  { id: 'cr1', coach_id: 'c1', coach_name: 'Coach Alex Ssemwanga', reviewed_on: formatDate(subDays(today, 7)), leadership: 5, session_quality: 5, punctuality: 4, attendance_tracking: 5, notes: 'Punctual, energetic sessions. Members love his encouragement.' },
  { id: 'cr2', coach_id: 'c2', coach_name: 'Coach Brenda Kigozi', reviewed_on: formatDate(subDays(today, 14)), leadership: 4, session_quality: 5, punctuality: 5, attendance_tracking: 4, notes: 'Strong focus on proper pushup form and injury prevention.' }
];

export const mockContentPosts: ContentPost[] = [
  { id: 'cp1', post_date: formatDate(subDays(today, 2)), platform: 'WhatsApp Status', content_type: 'Reel/Video', posted: true, notes: 'Monday 7am HIIT workout clip at Kizungu field.' },
  { id: 'cp2', post_date: formatDate(today), platform: 'Instagram', content_type: 'Photo', posted: false, notes: 'Member progress spotlight: Robert Mackay -4.5kg' }
];

export const mockEquipmentNeeds: EquipmentNeed[] = [
  { id: 'eq1', item: 'Heavy Kettlebells (16kg & 20kg)', quantity: 4, priority: 'high', resolved: false, notes: 'Required for advanced strength circuit.' },
  { id: 'eq2', item: 'Agility Ladders', quantity: 2, priority: 'normal', resolved: false, notes: 'For Thursday speed drills.' },
  { id: 'eq3', item: 'Stopwatches', quantity: 2, priority: 'low', resolved: true, notes: 'Purchased by Coach Alex.' }
];

export const mockTargets: Target[] = [
  { metric: 'active_members', goal: 25 },
  { metric: 'attendance_rate', goal: 80 },
  { metric: 'monthly_revenue', goal: 1000000 }
];
