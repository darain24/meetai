'use client'

import { trpc } from "@/trpc/client"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { ChannelMessages } from "../components/channel-messages"
import { ChannelHeader } from "../components/channel-header"

interface Props {
  channelId: string
}

export const ChannelView = ({ channelId }: Props) => {
  const utils = trpc.useUtils()
  const { data: channel, isLoading: channelLoading } = trpc.channels.list.useQuery()
  const currentChannel = channel?.find(c => c.id === channelId)

  // Refetch when channel is updated
  const handleChannelUpdate = () => {
    utils.channels.list.invalidate()
  }

  if (channelLoading) {
    return <LoadingState title="Loading channel" description="Please wait..." />
  }

  if (!currentChannel) {
    return <ErrorState title="Channel not found" description="This channel does not exist or you don't have access to it." />
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChannelHeader 
        channelName={currentChannel.name} 
        channelId={channelId}
        onChannelUpdate={handleChannelUpdate}
      />
      <ChannelMessages channelId={channelId} />
    </div>
  )
}


