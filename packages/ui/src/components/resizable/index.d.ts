import * as ResizablePrimitive from 'react-resizable-panels';
declare const ResizablePanelGroup: ({
  className,
  ...props
}: React.ComponentProps<
  typeof ResizablePrimitive.PanelGroup
>) => import('react/jsx-runtime').JSX.Element;
declare const ResizablePanel: import('react').ForwardRefExoticComponent<
  Omit<
    import('react').HTMLAttributes<
      | HTMLElement
      | HTMLDivElement
      | HTMLHeadingElement
      | HTMLImageElement
      | HTMLParagraphElement
      | HTMLTimeElement
      | HTMLAnchorElement
      | HTMLButtonElement
      | HTMLObjectElement
      | HTMLDataElement
      | HTMLInputElement
      | HTMLMapElement
      | HTMLTitleElement
      | HTMLStyleElement
      | HTMLBodyElement
      | HTMLLinkElement
      | HTMLBaseElement
      | HTMLLabelElement
      | HTMLHeadElement
      | HTMLFormElement
      | HTMLAreaElement
      | HTMLAudioElement
      | HTMLQuoteElement
      | HTMLBRElement
      | HTMLCanvasElement
      | HTMLTableColElement
      | HTMLDataListElement
      | HTMLModElement
      | HTMLDetailsElement
      | HTMLDialogElement
      | HTMLDListElement
      | HTMLEmbedElement
      | HTMLFieldSetElement
      | HTMLHRElement
      | HTMLHtmlElement
      | HTMLIFrameElement
      | HTMLLegendElement
      | HTMLLIElement
      | HTMLMetaElement
      | HTMLMeterElement
      | HTMLOListElement
      | HTMLOptGroupElement
      | HTMLOptionElement
      | HTMLOutputElement
      | HTMLPreElement
      | HTMLProgressElement
      | HTMLSlotElement
      | HTMLScriptElement
      | HTMLSelectElement
      | HTMLSourceElement
      | HTMLSpanElement
      | HTMLTableElement
      | HTMLTemplateElement
      | HTMLTableSectionElement
      | HTMLTableCellElement
      | HTMLTextAreaElement
      | HTMLTableRowElement
      | HTMLTrackElement
      | HTMLUListElement
      | HTMLVideoElement
      | HTMLTableCaptionElement
      | HTMLMenuElement
      | HTMLPictureElement
    >,
    'id' | 'onResize'
  > & {
    className?: string | undefined;
    collapsedSize?: number | undefined;
    collapsible?: boolean | undefined;
    defaultSize?: number | undefined;
    id?: string | undefined;
    maxSize?: number | undefined;
    minSize?: number | undefined;
    onCollapse?: ResizablePrimitive.PanelOnCollapse | undefined;
    onExpand?: ResizablePrimitive.PanelOnExpand | undefined;
    onResize?: ResizablePrimitive.PanelOnResize | undefined;
    order?: number | undefined;
    style?: object | undefined;
    tagName?: keyof HTMLElementTagNameMap | undefined;
  } & {
    children?: import('react').ReactNode;
  } & import('react').RefAttributes<ResizablePrimitive.ImperativePanelHandle>
>;
declare const ResizableHandle: ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => import('react/jsx-runtime').JSX.Element;
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
//# sourceMappingURL=index.d.ts.map
