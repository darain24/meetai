'use client'
import {LoaderIcon} from 'lucide-react'
import {useEffect, useState, useRef} from 'react'
import { DailyProvider, useDaily } from '@daily-co/daily-react'
import Daily from '@daily-co/daily-js'
import { trpc } from '@/trpc/client'
import { CallUI } from './call-ui'
import { AgentJoiner } from './agent-joiner'

interface Props {
    meetingId: string
    meetingName: string
    userId: string
    userName: string
    userImage: string
}

const DailyCallContent = ({ roomUrl, token }: { roomUrl: string; token: string }) => {
    const daily = useDaily()

    useEffect(() => {
        if (!daily) return

        daily.join({
            url: roomUrl,
            token: token,
        })

        return () => {
            daily.leave()
        }
    }, [daily, roomUrl, token])

    return null
}

export const CallConnect = ({
    meetingId,
    meetingName,
    userId,
    userName,
    userImage,
}: Props) => {
    const {mutateAsync: generateToken} = trpc.meetings.generateToken.useMutation()
    const [token, setToken] = useState<string | null>(null)
    const [roomUrl, setRoomUrl] = useState<string | null>(null)
    const callObjectRef = useRef<ReturnType<typeof Daily.createFrame> | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const [callObject, setCallObject] = useState<ReturnType<typeof Daily.createFrame> | null>(null)
    
    // Create Daily call instance after container is mounted and we have token/URL
    useEffect(() => {
        if (!containerRef.current || callObjectRef.current || !token || !roomUrl) return

        // Check if there's already an existing instance
        const existingInstance = Daily.getCallInstance()
        if (existingInstance && !existingInstance.isDestroyed()) {
            // Reuse existing instance if it's a frame (iframe is a method that returns the iframe element)
            try {
                const iframeElement = existingInstance.iframe?.()
                if (iframeElement) {
                    callObjectRef.current = existingInstance
                    setCallObject(existingInstance)
                    return
                }
            } catch {
                // If iframe() doesn't exist or throws, continue to create new instance
            }
        }
        
        // Create new frame with container as parent and URL/token for auto-join
        try {
            const frame = Daily.createFrame(containerRef.current, {
                url: roomUrl,
                token: token,
                showLeaveButton: true,
                showFullscreenButton: true,
                showLocalVideo: true,
                showParticipantsBar: true,
                userName: userName,
                userImage: userImage,
                iframeStyle: {
                    width: '100%',
                    height: '100%',
                    border: 'none',
                },
            })
            callObjectRef.current = frame
            setCallObject(frame)
        } catch (error) {
            console.error('Failed to create Daily frame:', error)
        }
    }, [userName, userImage, token, roomUrl])

    useEffect(() => {
        const getToken = async () => {
            try {
                const result = await generateToken({ meetingId })
                setToken(result.token)
                setRoomUrl(result.roomUrl)
            } catch (error) {
                console.error('Failed to generate Daily.co token:', error)
            }
        }

        getToken()
    }, [meetingId, generateToken])

    // Store join function to be called from CallUI
    const handleUserJoin = async () => {
        if (!callObject || !roomUrl || !token) {
            const missing = []
            if (!callObject) missing.push('callObject')
            if (!roomUrl) missing.push('roomUrl')
            if (!token) missing.push('token')
            throw new Error(`Cannot join: missing ${missing.join(', ')}`)
        }

        
        try {
            // Check if already joined (frame might have auto-joined)
            const participants = callObject.participants()
            if (participants?.local) {
                // Still trigger agent join
                try {
                    await fetch('/api/agent-join', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ meetingId }),
                    })
                } catch (error) {
                    console.error('Failed to trigger agent join:', error)
                }
                return
            }

            // If frame was created with URL/token, it might be joining automatically
            // Wait a bit to see if it joins, then proceed with manual join if needed
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Check again after waiting
            const participantsAfterWait = callObject.participants()
            if (participantsAfterWait?.local) {
                // Still trigger agent join
                try {
                    await fetch('/api/agent-join', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ meetingId }),
                    })
                } catch (error) {
                    console.error('Failed to trigger agent join:', error)
                }
                return
            }

            // For Daily frames, join() might not return a promise
            // Use a combination of events and polling to detect when join completes
            const joinPromise = new Promise<void>((resolve, reject) => {
                let resolved = false
                const cleanup = () => {
                    if (callObject) {
                        callObject.off('joined-meeting', onJoined)
                        callObject.off('participant-joined', onJoined)
                        callObject.off('error', onError)
                        callObject.off('loading', onLoading)
                    }
                }

                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true
                        cleanup()
                        // Final check - if we have local participant, we're joined
                        if (callObject?.participants()?.local) {
                            resolve()
                        } else {
                            reject(new Error('Join timeout: The call took too long to connect'))
                        }
                    }
                }, 15000) // 15 seconds

                // Poll more aggressively to detect join
                const pollInterval = setInterval(() => {
                    if (resolved) {
                        clearInterval(pollInterval)
                        return
                    }
                    
                    const parts = callObject?.participants()
                    if (parts?.local) {
                        resolved = true
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        cleanup()
                        resolve()
                    }
                }, 200) // Check every 200ms

                const onJoined = () => {
                    if (!resolved) {
                        resolved = true
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        cleanup()
                        resolve()
                    }
                }

                const onLoading = (_event: unknown) => {
                }

                const onError = (error: unknown) => {
                    if (!resolved) {
                        resolved = true
                        clearTimeout(timeout)
                        clearInterval(pollInterval)
                        cleanup()
                        console.error('Daily.co join error:', error)
                        reject(error instanceof Error ? error : new Error('Failed to join call'))
                    }
                }

                // Listen for events
                if (callObject) {
                    callObject.on('joined-meeting', onJoined)
                    callObject.on('participant-joined', onJoined)
                    callObject.on('error', onError)
                    callObject.on('loading', onLoading)
                }
            })

            // Call join (may return undefined for frames, or if already joined via frame creation)
            // If frame was created with URL/token, it might already be joining
            const joinResult = callObject.join({
                url: roomUrl,
                token: token,
            })
            
            // If join returns a promise, wait for it (but also wait for our promise)
            if (joinResult && typeof joinResult.then === 'function') {
                try {
                    await Promise.race([joinResult, joinPromise])
                } catch (error) {
                    // If the join promise rejects, still wait for our promise
                    await joinPromise
                }
            } else {
                // Wait for our promise (events or polling)
                // If frame was created with URL/token, it might already be joining
                await joinPromise
            }
            
            // After user joins, trigger agent join via API
            try {
                const response = await fetch('/api/agent-join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ meetingId }),
                })
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    console.warn('Agent join request failed:', errorData)
                } else {
                }
            } catch (error) {
                // Don't throw - agent join failure shouldn't block user join
                console.error('Failed to trigger agent join:', error)
            }
        } catch (error) {
            console.error('Failed to join Daily.co call:', error)
            // Re-throw so CallUI can handle it
            throw error instanceof Error ? error : new Error('Failed to join call')
        }
    }

    useEffect(() => {
        return () => {
            if (callObjectRef.current && !callObjectRef.current.isDestroyed()) {
                callObjectRef.current.leave()
            }
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (callObjectRef.current && !callObjectRef.current.isDestroyed()) {
                callObjectRef.current.destroy()
                callObjectRef.current = null
            }
        }
    }, [])

    if (!token || !roomUrl) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white"/>
            </div>
        )
    }

    if (!callObject) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white"/>
            </div>
        )
    }

    return (
        <div className="h-screen w-full relative">
            <DailyProvider callObject={callObject}>
                {/* Container for Daily.co iframe */}
                <div 
                    ref={containerRef}
                    className="h-full w-full"
                />
                {/* Overlay UI on top of the iframe */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    <CallUI 
                        meetingId={meetingId} 
                        meetingName={meetingName}
                        onJoin={handleUserJoin}
                    />
                </div>
                {/* Join the agent to the call when user joins */}
                {roomUrl && <AgentJoiner meetingId={meetingId} roomUrl={roomUrl} />}
            </DailyProvider>
        </div>
    )
}
