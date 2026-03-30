import { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { useStats } from '../hooks/useStats';
import { ChevronLeft, ChevronRight, CheckCircle, Flame, Trophy } from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

const StatsView = () => {
  const { logs } = useRoutine();
  const { currentStreak, bestRoutineTitle, weeklyData } = useStats();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  
  const daysInMonth = eachDayOfInterval({
    start: calendarStart,
    end: monthEnd,
  });

  const getDotsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.dateStr === dayStr && l.status === 'done');
    return Math.min(dayLogs.length, 3); // Max 3 dots based on design
  };

  const totalDoneThisMonth = logs.filter(l => l.status === 'done' && l.dateStr.startsWith(format(currentDate, 'yyyy-MM'))).length;

  return (
    <div className="view-container">
      <header className="stitch-header align-center">
        <div className="avatar-placeholder">👟</div>
        <h2>통계</h2>
        <div style={{width: 40}}></div>
      </header>

      <div className="stats-period-nav">
        <div className="nav-title">
          <span className="caption-text">Ritual Progress</span>
          <h1 className="date-headline">{format(currentDate, 'yyyy년 M월', { locale: ko })}</h1>
        </div>
        <div className="nav-arrows">
          <button className="icon-btn-round" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft size={20} color="var(--on-surface-variant)" />
          </button>
          <button className="icon-btn-round" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight size={20} color="var(--on-surface-variant)" />
          </button>
        </div>
      </div>

      <div className="calendar-card glass-card">
        <div className="calendar-header">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <span key={d}>{d}</span>)}
        </div>
        <div className="calendar-grid">
          {daysInMonth.map((day, i) => {
            const dots = getDotsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            return (
              <div key={i} className={`cal-cell ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'dim' : ''}`}>
                <span className="cal-num">{format(day, 'd')}</span>
                <div className="dots">
                  {Array.from({length: dots}).map((_, idx) => <div key={idx} className="dot" />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="weekly-chart-card glass-card mt-6">
        <div className="card-title-row">
          <BarChartIcon size={18} color="var(--on-surface)" />
          <h3>주간 성취도</h3>
        </div>
        <div className="chart-bars">
          {weeklyData.map((d, i) => (
            <div key={i} className="bar-wrapper">
              <div 
                className={`bar ${d.percentage > 0 ? (d.isToday ? 'secondary-fill' : 'primary-fill') : 'empty'}`} 
                style={{height: `${Math.max(d.percentage, d.hasScheduled ? 5 : 0)}%`}}
              ></div>
              <span className={d.isToday ? 'active-day' : (d.isFuture ? 'inactive-day' : '')}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="total-card glass-card border-gradient mt-6">
        <div>
          <span className="caption-text">이번 달 총 완료 횟수</span>
          <div className="total-num"><strong>{totalDoneThisMonth}</strong> <span className="caption-text">times</span></div>
        </div>
        <div className="icon-circle border-border"><CheckCircle size={24} color="var(--on-surface-variant)" /></div>
      </div>

      <div className="stats-row mt-6">
        <div className="stat-small-card glass-card">
          <Flame size={20} color="var(--secondary)" />
          <span className="caption-text mt-4">연속 달성일</span>
          <div className="num-val"><strong>{currentStreak}</strong> 일</div>
        </div>
        <div className="stat-small-card glass-card">
          <Trophy size={20} color="var(--primary)" />
          <span className="caption-text mt-4">최고 성공 루틴</span>
          <div className="string-val mt-1">{bestRoutineTitle}</div>
        </div>
      </div>
    </div>
  );
};

// Dumb icon component for BarChart missing from lucide
function BarChartIcon(props: any) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"></line>
      <line x1="18" y1="20" x2="18" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
  );
}

export default StatsView;
