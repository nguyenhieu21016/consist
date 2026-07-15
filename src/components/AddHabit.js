"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './AddHabit.module.css';

export default function AddHabit({ session, onClose, onHabitAdded }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('build');
  const [unit, setUnit] = useState('times');
  const [targetValue, setTargetValue] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          user_id: session.user.id,
          title,
          type,
          unit,
          target_value: targetValue,
          schedule_type: 'daily',
        }
      ])
      .select();

    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      onHabitAdded(data[0]);
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={`${styles.title} serif-heading`}>Thêm Thói quen mới</h2>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tên thói quen</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="input-base"
              placeholder="Ví dụ: Đọc sách 30 phút"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Loại</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="type" 
                  value="build" 
                  checked={type === 'build'} 
                  onChange={(e) => setType(e.target.value)} 
                />
                Build (Muốn xây)
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="type" 
                  value="quit" 
                  checked={type === 'quit'} 
                  onChange={(e) => setType(e.target.value)} 
                />
                Quit (Muốn bỏ)
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Đơn vị đo</label>
            <select 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              className="input-base"
            >
              <option value="times">Lần (times)</option>
              <option value="mins">Phút (mins)</option>
              <option value="pages">Trang (pages)</option>
              <option value="cups">Cốc (cups)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mục tiêu mỗi ngày</label>
            <input 
              type="number" 
              value={targetValue} 
              onChange={(e) => setTargetValue(e.target.value)}
              className="input-base"
              min="1"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thói quen'}
          </button>
        </form>
      </div>
    </div>
  );
}
