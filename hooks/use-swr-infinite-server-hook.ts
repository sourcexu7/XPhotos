import useSWR from 'swr'
import type { ImageServerHandleProps } from '~/types/props'

export const useSwrInfiniteServerHook = (
  { handle, args }: ImageServerHandleProps,
  pageNum: number,
  tag: string,
  showStatus: number = -1,
  camera: string = '',
  lens: string = '',
  exposure: string = '',
  f_number: string = '',
  iso: string = '',
  labels: string[] = [],
  labelsOperator: 'and' | 'or' = 'and'
) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    [args, pageNum, tag, showStatus, camera, lens, exposure, f_number, iso, labels, labelsOperator],
    () => {
      return handle(pageNum, tag, showStatus, camera, lens, exposure, f_number, iso, labels, labelsOperator)
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