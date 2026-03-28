import type { FilterState } from '~/components/admin/list/filter-bar'

/**
 * 计算激活的过滤器数量
 */
export function getActiveFilterCount(filters: FilterState): number {
  let count = 0
  
  if (filters.album && filters.album !== 'all') count++
  if (filters.showStatus && filters.showStatus !== 'all') count++
  if (filters.featured && filters.featured !== 'all') count++
  if (filters.selectedCamera && filters.selectedCamera !== 'all') count++
  if (filters.selectedLens && filters.selectedLens !== 'all') count++
  if (filters.selectedExposure && filters.selectedExposure !== 'all') count++
  if (filters.selectedAperture && filters.selectedAperture !== 'all') count++
  if (filters.selectedISO && filters.selectedISO !== 'all') count++
  if (Array.isArray(filters.selectedTags) && filters.selectedTags.length > 0) count++
  
  return count
}

/**
 * 构建 SWR key 对象
 */
export function buildSWRKey(
  args: string,
  pageNum: number,
  filters: FilterState
): Record<string, unknown> {
  return {
    type: args,
    page: pageNum,
    filters: {
      album: filters.album,
      showStatus: filters.showStatus === 'all' || filters.showStatus === '' ? -1 : Number(filters.showStatus),
      featured: filters.featured === 'all' || filters.featured === '' ? -1 : Number(filters.featured),
      camera: filters.selectedCamera === 'all' ? '' : filters.selectedCamera,
      lens: filters.selectedLens === 'all' ? '' : filters.selectedLens,
      exposure: filters.selectedExposure === 'all' ? '' : filters.selectedExposure,
      aperture: filters.selectedAperture === 'all' ? '' : filters.selectedAperture,
      iso: filters.selectedISO === 'all' ? '' : filters.selectedISO,
      tags: Array.isArray(filters.selectedTags) ? [...filters.selectedTags].sort().join(',') : '',
      labelsOperator: filters.labelsOperator,
    },
  }
}
