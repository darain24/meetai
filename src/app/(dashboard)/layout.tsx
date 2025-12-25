import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./ui/components/dashboard-sidebar";
import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { Suspense } from "react";

interface Props {
    children: React.ReactNode;
}

const Layout = ({children}: Props) => {
    return (
        <SidebarProvider >
            <DashboardSidebar />
            <main className="flex flex-col h-screen w-screen bg-muted">
                <Suspense fallback={<div className="h-12 border-b bg-background" />}>
                    <DashboardNavbar />
                </Suspense>
                {children}
            </main>
            
        </SidebarProvider>
    )
}

export default Layout
