import { useState } from 'react';
import { CalendarCheck, ListChecks, BarChart3 } from 'lucide-react';
import TodayView from './components/TodayView';
import ManageView from './components/ManageView';
import StatsView from './components/StatsView';
import AddRoutineModal from './components/AddRoutineModal';
import { useNotifications } from './hooks/useNotifications';

function App() {
  const [activeTab, setActiveTab] = useState<'today'|'manage'|'stats'>('today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { requestPermission } = useNotifications();

  const handleOpenModal = () => {
    requestPermission();
    setIsModalOpen(true);
  };

  return (
    <div className="app-layout">
      <main className="app-main">
        {activeTab === 'today' && <TodayView onOpenModal={handleOpenModal} />}
        {activeTab === 'manage' && <ManageView onOpenModal={handleOpenModal} />}
        {activeTab === 'stats' && <StatsView />}
      </main>

      <nav className="app-nav glass">
        <button className={`nav-item ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
          <CalendarCheck size={24} />
          <span>오늘</span>
        </button>
        <button className={`nav-item ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => setActiveTab('manage')}>
          <ListChecks size={24} />
          <span>루틴 관리</span>
        </button>
        <button className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <BarChart3 size={24} />
          <span>통계</span>
        </button>
      </nav>

      <AddRoutineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App;
