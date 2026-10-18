/**
 * api.js - Frontend API client for QuickNotes interacting with JSONPlaceholder
 */

const API_URL = 'https://jsonplaceholder.typicode.com/posts';

// DOM Elements
const loadBtn = document.getElementById('load-btn');
const submitBtn = document.getElementById('submit-btn');
const statusEl = document.getElementById('status');
const noteForm = document.getElementById('note-form');
const titleInput = document.getElementById('title-input');
const bodyInput = document.getElementById('body-input');
const notesList = document.getElementById('notes-list');

/**
 * Reusable async request wrapper that checks response.ok and throws errors.
 */
async function request(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}

/**
 * Helper to update status message with state styling
 */
function setStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
}

/**
 * Toggle UI loading state
 */
function setLoading(isLoading) {
    loadBtn.disabled = isLoading;
    submitBtn.disabled = isLoading;
    if (isLoading) {
        loadBtn.textContent = 'Loading...';
        submitBtn.textContent = 'Saving...';
    } else {
        loadBtn.textContent = 'Load notes';
        submitBtn.textContent = 'Create Note';
    }
}

/**
 * Render notes list or empty state
 */
function renderNotes(notes) {
    notesList.innerHTML = '';
    
    if (!notes || notes.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty-state';
        emptyLi.textContent = 'No notes available. Click "Load notes" or create a new note.';
        notesList.appendChild(emptyLi);
        return;
    }

    notes.forEach(note => {
        const li = document.createElement('li');
        li.className = 'note-item';
        li.dataset.id = note.id;

        const titleH3 = document.createElement('h3');
        titleH3.textContent = note.title;

        const bodyP = document.createElement('p');
        bodyP.textContent = note.body;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteNote(note.id, li));

        li.appendChild(titleH3);
        li.appendChild(bodyP);
        li.appendChild(deleteBtn);
        notesList.appendChild(li);
    });
}

/**
 * GET: Load 10 notes
 */
async function loadNotes() {
    setLoading(true);
    setStatus('Loading notes...', 'loading');
    notesList.innerHTML = '';

    try {
        const posts = await request(`${API_URL}?_limit=10`);
        renderNotes(posts);
        setStatus(`Loaded ${posts.length} notes from the server.`, 'success');
    } catch (error) {
        setStatus('Failed to load notes. Please check your network connection.', 'error');
        renderNotes([]);
    } finally {
        setLoading(false);
    }
}

/**
 * POST: Create a new note
 */
async function createNote(event) {
    event.preventDefault();
    
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    // Validation
    if (!title) {
        setStatus('Validation Error: Title is required.', 'error');
        titleInput.focus();
        return;
    }
    if (title.length > 100) {
        setStatus('Validation Error: Title cannot exceed 100 characters.', 'error');
        titleInput.focus();
        return;
    }

    setLoading(true);
    setStatus('Creating note...', 'loading');

    try {
        const newPost = { title, body, userId: 1 };
        const created = await request(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(newPost)
        });

        const li = document.createElement('li');
        li.className = 'note-item';
        const noteId = created.id || 101;
        li.dataset.id = noteId;

        const titleH3 = document.createElement('h3');
        titleH3.textContent = created.title;

        const bodyP = document.createElement('p');
        bodyP.textContent = created.body;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteNote(noteId, li));

        li.appendChild(titleH3);
        li.appendChild(bodyP);
        li.appendChild(deleteBtn);

        const emptyState = notesList.querySelector('.empty-state');
        if (emptyState) {
            notesList.innerHTML = '';
        }
        notesList.insertBefore(li, notesList.firstChild);

        setStatus(`Note created (status 201, id ${noteId}).`, 'success');
        noteForm.reset();
    } catch (error) {
        setStatus('Failed to create note. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * DELETE: Remove a note
 * Note on JSONPlaceholder: JSONPlaceholder simulates DELETE successfully, 
 * but does not permanently persist deletions on their backend server. We handle this 
 * sensibly by removing the element from the DOM immediately upon successful response.
 */
async function deleteNote(id, listItemEl) {
    const deleteBtn = listItemEl.querySelector('.delete-btn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    setStatus(`Deleting note ${id}...`, 'loading');

    try {
        await request(`${API_URL}/${id}`, { method: 'DELETE' });
        listItemEl.remove();
        setStatus(`Note ${id} deleted successfully (simulated API).`, 'success');

        if (notesList.children.length === 0) {
            renderNotes([]);
        }
    } catch (error) {
        setStatus(`Failed to delete note ${id}.`, 'error');
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete';
    }
}

// Event Listeners
loadBtn.addEventListener('click', loadNotes);
noteForm.addEventListener('submit', createNote);

// Initial empty state render on load
renderNotes([]);