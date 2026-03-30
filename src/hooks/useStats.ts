import { useMemo } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { format, startOfWeek, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

export const useStats = () => {
  const { routines, logs } = useRoutine();

  const currentStreak = useMemo(() => {
    const activeDates = new Set(logs.filter(l => l.status === 'done').map(l => l.dateStr));
    let streak = 0;
    let d = new Date();
    
    // Check today
    let dateStr = format(d, 'yyyy-MM-dd');
    if (!activeDates.has(dateStr)) {
      // If not active today, check if active yesterday
      d.setDate(d.getDate() - 1);
      dateStr = format(d, 'yyyy-MM-dd');
    }
    
    // Count consecutive active days backwards
    while (activeDates.has(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
      dateStr = format(d, 'yyyy-MM-dd');
    }
    return streak;
  }, [logs]);

  const bestRoutineTitle = useMemo(() => {
    if (logs.length === 0) return '없음';
    const counts = logs.filter(l => l.status === 'done').reduce((acc, log) => {
      acc[log.routineId] = (acc[log.routineId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    if (Object.keys(counts).length === 0) return '없음';
    
    const bestId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    const routine = routines.find(r => r.id === bestId);
    return routine ? routine.title : '삭제된 루틴';
  }, [logs, routines]);

  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayOfWeek = d.getDay();
      
      const scheduled = routines.filter(r => r.isActive && r.days.includes(dayOfWeek));
      const doneCount = logs.filter(l => l.dateStr === dateStr && l.status === 'done').length;
      
      const percentage = scheduled.length > 0 ? Math.min(100, Math.round((doneCount / scheduled.length) * 100)) : 0;
      
      return {
        label: format(d, 'E', { locale: ko }),
        percentage,
        isToday: isSameDay(d, new Date()),
        isFuture: isSameDay(d, new Date()) ? false : d > new Date(),
        dayOfWeek,
        hasScheduled: scheduled.length > 0
      };
    });
  }, [logs, routines]);

  return { currentStreak, bestRoutineTitle, weeklyData };
};
