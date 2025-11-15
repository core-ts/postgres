import {Pool, PoolClient, QueryResult, QueryResultRow} from 'pg';
import {buildToSave, buildToSaveBatch, param} from './build';
import {Attribute, Attributes, DB, Manager, Statement, StringMap} from './metadata';

export * from './metadata';
export * from './build';

// tslint:disable-next-line:class-name
export class resource {
  static string?: boolean;
}

export interface Config {
  connectionString?: string | undefined;
  host?: string | undefined;
  port?: number;
  server?: string | undefined;
  database?: string | undefined;
  user?: string | undefined;
  password?: string | undefined;
  multipleStatements?: boolean | undefined;
  max?: number | undefined;
  min?: number | undefined;
  idleTimeoutMillis?: number | undefined;
}
export function createPool(conf: Config): Pool {
  const pool = new Pool(conf);
  return pool;
}
// tslint:disable-next-line:max-classes-per-file
export class PoolManager implements Manager {
  constructor(public pool: Pool) {
    this.param = this.param.bind(this);
    this.exec = this.exec.bind(this);
    this.execBatch = this.execBatch.bind(this);
    this.query = this.query.bind(this);
    this.queryOne = this.queryOne.bind(this);
    this.execScalar = this.execScalar.bind(this);
    this.count = this.count.bind(this);
  }
  driver = 'postgres';
  param(i: number): string {
    return '$' + i;
  }
  exec(sql: string, args?: any[], ctx?: any): Promise<number> {
    const p = (ctx ? ctx : this.pool);
    return exec(p, sql, args);
  }
  execBatch(statements: Statement[], firstSuccess?: boolean, ctx?: any): Promise<number> {
    const p = (ctx ? ctx : this.pool);
    return execBatch(p, statements, firstSuccess);
  }
  query<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T[]> {
    const p = (ctx ? ctx : this.pool);
    return query(p, sql, args, m, bools);
  }
  queryOne<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T|null> {
    const p = (ctx ? ctx : this.pool);
    return queryOne(p, sql, args, m, bools);
  }
  execScalar<T>(sql: string, args?: any[], ctx?: any): Promise<T> {
    const p = (ctx ? ctx : this.pool);
    return execScalar<T>(p, sql, args);
  }
  count(sql: string, args?: any[], ctx?: any): Promise<number> {
    const p = (ctx ? ctx : this.pool);
    return count(p, sql, args);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class PoolClientManager implements Manager {
  constructor(public client: PoolClient) {
    this.param = this.param.bind(this);
    this.exec = this.exec.bind(this);
    this.execBatch = this.execBatch.bind(this);
    this.query = this.query.bind(this);
    this.queryOne = this.queryOne.bind(this);
    this.execScalar = this.execScalar.bind(this);
    this.count = this.count.bind(this);
  }
  driver = 'postgres';
  param(i: number): string {
    return '$' + i;
  }
  exec(sql: string, args?: any[], ctx?: any): Promise<number> {
    const p = (ctx ? ctx : this.client);
    return exec(this.client, sql, args);
  }
  execBatch(statements: Statement[], firstSuccess?: boolean, ctx?: any): Promise<number> {
    const p = (ctx ? ctx : this.client);
    return execBatchWithClient(p, statements, firstSuccess);
  }
  query<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T[]> {
    const p = (ctx ? ctx : this.client);
    return query(p, sql, args, m, bools);
  }
  queryOne<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T|null> {
    const p = (ctx ? ctx : this.client);
    return queryOne(p, sql, args, m, bools);
  }
  execScalar<T>(sql: string, args?: any[], ctx?: any): Promise<T> {
    const p = (ctx ? ctx : this.client);
    return execScalar<T>(p, sql, args);
  }
  count(sql: string, args?: any[], ctx?: any): Promise<number> {
    const p = (ctx ? ctx : this.client);
    return count(p, sql, args);
  }
}
function buildError(err: any): any {
  if (err.code === '23505') {
    err.error = 'duplicate';
  }
  return err;
}
export interface Query {
  query<R extends QueryResultRow = any, I extends any[] = any[]>(queryText: string, values: I, callback: (err: Error, result: QueryResult<R>) => void): void;
}
export function exec(client: Query, sql: string, args?: any[]): Promise<number> {
  const p = toArray(args);
  return new Promise<number>((resolve, reject) => {
    return client.query(sql, p, (err, results) => {
      if (err) {
        buildError(err);
        return reject(err);
      } else {
        return resolve(results.rowCount ? results.rowCount : 0);
      }
    });
  });
}
export function query<T>(client: Query, sql: string, args?: any[], m?: StringMap, bools?: Attribute[]): Promise<T[]> {
  const p = toArray(args);
  return new Promise<T[]>((resolve, reject) => {
    return client.query<QueryResult>(sql, p, (err, results) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(handleResults(results.rows as any, m, bools));
      }
    });
  });
}
export function queryOne<T>(client: Query, sql: string, args?: any[], m?: StringMap, bools?: Attribute[]): Promise<T|null> {
  return query<T>(client, sql, args, m, bools).then(r => {
    return (r && r.length > 0 ? r[0] : null);
  });
}
export function execScalar<T>(client: Query, sql: string, args?: any[]): Promise<T> {
  return queryOne<T>(client, sql, args).then(r => {
    if (!r) {
      return null;
    } else {
      const keys = Object.keys(r);
      return (r as any)[keys[0]];
    }
  });
}
export function count(client: Query, sql: string, args?: any[]): Promise<number> {
  return execScalar<number>(client, sql, args);
}

