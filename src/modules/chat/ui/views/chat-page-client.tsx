'use client'
import { useEffect } from 'react'
import { trpc } from '@/trpc/client'

interface Props {
  meetingId: string
  children: React.ReactNode
}

export const ChatPageClient = ({ meetingId, children }: Props) => {
  const { data } = trpc.meetings.getOne.useQuery({ id: meetingId })
  const startMeeting = trpc.meetings.start.useMutation({
    onSuccess: async () => {
      // Meeting started, chat can proceed
    }
  })

  // Start the meeting if it's upcoming
  useEffect(() => {
    if (data?.status === 'upcoming' && !startMeeting.isPending && !startMeeting.isSuccess) {
      startMeeting.mutate({ id: meetingId })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status, meetingId])

  return <>{children}</>
}

