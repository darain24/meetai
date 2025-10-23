import {ReactNode, useState} from 'react'
import { ChevronsUpDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandResponsiveDialog, CommandSeparator, CommandShortcut } from './ui/command'

interface Props {
    options: Array<{
        id : string
        value: string
        children: ReactNode
    }>
    onSelect: (value: string) => void
    onSearch?: (value: string) => void
    value: string
    placeholder: string
    isSearchable?: boolean
    className?: string
}

export const CommandSelect = ({options, onSelect, onSearch, value, placeholder = 'Select an option', className}: Props) => {
    const [open, setOpen] = useState(false)
    const selectOptions = options.find((option) => option.value === value)
    const [search, setSearch] = useState('')

    return (
        <>
            <Button
                type='button'
                variant='outline'
                className={cn('h-9 justify-between font-normal px-2',!selectOptions && 'text-muted-foreground', className)}
                onClick={() => setOpen(true)}
            >
                <div>
                    {selectOptions?.children ?? placeholder}
                </div>
                <ChevronsUpDownIcon />
            </Button>
            <CommandResponsiveDialog shouldFilter={!onSearch} open={open} onOpenChange={setOpen}>
                <CommandInput placeholder='Search...' onValueChange={onSearch} />
                <CommandList>
                    <CommandEmpty>
                        <span className='text-muted-foreground text-sm'>No results found.</span>
                    </CommandEmpty>
                    {options.map((option) => (
                        <CommandItem
                            key = {option.id}
                            onSelect={() => {
                                onSelect(option.value)
                                setOpen(false)
                            }}
                        >
                            {option.children}
                        </CommandItem>
                    ))}
                </CommandList>
            </CommandResponsiveDialog>
        </>
    )
}