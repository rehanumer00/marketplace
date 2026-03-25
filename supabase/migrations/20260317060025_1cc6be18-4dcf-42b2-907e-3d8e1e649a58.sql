
-- Fix overly permissive notifications INSERT policy
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id IS NOT NULL);
