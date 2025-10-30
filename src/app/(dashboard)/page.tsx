import {HomeView} from "@/modules/Home/ui/views/home-view";
import {auth} from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { caller } from "@/trpc/server";
const Page = async () => {
  let session;
  
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    })
  } catch (error) {
    // If session query fails (e.g., invalid token), redirect to sign-in
    console.error('Session query failed:', error);
    redirect('/sign-in')
  }

  if(!session) {
    redirect('/sign-in')
  }


    return <HomeView />
}

export default Page