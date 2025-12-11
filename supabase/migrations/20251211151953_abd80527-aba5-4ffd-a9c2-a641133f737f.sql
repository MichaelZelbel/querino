-- Create activity_events table
CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  item_type text CHECK (item_type IN ('prompt', 'skill', 'workflow', 'collection', 'profile', 'team')),
  item_id uuid,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_activity_events_actor_id ON public.activity_events(actor_id);
CREATE INDEX idx_activity_events_team_id ON public.activity_events(team_id);
CREATE INDEX idx_activity_events_item_id ON public.activity_events(item_id);
CREATE INDEX idx_activity_events_item_type ON public.activity_events(item_type);
CREATE INDEX idx_activity_events_created_at ON public.activity_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view events for public artifacts (no team_id)
CREATE POLICY "Public events are viewable by everyone"
ON public.activity_events
FOR SELECT
USING (team_id IS NULL);

-- Policy: Team members can view team events
CREATE POLICY "Team members can view team events"
ON public.activity_events
FOR SELECT
USING (team_id IN (
  SELECT team_members.team_id
  FROM team_members
  WHERE team_members.user_id = auth.uid()
));

-- Policy: Users can view their own events
CREATE POLICY "Users can view their own events"
ON public.activity_events
FOR SELECT
USING (actor_id = auth.uid());

-- Policy: Authenticated users can insert events
CREATE POLICY "Authenticated users can create events"
ON public.activity_events
FOR INSERT
WITH CHECK (auth.uid() = actor_id);