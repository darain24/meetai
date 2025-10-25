
import { SignInView } from '@/modules/auth/ui/views/sign-in-view'
import {auth} from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
    return <SignInView />
}

export default Page