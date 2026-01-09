import { WhiteboardPage } from '../types';

export class HistoryManager {
  private undoStack: WhiteboardPage[][] = [];
  private redoStack: WhiteboardPage[][] = [];
  private maxHistory = 50;

  pushState(pages: WhiteboardPage[]) {
    // Deep clone pages
    const snapshot = JSON.parse(JSON.stringify(pages));
    this.undoStack.push(snapshot);
    
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    
    // Clear redo stack on new action
    this.redoStack = [];
  }

  undo(currentPages: WhiteboardPage[]): WhiteboardPage[] | null {
    if (this.undoStack.length === 0) return null;

    // Save current state to redo
    this.redoStack.push(JSON.parse(JSON.stringify(currentPages)));
    
    // Pop from undo stack
    return this.undoStack.pop()!;
  }

  redo(): WhiteboardPage[] | null {
    if (this.redoStack.length === 0) return null;
    
    return this.redoStack.pop()!;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
