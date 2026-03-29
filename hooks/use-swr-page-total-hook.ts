import useSWR from 'swr'
import type { ImageHandleProps } from '~/types/props'

export const useSwrPageTotalHook = ({ args, totalHandle, album, filters }: ImageHandleProps) => {
  const cameras = filters?.cameras || []
  const lenses = filters?.lenses || []
  const tags = filters?.tags || []
  const tagsOperator = filters?.tagsOperator || 'and'
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [args, album, cameras, lenses, tags, tagsOperator],
    () => {
      return totalHandle(album, cameras.length > 0 ? cameras : undefined, lenses.length > 0 ? lenses : undefined, tags.length > 0 ? tags : undefined, tagsOperator)
    },
    {
      revalidateOnFocus: false,
    }
  )

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}