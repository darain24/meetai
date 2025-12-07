import Link from "next/link"
import Image from "next/image"
import { Button } from '@/components/ui/button'

interface Props {
    onLeave: () => void
    meetingName: string
}

export const CallActive = ({onLeave, meetingName}: Props) => {
    return (
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white pointer-events-auto z-20">
            <div className="bg-[#101213] rounded-lg p-4 flex items-center gap-4">
                <Link href="/" className="flex items-center justify-center p-1 bg-white/10 rounded-full w-fit">
                    <Image src="/logo.svg" width={22} height={22} alt="Logo"/>
                </Link>
                <h4 className="text-base">
                    {meetingName}
                </h4>
            </div>
            <div className="bg-[#101213] rounded-full px-4 py-2 self-center">
                <Button onClick={onLeave} variant="destructive">
                    Leave Call
                </Button>
            </div>
        </div>
    )
}
