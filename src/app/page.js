"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Dashboard from '@/components/Dashboard';
import Login from '@/components/Login';
import styles from './page.module.css';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <main className={styles.main}>
      {session ? <Dashboard session={session} /> : <Login />}
    </main>
  );
}
