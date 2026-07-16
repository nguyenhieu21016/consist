"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './HabitRow.module.css';
import { Check, MoreHorizontal } from 'lucide-react';
import HabitDetailModal from './HabitDetailModal';

export default function HabitRow({ habit, selectedDate, onEdit }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(habit.habit_stats?.[0] || { current_streak: 0, longest_streak: 0, strength_score: 0 });
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

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

  return (
    <>
      <div className={`${styles.row} ${hasCheckedIn ? styles.rowCompleted : ''}`} onClick={() => setShowDetail(true)}>
        <div className={styles.info}>
          <h3 className={`${styles.title} ${hasCheckedIn ? styles.titleCompleted : ''}`}>{habit.title}</h3>
          <span className={styles.meta}>{habit.target_value} {habit.unit}</span>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={`${styles.checkCircle} ${hasCheckedIn ? styles.checked : ''} ${isFuture ? styles.disabled : ''}`}
            onClick={handleToggle}
            disabled={loading || isFuture}
          >
            {hasCheckedIn && <Check size={16} strokeWidth={3} />}
          </button>
        </div>
      </div>

      {showDetail && (
        <HabitDetailModal
          habit={habit}
          logs={logs}
          stats={stats}
          onClose={() => setShowDetail(false)}
          onEdit={() => {
            setShowDetail(false);
            onEdit();
          }}
          onLogsChanged={fetchLogs}
        />
      )}
    </>
  );
}
