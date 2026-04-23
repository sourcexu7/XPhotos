import 'server-only'

import { db } from '~/lib/db'

export type PublicDashboardStats = {
  images: {
    total: number
    public: number
  }
  guides: {
    total: number
    public: number
  }
  albums: {
    total: number
  }
  cameras: {
    top: Array<{ camera: string; count: number }>
  }
  lenses: {
    top: Array<{ lens: string; count: number }>
  }
  photosByYear: Array<{ year: number; count: number }>
}

export async function fetchPublicDashboardStats(): Promise<PublicDashboardStats> {
  const [
    imagesCount,
    guidesCount,
    albumsCount,
    cameraStats,
    lensStats,
    photosByYear,
  ] = await Promise.all([
    db.$queryRaw<[{ total: number; public: number }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE show = 0) as public
      FROM images
      WHERE del = 0
    `,
    db.$queryRaw<[{ total: number; public: number }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE show = 1) as public
      FROM guides
      WHERE del = 0
    `,
    db.$queryRaw<[{ total: number }]>`
      SELECT COUNT(*) as total
      FROM albums
      WHERE del = 0
    `,
    db.$queryRaw<Array<{ camera: string; count: bigint }>>`
      SELECT 
        COALESCE(exif->>'model', 'Unknown') as camera,
        COUNT(*) as count
      FROM images
      WHERE del = 0 AND exif->>'model' IS NOT NULL AND exif->>'model' != ''
      GROUP BY camera
      ORDER BY count DESC
      LIMIT 5
    `,
    db.$queryRaw<Array<{ lens: string; count: bigint }>>`
      SELECT 
        COALESCE(exif->>'lens_model', 'Unknown') as lens,
        COUNT(*) as count
      FROM images
      WHERE del = 0 AND exif->>'lens_model' IS NOT NULL AND exif->>'lens_model' != ''
      GROUP BY lens
      ORDER BY count DESC
      LIMIT 5
    `,
    db.$queryRaw<Array<{ year: number; count: bigint }>>`
      SELECT 
        EXTRACT(YEAR FROM shoot_at)::INTEGER as year,
        COUNT(*) as count
      FROM images
      WHERE del = 0 AND shoot_at IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT 10
    `,
  ])

  return {
    images: {
      total: Number(imagesCount[0].total),
      public: Number(imagesCount[0].public),
    },
    guides: {
      total: Number(guidesCount[0].total),
      public: Number(guidesCount[0].public),
    },
    albums: {
      total: Number(albumsCount[0].total),
    },
    cameras: {
      top: cameraStats.map((item) => ({
        camera: item.camera,
        count: Number(item.count),
      })),
    },
    lenses: {
      top: lensStats.map((item) => ({
        lens: item.lens,
        count: Number(item.count),
      })),
    },
    photosByYear: photosByYear.map((item) => ({
      year: item.year,
      count: Number(item.count),
    })),
  }
}
