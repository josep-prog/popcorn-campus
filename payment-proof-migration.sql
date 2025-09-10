-- Migration to add payment proof upload functionality
-- Run this in your Supabase SQL editor

-- Add payment_proof_url column to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_proof_url text,
ADD COLUMN customer_name text,
ADD COLUMN payment_proof_uploaded_at timestamptz;

-- Update payment_status enum to include new statuses
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('pending','confirmed','failed','refunded','incomplete','paid','unpaid'));

-- Create index for faster queries on payment proof
CREATE INDEX IF NOT EXISTS orders_payment_proof_url_idx ON public.orders (payment_proof_url);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders (payment_status);

-- Update RLS policies to allow users to update their orders with payment proof
CREATE POLICY "Orders: update payment proof"
ON public.orders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant admin ability to update payment status
CREATE POLICY "Orders: admin update payment status"
ON public.orders FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid()));

-- Create storage bucket for payment proofs (run this separately if needed)
-- You'll need to create this bucket in Supabase Storage UI: "payment-proofs"

-- Optional: Create a function to get payment proof URL with signed URL
CREATE OR REPLACE FUNCTION public.get_payment_proof_url(order_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT payment_proof_url
  FROM public.orders
  WHERE id = order_uuid
    AND (
      auth.uid() = user_id OR 
      EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
    );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_payment_proof_url(uuid) TO authenticated;
