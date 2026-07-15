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

  const [editHabit, setEditHabit] = useState(null);

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

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logo}>
            <span>consist</span>
          </div>
          <nav className={styles.nav}>
            <div className={styles.navItem}>Tất cả thói quen</div>
            <div className={styles.navItem}>Thống kê</div>
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline" style={{ margin: '0 12px' }}>
          Đăng xuất
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>Dashboard</h2>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary"
          >
            <Plus size={18} /> Thêm thói quen mới
          </button>
        </header>

        <section className={styles.section}>
          <div className={styles.habitGrid}>
            {loading ? (
              <div>Loading...</div>
            ) : habits.length > 0 ? (
              habits.map(habit => (
                <HabitCard key={habit.id} habit={habit} onEdit={() => setEditHabit(habit)} />
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
            }}
            onHabitUpdated={(updatedHabit) => {
              setHabits(habits.map(h => h.id === updatedHabit.id ? { ...h, ...updatedHabit } : h));
            }}
            onHabitDeleted={(deletedId) => {
              setHabits(habits.filter(h => h.id !== deletedId));
            }}
          />
        )}
      </main>
    </div>
  );
}
