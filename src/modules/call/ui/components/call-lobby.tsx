import { LogInIcon, LoaderIcon } from "lucide-react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import {Button} from '@/components/ui/button'

interface Props {
    onJoin: () => void
    isJoining?: boolean
    joinError?: string | null
}

export const CallLobby = ({onJoin, isJoining = false, joinError}: Props) => {
    const {data} = authClient.useSession()

    return (
        <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
            <div className="py-4 px-8 flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-y-4 bg-background rounded-lg p-10 shadow-sm">
                    <div className="flex flex-col gap-y-2 text-center">
                        <h6 className="text-lg font-medium">Ready to join?</h6>
                        <p className="text-sm">Set up your call before joining</p>
                    </div>
                    {joinError && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                            {joinError}
                    </div>
                    )}
                    <div className="flex gap-x-2 justify-between w-full">
                        <Button asChild variant = 'ghost' disabled={isJoining}>
                            <Link href="/meetings">
                            Cancel
                            </Link>
                        </Button>
                        <Button onClick={onJoin} disabled={isJoining}>
                            {isJoining ? (
                                <>
                                    <LoaderIcon className="size-4 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                            <LogInIcon />
                            Join Call
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
