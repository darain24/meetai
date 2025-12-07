'use client'
import { Button } from "@/components/ui/button"
import { PlusIcon, XCircleIcon } from "lucide-react"
import { NewMeetingDialog } from "./new-meeting-dialog"
import { useState } from "react"
import { MeetingsSearchFilter } from "./meetings-search-filter"
import { StatusFilter } from "./status-filter"
import { useMeetingsFilters } from "../../hooks/use-meetings-filters"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { ScrollBar } from "@/components/ui/scroll-area"
import { DEFAULT_PAGE } from "@/constants"


export const MeetingsListHeader = ()  => {
    const [filters,setFilters] = useMeetingsFilters()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const isAnyFilterModified = !!filters.search || !!filters.status;
    const onClearFilters = () => {
        setFilters({
            search: '',
            status: null,
            page: DEFAULT_PAGE,
        })
    }
    return (
        <>  
            <NewMeetingDialog open = {isDialogOpen} onOpenChange={setIsDialogOpen}/>
            <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
                <div className="flex items-center justify-between">
                    <h5 className="font-medium text-xl">My Chats</h5>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <PlusIcon />
                        New Chat
                    </Button>
                </div>
                <ScrollArea>
                <div className="flex items-center gap-x-2 p-1">
                    <MeetingsSearchFilter />
                    <StatusFilter />
                    {isAnyFilterModified && (
                        <Button variant='outline' onClick={onClearFilters}>
                            <XCircleIcon className="size-4"/>
                            Clear
                        </Button>
                    )}
                </div>
                    <ScrollBar
                        orientation="horizontal"
                    />
                </ScrollArea>
            </div>
        </>
    )
}    