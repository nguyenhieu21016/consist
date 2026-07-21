"use client";
import { X, Settings, Trash2 } from 'lucide-react';
import Heatmap from './Heatmap';
import styles from './HabitDetailModal.module.css';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

import { calculateHabitStats } from '@/lib/habitStats';

export default function HabitDetailModal({ habit, logs, stats, onClose, onEdit, onLogsChanged }) {
  const [loading, setLoading] = useState(false);
  const computedStats = calculateHabitStats(logs);

  const handleToggleDay = async (dateString) => {
    const todayDateStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
    if (dateString > todayDateStr) return; // Cannot toggle future days

    const existingLog = logs.find(log => log.log_date === dateString);
    setLoading(true);

    if (existingLog) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', existingLog.id);
      if (!error) onLogsChanged();
    } else {
      const { error } = await supabase.from('habit_logs').insert([
        { habit_id: habit.id, log_date: dateString, value: habit.target_value }
      ]);
      if (!error) onLogsChanged();
    }
    setLoading(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>{habit.title}</h2>
            <span className={styles.meta}>Mục tiêu: {habit.target_value} {habit.unit}</span>
          </div>
          
          <div className={styles.headerActions}>
            <button className="btn btn-icon" onClick={onEdit} title="Sửa thói quen">
              <Settings size={18} />
            </button>
            <button className="btn btn-icon" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Current Streak:</span>
            <span className={styles.statValue} style={{ color: 'var(--build-color, #10b981)' }}>
              {computedStats.currentStreak} ngày
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Kỷ lục (Best):</span>
            <span className={styles.statValue}>{computedStats.longestStreak} ngày</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Nhất quán (30 ngày):</span>
            <span className={styles.statValue}>{computedStats.consistency30}%</span>
          </div>
        </div>

        <div className={styles.heatmapWrapper}>
          <h4 className={styles.sectionTitle}>Lịch sử hoạt động</h4>
          <Heatmap logs={logs} targetValue={habit.target_value} onDayClick={handleToggleDay} />
        </div>
      </div>
    </div>
  );
}
