export function calculateHabitStats(logs = []) {
  if (!logs || logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, consistency30: 0, totalCompletions: 0 };
  }

  const logDatesSet = new Set(logs.map(log => log.log_date));

  const formatYMD = (d) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split('T')[0];
  };

  const today = new Date();
  const todayStr = formatYMD(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatYMD(yesterday);

  // 1. Current Streak
  let currentStreak = 0;
  let checkDate = new Date(today);

  if (logDatesSet.has(todayStr)) {
    while (logDatesSet.has(formatYMD(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else if (logDatesSet.has(yesterdayStr)) {
    checkDate = yesterday;
    while (logDatesSet.has(formatYMD(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // 2. Longest Streak
  const uniqueDates = Array.from(logDatesSet).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of uniqueDates) {
    const currDate = new Date(dateStr + 'T00:00:00');
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = currDate;
  }

  // 3. Consistency score (past 30 days)
  let count30 = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (logDatesSet.has(formatYMD(d))) {
      count30++;
    }
  }
  const consistency30 = Math.round((count30 / 30) * 100);

  return {
    currentStreak,
    longestStreak,
    consistency30,
    totalCompletions: logs.length
  };
}
