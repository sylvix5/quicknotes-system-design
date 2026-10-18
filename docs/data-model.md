# QuickNotes Data Model

## 1. Entities & Columns

### `users`

Stores registered user profile data and authentication credentials.

- `user_id` (INTEGER, PK, AUTOINCREMENT)
- `username` (VARCHAR(50), NOT NULL, UNIQUE)
- `email` (VARCHAR(100), NOT NULL, UNIQUE)
- `password_hash` (VARCHAR(255), NOT NULL)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### `notes`

Stores the core note content created by users.

- `note_id` (INTEGER, PK, AUTOINCREMENT)
- `user_id` (INTEGER, NOT NULL, FK -> `users(user_id)`)
- `title` (VARCHAR(100), NOT NULL)
- `body` (TEXT)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

### `tags`

Stores categorical labels that users can assign to notes.

- `tag_id` (INTEGER, PK, AUTOINCREMENT)
- `user_id` (INTEGER, NOT NULL, FK -> `users(user_id)`)
- `name` (VARCHAR(30), NOT NULL)

### `note_tags`

Junction table facilitating the many-to-many relationship between notes and tags.

- `note_id` (INTEGER, NOT NULL, FK -> `notes(note_id)`)
- `tag_id` (INTEGER, NOT NULL, FK -> `tags(tag_id)`)
- **Primary Key**: Composite primary key (`note_id`, `tag_id`)

---

## 2. Explanation of Relationships

- **Users to Notes (One-to-Many)**: One user can create many notes, but each note belongs to exactly one user (`user_id` foreign key in `notes`).
- **Users to Tags (One-to-Many)**: One user can define many custom tags, but each tag belongs to one user.
- **Notes and Tags (Many-to-Many)**: A single note can possess multiple tags (e.g., `#work`, `#urgent`), and a single tag can be applied to many different notes. Relational databases cannot represent many-to-many direct links, hence the **`note_tags` junction table** is required to bridge them.

---

## 3. SQL `CREATE TABLE` Statements

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    note_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE tags (
    tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(30) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_tag UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);
```

## 4. Example SQL Queries

**Query 1: Get all notes for a specific user ordered by creation date**

```sql
SELECT note_id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;

```

**Query 2: Retrieve all tags associated with a specific note (JOIN query)**

```sql
SELECT n.title, t.name AS tag_name
FROM notes n
JOIN note_tags nt ON n.note_id = nt.note_id
JOIN tags t ON nt.tag_id = t.tag_id
WHERE n.note_id = 4821;

```

**Query 3: Count the number of notes per user**

```sql
SELECT u.username, COUNT(n.note_id) AS total_notes
FROM users u
LEFT JOIN notes n ON u.user_id = n.user_id
GROUP BY u.user_id, u.username;
```

## 5. Indexing Strategy

- **Index to Add**: CREATE INDEX idx_notes_user_created ON notes(user_id, created_at DESC);
- **Reason**: The most frequent operation in QuickNotes is listing a user's notes ordered chronologically. Indexing user_id alongside created_at allows the database engine to perform lightning-fast index range scans rather than full table scans when executing SELECT queries filtered by user and sorted by time.

## 6. SQL vs. NoSQL Justification

For QuickNotes, SQL (Relational Database) is the optimal architectural choice. Notes applications require strict data integrity, foreign key constraints (ensuring orphaned note-tag mappings cannot exist), ACID transactional guarantees, and relational querying (such as filtering notes by tags and sorting by user ownership). While NoSQL document stores offer flexible schemas, they struggle with complex multi-table joins and atomicity across relationships. A relational database provides robust consistency and efficient querying for structured user data and note metadata.
