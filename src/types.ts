export type Routine = {
  id: string;
  title: string;
  time: string; // HH:mm format
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  isActive: boolean;
};

export type RoutineStatus = 'done' | 'skipped' | 'none';

export type RoutineLog = {
  id: string;      // `${routineId}_${date}`
  routineId: string;
  date: string;    // YYYY-MM-DD
  status: RoutineStatus;
};

export type AppState = {
  routines: Routine[];
  logs: RoutineLog[];
};
