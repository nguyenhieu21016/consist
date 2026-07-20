-- schema.sql
-- Run this in your Supabase SQL Editor

-- 1. Create habits table
CREATE TABLE IF NOT EXISTS public.habits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    type text NOT NULL CHECK (type IN ('build', 'quit')),
    unit text NOT NULL DEFAULT 'times', -- times, mins, cups, etc.
    target_value numeric NOT NULL DEFAULT 1,
    schedule_type text NOT NULL DEFAULT 'daily', -- daily, weekly, custom
    schedule_days jsonb, -- e.g., [1,2,3,4,5,6,0] for days of week
    color text, -- For custom heatmap color
    category text,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create habit_logs table
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    value numeric NOT NULL DEFAULT 0,
    note text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(habit_id, log_date)
);

-- 3. Create habit_stats table to cache streaks
CREATE TABLE IF NOT EXISTS public.habit_stats (
    habit_id uuid PRIMARY KEY REFERENCES public.habits(id) ON DELETE CASCADE,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    strength_score numeric DEFAULT 0, -- percentage
    last_calculated_at timestamp with time zone DEFAULT now()
);

-- Function to initialize stats when a habit is created
CREATE OR REPLACE FUNCTION public.init_habit_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.habit_stats (habit_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_habit_created
    AFTER INSERT ON public.habits
    FOR EACH ROW EXECUTE FUNCTION public.init_habit_stats();

-- Add Row Level Security (RLS)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_stats ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own habits"
    ON public.habits FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habit logs"
    ON public.habit_logs FOR ALL
    USING (habit_id IN (SELECT id FROM public.habits WHERE user_id = auth.uid()))
    WITH CHECK (habit_id IN (SELECT id FROM public.habits WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their own habit stats"
    ON public.habit_stats FOR SELECT
    USING (habit_id IN (SELECT id FROM public.habits WHERE user_id = auth.uid()));
