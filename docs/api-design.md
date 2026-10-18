# QuickNotes API Design Document

## 1. REST Endpoints

| Method     | Path                 | Description                                             | Success Status   |
| :--------- | :------------------- | :------------------------------------------------------ | :--------------- |
| **GET**    | `/api/v1/notes`      | Retrieve paginated list of notes for authenticated user | `200 OK`         |
| **POST**   | `/api/v1/notes`      | Create a new note                                       | `201 Created`    |
| **GET**    | `/api/v1/notes/{id}` | Retrieve a single note by ID                            | `200 OK`         |
| **PUT**    | `/api/v1/notes/{id}` | Fully update an existing note                           | `200 OK`         |
| **DELETE** | `/api/v1/notes/{id}` | Delete a note by ID                                     | `204 No Content` |
| **GET**    | `/api/v1/tags`       | Retrieve all tags associated with the user              | `200 OK`         |

---

## 2. Request and Response Examples

### Creating a Note (`POST /api/v1/notes`)

**Request Headers:**

```http
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

**Request JSON Body:**

```json
{
  "title": "Quarterly Engineering Roadmap",
  "body": "Focus on database replication, Redis caching layer, and webhook reliability.",
  "tag_ids": [2, 5]
}
```

**Request JSON Body(201 Created):**

```json
{
  "status": "success",
  "code": 201,
  "data": {
    "id": 4821,
    "user_id": 104,
    "title": "Quarterly Engineering Roadmap",
    "body": "Focus on database replication, Redis caching layer, and webhook reliability.",
    "created_at": "2026-10-18T14:30:00Z",
    "updated_at": "2026-10-18T14:30:00Z",
    "tags": [
      { "id": 2, "name": "work" },
      { "id": 5, "name": "engineering" }
    ]
  }
}
```

### Listing Notes(GET /api/v1/notes?limit=2&offset=0)

**Request Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1Ni...
```

**Response JSON Body(200 OK):**

```json
{
  "status": "success",
  "code": 200,
  "pagination": {
    "total": 42,
    "limit": 2,
    "offset": 0
  },
  "data": [
    {
      "id": 4821,
      "user_id": 104,
      "title": "Quarterly Engineering Roadmap",
      "body": "Focus on database replication...",
      "created_at": "2026-10-18T14:30:00Z",
      "updated_at": "2026-10-18T14:30:00Z"
    },
    {
      "id": 4820,
      "user_id": 104,
      "title": "Grocery List",
      "body": "Milk, eggs, coffee beans, sourdough bread.",
      "created_at": "2026-10-17T09:15:00Z",
      "updated_at": "2026-10-17T09:15:00Z"
    }
  ]
}
```

### 3. Error Status Codes & Response Body

The API standardizes error responses using RFC 7807 problem details structure.

- **400 Bad Request:** Malformed JSON payload or validation failure (e.g., missing required title).
- **401 Unauthorized:** Missing or expired Bearer authentication token.
- **403 Forbidden:** Authenticated user attempts to access or modify a note belonging to another user.
- **404 Not Found:** Requested note or resource ID does not exist.
- **500 Internal Server Error:** Unexpected database exception or upstream service failure.

**Example Error Response Body(400 Bad Request):**

```json
{
  "error": {
    "code": 400,
    "status": "Bad Request",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "issue": "Field is required and must not exceed 100 characters."
      }
    ]
  }
}
```
