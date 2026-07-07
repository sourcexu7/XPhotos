import type { PreviewImageHandleProps } from '~/types/props'
import PreviewImage from '~/components/album/preview-image'
import { getImageById, getGalleryConfig } from '~/lib/actions/gallery'

export default async function PreView({ params }: { params: any }) {
  const { id } = await params

  const imageData = await getImageById(String(id))

  const props: PreviewImageHandleProps = {
    data: imageData,
    args: 'getImages-client-preview',
    id: String(id),
    configHandle: getGalleryConfig,
  }

  return <PreviewImage {...props} />
}
