import {HomeView} from "@/modules/Home/ui/views/home-view";
import {auth} from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { caller } from "@/trpc/server";
const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if(!session) {
    redirect('/sign-in')
  }


    return <HomeView />
}

export default Page