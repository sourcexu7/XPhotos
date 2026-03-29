import FileUpload from '~/components/admin/upload/file-upload'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { getTranslations } from 'next-intl/server'

export default async function Upload() {
  const tLink = await getTranslations('Link')
  const tAdminHeader = await getTranslations('AdminHeader')

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={tLink('upload')}
        description={tAdminHeader('uploadDesc')}
      />
      <FileUpload />
    </div>
  )
}