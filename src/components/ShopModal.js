"use client";
import { useState, useEffect } from 'react';
import { X, ShoppingBag, ShieldCheck, Zap, Gift, Coffee, HeartHandshake, Lock } from 'lucide-react';
import styles from './ShopModal.module.css';
import { supabase } from '@/lib/supabase';
import { calculateHabitStats } from '@/lib/habitStats';

export default function ShopModal({ totalEarnedCoins, maxStreakEver = 0, habits = [], allLogs = [], session, onClose }) {
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'inventory'
  const [spentCoins, setSpentCoins] = useState(0);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [inventory, setInventory] = useState({
    boost: 0,
    cheat_drink: 0,
    cheat_snack: 0,
    cheat_movie: 0,
    rest_walk: 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSpent = parseInt(localStorage.getItem('consist_spent_coins') || '0', 10);
      const savedInv = JSON.parse(localStorage.getItem('consist_inventory') || '{"boost":0,"cheat_drink":0,"cheat_snack":0,"cheat_movie":0,"rest_walk":0}');
      setSpentCoins(savedSpent);
      setInventory(savedInv);
    }
    if (habits.length > 0) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits]);

  const availableCoins = Math.max(0, totalEarnedCoins - spentCoins);

  const getItemStreak = (item) => {
    if (!item.targetKeyword) return maxStreakEver;
    const keywords = Array.isArray(item.targetKeyword) ? item.targetKeyword : [item.targetKeyword];
    const targetHabit = habits.find(h => keywords.some(kw => h.title.toLowerCase().includes(kw)));
    if (!targetHabit) return 0;
    const habitLogs = allLogs.filter(log => log.habit_id === targetHabit.id);
    const stats = calculateHabitStats(habitLogs);
    return Math.max(stats.currentStreak, stats.longestStreak);
  };

  const shopItems = [
    {
      id: 'rest_walk',
      name: 'Thưởng 1 Ngày Nghỉ Đi Bộ',
      desc: 'Tự động tích xanh thói quen Đi bộ cho phép bạn nghỉ ngơi 1 ngày',
      minStreak: 5,
      targetKeyword: ['đi bộ', 'walk'],
      price: 150,
      icon: Gift,
      color: '#06b6d4'
    },
    {
      id: 'cheat_snack',
      name: 'Thưởng 1 Bữa Ăn Vặt Khoái Khẩu',
      desc: 'Tự động tích xanh thói quen Bỏ ăn vặt để bạn thưởng 1 bữa thảnh thơi',
      minStreak: 5,
      targetKeyword: ['ăn vặt', 'snack'],
      price: 200,
      icon: Gift,
      color: '#10b981'
    },
    {
      id: 'cheat_drink',
      name: 'Thưởng 1 Ly Trà Sữa / Nước Ngọt',
      desc: 'Tự động tích xanh Bỏ trà sữa cho phép bạn thưởng 1 ly xả hơi',
      minStreak: 7,
      targetKeyword: ['trà sữa', 'nước ngọt'],
      price: 250,
      icon: Coffee,
      color: '#ec4899'
    },
    {
      id: 'cheat_movie',
      name: 'Thưởng 1 Đêm Xem Phim Muộn',
      desc: 'Tự động tích xanh Ngủ trước 11h cho phép thức muộn xem phim cuối tuần',
      minStreak: 7,
      targetKeyword: ['ngủ', 'sleep'],
      price: 300,
      icon: HeartHandshake,
      color: '#8b5cf6'
    }
  ];

  const handleBuy = (item) => {
    const itemStreak = getItemStreak(item);
    if (availableCoins < item.price || itemStreak < item.minStreak) return;

    const newSpent = spentCoins + item.price;
    const newInv = {
      ...inventory,
      [item.id]: (inventory[item.id] || 0) + 1
    };

    setSpentCoins(newSpent);
    setInventory(newInv);

    if (typeof window !== 'undefined') {
      localStorage.setItem('consist_spent_coins', newSpent.toString());
      localStorage.setItem('consist_inventory', JSON.stringify(newInv));
    }
  };

  const handleUseItem = async (item) => {
    if ((inventory[item.id] || 0) <= 0) return;

    let targetHabit = null;
    if (item.targetKeyword) {
      const keywords = Array.isArray(item.targetKeyword) ? item.targetKeyword : [item.targetKeyword];
      targetHabit = habits.find(h => keywords.some(kw => h.title.toLowerCase().includes(kw)));
    }
    if (!targetHabit) {
      targetHabit = habits.find(h => h.id === selectedHabitId) || habits[0];
    }

    if (!targetHabit) {
      alert('Không tìm thấy thói quen phù hợp để áp dụng thẻ.');
      return;
    }

    const todayDateStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    if (!confirm(`Sử dụng "${item.name}" để tự động tích xanh cho thói quen: "${targetHabit.title}" hôm nay?`)) {
      return;
    }

    const { error } = await supabase.from('habit_logs').insert([
      { habit_id: targetHabit.id, log_date: todayDateStr, value: targetHabit.target_value }
    ]);

    if (!error) {
      const newInv = {
        ...inventory,
        [item.id]: Math.max(0, (inventory[item.id] || 0) - 1)
      };
      setInventory(newInv);
      if (typeof window !== 'undefined') {
        localStorage.setItem('consist_inventory', JSON.stringify(newInv));
      }
      alert(`Đã áp dụng thẻ "${item.name}"! Thói quen "${targetHabit.title}" hôm nay đã được tích xanh thành công.`);
    } else {
      alert('Hôm nay thói quen này đã được tích xanh trước đó.');
    }
  };

  const ownedItems = shopItems.filter(item => (inventory[item.id] || 0) > 0);
  const totalOwnedCount = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <ShoppingBag size={22} color="#000000" />
            <h2 className={styles.title}>Cửa Hàng & Kho Đồ</h2>
          </div>
          <button className="btn btn-icon" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'shop' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('shop')}
          >
            Cửa Hàng Mua Sắm
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'inventory' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Kho Đồ Của Tôi ({totalOwnedCount})
          </button>
        </div>

        <div className={styles.content}>
          {/* Balance Card */}
          <div className={styles.balanceCard}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className={styles.balanceLabel}>Số Coin Khả Dụng:</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981' }}>
                Thưởng +5 Coins/thói quen & +15 Coins/ngày hoàn hảo
              </span>
            </div>
            <span className={styles.balanceValue}>{availableCoins} Coins</span>
          </div>

          {activeTab === 'shop' ? (
            /* Shop Tab */
            <div className={styles.itemsGrid}>
              {shopItems.map((item) => {
                const IconComp = item.icon;
                const ownedCount = inventory[item.id] || 0;
                const itemStreak = getItemStreak(item);
                const isStreakUnlocked = itemStreak >= item.minStreak;
                const canAfford = availableCoins >= item.price && isStreakUnlocked;

                return (
                  <div key={item.id} className={styles.shopItem} style={{ opacity: isStreakUnlocked ? 1 : 0.65 }}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemHeader}>
                        {isStreakUnlocked ? (
                          <IconComp size={20} color={item.color} />
                        ) : (
                          <Lock size={18} color="#9ca3af" />
                        )}
                        <span className={styles.itemName}>{item.name}</span>
                      </div>
                      <span className={styles.itemDesc}>{item.desc}</span>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '800', 
                          color: isStreakUnlocked ? '#15803d' : '#b91c1c', 
                          backgroundColor: isStreakUnlocked ? '#dcfce7' : '#fee2e2', 
                          padding: '2px 8px', 
                          borderRadius: '6px', 
                          border: '1.5px solid #000' 
                        }}>
                          Yêu cầu: Streak {item.minStreak}d {isStreakUnlocked ? '(Đã Đạt)' : `(Hiện có ${itemStreak}d)`}
                        </span>
                        <span className={styles.itemMeta}>Đã mua: {ownedCount}</span>
                      </div>
                    </div>

                    <button
                      className={styles.buyBtn}
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                    >
                      {!isStreakUnlocked ? `Cần Streak ${item.minStreak}d` : `Mua (${item.price} Coins)`}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Inventory Tab */
            <div className={styles.itemsGrid}>
              {ownedItems.length > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '700' }}>Chọn thói quen để áp dụng thẻ:</label>
                    <select 
                      value={selectedHabitId} 
                      onChange={(e) => setSelectedHabitId(e.target.value)}
                      className="input-base"
                      style={{ height: '36px', width: 'auto', padding: '4px 10px', fontSize: '0.85rem' }}
                    >
                      {habits.map(h => (
                        <option key={h.id} value={h.id}>{h.title}</option>
                      ))}
                    </select>
                  </div>

                  {ownedItems.map((item) => {
                    const IconComp = item.icon;
                    const count = inventory[item.id] || 0;

                    return (
                      <div key={item.id} className={styles.shopItem} style={{ background: '#fffdf5' }}>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemHeader}>
                            <IconComp size={20} color={item.color} />
                            <span className={styles.itemName}>{item.name}</span>
                          </div>
                          <span className={styles.itemDesc}>{item.desc}</span>
                          <span className={styles.itemMeta} style={{ color: '#000', fontWeight: '800' }}>
                            Số lượng khả dụng: x{count} thẻ
                          </span>
                        </div>

                        <button
                          onClick={() => handleUseItem(item)}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: '2.5px solid #000',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '2.5px 2.5px 0px #000',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Dùng thẻ (Tự động tích xanh)
                        </button>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', fontWeight: '600', color: '#6b7280' }}>
                  Kho đồ hiện tại đang trống. Hãy đạt Streak kỷ luật và dùng Coins đổi thẻ từ Cửa Hàng!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
