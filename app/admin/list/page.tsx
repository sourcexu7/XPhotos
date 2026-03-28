import { fetchServerImagesPageByAlbum } from '~/lib/db/query/images'
import type { ImageServerHandleProps } from '~/types/props'
import ListProps from '~/components/admin/list/list-props'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { getTranslations } from 'next-intl/server'

async function getPage(pageNum: number, album: string, showStatus = -1, featured = -1, camera = '', lens = '', exposure = '', f_number = '', iso = '', labels: string[] = [], labelsOperator: 'and' | 'or' = 'and') {
  'use server'
  return await fetchServerImagesPageByAlbum(pageNum, album, showStatus, featured, camera || '', lens || '', exposure || '', f_number || '', iso || '', labels || [], labelsOperator, undefined)
}

export default async function List() {
  const tLink = await getTranslations('Link')
  const tAdminHeader = await getTranslations('AdminHeader')

  // @ts-expect-error - We are passing a new function signature to ListProps, which will be handled inside the component.
  const props: ImageServerHandleProps = {
    handle: getPage,
    args: 'getImages-server',
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={tLink('list')}
        description={tAdminHeader('listDesc')}
      />
      <ListProps {...props} />
    </div>
  )
}