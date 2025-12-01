import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AlbumType, ImageType, Config } from '~/types'

export type ButtonState = {
  albumAdd: boolean
  albumEdit: boolean
  album: AlbumType
  image: ImageType
  imageEdit: boolean
  imageViewData: ImageType
  imageView: boolean
  s3Edit: boolean
  s3Data: Config[]
  r2Edit: boolean
  r2Data: Config[]
  aListEdit: boolean
  aListData: Config[]
  MasonryView: boolean
  MasonryViewData: ImageType
  MasonryViewDataList: ImageType[]
  imageBatchDelete: boolean
  searchOpen: boolean
  loginHelp: boolean
  command: boolean
}

export type ButtonActions = {
  setAlbumAdd: (albumAdd: boolean) => void
  setAlbumEdit: (albumEdit: boolean) => void
  setAlbumEditData: (album: AlbumType) => void
  setImageEdit: (imageEdit: boolean) => void
  setImageEditData: (image: ImageType) => void
  setImageView: (imageView: boolean) => void
  setImageViewData: (imageViewData: ImageType) => void
  setS3Edit: (s3Edit: boolean) => void
  setS3EditData: (s3Data: Config[]) => void
  setR2Edit: (r2Edit: boolean) => void
  setR2EditData: (r2Data: Config[]) => void
  setAListEdit: (aListEdit: boolean) => void
  setAListEditData: (aListData: Config[]) => void
  setMasonryView: (masonryView: boolean) => void
  setMasonryViewData: (masonryViewData: ImageType) => void
  setMasonryViewDataList: (masonryViewDataList: ImageType[]) => void
  setImageBatchDelete: (imageBatchDelete: boolean) => void
  setSearchOpen: (searchOpen: boolean) => void
  setLoginHelp: (loginHelp: boolean) => void
  setCommand: (command: boolean) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return {
    albumAdd: false,
    albumEdit: false,
    album: {} as AlbumType,
    imageEdit: false,
    image: {} as ImageType,
    imageView: false,
    imageViewData: {} as ImageType,
    s3Edit: false,
    s3Data: [] as Config[],
    r2Edit: false,
    r2Data: [] as Config[],
    aListEdit: false,
    aListData: [] as Config[],
    MasonryView: false,
    MasonryViewData: {} as ImageType,
    MasonryViewDataList: [] as ImageType[],
    imageBatchDelete: false,
    searchOpen: false,
    loginHelp: false,
    command: false,
  }
}

export const defaultInitState: ButtonState = {
  albumAdd: false,
  albumEdit: false,
  album: {} as AlbumType,
  imageEdit: false,
  image: {} as ImageType,
  imageView: false,
  imageViewData: {} as ImageType,
  s3Edit: false,
  s3Data: [] as Config[],
  r2Edit: false,
  r2Data: [] as Config[],
  aListEdit: false,
  aListData: [] as Config[],
  MasonryView: false,
  MasonryViewData: {} as ImageType,
  MasonryViewDataList: [] as ImageType[],
  imageBatchDelete: false,
  searchOpen: false,
  loginHelp: false,
  command: false,
}

export const createButtonStore = (initState: ButtonState = defaultInitState) => {
  return createStore<ButtonStore>()(
    persist(
      (set) => ({
        ...initState,
        setAlbumAdd: (albumAdd) => set({ albumAdd }),
        setAlbumEdit: (albumEdit) => set({ albumEdit }),
        setAlbumEditData: (album) => set({ album }),
        setImageEdit: (imageEdit) => set({ imageEdit }),
        setImageEditData: (image) => set({ image }),
        setImageView: (imageView) => set({ imageView }),
        setImageViewData: (imageViewData) => set({ imageViewData }),
        setS3Edit: (s3Edit) => set({ s3Edit }),
        setS3EditData: (s3Data) => set({ s3Data }),
        setR2Edit: (r2Edit) => set({ r2Edit }),
        setR2EditData: (r2Data) => set({ r2Data }),
        setAListEdit: (aListEdit) => set({ aListEdit }),
        setAListEditData: (aListData) => set({ aListData }),
        setMasonryView: (MasonryView) => set({ MasonryView }),
        setMasonryViewData: (MasonryViewData) => set({ MasonryViewData }),
        setMasonryViewDataList: (MasonryViewDataList) => set({ MasonryViewDataList }),
        setImageBatchDelete: (imageBatchDelete) => set({ imageBatchDelete }),
        setSearchOpen: (searchOpen) => set({ searchOpen }),
        setLoginHelp: (loginHelp) => set({ loginHelp }),
        setCommand: (command) => set({ command }),
      }),
      {
        name: 'pic-impact-button-storage',
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
      }
    )
  )
}