"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AddHabit from './AddHabit';
import HabitRow from './HabitRow';
import WeeklyReportModal from './WeeklyReportModal';
import AchievementsModal from './AchievementsModal';
import ShopModal from './ShopModal';
import styles from './Dashboard.module.css';
import { Plus, ChevronLeft, ChevronRight, BarChart2, Award, ShoppingBag } from 'lucide-react';
import { calculateGamificationData } from '@/lib/gamification';

const getWeekDays = (baseDate) => {
  const days = [];
  const current = new Date(baseDate);
  current.setDate(current.getDate() - 3); // 3 days before
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

export default function Dashboard({ session }) {
  const [habits, setHabits] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [spentCoins, setSpentCoins] = useState(0);

  const [baseDate, setBaseDate] = useState(new Date());
  
  const getTodayStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  const weekDays = getWeekDays(baseDate);

  useEffect(() => {
    fetchData();
    if (typeof window !== 'undefined') {
      const savedSpent = parseInt(localStorage.getItem('consist_spent_coins') || '0', 10);
      setSpentCoins(savedSpent);
    }
  }, []);

  const fetchData = async () => {
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*, habit_stats(*)')
      .order('created_at', { ascending: false });

    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('*');
    
    if (habitsData) setHabits(habitsData);
    if (logsData) setAllLogs(logsData);
    if (typeof window !== 'undefined') {
      const savedSpent = parseInt(localStorage.getItem('consist_spent_coins') || '0', 10);
      setSpentCoins(savedSpent);
    }
    setLoading(false);
  };

  const gamificationData = calculateGamificationData(habits, allLogs);
  const totalEarnedCoins = gamificationData.totalEarnedCoins;
  const availableCoins = Math.max(0, totalEarnedCoins - spentCoins);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={styles.layout}>
      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={styles.logoText}>consist</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setShowShopModal(true)}
                className="btn btn-outline"
                title="Cửa hàng Coin & Thẻ Đóng Băng"
                style={{ backgroundColor: '#fffdf5', borderColor: '#000' }}
              >
                <ShoppingBag size={18} color="#f59e0b" /> {availableCoins} Coins
              </button>
              <button 
                onClick={() => setShowAchievementsModal(true)}
                className="btn btn-outline"
                title="Xem Cấp độ & Thành tựu"
                style={{ backgroundColor: '#fffdf0', borderColor: '#000' }}
              >
                <Award size={18} color="#10b981" /> Lv.{gamificationData.level} ({gamificationData.totalXP} XP)
              </button>
              <button 
                onClick={() => setShowReportModal(true)} 
                className="btn btn-outline"
                title="Xem báo cáo hiệu suất tuần"
              >
                <BarChart2 size={18} /> Báo cáo
              </button>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="btn btn-primary"
              >
                <Plus size={18} /> Thêm mới
              </button>
              <button onClick={handleLogout} className="btn btn-outline">
                Đăng xuất
              </button>
            </div>
          </div>
          
          <div className={styles.calendarStrip}>
            <button 
              className="btn btn-icon"
              onClick={() => {
                const newBase = new Date(baseDate);
                newBase.setDate(newBase.getDate() - 7);
                setBaseDate(newBase);
              }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className={styles.daysList}>
              {weekDays.map((d, i) => {
                const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === getTodayStr();
                const dayName = d.toLocaleDateString('vi-VN', { weekday: 'short' });
                
                return (
                  <button
                    key={i}
                    className={`${styles.dayBtn} ${isSelected ? styles.daySelected : ''} ${isToday && !isSelected ? styles.dayToday : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span className={styles.dayName}>{dayName}</span>
                    <span className={styles.dayNumber}>{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            <button 
              className="btn btn-icon"
              onClick={() => {
                const newBase = new Date(baseDate);
                newBase.setDate(newBase.getDate() + 7);
                setBaseDate(newBase);
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        <section className={styles.section}>
          <div className={styles.habitList}>
            {loading ? (
              <div>Loading...</div>
            ) : habits.length > 0 ? (
              habits.map(habit => (
                <HabitRow 
                  key={`${habit.id}-${selectedDate}`} 
                  habit={habit} 
                  selectedDate={selectedDate}
                  onEdit={() => setEditHabit(habit)}
                  onLogsChanged={fetchData}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                Chưa có thói quen nào. Hãy thêm mới!
              </div>
            )}
          </div>
        </section>

        {(showAddModal || editHabit) && (
          <AddHabit 
            session={session} 
            habitToEdit={editHabit}
            onClose={() => {
              setShowAddModal(false);
              setEditHabit(null);
            }} 
            onHabitAdded={(newHabit) => {
              setHabits([{...newHabit, habit_stats: [{current_streak: 0, longest_streak: 0, strength_score: 0}]}, ...habits]);
              fetchData();
            }}
            onHabitUpdated={(updatedHabit) => {
              setHabits(habits.map(h => h.id === updatedHabit.id ? { ...h, ...updatedHabit } : h));
              fetchData();
            }}
            onHabitDeleted={(deletedId) => {
              setHabits(habits.filter(h => h.id !== deletedId));
              fetchData();
            }}
          />
        )}

        {showReportModal && (
          <WeeklyReportModal 
            habits={habits} 
            onClose={() => setShowReportModal(false)} 
          />
        )}

        {showAchievementsModal && (
          <AchievementsModal 
            gamificationData={gamificationData} 
            onClose={() => setShowAchievementsModal(false)} 
          />
        )}

        {showShopModal && (
          <ShopModal 
            totalEarnedCoins={totalEarnedCoins} 
            maxStreakEver={gamificationData.maxStreakEver}
            habits={habits}
            allLogs={allLogs}
            session={session}
            onClose={() => {
              setShowShopModal(false);
              fetchData();
            }} 
          />
        )}
      </main>
    </div>
  );
}