export async function execBatch(pool: Pool, statements: Statement[], firstSuccess?: boolean): Promise<number> {
  if (!statements || statements.length === 0) {
    return Promise.resolve(0);
  } else if (statements.length === 1) {
    return exec(pool, statements[0].query, toArray(statements[0].params));
  }
  const client = await pool.connect();
  let c = 0;
  if (firstSuccess) {
    try {
      await client.query('begin');
      const result0 = await client.query(statements[0].query, toArray(statements[0].params));
      if (result0 && result0.rowCount !== 0) {
        const subs = statements.slice(1);
        const arrPromise = subs.map(item => {
          return client.query(item.query, item.params ? item.params : []);
        });
        await Promise.all(arrPromise).then(results => {
          for (const obj of results) {
            if (obj.rowCount) {
              c += obj.rowCount;
            }
          }
        });
        if (result0.rowCount) {
          c += result0.rowCount;
        }
        await client.query('commit');
        client.release();
      }
      return c;
    } catch (e) {
      buildError(e);
      await client.query('rollback');
      client.release();
      throw e;
    }
  } else {
    try {
      await client.query('begin');
      const arrPromise = statements.map((item, i) => {
        return client.query(item.query, toArray(item.params));
      });
      await Promise.all(arrPromise).then(results => {
        for (const obj of results) {
          if (obj.rowCount) {
            c += obj.rowCount;
          }
        }
      });
      await client.query('commit');
      client.release();
      return c;
    } catch (e) {
      await client.query('rollback');
      client.release();
      throw e;
    }
  }
}
export async function execBatchWithClient(client: PoolClient, statements: Statement[], firstSuccess?: boolean): Promise<number> {
  if (!statements || statements.length === 0) {
    return Promise.resolve(0);
  } else if (statements.length === 1) {
    return exec(client, statements[0].query, statements[0].params);
  }
  let c = 0;
  if (firstSuccess) {
    try {
      await client.query('begin');
      const result0 = await client.query(statements[0].query, toArray(statements[0].params));
      if (result0 && result0.rowCount !== 0) {
        const subs = statements.slice(1);
        const arrPromise = subs.map((item, i) => {
          return client.query(item.query, item.params ? item.params : []);
        });
        await Promise.all(arrPromise).then(results => {
          for (const obj of results) {
            if (obj.rowCount) {
              c += obj.rowCount;
            }
          }
        });
        if (result0.rowCount) {
          c += result0.rowCount;
        }
        await client.query('commit');
        client.release();
      }
      return c;
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  } else {
    try {
      await client.query('begin');
      const arrPromise = statements.map((item, i) => {
        return client.query(item.query, toArray(item.params));
      });
      await Promise.all(arrPromise).then(results => {
        for (const obj of results) {
          if (obj.rowCount) {
            c += obj.rowCount;
          }
        }
      });
      await client.query('commit');
      client.release();
      return c;
    } catch (e) {
      await client.query('rollback');
      client.release();
      throw e;
    }
  }
}

export function save<T>(client: Query|((sql: string, args?: any[]) => Promise<number>), obj: T, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string): Promise<number> {
  const s = buildToSave(obj, table, attrs, ver, buildParam);
  if (!s) {
    return Promise.resolve(-1);
  }
  if (typeof client === 'function') {
    return client(s.query, s.params);
  } else {
    return exec(client, s.query, s.params);
  }
}
export function saveBatch<T>(pool: Pool, objs: T[], table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string): Promise<number> {
  const s = buildToSaveBatch(objs, table, attrs, ver, buildParam);
  if (!s) {
    return Promise.resolve(-1);
  } else {
    return execBatch(pool, s);
  }
}
export function saveBatchWithClient<T>(client: PoolClient, objs: T[], table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string): Promise<number> {
  const s = buildToSaveBatch(objs, table, attrs, ver, buildParam);
  if (!s) {
    return Promise.resolve(-1);
  } else {
    return execBatchWithClient(client, s);
  }
}

export function toArray(arr?: any[]): any[] {
  if (!arr || arr.length === 0) {
    return [];
  }
  const p: any[] = [];
  const l = arr.length;
  for (let i = 0; i < l; i++) {
    if (arr[i] === undefined || arr[i] == null) {
      p.push(null);
    } else {
      if (typeof arr[i] === 'object') {
        if (arr[i] instanceof Date) {
          p.push(arr[i]);
        } else {
          if (resource.string) {
            const s: string = JSON.stringify(arr[i]);
            p.push(s);
          } else {
            p.push(arr[i]);
          }
        }
      } else {
        p.push(arr[i]);
      }
    }
  }
  return p;
}
export function handleResults<T>(r: T[], m?: StringMap, bools?: Attribute[]): T[] {
  if (m) {
    const res = mapArray(r, m);
    if (bools && bools.length > 0) {
      return handleBool(res, bools);
    } else {
      return res;
    }
  } else {
    if (bools && bools.length > 0) {
      return handleBool(r, bools);
    } else {
      return r;
    }
  }
}
export function handleBool<T>(objs: T[], bools: Attribute[]): T[] {
  if (!bools || bools.length === 0 || !objs) {
    return objs;
  }
  for (const obj of objs) {
    const o: any = obj;
    for (const field of bools) {
      if (field.name) {
        const v = o[field.name];
        if (typeof v !== 'boolean' && v != null && v !== undefined ) {
          const b = field.true;
          if (b == null || b === undefined) {
            // tslint:disable-next-line:triple-equals
            o[field.name] = ('true' == v || '1' == v || 't' == v || 'y' == v || 'on' == v);
          } else {
            // tslint:disable-next-line:triple-equals
            o[field.name] = (v == b ? true : false);
          }
        }
      }
    }
  }
  return objs;
}
export function map<T>(obj: T, m?: StringMap): any {
  if (!m) {
    return obj;
  }
  const mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return obj;
  }
  const obj2: any = {};
  const keys = Object.keys(obj as any);
  for (const key of keys) {
    let k0 = m[key];
    if (!k0) {
      k0 = key;
    }
    obj2[k0] = (obj as any)[key];
  }
  return obj2;
}
export function mapArray<T>(results: T[], m?: StringMap): T[] {
  if (!m) {
    return results;
  }
  const mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return results;
  }
  const objs = [];
  const length = results.length;
  for (let i = 0; i < length; i++) {
    const obj: any = results[i];
    const obj2: any = {};
    const keys = Object.keys(obj);
    for (const key of keys) {
      let k0 = m[key];
      if (!k0) {
        k0 = key;
      }
      obj2[k0] = obj[key];
    }
    objs.push(obj2);
  }
  return objs;
}
export function getFields(fields: string[], all?: string[]): string[]|undefined {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  const ext: string [] = [];
  if (all) {
    for (const s of fields) {
      if (all.includes(s)) {
        ext.push(s);
      }
    }
    if (ext.length === 0) {
      return undefined;
    } else {
      return ext;
    }
  } else {
    return fields;
  }
}
export function buildFields(fields: string[], all?: string[]): string {
  const s = getFields(fields, all);
  if (!s || s.length === 0) {
    return '*';
  } else {
    return s.join(',');
  }
}
export function getMapField(name: string, mp?: StringMap): string {
  if (!mp) {
    return name;
  }
  const x = mp[name];
  if (!x) {
    return name;
  }
  if (typeof x === 'string') {
    return x;
  }
  return name;
}
export function isEmpty(s: string): boolean {
  return !(s && s.length > 0);
}
/*
// tslint:disable-next-line:max-classes-per-file
export class StringRepository {
  constructor(protected pool: Pool, public table: string, public column: string) {
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
  }
  load(key: string, max: number): Promise<string[]> {
    const s = `select ${this.column} from ${this.table} where ${this.column} ilike $1 order by ${this.column} fetch next ${max} rows only`;
    return query(this.pool, s, ['' + key + '%']).then(arr => {
      return arr.map(i => (i as any)[this.column] as string);
    });
  }
  save(values: string[]): Promise<number> {
    if (!values || values.length === 0) {
      return Promise.resolve(0);
    }
    const arr: string[] = [];
    for (let i = 1; i <= values.length; i++) {
      arr.push('($' + i + ')');
    }
    const s = `insert into ${this.table}(${this.column})values${arr.join(',')} on conflict do nothing`;
    return exec(this.pool, s, values);
  }
}
*/
export function version(attrs: Attributes): Attribute|undefined {
  const ks = Object.keys(attrs);
  for (const k of ks) {
    const attr = attrs[k];
    if (attr.version) {
      attr.name = k;
      return attr;
    }
  }
  return undefined;
}
// tslint:disable-next-line:max-classes-per-file
export class PostgreSQLWriter<T> {
  pool?: Pool;
  version?: string;
  exec?: (sql: string, args?: any[]) => Promise<number>;
  map?: (v: T) => T;
  param?: (i: number) => string;
  constructor(pool: Pool|((sql: string, args?: any[]) => Promise<number>), public table: string, public attributes: Attributes, public oneIfSuccess?: boolean, toDB?: (v: T) => T, buildParam?: (i: number) => string) {
    this.write = this.write.bind(this);
    if (typeof pool === 'function') {
      this.exec = pool;
    } else {
      this.pool = pool;
    }
    this.param = buildParam;
    this.map = toDB;
    const x = version(attributes);
    if (x) {
      this.version = x.name;
    }
  }
  write(obj: T): Promise<number> {
    if (!obj) {
      return Promise.resolve(0);
    }
    let obj2: NonNullable<T> | T = obj;
    if (this.map) {
      obj2 = this.map(obj);
    }
    const stmt = buildToSave(obj2, this.table, this.attributes, this.version, this.param);
    if (stmt) {
      if (this.exec) {
        if (this.oneIfSuccess) {
          return this.exec(stmt.query, stmt.params).then(ct => ct > 0 ? 1 : 0);
        } else {
          return this.exec(stmt.query, stmt.params);
        }
      } else {
        if (this.oneIfSuccess) {
          return exec(this.pool as any, stmt.query, stmt.params).then(ct => ct > 0 ? 1 : 0);
        } else {
          return exec(this.pool as any, stmt.query, stmt.params);
        }
      }
    } else {
      return Promise.resolve(0);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class PostgreSQLStreamWriter<T> {
  list: T[] = [];
  size = 0;
  pool?: Pool;
  version?: string;
  execBatch?: (statements: Statement[]) => Promise<number>;
  map?: (v: T) => T;
  param?: (i: number) => string;
  constructor(con: Pool | ((statements: Statement[]) => Promise<number>), public table: string, public attributes: Attributes, size?: number, toDB?: (v: T) => T, buildParam?: (i: number) => string) {
    this.write = this.write.bind(this);
    this.flush = this.flush.bind(this);
    if (typeof con === 'function') {
      this.execBatch = con;
    } else {
      this.pool = con;
    }
    this.param = buildParam;
    this.map = toDB;
    const x = version(attributes);
    if (x) {
      this.version = x.name;
    }
    if (size) {
      this.size = size;
    }
  }
  write(obj: T): Promise<number> {
    if (!obj) {
      return Promise.resolve(0);
    }
    let obj2: NonNullable<T> | T = obj;
    if (this.map) {
      obj2 = this.map(obj);
      this.list.push(obj2);
    } else {
      this.list.push(obj);
    }
    if (this.list.length < this.size) {
      return Promise.resolve(0);
    } else {
      return this.flush();
    }
  }
  flush(): Promise<number> {
    if (!this.list || this.list.length === 0) {
      return Promise.resolve(0);
    } else {
      const total = this.list.length;
      const stmt = buildToSaveBatch(this.list, this.table, this.attributes, this.version, this.param);
      if (stmt) {
        if (this.execBatch) {
          return this.execBatch(stmt).then(r => {
            this.list = [];
            return total;
          });
        } else {
          return execBatch(this.pool as any, stmt).then(r => {
            this.list = [];
            return total;
          });
        }
      } else {
        return Promise.resolve(0);
      }
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class PostgreSQLBatchWriter<T> {
  pool?: Pool;
  version?: string;
  execute?: (statements: Statement[]) => Promise<number>;
  map?: (v: T) => T;
  param?: (i: number) => string;
  constructor(pool: Pool|((statements: Statement[]) => Promise<number>), public table: string, public attributes: Attributes, toDB?: (v: T) => T, buildParam?: (i: number) => string) {
    this.write = this.write.bind(this);
    if (typeof pool === 'function') {
      this.execute = pool;
    } else {
      this.pool = pool;
    }
    this.param = buildParam;
    this.map = toDB;
    const x = version(attributes);
    if (x) {
      this.version = x.name;
    }
  }
  write(objs: T[]): Promise<number> {
    if (!objs || objs.length === 0) {
      return Promise.resolve(0);
    }
    let list = objs;
    if (this.map) {
      list = [];
      for (const obj of objs) {
        const obj2 = this.map(obj);
        list.push(obj2);
      }
    }
    const stmts = buildToSaveBatch(list, this.table, this.attributes, this.version, this.param);
    if (stmts && stmts.length > 0) {
      if (this.execute) {
        return this.execute(stmts);
      } else {
        return execBatch(this.pool as any, stmts);
      }
    } else {
      return Promise.resolve(0);
    }
  }
}

export interface AnyMap {
  [key: string]: any;
}
// tslint:disable-next-line:max-classes-per-file
export class PostgreSQLChecker {
  timeout: number;
  service: string;
  constructor(private pool: Pool, service?: string, timeout?: number) {
    this.timeout = (timeout ? timeout : 4200);
    this.service = (service ? service : 'mysql');
    this.check = this.check.bind(this);
    this.name = this.name.bind(this);
    this.build = this.build.bind(this);
  }
  async check(): Promise<AnyMap> {
    const obj = {} as AnyMap;
    await this.pool.connect();
    const promise = new Promise<any>((resolve, reject) => {
      this.pool.query('select now()', (err, result) => {
        if (err) {
          return reject(err);
        } else {
          resolve(obj);
        }
      });
    });
    if (this.timeout > 0) {
      return promiseTimeOut(this.timeout, promise);
    } else {
      return promise;
    }
  }
  name(): string {
    return this.service;
  }
  build(data: AnyMap, err: any): AnyMap {
    if (err) {
      if (!data) {
        data = {} as AnyMap;
      }
      data['error'] = err;
    }
    return data;
  }
}

function promiseTimeOut(timeoutInMilliseconds: number, promise: Promise<any>): Promise<any> {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(`Timed out in: ${timeoutInMilliseconds} milliseconds!`);
      }, timeoutInMilliseconds);
    })
  ]);
}
// tslint:disable-next-line:max-classes-per-file
export class StringService {
  constructor(public table: string, public field: string, queryData: <T>(sql: string, args?: any[]) => Promise<T[]>, execute: (sql: string, args?: any[]) => Promise<number>) {
    this.query = queryData;
    this.exec = execute;
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
  }
  query: <T>(sql: string, args?: any[]) => Promise<T[]>;
  exec: (sql: string, args?: any[]) => Promise<number>;
  load(keyword: string, max?: number): Promise<string[]> {
    const m = (max && max > 0 ? max : 20);
    const k = keyword + '%';
    return this.query(`select ${this.field} from ${this.table} where ${this.field} ilike $1 order by ${this.field} limit ${m}`, [k]).then(res => res.map(i => (i as any)[this.field]));
  }
  save(values: string[]): Promise<number> {
    if (!values || values.length === 0) {
      return Promise.resolve(0);
    } else {
      const arr: string[] = [];
      const ps: string[] = [];
      let i = 1;
      for (const v of values) {
        if (v && v.length > 0) {
          arr.push(`($${i++})`);
          ps.push(v);
        }
      }
      if (arr.length === 0) {
        return Promise.resolve(0);
      } else {
        const sql = `insert into ${this.table}(${this.field}) values ${arr.join(',')} on conflict(${this.field}) do nothing`;
        return this.exec(sql, ps);
      }
    }
  }
}
export const StringRepository = StringService;


