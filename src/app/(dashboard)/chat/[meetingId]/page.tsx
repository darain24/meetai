import { auth } from "@/lib/auth";
import { ChatView } from "@/modules/chat/ui/components/chat-view";
import { ChatPageClient } from "@/modules/chat/ui/views/chat-page-client";
import { getQueryClient, caller } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{meetingId: string}>
}

const Page = async ({ params }: Props) => {
  const {meetingId} = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if(!session) {
    redirect("/sign-in")
  }

  const queryClient = getQueryClient()
  void queryClient.prefetchQuery({
    queryKey: ['meetings', 'getOne', { id: meetingId }],
    queryFn: () => caller.meetings.getOne({ id: meetingId })
  })
  void queryClient.prefetchQuery({
    queryKey: ['meetings', 'getMessages', { meetingId }],
    queryFn: () => caller.meetings.getMessages({ meetingId })
  })

  const meeting = await caller.meetings.getOne({ id: meetingId })

  if(meeting.status === 'completed') {
    redirect(`/meetings/${meetingId}`)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-screen flex flex-col">
        <ChatPageClient meetingId={meetingId}>
          <ChatView 
            meetingId={meetingId}
            meetingName={meeting.name}
            agentName={meeting.agent.name}
          />
        </ChatPageClient>
      </div>
    </HydrationBoundary>
  )
}

export default Page;

