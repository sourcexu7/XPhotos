import { fetchDashboardStats } from '~/lib/db/query/dashboard'
import { DashboardView } from '~/components/admin/dashboard/dashboard-view'
import { getTranslations } from 'next-intl/server'
import AdminPageHeader from '~/components/admin/layout/page-header'

export default async function Admin() {
  const t = await getTranslations('Dashboard')
  const stats = await fetchDashboardStats()

  return (
    <div className="p-6">
      <AdminPageHeader title={t('title')} description={t('description')} />
      <DashboardView stats={stats} />
    </div>
  )
}
