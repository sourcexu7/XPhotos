// 数据库表结构类型

export type AlbumType = {
  id: string;
  name: string;
  album_value: string;
  detail: string | null;
  theme: string;
  show: number;
  sort: number;
  license: string | null;
  image_sorting: number;
  random_show: number;
  cover?: string | null;
  del?: number;
  createdAt?: Date;
  updatedAt?: Date | null;
}

export type ExifType = {
  make: string | null;
  model: string | null;
  bits: number | null;
  date_time: string | null;
  exposure_time: string | null;
  f_number: number | null;
  exposure_program: string | null;
  iso_speed_rating: number | null;
  focal_length: number | null;
  lens_specification: string | null;
  lens_model: string | null;
  exposure_mode: string | null;
  cfa_pattern: string | null;
  color_space: string | null;
  white_balance: string | null;
}

export type ImageType = {
  id: string;
  image_name: string;
  title: string;
  url: string;
  preview_url: string;
  video_url: string;
  blurhash: string;
  exif: ExifType;
  labels: string[];
  width: number;
  height: number;
  lon: string;
  lat: string;
  album: string;
  detail: string;
  type: number; // type: 图片类型为 1，livephoto 类型为 2
  show: number;
  show_on_mainpage: number;
  featured?: number;
  sort: number;
  album_name: string;
  album_value: string;
  album_license: string;
}

export type Config = {
  id: string;
  config_key: string;
  config_value: string | null;
  detail: string | null;
}
