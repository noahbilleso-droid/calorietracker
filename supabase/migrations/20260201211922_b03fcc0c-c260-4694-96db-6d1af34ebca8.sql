-- Create water_entries table for individual water intake entries
CREATE TABLE public.water_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount_ml INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  day_date DATE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.water_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own water entries"
ON public.water_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water entries"
ON public.water_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water entries"
ON public.water_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for efficient queries by user and date
CREATE INDEX idx_water_entries_user_date ON public.water_entries(user_id, day_date);