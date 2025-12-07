-- Add attachment columns to messages table
-- Run this SQL directly in your database if drizzle-kit push is not working

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachment_types text[] DEFAULT '{}';

