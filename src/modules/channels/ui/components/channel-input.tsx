'use client'

import { useState, KeyboardEvent, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SendIcon, PaperclipIcon, XIcon, MicIcon, SquareIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilePreview {
  file: File
  preview: string
  type: 'image' | 'file' | 'voice'
}

interface Props {
  onSend: (content: string, attachments?: FilePreview[]) => void
  disabled?: boolean
}

export const ChannelInput = ({ onSend, disabled }: Props) => {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<FilePreview[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    selectedFiles.forEach(file => {
      const isImage = file.type.startsWith('image/')
      const preview: FilePreview = {
        file,
        preview: isImage ? URL.createObjectURL(file) : '',
        type: isImage ? 'image' : 'file'
      }
      setFiles(prev => [...prev, preview])
    })
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      const removed = newFiles.splice(index, 1)[0]
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return newFiles
    })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setIsRecording(false)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    audioChunksRef.current = []
  }

  const handleSend = async () => {
    const hasContent = content.trim()
    const hasFiles = files.length > 0
    const hasVoice = audioBlob !== null

    if ((hasContent || hasFiles || hasVoice) && !disabled) {
      // If voice note exists, add it to files
      let filesToSend = [...files]
      if (audioBlob && audioUrl) {
        const voiceFile = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' })
        filesToSend.push({
          file: voiceFile,
          preview: audioUrl,
          type: 'voice'
        })
      }

      // Send message with content (empty string is fine if we have attachments)
      await onSend(hasContent ? content.trim() : '', filesToSend.length > 0 ? filesToSend : undefined)
      
      // Reset state only after successful send
      setContent('')
      setFiles([])
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      setAudioBlob(null)
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
        setAudioUrl(null)
      }
      audioChunksRef.current = []
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full">
      {/* File previews */}
      {(files.length > 0 || audioUrl) && (
        <div className="flex gap-2 p-2 border-b overflow-x-auto">
          {files.map((file, index) => (
            <div key={index} className="relative flex-shrink-0">
              {file.type === 'image' ? (
                <div className="relative">
                  <img
                    src={file.preview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="relative border rounded-lg p-2 h-20 w-32 flex items-center justify-center">
                  <div className="text-xs truncate">{file.file.name}</div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {audioUrl && (
            <div className="relative flex-shrink-0 border rounded-lg p-2 h-20 w-32 flex items-center justify-center gap-2">
              <audio src={audioUrl} controls className="h-full w-full" />
              <button
                onClick={cancelRecording}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 p-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0"
        >
          <PaperclipIcon className="size-4" />
        </Button>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message"
          className="min-h-[60px] resize-none flex-1"
          disabled={disabled}
        />

        {!isRecording ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startRecording}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <MicIcon className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={stopRecording}
            className="flex-shrink-0"
          >
            <SquareIcon className="size-4" />
          </Button>
        )}

        <Button
          onClick={handleSend}
          disabled={disabled || (!content.trim() && files.length === 0 && !audioBlob)}
          size="icon"
          className="flex-shrink-0"
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
