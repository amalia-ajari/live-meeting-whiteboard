export type Role = 'trainer' | 'trainee';

export type ClassStatus = 'NOT_STARTED' | 'LIVE' | 'ENDED';

export interface Point {
  x: number;
  y: number;
}

export interface StrokeOperation {
  type: 'stroke';
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export interface TextOperation {
  type: 'text';
  id: string;
  position: Point;
  text: string;
  color: string;
  fontSize: number;
}

export type DrawOperation = StrokeOperation | TextOperation;

export interface WhiteboardPage {
  id: string;
  operations: DrawOperation[];
}

export interface WhiteboardState {
  pages: WhiteboardPage[];
  currentPageIndex: number;
  classStatus: ClassStatus;
}

export interface RealtimeMessage {
  type: 
    | 'stroke_start' 
    | 'stroke_move' 
    | 'stroke_end'
    | 'add_text'
    | 'clear_page'
    | 'add_page'
    | 'set_page'
    | 'undo'
    | 'redo'
    | 'state_snapshot'
    | 'request_state'
    | 'class_status_changed';
  payload: any;
  senderId: string;
  timestamp: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}
