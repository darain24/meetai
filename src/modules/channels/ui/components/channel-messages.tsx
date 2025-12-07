'use client'

import { useEffect, useRef } from 'react'
import { trpc } from '@/trpc/client'
import { ChannelMessage } from './channel-message'
import { ChannelInput } from './channel-input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingState } from '@/components/loading-state'
import { ErrorState } from '@/components/error-state'
import { authClient } from '@/lib/auth-client'

interface Props {
  channelId: string
}

export const ChannelMessages = ({ channelId }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const utils = trpc.useUtils()
  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id || ''
  
  const { data: messages, isLoading, error } = trpc.channels.getMessages.useQuery({ channelId })
  const sendMessageMutation = trpc.channels.sendMessage.useMutation({
    onSuccess: async () => {
      await utils.channels.getMessages.invalidate({ channelId })
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
    }
  })

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages])

  const handleSendMessage = async (content: string, attachments?: Array<{ file: File; preview: string; type: 'image' | 'file' | 'voice' }>) => {
    // Allow sending with just attachments (no text content)
    if ((!content.trim() && (!attachments || attachments.length === 0)) || sendMessageMutation.isPending) return
    
    // Convert files to base64
    const base64Attachments: string[] = []
    const attachmentTypes: ('image' | 'file' | 'voice')[] = []
    
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              resolve(result)
            }
            reader.onerror = (error) => {
              console.error('FileReader error:', error)
              reject(error)
            }
            reader.readAsDataURL(attachment.file)
          })
          base64Attachments.push(base64)
          attachmentTypes.push(attachment.type)
        } catch (error) {
          console.error('Error converting file to base64:', error)
          // Continue with other files even if one fails
        }
      }
    }
    
    // Send message - content can be empty if we have attachments
    sendMessageMutation.mutate({
      channelId,
      content: content.trim() || '', // Allow empty content if attachments exist
      attachments: base64Attachments.length > 0 ? base64Attachments : undefined,
      attachmentTypes: attachmentTypes.length > 0 ? attachmentTypes : undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingState title="Loading messages" description="Please wait..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorState title="Error loading messages" description={error.message} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-6 px-4 w-full">
          {messages && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages
              ?.filter((message) => message && message.user) // Filter out null/undefined messages
              .map((message, index, filteredMessages) => {
                const prevMessage = index > 0 ? filteredMessages[index - 1] : null
                const nextMessage = index < filteredMessages.length - 1 ? filteredMessages[index + 1] : null
                
                // Show avatar only if this is the first message from this user
                const showAvatar = !prevMessage || (prevMessage.user?.id !== message.user?.id)
                
                // Check if message is grouped (same user, within short time)
                const isGrouped = prevMessage && 
                  prevMessage.user?.id === message.user?.id &&
                  new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 600000 // 10 minutes
                
                return (
                  <ChannelMessage
                    key={message.id}
                    content={message.content || ''}
                    userName={message.user?.name ?? null}
                    userImage={message.user?.image ?? null}
                    userId={message.userId}
                    currentUserId={currentUserId}
                    currentUserImage={session?.user?.image}
                    currentUserName={session?.user?.name}
                    attachments={message.attachments ?? null}
                    attachmentTypes={(message.attachmentTypes ?? null) as ('image' | 'file' | 'voice')[] | null}
                    createdAt={message.createdAt}
                    showAvatar={showAvatar}
                    isGrouped={isGrouped}
                  />
                )
              })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full">
        <ChannelInput
          onSend={handleSendMessage}
          disabled={sendMessageMutation.isPending}
        />
      </div>
    </div>
  )
}


