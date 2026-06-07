import useSWR from 'swr'
import type { HandleProps } from '~/types/props'

export const useSwrHydrated = ({ handle, args }: HandleProps)   => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(args,
    () => {
      return handle?.() || Promise.resolve([])
    }, { revalidateOnFocus: false })

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}