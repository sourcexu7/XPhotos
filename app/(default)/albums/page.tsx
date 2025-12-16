import { fetchCameraAndLensList, fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/lib/db/query/images'
import type { ImageHandleProps } from '~/types/props'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import 'react-photo-album/masonry.css'
import type { Config } from '~/types'
import ThemeGalleryClient from '~/components/layout/theme-gallery-client'
import { fetchTagsList } from '~/lib/db/query/tags'

export default async function AlbumsPage() {
  const getData = async (pageNum: number, album: string) => {
    'use server'
    return await fetchClientImagesListByAlbum(pageNum, album)
  }

  const getPageTotal = async (album: string) => {
    'use server'
    return await fetchClientImagesPageTotalByAlbum(album)
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable',
      'custom_index_origin_enable',
      'custom_index_style',
    ])
  }

  const style: Config[] = await fetchConfigsByKeys(['custom_index_style'])
  const systemStyle = style.find(a => a.config_key === 'custom_index_style')?.config_value || '2'

  // 新增：获取全局相机 / 镜头选项用于前端筛选
  const { cameras, lenses } = await fetchCameraAndLensList()
  const tagOptions = await fetchTagsList()

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <div className="pt-[60px]">
      <ThemeGalleryClient
        systemStyle={systemStyle}
        enableFilters
        filterOptions={{ cameras, lenses }}
        tagOptions={tagOptions?.map(t => t.name) ?? []}
        {...props}
      />
    </div>
  )
}
