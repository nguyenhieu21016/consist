import React, { useState, useEffect, useRef } from 'react';
import styles from './Heatmap.module.css';

export default function Heatmap({ logs = [], targetValue = 1, onDayClick }) {
  const [grid, setGrid] = useState([]);
  const [logMap, setLogMap] = useState({});
  const containerRef = useRef(null);

  useEffect(() => {
    // Generate data structure for 1 year
    const today = new Date();
    // Normalize today to local midnight
    today.setHours(0, 0, 0, 0);

    const yearData = [];
    const weeks = 52;
    const daysInYear = weeks * 7;
    
    // Start date is exactly 'daysInYear - 1' days ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (daysInYear - 1));

    let currentWeek = [];
    
    for (let i = 0; i < daysInYear; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA');
      
      currentWeek.push(dateStr);
      
      if (currentWeek.length === 7) {
        yearData.push(currentWeek);
        currentWeek = [];
      }
    }
    
    setGrid(yearData);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [grid]);

  useEffect(() => {
    const lMap = {};
    logs.forEach(log => {
      lMap[log.log_date] = (lMap[log.log_date] || 0) + (log.value || 1);
    });
    setLogMap(lMap);
  }, [logs]);

  const getColorClass = (dateStr) => {
    if (!dateStr) return '';
    const val = logMap[dateStr] || 0;
    if (val === 0) return '';
    
    const percentage = val / targetValue;
    
    if (percentage >= 1) return styles['build-level-4'];
    if (percentage >= 0.75) return styles['build-level-3'];
    if (percentage >= 0.5) return styles['build-level-2'];
    return styles['build-level-1'];
  };

  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  return (
    <div className={styles.heatmapContainer} ref={containerRef}>
      {grid.map((week, i) => (
        <div key={i} className={styles.week}>
          {week.map((day, j) => (
            <div 
              key={j} 
              className={`${styles.day} ${getColorClass(day)} ${day && day <= todayStr ? styles.clickable : ''}`} 
              onClick={() => {
                if (day && day <= todayStr && onDayClick) {
                  onDayClick(day);
                }
              }}
              title={day ? `${new Date(day).toLocaleDateString('vi-VN')} - Hoàn thành: ${logMap[day] || 0}/${targetValue}` : ''}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
