# pg-extension

A high-performance PostgreSQL toolkit for Node.js built on top of the official [**pg**](https://www.npmjs.com/package/pg) driver.

[`pg-extension`](https://www.npmjs.com/package/pg-extension) is the PostgreSQL adapter for the [**sql-core**](https://www.npmjs.com/package/sql-core) ecosystem. It provides execution utilities, repositories, batch processing, stream processing, health checks, and PostgreSQL-specific implementations while reusing the database-independent abstractions from [**sql-core**](https://www.npmjs.com/package/sql-core).
 
### Example
- [admin](https://github.com/fintech-product/admin): SSR Admin Application
- [admin-service](https://github.com/fintech-product/admin-service): Admin Backend Microservice  
- [sql-simple-modular-sample](https://github.com/source-code-template/sql-simple-modular-sample): RESI API with express and postgres

## Features

* Built on the official [`pg`](https://www.npmjs.com/package/pg) driver
* Reuses `Repository` and `CRUDRepository` from [`sql-core`](https://www.npmjs.com/package/sql-core)
* Works seamlessly with [`query-mappers`](https://www.npmjs.com/package/query-mappers)
* Metadata-driven CRUD operations
* Batch insert and update
* Stream processing for large datasets
* Optimistic locking
* Transaction support
* PostgreSQL health check for Kubernetes
* TypeScript first
* Lightweight with no ORM

## Installation

```bash
npm install pg-extension
```

or together with the ecosystem:

```bash
npm install sql-core query-mappers pg-extension
```

## Why pg-extension?
Most SQL libraries are either:

- Low-level drivers ([`pg`](https://www.npmjs.com/package/pg))
- Full-featured ORMs (TypeORM, Prisma, Sequelize)

This library focuses on infrastructure.

It provides:

- Connection management
- Transactions
- Repository integration
- Batch execution
- Streaming

without hiding SQL from developers.

Moreover, [`pg-extension`](https://www.npmjs.com/package/pg-extension) can work with [`sql-core`](https://www.npmjs.com/package/sql-core) and [`query-mappers`](https://www.npmjs.com/package/query-mappers). They separate responsibilities into independent layers.

* SQL generation belongs to [`sql-core`](https://www.npmjs.com/package/sql-core)
* Object mapping belongs to [`query-mappers`](https://www.npmjs.com/package/query-mappers)
* PostgreSQL execution belongs to [`pg-extension`](https://www.npmjs.com/package/pg-extension)

This architecture keeps applications lightweight, modular, and easy to maintain.


## Ecosystem

```text
                    Application
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
       Repository                 CRUDRepository
       (sql-core)
            │
            ▼
      query-mappers
            │
            ▼
      pg-extension
            │
            ▼
       PostgreSQL
```

### Responsibilities

| Package       | Responsibility                                                        |
| ------------- | --------------------------------------------------------------------- |
| [`sql-core`](https://www.npmjs.com/package/sql-core)      | Database-independent repositories, CRUD, SQL builders, transactions   |
| [`query-mappers`](https://www.npmjs.com/package/query-mappers) | Maps database rows to TypeScript models                               |
| [`pg-extension`](https://www.npmjs.com/package/pg-extension)   | PostgreSQL execution, repositories, writers, streaming, health checks |

---

## Core Components

### PostgreSQL Execution

Execute SQL statements using PostgreSQL.

* Transaction support
* Query execution
* Command execution
* Prepared statements

#### Transactions

```ts
const tx = await db.beginTransaction()

try {
    await tx.execute(
        `INSERT INTO users(name) VALUES($1)`,
        ["John"]
    )
    await tx.commit()
}
catch (err) {
    await tx.rollback()
}
```
#### Query

Rows are automatically mapped into TypeScript objects.

```ts
interface User {

    id: number

    name: string

    active: boolean

}
```

```ts
const users = await db.query<User>(sql)
```

Automatically converts database values.

```
0  -> false

1  -> true

NULL -> null
```

#### Execute

```ts
await db.execute(
    `UPDATE users SET active = $1 WHERE id = $2`
    [true, 10]
)
```

---

#### Batch Execution

```ts
await db.executeBatch([
    {
        query: "INSERT INTO users(name) VALUES($1)",
        params: ["John"]
    },
    {
        query: "INSERT INTO users(name) VALUES($1)",
        params: ["Jane"]
    }
])
```

### Repository

`pg-extension` provides PostgreSQL implementations that reuse the generic repositories from[`sql-core`](https://www.npmjs.com/package/sql-core).

Features include:

* Create
* Update
* Delete
* Find by id
* Search
* Paging
* Sorting
* Optimistic locking

## Batch Processing

Efficiently execute multiple operations.

Suitable for:

* Data migration
* Import jobs
* Synchronization
* ETL

### Writer

Insert data efficiently.

```ts
const writer = new PostgreSQLWriter(pool)

await writer.write(users)
```

### Batch Writer

```ts
const writer = new PostgreSQLBatchWriter(pool)

await writer.write(users)
```

## Stream Processing

Designed for processing very large datasets without loading everything into memory.

Typical use cases:

* CSV import
* Excel import
* Background jobs
* Large database synchronization

### Stream Writer

```ts
const writer = new PostgreSQLStreamWriter(pool)

await writer.write(user)
```

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

## Metadata-driven Persistence

CRUD operations are generated from metadata instead of handwritten SQL.

Supports:

* Primary keys
* Version fields
* Read-only fields
* Insert-only fields
* Update-only fields
* Automatic SQL generation

## Optimistic Locking

Version columns are automatically detected from metadata.

No additional repository code is required.

## Transactions

Supports PostgreSQL transactions using the abstractions defined in [`sql-core`](https://www.npmjs.com/package/sql-core).

```text
Begin Transaction

       ↓

Execute Commands

       ↓

Commit / Rollback
```

## Integration with query-mappers

`query-mappers` converts PostgreSQL rows into strongly typed TypeScript models.

```text
PostgreSQL Row

       ↓

 query-mappers

       ↓

TypeScript Object
```

## Designed for Enterprise Applications

`pg-extension` is suitable for:

* REST APIs
* Microservices
* Batch processing
* ETL pipelines
* Event-driven systems
* Cloud-native applications

## Advantages

* No ORM overhead
* Reusable repositories
* Modular architecture
* High performance
* Strong TypeScript support
* Easy to test
* Clean separation of responsibilities

## Related Packages

* [**sql-core**](https://www.npmjs.com/package/sql-core) — Common SQL abstractions, repositories, CRUD, and SQL builders.
* [**query-mappers**](https://www.npmjs.com/package/query-mappers) — Object mapping between SQL rows and TypeScript models.
* [**mysql2-core**](https://www.npmjs.com/package/mysql2-core) — MySQL adapter built on top of [`mysql2`](https://www.npmjs.com/package/mysql2).

## License

MIT
