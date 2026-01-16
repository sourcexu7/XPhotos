import 'server-only'
import ExifReader from 'exifreader'
import piexif from 'piexifjs'
import type { ExifType } from '~/types'

/**
 * 检查图片Buffer是否包含EXIF信息
 * @param imageBuffer 图片的Buffer
 * @returns 如果包含EXIF返回true，否则返回false
 */
export function hasExifData(imageBuffer: Buffer): boolean {
  try {
    const tags = ExifReader.load(imageBuffer)
    // 检查是否有任何EXIF标签
    // ExifReader可能返回空对象，需要检查是否有实际内容
    // 判断是否包含光圈信息（FNumber 或 ApertureValue）
    if (tags?.FNumber || tags?.ApertureValue) {
      return true
    }

    // 如果没有光圈信息，则视为无 EXIF（符合业务要求）
    return false
  } catch (error) {
    console.warn('Failed to check EXIF data:', error)
    return false
  }
}

/**
 * 将数据库中的EXIF数据转换为piexif格式
 * @param exifData 数据库中的EXIF数据
 * @returns piexif格式的EXIF字典
 */
function convertExifToPiexif(exifData: ExifType | null | undefined): any {
  if (!exifData) {
    return {}
  }

  const exifDict: any = {
    '0th': {},
    'Exif': {},
    'GPS': {},
    'Interop': {},
    '1st': {},
    'thumbnail': null,
  }

  // 基础信息 (0th IFD)
  // piexifjs需要字符串值以字节形式提供
  if (exifData.make) {
    exifDict['0th'][piexif.ImageIFD.Make] = String(exifData.make)
  }
  if (exifData.model) {
    exifDict['0th'][piexif.ImageIFD.Model] = String(exifData.model)
  }

  // EXIF信息
  if (exifData.data_time) {
    // 将日期格式转换为EXIF格式 (YYYY:MM:DD HH:mm:ss)
    // 数据库格式可能是 "YYYY-MM-DD HH:mm:ss" 或 "YYYY:MM:DD HH:mm:ss"
    let dateTime = String(exifData.data_time)
    // 只替换日期部分的 "-"（前10个字符），保留时间部分不变
    if (dateTime.includes('-') && dateTime.length >= 10) {
      const datePart = dateTime.substring(0, 10).replace(/-/g, ':')
      const timePart = dateTime.substring(10)
      dateTime = datePart + timePart
    }
    // 确保格式正确：YYYY:MM:DD HH:mm:ss
    if (!dateTime.includes(':')) {
      // 如果格式不对，尝试修复
      dateTime = dateTime.replace(/\s+/, ' ')
    }
    exifDict['Exif'][piexif.ExifIFD.DateTimeOriginal] = dateTime
    exifDict['Exif'][piexif.ExifIFD.DateTimeDigitized] = dateTime
  }

  if (exifData.exposure_time) {
    // 快门时间，需要转换为分数形式，例如 "1/125" -> [125, 1]
    const exposureMatch = exifData.exposure_time.match(/(\d+)\/(\d+)/)
    if (exposureMatch) {
      exifDict['Exif'][piexif.ExifIFD.ExposureTime] = [
        parseInt(exposureMatch[2]),
        parseInt(exposureMatch[1]),
      ]
    } else {
      // 如果是小数形式，例如 "0.008" -> [1, 125]
      const exposureNum = parseFloat(exifData.exposure_time)
      if (!isNaN(exposureNum) && exposureNum > 0) {
        // 转换为分数
        const denominator = Math.round(1 / exposureNum)
        exifDict['Exif'][piexif.ExifIFD.ExposureTime] = [denominator, 1]
      }
    }
  }

  if (exifData.f_number) {
    // 光圈值，例如 "f/2.8" -> [28, 10] 或 "2.8" -> [28, 10]
    const fNumberMatch = String(exifData.f_number).match(/(\d+\.?\d*)/)
    if (fNumberMatch) {
      const fNumber = parseFloat(fNumberMatch[1])
      if (!isNaN(fNumber)) {
        exifDict['Exif'][piexif.ExifIFD.FNumber] = [Math.round(fNumber * 10), 10]
      }
    }
  }

  if (exifData.iso_speed_rating) {
    const iso = parseInt(String(exifData.iso_speed_rating))
    if (!isNaN(iso)) {
      exifDict['Exif'][piexif.ExifIFD.ISOSpeedRatings] = [iso]
    }
  }

  if (exifData.focal_length) {
    // 焦距，例如 "50mm" -> [50, 1] 或 "50" -> [50, 1]
    const focalMatch = String(exifData.focal_length).match(/(\d+\.?\d*)/)
    if (focalMatch) {
      const focal = parseFloat(focalMatch[1])
      if (!isNaN(focal)) {
        exifDict['Exif'][piexif.ExifIFD.FocalLength] = [Math.round(focal * 10), 10]
      }
    }
  }

  if (exifData.lens_model) {
    exifDict['Exif'][piexif.ExifIFD.LensModel] = String(exifData.lens_model)
  }

  if (exifData.exposure_program) {
    const program = parseInt(String(exifData.exposure_program))
    if (!isNaN(program)) {
      exifDict['Exif'][piexif.ExifIFD.ExposureProgram] = program
    }
  }

  if (exifData.exposure_mode) {
    const mode = parseInt(String(exifData.exposure_mode))
    if (!isNaN(mode)) {
      exifDict['Exif'][piexif.ExifIFD.ExposureMode] = mode
    }
  }

  if (exifData.white_balance) {
    const wb = parseInt(String(exifData.white_balance))
    if (!isNaN(wb)) {
      exifDict['Exif'][piexif.ExifIFD.WhiteBalance] = wb
    }
  }

  if (exifData.color_space) {
    const cs = parseInt(String(exifData.color_space))
    if (!isNaN(cs)) {
      exifDict['Exif'][piexif.ExifIFD.ColorSpace] = cs
    }
  }

  return exifDict
}

