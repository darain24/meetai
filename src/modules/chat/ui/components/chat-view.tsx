'use client'
import { useEffect, useRef, useState } from 'react'
import { trpc } from '@/trpc/client'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingState } from '@/components/loading-state'
import { ErrorState } from '@/components/error-state'
import { GeneratedAvatar } from '@/components/generated-avatar'
import { authClient } from '@/lib/auth-client'

interface Props {
  meetingId: string
  meetingName: string
  agentName: string
}

export const ChatView = ({ meetingId, meetingName, agentName }: Props) => {
  const { data: session } = authClient.useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: Date }>>([])
  
  const utils = trpc.useUtils()
  const { data: initialMessages, isLoading, error } = trpc.meetings.getMessages.useQuery({ meetingId })
  const sendMessageMutation = trpc.meetings.sendMessage.useMutation({
    onSuccess: async (data) => {
      // Invalidate and refetch messages to get the latest
      await utils.meetings.getMessages.invalidate({ meetingId })
      // Scroll to bottom after new message
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
    }
  })

  useEffect(() => {
    if (initialMessages) {
      const normalized = initialMessages.map((msg) => ({
        id: msg.id,
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }))
      setMessages(normalized)
      // Scroll to bottom on initial load
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [initialMessages])

  useEffect(() => {
    // Auto-scroll when new messages arrive
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || sendMessageMutation.isPending) return
    
    sendMessageMutation.mutate({
      meetingId,
      content: content.trim(),
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingState title="Loading chat" description="Please wait..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorState title="Error loading chat" description={error.message} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-x-3">
        <GeneratedAvatar 
          seed={meetingName}
          variant="botttsNeutral"
          className="size-8"
        />
        <div className="flex-1">
          <h3 className="font-medium">{meetingName}</h3>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                createdAt={message.createdAt}
                meetingName={meetingName}
                userImage={session?.user?.image}
                userName={session?.user?.name}
              />
            ))
          )}
          {sendMessageMutation.isPending && (
            <div className="flex items-center gap-x-2 text-muted-foreground">
              <GeneratedAvatar 
                seed={meetingName}
                variant="botttsNeutral"
                className="size-6"
              />
              <span className="text-sm">Agent is typing...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <ChatInput
          onSend={handleSendMessage}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </div>
  )
}

