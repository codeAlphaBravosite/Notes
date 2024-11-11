import { NotesStorage } from './notes-storage.js';
import { UndoRedoManager } from './undo-redo.js';

export class NotesApp {
  constructor() {
    this.storage = new NotesStorage();
    this.undoRedoManager = new UndoRedoManager();
    this.currentNote = null;
    this.saveTimeout = null;

    // DOM elements
    this.notesListView = document.getElementById('notes-list-view');
    this.notesList = document.getElementById('notes-list');
    this.editor = document.getElementById('editor');
    this.titleInput = document.getElementById('note-title');
    this.contentInput = document.getElementById('note-content');
    this.searchInput = document.getElementById('search');
    
    this.initializeEventListeners();
    this.renderNotesList();
  }

  initializeEventListeners() {
    // Button click handlers
    document.getElementById('new-note').addEventListener('click', () => this.createNote());
    document.getElementById('back-button').addEventListener('click', () => this.showNotesList());
    document.getElementById('delete-button').addEventListener('click', () => this.deleteCurrentNote());
    document.getElementById('undo-button').addEventListener('click', () => this.undo());
    document.getElementById('redo-button').addEventListener('click', () => this.redo());
    
    // Search handler
    this.searchInput.addEventListener('input', () => this.handleSearch());
    
    // Editor change handlers
    this.setupEditorHandlers();
    
    // Keyboard shortcuts
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

  setupEditorHandlers() {
    let timeout;
    const saveState = () => {
      if (this.currentNote) {
        const state = {
          title: this.titleInput.value,
          content: this.contentInput.value
        };
        this.undoRedoManager.saveState(state);
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
  }

  createNote() {
    const note = {
      id: Date.now(),
      title: '',
      content: '',
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    this.storage.addNote(note);
    this.showNote(note);
  }

  showNote(note) {
    this.currentNote = note;
    this.titleInput.value = note.title;
    this.contentInput.value = note.content;
    this.editor.classList.remove('hidden');
    this.notesListView.classList.add('hidden');
    this.contentInput.focus();
    
    this.undoRedoManager.reset({
      title: note.title,
      content: note.content
    });
    this.updateUndoRedoButtons();
  }

  showNotesList() {
    this.editor.classList.add('hidden');
    this.notesListView.classList.remove('hidden');
    this.currentNote = null;
    this.renderNotesList();
  }

  undo() {
    const previousState = this.undoRedoManager.undo();
    if (previousState) {
      this.titleInput.value = previousState.title;
      this.contentInput.value = previousState.content;
      this.autoSaveNote();
      this.updateUndoRedoButtons();
    }
  }

  redo() {
    const nextState = this.undoRedoManager.redo();
    if (nextState) {
      this.titleInput.value = nextState.title;
      this.contentInput.value = nextState.content;
      this.autoSaveNote();
      this.updateUndoRedoButtons();
    }
  }

  updateUndoRedoButtons() {
    document.getElementById('undo-button').disabled = !this.undoRedoManager.canUndo();
    document.getElementById('redo-button').disabled = !this.undoRedoManager.canRedo();
  }

  autoSaveNote() {
    if (!this.currentNote) return;
    
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.currentNote.title = this.titleInput.value;
      this.currentNote.content = this.contentInput.value;
      this.currentNote.updated = new Date().toISOString();
      this.storage.updateNote(this.currentNote);
    }, 300);
  }

  deleteCurrentNote() {
    if (!this.currentNote) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
      this.storage.deleteNote(this.currentNote.id);
      this.showNotesList();
    }
  }

  handleSearch() {
    this.renderNotesList();
  }

  renderNotesList() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const notes = this.storage.getNotes().filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
    
    this.notesList.innerHTML = notes.length ? 
      notes.map(note => this.createNoteCard(note)).join('') :
      '<div class="note-card"><p>No notes found</p></div>';
    
    this.notesList.querySelectorAll('.note-card').forEach(card => {
      card.addEventListener('click', () => {
        const note = this.storage.getNote(parseInt(card.dataset.id));
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
}