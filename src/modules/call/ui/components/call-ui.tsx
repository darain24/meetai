import {useState} from 'react'
import { CallLobby } from './call-lobby'
import { CallActive } from './call-active'
import { CallEnded } from './call-ended'

interface Props {
    meetingId: string
    meetingName: string
    onJoin: () => Promise<void>
}

export const CallUI = ({meetingId, meetingName, onJoin} : Props) => {
    const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby")
    const [isJoining, setIsJoining] = useState(false)
    const [joinError, setJoinError] = useState<string | null>(null)

    const handleJoin = async () => {
        setIsJoining(true)
        setJoinError(null)
        try {
            // Call the parent's join function
            await onJoin()
            setShow('call')
        } catch (error) {
            console.error('Failed to join call:', error)
            setJoinError(error instanceof Error ? error.message : 'Failed to join call')
            // Don't change state on error - stay in lobby
        } finally {
            setIsJoining(false)
        }
    }

    const handleLeave = async () => {
        // Daily.co handles leaving through the iframe
        setShow('ended')
    }

    const handleEnd = async () => {
        // Handle call end
    }

    return (
        <>
            {show === "lobby" && (
                <div className="h-screen w-full pointer-events-auto">
                    <CallLobby 
                        onJoin={handleJoin} 
                        isJoining={isJoining}
                        joinError={joinError}
                    />
                </div>
            )}
            {show === "call" && (
                <CallActive onLeave={handleLeave} meetingName={meetingName}/>
            )}
            {show === "ended" && (
                <div className="h-screen w-full pointer-events-auto">
                    <CallEnded />
                </div>
            )}
        </>
    )
}
