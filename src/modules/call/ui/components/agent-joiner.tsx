'use client'
import { useEffect, useRef } from 'react'
import Daily from '@daily-co/daily-js'

interface Props {
    meetingId: string
    roomUrl: string
}

/**
 * Component that joins the agent to the Daily.co call in the background
 * This polls for agent join requests created by the Daily.co webhook
 */
export const AgentJoiner = ({ meetingId, roomUrl }: Props) => {
    const hasJoinedRef = useRef(false)
    const agentCallRef = useRef<ReturnType<typeof Daily.createCallObject> | null>(null)

    useEffect(() => {
        let isMounted = true
        let pollInterval: NodeJS.Timeout | null = null

        const checkAndJoinAgent = async () => {
            // Prevent duplicate joins
            if (hasJoinedRef.current) {
                return
            }

            try {
                // Poll for agent join request (created by webhook)
                const response = await fetch(`/api/agent-join-request?meetingId=${meetingId}`)
                
                if (!response.ok) {
                    return // No join request yet
                }

                const data = await response.json()
                
                if (!data || !data.token) {
                    return // No join request yet
                }

                if (!isMounted) return

                const { token, agentId, agentName, roomUrl: agentRoomUrl } = data

                // Check if there's already a call instance
                const existingInstance = Daily.getCallInstance()
                if (existingInstance && !existingInstance.isDestroyed()) {
                    // Can't create another instance - this is a limitation
                    console.warn('Cannot join agent: Daily call instance already exists')
                    return
                }

                // Create a call object for the agent
                if (!agentCallRef.current) {
                    agentCallRef.current = Daily.createCallObject({
                        userName: agentName,
                        userData: {
                            agentId: agentId,
                            isAgent: true,
                        },
                    })
                }

                const agentCall = agentCallRef.current

                // Join the agent to the call
                await agentCall.join({
                    url: agentRoomUrl || roomUrl,
                    token: token,
                })

                // Disable camera and enable microphone for the agent
                await agentCall.setLocalVideo(false)
                await agentCall.setLocalAudio(true)

                hasJoinedRef.current = true
                
                // Clear the polling interval
                if (pollInterval) {
                    clearInterval(pollInterval)
                    pollInterval = null
                }
            } catch (error) {
                console.error(`Failed to join agent to call ${meetingId}:`, error)
            }
        }

        // Poll every 2 seconds for agent join request
        pollInterval = setInterval(() => {
            checkAndJoinAgent()
        }, 2000)

        // Also check immediately
        checkAndJoinAgent()

        return () => {
            isMounted = false
            if (pollInterval) {
                clearInterval(pollInterval)
            }
            if (agentCallRef.current && !agentCallRef.current.isDestroyed()) {
                agentCallRef.current.leave()
                agentCallRef.current.destroy()
                agentCallRef.current = null
            }
            hasJoinedRef.current = false
        }
    }, [meetingId, roomUrl])

    // This component doesn't render anything - it just handles agent joining logic
    return null
}

