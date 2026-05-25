-- ============================================================
-- DALTI — Database Migration: Fix tickets table column types
-- ============================================================
-- 
-- CURRENT (broken) schema:
--   called_at     time with time zone NOT NULL
--   completed_at  time with time zone NOT NULL  
--   actual_wait_time bigint NOT NULL
--
-- CORRECT schema (what we need):
--   called_at     timestamptz NULL
--   completed_at  timestamptz NULL
--   actual_wait_time bigint NULL DEFAULT 0
--
-- FOR NOW: the code works with the current schema.
-- Run this migration LATER when you want proper timestamps.
-- ============================================================

-- Step 1: Drop NOT NULL constraints first
ALTER TABLE public.tickets ALTER COLUMN called_at DROP NOT NULL;
ALTER TABLE public.tickets ALTER COLUMN completed_at DROP NOT NULL;
ALTER TABLE public.tickets ALTER COLUMN actual_wait_time DROP NOT NULL;

-- Step 2: Change column types (timetz → timestamptz)
-- USING NULL clears existing time-only values that can't convert
ALTER TABLE public.tickets ALTER COLUMN called_at TYPE timestamptz USING NULL;
ALTER TABLE public.tickets ALTER COLUMN completed_at TYPE timestamptz USING NULL;

-- Step 3: Set default for actual_wait_time
ALTER TABLE public.tickets ALTER COLUMN actual_wait_time SET DEFAULT 0;

-- Verify:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'tickets'
-- ORDER BY ordinal_position;
