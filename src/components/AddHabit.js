"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './AddHabit.module.css';

export default function AddHabit({ session, onClose, onHabitAdded, habitToEdit, onHabitUpdated, onHabitDeleted }) {
  const isEditMode = !!habitToEdit;
  const [title, setTitle] = useState(habitToEdit?.title || '');
  const [description, setDescription] = useState(habitToEdit?.description || '');
  const [unit, setUnit] = useState(habitToEdit?.unit || 'times');
  const [targetValue, setTargetValue] = useState(habitToEdit?.target_value || 1);
  const [color, setColor] = useState(habitToEdit?.color || '#10b981');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isEditMode) {
      const { data, error } = await supabase
        .from('habits')
        .update({
          title,
          type: 'build',
          unit,
          target_value: targetValue,
          description,
          color,
        })
        .eq('id', habitToEdit.id)
        .select();

      setLoading(false);
      if (error) {
        alert(error.message);
      } else {
        if (onHabitUpdated) onHabitUpdated(data[0]);
        onClose();
      }
    } else {
      const { data, error } = await supabase
        .from('habits')
        .insert([
          {
            user_id: session.user.id,
            title,
            type: 'build',
            unit,
            target_value: targetValue,
            schedule_type: 'daily',
            description,
            color,
          }
        ])
        .select();

      setLoading(false);
      if (error) {
        alert(error.message);
      } else {
        if (onHabitAdded) onHabitAdded(data[0]);
        onClose();
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa thói quen này không? Toàn bộ dữ liệu lịch sử sẽ bị xóa.')) return;
    setLoading(true);
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitToEdit.id);
    
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      if (onHabitDeleted) onHabitDeleted(habitToEdit.id);
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={`${styles.title} serif-heading`}>
            {isEditMode ? 'Sửa Thói quen' : 'Thêm Thói quen mới'}
          </h2>
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
            <label className={styles.label}>Mô tả</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="input-base"
              placeholder="Ví dụ: Đi bộ 30 phút buổi sáng để sảng khoái tinh thần"
              style={{ height: '80px', resize: 'vertical' }}
            />
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Màu sắc hiển thị</label>
            <div className={styles.colorSelector}>
              {[
                { name: 'Emerald', value: '#10b981' },
                { name: 'Purple', value: '#8b5cf6' },
                { name: 'Red', value: '#ef4444' },
                { name: 'Orange', value: '#f97316' },
                { name: 'Blue', value: '#3b82f6' },
                { name: 'Teal', value: '#06b6d4' }
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.colorDot} ${color === c.value ? styles.colorDotSelected : ''}`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu lại'}
            </button>
            {isEditMode && (
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ color: 'var(--quit-color)' }}
                onClick={handleDelete}
                disabled={loading}
              >
                Xóa
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
