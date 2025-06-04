# ToDo API Performance Optimizations - Microservices

This Node.js/Express microservice manages ToDo tasks with SQLite. 

## Prerequisites

- Node.js (v14+), npm
- Docker & Docker Compose
- k6 (for load testing)
- SQLite CLI (optional)

## Installation & Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/FAITH-ORAN/Micro-service-ToDo.git
   cd Micro-service-ToDo
   ```
2. Create the data directory:
   ```bash
   mkdir -p data
   ```
3. Build and start the API:
   ```bash
   docker-compose up --build
   ```

## Ports & Endpoints

When you run the stack (e.g. via Docker Compose), the following services will be available on these ports:

- **ToDo API (todo-api)**  
  - Host: `localhost:3000` → Container: `3000`  
  - All CRUD endpoints (e.g. `POST /api/todos`, `GET /api/todos`, `PATCH /api/todos/:id`) are served here.

- **Worker (todo‐api worker)**  
  - This container does not expose any external ports; it listens on the internal Redis queue and processes jobs.

- **Redis (redis)**  
  - Host: `localhost:6379` → Container: `6379`  
  - Used for idempotency key storage, caching, and BullMQ job queue.

- **Jaeger UI (jaeger-1)**  
  - Host: `localhost:16686` → Container: `16686`  
  - Traces sent via OpenTelemetry OTLP exporter can be viewed here (e.g. spans for incoming HTTP requests).

- **Jaeger OTLP (otlp collector)  
  - Host: `localhost:4318` → Container: `4318`  
  - OTLP HTTP/GRPC endpoint that the Node.js service exports traces to (configured in `otel.js`).

- **Prometheus (prometheus-1)**  
  - Host: `localhost:9090` → Container: `9090`  
  - Scrapes `/metrics` from the Node.js service and any other instrumented targets.

- **Grafana (grafana-1)**  
  - Host: `localhost:3001` → Container: `3000`  
  - Connect to Prometheus (`http://prometheus:9090`) as a data source and build dashboards (e.g. HTTP p95 latency, error rates).

### Example Usage

1. **API calls**  
   - Create a new ToDo:  
     ```bash
     curl -X POST http://localhost:3000/api/todos \
       -H "Content-Type: application/json" \
       -H "X-Idempotency-Key: your-unique-key" \
       -d '{"title":"Buy milk"}'
     ```
   - List all ToDos:  
     ```bash
     curl http://localhost:3000/api/todos
     ```

2. **View Traces in Jaeger**  
   - Open your browser to:  
     ```
     http://localhost:16686
     ```
   - Select service name `todo-api` to inspect incoming HTTP‐span details.

3. **View Metrics in Prometheus**  
   - Open your browser to:  
     ```
     http://localhost:9090
     ```
   - Use the “Metrics” search bar to query e.g. `http_request_duration_ms` or any custom metrics.

4. **View Dashboards in Grafana**  
   - Open your browser to:  
     ```
     http://localhost:3001
     ```
   - Log in (default: admin/admin) and add Prometheus (`http://prometheus:9090`) as a data source.  
   - Import or create dashboards to visualize API p95/p99 latency, error rates, Redis queue length, etc.
  
   
# Performance Optimizations 
# Now we demonstrate performance gains by adding a database index and enabling HTTP gzip compression, validated via k6 load tests.
## Configuration Scenarios

1. **Baseline (No Index, No Gzip)**

   - Comment out index creation in `src/models/todo.model.js`.
   - Remove `compression()` from `src/index.js`.
   - Rebuild (`docker-compose up --build`) and run k6.

2. **Index Only**

   - In `src/models/todo.model.js`, enable WAL and create composite index on `(done, id)`.
   - Restore `getTodos()` to use `WHERE done = 0 ORDER BY id DESC`.
   - Keep compression disabled.
   - Rebuild and run k6.

3. **Gzip Only**

   - Remove indexes from `src/models/todo.model.js`.
   - Enable `compression({ threshold: 0 })` in `src/index.js`.
   - Rebuild and run k6.

4. **Index + Gzip**
   - Re-enable composite index in `src/models/todo.model.js`.
   - Keep `compression()` in `src/index.js`.
   - Rebuild and run k6.

## Running the API

- Start containers:
  ```bash
  docker-compose up --build
  ```
- Test endpoints:
  ```bash
  curl -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -H "X-Idempotency-Key: key" -d '{"title":"Task"}'
  curl http://localhost:3000/api/todos
  curl -X PATCH http://localhost:3000/api/todos/1 -H "Content-Type: application/json" -d '{"completed":true}'
  ```

## Load Testing with k6

```bash
cd tests
k6 run load.test.js
```

- Measures `p(95)` latency for combined POST/GET under 50 VUs, 30s.

## Performance Results

1. Baseline:
   <img width="1085" alt="baseline" src="https://github.com/user-attachments/assets/243a8a9b-0dd2-4e31-99c8-1cc972327a7c" />


2. Index Only:
   <img width="1205" alt="avecIndex" src="https://github.com/user-attachments/assets/7b3a358f-0785-4c68-b45e-188fd52c9277" />


3. Gzip Only:
  <img width="1177" alt="GZIP" src="https://github.com/user-attachments/assets/90db9d73-3d68-4e97-8b42-a48d9c92ef24" />


4. Index + Gzip:
   <img width="1184" alt="indexgzip" src="https://github.com/user-attachments/assets/32ff6550-9764-424d-8ca6-f8f16989e3eb" />


```
Baseline:           p95 ≈ 3.3s
Index Only:         p95 ≈ 2.67s
Gzip Only:          p95 ≈ 1.52s
Index + Gzip:       p95 ≈ 807.15ms
```

## Global Project Structure looks like

```
Micro-service-ToDo/
├── docker-compose.yml
├── data/
│   └── todos.db
├── src/
│   ├── index.js
│   ├── models/todo.model.js
│   ├── controllers/todo.controller.js
│   └── routes/todos.js
├── tests/
│   └── load.test.js
└── package.json
```

## Note: to test HTTP Compression (Gzip) works correctly

- Verify with curl

  ```
    curl -H "Accept-Encoding: gzip" -I http://localhost:3000/api/todos
  ```

- you should see:

```
  HTTP/1.1 200 OK
  Content-Encoding: gzip
  Vary: Accept-Encoding
```

    •	The Content-Encoding: gzip header confirms responses are compressed.

# Winston for structured JSON logging
<img width="1109" alt="Winston Logs" src="https://github.com/user-attachments/assets/86466f20-ceec-4bbe-be31-ad5d6444a915" />

