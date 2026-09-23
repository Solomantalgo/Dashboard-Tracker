import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Client, Session, Assessment } from '../../types/database';
import { Calendar, CheckCircle2, User, Activity, LogOut, Plus, Search, Shield, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const CoachPortal: React.FC = () => {
  const { activeCoach, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [attendedClientIds, setAttendedClientIds] = useState<Set<string>>(new Set());
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientAssessments, setClientAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Assessment Modal state for coach
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assDate, setAssDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [pushups, setPushups] = useState('');
  const [plankSec, setPlankSec] = useState('');
  const [notes, setNotes] = useState('');

  const loadCoachData = async () => {
    setLoading(true);
    try {
      // 1. Get or start today's session
      const todaySession = await api.startTodaySession(activeCoach?.id);
      setSession(todaySession);

      if (todaySession) {
        const details = await api.getSessionDetails(todaySession.id);
        setAttendedClientIds(new Set(details.attendedClientIds));
      }

      // 2. Fetch clients assigned to this coach
      const allMembers = await api.getMembers(false);
      const myClients = allMembers.filter(m => !activeCoach || m.coach_id === activeCoach.id || isDemoMode);
      setAssignedClients(myClients);
    } catch (e) {
      console.error('Failed to load coach portal data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoachData();
  }, [activeCoach?.id]);

  const handleToggleAttendance = async (clientId: string) => {
    if (!session) return;
    const isPresent = attendedClientIds.has(clientId);
    const newPresent = !isPresent;

    // Optimistic UI update
    setAttendedClientIds(prev => {
      const next = new Set(prev);
      if (newPresent) next.add(clientId);
      else next.delete(clientId);
      return next;
    });

    try {
      await api.toggleAttendance(session.id, clientId, newPresent);
    } catch (err) {
      console.error('Failed to toggle attendance:', err);
      // Revert on error
      setAttendedClientIds(prev => {
        const next = new Set(prev);
        if (isPresent) next.add(clientId);
        else next.delete(clientId);
        return next;
      });
    }
  };

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    try {
      const assList = await api.getAssessments(client.id);
      setClientAssessments(assList);
    } catch (e) {
      console.error('Failed to fetch client assessments:', e);
    }
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      await api.addAssessment({
        client_id: selectedClient.id,
        assessed_on: assDate,
        height_cm: heightCm ? parseFloat(heightCm) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        waist_cm: waistCm ? parseFloat(waistCm) : undefined,
        pushups: pushups ? parseInt(pushups, 10) : undefined,
        plank_seconds: plankSec ? parseInt(plankSec, 10) : undefined,
        notes: notes || undefined
      });

      setShowAssessmentModal(false);
      // Refresh assessments
      const assList = await api.getAssessments(selectedClient.id);
      setClientAssessments(assList);
    } catch (err) {
      console.error('Failed to save assessment:', err);
    }
  };

  const filteredClients = assignedClients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.member_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#F5F6F8] pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0A0B10]/90 backdrop-blur-md border-b border-[#262A36] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500">
            {activeCoach?.full_name.substring(0, 2).toUpperCase() || 'CO'}
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading text-[#F5F6F8]">
              Coach Portal: {activeCoach?.full_name || 'Head Coach'}
            </h1>
            <p className="text-xs text-[#9AA1AE]">Outdoor Training • Kampala</p>
          </div>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          className="p-2 rounded-lg bg-[#12141B] border border-[#262A36] text-[#9AA1AE] hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Today's Session Card */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#DA0E19]" />
              <h2 className="font-bold text-base text-[#F5F6F8]">Today's Training Session</h2>
            </div>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {attendedClientIds.size} / {assignedClients.length} Attended
            </span>
          </div>

          <div className="text-xs text-[#9AA1AE]">
            {session?.title || `Morning Session (${format(new Date(), 'EEEE, dd MMM yyyy')})`}
          </div>

          {/* Quick Attendance Checklist */}
          <div className="divide-y divide-[#262A36] border border-[#262A36] rounded-xl overflow-hidden bg-[#1A1D26]">
            {assignedClients.length === 0 ? (
              <div className="p-4 text-xs text-center text-[#9AA1AE]">No assigned clients found for this coach.</div>
            ) : (
              assignedClients.map(client => {
                const isAttended = attendedClientIds.has(client.id);
                return (
                  <div key={client.id} className="p-3 flex items-center justify-between hover:bg-[#12141B] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#12141B] border border-[#262A36] text-xs font-bold flex items-center justify-center text-[#B9BEC7]">
                        {client.full_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#F5F6F8]">{client.full_name}</div>
                        <div className="text-xs text-[#9AA1AE]">{client.member_code} • Level {client.level || 'A'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAttendance(client.id)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        isAttended
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-[#12141B] border border-[#262A36] text-[#9AA1AE] hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isAttended ? 'Present' : 'Mark Present'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assigned Clients Detail View */}
        <div className="bg-[#12141B] border border-[#262A36] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[#F5F6F8] flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              My Assigned Athletes ({assignedClients.length})
            </h2>

            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9AA1AE]" />
              <input
                type="text"
                placeholder="Search athlete..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredClients.map(client => (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedClient?.id === client.id
                    ? 'bg-[#1A1D26] border-[#DA0E19]'
                    : 'bg-[#1A1D26]/60 border-[#262A36] hover:border-[#9AA1AE]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-[#F5F6F8]">{client.full_name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#12141B] border border-[#262A36] text-[#B9BEC7]">
                    {client.member_code}
                  </span>
                </div>
                <div className="text-xs text-[#9AA1AE] flex items-center justify-between">
                  <span>Level: {client.level || 'A'} • {client.area || 'Kampala'}</span>
                  <ChevronRight className="w-4 h-4 text-[#9AA1AE]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Client Profile & Assessments */}
        {selectedClient && (
          <div className="bg-[#12141B] border border-[#262A36] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262A36] pb-4">
              <div>
                <h3 className="font-bold text-lg text-[#F5F6F8]">{selectedClient.full_name}</h3>
                <p className="text-xs text-[#9AA1AE]">
                  Phone: {selectedClient.phone || 'N/A'} • Joined: {selectedClient.date_joined || 'N/A'}
                </p>
              </div>

              <button
                onClick={() => setShowAssessmentModal(true)}
                className="px-3 py-1.5 bg-[#DA0E19] hover:bg-[#F0202C] text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#DA0E19]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                New Assessment
              </button>
            </div>

            {/* Assessment Log */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#B9BEC7] uppercase tracking-wider">Fitness Assessment History</h4>
              {clientAssessments.length === 0 ? (
                <div className="text-xs text-[#9AA1AE] p-4 bg-[#1A1D26] rounded-xl text-center">
                  No fitness assessments recorded yet for this member.
                </div>
              ) : (
                <div className="divide-y divide-[#262A36] bg-[#1A1D26] rounded-xl border border-[#262A36] overflow-hidden">
                  {clientAssessments.map(ass => (
                    <div key={ass.id} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-[#F5F6F8]">
                        <span>Assessed: {ass.assessed_on}</span>
                        {ass.bmi && <span className="text-amber-400">BMI: {ass.bmi}</span>}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[#9AA1AE] pt-1">
                        <div>Weight: <strong className="text-white">{ass.weight_kg ? `${ass.weight_kg}kg` : '-'}</strong></div>
                        <div>Pushups: <strong className="text-white">{ass.pushups ?? '-'}</strong></div>
                        <div>Plank: <strong className="text-white">{ass.plank_seconds ? `${ass.plank_seconds}s` : '-'}</strong></div>
                        <div>Waist: <strong className="text-white">{ass.waist_cm ? `${ass.waist_cm}cm` : '-'}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Assessment Modal */}
      {showAssessmentModal && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141B] border border-[#262A36] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-[#F5F6F8]">Record Assessment for {selectedClient.full_name}</h3>
            
            <form onSubmit={handleSaveAssessment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9AA1AE] mb-1">Assessment Date</label>
                <input
                  type="date"
                  value={assDate}
                  onChange={e => setAssDate(e.target.value)}
                  className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA1AE] mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="175"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9AA1AE] mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#9AA1AE] mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={waistCm}
                    onChange={e => setWaistCm(e.target.value)}
                    className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9AA1AE] mb-1">Pushups</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={pushups}
                    onChange={e => setPushups(e.target.value)}
                    className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9AA1AE] mb-1">Plank (sec)</label>
                  <input
                    type="number"
                    placeholder="60"
                    value={plankSec}
                    onChange={e => setPlankSec(e.target.value)}
                    className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9AA1AE] mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes on form, endurance, goals..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#1A1D26] border border-[#262A36] rounded-lg text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#262A36] text-[#9AA1AE] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#DA0E19] hover:bg-[#F0202C] text-white font-bold"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
