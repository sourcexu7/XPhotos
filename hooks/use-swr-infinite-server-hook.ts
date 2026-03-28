import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrInfiniteServerHook = (
  { handle, args }: ImageServerHandleProps,
  pageNum: number,
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
  const labelsKey = Array.isArray(labels) ? [...labels].sort().join(',') : ''

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [args, pageNum, tag, showStatus, featured, camera, lens, exposure, f_number, iso, labelsKey, labelsOperator],
    () => {
      return handle(pageNum, tag, showStatus, featured, camera, lens, exposure, f_number, iso, labels, labelsOperator)
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  return {
    data,
    error,
    isLoading: isLoading || isValidating,
    mutate
  }
}