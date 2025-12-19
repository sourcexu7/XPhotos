import { getVisitAnalytics } from '~/lib/db/query/analytics'
import { AdminAnalyticsClient } from '~/components/admin/chart/antd-chart'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const data = await getVisitAnalytics()

  return <AdminAnalyticsClient initialData={data} />
}




