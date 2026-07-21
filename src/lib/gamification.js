import { calculateHabitStats } from './habitStats';

export function calculateGamificationData(habits = [], logs = []) {
  const totalLogsCount = logs.length;
  
  const habitLogsMap = {};
  const dateLogsMap = {};

  logs.forEach(log => {
    // Group by habit
    if (!habitLogsMap[log.habit_id]) {
      habitLogsMap[log.habit_id] = [];
    }
    habitLogsMap[log.habit_id].push(log);

    // Group by date
    if (!dateLogsMap[log.log_date]) {
      dateLogsMap[log.log_date] = new Set();
    }
    dateLogsMap[log.log_date].add(log.habit_id);
  });

  let totalXP = 0;
  let maxStreakEver = 0;

  // Map each habit to its calculated stats and logs count
  const habitStatsList = habits.map(habit => {
    const hLogs = habitLogsMap[habit.id] || [];
    const stats = calculateHabitStats(hLogs);
    if (stats.longestStreak > maxStreakEver) {
      maxStreakEver = stats.longestStreak;
    }

    hLogs.forEach(() => {
      totalXP += 10;
    });
    totalXP += stats.currentStreak * 2;

    return {
      id: habit.id,
      title: habit.title.toLowerCase(),
      logsCount: hLogs.length,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      consistency30: stats.consistency30
    };
  });

  // Calculate Coin Economy:
  // Base: 5 Coins per completed log
  // Perfect Day Bonus: +15 Coins if 100% habits completed on that day
  let perfectDaysCount = 0;
  const totalHabitsCount = habits.length;

  if (totalHabitsCount > 0) {
    Object.keys(dateLogsMap).forEach(dateStr => {
      if (dateLogsMap[dateStr].size >= totalHabitsCount) {
        perfectDaysCount++;
      }
    });
  }

  const totalEarnedCoins = (totalLogsCount * 5) + (perfectDaysCount * 15);

  // Helper to check if any matching habit title satisfies condition
  const checkHabitAchievement = (keywords, streakMin = 0, logsMin = 0) => {
    return habitStatsList.some(h => {
      const match = keywords.some(kw => h.title.includes(kw));
      if (!match) return false;
      if (streakMin > 0 && h.longestStreak < streakMin && h.currentStreak < streakMin) return false;
      if (logsMin > 0 && h.logsCount < logsMin) return false;
      return true;
    });
  };

  const levelThresholds = [0, 150, 350, 650, 1050, 1550, 2150, 2850, 3650, 4550, 5600, 7000];
  let level = 1;
  for (let i = 0; i < levelThresholds.length; i++) {
    if (totalXP >= levelThresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentLevelXP = levelThresholds[level - 1] || 0;
  const nextLevelXP = levelThresholds[level] || currentLevelXP + 500;
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const levelProgress = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100));

  const levelTitles = {
    1: 'Tân Thủ Kỷ Luật',
    2: 'Người Rèn Luyện',
    3: 'Chiến Binh Kiên Trì',
    4: 'Kỷ Luật Sắt',
    5: 'Bậc Thầy Nhất Quán',
    6: 'Huyền Thoại Thói Quen',
    7: 'Chiến Binh Bất Bại'
  };
  const levelTitle = levelTitles[level] || `Cao Thủ Lv.${level}`;

  const achievements = [
    {
      id: 'first_step',
      title: 'Khởi Đầu Kỷ Luật',
      desc: 'Hoàn thành lượt check-in đầu tiên',
      unlocked: totalLogsCount >= 1
    },
    {
      id: 'streak_3',
      title: 'Khởi Động 3 Ngày',
      desc: 'Đạt chuỗi liên tục 3 ngày cho 1 thói quen',
      unlocked: maxStreakEver >= 3
    },
    {
      id: 'streak_7',
      title: 'Chuỗi 7 Ngày Tuần',
      desc: 'Đạt chuỗi liên tục 7 ngày cho 1 thói quen',
      unlocked: maxStreakEver >= 7
    },
    {
      id: 'streak_14',
      title: 'Chuỗi 14 Ngày',
      desc: 'Đạt chuỗi liên tục 14 ngày cho 1 thói quen',
      unlocked: maxStreakEver >= 14
    },
    {
      id: 'streak_30',
      title: 'Chuỗi 30 Ngày Kiên Trì',
      desc: 'Đạt chuỗi liên tục 30 ngày cho 1 thói quen',
      unlocked: maxStreakEver >= 30
    },
    {
      id: 'logs_20',
      title: 'Tích Cực Rèn Luyện',
      desc: 'Tích lũy tổng cộng 20 lượt check-in',
      unlocked: totalLogsCount >= 20
    },
    {
      id: 'logs_50',
      title: 'Chăm Chỉ Cần Mẫn',
      desc: 'Tích lũy tổng cộng 50 lượt check-in',
      unlocked: totalLogsCount >= 50
    },
    {
      id: 'logs_100',
      title: 'Bứt Phá 100 Lượt',
      desc: 'Tích lũy tổng cộng 100 lượt check-in',
      unlocked: totalLogsCount >= 100
    },
    {
      id: 'habits_3',
      title: 'Người Đa Năng',
      desc: 'Duy trì từ 3 thói quen cùng lúc',
      unlocked: habits.length >= 3
    },
    {
      id: 'habits_5',
      title: 'Bậc Thầy Kỷ Luật',
      desc: 'Duy trì từ 5 thói quen cùng lúc',
      unlocked: habits.length >= 5
    },
    {
      id: 'habit_sleep',
      title: 'Giấc Ngủ Vàng',
      desc: 'Đạt 7 ngày thói quen Ngủ trước 11h',
      unlocked: checkHabitAchievement(['ngủ', 'sleep'], 7, 7)
    },
    {
      id: 'habit_rice',
      title: 'Kỷ Luật Bữa Ăn',
      desc: 'Đạt 7 ngày thói quen Chỉ ăn 2 bát cơm',
      unlocked: checkHabitAchievement(['cơm', 'bát cơm', 'ăn 2 bát'], 7, 7)
    },
    {
      id: 'habit_soda',
      title: 'Cắt Giảm Đường',
      desc: 'Đạt 7 ngày thói quen Bỏ nước ngọt, trà sữa',
      unlocked: checkHabitAchievement(['nước ngọt', 'trà sữa', 'soda'], 7, 7)
    },
    {
      id: 'habit_snack',
      title: 'Vượt Qua Cơn Thèm',
      desc: 'Đạt 7 ngày thói quen Bỏ ăn vặt',
      unlocked: checkHabitAchievement(['ăn vặt', 'snack'], 7, 7)
    },
    {
      id: 'habit_porno',
      title: 'Làm Chủ Bản Thân',
      desc: 'Đạt 7 ngày thói quen Bỏ pornography',
      unlocked: checkHabitAchievement(['porno', 'pornography', 'nội dung xấu'], 7, 7)
    },
    {
      id: 'habit_walk',
      title: 'Chiến Binh Đi Bộ',
      desc: 'Đạt 7 ngày thói quen Đi bộ 30 phút',
      unlocked: checkHabitAchievement(['đi bộ', 'walk'], 7, 7)
    },
    {
      id: 'habit_porno_30',
      title: 'Kỷ Luật Tinh Thần',
      desc: 'Đạt 30 ngày thói quen Bỏ pornography',
      unlocked: checkHabitAchievement(['porno', 'pornography'], 30, 30)
    },
    {
      id: 'habit_health_30',
      title: 'Bảo Vệ Sức Khỏe',
      desc: 'Đạt 30 ngày thói quen Bỏ nước ngọt hoặc Bỏ ăn vặt',
      unlocked: checkHabitAchievement(['nước ngọt', 'trà sữa', 'ăn vặt'], 30, 30)
    }
  ];

  const unlockedAchievementsCount = achievements.filter(a => a.unlocked).length;

  return {
    totalXP,
    totalEarnedCoins,
    perfectDaysCount,
    level,
    levelTitle,
    levelProgress,
    xpInCurrentLevel,
    xpNeededForNext,
    achievements,
    unlockedAchievementsCount,
    maxStreakEver
  };
}
