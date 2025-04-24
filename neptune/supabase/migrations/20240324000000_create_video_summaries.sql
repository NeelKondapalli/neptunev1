-- Create video_summaries table
CREATE TABLE IF NOT EXISTS video_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  video_url TEXT NOT NULL,
  transcript TEXT NOT NULL,
  visual_metadata JSONB NOT NULL,
  structured_summary TEXT NOT NULL
);

-- Add RLS policies
ALTER TABLE video_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON video_summaries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON video_summaries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 