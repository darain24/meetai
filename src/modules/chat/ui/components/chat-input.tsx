'use client'
import { useState, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendIcon } from 'lucide-react'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
}

export const ChatInput = ({ onSend, disabled }: Props) => {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-x-2 items-end">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none"
        rows={1}
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="icon"
        className="h-[60px] w-[60px]"
      >
        <SendIcon className="size-5" />
      </Button>
    </div>
  )
}

