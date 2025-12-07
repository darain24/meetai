import { EmptyState } from "@/components/empty-state"
import {Button} from "@/components/ui/button"
import Link from "next/link"
import { MessageSquareIcon, BanIcon } from "lucide-react"

interface props {
    meetingId: string
    onCancelMeeting: () => void
    isCancelling: boolean
}


export const UpcomingState = ({
    meetingId,
    onCancelMeeting,
    isCancelling,
}: props) => {
    return (
        <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState 
                image="/upcoming.svg"
                title="Not started yet"
                description="Start the meeting to begin chatting with your agent"
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2">
                <Button
                    variant='secondary'
                    className="w-full lg:w-auto"
                    onClick={onCancelMeeting}
                    disabled={isCancelling}
                >
                    <BanIcon />
                    Cancel Meeting
                </Button>
                <Button disabled={isCancelling} asChild className="w-full lg:w-auto">
                    <Link href={`/chat/${meetingId}`}>
                        <MessageSquareIcon />
                        Start Meeting
                    </Link>
                </Button>
            </div>
        </div>
    )
}