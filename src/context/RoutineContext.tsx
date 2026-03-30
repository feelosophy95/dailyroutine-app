import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type Routine = {
  id: string;
  title: string;
  time: string; // HH:mm format
  days: number[]; // 0(Sun) ~ 6(Sat)
  icon: string; // Lucide icon name
  isActive: boolean; // toggle state
  createdAt: number;
  link?: string; // Optional external link
};

export type RoutineLog = {
  routineId: string;
  dateStr: string; // YYYY-MM-DD
  status: 'done' | 'skip';
  loggedAt: number;
};

interface RoutineContextType {
  routines: Routine[];
  logs: RoutineLog[];
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'isActive'>) => void;
  toggleRoutineActive: (id: string) => void;
  deleteRoutine: (id: string) => void;
  logRoutine: (routineId: string, dateStr: string, status: 'done' | 'skip') => void;
  clearLog: (routineId: string, dateStr: string) => void;
}

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem('routines_v3');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [logs, setLogs] = useState<RoutineLog[]>(() => {
    const saved = localStorage.getItem('routines_logs_v3');
    if (saved) return JSON.parse(saved);
    return [];
  });

  useEffect(() => {
    localStorage.setItem('routines_v3', JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem('routines_logs_v3', JSON.stringify(logs));
  }, [logs]);

  const addRoutine = (routine: Omit<Routine, 'id' | 'createdAt' | 'isActive'>) => {
    const newRoutine: Routine = {
      ...routine,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      isActive: true,
    };
    setRoutines([...routines, newRoutine].sort((a, b) => a.time.localeCompare(b.time)));
  };

  const toggleRoutineActive = (id: string) => {
    setRoutines(routines.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const deleteRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
  };

  const logRoutine = (routineId: string, dateStr: string, status: 'done' | 'skip') => {
    setLogs(prev => {
      const filtered = prev.filter(l => !(l.routineId === routineId && l.dateStr === dateStr));
      return [...filtered, { routineId, dateStr, status, loggedAt: Date.now() }];
    });
  };

  const clearLog = (routineId: string, dateStr: string) => {
    setLogs(prev => prev.filter(l => !(l.routineId === routineId && l.dateStr === dateStr)));
  };

  return (
    <RoutineContext.Provider value={{ routines, logs, addRoutine, toggleRoutineActive, deleteRoutine, logRoutine, clearLog }}>
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutine = () => {
  const context = useContext(RoutineContext);
  if (!context) throw new Error('useRoutine must be used within RoutineProvider');
  return context;
};
