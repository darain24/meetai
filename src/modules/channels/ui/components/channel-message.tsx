'use client'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { GeneratedAvatar } from '@/components/generated-avatar'
import { format, isToday, isYesterday } from 'date-fns'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  userName: string | null
  userImage: string | null
  userId: string
  createdAt: Date
  currentUserId: string
  currentUserImage?: string | null
  currentUserName?: string | null
  attachments?: string[] | null
  attachmentTypes?: ('image' | 'file' | 'voice')[] | null
  showAvatar?: boolean
  isGrouped?: boolean
}

export const ChannelMessage = ({ 
  content, 
  userName, 
  createdAt, 
  userImage,
  userId,
  currentUserId,
  currentUserImage,
  currentUserName,
  attachments = null,
  attachmentTypes = null,
  showAvatar = true,
  isGrouped = false
}: Props) => {
  const isSent = userId === currentUserId
  const displayName = userName || "Unknown"
  const currentUserDisplayName = currentUserName || "User"
  const date = new Date(createdAt)
  
  // Format timestamp
  const formatTimestamp = () => {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM d, HH:mm')
    }
  }

  // Get initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // User's own messages (right-aligned with avatar)
  if (isSent) {
    return (
      <div className={cn(
        "flex justify-end w-full mb-2 gap-3",
        !isGrouped && "mt-3"
      )}>
        <div className="flex items-end max-w-[75%] sm:max-w-[65%]">
          <div className={cn(
            "rounded-2xl px-4 py-2.5 relative group",
            "bg-primary text-primary-foreground",
            "shadow-sm hover:shadow-md transition-shadow"
          )}>
            {/* Attachments */}
            {attachments && Array.isArray(attachments) && attachments.length > 0 && (
              <div className="mb-2 space-y-2">
                {attachments.map((attachment, index) => {
                  const type = (attachmentTypes && Array.isArray(attachmentTypes) ? attachmentTypes[index] : null) || 'file'
                  if (type === 'image') {
                    return (
                      <img
                        key={index}
                        src={attachment}
                        alt="Attachment"
                        className="max-w-full rounded-lg"
                        style={{ maxHeight: '300px' }}
                      />
                    )
                  } else if (type === 'voice') {
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <audio src={attachment} controls className="w-full" />
                      </div>
                    )
                  } else {
                    return (
                      <a
                        key={index}
                        href={attachment}
                        download
                        className="flex items-center gap-2 p-2 bg-primary-foreground/10 rounded-lg hover:bg-primary-foreground/20"
                      >
                        <span className="text-xs">📎 File attachment</span>
                      </a>
                    )
                  }
                })}
              </div>
            )}
            {content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {content}
              </p>
            )}
            <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-70">
              <span className="text-[10px] font-medium">
                {formatTimestamp()}
              </span>
            </div>
          </div>
        </div>
        {/* User's avatar after their message (on the right) */}
        <div className="flex-shrink-0 self-end">
          {currentUserImage ? (
            <Avatar className="size-10">
              <AvatarImage src={currentUserImage} alt={currentUserDisplayName} />
              <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                {getInitials(currentUserDisplayName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <GeneratedAvatar 
              seed={currentUserDisplayName}
              variant="initials"
              className="size-10"
            />
          )}
        </div>
      </div>
    )
  }

  // Other users' messages (left-aligned with avatar)
  return (
    <div className={cn(
      "flex gap-3 w-full mb-2 group",
      !isGrouped && "mt-3"
    )}>
      {/* Avatar - always shown before other users' messages */}
      <div className="flex-shrink-0 self-end">
        {userImage ? (
          <Avatar className="size-10">
            <AvatarImage src={userImage} alt={displayName} />
            <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <GeneratedAvatar 
            seed={displayName}
            variant="initials"
            className="size-10"
          />
        )}
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0 max-w-[75%] sm:max-w-[65%]">
        {showAvatar && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-sm font-semibold text-foreground">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp()}
            </span>
          </div>
        )}
        <div className={cn(
          "rounded-2xl px-4 py-2.5 relative",
          "bg-card border border-border",
          "shadow-sm hover:shadow-md transition-all"
        )}>
            {/* Attachments */}
            {attachments && Array.isArray(attachments) && attachments.length > 0 && (
              <div className="mb-2 space-y-2">
                {attachments.map((attachment, index) => {
                  const type = (attachmentTypes && Array.isArray(attachmentTypes) ? attachmentTypes[index] : null) || 'file'
                if (type === 'image') {
                  return (
                    <img
                      key={index}
                      src={attachment}
                      alt="Attachment"
                      className="max-w-full rounded-lg"
                      style={{ maxHeight: '300px' }}
                    />
                  )
                } else if (type === 'voice') {
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <audio src={attachment} controls className="w-full" />
                    </div>
                  )
                } else {
                  return (
                    <a
                      key={index}
                      href={attachment}
                      download
                      className="flex items-center gap-2 p-2 bg-muted rounded-lg hover:bg-muted/80"
                    >
                      <span className="text-xs">📎 File attachment</span>
                    </a>
                  )
                }
              })}
            </div>
          )}
          {content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
              {content}
            </p>
          )}
          {!showAvatar && (
            <div className="flex items-center justify-start gap-1.5 mt-1.5 opacity-60">
              <span className="text-[10px]">
                {formatTimestamp()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


