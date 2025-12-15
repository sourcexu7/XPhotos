import { FilterBadge } from './filter-badge'

export function FilterBadgeDefault() {
  return (
    <div className='flex flex-wrap gap-3'>
      <FilterBadge label='Model' value='Canon EOS R6' />
      <FilterBadge label='Location' value='Tokyo' variant='pill' />
      <FilterBadge
        variant='avatar'
        avatar='/icons/icon-512x512.png'
        onRemove={() => {}}
      >
        <span className='text-tremor-label text-muted-foreground'>Photographer</span>
        <span className='h-4 w-px bg-border' />
        <span className='font-medium text-foreground'>Alice</span>
      </FilterBadge>
    </div>
  )
}
