"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Heatmap from './Heatmap';
import styles from './HabitCard.module.css';
import { Check, X } from 'lucide-react';

export default function HabitCard({ habit }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(habit.habit_stats?.[0] || { current_streak: 0, longest_streak: 0, strength_score: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [habit.id]);

  const fetchLogs = async () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365); // Fetch year for heatmap

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habit.id)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });

    if (!error && data) {
      setLogs(data);
    }
  };

  const handleCheckIn = async (value) => {
    setLoading(true);
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const logDate = today.toISOString().split('T')[0];

    const { error } = await supabase
      .from('habit_logs')
      .insert([
        { habit_id: habit.id, log_date: logDate, value: value }
      ]);

    if (!error) {
      fetchLogs();
      // Optimistic stats update
      setStats({
        ...stats,
        current_streak: stats.current_streak + 1,
        longest_streak: Math.max(stats.longest_streak, stats.current_streak + 1)
      });
    }
    setLoading(false);
  };

  const todayDateStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const todayLog = logs.find(log => log.log_date === todayDateStr);
  const hasCheckedInToday = !!todayLog;

  const handleUndo = async () => {
    if (!todayLog) return;
    setLoading(true);

    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', todayLog.id);

    if (!error) {
      fetchLogs();
      // Optimistic stats update
      setStats({
        ...stats,
        current_streak: Math.max(0, stats.current_streak - 1)
      });
    }
    setLoading(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={`${styles.title} serif-heading`}>{habit.title}</h3>
          <div className={styles.meta}>
            <span>Mục tiêu: {habit.target_value} {habit.unit}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Streak:</span>
          <span className={styles.statValue} style={{ color: habit.type === 'build' ? 'var(--build-color)' : 'var(--quit-color)' }}>
            {stats.current_streak}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Best:</span>
          <span className={styles.statValue}>{stats.longest_streak}</span>
        </div>
      </div>

      <Heatmap logs={logs} type={habit.type} targetValue={habit.target_value} />

      <div className={styles.actions}>
        {hasCheckedInToday ? (
          <button 
            className={`btn btn-outline ${styles.checkBtn}`}
            onClick={handleUndo}
            disabled={loading}
          >
            Hoàn tác
          </button>
        ) : habit.type === 'build' ? (
          <button 
            className={`btn btn-primary ${styles.checkBtn}`}
            onClick={() => handleCheckIn(habit.target_value)}
            disabled={loading}
          >
            <Check size={16} /> Hoàn thành
          </button>
        ) : (
          <button 
            className={`btn btn-outline ${styles.checkBtn}`}
            onClick={() => handleCheckIn(1)}
            disabled={loading}
            title="Ghi nhận tái phạm"
            style={{ color: 'var(--quit-color)' }}
          >
            <X size={16} /> Lỡ tái phạm
          </button>
        )}
      </div>
    </div>
  );
}
