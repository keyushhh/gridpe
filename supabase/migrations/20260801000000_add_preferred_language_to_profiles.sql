-- Add preferred_language column to profiles table with allowed language constraint
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_preferred_language_check'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_preferred_language_check
        CHECK (preferred_language IN ('en', 'hi', 'kn', 'ta', 'te'));
    END IF;
END $$;
