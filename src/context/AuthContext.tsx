import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, Client } from '../types/database';
import { api } from '../services/api';

interface AuthContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  activeMember?: Client;
  setActiveMemberId: (id: string) => void;
  allMembers: Client[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<AppRole>('admin');
  const [allMembers, setAllMembers] = useState<Client[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('m1'); // Default to Robert Mackay (m1) for demo

  useEffect(() => {
    api.getMembers().then(members => {
      setAllMembers(members);
      if (members.length > 0 && !members.some(m => m.id === activeMemberId)) {
        setActiveMemberId(members[0].id);
      }
    });
  }, [activeMemberId]);

  const activeMember = allMembers.find(m => m.id === activeMemberId);

  return (
    <AuthContext.Provider value={{ role, setRole, activeMember, setActiveMemberId, allMembers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
