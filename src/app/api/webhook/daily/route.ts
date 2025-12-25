import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agents, meetings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { dailyVideo } from '@/lib/daily-video'

// Extend global type for TypeScript
declare global {
  var agentJoinRequests: Map<
    string,
    {
      token: string
      roomUrl: string
      agentId: string
      agentName: string
      timestamp: number
    }
  > | undefined
}

/**
 * Daily.co webhook handler
 * This receives events from Daily.co when participants join/leave rooms
 * 
 * To set up:
 * 1. Go to Daily.co dashboard -> Settings -> Webhooks
 * 2. Add webhook URL: https://your-domain.com/api/webhook/daily
 * 3. Select events: "participant-joined", "participant-left"
 * 4. Save the webhook
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    
    // Verify webhook signature (optional but recommended)
    // Daily.co provides a signature header for verification
    // TODO: Implement signature verification if needed
    // const signature = req.headers.get('x-daily-signature')
    
    const eventType = payload.type
    const roomName = payload.room || payload.room_name
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DAILY WEBHOOK] Received event: ${eventType} for room: ${roomName}`)
    }
    
    // Handle participant joined event
    if (eventType === 'participant-joined') {
      const participant = payload.participant
      const userId = participant?.user_id || participant?.userName
      
      // Extract meeting ID from room name (room name is the meeting ID)
      const meetingId = roomName
      
      if (!meetingId) {
        console.warn('[DAILY WEBHOOK] No meeting ID found in room name')
        return NextResponse.json({ status: 'ok' })
      }
      
      // Get the meeting and agent information
      const [existingMeeting] = await db
        .select({
          id: meetings.id,
          agentId: meetings.agentId,
          agent: agents,
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(eq(meetings.id, meetingId))
      
      if (!existingMeeting || !existingMeeting.agent) {
        console.warn(`[DAILY WEBHOOK] Meeting or agent not found for meeting ${meetingId}`)
        return NextResponse.json({ status: 'ok' })
      }
      
      // Check if the joined participant is the agent
      // If it's the agent, we don't need to do anything
      if (userId === existingMeeting.agent.id) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DAILY WEBHOOK] Agent ${existingMeeting.agent.id} already joined`)
        }
        return NextResponse.json({ status: 'ok' })
      }
      
      // Check if agent is already in the call
      // Get room participants to check
      const room = await dailyVideo.getRoom(meetingId)
      if (!room) {
        console.warn(`[DAILY WEBHOOK] Room not found: ${meetingId}`)
        return NextResponse.json({ status: 'ok' })
      }
      
      // Generate token for the agent
      const token = await dailyVideo.createMeetingToken(meetingId, existingMeeting.agent.id, {
        exp: Math.floor(Date.now() / 1000) + 3600,
        is_owner: false,
        user_name: existingMeeting.agent.name,
        user_id: existingMeeting.agent.id,
      })
      
      // Store agent join request in memory (in production, use Redis or a queue)
      // The client will poll for this and join the agent
      if (!global.agentJoinRequests) {
        global.agentJoinRequests = new Map()
      }
      
      global.agentJoinRequests.set(meetingId, {
        token,
        roomUrl: room.url,
        agentId: existingMeeting.agent.id,
        agentName: existingMeeting.agent.name,
        timestamp: Date.now(),
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DAILY WEBHOOK] Agent join request stored for meeting ${meetingId}`)
      }
      
      // Note: Daily.co doesn't support server-side joining directly
      // The agent will be joined by the client-side AgentJoiner component
      // which polls for join requests
    }
    
    // Handle participant left event (optional cleanup)
    if (eventType === 'participant-left') {
      // You can add cleanup logic here if needed
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DAILY WEBHOOK] Participant left room: ${roomName}`)
      }
    }
    
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[DAILY WEBHOOK] Error processing webhook:', error)
    // Always return 200 to prevent Daily.co from retrying
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 200 })
  }
}

