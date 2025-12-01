import { fetchImagesAnalysis } from '~/server/db/query/images'
import CardList from '~/components/admin/dashboard/card-list'
import type { AnalysisDataProps } from '~/types/props'

export default async function Admin() {
  const data = await fetchImagesAnalysis()

  return (
    <div className="flex flex-col mt-4 space-y-2">
      <CardList data={data} />
    </div>
  )
}