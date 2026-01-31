-- Create water_logs table to track daily water intake
CREATE TABLE public.water_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_date DATE NOT NULL,
  intake_ml INTEGER NOT NULL DEFAULT 0,
  goal_ml INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT water_logs_user_date_unique UNIQUE (user_id, day_date)
);

-- Enable Row Level Security
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own water logs"
ON public.water_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs"
ON public.water_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs"
ON public.water_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_water_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_water_logs_updated_at
BEFORE UPDATE ON public.water_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_water_logs_updated_at();