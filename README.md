# postgres-kit

A lightweight PostgreSQL database toolkit for TypeScript and Node.js, built on top of [`pg`](https://www.npmjs.com/package/pg).

`postgres-kit` provides a simple `Executor` abstraction for SQL execution, querying, transactions, scalar queries, batch execution, parameter handling, result mapping, and boolean conversion.

It stays close to SQL and PostgreSQL rather than trying to become an ORM.

```text
Application
    │
    ▼
DB / Transaction interfaces
    │
    ├── PoolManager
    │      └── pg.Pool
    │
    └── PoolClientManager
           └── pg.PoolClient
    │
    ▼
Low-level functions
    ├── execute()
    ├── query()
    ├── queryOne()
    ├── executeScalar()
    ├── count()
    └── executeBatch()
    │
    ▼
   pg
```

In the [`core-ts`](https://github.com/core-ts) ecosystem, [`postgres-kit`](https://www.npmjs.com/package/postgres-kit) is the PostgreSQL adapter. It provides execution utilities, repositories, batch processing, stream processing, health checks, and PostgreSQL-specific implementations while reusing the database-independent abstractions from [**sql-core**](https://www.npmjs.com/package/sql-core).

### Example
- [admin](https://github.com/fintech-product/admin): SSR Admin Application
- [admin-service](https://github.com/fintech-product/admin-service): Admin Backend Microservice
- [sql-simple-modular-sample](https://github.com/source-code-template/sql-simple-modular-sample): RESI API with express and postgres

## Features

* PostgreSQL connection pool management
* Simple `Executor` abstraction
* Parameterized SQL queries
  * PostgreSQL parameter placeholders (`$1`, `$2`, ...)
* Result field mapping
  * Boolean value conversion
* Transaction support
* `execute()` for INSERT, UPDATE, DELETE, and other commands
* `query()` for multiple rows
* `queryOne()` for a single row
* `executeScalar()` for scalar queries such as `COUNT`, `MAX`, and `MIN`
* `count()` convenience method
* Batch SQL execution
* Transactional batch execution
* JSON parameter handling
* Duplicate-key error normalization

## Installation

```bash
npm install postgres-kit
```

## Architecture

The main abstraction is `Executor`:

```text
                    Executor
                       │
             ┌─────────┴─────────┐
             │                   │
            DB              Transaction
             │                   │
        PoolManager       PoolClientManager
             │                   │
           Pool              PoolClient
```

* `Executor` defines common database operations.
* `DB` extends `Executor` and provides transaction creation.
* `Transaction` extends `Executor` and provides `commit()` and `rollback()`.
* `PoolManager` implements `DB` and manages a PostgreSQL `Pool`.
* `PoolClientManager` implements `Transaction` and manages a PostgreSQL `PoolClient`.

This keeps application and repository code independent from the details of `pg.Pool` and `pg.PoolClient`.

## Creating a Pool

```ts
import { createPool, PoolManager } from "postgres-kit"

const pool = createPool({
    host: "localhost",
    port: 5432,
    database: "mydb",
    user: "postgres",
    password: "password",
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000
})

const db = new PoolManager(pool)
```

A connection string can also be provided:

```ts
const pool = createPool({
    connectionString: process.env.DATABASE_URL
})

const db = new PoolManager(pool)
```

## Executor

The `Executor` interface provides the common database API:

```ts
interface Executor {
  driver: string
  param(i: number): string
  execute(sql: string, args?: any[], ctx?: any): Promise<number>
  executeBatch(statements: Statement[], firstSuccess?: boolean, ctx?: any): Promise<number>
  query<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T[]>
  queryOne<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T | null>
  executeScalar<T>(sql: string, args?: any[], ctx?: any): Promise<T | null>
  count(sql: string, args?: any[], ctx?: any): Promise<number>
}
```

Repositories can therefore depend on `Executor` instead of directly depending on `pg`.

## SQL Parameters

PostgreSQL uses numbered parameters:

```ts
db.param(1) // "$1"
db.param(2) // "$2"
db.param(3) // "$3"
```

Example:

```ts
const user = await db.queryOne<User>(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [userId]
)
```

Using parameters instead of string interpolation keeps values separate from SQL.

## Execute

Use `execute()` for commands where you need the affected row count.

```ts
const affected = await db.execute(
    `UPDATE users SET name = $1 WHERE id = $2`,
    ["John", 100]
)
```

The result is the number of affected rows.

For example:

```ts
if (affected > 0) {
    console.log("User updated")
}
```

## Query

Use `query()` when multiple rows are expected.

```ts
interface User {
    id: number
    name: string
    email: string
}

const users = await db.query<User>(
    `SELECT id, name, email FROM users ORDER BY id`
)
```

The result is:

```ts
User[]
```

## Query One

Use `queryOne()` when only one record is needed.

```ts
const user = await db.queryOne<User>(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [userId]
)
```

The result is:

```ts
User | null
```

If no record exists, `queryOne()` returns `null`.


## Result Mapping
There are two important result transformations:

```
query()
  │
  ▼
handleResults()
  ├── mapArray()
  └── handleBool()
```

### Field mapping
`StringMap`:
```ts
export interface StringMap {
    [key: string]: string
}
```

allows:
```
database column → object property
```
For example:
```
user_id → userId
first_name → firstName
```
`mapArray()` performs this transformation.

This is particularly useful if SQL/database naming conventions differ from TypeScript conventions.

### Boolean normalization

`handleBool()` is another useful compatibility feature.

It recognizes:
```
true
1
t
y
on
```
as `true`; otherwise it converts the value to `false`.

It also supports custom true values:
```
field.true
```

So you can conceptually map:
```
"Y" → true
"N" → false
```

This makes sense in a database abstraction layer because different databases and legacy schemas frequently represent boolean values differently.

#### Example

For example, suppose PostgreSQL returns:

```text
user_id
first_name
last_name
```

A mapping can be supplied:

```ts
const users = await db.query<User>(
    "SELECT user_id, first_name, last_name FROM users",
    undefined,
    {
        user_id: "id",
        first_name: "firstName",
        last_name: "lastName"
    }
)
```

The result becomes:

```ts
{
    id: 1,
    firstName: "John",
    lastName: "Smith"
}
```

The mapping is applied by `mapArray()`.

## Execute Scalar

`executeScalar()` is intended for queries that return a single scalar value.

It is particularly useful for queries such as:

```sql
SELECT COUNT(*)
SELECT MAX(id)
SELECT MIN(id)
```

Example:

```ts
const maxId = await db.executeScalar<number>(
    "SELECT MAX(id) FROM users"
)
```

Another example:

```ts
const total = await db.executeScalar<number>(
    "SELECT COUNT(*) FROM users"
)
```

The result type is:

```ts
T | null
```

The method returns the first column of the first returned row.

## Count

For count queries, `count()` provides a convenient numeric API:

```ts
const total = await db.count(
    "SELECT COUNT(*) FROM users"
)
```

The result is always a `number`.

If the scalar result is `null`, `count()` returns `0`.

```ts
const total: number = await db.count(
    "SELECT COUNT(*) FROM users"
)
```

## Transactions
Transaction creation is straightforward:

```
pool.connect()
      │
      ▼
    BEGIN
      │
      ▼
PoolClientManager
      │
      ├── execute
      ├── query
      ├── ...
      ├── commit
      └── rollback
```
`beginTransaction()` obtains a dedicated `PoolClient`, executes `BEGIN`, and wraps it in `PoolClientManager`.

The intended application pattern is therefore something like:

```ts
const tx = await db.beginTransaction()

try {
    await tx.execute(...)
    await tx.execute(...)
    await tx.commit()
} catch (e) {
    await tx.rollback()
    throw e
}
```

Create a transaction with `beginTransaction()`:

```ts
const tx = await db.beginTransaction()

try {
    await tx.execute(
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
        [100, sourceAccountId]
    )

    await tx.execute(
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        [100, destinationAccountId]
    )

    await tx.commit()
} catch (err) {
    await tx.rollback()
    throw err
}
```

A transaction implements the same `Executor` interface, so queries and commands can be executed through `tx` exactly like they are through `db`.

```text
DB
 │
 └── beginTransaction()
          │
          ▼
     Transaction
          │
          ├── execute()
          ├── query()
          ├── queryOne()
          ├── executeScalar()
          ├── count()
          ├── commit()
          └── rollback()
```

## Batch Execution

There are actually two batch implementations:
```
executeBatch()
    │
    └── executeBatchWithClientTx()

executeBatchWithClient()
```
`executeBatch()` obtains a client and creates a transaction, then executes multiple SQL statements.
```
Pool
 │
 └── connect()
      │
      ▼
   BEGIN
      │
      ├── statement 1
      ├── statement 2
      ├── statement 3
      │
      ▼
   COMMIT
```
This is a good design because multiple statements should generally execute atomically when batch semantics imply a transaction

For example:
```ts
const statements = [
    {
        query: "UPDATE users SET active = false WHERE id = $1",
        params: [1]
    },
    {
        query: "DELETE FROM sessions WHERE user_id = $1",
        params: [1]
    }
]

const affected = await db.executeBatch(statements)
```

When multiple statements are supplied through `PoolManager`, the batch is executed using a transaction.

Conceptually:

```text
connect
   ↓
BEGIN
   ↓
execute statements
   ↓
COMMIT
   ↓
release client
```

If execution fails:

```text
connect
   ↓
BEGIN
   ↓
execute
   ↓
ERROR
   ↓
ROLLBACK
   ↓
release client
```

## `firstSuccess`

`executeBatch()` supports an optional `firstSuccess` flag.

```ts
await db.executeBatch(statements, true)
```

When `firstSuccess` is `true`, the first statement determines whether the remaining statements are executed.

If the first statement affects at least one row:

```text
statement 1
    │
    ├── rowCount > 0
    │
    ▼
statement 2
    ↓
statement 3
    ↓
...
```

If the first statement affects zero rows:

```text
statement 1
    │
    └── rowCount = 0
            ↓
       stop remaining statements
```

The batch still completes its transaction lifecycle.

## Executing a Batch on an Existing Client

When a transaction or an existing `PoolClient` already exists, `executeBatchWithClient()` can execute statements without creating another transaction.

```ts
await executeBatchWithClient(
    client,
    statements
)
```

This is useful when transaction ownership belongs to the caller.

The distinction is:

```text
executeBatch()
    owns connection + transaction lifecycle

executeBatchWithClient()
    uses caller's existing client
```

## Parameter Normalization

Parameters are normalized before being passed to PostgreSQL.

`toArray()` handles:

* `undefined` → `null`
* `null` → `null`
* `Date` → unchanged
* objects → object or JSON string depending on configuration
* primitive values → unchanged

Example:

```ts
await db.execute(
    `
    INSERT INTO users(name, metadata)
    VALUES ($1, $2)
    `,
    [
        "John",
        {
            role: "admin"
        }
    ]
)
```

When `resource.string` is enabled, object parameters are serialized using `JSON.stringify()`.

## Field Selection

`getFields()` can restrict requested fields to an allowed list.

```ts
const fields = getFields(
    ["id", "name", "password"],
    ["id", "name", "created_at"]
)
```

The resulting fields are:

```text
id
name
```

This is useful when building dynamic SQL while restricting fields to a known set.

`buildFields()` converts the resulting fields into a SQL field list:

```ts
buildFields(["id", "name"])
```

returns:

```text
id,name
```

If no valid fields are available, it returns:

```text
*
```

Dynamic field names should still come from trusted or validated input because SQL parameters cannot be used for identifiers.

```ts
SELECT ${buildFields(fields, allowedFields)}
FROM users
```
For example:
```ts
SELECT ${buildFields(["id", "name", "password", "status"], ["id", "name", "status"])}
FROM users
```

returns:

```ts
SELECT id, name, status
FROM users
```

## Duplicate-Key Errors

PostgreSQL reports unique constraint violations using error code `23505`.

`postgres-kit` normalizes this error by adding:

```ts
err.error = "duplicate"
```

This allows higher-level repository code to handle duplicate records without depending directly on the PostgreSQL error code.

Example:

```ts
try {
    await db.execute(
        "INSERT INTO users(email) VALUES ($1)",
        [email]
    )
} catch (err) {
    if (err.error === "duplicate") {
        // Handle duplicate record
    }

    throw err
}
```

## MinDB

For components that only need basic database operations, `MinDB` provides a smaller interface:

```ts
export interface MinDB {
  driver: string
  param(i: number): string
  execute(sql: string, args?: any[], ctx?: any): Promise<number>
  executeBatch(statements: Statement[], firstSuccess?: boolean, ctx?: any): Promise<number>
  query<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T[]>
}
```

This can be useful when a component does not need transactions, scalar queries, or `queryOne()`.

## Database Metadata

The library defines `Attribute` metadata that can be used by higher-level repository/data-access components:

```ts
interface Attribute {
    name?: string
    column?: string
    type?: DataType
    default?: string | number | Date | boolean
    key?: boolean
    noinsert?: boolean
    noupdate?: boolean
    version?: boolean
    ignored?: boolean
    true?: string | number
    false?: string | number
}
```

The metadata supports database/property information, field behavior, version fields, and boolean representations.

## PostgreSQL Driver

`postgres-kit` identifies itself as:

```ts
db.driver === "postgres"
```

PostgreSQL parameter placeholders are generated using:

```ts
db.param(1) // "$1"
db.param(2) // "$2"
```

This keeps the higher-level executor API independent of the exact parameter syntax.

## Health Check

Built-in PostgreSQL health checker.

Designed for cloud-native deployments.

Features:

* Connection validation
* Query validation
* Response time measurement
* Configurable timeout
* Kubernetes readiness and liveness probes

Example:

```typescript
const checker = new PostgreSQLChecker(pool);

const result = await checker.check();
```

---

## Design Philosophy

`postgres-kit` intentionally stays close to SQL.

It does not attempt to provide:

* entity tracking
* lazy loading
* relationships
* change tracking
* migrations
* query builders
* an ORM-style entity model

Instead, it focuses on providing a small and reusable database execution layer:

```text
Application
     │
     ▼
Repository
     │
     ▼
postgres-kit
     │
     ▼
    pg
     │
     ▼
 PostgreSQL
```

## Ecosystem
[`postgres-kit`](https://www.npmjs.com/package/postgres-kit) can work with [`sql-core`](https://www.npmjs.com/package/sql-core) and [`query-mappers`](https://www.npmjs.com/package/query-mappers). They separate responsibilities into independent layers.

* SQL generation belongs to [`sql-core`](https://www.npmjs.com/package/sql-core)
* Object mapping belongs to [`query-mappers`](https://www.npmjs.com/package/query-mappers)
* PostgreSQL execution belongs to [`postgres-kit`](https://www.npmjs.com/package/postgres-kit)

This architecture keeps applications lightweight, modular, and easy to maintain.

```text
 Application
      │
      ▼
 Repository (sql-core)
      │
      ▼
 postgres-kit
      │
      ▼
  PostgreSQL
```

### Responsibilities

| Package                                                        | Responsibility                                                        |
|----------------------------------------------------------------| --------------------------------------------------------------------- |
| [`postgres-kit`](https://www.npmjs.com/package/postgres-kit)   | PostgreSQL execution, repositories, writers, streaming, health checks |
| [`sql-core`](https://www.npmjs.com/package/sql-core)           | Database-independent repositories, CRUD, SQL builders, transactions   |
| [`query-mappers`](https://www.npmjs.com/package/query-mappers) | Maps database rows to TypeScript models                               |

## License

MIT
