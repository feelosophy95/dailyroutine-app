import { useRoutine } from '../context/RoutineContext';
import { Plus, Mountain, Activity, Droplets, BookOpen, Moon, Utensils, Dumbbell, Sun, Palette, MoreHorizontal } from 'lucide-react';

const IconMap: Record<string, any> = {
  mountain: Mountain, activity: Activity, droplets: Droplets, bookOpen: BookOpen,
  moon: Moon, utensils: Utensils, dumbbell: Dumbbell, sun: Sun, palette: Palette, more: MoreHorizontal
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

import SwipeToDeleteItem from './SwipeToDeleteItem';

const ManageView = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const { routines, toggleRoutineActive, deleteRoutine } = useRoutine();
  const activeCount = routines.filter(r => r.isActive).length;

  return (
    <div className="view-container">
      <header className="stitch-header align-center">
        <div className="avatar-placeholder"></div>
        <h2>루틴관리</h2>
        <button className="icon-btn-round" onClick={onOpenModal}><Plus size={20} color="#000" /></button>
      </header>

      <section className="manage-title">
        <h1>나만의 <span className="highlight-text">리추얼</span></h1>
        <p>현재 {activeCount}개의 루틴이 활성화되어 있습니다.</p>
      </section>

      <div className="manage-list">
        {routines.map(routine => {
          const IconComp = IconMap[routine.icon] || "div";
          const isEveryDay = routine.days.length === 7;
          const daysText = isEveryDay ? '매일' : routine.days.map(d => DAYS[d]).join(', ');
          
          return (
            <SwipeToDeleteItem key={routine.id} onDelete={() => deleteRoutine(routine.id)}>
              <div className={`manage-card glass-card ${!routine.isActive ? 'inactive' : ''}`}>
                <div className="card-left">
                  <div className={`icon-box-lg`}>
                    <IconComp size={24} color={routine.isActive ? "var(--secondary)" : "var(--on-surface-variant)"} />
                  </div>
                  <div className="card-info">
                    <div className="time-badge">
                      <span className="time">{routine.time}</span>
                      <span className="days">{daysText}</span>
                    </div>
                    <h3>{routine.title}</h3>
                  </div>
                </div>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={routine.isActive} 
                    onChange={() => toggleRoutineActive(routine.id)} 
                    id={`toggle-${routine.id}`}
                  />
                  <label htmlFor={`toggle-${routine.id}`}></label>
                </div>
              </div>
            </SwipeToDeleteItem>
          );
        })}
      </div>
      
      <button className="fab-btn" onClick={onOpenModal}>
        <Plus size={28} color="#000" />
      </button>
    </div>
  );
};

export default ManageView;
