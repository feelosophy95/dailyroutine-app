import { useRoutine } from '../context/RoutineContext';
import { useStats } from '../hooks/useStats';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Check, Circle, Ban, Mountain, Flame, Activity, Droplets, BookOpen, Moon, Utensils, Dumbbell, Sun, Palette, MoreHorizontal, Edit2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

const IconMap: Record<string, any> = {
  mountain: Mountain, activity: Activity, droplets: Droplets, bookOpen: BookOpen,
  moon: Moon, utensils: Utensils, dumbbell: Dumbbell, sun: Sun, palette: Palette, more: MoreHorizontal
};

const QUOTES = [
  "작은 습관이 모여 위대한 변화를 만듭니다.",
  "오늘의 땀방울이 내일의 미소를 만듭니다.",
  "가장 큰 노력은 꾸준함입니다.",
  "매일 조금씩 나아지는 삶을 위해.",
  "천 리 길도 한 걸음부터.",
  "어제보다 나은 오늘이 되기를."
];

const TodayView = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const { routines, logs, logRoutine, clearLog } = useRoutine();
  const { currentStreak } = useStats();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dayOfWeek = new Date().getDay();

  const [userName, setUserName] = useState('사용자');
  
  useEffect(() => {
    const saved = localStorage.getItem('dailyroutine_username');
    if (saved) setUserName(saved);
  }, []);

  const handleEditName = () => {
    const newName = prompt('불러드릴 이름을 입력해주세요:', userName);
    if (newName && newName.trim() !== '') {
      setUserName(newName.trim());
      localStorage.setItem('dailyroutine_username', newName.trim());
    }
  };

  const todaysRoutines = routines.filter(r => r.isActive && r.days.includes(dayOfWeek));
  const doneCount = todaysRoutines.filter(r => logs.some(l => l.routineId === r.id && l.dateStr === todayStr && l.status === 'done')).length;
  const progress = todaysRoutines.length > 0 ? Math.round((doneCount / todaysRoutines.length) * 100) : 0;

  // Pick a random quote on mount
  const todayQuote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  return (
    <div className="view-container">
      <header className="stitch-header">
        <div className="date-badge">
          <Activity size={18} color="var(--primary)" />
          <span>{format(new Date(), 'M월 d일 EEEE', { locale: ko })}</span>
        </div>
        <button className="icon-btn-round" onClick={onOpenModal}><Plus size={20} color="#000" /></button>
      </header>
      
      <section className="welcome-banner" onClick={handleEditName} style={{ cursor: 'pointer' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          안녕하세요,<br/>{userName}님! <Edit2 size={18} color="var(--on-surface-variant)" />
        </h1>
        <p>오늘의 루틴이 당신의 성장을 기다리고 있어요.</p>
      </section>

      <section className="dashboard-cards">
        <div className="dash-card glass-card text-center">
          <div className="progress-circle" style={{ background: `conic-gradient(var(--primary) ${progress}%, var(--surface-container-highest) ${progress}%)` }}>
            <div className="inner-circle">
              <strong className="display-font">{progress}%</strong>
              <span className="caption">DONE</span>
            </div>
          </div>
          <h3>오늘의 진행도</h3>
          <p className="caption">{todaysRoutines.length}개 중 {doneCount}개 완료</p>
        </div>

        <div className="dash-card glass-card relative-overflow">
          <Flame size={24} color={currentStreak > 0 ? "var(--secondary)" : "var(--on-surface)"} />
          <div className="mt-4">
            <strong className="display-font">{currentStreak}일</strong>
            <p className="caption">연속 달성 중!</p>
          </div>
          <div className="bg-graph"></div>
        </div>
      </section>

      <section className="routine-list-section">
        <div className="section-header">
          <h2>루틴 목록</h2>
          <button className="text-link">전체 보기</button>
        </div>
        
        <div className="list-container">
          {todaysRoutines.map(routine => {
            const log = logs.find(l => l.routineId === routine.id && l.dateStr === todayStr);
            const status = log ? log.status : 'todo';
            const IconComp = IconMap[routine.icon] || Activity;
            
            return (
              <div key={routine.id} className={`list-item glass-card ${status}`}>
                <div className={`icon-box ${status}`}>
                  <IconComp size={20} />
                </div>
                <div className="item-text">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="item-title">{routine.title}</span>
                    {routine.link && (
                      <a href={routine.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', textDecoration: 'none' }}>
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                  <span className="item-status">
                     {status === 'done' ? '✓ 완료' : status === 'skip' ? '건너뜀' : '• 진행 전'}
                  </span>
                </div>
                <button className={`action-circle ${status}`} onClick={() => status === 'done' ? clearLog(routine.id, todayStr) : logRoutine(routine.id, todayStr, 'done')} onContextMenu={(e) => { e.preventDefault(); logRoutine(routine.id, todayStr, 'skip'); }}>
                  {status === 'done' ? <Check size={20} color="#000" /> : status === 'skip' ? <Ban size={20} /> : <Circle size={20} />}
                </button>
              </div>
            );
          })}
          {todaysRoutines.length === 0 && (
            <div className="empty-text">오늘은 예정된 루틴이 없습니다.</div>
          )}
        </div>
      </section>

      <div className="quote-box glass-card" style={{ wordBreak: 'keep-all', lineHeight: '1.6' }}>
        <p>"{todayQuote}"</p>
      </div>
    </div>
  );
};

export default TodayView;
