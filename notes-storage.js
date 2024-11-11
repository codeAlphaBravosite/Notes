export class NotesStorage {
  constructor() {
    this.notes = JSON.parse(localStorage.getItem('notes')) || [];
  }

  getNotes() {
    return [...this.notes];
  }

  getNote(id) {
    return this.notes.find(note => note.id === id);
  }

  addNote(note) {
    this.notes.unshift(note);
    this.save();
  }

  updateNote(updatedNote) {
    this.notes = this.notes.map(note => 
      note.id === updatedNote.id ? updatedNote : note
    );
    this.save();
  }

  deleteNote(id) {
    this.notes = this.notes.filter(note => note.id !== id);
    this.save();
  }

  save() {
    localStorage.setItem('notes', JSON.stringify(this.notes));
  }
}