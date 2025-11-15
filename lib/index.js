"use strict";
var __extends = (this && this.__extends) || (function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0: case 1: t = op; break;
        case 4: _.label++; return { value: op[1], done: false };
        case 5: _.label++; y = op[1]; op = [0]; continue;
        case 7: op = _.ops.pop(); _.trys.pop(); continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
          if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
          if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
          if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
          if (t[2]) _.ops.pop();
          _.trys.pop(); continue;
      }
      op = body.call(thisArg, _);
    } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
};
function __export(m) {
  for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var build_1 = require("./build");
__export(require("./build"));
var resource = (function () {
  function resource() {
  }
  return resource;
}());
exports.resource = resource;
function createPool(conf) {
  var pool = new pg_1.Pool(conf);
  return pool;
}
exports.createPool = createPool;
var PoolManager = (function () {
  function PoolManager(pool) {
    this.pool = pool;
    this.driver = 'postgres';
    this.param = this.param.bind(this);
    this.exec = this.exec.bind(this);
    this.execBatch = this.execBatch.bind(this);
    this.query = this.query.bind(this);
    this.queryOne = this.queryOne.bind(this);
    this.execScalar = this.execScalar.bind(this);
    this.count = this.count.bind(this);
  }
  PoolManager.prototype.param = function (i) {
    return '$' + i;
  };
  PoolManager.prototype.exec = function (sql, args, ctx) {
    var p = (ctx ? ctx : this.pool);
    return exec(p, sql, args);
  };
  PoolManager.prototype.execBatch = function (statements, firstSuccess, ctx) {
    var p = (ctx ? ctx : this.pool);
    return execBatch(p, statements, firstSuccess);
  };
  PoolManager.prototype.query = function (sql, args, m, bools, ctx) {
    var p = (ctx ? ctx : this.pool);
    return query(p, sql, args, m, bools);
  };
  PoolManager.prototype.queryOne = function (sql, args, m, bools, ctx) {
    var p = (ctx ? ctx : this.pool);
    return queryOne(p, sql, args, m, bools);
  };
  PoolManager.prototype.execScalar = function (sql, args, ctx) {
    var p = (ctx ? ctx : this.pool);
    return execScalar(p, sql, args);
  };
  PoolManager.prototype.count = function (sql, args, ctx) {
    var p = (ctx ? ctx : this.pool);
    return count(p, sql, args);
  };
  return PoolManager;
}());
exports.PoolManager = PoolManager;
var PoolClientManager = (function () {
  function PoolClientManager(client) {
    this.client = client;
    this.driver = 'postgres';
    this.param = this.param.bind(this);
    this.exec = this.exec.bind(this);
    this.execBatch = this.execBatch.bind(this);
    this.query = this.query.bind(this);
    this.queryOne = this.queryOne.bind(this);
    this.execScalar = this.execScalar.bind(this);
    this.count = this.count.bind(this);
  }
  PoolClientManager.prototype.param = function (i) {
    return '$' + i;
  };
  PoolClientManager.prototype.exec = function (sql, args, ctx) {
    var p = (ctx ? ctx : this.client);
    return exec(this.client, sql, args);
  };
  PoolClientManager.prototype.execBatch = function (statements, firstSuccess, ctx) {
    var p = (ctx ? ctx : this.client);
    return execBatchWithClient(p, statements, firstSuccess);
  };
  PoolClientManager.prototype.query = function (sql, args, m, bools, ctx) {
    var p = (ctx ? ctx : this.client);
    return query(p, sql, args, m, bools);
  };
  PoolClientManager.prototype.queryOne = function (sql, args, m, bools, ctx) {
    var p = (ctx ? ctx : this.client);
    return queryOne(p, sql, args, m, bools);
  };
  PoolClientManager.prototype.execScalar = function (sql, args, ctx) {
    var p = (ctx ? ctx : this.client);
    return execScalar(p, sql, args);
  };
  PoolClientManager.prototype.count = function (sql, args, ctx) {
    var p = (ctx ? ctx : this.client);
    return count(p, sql, args);
  };
  return PoolClientManager;
}());
exports.PoolClientManager = PoolClientManager;
function buildError(err) {
  if (err.code === '23505') {
    err.error = 'duplicate';
  }
  return err;
}
function exec(client, sql, args) {
  var p = toArray(args);
  return new Promise(function (resolve, reject) {
    return client.query(sql, p, function (err, results) {
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
exports.exec = exec;
function query(client, sql, args, m, bools) {
  var p = toArray(args);
  return new Promise(function (resolve, reject) {
    return client.query(sql, p, function (err, results) {
      if (err) {
        return reject(err);
      }
      else {
        return resolve(handleResults(results.rows, m, bools));
      }
    });
  });
}
exports.query = query;
function queryOne(client, sql, args, m, bools) {
  return query(client, sql, args, m, bools).then(function (r) {
    return (r && r.length > 0 ? r[0] : null);
  });
}
exports.queryOne = queryOne;
function execScalar(client, sql, args) {
  return queryOne(client, sql, args).then(function (r) {
    if (!r) {
      return null;
    }
    else {
      var keys = Object.keys(r);
      return r[keys[0]];
    }
  });
}
exports.execScalar = execScalar;
function count(client, sql, args) {
  return execScalar(client, sql, args);
}
exports.count = count;
function execBatch(pool, statements, firstSuccess) {
  return __awaiter(this, void 0, void 0, function () {
    var client, c, result0, subs, arrPromise, e_1, arrPromise, e_2;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!statements || statements.length === 0) {
            return [2, Promise.resolve(0)];
          }
          else if (statements.length === 1) {
            return [2, exec(pool, statements[0].query, toArray(statements[0].params))];
          }
          return [4, pool.connect()];
        case 1:
          client = _a.sent();
          c = 0;
          if (!firstSuccess) return [3, 11];
          _a.label = 2;
        case 2:
          _a.trys.push([2, 8, , 10]);
          return [4, client.query('begin')];
        case 3:
          _a.sent();
          return [4, client.query(statements[0].query, toArray(statements[0].params))];
        case 4:
          result0 = _a.sent();
          if (!(result0 && result0.rowCount !== 0)) return [3, 7];
          subs = statements.slice(1);
          arrPromise = subs.map(function (item) {
            return client.query(item.query, item.params ? item.params : []);
          });
          return [4, Promise.all(arrPromise).then(function (results) {
              for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                var obj = results_1[_i];
                if (obj.rowCount) {
                  c += obj.rowCount;
                }
              }
            })];
        case 5:
          _a.sent();
          if (result0.rowCount) {
            c += result0.rowCount;
          }
          return [4, client.query('commit')];
        case 6:
          _a.sent();
          client.release();
          _a.label = 7;
        case 7: return [2, c];
        case 8:
          e_1 = _a.sent();
          buildError(e_1);
          return [4, client.query('rollback')];
        case 9:
          _a.sent();
          client.release();
          throw e_1;
        case 10: return [3, 17];
        case 11:
          _a.trys.push([11, 15, , 17]);
          return [4, client.query('begin')];
        case 12:
          _a.sent();
          arrPromise = statements.map(function (item, i) {
            return client.query(item.query, toArray(item.params));
          });
          return [4, Promise.all(arrPromise).then(function (results) {
              for (var _i = 0, results_2 = results; _i < results_2.length; _i++) {
                var obj = results_2[_i];
                if (obj.rowCount) {
                  c += obj.rowCount;
                }
              }
            })];
        case 13:
          _a.sent();
          return [4, client.query('commit')];
        case 14:
          _a.sent();
          client.release();
          return [2, c];
        case 15:
          e_2 = _a.sent();
          return [4, client.query('rollback')];
        case 16:
          _a.sent();
          client.release();
          throw e_2;
        case 17: return [2];
      }
    });
  });
}
exports.execBatch = execBatch;
function execBatchWithClient(client, statements, firstSuccess) {
  return __awaiter(this, void 0, void 0, function () {
    var c, result0, subs, arrPromise, e_3, arrPromise, e_4;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!statements || statements.length === 0) {
            return [2, Promise.resolve(0)];
          }
          else if (statements.length === 1) {
            return [2, exec(client, statements[0].query, statements[0].params)];
          }
          c = 0;
          if (!firstSuccess) return [3, 10];
          _a.label = 1;
        case 1:
          _a.trys.push([1, 7, , 9]);
          return [4, client.query('begin')];
        case 2:
          _a.sent();
          return [4, client.query(statements[0].query, toArray(statements[0].params))];
        case 3:
          result0 = _a.sent();
          if (!(result0 && result0.rowCount !== 0)) return [3, 6];
          subs = statements.slice(1);
          arrPromise = subs.map(function (item, i) {
            return client.query(item.query, item.params ? item.params : []);
          });
          return [4, Promise.all(arrPromise).then(function (results) {
              for (var _i = 0, results_3 = results; _i < results_3.length; _i++) {
                var obj = results_3[_i];
                if (obj.rowCount) {
                  c += obj.rowCount;
                }
              }
            })];
        case 4:
          _a.sent();
          if (result0.rowCount) {
            c += result0.rowCount;
          }
          return [4, client.query('commit')];
        case 5:
          _a.sent();
          client.release();
          _a.label = 6;
        case 6: return [2, c];
        case 7:
          e_3 = _a.sent();
          return [4, client.query('rollback')];
        case 8:
          _a.sent();
          throw e_3;
        case 9: return [3, 16];
        case 10:
          _a.trys.push([10, 14, , 16]);
          return [4, client.query('begin')];
        case 11:
          _a.sent();
          arrPromise = statements.map(function (item, i) {
            return client.query(item.query, toArray(item.params));
          });
          return [4, Promise.all(arrPromise).then(function (results) {
              for (var _i = 0, results_4 = results; _i < results_4.length; _i++) {
                var obj = results_4[_i];
                if (obj.rowCount) {
                  c += obj.rowCount;
                }
              }
            })];
        case 12:
          _a.sent();
          return [4, client.query('commit')];
        case 13:
          _a.sent();
          client.release();
          return [2, c];
        case 14:
          e_4 = _a.sent();
          return [4, client.query('rollback')];
        case 15:
          _a.sent();
          client.release();
          throw e_4;
        case 16: return [2];
      }
    });
  });
}
exports.execBatchWithClient = execBatchWithClient;
function save(client, obj, table, attrs, ver, buildParam) {
  var s = build_1.buildToSave(obj, table, attrs, ver, buildParam);
  if (!s) {
    return Promise.resolve(-1);
  }
  if (typeof client === 'function') {
    return client(s.query, s.params);
  }
  else {
    return exec(client, s.query, s.params);
  }
}
exports.save = save;
function saveBatch(pool, objs, table, attrs, ver, buildParam) {
  var s = build_1.buildToSaveBatch(objs, table, attrs, ver, buildParam);
  if (!s) {
    return Promise.resolve(-1);
  }
  else {
    return execBatch(pool, s);
  }
}
exports.saveBatch = saveBatch;
function saveBatchWithClient(client, objs, table, attrs, ver, buildParam) {
  var s = build_1.buildToSaveBatch(objs, table, attrs, ver, buildParam);
  if (!s) {
    return Promise.resolve(-1);
  }
  else {
    return execBatchWithClient(client, s);
  }
}
exports.saveBatchWithClient = saveBatchWithClient;
function toArray(arr) {
  if (!arr || arr.length === 0) {
    return [];
  }
  var p = [];
  var l = arr.length;
  for (var i = 0; i < l; i++) {
    if (arr[i] === undefined || arr[i] == null) {
      p.push(null);
    }
    else {
      if (typeof arr[i] === 'object') {
        if (arr[i] instanceof Date) {
          p.push(arr[i]);
        }
        else {
          if (resource.string) {
            var s = JSON.stringify(arr[i]);
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
exports.toArray = toArray;
function handleResults(r, m, bools) {
  if (m) {
    var res = mapArray(r, m);
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
exports.handleResults = handleResults;
function handleBool(objs, bools) {
  if (!bools || bools.length === 0 || !objs) {
    return objs;
  }
  for (var _i = 0, objs_1 = objs; _i < objs_1.length; _i++) {
    var obj = objs_1[_i];
    var o = obj;
    for (var _a = 0, bools_1 = bools; _a < bools_1.length; _a++) {
      var field = bools_1[_a];
      if (field.name) {
        var v = o[field.name];
        if (typeof v !== 'boolean' && v != null && v !== undefined) {
          var b = field.true;
          if (b == null || b === undefined) {
            o[field.name] = ('true' == v || '1' == v || 't' == v || 'y' == v || 'on' == v);
          }
          else {
            o[field.name] = (v == b ? true : false);
          }
        }
      }
    }
  }
  return objs;
}
exports.handleBool = handleBool;
function map(obj, m) {
  if (!m) {
    return obj;
  }
  var mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return obj;
  }
  var obj2 = {};
  var keys = Object.keys(obj);
  for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
    var key = keys_1[_i];
    var k0 = m[key];
    if (!k0) {
      k0 = key;
    }
    obj2[k0] = obj[key];
  }
  return obj2;
}
exports.map = map;
function mapArray(results, m) {
  if (!m) {
    return results;
  }
  var mkeys = Object.keys(m);
  if (mkeys.length === 0) {
    return results;
  }
  var objs = [];
  var length = results.length;
  for (var i = 0; i < length; i++) {
    var obj = results[i];
    var obj2 = {};
    var keys = Object.keys(obj);
    for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
      var key = keys_2[_i];
      var k0 = m[key];
      if (!k0) {
        k0 = key;
      }
      obj2[k0] = obj[key];
    }
    objs.push(obj2);
  }
  return objs;
}
exports.mapArray = mapArray;
function getFields(fields, all) {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  var ext = [];
  if (all) {
    for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
      var s = fields_1[_i];
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
exports.getFields = getFields;
function buildFields(fields, all) {
  var s = getFields(fields, all);
  if (!s || s.length === 0) {
    return '*';
  }
  else {
    return s.join(',');
  }
}
exports.buildFields = buildFields;
function getMapField(name, mp) {
  if (!mp) {
    return name;
  }
  var x = mp[name];
  if (!x) {
    return name;
  }
  if (typeof x === 'string') {
    return x;
  }
  return name;
}
exports.getMapField = getMapField;
function isEmpty(s) {
  return !(s && s.length > 0);
}
exports.isEmpty = isEmpty;
function version(attrs) {
  var ks = Object.keys(attrs);
  for (var _i = 0, ks_1 = ks; _i < ks_1.length; _i++) {
    var k = ks_1[_i];
    var attr = attrs[k];
    if (attr.version) {
      attr.name = k;
      return attr;
    }
  }
  return undefined;
}
exports.version = version;
var PostgreSQLWriter = (function () {
  function PostgreSQLWriter(pool, table, attributes, oneIfSuccess, toDB, buildParam) {
    this.table = table;
    this.attributes = attributes;
    this.oneIfSuccess = oneIfSuccess;
    this.write = this.write.bind(this);
    if (typeof pool === 'function') {
      this.exec = pool;
    }
    else {
      this.pool = pool;
    }
    this.param = buildParam;
    this.map = toDB;
    var x = version(attributes);
    if (x) {
      this.version = x.name;
    }
  }
  PostgreSQLWriter.prototype.write = function (obj) {
    if (!obj) {
      return Promise.resolve(0);
    }
    var obj2 = obj;
    if (this.map) {
      obj2 = this.map(obj);
    }
    var stmt = build_1.buildToSave(obj2, this.table, this.attributes, this.version, this.param);
    if (stmt) {
      if (this.exec) {
        if (this.oneIfSuccess) {
          return this.exec(stmt.query, stmt.params).then(function (ct) { return ct > 0 ? 1 : 0; });
        }
        else {
          return this.exec(stmt.query, stmt.params);
        }
      }
      else {
        if (this.oneIfSuccess) {
          return exec(this.pool, stmt.query, stmt.params).then(function (ct) { return ct > 0 ? 1 : 0; });
        }
        else {
          return exec(this.pool, stmt.query, stmt.params);
        }
      }
    }
    else {
      return Promise.resolve(0);
    }
  };
  return PostgreSQLWriter;
}());
exports.PostgreSQLWriter = PostgreSQLWriter;
var PostgreSQLStreamWriter = (function () {
  function PostgreSQLStreamWriter(con, table, attributes, size, toDB, buildParam) {
    this.table = table;
    this.attributes = attributes;
    this.list = [];
    this.size = 0;
    this.write = this.write.bind(this);
    this.flush = this.flush.bind(this);
    if (typeof con === 'function') {
      this.execBatch = con;
    }
    else {
      this.pool = con;
    }
    this.param = buildParam;
    this.map = toDB;
    var x = version(attributes);
    if (x) {
      this.version = x.name;
    }
    if (size) {
      this.size = size;
    }
  }
  PostgreSQLStreamWriter.prototype.write = function (obj) {
    if (!obj) {
      return Promise.resolve(0);
    }
    var obj2 = obj;
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
  };
  PostgreSQLStreamWriter.prototype.flush = function () {
    var _this = this;
    if (!this.list || this.list.length === 0) {
      return Promise.resolve(0);
    }
    else {
      var total_1 = this.list.length;
      var stmt = build_1.buildToSaveBatch(this.list, this.table, this.attributes, this.version, this.param);
      if (stmt) {
        if (this.execBatch) {
          return this.execBatch(stmt).then(function (r) {
            _this.list = [];
            return total_1;
          });
        }
        else {
          return execBatch(this.pool, stmt).then(function (r) {
            _this.list = [];
            return total_1;
          });
        }
      }
      else {
        return Promise.resolve(0);
      }
    }
  };
  return PostgreSQLStreamWriter;
}());
exports.PostgreSQLStreamWriter = PostgreSQLStreamWriter;
var PostgreSQLBatchWriter = (function () {
  function PostgreSQLBatchWriter(pool, table, attributes, toDB, buildParam) {
    this.table = table;
    this.attributes = attributes;
    this.write = this.write.bind(this);
    if (typeof pool === 'function') {
      this.execute = pool;
    }
    else {
      this.pool = pool;
    }
    this.param = buildParam;
    this.map = toDB;
    var x = version(attributes);
    if (x) {
      this.version = x.name;
    }
  }
  PostgreSQLBatchWriter.prototype.write = function (objs) {
    if (!objs || objs.length === 0) {
      return Promise.resolve(0);
    }
    var list = objs;
    if (this.map) {
      list = [];
      for (var _i = 0, objs_2 = objs; _i < objs_2.length; _i++) {
        var obj = objs_2[_i];
        var obj2 = this.map(obj);
        list.push(obj2);
      }
    }
    var stmts = build_1.buildToSaveBatch(list, this.table, this.attributes, this.version, this.param);
    if (stmts && stmts.length > 0) {
      if (this.execute) {
        return this.execute(stmts);
      }
      else {
        return execBatch(this.pool, stmts);
      }
    }
    else {
      return Promise.resolve(0);
    }
  };
  return PostgreSQLBatchWriter;
}());
exports.PostgreSQLBatchWriter = PostgreSQLBatchWriter;
var PostgreSQLChecker = (function () {
  function PostgreSQLChecker(pool, service, timeout) {
    this.pool = pool;
    this.timeout = (timeout ? timeout : 4200);
    this.service = (service ? service : 'mysql');
    this.check = this.check.bind(this);
    this.name = this.name.bind(this);
    this.build = this.build.bind(this);
  }
  PostgreSQLChecker.prototype.check = function () {
    return __awaiter(this, void 0, void 0, function () {
      var obj, promise;
      var _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            obj = {};
            return [4, this.pool.connect()];
          case 1:
            _a.sent();
            promise = new Promise(function (resolve, reject) {
              _this.pool.query('select now()', function (err, result) {
                if (err) {
                  return reject(err);
                }
                else {
                  resolve(obj);
                }
              });
            });
            if (this.timeout > 0) {
              return [2, promiseTimeOut(this.timeout, promise)];
            }
            else {
              return [2, promise];
            }
            return [2];
        }
      });
    });
  };
  PostgreSQLChecker.prototype.name = function () {
    return this.service;
  };
  PostgreSQLChecker.prototype.build = function (data, err) {
    if (err) {
      if (!data) {
        data = {};
      }
      data['error'] = err;
    }
    return data;
  };
  return PostgreSQLChecker;
}());
exports.PostgreSQLChecker = PostgreSQLChecker;
function promiseTimeOut(timeoutInMilliseconds, promise) {
  return Promise.race([
    promise,
    new Promise(function (resolve, reject) {
      setTimeout(function () {
        reject("Timed out in: " + timeoutInMilliseconds + " milliseconds!");
      }, timeoutInMilliseconds);
    })
  ]);
}
var StringService = (function () {
  function StringService(table, field, queryData, execute) {
    this.table = table;
    this.field = field;
    this.query = queryData;
    this.exec = execute;
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
  }
  StringService.prototype.load = function (keyword, max) {
    var _this = this;
    var m = (max && max > 0 ? max : 20);
    var k = keyword + '%';
    return this.query("select " + this.field + " from " + this.table + " where " + this.field + " ilike $1 order by " + this.field + " limit " + m, [k]).then(function (res) { return res.map(function (i) { return i[_this.field]; }); });
  };
  StringService.prototype.save = function (values) {
    if (!values || values.length === 0) {
      return Promise.resolve(0);
    }
    else {
      var arr = [];
      var ps = [];
      var i = 1;
      for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
        var v = values_1[_i];
        if (v && v.length > 0) {
          arr.push("($" + i++ + ")");
          ps.push(v);
        }
      }
      if (arr.length === 0) {
        return Promise.resolve(0);
      }
      else {
        var sql = "insert into " + this.table + "(" + this.field + ") values " + arr.join(',') + " on conflict(" + this.field + ") do nothing";
        return this.exec(sql, ps);
      }
    }
  };
  return StringService;
}());
exports.StringService = StringService;
exports.StringRepository = StringService;
var CodeRepository = (function () {
  function CodeRepository(db, table, id, expiredAt, passcode) {
    this.db = db;
    this.table = table;
    this.id = (id ? id : 'id');
    this.code = (passcode ? passcode : 'code');
    this.expiredAt = (expiredAt ? expiredAt : 'expiredat');
    this.load = this.load.bind(this);
    this.delete = this.delete.bind(this);
    this.save = this.save.bind(this);
  }
  CodeRepository.prototype.save = function (id, passcode, expiredAt) {
    var sql = "\n    insert into " + this.table + " (" + this.id + ", " + this.code + ", " + this.expiredAt + ")\n    values (" + this.db.param(1) + ", " + this.db.param(2) + ", " + this.db.param(3) + ")\n    on conflict (" + this.id + ")\n    do update set " + this.code + " = " + this.db.param(4) + ", " + this.expiredAt + " = " + this.db.param(5);
    return this.db.exec(sql, [id, passcode, expiredAt, passcode, expiredAt]);
  };
  CodeRepository.prototype.load = function (id) {
    var sql = "select " + this.code + " as code, " + this.expiredAt + " as expiredat from " + this.table + " where " + this.id + " = " + this.db.param(1);
    return this.db.query(sql, [id]).then(function (v) {
      if (!v || v.length === 0) {
        return null;
      }
      else {
        var obj = {};
        obj.code = v[0]['code'];
        obj.expiredAt = v[0]['expiredat'];
        return obj;
      }
    });
  };
  CodeRepository.prototype.delete = function (id) {
    var sql = "delete from " + this.table + " where " + this.id + " = " + this.db.param(1);
    return this.db.exec(sql, [id]);
  };
  return CodeRepository;
}());
exports.CodeRepository = CodeRepository;
var PasscodeRepository = (function (_super) {
  __extends(PasscodeRepository, _super);
  function PasscodeRepository() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return PasscodeRepository;
}(CodeRepository));
exports.PasscodeRepository = PasscodeRepository;
var SqlPasscodeRepository = (function (_super) {
  __extends(SqlPasscodeRepository, _super);
  function SqlPasscodeRepository() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return SqlPasscodeRepository;
}(CodeRepository));
exports.SqlPasscodeRepository = SqlPasscodeRepository;
var SqlCodeRepository = (function (_super) {
  __extends(SqlCodeRepository, _super);
  function SqlCodeRepository() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return SqlCodeRepository;
}(CodeRepository));
exports.SqlCodeRepository = SqlCodeRepository;
var CodeService = (function (_super) {
  __extends(CodeService, _super);
  function CodeService() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return CodeService;
}(CodeRepository));
exports.CodeService = CodeService;
var PasscodeService = (function (_super) {
  __extends(PasscodeService, _super);
  function PasscodeService() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return PasscodeService;
}(CodeRepository));
exports.PasscodeService = PasscodeService;
var SqlPasscodeService = (function (_super) {
  __extends(SqlPasscodeService, _super);
  function SqlPasscodeService() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return SqlPasscodeService;
}(CodeRepository));
exports.SqlPasscodeService = SqlPasscodeService;
var SqlCodeService = (function (_super) {
  __extends(SqlCodeService, _super);
  function SqlCodeService() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return SqlCodeService;
}(CodeRepository));
exports.SqlCodeService = SqlCodeService;
var UrlQuery = (function () {
  function UrlQuery(queryF, table, url, id, name, displayName) {
    this.queryF = queryF;
    this.table = table;
    this.id = (id && id.length > 0 ? id : 'id');
    this.url = (url && url.length > 0 ? url : 'url');
    this.name = (name && name.length > 0 ? name : 'name');
    this.displayName = (displayName && displayName.length > 0 ? displayName : 'displayname');
    this.load = this.load.bind(this);
    this.query = this.query.bind(this);
  }
  UrlQuery.prototype.load = function (ids) {
    return this.query(ids);
  };
  UrlQuery.prototype.query = function (ids) {
    if (!ids || ids.length === 0) {
      var s = [];
      return Promise.resolve(s);
    }
    var ps = [];
    var pv = [];
    var l = ids.length;
    for (var i = 1; i <= l; i++) {
      ps.push(ids[i - 1]);
      pv.push(build_1.param(i));
    }
    var sql = "select " + this.id + " as id, " + this.url + " as url, case when " + this.displayName + " is not null then " + this.displayName + " else " + this.name + " end as name from " + this.table + " where " + this.id + " in (" + pv.join(',') + ") and " + this.url + " is not null order by " + this.id;
    return this.queryF(sql, ps);
  };
  return UrlQuery;
}());
exports.UrlQuery = UrlQuery;
function useUrlQuery(queryF, table, url, id, name, displayName) {
  var q = new UrlQuery(queryF, table, url, id, name, displayName);
  return q.query;
}
exports.useUrlQuery = useUrlQuery;
var SqlSavedRepository = (function () {
  function SqlSavedRepository(db, table, userId, id, saveAt) {
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
  SqlSavedRepository.prototype.isSaved = function (userId, id) {
    var sql = "select " + this.userId + " from " + this.table + " where " + this.userId + " = " + this.db.param(1) + " and " + this.id + " = " + this.db.param(2);
    return this.db.query(sql, [userId, id]).then(function (rows) {
      return rows.length > 0 ? true : false;
    });
  };
  SqlSavedRepository.prototype.save = function (userId, id) {
    var sql = "insert into " + this.table + " (" + this.userId + ", " + this.id + ", " + this.saveAt + ") values (" + this.db.param(1) + ", " + this.db.param(2) + ", " + this.db.param(3) + ") on conflict (" + this.userId + ", " + this.id + ") do nothing";
    return this.db.exec(sql, [userId, id, new Date()]);
  };
  SqlSavedRepository.prototype.remove = function (userId, id) {
    var sql = "delete from " + this.table + " where " + this.userId + " = " + this.db.param(1) + " and " + this.id + " = " + this.db.param(2);
    return this.db.exec(sql, [userId, id]);
  };
  SqlSavedRepository.prototype.count = function (userId) {
    var sql = "select count(*) as total from " + this.table + " where " + this.userId + " = " + this.db.param(1);
    return this.db.query(sql, [userId]).then(function (rows) {
      return rows[0]["total"];
    });
  };
  return SqlSavedRepository;
}());
exports.SqlSavedRepository = SqlSavedRepository;
var ArrayRepository = (function () {
  function ArrayRepository(select, execute, table, field, id) {
    this.select = select;
    this.execute = execute;
    this.table = table;
    this.field = field;
    this.id = (id && id.length > 0 ? id : 'id');
    this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
  }
  ArrayRepository.prototype.load = function (id) {
    return this.select("select " + this.id + " as id, " + this.field + " as items from " + this.table + " where " + this.id + " = $1", [id]).then(function (objs) {
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
  };
  ArrayRepository.prototype.insert = function (id, arr) {
    var sql = "insert into " + this.table + "(" + this.id + ", " + this.field + ") values ($1, $2)";
    return this.execute(sql, [id, arr]);
  };
  ArrayRepository.prototype.update = function (id, arr) {
    var sql = "update " + this.table + " set " + this.field + " = $1 where " + this.id + " = $2";
    return this.execute(sql, [arr, id]);
  };
  return ArrayRepository;
}());
exports.ArrayRepository = ArrayRepository;
var FollowService = (function () {
  function FollowService(execute, followingTable, id, following, followerTable, followerId, follower, infoTable, infoId, followerCount, followingCount) {
    this.execute = execute;
    this.followingTable = followingTable;
    this.id = id;
    this.following = following;
    this.followerTable = followerTable;
    this.followerId = followerId;
    this.follower = follower;
    this.infoTable = infoTable;
    this.infoId = infoId;
    this.followerCount = followerCount;
    this.followingCount = followingCount;
    this.follow = this.follow.bind(this);
    this.unfollow = this.unfollow.bind(this);
    this.checkFollow = this.checkFollow.bind(this);
  }
  FollowService.prototype.follow = function (id, target) {
    var _this = this;
    var double = "select * from " + this.followingTable + " where " + this.id + " = $1 and " + this.following + "=$2 ";
    var query1 = "insert into " + this.followingTable + "(" + this.id + ", " + this.following + ") values ($1, $2)";
    var query2 = "insert into " + this.followerTable + "(" + this.followerId + ", " + this.follower + ") values ($1, $2)";
    var query3 = "\n      insert into " + this.infoTable + "(" + this.infoId + "," + this.followingCount + ", " + this.followerCount + ")\n      values ($1, 1, 0)\n      on conflict (" + this.infoId + ") do update set " + this.followingCount + " =   " + this.infoTable + "." + this.followingCount + " + 1";
    var query4 = "\n      insert into " + this.infoTable + "(" + this.infoId + "," + this.followingCount + ", " + this.followerCount + ")\n      values ($1, 0, 1)\n      on conflict (" + this.infoId + ") do update set " + this.followerCount + " = " + this.infoTable + "." + this.followerCount + " + 1";
    return this.execute([{ query: double, params: [id, target] }], true).then(function (data) {
      if (!data) {
        return _this.execute([
          { query: query1, params: [id, target] },
          { query: query2, params: [target, id] },
          { query: query3, params: [id] },
          { query: query4, params: [target] },
        ], true);
      }
      else {
        return Promise.resolve(0);
      }
    });
  };
  FollowService.prototype.unfollow = function (id, target) {
    var query1 = "delete from " + this.followingTable + " where " + this.id + " = $1 and " + this.following + "=$2";
    var query2 = "delete from " + this.followerTable + " where " + this.followerId + " = $1 and " + this.follower + "=$2";
    var query3 = "\n      update " + this.infoTable + "\n      set " + this.followingCount + " = " + this.followingCount + " -1\n      where " + this.infoId + " = $1";
    var query4 = "\n      update " + this.infoTable + "\n      set " + this.followerCount + " =" + this.followerCount + " - 1\n      where " + this.infoId + " = $1";
    return this.execute([
      { query: query1, params: [id, target] },
      { query: query2, params: [target, id] },
      { query: query3, params: [id] },
      { query: query4, params: [target] },
    ], true);
  };
  FollowService.prototype.checkFollow = function (id, target) {
    var check = "select " + this.id + " from " + this.followingTable + " where " + this.id + " = $1 and " + this.following + " = $2 ";
    return this.execute([{ query: check, params: [id, target] }], true);
  };
  return FollowService;
}());
exports.FollowService = FollowService;
var FollowRepository = (function (_super) {
  __extends(FollowRepository, _super);
  function FollowRepository() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return FollowRepository;
}(FollowService));
exports.FollowRepository = FollowRepository;
var ReactionService = (function () {
  function ReactionService(db, userreactionTable, id, author, reaction, prefix, suffix, userinfoTable, infoId, reactioncount) {
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
  ReactionService.prototype.react = function (id, author, reaction) {
    var _this = this;
    var sql = "select reaction from " + this.userreactionTable + " where " + this.id + " = $1 and " + this.author + " = $2";
    return this.db.query(sql, [id, author]).then(function (r) {
      if (r.length <= 0) {
        var obj = {
          l1: '0',
          l2: '0',
          l3: '0',
        };
        obj['l' + reaction] = '1';
        var query1 = "insert into " + _this.userreactionTable + "(" + _this.id + "," + _this.author + "," + _this.reaction + ") values ($1, $2, $3)";
        var query2 = "insert into " + _this.userinfoTable + "(" + _this.infoId + "," + _this.prefix + "1" + _this.suffix + "," + _this.prefix + "2" + _this.suffix + "," + _this.prefix + "3" + _this.suffix + "," + _this.reactioncount + ") values ($1, " + obj['l1'] + ", " + obj['l2'] + "," + obj['l3'] + ",1)\n      on conflict (" + _this.id + ") do update set " + _this.prefix + "1" + _this.suffix + " = " + _this.userinfoTable + "." + _this.prefix + "1" + _this.suffix + " + " + obj['l1'] + ", " + _this.prefix + "2" + _this.suffix + " = " + _this.userinfoTable + "." + _this.prefix + "2" + _this.suffix + " + " + obj['l2'] + ", " + _this.prefix + "3" + _this.suffix + " = " + _this.userinfoTable + "." + _this.prefix + "3" + _this.suffix + " + " + obj['l3'] + ", " + _this.reactioncount + "=" + _this.reactioncount + " + 1";
        var s1 = { query: query1, params: [id, author, reaction] };
        var s2 = { query: query2, params: [id] };
        return _this.db.execBatch([s1, s2]);
      }
      else {
        var query1 = "update " + _this.userreactionTable + " set " + _this.reaction + " = $1 where " + _this.id + " = $2 and " + _this.author + " = $3";
        var query2 = "update " + _this.userinfoTable + " set " + _this.prefix + r[0].reaction + _this.suffix + " = " + _this.prefix + r[0].reaction + _this.suffix + " - 1, " + _this.prefix + reaction + _this.suffix + " = " + _this.prefix + reaction + _this.suffix + " + 1\n       where " + _this.infoId + " = $1";
        var s1 = { query: query1, params: [reaction, id, author] };
        var s2 = { query: query2, params: [id] };
        return _this.db.execBatch([s1, s2], true);
      }
    });
  };
  ReactionService.prototype.unreact = function (id, author, reaction) {
    var query1 = "delete from " + this.userreactionTable + " where " + this.id + " = $1 and " + this.author + " = $2 and " + this.reaction + " = $3";
    var query2 = "update " + this.userinfoTable + " set " + this.prefix + reaction + this.suffix + " = " + this.prefix + reaction + this.suffix + " - 1, " + this.reactioncount + " = " + this.reactioncount + " - 1\n    where " + this.infoId + " = $1";
    var s1 = { query: query1, params: [id, author, reaction] };
    var s2 = { query: query2, params: [id] };
    return this.db.execBatch([s1, s2], true);
  };
  ReactionService.prototype.checkReaction = function (id, author) {
    var sql = "select reaction from " + this.userreactionTable + " where " + this.id + " = $1 and " + this.author + " = $2";
    return this.db.query(sql, [id, author]).then(function (r) {
      if (r && r.length > 0) {
        return r[0].reaction;
      }
      else {
        return -1;
      }
    });
  };
  return ReactionService;
}());
exports.ReactionService = ReactionService;
var ReactService = (function (_super) {
  __extends(ReactService, _super);
  function ReactService() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return ReactService;
}(ReactionService));
exports.ReactService = ReactService;
var ReactRepository = (function (_super) {
  __extends(ReactRepository, _super);
  function ReactRepository() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return ReactRepository;
}(ReactionService));
exports.ReactRepository = ReactRepository;
var ReactionRepository = (function (_super) {
  __extends(ReactionRepository, _super);
  function ReactionRepository() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return ReactionRepository;
}(ReactionService));
exports.ReactionRepository = ReactionRepository;
