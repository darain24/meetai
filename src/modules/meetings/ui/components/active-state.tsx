import { EmptyState } from "@/components/empty-state"
import {Button} from "@/components/ui/button"
import Link from "next/link"
import { MessageSquareIcon, ArrowLeft } from "lucide-react"

interface props {
    meetingId: string
}


export const ActiveState = ({
    meetingId,
}: props) => {
    return (
        <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState 
                image="/upcoming.svg"
                title="Chat is active"
                description="Chat with your agent to get started"
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2">
                <Button asChild variant="outline" className="w-full lg:w-auto">
                    <Link href="/meetings">
                        <ArrowLeft />
                        Back
                    </Link>
                </Button>
                <Button asChild className="w-full lg:w-auto">
                    <Link href={`/chat/${meetingId}`}>
                        <MessageSquareIcon />
                        Open Chat
                    </Link>
                </Button>
            </div>
        </div>
    )
}