'use client'

import { CommandResponsiveDialog, CommandInput, CommandList } from "@/components/ui/command"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useChannelsFilters } from "@/modules/channels/hooks/use-channels-filters"
import { useNotesFilters } from "@/modules/notes/hooks/use-notes-filters"

interface Props {
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
}

export const DashboardCommand = ({open, setOpen} : Props) => {
    const pathname = usePathname()
    const [searchValue, setSearchValue] = useState("")
    const [channelsFilters, setChannelsFilters] = useChannelsFilters()
    const [notesFilters, setNotesFilters] = useNotesFilters()

    // Update search value when filters change
    useEffect(() => {
        if (pathname?.startsWith('/channels')) {
            setSearchValue(channelsFilters.search || "")
        } else if (pathname?.startsWith('/notes')) {
            setSearchValue(notesFilters.search || "")
        } else {
            setSearchValue("")
        }
    }, [pathname, channelsFilters.search, notesFilters.search])

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        
        if (pathname?.startsWith('/channels')) {
            setChannelsFilters({ search: value, page: 1 })
        } else if (pathname?.startsWith('/notes')) {
            setNotesFilters({ search: value, page: 1 })
        }
    }

    const getPlaceholder = () => {
        if (pathname?.startsWith('/channels')) {
            return "Search channels..."
        } else if (pathname?.startsWith('/notes')) {
            return "Search notes..."
        }
        return "Search..."
    }

    return (
        <CommandResponsiveDialog 
            open={open} 
            onOpenChange={setOpen}
            shouldFilter={false}
        >
            <CommandInput 
                placeholder={getPlaceholder()}
                value={searchValue}
                onValueChange={handleSearchChange}
            />
            <CommandList>
                {/* Search is handled by filters, no command items needed */}
            </CommandList>
        </CommandResponsiveDialog>
    )
}