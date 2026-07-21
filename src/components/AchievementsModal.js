"use client";
import { X, Award, ShieldCheck, Lock } from 'lucide-react';
import styles from './AchievementsModal.module.css';

export default function AchievementsModal({ gamificationData, onClose }) {
  const {
    totalXP,
    level,
    levelTitle,
    levelProgress,
    xpInCurrentLevel,
    xpNeededForNext,
    achievements,
    unlockedAchievementsCount
  } = gamificationData;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={22} color="#000000" />
            <h2 className={styles.title}>Cấp Độ & Thành Tựu</h2>
          </div>
          <button className="btn btn-icon" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Level Progress Card */}
          <div className={styles.levelCard}>
            <div className={styles.levelHeader}>
              <div>
                <span className={styles.levelNumber}>Level {level}</span>
                <span className={styles.levelTitle}> — {levelTitle}</span>
              </div>
              <span className={styles.xpText}>{totalXP} Total XP</span>
            </div>

            <div className={styles.progressBarTrack}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${levelProgress}%` }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280' }}>
              <span>Tiến trình Level: {levelProgress}%</span>
              <span>{xpInCurrentLevel} / {xpNeededForNext} XP</span>
            </div>
          </div>

          {/* Achievements List */}
          <div className={styles.achievementsList}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 className={styles.sectionTitle}>Danh Sách Huy Hiệu</h4>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981' }}>
                Đã mở khóa: {unlockedAchievementsCount}/{achievements.length}
              </span>
            </div>

            {achievements.map((item) => (
              <div 
                key={item.id} 
                className={`${styles.achievementItem} ${!item.unlocked ? styles.locked : ''}`}
              >
                <div className={styles.achievementInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.unlocked ? (
                      <ShieldCheck size={18} color="#10b981" />
                    ) : (
                      <Lock size={16} color="#9ca3af" />
                    )}
                    <span className={styles.achievementTitle}>{item.title}</span>
                  </div>
                  <span className={styles.achievementDesc}>{item.desc}</span>
                </div>

                <span className={`${styles.statusBadge} ${item.unlocked ? styles.unlocked : styles.locked}`}>
                  {item.unlocked ? 'Đã Đạt' : 'Chưa Khóa'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
