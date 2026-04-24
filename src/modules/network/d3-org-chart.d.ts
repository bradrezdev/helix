declare module 'd3-org-chart' {
  export class OrgChart<TData = Record<string, unknown>> {
    container(selector: HTMLElement | string): this
    data(data: TData[]): this
    nodeWidth(fn: (node: { data: TData }) => number): this
    nodeHeight(fn: (node: { data: TData }) => number): this
    childrenMargin(fn: (node: { data: TData }) => number): this
    compactMarginBetween(fn: (node: { data: TData }) => number): this
    compactMarginPair(fn: (node: { data: TData }) => number): this
    neighbourMargin(fn: (node: { data: TData }) => number): this
    siblingsMargin(fn: (node: { data: TData }) => number): this
    buttonContent(fn: (params: { node: { data: TData & { _directSubordinates: number } } }) => string): this
    nodeContent(fn: (node: { data: TData }) => string): this
    onNodeClick(fn: (node: { data: TData }) => void): this
    initialZoom(value: number): this
    render(): this
    zoomIn(): this
    zoomOut(): this
    fit(): this
    expandAll(): this
    collapseAll(): this
  }
}
