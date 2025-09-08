-- PWA Database Setup for Campus Popcorn
-- Run this in your Supabase SQL editor

-- Create table for storing push notification subscriptions
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON public.user_push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_user_push_subscriptions_updated_at 
    BEFORE UPDATE ON public.user_push_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to send push notifications (for server-side use)
CREATE OR REPLACE FUNCTION send_push_notification(
    target_user_id UUID,
    notification_title TEXT,
    notification_body TEXT,
    notification_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    subscription_record RECORD;
BEGIN
    -- Get user's push subscription
    SELECT subscription INTO subscription_record
    FROM public.user_push_subscriptions
    WHERE user_id = target_user_id;
    
    -- If no subscription found, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Here you would typically call your push notification service
    -- For now, we'll just log the notification
    RAISE NOTICE 'Sending push notification to user %: % - %', 
        target_user_id, notification_title, notification_body;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_push_subscriptions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION send_push_notification TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id 
    ON public.user_push_subscriptions(user_id);

-- Optional: Create a function to clean up old subscriptions
CREATE OR REPLACE FUNCTION cleanup_old_push_subscriptions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete subscriptions older than 30 days
    DELETE FROM public.user_push_subscriptions
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_push_subscriptions TO service_role;
