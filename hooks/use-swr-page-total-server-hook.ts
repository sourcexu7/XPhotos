import useSWR from 'swr'

export const useSwrPageTotalServerHook = (
  args: string,
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
    [args, tag, showStatus, featured, camera, lens, exposure, f_number, iso, labelsKey, labelsOperator],
    async () => {
      // 管理端列表页：total 已经由列表接口返回，这里仅保留 mutate 触发刷新即可
      return null
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