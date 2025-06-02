# ToDo API Performance Optimizations

This Node.js/Express microservice manages ToDo tasks with SQLite. We demonstrate performance gains by adding a database index and enabling HTTP gzip compression, validated via k6 load tests.

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
   docker-compose up --build -d
   ```

## Configuration Scenarios

1. **Baseline (No Index, No Gzip)**

   - Comment out index creation in `src/models/todo.model.js`.
   - Remove `compression()` from `src/index.js`.
   - Rebuild (`docker-compose up --build -d`) and run k6.

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
  docker-compose up --build -d
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
   ![alt text](<Baseline (no index, no gzip).png>)

2. Index Only:
   ![alt text](<After SQLite index.png>)

3. Gzip Only:
   ![alt text](<After gzip compression.png>)

4. Index + Gzip:
   ![alt text](<After index + gzip.png>)

```
Baseline:           p95 ≈ 4.83s
Index Only:         p95 ≈ 30.76ms
Gzip Only:          p95 ≈ 22.34ms
Index + Gzip:       p95 ≈ 3.58s
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
