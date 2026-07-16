"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './HabitItem.module.css';
import { Check, Settings } from 'lucide-react';
import Heatmap from './Heatmap';

export default function HabitItem({ habit, selectedDate, onEdit }) {
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
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365); 

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

  const selectedLog = logs.find(log => log.log_date === selectedDate);
  const hasCheckedIn = !!selectedLog;

  const todayDateStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const isFuture = selectedDate > todayDateStr;

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (isFuture) return;
    
    setLoading(true);

    if (hasCheckedIn) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', selectedLog.id);
      if (!error) {
        fetchLogs();
        if (selectedDate === todayDateStr) {
          setStats({
            ...stats,
            current_streak: Math.max(0, stats.current_streak - 1)
          });
        }
      }
    } else {
      const { error } = await supabase.from('habit_logs').insert([
        { habit_id: habit.id, log_date: selectedDate, value: habit.target_value }
      ]);
      if (!error) {
        fetchLogs();
        if (selectedDate === todayDateStr) {
          setStats({
            ...stats,
            current_streak: stats.current_streak + 1,
            longest_streak: Math.max(stats.longest_streak, stats.current_streak + 1)
          });
        }
      }
    }
    setLoading(false);
  };

  const handleDayClick = async (dateString) => {
    if (dateString > todayDateStr) return; // Cannot toggle future days

    const existingLog = logs.find(log => log.log_date === dateString);
    setLoading(true);

    if (existingLog) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', existingLog.id);
      if (!error) fetchLogs();
    } else {
      const { error } = await supabase.from('habit_logs').insert([
        { habit_id: habit.id, log_date: dateString, value: habit.target_value }
      ]);
      if (!error) fetchLogs();
    }
    setLoading(false);
  };

  return (
    <div className={`${styles.card} ${hasCheckedIn ? styles.cardCompleted : ''}`}>
      <div className={styles.header}>
        <div className={styles.iconBox}>
          {/* Default icon if none provided */}
          <span role="img" aria-label="icon">🌿</span>
        </div>
        <div className={styles.info}>
          <h3 className={`${styles.title} ${hasCheckedIn ? styles.titleCompleted : ''}`}>{habit.title}</h3>
          <span className={styles.meta}>{habit.target_value} {habit.unit} • Streak: {stats.current_streak}</span>
        </div>
        <div className={styles.actions}>
          <button 
            className="btn btn-icon" 
            onClick={onEdit}
            title="Sửa thói quen"
            style={{ marginRight: '8px', opacity: 0.5 }}
          >
            <Settings size={18} />
          </button>
          <button 
            className={`${styles.checkCircle} ${hasCheckedIn ? styles.checked : ''} ${isFuture ? styles.disabled : ''}`}
            onClick={handleToggle}
            disabled={loading || isFuture}
          >
            {hasCheckedIn && <Check size={16} strokeWidth={3} />}
          </button>
        </div>
      </div>
      
      <div className={styles.heatmapWrapper}>
        <Heatmap logs={logs} targetValue={habit.target_value} onDayClick={handleDayClick} />
      </div>
    </div>
  );
}
