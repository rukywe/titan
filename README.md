# Fund Management API

A RESTful API for managing private market funds, investors, and their investments. Built with TypeScript, Express, Prisma, and PostgreSQL.

## Quick Start

### Prerequisites

- Docker and Docker Compose (make sure Docker is running before starting)
- Node.js 20+ (for local development)

### Option 1: Full Docker Setup (Recommended)

```bash
npm run dev:docker
```

This single command will:

- Start PostgreSQL database
- Run database migrations
- Seed sample data
- Start the API server with hot reload

Access the API at `http://localhost:3000`

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Make sure Docker is running, then start everything
npm run dev
```

This single command will:

- Copy `.env` file if it doesn't exist
- Clean up any existing processes
- Start PostgreSQL database
- Run database migrations
- Seed sample data
- Start the API server with hot reload

## System Architecture

The API uses a three-tier architecture. The routes handle HTTP requests, parse parameters, and delegate to services. Services contain the business logic - things like validating fund status before investments and handling ACID transactions. Prisma handles the database layer with type-safe queries and transaction support.

### Request Flow

```
Client Request → Express Middleware (Security, CORS)
    ↓
Routes → Validators (Zod schemas)
    ↓
Services → Business Logic & Transactions
    ↓
Prisma → Database
    ↓
Transformers → API Response (snake_case)
    ↓
Client Response
```

### Error Handling

Centralised error middleware catches everything and returns the right HTTP status codes:

- Custom errors (NotFoundError, BusinessRuleError) → Specific status codes
- Validation errors (Zod) → 400 Bad Request
- Database errors (Prisma) → Handled based on error codes
- Unexpected errors → 500 Internal Server Error with logging

## API Endpoints

All endpoints follow the API specification: <https://storage.googleapis.com/interview-api-doc-funds.wearebusy.engineering/index.html>

### Health Checks

- `GET    /health` - Application health check
- `GET    /health/db` - Database connection check

### Funds

- `GET    /funds` - List all funds
- `GET    /funds/:id` - Get fund by ID
- `POST   /funds` - Create a fund (supports optional Idempotency-Key header)
- `PUT    /funds` - Update a fund

### Investors

- `GET    /investors` - List all investors
- `POST   /investors` - Create an investor (supports optional Idempotency-Key header)

### Investments

- `GET    /funds/:fund_id/investments` - List investments for a fund
- `POST   /funds/:fund_id/investments` - Create an investment (supports optional Idempotency-Key header)

## Features

### ACID Compliance

Investment creation uses database transactions to ensure data integrity. When you create an investment, it atomically:

- Validates the fund exists
- Checks the fund isn't closed
- Validates the investor exists
- Creates the investment record

If any step fails, the entire transaction rolls back - no partial data gets created. Version fields are on all models for future optimistic locking if needed.

### Idempotency

POST requests support the `Idempotency-Key` header to prevent duplicate transactions. The system caches responses for 24 hours, returning the original response for duplicate requests with the same key.

### Input Validation

All inputs are validated with Zod schemas:

- Fund data: vintage year range, positive target size
- Investor data: email format, valid investor types
- Investment data: positive amounts, valid dates
- All UUIDs checked for correct format

### Error Handling

Centralised error handling with appropriate HTTP status codes:

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (unique constraints, business rules)
- `500` - Internal Server Error

### Security

- Helmet for security headers
- CORS configuration for frontend compatibility
- Environment variable validation
- Structured logging with Pino

### Testing

Full test coverage with:

- Unit tests for services, validators, and transformers
- Integration tests for API endpoints and critical workflows
- Tests for idempotency, business rules, and error handling

## Database Design

### Schema Architecture

The schema uses UUIDs for primary keys, which provide global uniqueness and improve security. Database columns use snake_case to match the API specification, while application code uses camelCase via Prisma's `@map` directive. Enums ensure type safety at both the database and application levels, and Decimal(15,2) is used for all monetary values to ensure financial accuracy. Version fields on all models enable optimistic locking to prevent race conditions on concurrent updates.

### Key Design Decisions

**Enums for Status Fields**

Used PostgreSQL enums for `FundStatus` and `InvestorType` to provide type safety at both the database and application levels. The `@map("Family Office")` directive handles the space required by the API specification.

**Optimistic Locking**

Version fields are present on all models for potential optimistic locking implementation. The mechanism would work as follows:

- User A reads fund (version 1)
- User B reads fund (version 1)
- User A updates → version becomes 2
- User B updates → version mismatch → 409 Conflict
- User B must re-read and retry

Not implemented in this version, but infrastructure in place for future implementation if needed.

**Indexing Strategy**

Indexes added for:

- Foreign keys (`investor_id`, `fund_id`) for join performance
- Common filter fields (`status`, `investor_type`, `vintage_year`)
- Sort fields (`created_at`, `investment_date`) for pagination
- Email via `@unique` constraint for fast lookups

**Multiple Investments per Investor/Fund**

No unique constraint on `[investor_id, fund_id]` to support real-world scenarios:

- Staged capital commitments
- Follow-on investments
- Multiple capital calls over a fund's lifecycle

**Cascade Deletes**

Foreign key relationships include cascade deletes. If a fund or investor is deleted, all associated investments are automatically removed, maintaining referential integrity.

**Field Mapping Strategy**

The database uses snake_case to match the API specification (e.g., `vintage_year`), while the application code uses camelCase (e.g., `vintageYear`). Transformers handle the conversion for API responses.

### Database Schema Management

**Development Approach**

For development, I chose prisma db push over migrations because:

- Rapid iteration without migration file management
- Simpler setup for reviewers
- Faster development focused on API features
- Clean repository without migration clutter

**Production Strategy**

For production, proper migrations would be used:

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy
```

