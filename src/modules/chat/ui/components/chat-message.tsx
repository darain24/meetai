'use client'
import { GeneratedAvatar } from '@/components/generated-avatar'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Props {
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  meetingName: string
  userImage?: string | null
  userName?: string | null
}

export const ChatMessage = ({ role, content, createdAt, meetingName, userImage, userName }: Props) => {
  const isUser = role === 'user'

  return (
    <div className={cn(
      "flex gap-x-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <GeneratedAvatar 
          seed={meetingName}
          variant="botttsNeutral"
          className="size-8 flex-shrink-0"
        />
      )}
      <div className={cn(
        "flex flex-col gap-y-1 max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(createdAt), 'HH:mm')}
        </span>
      </div>
      {isUser && (
        userImage ? (
          <Avatar className="size-8 flex-shrink-0">
            <AvatarImage src={userImage} />
          </Avatar>
        ) : (
          <GeneratedAvatar 
            seed={userName || "user"}
            variant="initials"
            className="size-8 flex-shrink-0"
          />
        )
      )}
    </div>
  )
}

