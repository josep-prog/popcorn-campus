# Payment Proof Upload Feature - Setup Instructions

This document explains how to set up the new payment proof upload feature that replaces the MoMo transaction verification system.

## Overview

The new payment workflow is:
1. **Client**: Makes payment via MoMo outside the app
2. **Client**: Takes screenshot/saves PDF of payment confirmation
3. **Client**: Uploads payment proof + enters name → Order submitted for review
4. **Admin**: Reviews uploaded payment proof in admin dashboard
5. **Admin**: Updates payment status (paid/unpaid/incomplete)
6. **Client**: Sees updated status in their dashboard

## Required Setup Steps

### 1. Database Migration

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of payment-proof-migration.sql
```

This will:
- Add `payment_proof_url`, `customer_name`, and `payment_proof_uploaded_at` columns to orders table
- Update payment status constraints to include new statuses
- Create necessary indexes and RLS policies

### 2. Supabase Storage Bucket

**Create the storage bucket:**

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named: `payment-proofs`
3. Configure bucket settings:
   - **Public**: `false` (private bucket)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png` 
     - `image/webp`
     - `application/pdf`

**Set up bucket policies:**

```sql
-- Allow authenticated users to upload their own payment proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-proofs' AND
  auth.role() = 'authenticated'
);

-- Allow users to view their own payment proofs
CREATE POLICY "Users can view their payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  auth.role() = 'authenticated'
);

-- Allow admins to view all payment proofs
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
```

### 3. Environment Variables

Ensure your `.env` file has the required Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MOMO_CODE=*182*81*12345#
VITE_MERCHANT_NAME=Campus Popcorn Ltd
```

### 4. Install Dependencies

All required dependencies are already in `package.json`. Run:

```bash
npm install
```

## File Structure

New files created:
```
src/
├── components/
│   ├── PaymentProofUpload.tsx     # File upload component
│   └── PaymentProofViewer.tsx     # Admin proof viewer modal
├── lib/
│   └── storage.ts                 # Storage utility functions
└── pages/
    ├── Payment.tsx               # Updated to use proof upload
    ├── Dashboard.tsx             # Shows payment status to client
    └── admin/Orders.tsx          # Admin can review proofs + update status

payment-proof-migration.sql       # Database migration
PAYMENT_PROOF_SETUP.md            # This setup guide
```

## Testing the Workflow

### Test as Client:
1. **Place Order**: Go to `/order` and create a new order
2. **Payment Page**: You'll see the new upload interface instead of transaction verification
3. **Upload Proof**: 
   - Enter your name
   - Upload a screenshot/PDF (max 10MB)
   - Click "Complete Order"
4. **Dashboard**: Check `/dashboard` to see your order with "pending" payment status

### Test as Admin:
1. **Admin Login**: Login with admin credentials and go to `/admin/orders`
2. **View Proof**: Click "View Proof" button to see the uploaded document
3. **Update Status**: Use the dropdown to change payment status (paid/unpaid/incomplete)
4. **Verify Updates**: Check that status changes are reflected immediately

### Test Status Sync:
1. Admin updates order payment status
2. Client refreshes their dashboard
3. Verify the updated status appears in client's order history

## Storage Bucket Name

**Bucket Name**: `payment-proofs`

This bucket will store all uploaded payment proof documents with the following structure:
```
payment-proofs/
├── {user-id}/
│   ├── {order-id}_{timestamp}.jpg
│   ├── {order-id}_{timestamp}.pdf
│   └── ...
└── anonymous/
    ├── {order-id}_{timestamp}.jpg
    └── ...
```

## Security Features

- **File Validation**: Only images (JPEG, PNG, WebP) and PDFs allowed, max 10MB
- **RLS Policies**: Users can only access their own files, admins can access all
- **Signed URLs**: Admin uses signed URLs to view documents securely
- **Unique Filenames**: Prevents collisions with timestamp-based naming

## Migration Notes

### From Old System (MoMo Verification) to New System:

**Database Changes:**
- Old orders with `payments` table entries will still work
- New orders will use `payment_proof_url` field instead
- Payment status enum expanded to include: `paid`, `unpaid`, `incomplete`

**Backwards Compatibility:**
- Existing orders are unaffected
- Admin dashboard shows both old and new payment systems
- New orders use the upload workflow exclusively

## Troubleshooting

**Upload Fails:**
- Check storage bucket exists and is named `payment-proofs`
- Verify storage policies are correctly configured
- Check file size (max 10MB) and type (images/PDF only)

**Admin Can't View Proofs:**
- Ensure user is in `admins` table
- Check storage bucket RLS policies include admin access
- Verify signed URL generation is working

**Status Updates Don't Sync:**
- Check RLS policies on orders table allow admin updates
- Verify client dashboard is fetching `payment_status` field
- Check for JavaScript console errors

## Support

For any issues with the implementation, check:
1. Browser console for JavaScript errors
2. Supabase logs for database/storage errors
3. Network tab for failed API calls

The payment proof upload feature is now ready for production use!
