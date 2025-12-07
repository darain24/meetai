import  {
    CircleXIcon,
    CircleCheckIcon,
    VideoIcon,
} from 'lucide-react'
import {CommandSelect} from '@/components/command-select'
import {MeetingStatus } from '../../types'
import {useMeetingsFilters} from '../../hooks/use-meetings-filters'

const options = [
    {
        id: MeetingStatus.Active,
        value: MeetingStatus.Active,
        children: (
            <div className='flex items-center gap-x-2 capitalize'>
                <VideoIcon  />
                {MeetingStatus.Active}
            </div>
        )
    },
    {
        id: MeetingStatus.Cancelled,
        value: MeetingStatus.Cancelled,
        children: (
            <div className='flex items-center gap-x-2 capitalize'>
                <CircleXIcon  />
                {MeetingStatus.Cancelled}
            </div>
        )
    },
    {
        id: MeetingStatus.Completed,
        value: MeetingStatus.Completed,
        children: (
            <div className='flex items-center gap-x-2 capitalize'>
                <CircleCheckIcon  />
                {MeetingStatus.Completed}
            </div>
        )
    },
]



export const StatusFilter = () => {
    const [filter,setFilter] = useMeetingsFilters()
    return (
        <CommandSelect 
            placeholder='Status'
            className='h-9'
            options={options}
            onSelect={(value) => setFilter({status: value as  MeetingStatus})}
            value={filter.status ?? ''} 
        />
    )
}


