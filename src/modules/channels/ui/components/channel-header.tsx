'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, EditIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { EditChannelDialog } from './edit-channel-dialog'
import { trpc } from '@/trpc/client'

interface Props {
  channelName: string
  channelId: string
  onChannelUpdate?: () => void
}

export const ChannelHeader = ({ channelName, channelId, onChannelUpdate }: Props) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const utils = trpc.useUtils()

  const handleEditSuccess = () => {
    // Invalidate queries to refresh the channel name
    utils.channels.list.invalidate()
    utils.channels.getMany.invalidate()
    onChannelUpdate?.()
  }

  return (
    <>
      <EditChannelDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        channelId={channelId}
        initialName={channelName}
        onSuccess={handleEditSuccess}
      />
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/channels" className="font-medium hover:text-primary">
                    Channels
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-lg">
                  #{channelName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditDialogOpen(true)}
            className="h-8 w-8"
          >
            <EditIcon className="size-4" />
          </Button>
        </div>
      </div>
    </>
  )
}


