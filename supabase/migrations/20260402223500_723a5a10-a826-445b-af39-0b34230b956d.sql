CREATE POLICY "Users can insert own sync queue entries"
ON public.menerio_sync_queue
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);