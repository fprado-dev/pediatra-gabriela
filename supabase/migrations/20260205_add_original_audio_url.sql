-- Migration: Add original_audio_url column to consultations table
-- This column stores the backup of the original audio before processing
-- allowing recovery and retry in case of processing failures

ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS original_audio_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN consultations.original_audio_url IS 'URL do áudio original (backup) armazenado antes do processamento. Usado para recovery em caso de erro.';
