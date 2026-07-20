import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Heatmap.module.css';

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export default function Heatmap({ logs = [], targetValue = 1, onDayClick, weeksCount, color }) {
  const logMap = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      map[log.log_date] = Number(log.value);
    });
    return map;
  }, [logs]);

  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const handleMouseEnter = (e, day) => {
    if (!day) return;
    const rect = e.target.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredDay(day);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const grid = useMemo(() => {
    const today = new Date();
    
    if (weeksCount) {
      const dayOfWeek = today.getDay();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + (6 - dayOfWeek));
      
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - (weeksCount * 7 - 1));

      const weeks = [];
      let currentWeek = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        currentWeek.push(formatDate(currentDate));
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return weeks;
    }

    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, 0, 1); // Jan 1st
    const endDate = new Date(currentYear, 11, 31); // Dec 31st

    // Adjust to start on a Sunday
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      if (currentDate > endDate && currentWeek.length === 0) {
        break;
      }

      if (currentDate.getFullYear() !== currentYear) {
        currentWeek.push(null);
      } else {
        currentWeek.push(formatDate(currentDate));
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }
    return weeks;
  }, [weeksCount]);

  const getColorStyle = (dateString) => {
    if (!dateString) return {};
    const val = logMap[dateString];
    if (val === undefined || val === 0) return {};

    const ratio = val / targetValue;
    let opacity = 0.25;
    if (ratio >= 1) opacity = 1.0;
    else if (ratio >= 0.75) opacity = 0.75;
    else if (ratio >= 0.5) opacity = 0.5;

    const baseColor = color || '#10b981';
    return {
      backgroundColor: baseColor,
      opacity: opacity
    };
  };

  const getTodayString = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
  };
  const todayStr = getTodayString();

  const getTooltip = (dayStr) => {
    if (!dayStr) return '';
    const dateObj = new Date(dayStr);
    const formatted = dateObj.toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const val = logMap[dayStr] || 0;
    return `${formatted} \nHoàn thành: ${val} / ${targetValue}`;
  };

  return (
    <div className={styles.heatmapContainer}>
      {grid.map((week, i) => (
        <div key={i} className={styles.week}>
          {week.map((day, j) => (
            <div 
              key={j} 
              className={`${styles.day} ${day && day <= todayStr ? styles.clickable : ''}`} 
              style={getColorStyle(day)}
              onMouseEnter={(e) => handleMouseEnter(e, day)}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                if (day && day <= todayStr && onDayClick) {
                  onDayClick(day);
                }
              }}
            />
          ))}
        </div>
      ))}
      
      {isClient && hoveredDay && createPortal(
        <div 
          className={styles.tooltip}
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y}px`
          }}
        >
          {getTooltip(hoveredDay).split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
