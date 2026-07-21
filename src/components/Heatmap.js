import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Heatmap.module.css';

const formatDate = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export default function Heatmap({ logs = [], targetValue = 1, onDayClick, weeksCount = 18, color, createdAt }) {
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

  const handleMouseEnter = (e, dayObj) => {
    if (!dayObj || !dayObj.ymd || dayObj.isBeforeCreated) return;
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) return;
    const rect = e.target.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredDay(dayObj.ymd);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const grid = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek)); // Saturday of current week

    const countOfWeeks = weeksCount || 18;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (countOfWeeks * 7 - 1));

    const createdYMD = createdAt ? formatDate(createdAt) : null;
    const weeks = [];
    let currentWeek = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const ymd = formatDate(currentDate);
      const isBeforeCreated = createdYMD && ymd < createdYMD;

      currentWeek.push({
        ymd,
        isBeforeCreated
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeks;
  }, [createdAt, weeksCount]);

  const getColorStyle = (dayObj) => {
    if (!dayObj || dayObj.isBeforeCreated) return {};
    const val = logMap[dayObj.ymd];
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

  const handleCellClick = (e, dayObj) => {
    // Prevent accidental toggles on mobile / touch screens (< 768px)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      return;
    }

    if (dayObj && !dayObj.isBeforeCreated && dayObj.ymd <= todayStr && onDayClick) {
      onDayClick(dayObj.ymd);
    }
  };

  return (
    <div className={styles.heatmapContainer}>
      {grid.map((week, i) => (
        <div key={i} className={styles.week}>
          {week.map((dayObj, j) => {
            const isClickable = dayObj && !dayObj.isBeforeCreated && dayObj.ymd <= todayStr;
            const isBefore = dayObj?.isBeforeCreated;

            return (
              <div 
                key={j} 
                className={`${styles.day} ${isBefore ? styles.beforeCreated : ''} ${isClickable ? styles.clickable : ''}`} 
                style={getColorStyle(dayObj)}
                onMouseEnter={(e) => handleMouseEnter(e, dayObj)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => handleCellClick(e, dayObj)}
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
