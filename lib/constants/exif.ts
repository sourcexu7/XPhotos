/**
 * EXIF 相关常量
 */

export const DEFAULT_EXIF_PRESETS = {
  cameraModels: ['Canon EOS R5', 'Sony A7 III', 'Nikon Z7 II', 'Fujifilm X-T4', 'iPhone 13 Pro'],
  shutterSpeeds: ['1/8000', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1'],
  isos: ['50', '100', '200', '400', '800', '1600', '3200', '6400'],
  apertures: ['1.4', '1.8', '2.0', '2.8', '3.5', '4.0', '5.6', '8.0', '11', '16'],
}

export type ExifPresets = typeof DEFAULT_EXIF_PRESETS
