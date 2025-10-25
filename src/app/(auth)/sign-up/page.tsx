import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SignUpView } from "@/modules/auth/ui/views/sign-up-view"

const Page = async () => {
    let session;
    
    try {
        session = await auth.api.getSession({
            headers: await headers(),
        })
    } catch (error) {
        // If session query fails (e.g., invalid token), treat as no session
        console.error('Session query failed:', error);
        session = null;
    }
        
    if(!!session) {
        redirect('/')
    }
    return <SignUpView />
}

export default Page