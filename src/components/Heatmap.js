import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Heatmap.module.css';

const formatDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export default function Heatmap({ logs = [], targetValue = 1, onDayClick, weeksCount = 22, color, createdAt }) {
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMouseEnter = (e, dayStr) => {
    if (!dayStr) return;
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) return;
    const rect = e.target.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredDay(dayStr);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const grid = useMemo(() => {
    const today = new Date();
    
    // Determine start date: Sunday of the week createdAt falls in, or fallback
    let startDate;
    if (createdAt) {
      const createdDate = new Date(createdAt);
      startDate = new Date(createdDate);
      startDate.setDate(createdDate.getDate() - createdDate.getDay());
    } else {
      const dayOfWeek = today.getDay();
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
      startDate = new Date(endOfWeek);
      startDate.setDate(endOfWeek.getDate() - ((weeksCount || 22) * 7 - 1));
    }

    const countOfWeeks = weeksCount || 22;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (countOfWeeks * 7 - 1));

    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const ymd = formatDate(currentDate);
      currentWeek.push(ymd);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
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
  }, [createdAt, weeksCount]);

  const getColorStyle = (dateString) => {
    if (!dateString) return {};
    const val = logMap[dateString];
    if (val === undefined || val === 0) return {};

    const ratio = val / targetValue;
    let opacity = 0.3;
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

  const handleCellClick = (e, dayStr) => {
    // Prevent accidental toggles on mobile / touch screens (< 768px)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

    if (dayStr && dayStr <= todayStr && onDayClick) {
      onDayClick(dayStr);
    }
  };

  return (
    <div className={styles.heatmapContainer}>
      {grid.map((week, i) => (
        <div key={i} className={styles.week}>
          {week.map((dayStr, j) => {
            const isClickable = dayStr && dayStr <= todayStr;

            return (
              <div 
                key={j} 
                className={`${styles.day} ${isClickable ? styles.clickable : ''}`} 
                style={getColorStyle(dayStr)}
                onMouseEnter={(e) => handleMouseEnter(e, dayStr)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => handleCellClick(e, dayStr)}
              />
            );
          })}
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
