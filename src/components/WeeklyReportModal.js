"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, BarChart2, Calendar } from 'lucide-react';
import styles from './WeeklyReportModal.module.css';

export default function WeeklyReportModal({ habits, onClose }) {
  const [loading, setLoading] = useState(true);
  const [weeklyLogs, setWeeklyLogs] = useState([]);

  // Generate date array for the last 7 days (today down to 6 days ago)
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      days.push({ dateStr, dayName, fullDate: d });
    }
    return days;
  };

  const days7 = getLast7Days();
  const startDateStr = days7[0].dateStr;
  const endDateStr = days7[6].dateStr;

  useEffect(() => {
    fetchWeeklyLogs();
  }, []);

  const fetchWeeklyLogs = async () => {
    if (!habits || habits.length === 0) {
      setLoading(false);
      return;
    }

    const habitIds = habits.map(h => h.id);
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .in('habit_id', habitIds)
      .gte('log_date', startDateStr)
      .lte('log_date', endDateStr);

    if (!error && data) {
      setWeeklyLogs(data);
    }
    setLoading(false);
  };

  // Calculations
  const totalPossible = habits.length * 7;
  const totalCompleted = weeklyLogs.length;
  const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Group logs by day
  const dailyBreakdown = days7.map(day => {
    const count = weeklyLogs.filter(log => log.log_date === day.dateStr).length;
    const maxPoss = habits.length;
    const pct = maxPoss > 0 ? Math.round((count / maxPoss) * 100) : 0;
    return {
      ...day,
      count,
      pct
    };
  });

  // Best Day
  let bestDay = '-';
  let maxDayCount = -1;
  dailyBreakdown.forEach(d => {
    if (d.count > maxDayCount) {
      maxDayCount = d.count;
      bestDay = d.dayName;
    }
  });

  // Group logs by habit
  const habitBreakdown = habits.map(h => {
    const count = weeklyLogs.filter(log => log.habit_id === h.id).length;
    const pct = Math.round((count / 7) * 100);
    return {
      id: h.id,
      title: h.title,
      color: h.color || '#10b981',
      count,
      pct
    };
  }).sort((a, b) => b.count - a.count);

  const topHabit = habitBreakdown.length > 0 && habitBreakdown[0].count > 0 ? habitBreakdown[0].title : '-';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={22} color="#000000" />
            <h2 className={styles.title}>Báo Cáo Hiệu Suất Tuần</h2>
          </div>
          <button className="btn btn-icon" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', fontWeight: '600' }}>
              Đang tải dữ liệu báo cáo...
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Tỷ Lệ Hoàn Thành</span>
                  <span className={styles.metricValue}>{completionRate}%</span>
                  <span className={styles.metricSubtext}>{totalCompleted}/{totalPossible} lượt</span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Ngày Kỷ Luật Nhất</span>
                  <span className={styles.metricValue}>{bestDay}</span>
                  <span className={styles.metricSubtext}>{maxDayCount > 0 ? `${maxDayCount} hoàn thành` : 'Chưa có'}</span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Thói Quen Tốt Nhất</span>
                  <span className={styles.metricValue} style={{ fontSize: '1rem', lineHeight: '1.3' }}>
                    {topHabit}
                  </span>
                  <span className={styles.metricSubtext}>
                    {habitBreakdown[0]?.count > 0 ? `${habitBreakdown[0].count}/7 ngày` : 'Chưa có'}
                  </span>
                </div>
              </div>

              {/* Bar Chart Section */}
              <div className={styles.chartSection}>
                <h4 className={styles.sectionTitle}>Tần Suất Tích Theo Ngày</h4>
                <div className={styles.barsContainer}>
                  {dailyBreakdown.map((day, idx) => (
                    <div key={idx} className={styles.barCol}>
                      <span className={styles.barCount}>{day.count}</span>
                      <div className={styles.barTrack}>
                        <div 
                          className={styles.barFill} 
                          style={{ height: `${Math.max(day.pct, day.count > 0 ? 12 : 0)}%` }}
                        />
                      </div>
                      <span className={styles.barLabel}>{day.dayName}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Habits List */}
              <div className={styles.topHabitsSection}>
                <h4 className={styles.sectionTitle}>Chi Tiết Theo Thói Quen (7 Ngày Qua)</h4>
                {habitBreakdown.map(habit => (
                  <div key={habit.id} className={styles.habitStatRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div 
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '3px', 
                          backgroundColor: habit.color, 
                          border: '1.5px solid #000' 
                        }} 
                      />
                      <span className={styles.habitStatTitle}>{habit.title}</span>
                    </div>
                    <span className={styles.habitStatCount}>
                      {habit.count}/7 ngày ({habit.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
