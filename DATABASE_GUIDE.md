# Database Management Guide

This project uses a version-controlled migration system to manage Supabase database changes.

## Directory Structure
- `supabase/migrations/`: Contains chronological `.sql` files representing the database schema.
- `archive/sql/`: Contains legacy SQL scripts for reference.

## Current Migration Status
| Migration File | Description | Status |
|----------------|-------------|--------|
| `0001_initial_schema.sql` | Baseline schema (Tables, Policies, Storage, Data) | **Baseline** |

## How to add a new change
1. Create a new file in `supabase/migrations/` with a numbered prefix (e.g., `0002_add_discount_logic.sql`).
2. Write your SQL standard commands (CREATE TABLE, ALTER TABLE, etc.).
3. Copy the SQL content and run it in the **Supabase SQL Editor**.
4. Register the migration in the `_migrations` table:
   ```sql
   INSERT INTO _migrations (name) VALUES ('0002_add_discount_logic.sql');
   ```

## Why this system?
- **Consistency**: Ensures the local codebase matches the production database.
- **Predictability**: New developers (or AI assistants) know exactly what the schema looks like.
- **Rollback**: Provides a history of changes for debugging.

---
*Maintained by Antigravity*
