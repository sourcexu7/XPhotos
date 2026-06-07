// 第三方库类型声明补充（部分库未提供官方类型声明）

declare module 'react-window' {
  import * as React from 'react'

  export interface FixedSizeListProps {
    height: number
    itemCount: number
    itemSize: number
    width: number | string
    children: (props: { index: number; style: React.CSSProperties; key: any }) => React.ReactNode
    className?: string
    direction?: 'ltr' | 'rtl'
    initialScrollOffset?: number
    innerElementType?: React.ElementType
    innerRef?: React.Ref<any>
    itemData?: any
    itemKey?: (index: number, data: any) => any
    layout?: 'horizontal' | 'vertical'
    onItemsRendered?: (props: {
      visibleStartIndex: number
      visibleStopIndex: number
      overscanStartIndex: number
      overscanStopIndex: number
    }) => void
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward'
      scrollOffset: number
      scrollUpdateWasRequested: boolean
    }) => void
    outerElementType?: React.ElementType
    outerRef?: React.Ref<any>
    overscanCount?: number
    style?: React.CSSProperties
    useIsScrolling?: boolean
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps> {
    scrollTo(scrollOffset: number): void
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void
  }

  export interface VariableSizeListProps extends FixedSizeListProps {
    itemSize: (index: number) => number
  }

  export class VariableSizeList extends React.Component<VariableSizeListProps> {
    scrollTo(scrollOffset: number): void
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void
    resetAfterIndex(index: number, shouldForceUpdate?: boolean): void
  }

  export interface FixedSizeGridProps {
    columnCount: number
    columnWidth: number
    height: number
    rowCount: number
    rowHeight: number
    width: number
    children: (props: { columnIndex: number; rowIndex: number; style: React.CSSProperties; key: any }) => React.ReactNode
  }

  export class FixedSizeGrid extends React.Component<FixedSizeGridProps> {
    scrollTo(params: { scrollLeft: number; scrollTop: number }): void
    scrollToItem(params: { columnIndex: number; rowIndex: number; align?: 'auto' | 'smart' | 'center' | 'end' | 'start' }): void
  }

  export interface VariableSizeGridProps extends FixedSizeGridProps {
    columnWidth: (index: number) => number
    rowHeight: (index: number) => number
  }

  export class VariableSizeGrid extends React.Component<VariableSizeGridProps> {
    scrollTo(params: { scrollLeft: number; scrollTop: number }): void
    scrollToItem(params: { columnIndex: number; rowIndex: number; align?: 'auto' | 'smart' | 'center' | 'end' | 'start' }): void
    resetAfterIndices(params: { columnIndex: number; rowIndex: number; shouldForceUpdate?: boolean }): void
  }

  export const areEqual: (a: any, b: any) => boolean
}
