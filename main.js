class NotesApp {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem('notes')) || [];
    this.currentNote = null;
    this.saveTimeout = null;
    this.undoStack = [];
    this.redoStack = [];
    
    // DOM elements
    this.notesListView = document.getElementById('notes-list-view');
    this.notesList = document.getElementById('notes-list');
    this.editor = document.getElementById('editor');
    this.titleInput = document.getElementById('note-title');
    this.contentInput = document.getElementById('note-content');
    this.searchInput = document.getElementById('search');
    this.undoButton = document.getElementById('undo-button');
    this.redoButton = document.getElementById('redo-button');
    
    // Bind event listeners
    document.getElementById('new-note').addEventListener('click', () => this.createNote());
    document.getElementById('back-button').addEventListener('click', () => this.showNotesList());
    document.getElementById('delete-button').addEventListener('click', () => this.deleteCurrentNote());
    this.undoButton.addEventListener('click', () => this.undo());
    this.redoButton.addEventListener('click', () => this.redo());
    this.searchInput.addEventListener('input', () => this.handleSearch());
    
    // Setup editor change tracking
    this.setupEditorHandlers();
    
    // Mobile-specific handlers
    this.setupMobileHandlers();
    
    // Initial render
    this.renderNotesList();
    this.updateUndoRedoButtons();
  }
  
  setupEditorHandlers() {
    let timeout;
    const saveState = () => {
      if (this.currentNote) {
        const state = {
          title: this.titleInput.value,
          content: this.contentInput.value
        };
        this.undoStack.push(state);
        this.redoStack = [];
        this.updateUndoRedoButtons();
      }
    };

    const debouncedSaveState = () => {
      clearTimeout(timeout);
      timeout = setTimeout(saveState, 300);
    };

    this.titleInput.addEventListener('input', () => {
      this.autoSaveNote();
      debouncedSaveState();
    });

    this.contentInput.addEventListener('input', () => {
      this.autoSaveNote();
      debouncedSaveState();
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      }
    });
  }
  
  setupMobileHandlers() {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    }
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.body.classList.add('standalone');
    }
  }
  
  createNote() {
    const note = {
      id: Date.now(),
      title: '',
      content: '',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    this.notes.unshift(note);
    this.saveNotes();
    this.showNote(note);
  }
  
  showNote(note) {
    this.currentNote = note;
    this.titleInput.value = note.title;
    this.contentInput.value = note.content;
    this.editor.classList.remove('hidden');
    this.notesListView.classList.add('hidden');
    this.titleInput.focus();
    
    // Reset undo/redo stacks
    this.undoStack = [{
      title: note.title,
      content: note.content
    }];
    this.redoStack = [];
    this.updateUndoRedoButtons();
  }
  
  showNotesList() {
    this.editor.classList.add('hidden');
    this.notesListView.classList.remove('hidden');
    this.currentNote = null;
    this.renderNotesList();
  }
  
  undo() {
    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop();
      this.redoStack.push(currentState);
      const previousState = this.undoStack[this.undoStack.length - 1];
      
      this.titleInput.value = previousState.title;
      this.contentInput.value = previousState.content;
      this.autoSaveNote();
      this.updateUndoRedoButtons();
    }
  }
  
  redo() {
    if (this.redoStack.length > 0) {
      const nextState = this.redoStack.pop();
      this.undoStack.push(nextState);
      
      this.titleInput.value = nextState.title;
      this.contentInput.value = nextState.content;
      this.autoSaveNote();
      this.updateUndoRedoButtons();
    }
  }
  
  updateUndoRedoButtons() {
    this.undoButton.disabled = this.undoStack.length <= 1;
    this.redoButton.disabled = this.redoStack.length === 0;
  }
  
  autoSaveNote() {
    if (!this.currentNote) return;
    
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.currentNote.title = this.titleInput.value;
      this.currentNote.content = this.contentInput.value;
      this.currentNote.updated = new Date().toISOString();
      this.saveNotes();
    }, 300);
  }
  
  deleteCurrentNote() {
    if (!this.currentNote) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      this.notes = this.notes.filter(note => note.id !== this.currentNote.id);
      this.saveNotes();
      this.showNotesList();
    }
  }
  
  handleSearch() {
    const searchTerm = this.searchInput.value.toLowerCase();
    this.renderNotesList(searchTerm);
  }
  
  renderNotesList(searchTerm = '') {
    const filteredNotes = this.notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
    
    this.notesList.innerHTML = filteredNotes.length ? 
      filteredNotes.map(note => this.createNoteCard(note)).join('') :
      '<div class="note-card"><p>No notes found</p></div>';
    
    document.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const note = this.notes.find(n => n.id === parseInt(card.dataset.id));
        if (note) this.showNote(note);
      });
    });
  }
  
  createNoteCard(note) {
    const date = new Date(note.updated).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return `
      <div class="note-card" data-id="${note.id}">
        <h2>${note.title || 'Untitled'}</h2>
        <p>${note.content || 'No content'}</p>
        <div class="note-meta">Last updated: ${date}</div>
      </div>
    `;
  }
  
  saveNotes() {
    localStorage.setItem('notes', JSON.stringify(this.notes));
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new NotesApp();
});