This provides version control, rollback capability, and team collaboration benefits.

## Environment Variables

Create a `.env` file from the example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fund_management
PORT=3000
NODE_ENV=development
```

## Testing

```bash
# Run all tests (automatically sets up database and tables)
npm test
```

### Test Coverage

- **23 integration tests** covering all endpoints and error paths
- **33 unit tests** for services, validators, and transformers
- **100% coverage** of critical business rules (closed fund, idempotency, ACID)

## Available Scripts

```bash
npm run dev           # Local dev with hot reload
npm run dev:docker    # Full Docker setup
npm start             # Production build
npm run build         # Build for production
npm run setup         # Setup database and seed data
npm run clean         # Clean ports and stop containers
npm test              # Run tests
npm run db:studio     # Open Prisma Studio
```

## Assumptions and Design Decisions

### Assumptions Made

1. **Multiple investments per investor/fund pair**: Supports real-world private markets scenarios like staged commitments
2. **No authentication required**: Simplified for reviewers. In production, would add JWT with role-based access control (investor, fund manager, admin roles) since financial transaction security is paramount
3. **Idempotency-Key is optional**: Currently optional for development convenience. Would be required in production
4. **Single currency (USD)**: All amounts in USD. Production would need multi-currency support
5. **Hard deletes**: Using cascade deletes. Production would implement soft deletes with audit trails
6. **No unique constraint on funds**: For demonstration purposes, multiple funds with the same name and vintage year can be created. In production, would add `@@unique([name, vintageYear])` constraint at the database level
7. **No pagination in v1**: API spec doesn't require it. Would add offset-based pagination first (simpler), then cursor-based for scale. Implemented strategic indexes to support both

### Trade-offs

1. **`prisma db push` over migrations**: Faster to iterate, but production needs proper migrations for rollbacks and team collaboration
2. **No caching**: Not needed at this scale. Would add Redis if serving high traffic
3. **App-layer validation only**: Better error messages for users. Database constraints would provide defense-in-depth
4. **No authentication**: Simplified for reviewers. Production would need JWT with role-based access
5. **Idempotency optional**: Handy for testing. Production should enforce it for all POST endpoints
6. **Express over serverless**: Traditional server architecture makes this easy to run locally. Reviewers can test without AWS accounts or vendor setup. Lambda would be more cost-effective for variable traffic in production

## Production Considerations

If deploying to production, I would add:

### Security

- JWT-based authentication with role-based access control (investor, fund manager, admin roles)
- API Gateway for request throttling and rate limiting (e.g., AWS API Gateway) to prevent abuse and DoS-style attacks
- API key management for service-to-service communication
- HTTPS/TLS enforcement

### Data Integrity

- **Soft deletes** with `deleted_at` timestamps → preserves historical fund and investment records for audit/regulatory needs
- **Audit log table** to track create/update/delete actions (e.g. who created a fund, who approved an investment) for compliance
- **Database-level CHECK constraints** (via raw SQL) → e.g. enforce positive amounts, valid vintage year ranges, prevent negative target sizes
- **Cross-entity business validation** in the service layer → e.g. total committed investments should never exceed a fund’s `target_size_usd`
- **Optimistic locking** (via version fields) available to prevent race conditions in concurrent updates

### Performance

- Redis caching for frequently accessed or read-heavy data (e.g. fund lists, investor lookups)
- Composite indexes tuned to common query patterns (e.g. `fund_id + status` for fast investment lookups)
- Pagination will start with offset-based (page + limit), which is simple and fine for smaller datasets. For scale, we’d later switch to cursor-based (using created_at or IDs as cursors) for stable, efficient pagination

### Observability

- Structured logging with log aggregation
- Metrics collection (Prometheus, Grafana)
- Application Performance Monitoring (Datadog) for tracing slow queries and bottlenecks

### Scalability

- Horizontal scaling with stateless API design
- Load balancing and connection pooling ([load balancing strategies](https://blog.stackademic.com/mastering-load-balancing-in-node-js-techniques-and-best-practices-f9121dbef374), [scaling patterns](https://blog.stackademic.com/scaling-node-js-like-a-chef-ee9e12c55c2f))
- Microservices architecture if needed

**Alternative Architecture: Serverless**

I could have built this as serverless functions (AWS Lambda, etc.) which would handle the variable traffic nicely:

- Each endpoint as a separate function for granular scaling
- Auto-scaling based on demand with zero idle costs
- Managed infrastructure reduces operational overhead
- Connection pooling with Prisma Data Proxy or PgBouncer
- A spike in /investments traffic wouldn’t affect /funds throughput

I went with a traditional server architecture for this take-home because it's easier for reviewers to run locally without AWS accounts or vendor setup. Plus, it demonstrates Docker/container skills. For a production system with unpredictable traffic, serverless would be the smarter choice. serverless introduces cold start latency and more complex debugging, but for highly variable workloads it can be cost-efficient.

## Postman Collection

A comprehensive Postman collection (`postman_collection.json`) is included with:

- All 8 API endpoints configured
- Example requests with test data
- Automatic test assertions for status codes and response structure
- Validation test cases for error scenarios
- Collection variables for easy testing

Import the collection into Postman to quickly test all endpoints.
