import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { api } from '../services/api';
import { Client, Session, Coach } from '../types/database';
import {
  CalendarCheck, Search, Plus, Check, Circle, Loader2
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
        await selectSession(targetSession.id);
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
      await selectSession(sess.id);
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
      <div className="min-w-0 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold font-heading text-[#F5F6F8]">Group Session Tracker</h2>
            <span className="rounded border border-[#DA0E19]/30 bg-[#DA0E19]/20 px-2 py-0.5 text-[10px] font-bold text-[#DA0E19]">
              Outdoor 7am - 8am
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#9AA1AE]">Outdoor training attendance, optimized for touch on weak connections.</p>
        </div>

        <div className="mt-4 grid min-w-0 gap-3 md:flex md:items-end md:justify-end">
          {/* Past Sessions Dropdown */}
          <label className="min-w-0 md:w-[min(100%,28rem)]">
            <span className="mb-1 block px-1 text-[10px] font-bold uppercase tracking-wider text-[#9AA1AE]">Select session</span>
            <select
              id="attendance-session"
              value={currentSession?.id || ''}
              onChange={(e) => selectSession(e.target.value)}
              aria-label="Select attendance session"
              className="min-h-11 w-full min-w-0 max-w-full truncate rounded-lg border border-[#262A36] bg-[#1A1D26] px-3 py-2 text-xs font-semibold text-[#F5F6F8] focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.session_date} - {s.title} ({s.attended_count ?? 0} present)
                </option>
              ))}
            </select>
            {currentSession && (
              <span className="mt-1 block truncate px-1 text-[11px] text-[#B9BEC7]" title={`${currentSession.session_date} - ${currentSession.title}`}>
                Selected: {currentSession.session_date} · {currentSession.title}
              </span>
            )}
          </label>

          <button
            onClick={handleStartTodaySession}
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DA0E19] px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-[#F0202C] md:w-auto md:min-w-[13rem] md:min-h-0"
          >
            <Plus className="w-4 h-4" />
            Start Today's Session
          </button>
        </div>
      </div>

      {!currentSession && (
        <div className="rounded-[12px] border border-dashed border-[#262A36] bg-[#12141B] p-8 text-center">
          {loading ? (
            <p className="text-sm text-[#9AA1AE]">Loading sessions and active members...</p>
          ) : sessions.length === 0 ? (
            <>
              <p className="font-semibold text-[#F5F6F8]">No training session selected</p>
              <p className="mt-1 text-xs text-[#9AA1AE]">Start today’s session to begin logging attendance.</p>
            </>
          ) : (
            <p className="text-sm text-[#9AA1AE]">Select a session to view its attendance.</p>
          )}
        </div>
      )}

      {currentSession && (
        <>
          {/* Live Attendance Counter Bar */}
          <div className="flex min-w-0 flex-col gap-4 rounded-[12px] border border-[#262A36] bg-[#12141B] p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#9AA1AE]">Live attendance</span>
              <div className="mt-1 flex items-baseline gap-2 whitespace-nowrap">
                <h3 className="font-heading text-2xl font-black tabular-nums text-[#DA0E19]">
                  {presentCount} / {totalCount}
                </h3>
                <span className="text-xs font-bold text-emerald-400">
                  ({Math.round((presentCount / (totalCount || 1)) * 100)}% present)
                </span>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative w-full min-w-0 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA1AE]" />
              <input
                type="text"
                placeholder="Search athlete for check-in..."
                aria-label="Search athlete for check-in"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-lg border border-[#262A36] bg-[#1A1D26] pl-9 pr-3 py-2 text-xs text-[#F5F6F8] placeholder-[#9AA1AE] focus:border-[#DA0E19] focus:outline-none focus:ring-1 focus:ring-[#DA0E19]/40 sm:min-h-0"
              />
            </div>
          </div>

          {/* Large Touch-Target Member List (Min 48px targets) */}
          {activeMembers.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#262A36] bg-[#12141B] p-8 text-center">
              <p className="font-semibold text-[#F5F6F8]">No active members to check in</p>
              <p className="mt-1 text-xs text-[#9AA1AE]">Add or activate members before logging attendance.</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#262A36] bg-[#12141B] p-8 text-center">
              <p className="font-semibold text-[#F5F6F8]">No athletes found</p>
              <p className="mt-1 text-xs text-[#9AA1AE]">Try a different name or member code.</p>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-3 pb-8 sm:grid-cols-2 lg:grid-cols-3 md:pb-0">
            {filteredMembers.map(m => {
              const isPresent = attendedClientIds.has(m.id);
              const isSaving = savingId === m.id;

              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => handleToggleAttendance(m.id)}
                  disabled={isSaving}
                  aria-pressed={isPresent}
                  aria-busy={isSaving}
                  aria-label={`${isPresent ? 'Mark absent' : 'Mark present'}: ${m.full_name}, ${m.member_code}`}
                  className={`min-h-[76px] w-full min-w-0 rounded-[12px] border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#DA0E19] focus:ring-offset-2 focus:ring-offset-[#0A0B10] disabled:cursor-wait disabled:opacity-80 flex items-center justify-between gap-3 ${
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
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`hidden text-[10px] font-bold uppercase tracking-wider sm:inline ${isPresent ? 'text-[#F58A90]' : 'text-[#9AA1AE]'}`}>
                      {isSaving ? 'Saving' : isPresent ? 'Present' : 'Absent'}
                    </span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isPresent
                      ? 'bg-[#DA0E19] border-[#DA0E19] text-white shadow-md'
                      : 'border-[#262A36] bg-[#1A1D26] text-[#9AA1AE]'
                    }`}>
                      {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : isPresent ? <Check className="h-6 w-6 stroke-[3]" /> : <Circle className="h-5 w-5" />}
                    </span>
                  </div>
                </button>
              );
            })}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};
