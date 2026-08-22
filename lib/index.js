var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
import { Pool } from "pg";
export function param(i) {
  return "$" + i;
}
export function params(length, from) {
  if (from == null) {
    from = 0;
  }
  const ps = [];
  for (let i = 1; i <= length; i++) {
    ps.push(param(i + from));
  }
  return ps;
}
export function metadata(attrs) {
  const mp = {};
  const ks = Object.keys(attrs);
  const ats = [];
  const bools = [];
  const fields = [];
  const m = { keys: ats, fields };
  let isMap = false;
  for (const k of ks) {
    const attr = attrs[k];
    attr.name = k;
    if (attr.key) {
      ats.push(attr);
    }
    if (!attr.ignored) {
      fields.push(k);
    }
    if (attr.type === "boolean") {
      bools.push(attr);
    }
    if (attr.version) {
      m.version = k;
    }
    const field = attr.column ? attr.column : k;
    const s = field.toLowerCase();
    if (s !== k) {
      mp[s] = k;
      isMap = true;
    }
  }
  if (isMap) {
    m.map = mp;
  }
  if (bools.length > 0) {
    m.bools = bools;
  }
  return m;
}
export function buildToSave(obj, table, attrs, buildParam, i) {
  if (i === undefined) {
    i = 1;
  }
  if (!buildParam) {
    buildParam = param;
  }
  const meta = metadata(attrs);
  const pks = meta.keys;
  let isUpdate = true;
  const ks = Object.keys(attrs);
  const cols = [];
  const values = [];
  const args = [];
  const o = obj;
  for (const k of pks) {
    if (k.name) {
      let v = o[k.name];
      if (v == null) {
        isUpdate = false;
      }
    }
  }
  for (const k of ks) {
    const attr = attrs[k];
    if (!attr) {
      continue;
    }
    let v = o[k];
    if (v == null) {
      v = attr.default;
    }
    if (v != null && !attr.ignored && !attr.noinsert) {
      const field = attr.column ? attr.column : k;
      cols.push(field);
      if (attr.version) {
        values.push(`${1}`);
      }
      else {
        if (v === "") {
          values.push(`''`);
        }
        else if (typeof v === "number") {
          values.push(toString(v));
        }
        else if (typeof v === "boolean") {
          const p = buildParam(i++);
          values.push(p);
          if (v === true) {
            const v2 = attr.true !== undefined ? attr.true : true;
            args.push(v2);
          }
          else {
            const v2 = attr.false !== undefined ? attr.false : false;
            args.push(v2);
          }
        }
        else {
          const p = buildParam(i++);
          values.push(p);
          args.push(v);
        }
      }
    }
  }
  if (isUpdate === false || pks.length === 0) {
    if (cols.length === 0) {
      return { query: "", params: args };
    }
    else {
      const q = `insert into ${table}(${cols.join(",")})values(${values.join(",")})`;
      return { query: q, params: args };
    }
  }
  else {
    const colSet = [];
    for (const k of ks) {
      const v = o[k];
      if (v !== undefined) {
        const attr = attrs[k];
        if (attr && !attr.key && !attr.ignored && !attr.noupdate) {
          const field = attr.column ? attr.column : k;
          let x;
          if (v === null) {
            x = "null";
          }
          else if (v === "") {
            x = `''`;
          }
          else if (typeof v === "number") {
            x = toString(v);
          }
          else if (typeof v === "boolean") {
            x = buildParam(i++);
            if (v === true) {
              const v2 = attr.true !== undefined ? attr.true : true;
              args.push(v2);
            }
            else {
              const v2 = attr.false !== undefined ? attr.false : false;
              args.push(v2);
            }
          }
          else {
            x = buildParam(i++);
            args.push(v);
          }
          colSet.push(`${field}=${x}`);
        }
      }
    }
    const fks = [];
    for (const pk of pks) {
      const field = pk.column ? pk.column : pk.name;
      if (field) {
        fks.push(field);
      }
    }
    if (colSet.length === 0) {
      const q = `insert into ${table}(${cols.join(",")})values(${values.join(",")}) on conflict(${fks.join(",")}) do nothing`;
      return { query: q, params: args };
    }
    else {
      const q = `insert into ${table}(${cols.join(",")})values(${values.join(",")}) on conflict(${fks.join(",")}) do update set ${colSet.join(",")}`;
      return { query: q, params: args };
    }
  }
}
export function buildToSaveBatch(objs, table, attrs, buildParam) {
  if (!buildParam) {
    buildParam = param;
  }
  const sts = [];
  const meta = metadata(attrs);
  const pks = meta.keys;
  const fks = [];
  for (const pk of pks) {
    const field = pk.column ? pk.column : pk.name;
    if (field) {
      fks.push(field);
    }
  }
  const ks = Object.keys(attrs);
  for (const obj of objs) {
    let i = 1;
    const cols = [];
    const values = [];
    const args = [];
    let isUpdate = true;
    const o = obj;
    for (const k of pks) {
      if (k.name) {
        let v = o[k.name];
        if (v == null) {
          isUpdate = false;
        }
      }
    }
    for (const k of ks) {
      const attr = attrs[k];
      if (!attr) {
        continue;
      }
      let v = o[k];
      if (v == null) {
        v = attr.default;
      }
      if (v != null && !attr.ignored && !attr.noinsert) {
        const field = attr.column ? attr.column : k;
        cols.push(field);
        if (attr.version) {
          values.push(`${1}`);
        }
        else {
          if (v === "") {
            values.push(`''`);
          }
          else if (typeof v === "number") {
            values.push(toString(v));
          }
          else if (typeof v === "boolean") {
            const p = buildParam(i++);
            values.push(p);
            if (v === true) {
              const v2 = attr.true !== undefined ? attr.true : true;
              args.push(v2);
            }
            else {
              const v2 = attr.false !== undefined ? attr.false : false;
              args.push(v2);
            }
          }
          else {
            const p = buildParam(i++);
            values.push(p);
            args.push(v);
          }
        }
      }
    }
    if (isUpdate === false || pks.length === 0) {
      if (cols.length > 0) {
        const q = `insert into ${table}(${cols.join(",")})values(${values.join(",")})`;
        const smt = { query: q, params: args };
        sts.push(smt);
      }
    }
    else {
      const colSet = [];
      for (const k of ks) {
        const v = o[k];
        if (v !== undefined) {
          const attr = attrs[k];
          if (attr && !attr.key && !attr.ignored && !attr.noupdate) {
            const field = attr.column ? attr.column : k;
            let x;
            if (v === null) {
              x = "null";
            }
            else if (v === "") {
              x = `''`;
            }
            else if (typeof v === "number") {
              x = toString(v);
            }
            else if (typeof v === "boolean") {
              x = buildParam(i++);
              if (v === true) {
                const v2 = attr.true !== undefined ? attr.true : true;
                args.push(v2);
              }
              else {
                const v2 = attr.false !== undefined ? attr.false : false;
                args.push(v2);
              }
            }
            else {
              x = buildParam(i++);
              args.push(v);
            }
            colSet.push(`${field}=${x}`);
          }
        }
      }
      if (colSet.length === 0) {
        const q = `insert into ${table}(${cols.join(",")})values(${values.join(",")}) on conflict(${fks.join(",")}) do nothing`;
        const smt = { query: q, params: args };
        sts.push(smt);
      }
      else {
        const q = `insert into ${table}(${cols.join(",")})values(${values.join(",")}) on conflict(${fks.join(",")}) do update set ${colSet.join(",")}`;
        const smt = { query: q, params: args };
        sts.push(smt);
      }
    }
  }
  return sts;
}
export function toString(v) {
  if (v === v && v !== Infinity && v !== -Infinity) {
    return "" + v;
  }
  return "null";
}
export class resource {
}
export function createPool(conf) {
  const pool = new Pool(conf);
  return pool;
}
export class PoolManager {
  constructor(pool) {
    this.pool = pool;
    this.driver = "postgres";
    this.param = this.param.bind(this);
    this.execute = this.execute.bind(this);
    this.executeBatch = this.executeBatch.bind(this);
    this.query = this.query.bind(this);
    this.queryOne = this.queryOne.bind(this);
    this.executeScalar = this.executeScalar.bind(this);
    this.count = this.count.bind(this);
  }
  param(i) {
    return "$" + i;
  }
  beginTransaction() {
    return __awaiter(this, void 0, void 0, function* () {
      const client = yield this.pool.connect();
      try {
        yield client.query("begin");
        const clientManager = new PoolClientManager(client);
        return clientManager;
      }
      catch (err) {
        try {
          client.release();
        }
        catch (er2) {
          console.error("error when release PoolClient in beginTransaction. Details: " + JSON.stringify(er2));
        }
        throw err;
      }
    });
  }
  execute(sql, args) {
    return execute(this.pool, sql, args);
  }
  executeBatch(statements, firstSuccess) {
    return executeBatch(this.pool, statements, firstSuccess);
  }
  query(sql, args, m, bools) {
    return query(this.pool, sql, args, m, bools);
  }
  queryOne(sql, args, m, bools) {
    return queryOne(this.pool, sql, args, m, bools);
  }
  executeScalar(sql, args) {
    return executeScalar(this.pool, sql, args);
  }
  count(sql, args) {
    return count(this.pool, sql, args);
  }
}
export class PoolClientManager {
  constructor(client) {
    this.client = client;
    this.driver = "postgres";
    this.param = this.param.bind(this);
    this.execute = this.execute.bind(this);
    this.executeBatch = this.executeBatch.bind(this);
    this.query = this.query.bind(this);
    this.queryOne = this.queryOne.bind(this);
    this.executeScalar = this.executeScalar.bind(this);
    this.count = this.count.bind(this);
  }
  param(i) {
    return "$" + i;
  }
  commit() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.client.query("commit");
      this.client.release();
    });
  }
  rollback() {
    return __awaiter(this, void 0, void 0, function* () {
      yield this.client.query("rollback");
      this.client.release();
    });
  }
  execute(sql, args) {
    return execute(this.client, sql, args);
  }
  executeBatch(statements, firstSuccess) {
    return executeBatchWithClient(this.client, statements, firstSuccess);
  }
  query(sql, args, m, bools) {
    return query(this.client, sql, args, m, bools);
  }
  queryOne(sql, args, m, bools) {
    return queryOne(this.client, sql, args, m, bools);
  }
  executeScalar(sql, args) {
    return executeScalar(this.client, sql, args);
  }
  count(sql, args) {
    return count(this.client, sql, args);
  }
}
function buildError(err) {
  if (err.code === "23505") {
    err.error = "duplicate";
  }
  return err;
}
export function execute(client, sql, args) {
  const p = toArray(args);
  return new Promise((resolve, reject) => {
    return client.query(sql, p, (err, results) => {
      if (err) {
        buildError(err);
        return reject(err);
      }
      else {
        return resolve(results.rowCount ? results.rowCount : 0);
      }
    });
  });
}
export function query(client, sql, args, m, bools) {
  const p = toArray(args);
  return new Promise((resolve, reject) => {
    return client.query(sql, p, (err, results) => {
      if (err) {
        return reject(err);
      }
      else {
        return resolve(handleResults(results.rows, m, bools));
      }
    });
  });
}
export function queryOne(client, sql, args, m, bools) {
  return query(client, sql, args, m, bools).then((r) => {
    return r && r.length > 0 ? r[0] : null;
  });
}
export function executeScalar(client, sql, args) {
  return queryOne(client, sql, args).then((r) => {
    if (!r) {
      return null;
    }
    else {
      const keys = Object.keys(r);
      return r[keys[0]];
    }
  });
}
export function count(client, sql, args) {
  return executeScalar(client, sql, args).then((res) => (res !== null ? res : 0));
}
export function executeBatch(pool, statements, firstSuccess) {
  if (!statements || statements.length === 0) {
    return Promise.resolve(0);
  }
  else if (statements.length === 1) {
    return execute(pool, statements[0].query, toArray(statements[0].params));
  }
  return pool.connect().then((client) => {
    return executeBatchWithClientTx(client, statements, firstSuccess);
  });
}
export function executeBatchWithClientTx(client, statements, firstSuccess) {
  return __awaiter(this, void 0, void 0, function* () {
    if (!statements || statements.length === 0) {
      return Promise.resolve(0);
    }
    else if (statements.length === 1) {
      return execute(client, statements[0].query, statements[0].params);
    }
    let c = 0;
    if (firstSuccess) {
      try {
        yield client.query("begin");
        const result0 = yield client.query(statements[0].query, toArray(statements[0].params));
        if (result0 && result0.rowCount) {
          c = result0.rowCount;
          const l = statements.length;
          for (let j = 1; j < l; j++) {
            const item = statements[j];
            const res = yield client.query(item.query, toArray(item.params));
            if (res.rowCount) {
              c += res.rowCount;
            }
          }
        }
        yield client.query("commit");
        client.release();
        return c;
      }
      catch (e) {
        yield client.query("rollback");
        client.release();
        throw e;
      }
    }
    else {
      try {
        yield client.query("begin");
        const l = statements.length;
        for (let j = 0; j < l; j++) {
          const item = statements[j];
          const res = yield client.query(item.query, toArray(item.params));
          if (res.rowCount) {
            c += res.rowCount;
          }
        }
        yield client.query("commit");
        client.release();
        return c;
      }
      catch (e) {
        yield client.query("rollback");
        client.release();
        throw e;
      }
    }
  });
}
export function executeBatchWithClient(client, statements, firstSuccess) {
  return __awaiter(this, void 0, void 0, function* () {
    if (!statements || statements.length === 0) {
      return Promise.resolve(0);
    }
    else if (statements.length === 1) {
      return execute(client, statements[0].query, statements[0].params);
    }
    let c = 0;
    if (firstSuccess) {
      const result0 = yield client.query(statements[0].query, toArray(statements[0].params));
      if (result0 && result0.rowCount) {
        c = result0.rowCount;
        const l = statements.length;
        for (let j = 1; j < l; j++) {
          const item = statements[j];
          const res = yield client.query(item.query, toArray(item.params));
          if (res.rowCount) {
            c += res.rowCount;
          }
        }
      }
      return c;
    }
    else {
      const l = statements.length;
      for (let j = 0; j < l; j++) {
        const item = statements[j];
        const res = yield client.query(item.query, toArray(item.params));
        if (res.rowCount) {
          c += res.rowCount;
        }
      }
      return c;
    }
  });
}
export function save(client, obj, table, attrs, buildParam) {
  const s = buildToSave(obj, table, attrs, buildParam);
  if (!s.query) {
    return Promise.resolve(-1);
  }
  if (typeof client === "function") {
    return client(s.query, s.params);
  }
  else {
    return execute(client, s.query, s.params);
  }
}
export function saveBatch(pool, objs, table, attrs, buildParam) {
  const s = buildToSaveBatch(objs, table, attrs, buildParam);
  if (s.length === 0) {
    return Promise.resolve(0);
  }
  else {
    return executeBatch(pool, s);
  }
}
export function saveBatchWithClient(client, objs, table, attrs, buildParam) {
  const s = buildToSaveBatch(objs, table, attrs, buildParam);
  if (s.length === 0) {
    return Promise.resolve(0);
  }
  else {
    return executeBatchWithClientTx(client, s);
  }
}
export function toArray(arr) {
  if (!arr || arr.length === 0) {
    return [];
  }
  const p = [];
  const l = arr.length;
  for (let i = 0; i < l; i++) {
    if (arr[i] === undefined || arr[i] == null) {
      p.push(null);
    }
    else {
      if (typeof arr[i] === "object") {
        if (arr[i] instanceof Date) {
          p.push(arr[i]);
        }
        else {
          if (resource.string) {
            const s = JSON.stringify(arr[i]);
            p.push(s);
          }
          else {
            p.push(arr[i]);
          }
        }
      }
      else {
        p.push(arr[i]);
      }
    }
  }
  return p;
}
export function handleResults(r, m, bools) {
  if (m) {
    const res = mapArray(r, m);
    if (bools && bools.length > 0) {
      return handleBool(res, bools);
    }
    else {
      return res;
    }
  }
  else {
    if (bools && bools.length > 0) {
      return handleBool(r, bools);
    }
    else {
      return r;
    }
  }
}
export function handleBool(objs, bools) {
  if (!bools || bools.length === 0 || !objs) {
    return objs;
  }
  for (const obj of objs) {
    const o = obj;
    for (const field of bools) {
      if (field.name) {
        const v = o[field.name];
        if (typeof v !== "boolean" && v != null && v !== undefined) {
          const b = field.true;
          if (b == null || b === undefined) {
            o[field.name] = "true" == v || "1" == v || "t" == v || "y" == v || "on" == v;
          }
          else {
            o[field.name] = v == b ? true : false;
          }
        }
      }
    }
  }
  return objs;
}
export function map(obj, m) {
  if (!m) {
    return obj;
  }
  const mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return obj;
  }
  const obj2 = {};
  const keys = Object.keys(obj);
  for (const key of keys) {
    let k0 = m[key];
    if (!k0) {
      k0 = key;
    }
    obj2[k0] = obj[key];
  }
  return obj2;
}
export function mapArray(results, m) {
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
    const obj = results[i];
    const obj2 = {};
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
export function getFields(fields, all) {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  const ext = [];
  if (all) {
    for (const s of fields) {
      if (all.includes(s)) {
        ext.push(s);
      }
    }
    if (ext.length === 0) {
      return undefined;
    }
    else {
      return ext;
    }
  }
  else {
    return fields;
  }
}
export function buildFields(fields, all) {
  const s = getFields(fields, all);
  if (!s || s.length === 0) {
    return "*";
  }
  else {
    return s.join(",");
  }
}
export function getMapField(name, mp) {
  if (!mp) {
    return name;
  }
  const x = mp[name];
  if (!x) {
    return name;
  }
  if (typeof x === "string") {
    return x;
  }
  return name;
}
export function isEmpty(s) {
  return !(s && s.length > 0);
}
export class PostgreSQLWriter {
  constructor(pool, table, attributes, oneIfSuccess, map, buildParam) {
    this.pool = pool;
    this.table = table;
    this.attributes = attributes;
    this.oneIfSuccess = oneIfSuccess;
    this.map = map;
    this.write = this.write.bind(this);
    this.param = buildParam ? buildParam : param;
  }
  write(obj) {
    if (!obj) {
      return Promise.resolve(0);
    }
    let obj2 = obj;
    if (this.map) {
      obj2 = this.map(obj);
    }
    const stmt = buildToSave(obj2, this.table, this.attributes, this.param);
    if (stmt.query) {
      if (this.oneIfSuccess) {
        return execute(this.pool, stmt.query, stmt.params).then((ct) => (ct > 0 ? 1 : 0));
      }
      else {
        return execute(this.pool, stmt.query, stmt.params);
      }
    }
    else {
      return Promise.resolve(0);
    }
  }
}
export class PostgreSQLStreamWriter {
  constructor(pool, table, attributes, size = 5000, map, buildParam) {
    this.pool = pool;
    this.table = table;
    this.attributes = attributes;
    this.size = size;
    this.map = map;
    this.list = [];
    this.write = this.write.bind(this);
    this.flush = this.flush.bind(this);
    this.param = buildParam ? buildParam : param;
  }
  write(obj) {
    if (!obj) {
      return Promise.resolve(0);
    }
    let obj2 = obj;
    if (this.map) {
      obj2 = this.map(obj);
      this.list.push(obj2);
    }
    else {
      this.list.push(obj);
    }
    if (this.list.length < this.size) {
      return Promise.resolve(0);
    }
    else {
      return this.flush();
    }
  }
  flush() {
    if (!this.list || this.list.length === 0) {
      return Promise.resolve(0);
    }
    else {
      const total = this.list.length;
      const stmt = buildToSaveBatch(this.list, this.table, this.attributes, this.param);
      if (stmt.length > 0) {
        return executeBatch(this.pool, stmt).then((r) => {
          this.list = [];
          return total;
        });
      }
      else {
        this.list = [];
        return Promise.resolve(0);
      }
    }
  }
}
export class PostgreSQLBatchWriter {
  constructor(pool, table, attributes, map, buildParam) {
    this.pool = pool;
    this.table = table;
    this.attributes = attributes;
    this.map = map;
    this.write = this.write.bind(this);
    this.param = buildParam ? buildParam : param;
  }
  write(objs) {
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
    const stmts = buildToSaveBatch(list, this.table, this.attributes, this.param);
    if (stmts.length > 0) {
      return executeBatch(this.pool, stmts);
    }
    else {
      return Promise.resolve(0);
    }
  }
}
export class PostgreSQLChecker {
  constructor(pool, service, timeout = 4500) {
    this.pool = pool;
    this.timeout = timeout;
    this.service = service || "postgresql";
  }
  name() {
    return this.service;
  }
  build(data, error) {
    if (error) {
      return Object.assign({ name: this.name(), status: "DOWN", error: error.message }, data);
    }
    return Object.assign({ name: this.name(), status: "UP" }, data);
  }
  check() {
    return __awaiter(this, void 0, void 0, function* () {
      const start = Date.now();
      let client;
      try {
        client = yield this.withTimeout(this.pool.connect(), this.timeout, "Connection timeout");
        yield this.withTimeout(client.query("SELECT 1"), this.timeout, "Query timeout");
        return this.build({
          responseTime: Date.now() - start,
        }, null);
      }
      catch (err) {
        return this.build({
          responseTime: Date.now() - start,
        }, err);
      }
      finally {
        client === null || client === void 0 ? void 0 : client.release();
      }
    });
  }
  withTimeout(promise, timeout, message) {
    return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeout))]);
  }
}
export class StringAdapter {
  constructor(table, field, query, execute) {
    this.table = table;
    this.field = field;
    this.query = query;
    this.execute = execute;
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
  }
  load(keyword, max) {
    const m = max && max > 0 ? max : 20;
    const k = keyword + "%";
    return this.query(`select ${this.field} from ${this.table} where ${this.field} ilike $1 order by ${this.field} limit ${m}`, [k]).then((res) => res.map((i) => i[this.field]));
  }
  save(values) {
    if (!values || values.length === 0) {
      return Promise.resolve(0);
    }
    else {
      const arr = [];
      const ps = [];
      let i = 1;
      for (const v of values) {
        if (v && v.length > 0) {
          arr.push(`($${i++})`);
          ps.push(v);
        }
      }
      if (arr.length === 0) {
        return Promise.resolve(0);
      }
      else {
        const sql = `insert into ${this.table}(${this.field}) values ${arr.join(",")} on conflict(${this.field}) do nothing`;
        return this.execute(sql, ps);
      }
    }
  }
}
export const StringRepository = StringAdapter;
export class CodeRepository {
  constructor(db, table, id, expiredAt, passcode) {
    this.db = db;
    this.table = table;
    this.id = id ? id : "id";
    this.code = passcode ? passcode : "code";
    this.expiredAt = expiredAt ? expiredAt : "expiredat";
    this.load = this.load.bind(this);
    this.delete = this.delete.bind(this);
    this.save = this.save.bind(this);
  }
  save(id, passcode, expiredAt) {
    const sql = `
    insert into ${this.table} (${this.id}, ${this.code}, ${this.expiredAt})
    values (${this.db.param(1)}, ${this.db.param(2)}, ${this.db.param(3)})
    on conflict (${this.id})
    do update set ${this.code} = ${this.db.param(4)}, ${this.expiredAt} = ${this.db.param(5)}`;
    return this.db.execute(sql, [id, passcode, expiredAt, passcode, expiredAt]);
  }
  load(id) {
    const sql = `select ${this.code} as code, ${this.expiredAt} as expiredat from ${this.table} where ${this.id} = ${this.db.param(1)}`;
    return this.db.query(sql, [id]).then((v) => {
      if (!v || v.length === 0) {
        return null;
      }
      else {
        const obj = {};
        obj.code = v[0]["code"];
        obj.expiredAt = v[0]["expiredat"];
        return obj;
      }
    });
  }
  delete(id) {
    const sql = `delete from ${this.table} where ${this.id} = ${this.db.param(1)}`;
    return this.db.execute(sql, [id]);
  }
}
export class PasscodeRepository extends CodeRepository {
}
export class SqlPasscodeRepository extends CodeRepository {
}
export class SqlCodeRepository extends CodeRepository {
}
export class UrlQuery {
  constructor(queryF, table, url, id, name, displayName) {
    this.queryF = queryF;
    this.table = table;
    this.id = id && id.length > 0 ? id : "id";
    this.url = url && url.length > 0 ? url : "url";
    this.name = name && name.length > 0 ? name : "name";
    this.displayName = displayName && displayName.length > 0 ? displayName : "displayname";
    this.load = this.load.bind(this);
    this.query = this.query.bind(this);
  }
  load(ids) {
    return this.query(ids);
  }
  query(ids) {
    if (!ids || ids.length === 0) {
      const s = [];
      return Promise.resolve(s);
    }
    const ps = [];
    const pv = [];
    const l = ids.length;
    for (let i = 1; i <= l; i++) {
      ps.push(ids[i - 1]);
      pv.push(param(i));
    }
    const sql = `select ${this.id} as id, ${this.url} as url, case when ${this.displayName} is not null then ${this.displayName} else ${this.name} end as name from ${this.table} where ${this.id} in (${pv.join(",")}) and ${this.url} is not null order by ${this.id}`;
    return this.queryF(sql, ps);
  }
}
export function useUrlQuery(queryF, table, url, id, name, displayName) {
  const q = new UrlQuery(queryF, table, url, id, name, displayName);
  return q.query;
}
export class SqlSavedRepository {
  constructor(db, table, userId, id, saveAt) {
    this.db = db;
    this.table = table;
    this.userId = userId;
    this.id = id;
    this.saveAt = saveAt;
    this.isSaved = this.isSaved.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
    this.count = this.count.bind(this);
  }
  isSaved(userId, id) {
    const sql = `select ${this.userId} from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`;
    return this.db.query(sql, [userId, id]).then((rows) => {
      return rows.length > 0 ? true : false;
    });
  }
  save(userId, id) {
    const sql = `insert into ${this.table} (${this.userId}, ${this.id}, ${this.saveAt}) values (${this.db.param(1)}, ${this.db.param(2)}, ${this.db.param(3)}) on conflict (${this.userId}, ${this.id}) do nothing`;
    return this.db.execute(sql, [userId, id, new Date()]);
  }
  remove(userId, id) {
    const sql = `delete from ${this.table} where ${this.userId} = ${this.db.param(1)} and ${this.id} = ${this.db.param(2)}`;
    return this.db.execute(sql, [userId, id]);
  }
  count(userId) {
    const sql = `select count(*) as total from ${this.table} where ${this.userId} = ${this.db.param(1)}`;
    return this.db.query(sql, [userId]).then((rows) => {
      return rows[0]["total"];
    });
  }
}
export class ArrayRepository {
  constructor(select, execute, table, field, id) {
    this.select = select;
    this.execute = execute;
    this.table = table;
    this.field = field;
    this.id = id && id.length > 0 ? id : "id";
    this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
  }
  load(id) {
    return this.select(`select ${this.id} as id, ${this.field} as items from ${this.table} where ${this.id} = $1`, [id]).then((objs) => {
      if (objs && objs.length > 0) {
        if (objs[0].items && objs[0].items.length > 0) {
          return objs[0].items;
        }
        else {
          return [];
        }
      }
      else {
        return null;
      }
    });
  }
  insert(id, arr) {
    const sql = `insert into ${this.table}(${this.id}, ${this.field}) values ($1, $2)`;
    return this.execute(sql, [id, arr]);
  }
  update(id, arr) {
    const sql = `update ${this.table} set ${this.field} = $1 where ${this.id} = $2`;
    return this.execute(sql, [arr, id]);
  }
}
export class FollowUserRepository {
  constructor(execute, followerTable, followerId, follower, followed_at, followingTable, id, following, following_at, infoTable, infoId, followerCount, followingCount) {
    this.execute = execute;
    this.followerTable = followerTable;
    this.followerId = followerId;
    this.follower = follower;
    this.followed_at = followed_at;
    this.followingTable = followingTable;
    this.id = id;
    this.following = following;
    this.following_at = following_at;
    this.infoTable = infoTable;
    this.infoId = infoId;
    this.followerCount = followerCount;
    this.followingCount = followingCount;
    this.follow = this.follow.bind(this);
    this.unfollow = this.unfollow.bind(this);
    this.checkFollow = this.checkFollow.bind(this);
  }
  follow(id, target) {
    const now = new Date();
    const query1 = `insert into ${this.followerTable}(${this.followerId}, ${this.follower}, ${this.followed_at}) values ($1, $2, $3) on conflict (${this.followerId}, ${this.follower}) do nothing`;
    const query2 = `insert into ${this.followingTable}(${this.id}, ${this.following}, ${this.following_at}) values ($1, $2, $3) on conflict (${this.id}, ${this.following}) do nothing`;
    const query3 = `
      insert into ${this.infoTable}(${this.infoId},${this.followerCount},${this.followingCount})
      values ($1, 1, 0)
      on conflict (${this.infoId}) do update set ${this.followerCount} = ${this.infoTable}.${this.followerCount} + 1`;
    const query4 = `
      insert into ${this.infoTable}(${this.infoId},${this.followerCount},${this.followingCount})
      values ($1, 0, 1)
      on conflict (${this.infoId}) do update set ${this.followingCount} = ${this.infoTable}.${this.followingCount} + 1`;
    return this.execute([
      { query: query1, params: [target, id, now] },
      { query: query2, params: [id, target, now] },
      { query: query3, params: [target] },
      { query: query4, params: [id] },
    ], true);
  }
  unfollow(id, target) {
    const query1 = `delete from ${this.followerTable} where ${this.followerId} = $1 and ${this.follower}=$2`;
    const query2 = `delete from ${this.followingTable} where ${this.id} = $1 and ${this.following}=$2`;
    const query3 = `
    update ${this.infoTable}
    set ${this.followerCount} = ${this.followerCount} - 1
    where ${this.infoId} = $1`;
    const query4 = `
    update ${this.infoTable}
    set ${this.followingCount} = ${this.followingCount} -1
    where ${this.infoId} = $1`;
    return this.execute([
      { query: query1, params: [target, id] },
      { query: query2, params: [id, target] },
      { query: query3, params: [target] },
      { query: query4, params: [id] },
    ], true);
  }
  checkFollow(id, target) {
    const check = `select ${this.id} from ${this.followerTable} where ${this.id} = $1 and ${this.follower} = $2 `;
    return this.execute([{ query: check, params: [target, id] }]).then((count) => {
      return count > 0 ? true : false;
    });
  }
}
export class SqlFollowRepository {
  constructor(execute, followerTable, followerId, follower, followed_at, followingTable, id, following, following_at, infoTable, infoId, followerCount) {
    this.execute = execute;
    this.followerTable = followerTable;
    this.followerId = followerId;
    this.follower = follower;
    this.followed_at = followed_at;
    this.followingTable = followingTable;
    this.id = id;
    this.following = following;
    this.following_at = following_at;
    this.infoTable = infoTable;
    this.infoId = infoId;
    this.followerCount = followerCount;
    this.follow = this.follow.bind(this);
    this.unfollow = this.unfollow.bind(this);
    this.checkFollow = this.checkFollow.bind(this);
  }
  follow(id, target) {
    const now = new Date();
    const query1 = `insert into ${this.followerTable}(${this.followerId}, ${this.follower}, ${this.followed_at}) values ($1, $2, $3) on conflict (${this.followerId}, ${this.follower}) do nothing`;
    const query2 = `insert into ${this.followingTable}(${this.id}, ${this.following}, ${this.following_at}) values ($1, $2, $3) on conflict (${this.id}, ${this.following}) do nothing`;
    const query3 = `
    insert into ${this.infoTable}(${this.infoId}, ${this.followerCount})
    values ($1, 1)
    on conflict (${this.infoId}) do update set ${this.followerCount} = ${this.infoTable}.${this.followerCount} + 1`;
    return this.execute([
      { query: query1, params: [target, id, now] },
      { query: query2, params: [id, target, now] },
      { query: query3, params: [target] },
    ], true);
  }
  unfollow(id, target) {
    const query1 = `delete from ${this.followerTable} where ${this.followerId} = $1 and ${this.follower}=$2`;
    const query2 = `delete from ${this.followingTable} where ${this.id} = $1 and ${this.following}=$2`;
    const query3 = `
    update ${this.infoTable}
    set ${this.followerCount} = ${this.followerCount} - 1
    where ${this.infoId} = $1`;
    return this.execute([
      { query: query2, params: [id, target] },
      { query: query1, params: [target, id] },
      { query: query3, params: [target] },
    ], true);
  }
  checkFollow(id, target) {
    const check = `select ${this.id} from ${this.followerTable} where ${this.id} = $1 and ${this.follower} = $2 `;
    return this.execute([{ query: check, params: [target, id] }]).then((count) => {
      return count > 0 ? true : false;
    });
  }
}
export class ReactRepository {
  constructor(db, userreactionTable, id, author, reaction, prefix, suffix, userinfoTable, infoId, reactioncount) {
    this.db = db;
    this.userreactionTable = userreactionTable;
    this.id = id;
    this.author = author;
    this.reaction = reaction;
    this.prefix = prefix;
    this.suffix = suffix;
    this.userinfoTable = userinfoTable;
    this.infoId = infoId;
    this.reactioncount = reactioncount;
    this.react = this.react.bind(this);
    this.unreact = this.unreact.bind(this);
    this.checkReaction = this.checkReaction.bind(this);
  }
  react(id, author, reaction) {
    const sql = `select reaction from ${this.userreactionTable} where ${this.id} = $1 and ${this.author} = $2`;
    return this.db.query(sql, [id, author]).then((r) => {
      if (r.length <= 0) {
        const obj = {
          l1: "0",
          l2: "0",
          l3: "0",
        };
        obj["l" + reaction] = "1";
        const query1 = `insert into ${this.userreactionTable}(${this.id},${this.author},${this.reaction}) values ($1, $2, $3)`;
        const query2 = `insert into ${this.userinfoTable}(${this.infoId},${this.prefix}1${this.suffix},${this.prefix}2${this.suffix},${this.prefix}3${this.suffix},${this.reactioncount}) values ($1, ${obj["l1"]}, ${obj["l2"]},${obj["l3"]},1)
      on conflict (${this.id}) do update set ${this.prefix}1${this.suffix} = ${this.userinfoTable}.${this.prefix}1${this.suffix} + ${obj["l1"]}, ${this.prefix}2${this.suffix} = ${this.userinfoTable}.${this.prefix}2${this.suffix} + ${obj["l2"]}, ${this.prefix}3${this.suffix} = ${this.userinfoTable}.${this.prefix}3${this.suffix} + ${obj["l3"]}, ${this.reactioncount}=${this.reactioncount} + 1`;
        const s1 = { query: query1, params: [id, author, reaction] };
        const s2 = { query: query2, params: [id] };
        return this.db.executeBatch([s1, s2]);
      }
      else {
        const query1 = `update ${this.userreactionTable} set ${this.reaction} = $1 where ${this.id} = $2 and ${this.author} = $3`;
        const query2 = `update ${this.userinfoTable} set ${this.prefix}${r[0].reaction}${this.suffix} = ${this.prefix}${r[0].reaction}${this.suffix} - 1, ${this.prefix}${reaction}${this.suffix} = ${this.prefix}${reaction}${this.suffix} + 1
       where ${this.infoId} = $1`;
        const s1 = { query: query1, params: [reaction, id, author] };
        const s2 = { query: query2, params: [id] };
        return this.db.executeBatch([s1, s2], true);
      }
    });
  }
  unreact(id, author, reaction) {
    const query1 = `delete from ${this.userreactionTable} where ${this.id} = $1 and ${this.author} = $2 and ${this.reaction} = $3`;
    const query2 = `update ${this.userinfoTable} set ${this.prefix}${reaction}${this.suffix} = ${this.prefix}${reaction}${this.suffix} - 1, ${this.reactioncount} = ${this.reactioncount} - 1
    where ${this.infoId} = $1`;
    const s1 = { query: query1, params: [id, author, reaction] };
    const s2 = { query: query2, params: [id] };
    return this.db.executeBatch([s1, s2], true);
  }
  checkReaction(id, author) {
    const sql = `select reaction from ${this.userreactionTable} where ${this.id} = $1 and ${this.author} = $2`;
    return this.db.query(sql, [id, author]).then((r) => {
      if (r && r.length > 0) {
        return r[0].reaction;
      }
      else {
        return -1;
      }
    });
  }
}
export class ReactionRepository extends ReactRepository {
}
