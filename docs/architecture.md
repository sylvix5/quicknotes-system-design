# QuickNotes Architecture & Scaling Plan

## 1. Requirements

### Functional Requirements

- User registration, authentication, and session management.
- CRUD operations for notes (Create, Read, Update, Delete).
- Tagging and categorizing notes.
- Fast full-text search and chronological feed retrieval.

### Non-Functional Requirements

- **High Availability**: 99.9% uptime SLA.
- **Low Latency**: Read feed response times under 50ms (p99).
- **Scalability**: Support 1,000,000 active users with smooth horizontal scaling.
- **Security**: TLS encryption in transit, hashed passwords (bcrypt), and role-based access control.

---

## 2. Load Estimates (1 Million Active Users)

- **Assumptions**: 1,000,000 Daily Active Users (DAU). Each user performs 50 read requests (listing notes / viewing details) and 5 write requests (creating/updating notes) per day. Standard 100,000 seconds per day.
- **Reads Per Second**:
  $$\frac{1,000,000 \text{ users} \times 50 \text{ reads/day}}{100,000 \text{ seconds}} = \mathbf{500 \text{ reads/sec}}$$
- **Writes Per Second**:
  $$\frac{1,000,000 \text{ users} \times 5 \text{ writes/day}}{100,000 \text{ seconds}} = \mathbf{50 \text{ writes/sec}}$$
- **Storage Per Year**: Assuming an average note size of 2 KB (including title, body, and metadata), with $5,000,000$ writes/day:
  $$\text{Daily Storage} = 5,000,000 \times 2 \text{ KB} = 10,000,000 \text{ KB} \approx 10 \text{ GB/day}$$
  $$\text{Yearly Storage} = 10 \text{ GB/day} \times 365 = \mathbf{3.65 \text{ TB/year}}$$

---

## 3. Architecture Diagram

```text
                  [ Client (Web / Mobile) ]
                              │
                              ▼
                        [ Cloud DNS ]
                              │
                              ▼
                     [ CDN (Cloudflare) ]
                              │
                              ▼
                  [ Load Balancer (Nginx / ALB) ]
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
[ App Server 1 (Node.js) ]                [ App Server 2 (Node.js) ]
         │                                         │
         ├───────────────────┬─────────────────────┤
         ▼                   ▼                     ▼
  [ Redis Cache ]     [ Primary DB ]      [ Message Queue (RabbitMQ) ]
                             │                              │
                     [ Read Replica ]              [ Background Worker ]

```

## 4. Component Explanations

1. Cloud DNS: Translates human-readable domain names into IP addresses and routes clients to the nearest edge location.

2. CDN: Caches static assets and public responses at edge nodes globally to reduce latency and origin server load.

3. Load Balancer: Distributes incoming HTTP/HTTPS traffic evenly across multiple application servers to ensure high availability and prevent overload.

4. App Servers: Stateless Node.js microservices that process business logic, handle authentication requests, and coordinate database queries.

5. Redis Cache: In-memory caching layer that stores frequent read queries, active user sessions, and rate-limiting counters for sub-millisecond retrieval.

6. Primary Database: PostgreSQL instance responsible for handling all write transactions (inserts, updates, deletes) to guarantee ACID consistency.

7. Database Read Replica: Synchronized read-only copy of the primary database that offloads heavy read queries (such as listing user feeds).

8. Message Queue: Asynchronous buffer queue that offloads non-blocking background tasks (e.g., email notifications, analytics processing).

9. Background Worker: Worker service that polls the message queue and executes background tasks asynchronously without delaying HTTP responses.

## 5. Step-by-Step Request Flow

**Flow 1: GET /api/v1/notes (Listing Notes)**

1. Client Request: The client sends an HTTP GET request to https://api.quicknotes.com/api/v1/notes.

2. DNS & CDN: DNS routes the request to the nearest edge CDN node; if cached, it returns immediately. Otherwise, it hits the Load Balancer.

3. Load Balancer: The Load Balancer forwards the request to an available App Server.

4. Cache Check: The App Server queries the Redis Cache for the user's cached notes list. If a cache hit occurs, it returns the payload instantly.

5. Database Read Replica: On a cache miss, the App Server queries the Database Read Replica, formats the JSON response, populates the Redis cache, and returns the notes list (200 OK) to the client.

**Flow 2: POST /api/v1/notes (Creating a Note)**

1. Client Request: The client sends an HTTP POST request with the note title and body to the Load Balancer.

2. Load Balancer: Forwards the POST request to an App Server.

3. Validation & Auth: The App Server validates the JWT token and input payload (title max 100 characters).

4. Primary Database Write: The App Server executes an INSERT statement on the Primary Database.

5. Cache Invalidation & Response: The App Server invalidates the user's stale Redis cache entry, pushes an analytics/notification event to the Message Queue, and returns 201 Created with the new note payload.

## 6. Trade-offs & Single Points of Failure (SPOF) Mitigation

**Trade-offs**

- **Read Scalability vs. Data Freshness**: Routing read traffic to read replicas introduces a slight replication lag (milliseconds). We accept this trade-off because fast note feed loading is prioritized over instantaneous cross-device sync.

- **Cache Complexity vs. Database Load**: Implementing Redis caching reduces database read load by 80%, but adds architectural complexity regarding cache invalidation bugs when notes are updated or deleted.

**Single Points of Failure**

- **Load Balancer**: Deployed in an active-active cluster behind DNS round-robin health checks.
- **App Servers:**: Horizontally autoscaled across multiple availability zones (AZs) behind the load balancer so the failure of one server has zero impact.
