'use client'
import { ErrorState } from "@/components/error-state";
import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { LoadingState } from "@/components/loading-state";
import { useRouter } from "next/navigation";

interface Props {
    meetingId: string;
}

export const CallView = ({
    meetingId
}: Props) => {
    const router = useRouter()
    const utils = trpc.useUtils()
    const { data, isLoading, refetch } = trpc.meetings.getOne.useQuery({id: meetingId})
    const startMeeting = trpc.meetings.start.useMutation({
        onSuccess: async () => {
            await utils.meetings.getOne.invalidate({ id: meetingId })
            await refetch()
            // Redirect to chat after starting
            router.push(`/chat/${meetingId}`)
        }
    })

    // Start the meeting if it's upcoming
    useEffect(() => {
        if (data?.status === 'upcoming' && !startMeeting.isPending && !startMeeting.isSuccess) {
            startMeeting.mutate({ id: meetingId })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.status, meetingId])

    if(isLoading || !data) {
        return (
        <div className="flex h-screen items-center justify-center">
            <LoadingState title="Loading chat" description="Please wait..." />
        </div>
        )
    }

    if(data.status === 'completed') {
        return (
        <div className="flex h-screen items-center justify-center">
            <ErrorState 
                title="Meeting has ended"
                description="You can no longer join this meeting" 
            />
        </div>
        )
    }

    if(data.status === 'upcoming' && startMeeting.isPending) {
        return (
        <div className="flex h-screen items-center justify-center">
            <LoadingState 
                title="Starting meeting..."
                description="Please wait while we start your meeting" 
            />
        </div>
        )
    }

    // Redirect active meetings to chat
    if(data.status === 'active') {
        router.push(`/chat/${meetingId}`)
        return (
        <div className="flex h-screen items-center justify-center">
            <LoadingState title="Redirecting to chat..." description="Please wait..." />
        </div>
        )
    }

    return null
}
