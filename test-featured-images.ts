import { fetchFeaturedImages } from './lib/db/query/images'

async function test() {
  try {
    const images = await fetchFeaturedImages()
    console.log('Featured images:', images)
  } catch (error) {
    console.error('Error:', error)
  }
}

test()
