'use client'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Hash, FileText, ChevronRight, Mail } from "lucide-react";
import Link from "next/link";
import Image  from 'next/image';
import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'
import { usePathname } from "next/navigation";
import { DashboardUserButton } from "@/modules/dashboard/ui/components/dashboard-user-button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { trpc } from "@/trpc/client";
import { useState } from "react";

export const DashboardSidebar = () => {
    const pathname = usePathname()
    const [channelsOpen, setChannelsOpen] = useState(pathname?.startsWith('/channels'))
    const [notesOpen, setNotesOpen] = useState(pathname?.startsWith('/notes'))
    
    // Fetch channels and notes
    const { data: channelsData } = trpc.channels.getMany.useQuery({
        page: 1,
        pageSize: 50, // Get more items for sidebar
    }, {
        enabled: channelsOpen, // Only fetch when dropdown is open
    })
    
    const { data: notesData } = trpc.notes.list.useQuery({
        page: 1,
        pageSize: 50, // Get more items for sidebar
    }, {
        enabled: notesOpen, // Only fetch when dropdown is open
    })

    const isChannelsActive = pathname?.startsWith('/channels')
    const isNotesActive = pathname?.startsWith('/notes')
    const isContactActive = pathname === '/contact'

    return(
        <Sidebar>
            <SidebarHeader className="text-sidebar-accent-foreground">
                <Link href='/' className="flex items-center gap-2 ps-2 pt-2">
                    <Image src='/logo.svg' height={36} width={36} alt = 'CollabSpace'/>
                    <p className="text-2xl font-semibold">CollabSpace</p>
                </Link>
            </SidebarHeader>
            <div className="px-4 py-2">
                <Separator className="opacity-10 text-[#5D6B68]"/>
            </div>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* Channels Dropdown */}
                            <Collapsible
                                asChild
                                open={channelsOpen}
                                onOpenChange={setChannelsOpen}
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            className={cn(
                                                'h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6D68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50',
                                                isChannelsActive && 'bg-linear-to-r/oklch border-[#5D6D68]/10'
                                            )}
                                            isActive={isChannelsActive}
                                        >
                                            <Hash className="size-5"/>
                                            <span className="text-sm font-medium tracking-tight">
                                                Channels
                                            </span>
                                            <ChevronRight 
                                                className={cn(
                                                    "ml-auto size-4 transition-transform",
                                                    channelsOpen && "rotate-90"
                                                )}
                                            />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={pathname === '/channels'}
                                                >
                                                    <Link href="/channels">
                                                        <span>All Channels</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuItem>
                                            {channelsData?.items.map((channel) => (
                                                <SidebarMenuSubItem key={channel.id}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={pathname === `/channels/${channel.id}`}
                                                    >
                                                        <Link href={`/channels/${channel.id}`}>
                                                            <Hash className="size-3" />
                                                            <span className="truncate">{channel.name}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            {/* Notes Dropdown */}
                            <Collapsible
                                asChild
                                open={notesOpen}
                                onOpenChange={setNotesOpen}
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            className={cn(
                                                'h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6D68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50',
                                                isNotesActive && 'bg-linear-to-r/oklch border-[#5D6D68]/10'
                                            )}
                                            isActive={isNotesActive}
                                        >
                                            <FileText className="size-5"/>
                                            <span className="text-sm font-medium tracking-tight">
                                                Notes
                                            </span>
                                            <ChevronRight 
                                                className={cn(
                                                    "ml-auto size-4 transition-transform",
                                                    notesOpen && "rotate-90"
                                                )}
                                            />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            <SidebarMenuItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={pathname === '/notes'}
                                                >
                                                    <Link href="/notes">
                                                        <span>All Notes</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuItem>
                                            {notesData?.items.map((note) => (
                                                <SidebarMenuSubItem key={note.id}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={pathname === `/notes/${note.id}`}
                                                    >
                                                        <Link href={`/notes/${note.id}`}>
                                                            <FileText className="size-3" />
                                                            <span className="truncate">{note.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            {/* Contact Us */}
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    asChild
                                    className={cn(
                                        'h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6D68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50',
                                        isContactActive && 'bg-linear-to-r/oklch border-[#5D6D68]/10'
                                    )}
                                    isActive={isContactActive}
                                >
                                    <Link href="/contact">
                                        <Mail className="size-5"/>
                                        <span className="text-sm font-medium tracking-tight">
                                            Contact Us
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="text-white">
                <DashboardUserButton />
            </SidebarFooter>
        </Sidebar>
    )
}

