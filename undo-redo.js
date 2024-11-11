export class UndoRedoManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  reset(initialState) {
    this.undoStack = [initialState];
    this.redoStack = [];
  }

  saveState(state) {
    this.undoStack.push(state);
    this.redoStack = [];
  }

  undo() {
    if (!this.canUndo()) return null;
    
    const currentState = this.undoStack.pop();
    const previousState = this.undoStack[this.undoStack.length - 1];
    
    if (currentState) {
      this.redoStack.push(currentState);
    }
    
    return previousState;
  }

  redo() {
    if (!this.canRedo()) return null;
    
    const nextState = this.redoStack.pop();
    if (nextState) {
      this.undoStack.push(nextState);
    }
    
    return nextState;
  }

  canUndo() {
    return this.undoStack.length > 1;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }
}