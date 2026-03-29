import { fetchImagesAnalysis } from '~/lib/db/query/images'
import { ModernDashboard, type Project, type Stat } from '~/components/admin/dashboard/modern-dashboard'
import { getTranslations } from 'next-intl/server'
import AdminPageHeader from '~/components/admin/layout/page-header'

export default async function Admin() {
  const t = await getTranslations('Dashboard')
  const data = await fetchImagesAnalysis()

  const stats: Stat[] = [
    { id: 'total', label: t('totalPhotos'), value: data.total },
    { id: 'public', label: t('publicPhotos'), value: data.showTotal },
    { id: 'albums', label: t('totalAlbums'), value: data.result.length },
    { id: 'cameras', label: t('camerasUsed'), value: data.cameraStats.length },
  ]

  const projects: Project[] = data.result.map((album: any) => {
    const total = Number(album.total || 0)
    const showTotal = Number(album.show_total || 0)
    const progress = total > 0 ? Math.round((showTotal / total) * 100) : 0
    
    return {
      id: album.value,
      name: album.name,
      subtitle: t('photoCount', { count: total }),
      date: album.created_at ? new Date(album.created_at).toISOString() : new Date().toISOString(),
      progress: progress,
      status: progress === 100 ? 'completed' : 'inProgress',
      daysLeft: album.updated_at ? t('updated', { date: new Date(album.updated_at).toLocaleDateString() }) : '',
    }
  })

  return (
    <div className="p-6">
      <AdminPageHeader title={t('title')} description={t('description')} />
      <ModernDashboard stats={stats} projects={projects} />
    </div>
  )
}
