"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function param(i) {
  return '$' + i;
}
exports.param = param;
function params(length, from) {
  if (from === undefined || from == null) {
    from = 0;
  }
  var ps = [];
  for (var i = 1; i <= length; i++) {
    ps.push(param(i + from));
  }
  return ps;
}
exports.params = params;
function metadata(attrs) {
  var mp = {};
  var ks = Object.keys(attrs);
  var ats = [];
  var bools = [];
  var fields = [];
  var m = { keys: ats, fields: fields };
  var isMap = false;
  for (var _i = 0, ks_1 = ks; _i < ks_1.length; _i++) {
    var k = ks_1[_i];
    var attr = attrs[k];
    attr.name = k;
    if (attr.key) {
      ats.push(attr);
    }
    if (!attr.ignored) {
      fields.push(k);
    }
    if (attr.type === 'boolean') {
      bools.push(attr);
    }
    if (attr.version) {
      m.version = k;
    }
    var field = (attr.column ? attr.column : k);
    var s = field.toLowerCase();
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
exports.metadata = metadata;
function buildToSave(obj, table, attrs, ver, buildParam, i) {
  if (!i) {
    i = 1;
  }
  if (!buildParam) {
    buildParam = param;
  }
  var ks = Object.keys(attrs);
  var pks = [];
  var cols = [];
  var values = [];
  var args = [];
  var isVersion = false;
  var o = obj;
  for (var _i = 0, ks_2 = ks; _i < ks_2.length; _i++) {
    var k = ks_2[_i];
    var attr = attrs[k];
    attr.name = k;
    if (attr.key) {
      pks.push(attr);
    }
    var v = o[k];
    if (v === undefined || v == null) {
      v = attr.default;
    }
    if (v !== undefined && v != null && !attr.ignored && !attr.noinsert) {
      var field = (attr.column ? attr.column : k);
      cols.push(field);
      if (k === ver) {
        isVersion = true;
        values.push("" + 1);
      }
      else {
        if (v === '') {
          values.push("''");
        }
        else if (typeof v === 'number') {
          values.push(toString(v));
        }
        else if (typeof v === 'boolean') {
          if (attr.true === undefined) {
            if (v === true) {
              values.push("true");
            }
            else {
              values.push("false");
            }
          }
          else {
            var p = buildParam(i++);
            values.push(p);
            if (v === true) {
              var v2 = (attr.true ? attr.true : "'1'");
              args.push(v2);
            }
            else {
              var v2 = (attr.false ? attr.false : "'0'");
              args.push(v2);
            }
          }
        }
        else {
          var p = buildParam(i++);
          values.push(p);
          args.push(v);
        }
      }
    }
  }
  if (!isVersion && ver && ver.length > 0) {
    var attr = attrs[ver];
    var field = (attr.column ? attr.column : ver);
    cols.push(field);
    values.push("" + 1);
  }
  if (pks.length === 0) {
    if (cols.length === 0) {
      return undefined;
    }
    else {
      var q = "insert into " + table + "(" + cols.join(',') + ")values(" + values.join(',') + ")";
      return { query: q, params: args };
    }
  }
  else {
    var colSet = [];
    for (var _a = 0, ks_3 = ks; _a < ks_3.length; _a++) {
      var k = ks_3[_a];
      var v = o[k];
      if (v !== undefined) {
        var attr = attrs[k];
        if (attr && !attr.key && !attr.ignored && !attr.noupdate) {
          var field = (attr.column ? attr.column : k);
          var x = void 0;
          if (v == null) {
            x = 'null';
          }
          else if (v === '') {
            x = "''";
          }
          else if (typeof v === 'number') {
            x = toString(v);
          }
          else if (typeof v === 'boolean') {
            if (attr.true === undefined) {
              if (v === true) {
                x = "true";
              }
              else {
                x = "false";
              }
            }
            else {
              x = buildParam(i++);
              if (v === true) {
                var v2 = (attr.true ? attr.true : "'1'");
                args.push(v2);
              }
              else {
                var v2 = (attr.false ? attr.false : "'0'");
                args.push(v2);
              }
            }
          }
          else {
            x = buildParam(i++);
            args.push(v);
          }
          colSet.push(field + "=" + x);
        }
      }
    }
    var fks = [];
    for (var _b = 0, pks_1 = pks; _b < pks_1.length; _b++) {
      var pk = pks_1[_b];
      var field = (pk.column ? pk.column : pk.name);
      if (field) {
        fks.push(field);
      }
    }
    if (colSet.length === 0) {
      var q = "insert into " + table + "(" + cols.join(',') + ")values(" + values.join(',') + ") on conflict(" + fks.join(',') + ") do nothing";
      return { query: q, params: args };
    }
    else {
      var q = "insert into " + table + "(" + cols.join(',') + ")values(" + values.join(',') + ") on conflict(" + fks.join(',') + ") do update set " + colSet.join(',');
      return { query: q, params: args };
    }
  }
}
exports.buildToSave = buildToSave;
function buildToSaveBatch(objs, table, attrs, ver, buildParam) {
  if (!buildParam) {
    buildParam = param;
  }
  var sts = [];
  var meta = metadata(attrs);
  var pks = meta.keys;
  if (!pks || pks.length === 0) {
    return undefined;
  }
  var ks = Object.keys(attrs);
  for (var _i = 0, objs_1 = objs; _i < objs_1.length; _i++) {
    var obj = objs_1[_i];
    var i = 1;
    var cols = [];
    var values = [];
    var args = [];
    var isVersion = false;
    var o = obj;
    for (var _a = 0, ks_4 = ks; _a < ks_4.length; _a++) {
      var k = ks_4[_a];
      var attr = attrs[k];
      var v = o[k];
      if (v === undefined || v == null) {
        v = attr.default;
      }
      if (v != null && v !== undefined && !attr.ignored && !attr.noinsert) {
        var field = (attr.column ? attr.column : k);
        cols.push(field);
        if (k === ver) {
          isVersion = true;
          values.push("" + 1);
        }
        else {
          if (v === '') {
            values.push("''");
          }
          else if (typeof v === 'number') {
            values.push(toString(v));
          }
          else if (typeof v === 'boolean') {
            if (attr.true === undefined) {
              if (v === true) {
                values.push("true");
              }
              else {
                values.push("false");
              }
            }
            else {
              var p = buildParam(i++);
              values.push(p);
              if (v === true) {
                var v2 = (attr.true ? attr.true : "'1'");
                args.push(v2);
              }
              else {
                var v2 = (attr.false ? attr.false : "'0'");
                args.push(v2);
              }
            }
          }
          else {
            var p = buildParam(i++);
            values.push(p);
            args.push(v);
          }
        }
      }
    }
    if (!isVersion && ver && ver.length > 0) {
      var attr = attrs[ver];
      var field = (attr.column ? attr.column : ver);
      cols.push(field);
      values.push("" + 1);
    }
    var colSet = [];
    for (var _b = 0, ks_5 = ks; _b < ks_5.length; _b++) {
      var k = ks_5[_b];
      var v = o[k];
      if (v !== undefined) {
        var attr = attrs[k];
        if (attr && !attr.key && !attr.ignored && k !== ver && !attr.noupdate) {
          var field = (attr.column ? attr.column : k);
          var x = void 0;
          if (v == null) {
            x = 'null';
          }
          else if (v === '') {
            x = "''";
          }
          else if (typeof v === 'number') {
            x = toString(v);
          }
          else if (typeof v === 'boolean') {
            if (attr.true === undefined) {
              if (v === true) {
                x = "true";
              }
              else {
                x = "false";
              }
            }
            else {
              x = buildParam(i++);
              if (v === true) {
                var v2 = (attr.true ? attr.true : "'1'");
                args.push(v2);
              }
              else {
                var v2 = (attr.false ? attr.false : "'0'");
                args.push(v2);
              }
            }
          }
          else {
            x = buildParam(i++);
            args.push(v);
          }
          colSet.push(field + "=" + x);
        }
      }
    }
    var fks = [];
    for (var _c = 0, pks_2 = pks; _c < pks_2.length; _c++) {
      var pk = pks_2[_c];
      var field = (pk.column ? pk.column : pk.name);
      if (field) {
        fks.push(field);
      }
    }
    if (colSet.length === 0) {
      var q = "insert into " + table + "(" + cols.join(',') + ")values(" + values.join(',') + ") on conflict(" + fks.join(',') + ") do nothing";
      var smt = { query: q, params: args };
      sts.push(smt);
    }
    else {
      var q = "insert into " + table + "(" + cols.join(',') + ")values(" + values.join(',') + ") on conflict(" + fks.join(',') + ") do update set " + colSet.join(',');
      var smt = { query: q, params: args };
      sts.push(smt);
    }
  }
  return sts;
}
exports.buildToSaveBatch = buildToSaveBatch;
var n = 'NaN';
function toString(v) {
  var x = '' + v;
  if (x === n) {
    x = 'null';
  }
  return x;
}
exports.toString = toString;
