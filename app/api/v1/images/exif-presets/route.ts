import { NextResponse } from 'next/server'
import { fetchExifPresets } from '~/lib/db/query/images'
import { filterStringArray } from '~/lib/utils/array'

export async function GET() {
  try {
    const { shutterSpeeds, apertures, isos } = await fetchExifPresets()
    return NextResponse.json({
      shutterSpeeds: filterStringArray(shutterSpeeds),
      apertures:     filterStringArray(apertures),
      isos:          filterStringArray(isos),
    })
  } catch (error) {
    console.error('Failed to fetch exif presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exif presets' },
      { status: 500 }
    )
  }
}
