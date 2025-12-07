'use client'

import { trpc } from "@/trpc/client"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Hash, FileText, MessageSquare, TrendingUp } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export const HomeView = () => {
  const router = useRouter()
  
  // Fetch data for dashboard
  const { data: channelsData, isLoading: channelsLoading } = trpc.channels.getMany.useQuery({
    page: 1,
    pageSize: 5, // Get recent 5 channels
  })
  
  const { data: notesData, isLoading: notesLoading } = trpc.notes.list.useQuery({
    page: 1,
    pageSize: 5, // Get recent 5 notes
  })

  if (channelsLoading || notesLoading) {
    return <LoadingState title="Loading dashboard" description="Please wait..." />
  }

  const channels = channelsData?.items || []
  const notes = notesData?.items || []
  const totalChannels = channelsData?.total || 0
  const totalNotes = notesData?.total || 0

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your workspace</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChannels}</div>
            <p className="text-xs text-muted-foreground">
              Active channels in your workspace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNotes}</div>
            <p className="text-xs text-muted-foreground">
              Notes you&apos;ve created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {channels.length + notes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent items in your workspace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/channels')}
                className="text-xs"
              >
                <PlusIcon className="size-3 mr-1" />
                Channel
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => router.push('/notes')}
                className="text-xs"
              >
                <PlusIcon className="size-3 mr-1" />
                Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Channels and Notes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Channels */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Channels</CardTitle>
                <CardDescription>Your most recently active channels</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/channels')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {channels.length > 0 ? (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <Link
                    key={channel.id}
                    href={`/channels/${channel.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Hash className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary">
                          #{channel.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(channel.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No channels yet</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push('/channels')}
                >
                  Create Channel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Notes</CardTitle>
                <CardDescription>Your most recently updated notes</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/notes')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate group-hover:text-primary">
                            {note.title}
                          </p>
                          {note.pinned && (
                            <span className="text-xs text-muted-foreground">📌</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {note.content.substring(0, 50)}
                          {note.content.length > 50 ? '...' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notes yet</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => router.push('/notes')}
                >
                  Create Note
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
