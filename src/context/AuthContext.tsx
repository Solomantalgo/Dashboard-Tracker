import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, Client, Coach } from '../types/database';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  user: any | null;
  activeMember?: Client;
  activeCoach?: Coach;
  setActiveMemberId: (id: string) => void;
  allMembers: Client[];
  allCoaches: Coach[];
  isDemoMode: boolean;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loginAsDemoRole: (targetRole: AppRole, entityId?: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<AppRole>('admin');
  const [user, setUser] = useState<any | null>(null);
  const [allMembers, setAllMembers] = useState<Client[]>([]);
  const [allCoaches, setAllCoaches] = useState<Coach[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('m1');
  const [activeCoachId, setActiveCoachId] = useState<string>('c1');
  const [loading, setLoading] = useState<boolean>(true);

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || !isSupabaseConfigured;

  const refreshData = async () => {
    try {
      const [members, coaches] = await Promise.all([
        api.getMembers(true),
        api.getCoaches()
      ]);
      setAllMembers(members);
      setAllCoaches(coaches);
    } catch (e) {
      console.error('Failed to load members/coaches in AuthContext:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const loadUserRole = async (userId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
        if (roleRow?.role) {
          setRoleState(roleRow.role as AppRole);
          if (roleRow.role === 'client') {
            const { data: clientRow } = await supabase.from('clients').select('*').eq('user_id', userId).maybeSingle();
            if (clientRow) setActiveMemberId(clientRow.id);
          } else if (roleRow.role === 'coach') {
            const { data: coachRow } = await supabase.from('coaches').select('*').eq('user_id', userId).maybeSingle();
            if (coachRow) setActiveCoachId(coachRow.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user role from Supabase:', err);
      }
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          loadUserRole(session.user.id);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserRole(session.user.id);
        } else {
          setUser(null);
          setRoleState('admin');
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        await loadUserRole(data.user.id);
        return true;
      }
      return false;
    }

    // Demo Mode Sign In Fallback
    setUser({ email, id: `demo_${role}` });
    return true;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRoleState('admin');
  };

  const setRole = (newRole: AppRole) => {
    setRoleState(newRole);
  };

  const loginAsDemoRole = async (targetRole: AppRole, entityId?: string) => {
    setRoleState(targetRole);
    if (targetRole === 'client') {
      const targetId = entityId || allMembers[0]?.id || 'm1';
      setActiveMemberId(targetId);
    } else if (targetRole === 'coach') {
      const targetId = entityId || allCoaches[0]?.id || 'c1';
      setActiveCoachId(targetId);
    }
  };

  const activeMember = allMembers.find(m => m.id === activeMemberId) || allMembers[0];
  const activeCoach = allCoaches.find(c => c.id === activeCoachId) || allCoaches[0];

  return (
    <AuthContext.Provider value={{
      role,
      setRole,
      user,
      activeMember,
      activeCoach,
      setActiveMemberId,
      allMembers,
      allCoaches,
      isDemoMode,
      signIn,
      signOut,
      loginAsDemoRole,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
