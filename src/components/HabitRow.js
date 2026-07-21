"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './HabitRow.module.css';
import { Check, Plus } from 'lucide-react';
import HabitDetailModal from './HabitDetailModal';
import Heatmap from './Heatmap';

import { calculateHabitStats } from '@/lib/habitStats';

export default function HabitRow({ habit, selectedDate, onEdit, onLogsChanged }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(habit.habit_stats?.[0] || { current_streak: 0, longest_streak: 0, strength_score: 0 });
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const computedStats = calculateHabitStats(logs);

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
      if (onLogsChanged) onLogsChanged();
    }
  };

  const todayDateStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const selectedLog = logs.find(log => log.log_date === selectedDate);
  const hasCheckedIn = !!selectedLog;
  const isFuture = selectedDate > todayDateStr;

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (isFuture) return;
    
    setLoading(true);

    if (hasCheckedIn) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', selectedLog.id);
      if (!error) {
        await fetchLogs();
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
        await fetchLogs();
        if (selectedDate === todayDateStr) {
          setStats({
            ...stats,
            current_streak: stats.current_streak + 1,
            longest_streak: Math.max(stats.longest_streak, stats.current_streak + 1)
          });
        }

        if (typeof window !== 'undefined') {
          import('canvas-confetti').then(confettiModule => {
            confettiModule.default({
              particleCount: 60,
              spread: 70,
              origin: { y: 0.7 }
            });
          });
        }
      }
    }
    setLoading(false);
  };

  const handleToggleDay = async (dateString) => {
    if (dateString > todayDateStr) return;

    const existingLog = logs.find(log => log.log_date === dateString);
    setLoading(true);

    if (existingLog) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', existingLog.id);
      if (!error) {
        await fetchLogs();
      }
    } else {
      const { error } = await supabase.from('habit_logs').insert([
        { habit_id: habit.id, log_date: dateString, value: habit.target_value }
      ]);
      if (!error) {
        await fetchLogs();
      }
    }
    setLoading(false);
  };

  return (
    <>
      <div className={`${styles.card} ${hasCheckedIn ? styles.cardChecked : ''}`} onClick={() => setShowDetail(true)}>
        <div className={styles.cardHeader}>
          <div className={styles.info}>
            <h3 className={styles.title}>{habit.title}</h3>
            {habit.description ? (
              <p className={styles.description}>{habit.description}</p>
            ) : (
              <p className={styles.description}>Mục tiêu: {habit.target_value} {habit.unit}</p>
            )}
            <div className={styles.statsBadges}>
              <span className={styles.badge} title="Chuỗi liên tục hiện tại">
                Streak: {computedStats.currentStreak}d
              </span>
              <span className={styles.badge} title="Kỷ lục chuỗi dài nhất">
                Best: {computedStats.longestStreak}d
              </span>
              <span className={styles.badge} title="Tỷ lệ kiên trì 30 ngày gần đây">
                Score: {computedStats.consistency30}%
              </span>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button 
              className={`${styles.checkBtn} ${hasCheckedIn ? styles.checked : ''} ${isFuture ? styles.disabled : ''}`}
              onClick={handleToggle}
              disabled={loading || isFuture}
              style={{
                backgroundColor: hasCheckedIn ? (habit.color || '#10b981') : 'rgba(0, 0, 0, 0.02)',
                borderColor: '#000000',
              }}
            >
              {hasCheckedIn ? (
                <Check size={18} strokeWidth={3} className={styles.checkIcon} />
              ) : (
                <Plus size={20} strokeWidth={3.5} style={{ color: habit.color || '#10b981' }} />
              )}
            </button>
          </div>
        </div>
        
        <div className={styles.heatmapWrapper} onClick={(e) => e.stopPropagation()}>
          <Heatmap 
            logs={logs} 
            targetValue={habit.target_value} 
            weeksCount={24} 
            color={habit.color} 
            onDayClick={handleToggleDay} 
          />
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
