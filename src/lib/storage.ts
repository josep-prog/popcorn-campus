import { supabase } from './supabase';

export const PAYMENT_PROOF_BUCKET = 'payment-proofs';

/**
 * Upload a payment proof file to Supabase storage
 */
export const uploadPaymentProof = async (
  file: File,
  orderId: string,
  userId?: string
): Promise<{ url: string; path: string }> => {
  // Generate unique filename
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `${orderId}_${timestamp}.${fileExtension}`;
  const filePath = userId ? `${userId}/${fileName}` : `anonymous/${fileName}`;

  // Upload file to storage
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload payment proof: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath
  };
};

/**
 * Get a signed URL for viewing a payment proof (for admin use)
 */
export const getSignedPaymentProofUrl = async (
  filePath: string,
  expiresIn: number = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
};

/**
 * Delete a payment proof file
 */
export const deletePaymentProof = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete payment proof: ${error.message}`);
  }
};

/**
 * Validate file type and size for payment proofs
 */
export const validatePaymentProofFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a valid image (JPEG, PNG, WebP) or PDF file.'
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size must be less than 10MB.'
    };
  }

  return { valid: true };
};

/**
 * Get file type icon for display
 */
export const getFileTypeIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return '🖼️';
    default:
      return '📎';
  }
};
