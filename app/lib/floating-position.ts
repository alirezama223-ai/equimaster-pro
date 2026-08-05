export type FloatingPlacement = "bottom-start" | "bottom-end";

export type FloatingPositionInput = {
  placement: FloatingPlacement;
  offset: number;
  matchWidth: boolean;
  floatingWidth?: number;
  floatingHeight?: number;
};

export type FloatingPositionResult = {
  top: number;
  left: number;
  width?: number;
  maxHeight: number;
  placement: "bottom" | "top";
};

const VIEWPORT_PADDING = 8;
export const FLOATING_Z_INDEX = 100;
export const DEFAULT_FLOATING_MAX_HEIGHT = 240;

export function getScrollParents(element: HTMLElement | null): HTMLElement[] {
  const parents: HTMLElement[] = [];
  let node = element?.parentElement ?? null;

  while (node) {
    const style = getComputedStyle(node);
    const scrollable =
      /(auto|scroll|overlay)/.test(style.overflowY) ||
      /(auto|scroll|overlay)/.test(style.overflowX) ||
      /(auto|scroll|overlay)/.test(style.overflow);

    if (scrollable) {
      parents.push(node);
    }

    node = node.parentElement;
  }

  return parents;
}

export function computeFloatingPosition(
  anchor: DOMRect,
  {
    placement,
    offset,
    matchWidth,
    floatingWidth,
    floatingHeight,
  }: FloatingPositionInput
): FloatingPositionResult {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const width = matchWidth
    ? anchor.width
    : Math.min(floatingWidth ?? anchor.width, viewportWidth - VIEWPORT_PADDING * 2);

  const spaceBelow = viewportHeight - anchor.bottom - VIEWPORT_PADDING;
  const spaceAbove = anchor.top - VIEWPORT_PADDING;
  const preferBelow = spaceBelow >= 120 || spaceBelow >= spaceAbove;

  let maxHeight = DEFAULT_FLOATING_MAX_HEIGHT;
  let top: number;
  let resolvedPlacement: "bottom" | "top";

  if (preferBelow) {
    resolvedPlacement = "bottom";
    top = anchor.bottom + offset;
    maxHeight = Math.min(DEFAULT_FLOATING_MAX_HEIGHT, Math.max(80, spaceBelow - offset));
  } else {
    resolvedPlacement = "top";
    maxHeight = Math.min(DEFAULT_FLOATING_MAX_HEIGHT, Math.max(80, spaceAbove - offset));
    const panelHeight = Math.min(floatingHeight ?? maxHeight, maxHeight);
    top = anchor.top - offset - panelHeight;
  }

  let left =
    placement === "bottom-end" ? anchor.right - width : anchor.left;

  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, viewportWidth - width - VIEWPORT_PADDING)
  );

  top = Math.max(VIEWPORT_PADDING, top);

  return {
    top,
    left,
    width: matchWidth ? width : width,
    maxHeight,
    placement: resolvedPlacement,
  };
}

export function isFloatingOverlayNode(node: Node | null): boolean {
  return Boolean(node && (node as Element).closest?.("[data-floating-overlay]"));
}
