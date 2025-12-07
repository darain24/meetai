/**
 * Migration script to populate userId in messages table from meetings
 * Run this after the database schema has been updated
 * 
 * Usage: npx tsx scripts/migrate-messages.ts
 */

import { db } from "../src/db";
import { messages, meetings } from "../src/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function migrateMessages() {
  console.log("Starting message migration...");
  
  try {
    // Update messages that have meetingId but no userId
    // Set userId from the meeting's userId
    const result = await db.execute(sql`
      UPDATE messages
      SET user_id = (
        SELECT user_id 
        FROM meetings 
        WHERE meetings.id = messages.meeting_id
      )
      WHERE messages.user_id IS NULL 
        AND messages.meeting_id IS NOT NULL
        AND messages.role = 'user'
    `);
    
    console.log(`Migrated ${result.rowCount || 0} messages`);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateMessages();


