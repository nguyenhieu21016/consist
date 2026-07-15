"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setMessage(signUpError.message);
        }
      } else {
        setMessage(signInError.message);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div>
          <h1 className={`${styles.title} serif-heading`}>Consist</h1>
          <p className={styles.description}>
            The minimalist habit tracker.
          </p>
        </div>
        
        <form className={styles.form} onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Đăng nhập / Đăng ký'}
          </button>
        </form>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