export interface MinDB {
  param(i: number): string;
  exec(sql: string, args?: any[], ctx?: any): Promise<number>;
  query<T>(sql: string, args?: any[], m?: StringMap): Promise<T[]>;
}
export interface Passcode {
  code: string;
  expiredAt: Date;
}
// tslint:disable-next-line:max-classes-per-file
export class CodeRepository<ID> {
  constructor(public db: MinDB, public table: string, id?: string, expiredAt?: string, passcode?: string) {
    this.id = (id ? id : 'id');
    this.code = (passcode ? passcode : 'code');
    this.expiredAt = (expiredAt ? expiredAt : 'expiredat');
    this.load = this.load.bind(this);
    this.delete = this.delete.bind(this);
    this.save = this.save.bind(this);
  }
  id: string;
  code: string;
  expiredAt: string;
  save(id: ID, passcode: string, expiredAt: Date): Promise<number> {
    const sql = `
      insert into ${this.table} (${this.id}, ${this.code}, ${this.expiredAt})
      values (${this.db.param(1)}, ${this.db.param(2)}, ${this.db.param(3)})
      on conflict (${this.id})
      do update set ${this.code} = ${this.db.param(4)}, ${this.expiredAt} = ${this.db.param(5)}`;
    return this.db.exec(sql, [id, passcode, expiredAt, passcode, expiredAt]);
  }
  load(id: ID): Promise<Passcode|null|undefined> {
    const sql = `select ${this.code} as code, ${this.expiredAt} as expiredat from ${this.table} where ${this.id} = ${this.db.param(1)}`;
    return this.db.query(sql, [id]).then(v => {
      if (!v || v.length === 0) {
        return null;
      } else {
        const obj: any = {};
        obj.code = (v[0] as any)['code'];
        obj.expiredAt = (v[0] as any)['expiredat'];
        return obj;
      }
    });
  }
  delete(id: ID): Promise<number> {
    const sql = `delete from ${this.table} where ${this.id} = ${this.db.param(1)}`;
    return this.db.exec(sql, [id]);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class PasscodeRepository<ID> extends CodeRepository<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class SqlPasscodeRepository<ID> extends CodeRepository<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class SqlCodeRepository<ID> extends CodeRepository<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class CodeService<ID> extends CodeRepository<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class PasscodeService<ID> extends CodeRepository<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class SqlPasscodeService<ID> extends CodeRepository<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class SqlCodeService<ID> extends CodeRepository<ID> {
}

export interface URL<ID> {
  id: ID;
  url: string;
  name: string;
}
// tslint:disable-next-line:max-classes-per-file
export class UrlQuery<ID> {
  constructor(protected queryF: <T2>(sql: string, args?: any[]) => Promise<T2[]>, protected table: string, url?: string, id?: string, name?: string, displayName?: string) {
    this.id = (id && id.length > 0 ? id : 'id');
    this.url = (url && url.length > 0 ? url : 'url');
    this.name = (name && name.length > 0 ? name : 'name');
    this.displayName = (displayName && displayName.length > 0 ? displayName : 'displayname');
    this.load = this.load.bind(this);
    this.query = this.query.bind(this);
  }
  protected id: string;
  protected url: string;
  protected name: string;
  protected displayName: string;
  // tslint:disable-next-line:array-type
  load(ids: ID[]): Promise<URL<ID>[]> {
    return this.query(ids);
  }
  // tslint:disable-next-line:array-type
  query(ids: ID[]): Promise<URL<ID>[]> {
    if (!ids || ids.length === 0) {
      // tslint:disable-next-line:array-type
      const s: URL<ID>[] = [];
      return Promise.resolve(s);
    }
    const ps: any[] = [];
    const pv: string[] = [];
    const l = ids.length;
    for (let i = 1; i <= l; i++) {
      ps.push(ids[i - 1]);
      pv.push(param(i));
    }
    const sql = `select ${this.id} as id, ${this.url} as url, case when ${this.displayName} is not null then ${this.displayName} else ${this.name} end as name from ${this.table} where ${this.id} in (${pv.join(',')}) and ${this.url} is not null order by ${this.id}`;
    return this.queryF(sql, ps);
  }
}
// tslint:disable-next-line:array-type
export function useUrlQuery<ID>(queryF: <T>(sql: string, args?: any[]) => Promise<T[]>, table: string, url?: string, id?: string, name?: string, displayName?: string): ((ids: ID[]) => Promise<URL<ID>[]>) {
  const q = new UrlQuery<ID>(queryF, table, url, id, name, displayName);
  return q.query;
}
export interface SavedItem<ID, T> {
  id: ID;
  items: T[];
}
// tslint:disable-next-line:max-classes-per-file
export class SqlSavedRepository {
  constructor(protected db: DB, protected table: string, protected userId: string, protected id: string, protected saveAt: string) {
    this.isSaved = this.isSaved.bind(this)
    this.save = this.save.bind(this)
    this.remove = this.remove.bind(this)
    this.count = this.count.bind(this)
  }
  isSaved(userId: string, id: string): Promise<boolean> {
    const sql = `select ${this.userId} from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`
    return this.db.query<any>(sql, [userId, id]).then((rows) => {
      return rows.length > 0 ? true : false
    })
  }
  save(userId: string, id: string): Promise<number> {
    const sql = `insert into ${this.table} (${this.userId}, ${this.id}, ${this.saveAt})
    values (${this.db.param(1)}, ${this.db.param(2)}, ${this.db.param(3)})
    on conflict (${this.userId}, ${this.id}) do nothing`
    return this.db.exec(sql, [userId, id, new Date()])
  }
  remove(userId: string, id: string): Promise<number> {
    const sql = `delete from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`
    return this.db.exec(sql, [userId, id])
  }
  count(userId: string): Promise<number> {
    const sql = `select count(*) as total from ${this.table} where ${this.userId} = ${this.db.param(1)}`
    return this.db.query<any>(sql, [userId]).then((rows) => {
      return rows[0]["total"] as number
    })
  }
}
// tslint:disable-next-line:max-classes-per-file
export class ArrayRepository<ID, T> {
  constructor(public select: <K>(sql: string, args?: any[]) => Promise<K[]>, public execute: (sql: string, args?: any[]) => Promise<number>, public table: string, public field: string, id?: string) {
    this.id = (id && id.length > 0 ? id : 'id');
    this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
  }
  id: string;
  load(id: ID): Promise<T[]|null> {
    return this.select<SavedItem<ID, T>>(`select ${this.id} as id, ${this.field} as items from ${this.table} where ${this.id} = $1`, [id]).then(objs => {
      if (objs && objs.length > 0) {
        if (objs[0].items && objs[0].items.length > 0) {
          return objs[0].items;
        } else {
          return [];
        }
      } else {
        return null;
      }
    });
  }
  insert(id: ID, arr: T[]): Promise<number> {
    const sql = `insert into ${this.table}(${this.id}, ${this.field}) values ($1, $2)`;
    return this.execute(sql, [id, arr]);
  }
  update(id: ID, arr: T[]): Promise<number> {
    const sql = `update ${this.table} set ${this.field} = $1 where ${this.id} = $2`;
    return this.execute(sql, [arr, id]);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class FollowService<ID> {
  constructor(
    public execute: (statements: Statement[], firstSuccess?: boolean, ctx?: any) => Promise<number>,
    public followingTable: string,
    public id: string,
    public following: string,
    public followerTable: string,
    public followerId: string,
    public follower: string,
    public infoTable: string,
    public infoId: string,
    public followerCount: string,
    public followingCount: string) {
    this.follow = this.follow.bind(this);
    this.unfollow = this.unfollow.bind(this);
    this.checkFollow = this.checkFollow.bind(this);
  }
  follow(id: ID, target: ID): Promise<number | undefined> {
    const double = `select * from ${this.followingTable} where ${this.id} = $1 and ${this.following}=$2 `;
    const query1 = `insert into ${this.followingTable}(${this.id}, ${this.following}) values ($1, $2)`;
    const query2 = `insert into ${this.followerTable}(${this.followerId}, ${this.follower}) values ($1, $2)`;
    const query3 = `
            insert into ${this.infoTable}(${this.infoId},${this.followingCount}, ${this.followerCount})
            values ($1, 1, 0)
            on conflict (${this.infoId}) do update set ${this.followingCount} =   ${this.infoTable}.${this.followingCount} + 1`;
    const query4 = `
            insert into ${this.infoTable}(${this.infoId},${this.followingCount}, ${this.followerCount})
            values ($1, 0, 1)
            on conflict (${this.infoId}) do update set ${this.followerCount} = ${this.infoTable}.${this.followerCount} + 1`;
    return this.execute([{ query: double, params: [id, target] }], true).then(data => {
      if (!data) {
        return this.execute([
          { query: query1, params: [id, target] },
          { query: query2, params: [target, id] },
          { query: query3, params: [id] },
          { query: query4, params: [target] },
        ], true);
      } else {
        return Promise.resolve(0);
      }
    });
  }
  unfollow(id: ID, target: ID): Promise<number> {
    const query1 = `delete from ${this.followingTable} where ${this.id} = $1 and ${this.following}=$2`;
    const query2 = `delete from ${this.followerTable} where ${this.followerId} = $1 and ${this.follower}=$2`;
    const query3 = `
            update ${this.infoTable}
            set ${this.followingCount} = ${this.followingCount} -1
            where ${this.infoId} = $1`;
    const query4 = `
            update ${this.infoTable}
            set ${this.followerCount} =${this.followerCount} - 1
            where ${this.infoId} = $1`;
    return this.execute([
      { query: query1, params: [id, target] },
      { query: query2, params: [target, id] },
      { query: query3, params: [id] },
      { query: query4, params: [target] },
    ], true);
  }
  checkFollow(id: ID, target: ID): Promise<number> {
    const check = `select ${this.id} from ${this.followingTable} where ${this.id} = $1 and ${this.following} = $2 `;
    return this.execute([{ query: check, params: [id, target] }], true);
  }
}
// tslint:disable-next-line:max-classes-per-file
export class FollowRepository<ID> extends FollowService<ID> {
}

export interface Reaction {
  id: string;
  author: string;
  reaction: number;
}
export interface DB2 {
  execBatch(statements: Statement[], firstSuccess?: boolean, ctx?: any): Promise<number>;
  query<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T[]>;
}
// tslint:disable-next-line:max-classes-per-file
export class ReactionService<ID> {
  constructor(
    public db: DB2,
    public userreactionTable: string,
    public id: string,
    public author: string,
    public reaction: string,
    public prefix: string,
    public suffix: string,
    public userinfoTable: string,
    public infoId: string,
    public reactioncount: string,
  ) {
    this.react = this.react.bind(this);
    this.unreact = this.unreact.bind(this);
    this.checkReaction = this.checkReaction.bind(this);
  }
  react(id: ID, author: ID, reaction: string): Promise<number> {
    const sql = `select reaction from ${this.userreactionTable} where ${this.id} = $1 and ${this.author} = $2`;
    return this.db.query<Reaction>(sql, [id, author]).then(r => {
      if (r.length <= 0) {
        const obj: any = {
          l1: '0',
          l2: '0',
          l3: '0',
        };
        obj['l' + reaction] = '1';
        const query1 = `insert into ${this.userreactionTable}(${this.id},${this.author},${this.reaction}) values ($1, $2, $3)`;
        const query2 = `insert into ${this.userinfoTable}(${this.infoId},${this.prefix}1${this.suffix},${this.prefix}2${this.suffix},${this.prefix}3${this.suffix},${this.reactioncount}) values ($1, ${obj['l1']}, ${obj['l2']},${obj['l3']},1)
          on conflict (${this.id}) do update set ${this.prefix}1${this.suffix} = ${this.userinfoTable}.${this.prefix}1${this.suffix} + ${obj['l1']}, ${this.prefix}2${this.suffix} = ${this.userinfoTable}.${this.prefix}2${this.suffix} + ${obj['l2']}, ${this.prefix}3${this.suffix} = ${this.userinfoTable}.${this.prefix}3${this.suffix} + ${obj['l3']}, ${this.reactioncount}=${this.reactioncount} + 1`;
        const s1: Statement = { query: query1, params: [id, author, reaction] };
        const s2: Statement = { query: query2, params: [id] };
        return this.db.execBatch([s1, s2]);
      } else {
        const query1 = `update ${this.userreactionTable} set ${this.reaction} = $1 where ${this.id} = $2 and ${this.author} = $3`;
        const query2 =
          `update ${this.userinfoTable} set ${this.prefix}${r[0].reaction}${this.suffix} = ${this.prefix}${r[0].reaction}${this.suffix} - 1, ${this.prefix}${reaction}${this.suffix} = ${this.prefix}${reaction}${this.suffix} + 1
           where ${this.infoId} = $1`;
        const s1: Statement = { query: query1, params: [reaction, id, author] };
        const s2: Statement = { query: query2, params: [id] };
        return this.db.execBatch([s1, s2], true);
      }
    });
  }
  unreact(id: ID, author: ID, reaction: string): Promise<number> {
    const query1 = `delete from ${this.userreactionTable} where ${this.id} = $1 and ${this.author} = $2 and ${this.reaction} = $3`;
    const query2 =
       `update ${this.userinfoTable} set ${this.prefix}${reaction}${this.suffix} = ${this.prefix}${reaction}${this.suffix} - 1, ${this.reactioncount} = ${this.reactioncount} - 1
        where ${this.infoId} = $1`;
    const s1: Statement = { query: query1, params: [id, author, reaction] };
    const s2: Statement = { query: query2, params: [id] };
    return this.db.execBatch([s1, s2], true);
  }
  checkReaction(id: ID, author: ID): Promise<number> {
    const sql = `select reaction from ${this.userreactionTable} where ${this.id} = $1 and ${this.author} = $2`;
    return this.db.query<Reaction>(sql, [id, author]).then(r => {
      if (r && r.length > 0) {
        return r[0].reaction;
      } else {
        return -1;
      }
    });
  }
}
// tslint:disable-next-line:max-classes-per-file
export class ReactService<ID> extends ReactionService<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class ReactRepository<ID> extends ReactionService<ID> {
}
// tslint:disable-next-line:max-classes-per-file
export class ReactionRepository<ID> extends ReactionService<ID> {
}
