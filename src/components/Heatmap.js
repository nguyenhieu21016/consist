import React, { useMemo } from 'react';
import styles from './Heatmap.module.css';

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export default function Heatmap({ logs = [], type = 'build', targetValue = 1 }) {
  const logMap = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      map[log.log_date] = Number(log.value);
    });
    return map;
  }, [logs]);

  const grid = useMemo(() => {
    const today = new Date();
    // Go back 365 days
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    // Adjust to start on a Sunday
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today || (currentWeek.length > 0 && currentWeek.length < 7)) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      if (currentDate > today) {
        // Fill the rest of the week with empty if needed
        currentWeek.push(null);
      } else {
        currentWeek.push(formatDate(currentDate));
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    return weeks;
  }, []);

  const getColorClass = (dateString) => {
    if (!dateString) return '';
    const val = logMap[dateString];
    if (val === undefined || val === 0) return ''; // No activity

    const ratio = val / targetValue;
    let level = 1;
    if (ratio >= 1) level = 4;
    else if (ratio >= 0.75) level = 3;
    else if (ratio >= 0.5) level = 2;

    return styles[`${type}-level-${level}`];
  };

  return (
    <div className={styles.heatmapContainer}>
      {grid.map((week, i) => (
        <div key={i} className={styles.week}>
          {week.map((day, j) => (
            <div 
              key={j} 
              className={`${styles.day} ${getColorClass(day)}`} 
              title={day ? `${day}: ${logMap[day] || 0}` : ''}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
