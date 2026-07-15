"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AddHabit from './AddHabit';
import HabitCard from './HabitCard';
import styles from './Dashboard.module.css';
import { Plus } from 'lucide-react';

export default function Dashboard({ session }) {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*, habit_stats(*)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setHabits(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const buildHabits = habits.filter(h => h.type === 'build');
  const quitHabits = habits.filter(h => h.type === 'quit');

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div>
          <h1 className={`${styles.logo} serif-heading`}>Consist</h1>
          <nav className={styles.nav}>
            <div className={styles.navItem}>Tất cả thói quen</div>
            <div className={styles.navItem}>Build Habits</div>
            <div className={styles.navItem}>Quit Habits</div>
            <div className={styles.navItem}>Thống kê</div>
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ color: 'var(--text-on-dark)', borderColor: 'rgba(255,255,255,0.2)' }}>
          Đăng xuất
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h2 className={`${styles.pageTitle} serif-heading`}>Dashboard</h2>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary"
          >
            <Plus size={18} /> Thêm thói quen mới
          </button>
        </header>

        <section className={styles.section}>
          <h3 className={`${styles.sectionTitle} serif-heading`}>Build Habits</h3>
          <div className={styles.habitGrid}>
            {loading ? (
              <div>Loading...</div>
            ) : buildHabits.length > 0 ? (
              buildHabits.map(habit => (
                <HabitCard key={habit.id} habit={habit} />
              ))
            ) : (
              <div className={styles.emptyState}>
                Chưa có thói quen nào. Hãy thêm mới!
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={`${styles.sectionTitle} serif-heading`}>Quit Habits</h3>
          <div className={styles.habitGrid}>
            {loading ? (
              <div>Loading...</div>
            ) : quitHabits.length > 0 ? (
              quitHabits.map(habit => (
                <HabitCard key={habit.id} habit={habit} />
              ))
            ) : (
              <div className={styles.emptyState}>
                Chưa có thói quen xấu nào cần bỏ.
              </div>
            )}
          </div>
        </section>

        {showAddModal && (
          <AddHabit 
            session={session} 
            onClose={() => setShowAddModal(false)} 
            onHabitAdded={(newHabit) => {
              setHabits([{...newHabit, habit_stats: [{current_streak: 0, longest_streak: 0, strength_score: 0}]}, ...habits]);
            }}
          />
        )}
      </main>
    </div>
  );
}
