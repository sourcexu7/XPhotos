import { fetchAlbumsList } from '~/lib/db/query/albums'
import AlbumList from '~/components/admin/album/album-list'
import RefreshButton from '~/components/admin/album/refresh-button.tsx'
import type { HandleProps } from '~/types/props'
import React from 'react'
import AlbumAddSheet from '~/components/admin/album/album-add-sheet'
import AlbumAddButton from '~/components/admin/album/album-add-button'
import AlbumEditSheet from '~/components/admin/album/album-edit-sheet'
import AlbumTitle from '~/components/admin/album/album-title'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { getTranslations } from 'next-intl/server'

export default async function List() {
  const tLink = await getTranslations('Link')
  const tAdminHeader = await getTranslations('AdminHeader')

  const getData = async () => {
    'use server'
    return await fetchAlbumsList()
  }

  const props: HandleProps = {
    handle: getData,
    args: 'getAlbums',
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <AdminPageHeader
        title={tLink('album')}
        description={tAdminHeader('albumDesc')}
      />
      <div className="flex justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <AlbumTitle />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <AlbumAddButton />
          <RefreshButton {...props} />
        </div>
      </div>
      <AlbumList {...props} />
      <AlbumAddSheet {...props} />
      <AlbumEditSheet {...props} />
    </div>
  )
}