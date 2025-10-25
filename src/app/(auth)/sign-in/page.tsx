
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
        // Session token lookup failed, user is not logged in
        console.error('Session lookup failed:', error);
        session = null;
    }
    
    if (session) {
        redirect('/')
    }
    return <SignInView />
}

export default Page