/**
 * 将EXIF数据写入JPEG图片Buffer
 * @param imageBuffer 原始图片Buffer
 * @param exifData 数据库中的EXIF数据
 * @returns 包含EXIF信息的图片Buffer
 */
export function writeExifToImage(
  imageBuffer: Buffer,
  exifData: ExifType | null | undefined
): Buffer {
  try {
    // 检查图片格式 - piexifjs只支持JPEG
    // 检查JPEG文件头 (FF D8 FF)
    if (imageBuffer.length < 3 || imageBuffer[0] !== 0xFF || imageBuffer[1] !== 0xD8) {
      console.warn('Image is not JPEG format, cannot write EXIF')
      return imageBuffer
    }

    // 将Buffer转换为base64字符串（piexif需要）
    const base64 = imageBuffer.toString('base64')
    const jpegData = `data:image/jpeg;base64,${base64}`

    // 转换EXIF数据为piexif格式
    const exifDict = convertExifToPiexif(exifData)

    // 检查是否有EXIF数据
    const has0th = Object.keys(exifDict['0th']).length > 0
    const hasExif = Object.keys(exifDict['Exif']).length > 0
    const hasGPS = Object.keys(exifDict['GPS']).length > 0

    if (!has0th && !hasExif && !hasGPS) {
      console.warn('No EXIF data to write')
      return imageBuffer
    }

    console.log('Writing EXIF data:', {
      '0th': Object.keys(exifDict['0th']),
      'Exif': Object.keys(exifDict['Exif']),
      'GPS': Object.keys(exifDict['GPS']),
    })

    // 将EXIF数据转换为二进制字符串
    const exifStr = piexif.dump(exifDict)

    // 将EXIF数据插入到JPEG中
    const newJpegData = piexif.insert(exifStr, jpegData)

    // 将base64字符串转换回Buffer
    const base64Data = newJpegData.split(',')[1]
    if (!base64Data) {
      console.error('Failed to extract base64 data from piexif result')
      return imageBuffer
    }

    const resultBuffer = Buffer.from(base64Data, 'base64')
    console.log('EXIF written successfully, original size:', imageBuffer.length, 'new size:', resultBuffer.length)
    return resultBuffer
  } catch (error) {
    // 如果写入失败，返回原图
    console.error('Failed to write EXIF data:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
    return imageBuffer
  }
}

