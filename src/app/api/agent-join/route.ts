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
 * Server-side API route to join an agent to a Daily.co call
 * This uses Daily.co's server-side capabilities to add the agent as a participant
 */
export async function POST(req: NextRequest) {
  try {
    const { meetingId } = await req.json()

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Missing meetingId' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Meeting or agent not found' },
        { status: 404 }
      )
    }

    const roomName = meetingId
    const room = await dailyVideo.getRoom(roomName)

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Generate a token for the agent
    const token = await dailyVideo.createMeetingToken(roomName, existingMeeting.agent.id, {
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


    return NextResponse.json({
      success: true,
      token,
      roomUrl: room.url,
      agentId: existingMeeting.agent.id,
      agentName: existingMeeting.agent.name,
    })
  } catch (error) {
    console.error('Error joining agent to call:', error)
    return NextResponse.json(
      { error: 'Failed to join agent to call' },
      { status: 500 }
    )
  }
}

