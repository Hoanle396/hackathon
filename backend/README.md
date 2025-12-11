# Backend

NestJS backend cho AI Code Reviewer.

## Development

```bash
# Install dependencies
npm install

# Setup database
# 1. Create PostgreSQL database: ai_code_reviewer
# 2. Copy .env.example to .env
# 3. Update database credentials in .env

# Run migrations (if any)
npm run migration:run

# Start dev server
npm run start:dev
```

Server runs at: http://localhost:3001

## Build

```bash
npm run build
npm run start:prod
```

## Database Migrations

```bash
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## Testing

```bash
npm run test
npm run test:cov
```
