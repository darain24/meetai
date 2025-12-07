'use client'

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { PanelLeftCloseIcon, PanelLeftIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePathname } from "next/navigation"
import { useChannelsFilters } from "@/modules/channels/hooks/use-channels-filters"
import { useNotesFilters } from "@/modules/notes/hooks/use-notes-filters"
import { useEffect, useState } from "react"

export const DashboardNavbar = () => {
    const {state, toggleSidebar, isMobile} = useSidebar()
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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
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

    const shouldShowSearch = pathname?.startsWith('/channels') || pathname?.startsWith('/notes')

    return (
        <nav className="flex px-4 gap-x-2 items-center py-3 border-b bg-background">
            <Button className="size-9" variant='outline' onClick={toggleSidebar}>
                {(state === 'collapsed' || isMobile) ?  
                <PanelLeftIcon className="size-4"/> 
                : <PanelLeftCloseIcon />}
            </Button>
            {shouldShowSearch && (
                <div className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder={getPlaceholder()}
                        value={searchValue}
                        onChange={handleSearchChange}
                        className="pl-9 h-9"
                    />
                </div>
            )}
        </nav>
    )
}