import "server-only"

/**
 * Daily.co server-side API client
 * Used for creating rooms and generating tokens
 */
export class DailyVideoClient {
  private apiKey: string
  private baseUrl = "https://api.daily.co/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Create a new Daily room
   */
  async createRoom(roomName: string, options?: {
    privacy?: "public" | "private"
    properties?: {
      enable_transcription?: boolean
      enable_recording?: boolean
      [key: string]: unknown
    }
  }) {
    const response = await fetch(`${this.baseUrl}/rooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: options?.privacy || "private",
        properties: {
          enable_transcription: true,
          // enable_recording is set at account level, not per-room
          ...options?.properties,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create Daily room: ${error}`)
    }

    return response.json()
  }

  /**
   * Generate a meeting token for a user
   */
  async createMeetingToken(roomName: string, userId: string, options?: {
    exp?: number
    is_owner?: boolean
    user_name?: string
    user_id?: string
  }) {
    const response = await fetch(`${this.baseUrl}/meeting-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          exp: options?.exp || Math.floor(Date.now() / 1000) + 3600,
          is_owner: options?.is_owner || false,
          user_name: options?.user_name,
          user_id: options?.user_id || userId,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create Daily token: ${error}`)
    }

    const data = await response.json()
    return data.token
  }

  /**
   * Get room information
   */
  async getRoom(roomName: string) {
    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error = await response.text()
      throw new Error(`Failed to get Daily room: ${error}`)
    }

    return response.json()
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string) {
    const response = await fetch(`${this.baseUrl}/rooms/${roomName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.text()
      throw new Error(`Failed to delete Daily room: ${error}`)
    }

    return true
  }

  /**
   * Add a participant to a room (using REST API)
   * Note: Daily.co doesn't support adding participants via REST API directly
   * Participants join using tokens. This method generates a token for the agent.
   */
  async addParticipantToRoom(roomName: string, userId: string, userName: string) {
    // Generate a token for the participant
    const token = await this.createMeetingToken(roomName, userId, {
      exp: Math.floor(Date.now() / 1000) + 3600,
      is_owner: false,
      user_name: userName,
      user_id: userId,
    })

    return { token }
  }
}

if (!process.env.DAILY_API_KEY) {
  throw new Error("DAILY_API_KEY environment variable is not set")
}

export const dailyVideo = new DailyVideoClient(process.env.DAILY_API_KEY)

