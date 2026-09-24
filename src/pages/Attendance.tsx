import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Client, Session, Coach } from '../types/database';
import {
  CalendarCheck, CheckCircle2, Circle, Search, Plus, UserPlus,
  Clock, Shield, Flame, ChevronDown, Check
} from 'lucide-react';
import { format } from 'date-fns';

export const Attendance: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [attendedClientIds, setAttendedClientIds] = useState<Set<string>>(new Set());
  const [activeMembers, setActiveMembers] = useState<Client[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, mRes, cRes] = await Promise.all([
        api.getSessions(),
        api.getMembers(),
        api.getCoaches()
      ]);
      setSessions(sRes);
      setCoaches(cRes);
      if (cRes.length > 0) setSelectedCoachId(cRes[0].id);

      const active = mRes.filter(m => m.status === 'active');
      setActiveMembers(active);

      // Select today's session if available, else latest
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      let targetSession = sRes.find(s => s.session_date === todayStr) || sRes[0];
      if (targetSession) {
        selectSession(targetSession.id);
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    try {
      const details = await api.getSessionDetails(sessionId);
      setCurrentSession(details.session);
      setAttendedClientIds(new Set(details.attendedClientIds));
    } catch (e) {
      console.error('Failed to select session:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartTodaySession = async () => {
    try {
      const sess = await api.startTodaySession(selectedCoachId);
      await loadData();
      selectSession(sess.id);
    } catch (e) {
      console.error('Failed to start today session:', e);
    }
  };

  const handleToggleAttendance = async (clientId: string) => {
    if (!currentSession) return;
    const isCurrentlyAttended = attendedClientIds.has(clientId);
    const nextState = !isCurrentlyAttended;

    // Optimistic UI Update
    const newSet = new Set(attendedClientIds);
    if (nextState) newSet.add(clientId);
    else newSet.delete(clientId);
    setAttendedClientIds(newSet);

    setSavingId(clientId);
    try {
      const count = await api.toggleAttendance(currentSession.id, clientId, nextState);
      setCurrentSession({ ...currentSession, attended_count: count });
    } catch (e) {
      console.error('Failed to toggle attendance:', e);
      // Rollback
      setAttendedClientIds(attendedClientIds);
    } finally {
      setSavingId(null);
    }
  };

  const filteredMembers = activeMembers.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.member_code.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = attendedClientIds.size;
  const totalCount = activeMembers.length;

  return (
    <AdminLayout title="Outdoor Attendance Logging">
      {/* Top Banner & Session Picker */}
      <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-heading text-[#F5F6F8]">Group Session Tracker</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DA0E19]/20 text-[#DA0E19] border border-[#DA0E19]/30">
              Outdoor 7am - 8am
            </span>
          </div>
          <p className="text-xs text-[#9AA1AE]">Optimized for touch outdoors on weak data connections</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Past Sessions Dropdown */}
          <select
            value={currentSession?.id || ''}
            onChange={(e) => selectSession(e.target.value)}
            className="px-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] font-semibold focus:outline-none"
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.session_date} - {s.title} ({s.attended_count ?? 0} present)
              </option>
            ))}
          </select>

          <button
            onClick={handleStartTodaySession}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#DA0E19] text-white hover:bg-[#F0202C] flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            + Start Today's Session
          </button>
        </div>
      </div>

      {currentSession && (
        <>
          {/* Live Attendance Counter Bar */}
          <div className="bg-[#12141B] border border-[#262A36] rounded-[12px] p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-[#9AA1AE]">Live Attendance Counter</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-[#DA0E19] tabular-nums font-heading">
                  {presentCount} / {totalCount}
                </h3>
                <span className="text-xs text-emerald-400 font-bold">
                  ({Math.round((presentCount / (totalCount || 1)) * 100)}% present)
                </span>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
              <input
                type="text"
                placeholder="Search athlete for check-in..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1D26] border border-[#262A36] rounded-lg text-[#F5F6F8] focus:outline-none focus:border-[#DA0E19]"
              />
            </div>
          </div>

          {/* Large Touch-Target Member List (Min 48px targets) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMembers.map(m => {
              const isPresent = attendedClientIds.has(m.id);

              return (
                <div
                  key={m.id}
                  onClick={() => handleToggleAttendance(m.id)}
                  className={`min-h-[64px] p-4 rounded-[12px] border cursor-pointer select-none transition-all flex items-center justify-between gap-3 ${
                    isPresent
                      ? 'bg-[#DA0E19]/15 border-[#DA0E19] text-[#F5F6F8] shadow-lg shadow-[#DA0E19]/10'
                      : 'bg-[#12141B] border-[#262A36] text-[#9AA1AE] hover:border-[#B9BEC7]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center shrink-0 border ${
                      isPresent ? 'bg-[#DA0E19] text-white border-white/20' : 'bg-[#1A1D26] text-[#B9BEC7] border-[#262A36]'
                    }`}>
                      {m.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isPresent ? 'text-[#F5F6F8]' : 'text-[#B9BEC7]'}`}>
                        {m.full_name}
                      </h4>
                      <p className="text-[11px] font-mono text-[#9AA1AE]">{m.member_code}</p>
                    </div>
                  </div>

                  {/* Large Touch Toggle Indicator */}
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    isPresent
                      ? 'bg-[#DA0E19] border-[#DA0E19] text-white shadow-md'
                      : 'border-[#262A36] bg-[#1A1D26] text-transparent'
                  }`}>
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AdminLayout>
  );
};
