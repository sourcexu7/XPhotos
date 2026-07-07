import 'server-only'

import { db } from '~/lib/db'
import { cacheWrap, cacheInvalidate } from '~/lib/redis'

export type PublicDashboardStats = {
  images: { total: number; public: number }
  guides: { total: number; public: number }
  albums: { total: number }
  cameras: { top: Array<{ camera: string; count: number }> }
  lenses: { top: Array<{ lens: string; count: number }> }
  photosByYear: Array<{ year: number; count: number }>
}

const CACHE_KEY = 'public:dashboard'

export async function invalidateDashboardCache(): Promise<void> {
  await cacheInvalidate(CACHE_KEY)
}

export async function fetchPublicDashboardStats(): Promise<PublicDashboardStats> {
  return cacheWrap<PublicDashboardStats>(CACHE_KEY, async () => {
    const [imagesCount, guidesCount, albumsCount, cameraStats, lensStats, photosByYear] =
      await Promise.all([
        db.$queryRaw<[{ total: number; public: number }]>`
          SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE show = 0) as public
          FROM images WHERE del = 0
        `,
        db.$queryRaw<[{ total: number; public: number }]>`
          SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE show = 1) as public
          FROM guides WHERE del = 0
        `,
        db.$queryRaw<[{ total: number }]>`
          SELECT COUNT(*) as total FROM albums WHERE del = 0
        `,
        db.$queryRaw<Array<{ camera: string; count: bigint }>>`
          SELECT COALESCE(exif->>'model', 'Unknown') as camera, COUNT(*) as count
          FROM images
          WHERE del = 0 AND exif->>'model' IS NOT NULL AND exif->>'model' != ''
          GROUP BY camera ORDER BY count DESC LIMIT 5
        `,
        db.$queryRaw<Array<{ lens: string; count: bigint }>>`
          SELECT COALESCE(exif->>'lens_model', 'Unknown') as lens, COUNT(*) as count
          FROM images
          WHERE del = 0 AND exif->>'lens_model' IS NOT NULL AND exif->>'lens_model' != ''
          GROUP BY lens ORDER BY count DESC LIMIT 5
        `,
        db.$queryRaw<Array<{ year: number; count: bigint }>>`
          SELECT EXTRACT(YEAR FROM shoot_at)::INTEGER as year, COUNT(*) as count
          FROM images
          WHERE del = 0 AND shoot_at IS NOT NULL
          GROUP BY year ORDER BY year DESC LIMIT 10
        `,
      ])

    const ic = Array.isArray(imagesCount) && imagesCount.length > 0 ? imagesCount[0] : null
    const gc = Array.isArray(guidesCount) && guidesCount.length > 0 ? guidesCount[0] : null
    const ac = Array.isArray(albumsCount) && albumsCount.length > 0 ? albumsCount[0] : null

    return {
      images: { total: ic ? Number(ic.total) : 0, public: ic ? Number(ic.public) : 0 },
      guides: { total: gc ? Number(gc.total) : 0, public: gc ? Number(gc.public) : 0 },
      albums: { total: ac ? Number(ac.total) : 0 },
      cameras: { top: Array.isArray(cameraStats) ? cameraStats.map((i) => ({ camera: i.camera, count: Number(i.count) })) : [] },
      lenses: { top: Array.isArray(lensStats) ? lensStats.map((i) => ({ lens: i.lens, count: Number(i.count) })) : [] },
      photosByYear: Array.isArray(photosByYear) ? photosByYear.map((i) => ({ year: i.year, count: Number(i.count) })) : [],
    }
  })
}
