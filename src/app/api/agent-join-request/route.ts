import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint to get agent join request (polled by client)
 * This is populated by the Daily.co webhook when a participant joins
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const meetingId = searchParams.get('meetingId')

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Missing meetingId' },
        { status: 400 }
      )
    }

    // Get agent join request from memory store
    if (!global.agentJoinRequests) {
      return NextResponse.json({ token: null })
    }

    const joinRequest = global.agentJoinRequests.get(meetingId)
    
    if (!joinRequest) {
      return NextResponse.json({ token: null })
    }

    // Remove after reading (one-time read)
    global.agentJoinRequests.delete(meetingId)

    return NextResponse.json({
      token: joinRequest.token,
      roomUrl: joinRequest.roomUrl,
      agentId: joinRequest.agentId,
      agentName: joinRequest.agentName,
    })
  } catch (error) {
    console.error('[AGENT-JOIN-REQUEST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get agent join request' },
      { status: 500 }
    )
  }
}

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




