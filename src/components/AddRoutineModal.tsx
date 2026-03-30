import { useState } from 'react';
import { useRoutine } from '../context/RoutineContext';
import { X, Check, Activity, Droplets, BookOpen, Moon, Utensils, Dumbbell, Sun, Palette, Mountain, MoreHorizontal } from 'lucide-react';

const icons = [
  { id: 'activity', comp: Activity }, { id: 'mountain', comp: Mountain },
  { id: 'droplets', comp: Droplets }, { id: 'bookOpen', comp: BookOpen },
  { id: 'moon', comp: Moon }, { id: 'utensils', comp: Utensils },
  { id: 'dumbbell', comp: Dumbbell }, { id: 'sun', comp: Sun },
  { id: 'palette', comp: Palette }, { id: 'more', comp: MoreHorizontal },
];

const DISP_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const AddRoutineModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { addRoutine } = useRoutine();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [days, setDays] = useState<number[]>([1,2,3,4,5]);
  const [icon, setIcon] = useState('activity');
  const [link, setLink] = useState('');

  if (!isOpen) return null;

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || days.length === 0) return;
    
    // Add http:// prefix if user forgot it, but only if link is not empty
    let finalLink = link.trim();
    if (finalLink && !/^https?:\/\//i.test(finalLink)) {
      finalLink = 'https://' + finalLink;
    }

    addRoutine({ title, time, days, icon, link: finalLink || undefined });
    setTitle('');
    setLink('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card bottom-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>루틴추가</h2>
          <button type="button" className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>루틴 이름</label>
            <input 
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="예: 아침 명상, 조깅" required 
            />
          </div>

          <div className="form-group">
            <label>외부 링크 (선택사항)</label>
            <input 
              value={link} onChange={e => setLink(e.target.value)}
              placeholder="예: youtube.com/watch?v=..." 
              type="url"
            />
          </div>

          <div className="form-group">
            <label>아이콘 선택</label>
            <div className="icon-grid">
              {icons.map(ic => (
                <button 
                  key={ic.id} type="button" 
                  className={`icon-select-btn ${icon === ic.id ? 'active' : ''}`}
                  onClick={() => setIcon(ic.id)}
                >
                  <ic.comp size={24} color={icon === ic.id ? '#000' : 'var(--on-surface-variant)'} />
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>시작 시간</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="time-picker-native" />
          </div>

          <div className="form-group">
            <label>반복 요일</label>
            <div className="days-selector">
              {[1,2,3,4,5,6,0].map((d) => (
                <button 
                  key={d} type="button" 
                  className={`day-btn ${days.includes(d) ? 'active' : ''}`}
                  onClick={() => toggleDay(d)}
                >
                  {DISP_DAYS[d]}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="submit-btn full-width" disabled={!title.trim() || days.length === 0}>
            저장하기 <Check size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoutineModal;
