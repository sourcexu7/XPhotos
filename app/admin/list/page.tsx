import {
  fetchServerImagesListByAlbum,
  fetchServerImagesPageTotalByAlbum
} from '~/lib/db/query/images'
import type { ImageServerHandleProps } from '~/types/props'
import ListProps from '~/components/admin/list/list-props'

export default async function List() {
  const getData = async (pageNum: number, Album: string, showStatus = -1, featured = -1, camera = '', lens = '', exposure = '', f_number = '', iso = '', labels: string[] = [], labelsOperator: 'and' | 'or' = 'and') => {
    'use server'
    return await fetchServerImagesListByAlbum(pageNum, Album, showStatus, featured, camera || '', lens || '', exposure || '', f_number || '', iso || '', labels || [], labelsOperator, undefined)
  }

  const getTotal = async (Album: string, showStatus = -1, featured = -1, camera = '', lens = '', exposure = '', f_number = '', iso = '', labels: string[] = [], labelsOperator: 'and' | 'or' = 'and') => {
    'use server'
    return await fetchServerImagesPageTotalByAlbum(Album, showStatus, featured, camera || '', lens || '', exposure || '', f_number || '', iso || '', labels || [], labelsOperator)
  }

  const props: ImageServerHandleProps = {
    handle: getData,
    args: 'getImages-server',
    totalHandle: getTotal,
  }

  return (
    <ListProps {...props} />
  )
}