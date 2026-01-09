import { DrawOperation, Point, StrokeOperation, TextOperation, WhiteboardPage } from '../types';

export function createEmptyPage(): WhiteboardPage {
  return {
    id: `page_${Date.now()}_${Math.random()}`,
    operations: [],
  };
}

export function createStroke(
  points: Point[],
  color: string,
  width: number,
  tool: 'pen' | 'eraser'
): StrokeOperation {
  return {
    type: 'stroke',
    id: `stroke_${Date.now()}_${Math.random()}`,
    points,
    color,
    width,
    tool,
  };
}

export function createText(
  position: Point,
  text: string,
  color: string,
  fontSize: number
): TextOperation {
  return {
    type: 'text',
    id: `text_${Date.now()}_${Math.random()}`,
    position,
    text,
    color,
    fontSize,
  };
}

export function addOperationToPage(page: WhiteboardPage, operation: DrawOperation): WhiteboardPage {
  return {
    ...page,
    operations: [...page.operations, operation],
  };
}

export function clearPage(page: WhiteboardPage): WhiteboardPage {
  return {
    ...page,
    operations: [],
  };
}

export function removeLastOperation(page: WhiteboardPage): WhiteboardPage {
  return {
    ...page,
    operations: page.operations.slice(0, -1),
  };
}
