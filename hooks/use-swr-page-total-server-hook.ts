import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrPageTotalServerHook = (
  { args, totalHandle }: ImageServerHandleProps,
  tag: string,
  showStatus: number = -1,
  featured: number = -1,
  camera: string = '',
  lens: string = '',
  exposure: string = '',
  f_number: string = '',
  iso: string = '',
  labels: string[] = [],
  labelsOperator: 'and' | 'or' = 'and'
) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [args, tag, showStatus, featured, camera, lens, exposure, f_number, iso, labels, labelsOperator],
    () => {
      return totalHandle(tag, showStatus, featured, camera, lens, exposure, f_number, iso, labels, labelsOperator)
    }
  )

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}