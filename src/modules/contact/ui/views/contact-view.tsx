'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Mail, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { trpc } from "@/trpc/client"

export const ContactView = () => {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [email, setEmail] = useState(session?.user?.email || "")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const sendMessage = trpc.contact.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Thank you for contacting us! We'll get back to you soon.")
      // Reset form
      setSubject("")
      setMessage("")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message. Please try again.")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    sendMessage.mutate({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
    })
  }

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pt-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground mt-1">We'd love to hear from you</p>
        </div>
      </div>

      {/* Contact Form Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-primary" />
            <CardTitle>Send us a message</CardTitle>
          </div>
          <CardDescription>
            Fill out the form below and we'll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={!!session?.user?.name}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!session?.user?.email}
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="What is this regarding?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us more about your inquiry..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="min-h-[200px] resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendMessage.isPending || !name.trim() || !email.trim() || !subject.trim() || !message.trim()}
              >
                {sendMessage.isPending ? (
                  <>
                    <span className="mr-2">Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Other ways to reach us</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">
                darainqamar10@gmail.com
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24-48 hours during business days.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

