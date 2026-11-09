/* Mini Java interpreter (subset) — chạy hoàn toàn trên trình duyệt.
   Hỗ trợ: kiểu nguyên thủy, String, StringBuilder, mảng 1 chiều, if/else, switch (cổ điển + biểu thức),
   while/do/for/for-each, phương thức static, try/catch/finally, throw, String.format, Math, Integer... */
(function (G) {
'use strict';

class CompileError extends Error { constructor(m, line) { super(m); this.line = line || 0; this.isCompile = true; } }
class JThrow { constructor(ex) { this.ex = ex; } }
class Timeout { }

const PRIM = new Set(['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void']);
const KW = new Set(['if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'return', 'break', 'continue', 'new', 'throw', 'throws', 'try', 'catch', 'finally', 'static', 'public', 'private', 'protected', 'final', 'abstract', 'class', 'true', 'false', 'null', ...PRIM]);
const STATICS = new Set(['Math', 'Integer', 'Double', 'Long', 'Boolean', 'Character', 'String', 'Objects', 'Arrays', 'System']);

/* ---------- giá trị ---------- */
const TRUE = { k: 'Z', v: true }, FALSE = { k: 'Z', v: false }, NULL = { k: 'N', v: null };
const Zb = b => (b ? TRUE : FALSE);
const mkI = v => ({ k: 'I', v: v | 0 });
const mkL = v => ({ k: 'L', v });
const mkD = v => ({ k: 'D', v });
const mkC = v => ({ k: 'C', v: v & 65535 });
const mkS = v => ({ k: 'S', v });
const isNum = x => x.k === 'I' || x.k === 'L' || x.k === 'D' || x.k === 'C';
const isIntegral = x => x.k === 'I' || x.k === 'L' || x.k === 'C';

function fmtD(v) {
  if (Number.isNaN(v)) return 'NaN';
  if (v === Infinity) return 'Infinity';
  if (v === -Infinity) return '-Infinity';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e7 || a < 1e-3)) {
    let [m, e] = v.toExponential().split('e');
    if (!m.includes('.')) m += '.0';
    return m + 'E' + parseInt(e, 10);
  }
  if (Number.isInteger(v)) return (Object.is(v, -0) ? '-0' : String(v)) + '.0';
  return String(v);
}
function tn(v) {
  switch (v.k) {
    case 'I': return 'int'; case 'L': return 'long'; case 'D': return 'double'; case 'C': return 'char';
    case 'Z': return 'boolean'; case 'S': return 'String'; case 'SB': return 'StringBuilder';
    case 'A': return v.t + '[]'; case 'N': return 'null'; case 'EX': return v.cls; default: return v.k;
  }
}
function toStr(v) {
  switch (v.k) {
    case 'I': case 'L': return String(v.v);
    case 'D': return fmtD(v.v);
    case 'Z': return v.v ? 'true' : 'false';
    case 'C': return String.fromCharCode(v.v);
    case 'S': case 'SB': return v.v;
    case 'N': return 'null';
    case 'A': return '[' + (v.t === 'int' ? 'I' : v.t === 'char' ? 'C' : 'L' + v.t + ';') + '@1b6d3586';
    case 'EX': return qualName(v.cls) + (v.msg === null || v.msg === undefined ? '' : ': ' + v.msg);
    default: return String(v.v);
  }
}
function show(v) {
  if (v === undefined) return '?';
  switch (v.k) {
    case 'S': return JSON.stringify(v.v);
    case 'SB': return JSON.stringify(v.v);
    case 'C': return "'" + String.fromCharCode(v.v) + "'";
    case 'A': return '[' + v.v.map(show).join(', ') + ']';
    case 'EX': return toStr(v);
    default: return toStr(v);
  }
}
const UTIL = new Set(['IllegalFormatConversionException', 'MissingFormatArgumentException', 'InputMismatchException', 'NoSuchElementException', 'ConcurrentModificationException']);
function qualName(c) { return (UTIL.has(c) ? 'java.util.' : 'java.lang.') + c; }

const PARENT = {
  Throwable: null, Exception: 'Throwable', Error: 'Throwable', RuntimeException: 'Exception',
  ArithmeticException: 'RuntimeException', NullPointerException: 'RuntimeException',
  IllegalArgumentException: 'RuntimeException', NumberFormatException: 'IllegalArgumentException',
  IllegalStateException: 'RuntimeException', IndexOutOfBoundsException: 'RuntimeException',
  ArrayIndexOutOfBoundsException: 'IndexOutOfBoundsException', StringIndexOutOfBoundsException: 'IndexOutOfBoundsException',
  UnsupportedOperationException: 'RuntimeException', ClassCastException: 'RuntimeException',
  IllegalFormatConversionException: 'IllegalArgumentException', MissingFormatArgumentException: 'IllegalArgumentException',
  StackOverflowError: 'Error', NegativeArraySizeException: 'RuntimeException'
};
function isSub(cls, of) {
  for (let c = cls; c; c = PARENT[c] === undefined ? 'Exception' : PARENT[c]) { if (c === of) return true; if (c === 'Throwable') break; }
  return false;
}

let CUR = null; // interpreter hiện tại (dùng cho ném lỗi từ hàm thư viện)
function jthrow(cls, msg) {
  const ex = { k: 'EX', cls, msg: msg === undefined ? null : msg };
  if (CUR) CUR.recThrow(ex);
  throw new JThrow(ex);
}
const cerr = (m, line) => new CompileError(m, line);

/* ---------- lexer ---------- */
const OPS = ['>>>=', '<<=', '>>=', '>>>', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '->', '::', '<<', '>>'];
function lex(src) {
  const toks = []; const n = src.length; let i = 0, line = 1;
  const idStart = c => /[\p{L}_$]/u.test(c), idPart = c => /[\p{L}\p{N}_$]/u.test(c);
  const esc = () => {
    // src[i] === '\\'
    const c = src[i + 1]; i += 2;
    switch (c) {
      case 'n': return '\n'; case 't': return '\t'; case 'r': return '\r'; case 'b': return '\b'; case 'f': return '\f';
      case '0': return '\0'; case '\\': return '\\'; case '"': return '"'; case "'": return "'";
      case 'u': { const h = src.slice(i, i + 4); i += 4; return String.fromCharCode(parseInt(h, 16)); }
      default: throw cerr('Ký tự escape không hợp lệ: \\' + c, line);
    }
  };
  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; } i += 2; continue; }
    const pos = i;
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i, isD = false;
      while (/[0-9_]/.test(src[j] || '')) j++;
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { isD = true; j++; while (/[0-9_]/.test(src[j] || '')) j++; }
      if (/[eE]/.test(src[j] || '')) { let k = j + 1; if (/[+-]/.test(src[k] || '')) k++; if (/[0-9]/.test(src[k] || '')) { isD = true; j = k; while (/[0-9]/.test(src[j] || '')) j++; } }
      const text = src.slice(i, j).replace(/_/g, ''); let kind = isD ? 'D' : 'I';
      if (/[lL]/.test(src[j] || '')) { kind = 'L'; j++; } else if (/[fFdD]/.test(src[j] || '')) { kind = 'D'; j++; }
      let val;
      if (kind === 'D') val = mkD(parseFloat(text));
      else if (kind === 'L') val = mkL(parseInt(text, 10));
      else { const x = parseInt(text, 10); if (x > 2147483647) throw cerr('Số nguyên quá lớn cho kiểu int: ' + text + ' (thêm L để dùng long)', line); val = mkI(x); }
      toks.push({ t: 'lit', v: val, line, pos, end: j }); i = j; continue;
    }
    if (idStart(c)) {
      let j = i + 1; while (j < n && idPart(src[j])) j++;
      const w = src.slice(i, j);
      toks.push({ t: KW.has(w) ? 'kw' : 'id', v: w, line, pos, end: j }); i = j; continue;
    }
    if (c === '"') {
      i++; let s = '';
      while (i < n && src[i] !== '"') { if (src[i] === '\n') throw cerr('Chuỗi chưa đóng dấu "', line); if (src[i] === '\\') s += esc(); else s += src[i++]; }
      if (i >= n) throw cerr('Chuỗi chưa đóng dấu "', line);
      i++; toks.push({ t: 'lit', v: mkS(s), line, pos, end: i }); continue;
    }
    if (c === "'") {
      i++; let s;
      if (src[i] === '\\') s = esc(); else s = src[i++];
      if (src[i] !== "'") throw cerr("Ký tự (char) phải đặt trong cặp nháy đơn, ví dụ 'a'", line);
      i++; toks.push({ t: 'lit', v: mkC(s.charCodeAt(0)), line, pos, end: i }); continue;
    }
    let op = null;
    for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
    if (!op && '+-*/%=<>!?:;,.(){}[]&|^~@'.includes(c)) op = c;
    if (!op) throw cerr("Ký tự lạ '" + c + "'", line);
    toks.push({ t: 'op', v: op, line, pos, end: i + op.length }); i += op.length;
  }
  toks.push({ t: 'eof', v: '<hết file>', line, pos: n, end: n });
  return toks;
}

/* ---------- parser ---------- */
const BINPREC = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '>>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=']);

class Parser {
  constructor(src) { this.src = src; this.toks = lex(src); this.p = 0; }
  peek(o = 0) { return this.toks[Math.min(this.p + o, this.toks.length - 1)]; }
  next() { const t = this.toks[this.p]; if (this.p < this.toks.length - 1) this.p++; return t; }
  isOp(v, o = 0) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
  isKw(v, o = 0) { const t = this.peek(o); return t.t === 'kw' && t.v === v; }
  eatOp(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
  prevLine() { return this.toks[Math.max(0, this.p - 1)].line; }
  err(m, t) { throw cerr(m, (t || this.peek()).line); }
  expectOp(v) {
    if (!this.isOp(v)) {
      const line = (v === ';' || v === ')' || v === '}') && this.p > 0 ? this.prevLine() : this.peek().line;
      throw cerr(`Thiếu '${v}' (gặp '${this.peek().v}')`, line);
    }
    this.p++;
  }
  text(startIdx) { return this.src.slice(this.toks[startIdx].pos, this.toks[this.p - 1].end); }

  program() {
    const out = { methods: [], fields: [] };
    while (this.peek().t !== 'eof') this.member(out);
    return out;
  }
  member(out) {
    let isFinal = false;
    while (this.peek().t === 'kw' && ['public', 'private', 'protected', 'static', 'final', 'abstract'].includes(this.peek().v)) { if (this.peek().v === 'final') isFinal = true; this.p++; }
    if (this.isKw('class')) {
      this.p++; this.next(); this.expectOp('{');
      while (!this.isOp('}') && this.peek().t !== 'eof') this.member(out);
      this.expectOp('}'); return;
    }
    if (this.peek().t === 'eof') return;
    const type = this.parseType();
    const nameTok = this.next();
    if (nameTok.t !== 'id') this.err('Cần tên phương thức hoặc biến', nameTok);
    if (this.isOp('(')) {
      this.p++; const params = [];
      if (!this.isOp(')')) {
        do { if (this.isKw('final')) this.p++; const pt = this.parseType(); const pn = this.next(); if (pn.t !== 'id') this.err('Cần tên tham số', pn); params.push({ type: pt, name: pn.v }); } while (this.eatOp(','));
      }
      this.expectOp(')');
      if (this.isKw('throws')) { this.p++; do { this.parseType(); } while (this.eatOp(',')); }
      const body = this.block();
      out.methods.push({ name: nameTok.v, ret: type, params, body, line: nameTok.line });
    } else {
      this.p--;
      do {
        const nm = this.next(); let init = null;
        if (this.eatOp('=')) init = this.isOp('{') ? this.arrInit() : this.parseExpr();
        out.fields.push({ type, name: nm.v, init, line: nm.line, final: isFinal });
      } while (this.eatOp(','));
      this.expectOp(';');
    }
  }
  skipGenerics() {
    let depth = 0;
    do { const t = this.next(); if (t.t === 'op') { if (t.v === '<') depth++; else if (t.v === '>') depth--; else if (t.v === '>>') depth -= 2; } if (t.t === 'eof') this.err('Generic không hợp lệ'); } while (depth > 0);
  }
  parseType() {
    const t = this.peek(); let name;
    if (t.t === 'kw' && PRIM.has(t.v)) { name = t.v; this.p++; }
    else if (t.t === 'id') {
      name = t.v; this.p++;
      while (this.isOp('.') && this.peek(1).t === 'id') { this.p++; name = this.next().v; }
      if (this.isOp('<')) this.skipGenerics();
    } else this.err(`Cần một kiểu dữ liệu (gặp '${t.v}')`);
    while (this.isOp('[') && this.isOp(']', 1)) { this.p += 2; name += '[]'; }
    return name;
  }
  isDeclStart() {
    const t = this.peek();
    if (t.t === 'kw' && PRIM.has(t.v) && t.v !== 'void') return true;
    if (t.t === 'kw' && t.v === 'final') return true;
    if (t.t === 'id') {
      if (this.peek(1).t === 'id') return true;
      if (this.isOp('[', 1) && this.isOp(']', 2)) return true;
      if (this.isOp('<', 1)) { // generic decl: Name<...> id
        let d = 0, i = 1;
        for (; i < 30; i++) { const x = this.peek(i); if (x.t === 'op' && x.v === '<') d++; else if (x.t === 'op' && x.v === '>') d--; else if (x.t === 'op' && x.v === '>>') d -= 2; else if (x.t === 'eof' || (x.t === 'op' && [';', '(', ')', '{', '}'].includes(x.v))) return false; if (d <= 0) break; }
        return this.peek(i + 1).t === 'id';
      }
    }
    return false;
  }
  block() {
    const line = this.peek().line;
    this.expectOp('{'); const stmts = [];
    while (!this.isOp('}')) { if (this.peek().t === 'eof') throw cerr("Thiếu '}' đóng khối lệnh", this.prevLine()); stmts.push(this.stmt()); }
    this.p++;
    return { n: 'block', stmts, line };
  }
  localDecl() {
    const line = this.peek().line; let fin = false;
    if (this.isKw('final')) { fin = true; this.p++; }
    const type = this.parseType(); const vars = [];
    do {
      const nt = this.next(); if (nt.t !== 'id') this.err('Cần tên biến', nt);
      let init = null; let vt = type;
      while (this.isOp('[') && this.isOp(']', 1)) { this.p += 2; vt += '[]'; }
      if (this.eatOp('=')) init = this.isOp('{') ? this.arrInit() : this.parseExpr();
      vars.push({ name: nt.v, init, line: nt.line, type: vt });
    } while (this.eatOp(','));
    return { n: 'decl', type, vars, line, fin };
  }
  arrInit() {
    this.expectOp('{'); const list = [];
    while (!this.isOp('}')) { list.push(this.isOp('{') ? this.arrInit() : this.parseExpr()); if (!this.eatOp(',')) break; }
    this.expectOp('}');
    return { n: 'arrinit', list };
  }
  exprList() { const l = [this.parseExpr()]; while (this.eatOp(',')) l.push(this.parseExpr()); return l; }
  stmt() {
    const t = this.peek(), line = t.line;
    if (this.isOp('{')) return this.block();
    if (this.isOp(';')) { this.p++; return { n: 'empty', line }; }
    if (t.t === 'kw') {
      switch (t.v) {
        case 'if': {
          this.p++; this.expectOp('('); const s0 = this.p; const c = this.parseExpr(); const ctext = this.text(s0); this.expectOp(')');
          const then = this.stmt(); let els = null;
          if (this.isKw('else')) { this.p++; els = this.stmt(); }
          return { n: 'if', c, ctext, then, els, line };
        }
        case 'while': {
          this.p++; this.expectOp('('); const s0 = this.p; const c = this.parseExpr(); const ctext = this.text(s0); this.expectOp(')');
          return { n: 'while', c, ctext, body: this.stmt(), line };
        }
        case 'do': {
          this.p++; const body = this.stmt();
          if (!this.isKw('while')) this.err("Thiếu 'while' sau khối do");
          this.p++; this.expectOp('('); const s0 = this.p; const c = this.parseExpr(); const ctext = this.text(s0); this.expectOp(')'); this.expectOp(';');
          return { n: 'do', c, ctext, body, line };
        }
        case 'for': return this.forStmt();
        case 'switch': { this.p++; return this.switchRest(false, line); }
        case 'return': {
          this.p++; let e = null; if (!this.isOp(';')) e = this.parseExpr(); this.expectOp(';');
          return { n: 'return', e, line };
        }
        case 'break': this.p++; this.expectOp(';'); return { n: 'break', line };
        case 'continue': this.p++; this.expectOp(';'); return { n: 'continue', line };
        case 'throw': { this.p++; const e = this.parseExpr(); this.expectOp(';'); return { n: 'throw', e, line }; }
        case 'try': return this.tryStmt();
        default: break;
      }
    }
    if (t.t === 'id' && t.v === 'yield' && !this.isOp('=', 1) && !this.isOp('.', 1) && !this.isOp('(', 1) && !this.isOp('++', 1)) {
      this.p++; const e = this.parseExpr(); this.expectOp(';'); return { n: 'yield', e, line };
    }
    if (t.t === 'kw' && (t.v === 'else')) this.err("'else' không có 'if' tương ứng");
    if (this.isDeclStart()) { const d = this.localDecl(); this.expectOp(';'); return d; }
    const e = this.parseExpr();
    if (!['assign', 'incdec', 'call', 'new'].includes(e.n)) throw cerr('Đây không phải một câu lệnh hợp lệ (biểu thức đứng một mình)', line);
    this.expectOp(';');
    return { n: 'expr', e, line };
  }
  forStmt() {
    const line = this.peek().line; this.p++; this.expectOp('(');
    let init = null;
    if (!this.isOp(';')) {
      if (this.isDeclStart()) {
        const save = this.p; if (this.isKw('final')) this.p++;
        const type = this.parseType();
        if (this.peek().t === 'id' && this.isOp(':', 1)) {
          const name = this.next().v; this.p++; const iter = this.parseExpr(); this.expectOp(')');
          return { n: 'foreach', type, name, iter, body: this.stmt(), line };
        }
        this.p = save; init = this.localDecl();
      } else init = { n: 'exprs', list: this.exprList(), line };
    }
    this.expectOp(';');
    let c = null, ctext = '';
    if (!this.isOp(';')) { const s0 = this.p; c = this.parseExpr(); ctext = this.text(s0); }
    this.expectOp(';');
    const upd = this.isOp(')') ? [] : this.exprList();
    this.expectOp(')');
    return { n: 'for', init, c, ctext, upd, body: this.stmt(), line };
  }
  tryStmt() {
    const line = this.peek().line; this.p++;
    const block = this.block(); const catches = []; let fin = null;
    while (this.isKw('catch')) {
      this.p++; this.expectOp('(');
      if (this.isKw('final')) this.p++;
      const types = [this.parseType()]; while (this.eatOp('|')) types.push(this.parseType());
      const nm = this.next(); this.expectOp(')');
      catches.push({ types, name: nm.v, body: this.block() });
    }
    if (this.isKw('finally')) { this.p++; fin = this.block(); }
    if (!catches.length && !fin) throw cerr("'try' cần có 'catch' hoặc 'finally'", line);
    return { n: 'try', block, catches, fin, line };
  }
  switchRest(isExpr, line) {
    this.expectOp('('); const s0 = this.p; const subject = this.parseExpr(); const ctext = this.text(s0); this.expectOp(')'); this.expectOp('{');
    const cases = [];
    while (!this.isOp('}')) {
      if (this.peek().t === 'eof') throw cerr("Thiếu '}' đóng switch", this.prevLine());
      const cl = this.peek().line; let labels = [], isDefault = false;
      if (this.isKw('default')) { this.p++; isDefault = true; }
      else if (this.isKw('case')) { this.p++; labels.push(this.parseTernary()); while (this.eatOp(',')) labels.push(this.parseTernary()); }
      else this.err(`Trong switch cần 'case' hoặc 'default' (gặp '${this.peek().v}')`);
      let arrow = false;
      if (this.isOp('->')) { this.p++; arrow = true; }
      else if (this.isOp(':')) this.p++;
      else this.err("Thiếu ':' hoặc '->' sau case");
      let body;
      if (arrow) {
        if (this.isOp('{')) body = { kind: 'block', s: this.block() };
        else if (this.isKw('throw')) body = { kind: 'stmt', s: this.stmt() };
        else { const el = this.peek().line; const e = this.parseExpr(); this.expectOp(';'); body = { kind: 'expr', e, line: el }; }
      } else {
        body = []; while (!this.isKw('case') && !this.isKw('default') && !this.isOp('}')) { if (this.peek().t === 'eof') this.err("Thiếu '}' đóng switch"); body.push(this.stmt()); }
      }
      cases.push({ labels, isDefault, arrow, body, line: cl });
    }
    this.p++;
    return { n: 'switch', subject, ctext, cases, isExpr, line };
  }

  parseExpr() { return this.parseAssign(); }
  parseAssign() {
    const left = this.parseTernary(); const t = this.peek();
    if (t.t === 'op' && ASSIGN.has(t.v)) {
      if (!['name', 'index', 'field'].includes(left.n)) throw cerr('Vế trái của phép gán phải là một biến', t.line);
      this.p++; const value = this.parseAssign();
      return { n: 'assign', op: t.v, target: left, value, line: t.line };
    }
    return left;
  }
  parseTernary() {
    const c = this.parseBin(1);
    if (this.isOp('?')) {
      const line = this.next().line; const a = this.parseAssign(); this.expectOp(':'); const b = this.parseTernary();
      return { n: 'cond', c, a, b, line };
    }
    return c;
  }
  parseBin(min) {
    let left = this.parseUnary();
    for (;;) {
      const t = this.peek(); if (t.t !== 'op') break;
      const pr = BINPREC[t.v]; if (pr === undefined || pr < min) break;
      this.p++; const right = this.parseBin(pr + 1);
      left = { n: 'bin', op: t.v, l: left, r: right, line: t.line };
    }
    return left;
  }
  parseUnary() {
    const t = this.peek();
    if (t.t === 'op') {
      if (t.v === '+' || t.v === '-' || t.v === '!' || t.v === '~') { this.p++; const e = this.parseUnary(); return { n: 'un', op: t.v, e, line: t.line }; }
      if (t.v === '++' || t.v === '--') { this.p++; const e = this.parseUnary(); return { n: 'incdec', op: t.v, prefix: true, target: e, line: t.line }; }
      if (t.v === '(' && this.peek(1).t === 'kw' && PRIM.has(this.peek(1).v) && this.isOp(')', 2)) {
        const type = this.peek(1).v; this.p += 3; const e = this.parseUnary(); return { n: 'cast', type, e, line: t.line };
      }
    }
    return this.parsePostfix();
  }
  args() { this.expectOp('('); const a = []; if (!this.isOp(')')) { do a.push(this.parseExpr()); while (this.eatOp(',')); } this.expectOp(')'); return a; }
  parsePostfix() {
    let e = this.parsePrimary();
    for (;;) {
      if (this.isOp('.')) {
        this.p++; const nt = this.next();
        if (nt.t !== 'id' && nt.t !== 'kw') this.err('Cần tên sau dấu chấm', nt);
        if (this.isOp('(')) e = { n: 'call', obj: e, name: nt.v, args: this.args(), line: nt.line };
        else e = { n: 'field', obj: e, name: nt.v, line: nt.line };
      } else if (this.isOp('[')) {
        const line = this.next().line; const idx = this.parseExpr(); this.expectOp(']');
        e = { n: 'index', obj: e, idx, line };
      } else if (this.isOp('++') || this.isOp('--')) {
        const t = this.next(); e = { n: 'incdec', op: t.v, prefix: false, target: e, line: t.line };
      } else break;
    }
    return e;
  }
  parsePrimary() {
    const t = this.peek();
    if (t.t === 'lit') { this.p++; return { n: 'lit', v: t.v, line: t.line }; }
    if (t.t === 'kw') {
      if (t.v === 'true') { this.p++; return { n: 'lit', v: TRUE, line: t.line }; }
      if (t.v === 'false') { this.p++; return { n: 'lit', v: FALSE, line: t.line }; }
      if (t.v === 'null') { this.p++; return { n: 'lit', v: NULL, line: t.line }; }
      if (t.v === 'switch') { this.p++; return this.switchRest(true, t.line); }
      if (t.v === 'new') return this.parseNew();
    }
    if (t.t === 'id') {
      this.p++;
      if (this.isOp('(')) return { n: 'call', obj: null, name: t.v, args: this.args(), line: t.line };
      return { n: 'name', name: t.v, line: t.line };
    }
    if (t.t === 'op' && t.v === '(') { this.p++; const e = this.parseExpr(); this.expectOp(')'); return e.n === 'bin' || e.n === 'cond' ? { ...e, paren: true } : e; }
    throw cerr(`Biểu thức không hợp lệ ở '${t.v}'`, t.line);
  }
  parseNew() {
    const line = this.next().line;
    const t = this.peek(); let name;
    if (t.t === 'kw' && PRIM.has(t.v)) { name = t.v; this.p++; }
    else if (t.t === 'id') { name = t.v; this.p++; while (this.isOp('.') && this.peek(1).t === 'id') { this.p++; name = this.next().v; } if (this.isOp('<')) this.skipGenerics(); }
    else this.err("Cần tên kiểu sau 'new'");
    if (this.isOp('[')) {
      const dims = []; let extra = 0;
      while (this.isOp('[')) { this.p++; if (this.isOp(']')) { this.p++; extra++; } else { dims.push(this.parseExpr()); this.expectOp(']'); } }
      let init = null; if (this.isOp('{')) init = this.arrInit();
      return { n: 'newarr', type: name, dims, extra, init, line };
    }
    return { n: 'new', type: name, args: this.args(), line };
  }
}

/* ---------- môi trường ---------- */
class Env {
  constructor(parent) { this.vars = new Map(); this.parent = parent || null; }
  find(n) { for (let e = this; e; e = e.parent) { const r = e.vars.get(n); if (r) return r; } return null; }
  declare(n, type, val, fin) { this.vars.set(n, { type, val, fin: !!fin }); }
}

/* ---------- thư viện chuỗi ---------- */
function jsplit(s, pattern, limit) {
  if (s === '') return [''];
  let rx; try { rx = new RegExp(pattern, 'g'); } catch (e) { jthrow('IllegalArgumentException', 'Regex không hợp lệ: ' + pattern); }
  const out = []; let last = 0, m;
  while ((m = rx.exec(s)) !== null) {
    if (m[0].length === 0) {
      rx.lastIndex++;
      if (m.index === 0 || m.index >= s.length) { if (m.index >= s.length) break; continue; }
    }
    if (limit > 0 && out.length === limit - 1) break;
    out.push(s.slice(last, m.index)); last = m.index + m[0].length;
  }
  out.push(s.slice(last));
  if (!limit) while (out.length > 0 && out[out.length - 1] === '') out.pop();
  return out;
}
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return h; }
function boxName(a) { return { I: 'Integer', L: 'Long', D: 'Double', C: 'Character', Z: 'Boolean', S: 'String' }[a.k] || a.k; }
function group(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function jformat(fmt, args) {
  let ai = 0;
  return fmt.replace(/%([-#+ 0,(]*)(\d+)?(?:\.(\d+))?([a-zA-Z%])/g, (m, flags, width, prec, conv) => {
    if (conv === 'n') return '\n';
    if (conv === '%') return '%';
    if (ai >= args.length) jthrow('MissingFormatArgumentException', "Format specifier '" + m + "'");
    const a = args[ai++]; let s = '', neg = false, numeric = false;
    switch (conv) {
      case 'd': if (a.k !== 'I' && a.k !== 'L') jthrow('IllegalFormatConversionException', 'd != java.lang.' + boxName(a)); numeric = true; neg = a.v < 0; s = String(Math.abs(a.v)); if (flags.includes(',')) s = group(s); break;
      case 'f': if (a.k !== 'D') jthrow('IllegalFormatConversionException', 'f != java.lang.' + boxName(a)); numeric = true; neg = a.v < 0 || Object.is(a.v, -0); s = Math.abs(a.v).toFixed(prec === undefined ? 6 : +prec); if (flags.includes(',')) { const [i, f] = s.split('.'); s = group(i) + (f !== undefined ? '.' + f : ''); } break;
      case 'e': case 'E': if (a.k !== 'D') jthrow('IllegalFormatConversionException', conv + ' != java.lang.' + boxName(a)); numeric = true; neg = a.v < 0; s = Math.abs(a.v).toExponential(prec === undefined ? 6 : +prec).replace(/e([+-])(\d)$/, 'e$10$2'); if (conv === 'E') s = s.toUpperCase(); break;
      case 'x': case 'X': if (a.k !== 'I' && a.k !== 'L') jthrow('IllegalFormatConversionException', conv + ' != java.lang.' + boxName(a)); s = (a.v >>> 0).toString(16); if (conv === 'X') s = s.toUpperCase(); break;
      case 's': case 'S': s = toStr(a); if (prec !== undefined) s = s.slice(0, +prec); if (conv === 'S') s = s.toUpperCase(); break;
      case 'b': case 'B': s = a.k === 'N' ? 'false' : a.k === 'Z' ? String(a.v) : 'true'; break;
      case 'c': case 'C': if (a.k !== 'C' && a.k !== 'I') jthrow('IllegalFormatConversionException', 'c != java.lang.' + boxName(a)); s = String.fromCharCode(a.v); break;
      default: jthrow('IllegalArgumentException', 'Unknown format conversion: ' + conv);
    }
    let sign = ''; if (numeric) sign = neg ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '';
    const w = width ? +width : 0;
    if (flags.includes('-')) return (sign + s).padEnd(w, ' ');
    if (flags.includes('0') && numeric) return sign + s.padStart(Math.max(0, w - sign.length), '0');
    return (sign + s).padStart(w, ' ');
  });
}
function parseIntJava(a, radix) {
  if (a.k === 'N') jthrow('NumberFormatException', 'Cannot parse null string');
  const s = a.v; const r = radix || 10;
  const re = r === 10 ? /^[+-]?\d+$/ : /^[+-]?[0-9a-zA-Z]+$/;
  if (!re.test(s)) jthrow('NumberFormatException', 'For input string: "' + s + '"' + (r !== 10 ? ' under radix ' + r : ''));
  const v = parseInt(s, r);
  if (Number.isNaN(v) || v > 2147483647 || v < -2147483648) jthrow('NumberFormatException', 'For input string: "' + s + '"' + (r !== 10 ? ' under radix ' + r : ''));
  return v;
}

/* ---------- bộ thực thi ---------- */
class Interp {
  constructor(prog, opts) {
    this.prog = prog; opts = opts || {};
    this.methods = new Map(); for (const m of prog.methods) this.methods.set(m.name + '/' + m.params.length, m);
    this.globals = new Map(); this.pool = new Map(); this.steps = 0; this.maxSteps = opts.maxSteps || 400000;
    this.trace = opts.trace ? [] : null; this.traceMax = opts.traceMax || 700; this.truncated = false;
    this.out = []; this.outLen = 0; this.fn = ''; this.depth = 0; this.curEnv = null;
  }
  intern(s) { let o = this.pool.get(s); if (!o) { o = mkS(s); this.pool.set(s, o); } return o; }
  print(s) { this.out.push(s); this.outLen += s.length; }
  initGlobals() {
    const env = new Env(null);
    for (const f of this.prog.fields) {
      let val; if (f.init) { val = f.init.n === 'arrinit' ? this.mkArray(f.type.replace(/\[\]$/, ''), f.init, env) : this.coerce(f.type, this.ev(f.init, env), f.line); }
      this.globals.set(f.name, { type: f.type, val, fin: f.final });
    }
  }
  findMethod(name, n) { return this.methods.get(name + '/' + n) || null; }

  /* --- trace --- */
  snap(env) {
    const scopes = []; for (let e = env; e; e = e.parent) scopes.push(e);
    const rows = [];
    for (const e of scopes.reverse()) for (const [n, r] of e.vars) if (r.val !== undefined) rows.push([n, r.type, show(r.val)]);
    return rows;
  }
  rec(line, note, env, extra) {
    if (!this.trace) return;
    if (this.trace.length >= this.traceMax) { this.truncated = true; return; }
    this.trace.push(Object.assign({ line, note: note || '', vars: this.snap(env || this.curEnv), outLen: this.outLen, fn: this.fn }, extra || {}));
  }
  recThrow(ex) {
    if (!this.trace) return;
    this.rec(this.curLine || 0, 'Ném ngoại lệ ' + toStr(ex), this.curEnv, { exc: true });
  }

  /* --- ép kiểu --- */
  coerce(type, v, line) {
    if (v === undefined) return v;
    const bad = () => cerr(`Không thể gán ${tn(v)} cho biến kiểu ${type}` + (isNum(v) && v.k === 'D' && /^(int|long|short|byte|char)$/.test(type) ? ' (mất độ chính xác: cần ép kiểu)' : ''), line);
    switch (type) {
      case 'int': case 'short': case 'byte': if (v.k === 'I') return v; if (v.k === 'C') return mkI(v.v); throw bad();
      case 'long': if (v.k === 'L') return v; if (v.k === 'I' || v.k === 'C') return mkL(v.v); throw bad();
      case 'double': case 'float': if (v.k === 'D') return v; if (isNum(v)) return mkD(v.v); throw bad();
      case 'boolean': if (v.k === 'Z') return v; throw bad();
      case 'char': if (v.k === 'C') return v; if (v.k === 'I') return mkC(v.v); throw bad();
      case 'String': if (v.k === 'S' || v.k === 'N') return v; throw bad();
      case 'StringBuilder': if (v.k === 'SB' || v.k === 'N') return v; throw bad();
      case 'Integer': if (v.k === 'N' || v.k === 'I') return v; if (v.k === 'C') return mkI(v.v); throw bad();
      case 'Double': if (v.k === 'N' || v.k === 'D') return v; if (v.k === 'I') return mkD(v.v); throw bad();
      case 'Boolean': if (v.k === 'N' || v.k === 'Z') return v; throw bad();
      case 'Character': if (v.k === 'N' || v.k === 'C') return v; throw bad();
      case 'Long': if (v.k === 'N' || v.k === 'L') return v; if (v.k === 'I') return mkL(v.v); throw bad();
      case 'void': return v;
      default:
        if (type.endsWith('[]')) { if (v.k === 'A' || v.k === 'N') return v; throw bad(); }
        return v;
    }
  }
  castTo(type, v, line) {
    if (!isNum(v)) { if (type === 'boolean' && v.k === 'Z') return v; throw cerr(`Không thể ép ${tn(v)} sang ${type}`, line); }
    const x = v.v;
    switch (type) {
      case 'int': { if (v.k === 'D') { if (Number.isNaN(x)) return mkI(0); return mkI(Math.max(-2147483648, Math.min(2147483647, Math.trunc(x)))); } return mkI(x); }
      case 'long': return mkL(v.k === 'D' ? (Number.isNaN(x) ? 0 : Math.trunc(x)) : x);
      case 'double': case 'float': return mkD(x);
      case 'char': return mkC(Math.trunc(x));
      case 'short': return mkI((Math.trunc(x) << 16) >> 16);
      case 'byte': return mkI((Math.trunc(x) << 24) >> 24);
      default: throw cerr('Không thể ép sang ' + type, line);
    }
  }
  defaultOf(t) {
    switch (t) { case 'int': case 'short': case 'byte': return mkI(0); case 'long': return mkL(0); case 'double': case 'float': return mkD(0); case 'char': return mkC(0); case 'boolean': return FALSE; default: return NULL; }
  }
  mkArray(elemType, init, env) {
    const vals = init.list.map(e => e.n === 'arrinit' ? this.mkArray(elemType.replace(/\[\]$/, ''), e, env) : this.coerce(elemType, this.ev(e, env), 0));
    return { k: 'A', t: elemType, v: vals };
  }
  newArr(type, dims, extra) {
    const [n, ...rest] = dims;
    if (n < 0) jthrow('NegativeArraySizeException', String(n));
    const et = type + '[]'.repeat(rest.length + extra);
    const v = []; for (let i = 0; i < n; i++) v.push(rest.length ? this.newArr(type, rest, extra) : this.defaultOf(et));
    return { k: 'A', t: et, v };
  }

  /* --- gọi hàm của người dùng --- */
  callUser(m, args, line) {
    if (args.length !== m.params.length) throw cerr(`Phương thức ${m.name} cần ${m.params.length} tham số`, line);
    const env = new Env(null);
    m.params.forEach((p, i) => env.declare(p.name, p.type, this.coerce(p.type, args[i], line)));
    if (++this.depth > 300) { this.depth--; jthrow('StackOverflowError', null); }
    const prevFn = this.fn, prevEnv = this.curEnv; this.fn = m.name;
    let sig;
    try { sig = this.execList(m.body.stmts, new Env(env)); }
    finally { this.fn = prevFn; this.depth--; this.curEnv = prevEnv; }
    if (m.ret === 'void') return NULL;
    if (!sig || sig.t !== 'return' || sig.v === undefined) throw cerr(`Phương thức ${m.name} chưa có câu lệnh return cho mọi trường hợp`, m.line);
    return this.coerce(m.ret, sig.v, m.line);
  }

  /* --- câu lệnh --- */
  execList(list, env) { for (const s of list) { const sig = this.exec(s, env); if (sig) return sig; } return undefined; }
  cond(e, env, line, what) {
    const v = this.ev(e, env);
    if (v.k !== 'Z') throw cerr(`Điều kiện của ${what} phải là boolean nhưng đang là ${tn(v)}` + (e.n === 'assign' ? " (bạn viết '=' là phép gán, để so sánh hãy dùng '==')" : ''), line);
    return v.v;
  }
  exec(s, env) {
    if (++this.steps > this.maxSteps) throw new Timeout();
    this.curEnv = env; this.curLine = s.line;
    switch (s.n) {
      case 'block': return this.execList(s.stmts, new Env(env));
      case 'empty': return undefined;
      case 'decl': {
        for (const d of s.vars) {
          let type = d.type || s.type, val;
          if (d.init) {
            if (d.init.n === 'arrinit') val = this.mkArray(type.replace(/\[\]$/, ''), d.init, env);
            else val = this.ev(d.init, env);
            if (type === 'var') type = tn(val); else val = this.coerce(type, val, d.line);
          }
          if (env.find(d.name)) throw cerr(`Biến '${d.name}' đã được khai báo trước đó`, d.line);
          env.declare(d.name, type, val, s.fin);
        }
        this.rec(s.line, '', env); return undefined;
      }
      case 'expr': this.ev(s.e, env); this.rec(s.line, '', env); return undefined;
      case 'if': {
        const c = this.cond(s.c, env, s.line, 'if');
        this.rec(s.line, `${s.ctext}  →  ${c}` + (c ? ': vào nhánh if' : (s.els ? ': sang nhánh else' : ': bỏ qua')), env);
        if (c) return this.exec(s.then, env);
        if (s.els) return this.exec(s.els, env);
        return undefined;
      }
      case 'while': {
        for (;;) {
          if (++this.steps > this.maxSteps) throw new Timeout();
          const c = this.cond(s.c, env, s.line, 'while'); this.rec(s.line, `${s.ctext}  →  ${c}`, env);
          if (!c) break;
          const sig = this.exec(s.body, env);
          if (sig) { if (sig.t === 'break') break; if (sig.t === 'continue') continue; return sig; }
        }
        return undefined;
      }
      case 'do': {
        for (;;) {
          if (++this.steps > this.maxSteps) throw new Timeout();
          const sig = this.exec(s.body, env);
          if (sig) { if (sig.t === 'break') break; if (sig.t !== 'continue') return sig; }
          const c = this.cond(s.c, env, s.line, 'do-while'); this.rec(s.line, `${s.ctext}  →  ${c}`, env);
          if (!c) break;
        }
        return undefined;
      }
      case 'for': {
        const fe = new Env(env);
        if (s.init) { if (s.init.n === 'decl') this.exec(s.init, fe); else for (const e of s.init.list) this.ev(e, fe); }
        for (;;) {
          if (++this.steps > this.maxSteps) throw new Timeout();
          this.curEnv = fe; this.curLine = s.line;
          let c = true; if (s.c) { c = this.cond(s.c, fe, s.line, 'for'); this.rec(s.line, `${s.ctext}  →  ${c}`, fe); }
          if (!c) break;
          const sig = this.exec(s.body, fe);
          if (sig) { if (sig.t === 'break') break; if (sig.t !== 'continue') return sig; }
          for (const u of s.upd) this.ev(u, fe);
        }
        return undefined;
      }
      case 'foreach': {
        const it = this.ev(s.iter, env);
        if (it.k === 'N') jthrow('NullPointerException', 'Cannot iterate over null');
        if (it.k !== 'A') throw cerr('for-each chỉ dùng được với mảng', s.line);
        for (const x of it.v.slice()) {
          const fe = new Env(env); fe.declare(s.name, s.type === 'var' ? tn(x) : s.type, this.coerce(s.type === 'var' ? tn(x) : s.type, x, s.line));
          this.rec(s.line, `${s.name} = ${show(x)}`, fe);
          const sig = this.exec(s.body, fe);
          if (sig) { if (sig.t === 'break') break; if (sig.t !== 'continue') return sig; }
        }
        return undefined;
      }
      case 'return': {
        let v; if (s.e) v = this.ev(s.e, env);
        this.rec(s.line, 'return' + (v !== undefined ? ' ' + show(v) : ''), env);
        return { t: 'return', v };
      }
      case 'break': this.rec(s.line, 'break', env); return { t: 'break' };
      case 'continue': this.rec(s.line, 'continue', env); return { t: 'continue' };
      case 'yield': { const v = this.ev(s.e, env); return { t: 'yield', v }; }
      case 'throw': {
        const v = this.ev(s.e, env);
        if (v.k === 'N') jthrow('NullPointerException', 'Cannot throw null');
        if (v.k !== 'EX') throw cerr(`Sau 'throw' phải là một đối tượng ngoại lệ (new ...Exception(...)), nhưng đang là ${tn(v)}`, s.line);
        this.rec(s.line, 'throw ' + toStr(v), env, { exc: true });
        throw new JThrow(v);
      }
      case 'try': return this.execTry(s, env);
      case 'switch': return this.execSwitch(s, env, false);
      default: throw cerr('Câu lệnh chưa được hỗ trợ: ' + s.n, s.line);
    }
  }
  execTry(s, env) {
    let sig;
    try {
      try { sig = this.exec(s.block, env); }
      catch (e) {
        let ex = null;
        if (e instanceof JThrow) ex = e.ex;
        else if (e instanceof RangeError) ex = { k: 'EX', cls: 'StackOverflowError', msg: null };
        if (!ex) throw e;
        const c = s.catches.find(c => c.types.some(t => isSub(ex.cls, t)));
        if (!c) throw (e instanceof JThrow ? e : new JThrow(ex));
        const ce = new Env(env); ce.declare(c.name, ex.cls, ex);
        this.curEnv = ce; this.rec(c.body.line - 0, `Bắt được ${ex.cls}: vào catch`, ce);
        sig = this.exec(c.body, ce);
      }
    } finally {
      if (s.fin) { const fs = this.exec(s.fin, env); if (fs) sig = fs; }
    }
    return sig;
  }
  switchEq(a, b) {
    if ((a.k === 'S' && b.k === 'S')) return a.v === b.v;
    if (isIntegral(a) && isIntegral(b)) return a.v === b.v;
    return false;
  }
  execSwitch(s, env, isExpr) {
    const subj = this.ev(s.subject, env);
    if (subj.k === 'N') jthrow('NullPointerException', 'switch trên giá trị null');
    if (subj.k === 'D' || subj.k === 'L' || subj.k === 'Z') throw cerr(`switch không hỗ trợ kiểu ${tn(subj)} (chỉ int, char, String, enum...)`, s.line);
    let idx = -1, def = -1; const seen = [];
    s.cases.forEach((c, i) => {
      if (c.isDefault) def = i;
      for (const lab of c.labels) {
        const lv = this.ev(lab, env);
        if ((subj.k === 'S') !== (lv.k === 'S')) throw cerr(`Nhãn case kiểu ${tn(lv)} không khớp với kiểu ${tn(subj)} của switch`, c.line);
        const key = lv.k === 'S' ? 's:' + lv.v : 'n:' + lv.v;
        if (seen.includes(key)) throw cerr(`Nhãn case bị trùng: ${show(lv)}`, c.line);
        seen.push(key);
        if (idx < 0 && this.switchEq(subj, lv)) idx = i;
      }
    });
    const hit = idx >= 0 ? idx : def;
    const lbl = hit < 0 ? '' : (s.cases[hit].isDefault ? 'default' : 'case ' + s.cases[hit].labels.map(l => l.n === 'lit' ? show(l.v) : '…').join(', '));
    this.rec(s.line, `switch (${s.ctext}) = ${show(subj)}  →  ` + (hit < 0 ? 'không có case nào khớp' : 'vào ' + lbl), env);
    if (hit < 0) { if (isExpr) jthrow('IllegalStateException', 'switch không có nhánh nào khớp'); return undefined; }
    const se = new Env(env);
    const c = s.cases[hit];
    if (c.arrow) {
      const b = c.body;
      if (b.kind === 'expr') { const v = this.ev(b.e, se); this.rec(b.line, '→ ' + show(v), se); return isExpr ? { t: 'yield', v } : undefined; }
      const sig = this.exec(b.kind === 'block' ? b.s : b.s, se);
      if (sig && sig.t === 'yield') return isExpr ? sig : undefined;
      return sig;
    }
    for (let i = hit; i < s.cases.length; i++) {
      const sig = this.execList(s.cases[i].body, se);
      if (sig) { if (sig.t === 'break') return undefined; return sig; }
    }
    return undefined;
  }

  /* --- biểu thức --- */
  ev(e, env) {
    switch (e.n) {
      case 'lit': return e.v.k === 'S' ? this.intern(e.v.v) : e.v;
      case 'name': {
        const r = env.find(e.name) || this.globals.get(e.name);
        if (!r) throw cerr(`Không tìm thấy biến '${e.name}'`, e.line);
        if (r.val === undefined) throw cerr(`Biến '${e.name}' chưa được gán giá trị trước khi dùng`, e.line);
        return r.val;
      }
      case 'bin': {
        if (e.op === '&&') { const a = this.ev(e.l, env); this.needBool(a, '&&', e.line); if (!a.v) return FALSE; const b = this.ev(e.r, env); this.needBool(b, '&&', e.line); return b; }
        if (e.op === '||') { const a = this.ev(e.l, env); this.needBool(a, '||', e.line); if (a.v) return TRUE; const b = this.ev(e.r, env); this.needBool(b, '||', e.line); return b; }
        return this.binop(e.op, this.ev(e.l, env), this.ev(e.r, env), e.line);
      }
      case 'un': {
        const v = this.ev(e.e, env);
        if (e.op === '!') { this.needBool(v, '!', e.line); return Zb(!v.v); }
        if (!isNum(v)) throw cerr(`Toán tử '${e.op}' không áp dụng cho ${tn(v)}`, e.line);
        if (e.op === '-') return v.k === 'D' ? mkD(-v.v) : v.k === 'L' ? mkL(-v.v) : mkI(-v.v);
        if (e.op === '~') return v.k === 'L' ? mkL(~v.v) : mkI(~v.v);
        return v.k === 'C' ? mkI(v.v) : v;
      }
      case 'cast': return this.castTo(e.type, this.ev(e.e, env), e.line);
      case 'cond': return this.ev(this.cond(e.c, env, e.line, 'toán tử ?:') ? e.a : e.b, env);
      case 'assign': return this.assign(e, env);
      case 'incdec': return this.incdec(e, env);
      case 'call': return this.call(e, env);
      case 'field': return this.field(e, env);
      case 'index': {
        const a = this.ev(e.obj, env), i = this.ev(e.idx, env);
        if (a.k === 'N') jthrow('NullPointerException', 'Cannot load from array because it is null');
        if (a.k !== 'A') throw cerr(`${tn(a)} không phải là mảng`, e.line);
        if (!isIntegral(i)) throw cerr('Chỉ số mảng phải là số nguyên', e.line);
        if (i.v < 0 || i.v >= a.v.length) jthrow('ArrayIndexOutOfBoundsException', `Index ${i.v} out of bounds for length ${a.v.length}`);
        return a.v[i.v];
      }
      case 'new': return this.newObj(e, env);
      case 'newarr': {
        if (e.init) return this.mkArray(e.type + '[]'.repeat(Math.max(0, e.extra - 1)), e.init, env);
        const dims = e.dims.map(d => { const v = this.ev(d, env); if (!isIntegral(v)) throw cerr('Kích thước mảng phải là số nguyên', e.line); return v.v; });
        return this.newArr(e.type, dims, e.extra);
      }
      case 'arrinit': throw cerr('Khởi tạo mảng {..} chỉ dùng khi khai báo', 0);
      case 'switch': { const sig = this.execSwitch(e, env, true); return sig && sig.v !== undefined ? sig.v : NULL; }
      default: throw cerr('Biểu thức chưa được hỗ trợ: ' + e.n, e.line);
    }
  }
  needBool(v, op, line) { if (v.k !== 'Z') throw cerr(`Toán tử '${op}' cần boolean nhưng đang là ${tn(v)}`, line); }
  binop(op, a, b, line) {
    switch (op) {
      case '+': if (a.k === 'S' || b.k === 'S') return mkS(toStr(a) + toStr(b)); return this.arith(op, a, b, line);
      case '-': case '*': case '/': case '%': return this.arith(op, a, b, line);
      case '<': case '>': case '<=': case '>=': {
        if (!isNum(a) || !isNum(b)) throw cerr(`Toán tử '${op}' không áp dụng cho ${tn(a)} và ${tn(b)}` + (a.k === 'Z' || b.k === 'Z' ? " (không thể viết 0 <= x <= 10, hãy dùng '&&')" : ''), line);
        return Zb(op === '<' ? a.v < b.v : op === '>' ? a.v > b.v : op === '<=' ? a.v <= b.v : a.v >= b.v);
      }
      case '==': case '!=': {
        let r;
        if (isNum(a) && isNum(b)) r = a.v === b.v;
        else if (a.k === 'Z' && b.k === 'Z') r = a.v === b.v;
        else if (a.k === 'N' || b.k === 'N') r = a.k === b.k;
        else if (a.k === b.k && ['S', 'SB', 'A', 'EX'].includes(a.k)) r = a === b;
        else throw cerr(`Không thể so sánh ${tn(a)} với ${tn(b)} bằng '${op}'`, line);
        return Zb(op === '==' ? r : !r);
      }
      case '&': case '|': case '^':
        if (a.k === 'Z' && b.k === 'Z') return Zb(op === '&' ? a.v && b.v : op === '|' ? a.v || b.v : a.v !== b.v);
        if (isIntegral(a) && isIntegral(b)) { const r = op === '&' ? a.v & b.v : op === '|' ? a.v | b.v : a.v ^ b.v; return (a.k === 'L' || b.k === 'L') ? mkL(r) : mkI(r); }
        throw cerr(`Toán tử '${op}' không áp dụng cho ${tn(a)} và ${tn(b)}`, line);
      case '<<': case '>>': case '>>>':
        if (!isIntegral(a) || !isIntegral(b)) throw cerr(`Toán tử '${op}' cần số nguyên`, line);
        return mkI(op === '<<' ? a.v << b.v : op === '>>' ? a.v >> b.v : a.v >>> b.v);
      default: throw cerr('Toán tử chưa được hỗ trợ: ' + op, line);
    }
  }
  arith(op, a, b, line) {
    if (!isNum(a) || !isNum(b)) throw cerr(`Toán tử '${op}' không áp dụng cho ${tn(a)} và ${tn(b)}`, line);
    const x = a.v, y = b.v;
    if (a.k === 'D' || b.k === 'D') return mkD(op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : op === '/' ? x / y : x % y);
    const l = a.k === 'L' || b.k === 'L';
    if ((op === '/' || op === '%') && y === 0) jthrow('ArithmeticException', '/ by zero');
    let r;
    switch (op) { case '+': r = x + y; break; case '-': r = x - y; break; case '*': r = l ? x * y : Math.imul(x, y); break; case '/': r = Math.trunc(x / y); break; default: r = x % y; }
    return l ? mkL(r) : mkI(r);
  }
  assign(e, env) {
    const t = e.target;
    if (t.n === 'name') {
      const r = env.find(t.name) || this.globals.get(t.name);
      if (!r) throw cerr(`Không tìm thấy biến '${t.name}'`, e.line);
      if (r.fin && (r.val !== undefined || this.globals.get(t.name) === r)) throw cerr(`Không thể gán lại biến final '${t.name}'`, e.line);
      let v;
      if (e.op === '=') v = this.coerce(r.type, this.ev(e.value, env), e.line);
      else {
        if (r.val === undefined) throw cerr(`Biến '${t.name}' chưa được gán giá trị trước khi dùng`, e.line);
        const rhs = this.ev(e.value, env); const res = this.binop(e.op.slice(0, -1), r.val, rhs, e.line);
        v = (r.type === 'String' || res.k === 'S' || res.k === 'Z') ? this.coerce(r.type, res, e.line) : this.castTo(r.type === 'Integer' ? 'int' : r.type, res, e.line);
      }
      r.val = v; return v;
    }
    if (t.n === 'index') {
      const a = this.ev(t.obj, env), i = this.ev(t.idx, env);
      if (a.k === 'N') jthrow('NullPointerException', 'Cannot store to array because it is null');
      if (a.k !== 'A') throw cerr(`${tn(a)} không phải là mảng`, e.line);
      if (i.v < 0 || i.v >= a.v.length) jthrow('ArrayIndexOutOfBoundsException', `Index ${i.v} out of bounds for length ${a.v.length}`);
      let v;
      if (e.op === '=') v = this.coerce(a.t, this.ev(e.value, env), e.line);
      else { const res = this.binop(e.op.slice(0, -1), a.v[i.v], this.ev(e.value, env), e.line); v = res.k === 'S' ? res : this.castTo(a.t, res, e.line); }
      a.v[i.v] = v; return v;
    }
    throw cerr('Không thể gán cho trường này', e.line);
  }
  incdec(e, env) {
    const t = e.target; const d = e.op === '++' ? 1 : -1;
    const upd = v => {
      if (!isNum(v)) throw cerr(`Toán tử '${e.op}' không áp dụng cho ${tn(v)}`, e.line);
      return v.k === 'D' ? mkD(v.v + d) : v.k === 'L' ? mkL(v.v + d) : v.k === 'C' ? mkC(v.v + d) : mkI(v.v + d);
    };
    if (t.n === 'name') {
      const r = env.find(t.name) || this.globals.get(t.name);
      if (!r) throw cerr(`Không tìm thấy biến '${t.name}'`, e.line);
      if (r.val === undefined) throw cerr(`Biến '${t.name}' chưa được gán giá trị trước khi dùng`, e.line);
      const old = r.val; r.val = upd(old); return e.prefix ? r.val : old;
    }
    if (t.n === 'index') {
      const a = this.ev(t.obj, env), i = this.ev(t.idx, env);
      if (a.k !== 'A') throw cerr('Không phải mảng', e.line);
      if (i.v < 0 || i.v >= a.v.length) jthrow('ArrayIndexOutOfBoundsException', `Index ${i.v} out of bounds for length ${a.v.length}`);
      const old = a.v[i.v]; a.v[i.v] = upd(old); return e.prefix ? a.v[i.v] : old;
    }
    throw cerr(`Toán tử '${e.op}' cần một biến`, e.line);
  }
  field(e, env) {
    const o = e.obj;
    if (o.n === 'name' && !env.find(o.name) && !this.globals.has(o.name) && STATICS.has(o.name)) {
      const key = o.name + '.' + e.name;
      const K = { 'Math.PI': mkD(Math.PI), 'Math.E': mkD(Math.E), 'Integer.MAX_VALUE': mkI(2147483647), 'Integer.MIN_VALUE': mkI(-2147483648), 'Double.MAX_VALUE': mkD(Number.MAX_VALUE), 'Double.MIN_VALUE': mkD(5e-324), 'Long.MAX_VALUE': mkL(9223372036854775807), 'Long.MIN_VALUE': mkL(-9223372036854775808) };
      if (K[key]) return K[key];
      throw cerr(`Không tìm thấy ${key}`, e.line);
    }
    const v = this.ev(o, env);
    if (v.k === 'N') jthrow('NullPointerException', `Cannot read field "${e.name}" because value is null`);
    if (v.k === 'A' && e.name === 'length') return mkI(v.v.length);
    if (v.k === 'S' && e.name === 'length') throw cerr("String dùng length() có ngoặc, không phải .length", e.line);
    throw cerr(`${tn(v)} không có trường '${e.name}'`, e.line);
  }
  newObj(e, env) {
    const args = e.args.map(a => this.ev(a, env));
    const t = e.type;
    if (t === 'String') {
      if (!args.length) return mkS('');
      const a = args[0];
      if (a.k === 'A') return mkS(a.v.map(c => String.fromCharCode(c.v)).join(''));
      return mkS(toStr(a));
    }
    if (t === 'StringBuilder' || t === 'StringBuffer') {
      const o = { k: 'SB', v: '' };
      if (args.length && args[0].k !== 'I') { if (args[0].k === 'N') jthrow('NullPointerException', null); o.v = toStr(args[0]); }
      return o;
    }
    if (/(Exception|Error)$/.test(t) || t === 'Throwable') {
      let msg = null; if (args.length && args[0].k !== 'N') msg = args[0].k === 'EX' ? toStr(args[0]) : toStr(args[0]);
      return { k: 'EX', cls: t, msg };
    }
    if (t === 'Object') return { k: 'O', v: {} };
    throw cerr(`Lớp '${t}' chưa được hỗ trợ trong trình chạy này`, e.line);
  }
  call(e, env) {
    if (!e.obj) {
      const args = e.args.map(a => this.ev(a, env));
      const m = this.findMethod(e.name, args.length);
      if (!m) throw cerr(`Không tìm thấy phương thức ${e.name}(${args.length} tham số)`, e.line);
      this.curLine = e.line;
      return this.callUser(m, args, e.line);
    }
    const o = e.obj; let cls = null;
    if (o.n === 'name' && !env.find(o.name) && !this.globals.has(o.name) && STATICS.has(o.name)) cls = o.name;
    else if (o.n === 'field' && o.obj.n === 'name' && o.obj.name === 'System' && !env.find('System')) cls = 'System.' + o.name;
    if (cls) { const args = e.args.map(a => this.ev(a, env)); this.curLine = e.line; return this.staticCall(cls, e.name, args, e.line); }
    const target = this.ev(o, env); const args = e.args.map(a => this.ev(a, env));
    this.curLine = e.line;
    return this.instCall(target, e.name, args, e.line);
  }

  /* --- phương thức static --- */
  staticCall(cls, name, a, line) {
    const num = i => { if (!isNum(a[i])) throw cerr(`${cls}.${name}: tham số phải là số`, line); return a[i]; };
    const bad = () => cerr(`Không tìm thấy phương thức ${cls}.${name}(...)`, line);
    switch (cls) {
      case 'System.out': case 'System.err': {
        if (name === 'println') { this.print((a.length ? (a[0].k === 'A' && a[0].t === 'char' ? a[0].v.map(c => String.fromCharCode(c.v)).join('') : toStr(a[0])) : '') + '\n'); return NULL; }
        if (name === 'print') { this.print(toStr(a[0])); return NULL; }
        if (name === 'printf' || name === 'format') { this.print(jformat(a[0].v, a.slice(1))); return NULL; }
        throw bad();
      }
      case 'Math': {
        const f = x => Math[name](x.v);
        switch (name) {
          case 'abs': { const x = num(0); return x.k === 'D' ? mkD(Math.abs(x.v)) : x.k === 'L' ? mkL(Math.abs(x.v)) : mkI(Math.abs(x.v)); }
          case 'max': case 'min': { const x = num(0), y = num(1); const r = Math[name](x.v, y.v); return (x.k === 'D' || y.k === 'D') ? mkD(r) : (x.k === 'L' || y.k === 'L') ? mkL(r) : mkI(r); }
          case 'sqrt': case 'cbrt': case 'floor': case 'ceil': case 'log': case 'log10': case 'exp': case 'sin': case 'cos': case 'tan': case 'signum': return mkD(f(num(0)));
          case 'pow': return mkD(Math.pow(num(0).v, num(1).v));
          case 'hypot': return mkD(Math.hypot(num(0).v, num(1).v));
          case 'round': { const x = num(0); return x.k === 'D' ? mkL(Math.floor(x.v + 0.5)) : mkI(x.v); }
          case 'random': return mkD(Math.random());
          default: throw bad();
        }
      }
      case 'Integer': switch (name) {
        case 'parseInt': case 'valueOf': if (a[0].k === 'I') return a[0]; return mkI(parseIntJava(a[0], a[1] && a[1].v));
        case 'toString': return mkS(String(a[0].v));
        case 'compare': return mkI(Math.sign(a[0].v - a[1].v));
        case 'max': return mkI(Math.max(a[0].v, a[1].v)); case 'min': return mkI(Math.min(a[0].v, a[1].v)); case 'sum': return mkI(a[0].v + a[1].v);
        case 'toBinaryString': return mkS((a[0].v >>> 0).toString(2));
        default: throw bad();
      }
      case 'Long': if (name === 'parseLong' || name === 'valueOf') { if (a[0].k === 'N' || !/^[+-]?\d+$/.test(a[0].v)) jthrow('NumberFormatException', a[0].k === 'N' ? 'Cannot parse null string' : 'For input string: "' + a[0].v + '"'); return mkL(parseInt(a[0].v, 10)); } throw bad();
      case 'Double': switch (name) {
        case 'parseDouble': case 'valueOf': {
          if (a[0].k === 'D') return a[0]; if (isNum(a[0])) return mkD(a[0].v);
          if (a[0].k === 'N') jthrow('NullPointerException', null);
          const s = a[0].v.trim(); if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[dDfF]?$/.test(s)) jthrow('NumberFormatException', s === '' ? 'empty String' : 'For input string: "' + a[0].v + '"');
          return mkD(parseFloat(s));
        }
        case 'compare': return mkI(a[0].v < a[1].v ? -1 : a[0].v > a[1].v ? 1 : 0);
        case 'isNaN': return Zb(Number.isNaN(a[0].v));
        case 'toString': return mkS(toStr(mkD(a[0].v)));
        default: throw bad();
      }
      case 'Boolean': if (name === 'parseBoolean' || name === 'valueOf') return Zb(a[0].k === 'S' && a[0].v.toLowerCase() === 'true'); if (name === 'toString') return mkS(toStr(a[0])); throw bad();
      case 'Character': {
        const ch = String.fromCharCode(a[0].v);
        switch (name) {
          case 'isDigit': return Zb(/\p{Nd}/u.test(ch)); case 'isLetter': return Zb(/\p{L}/u.test(ch)); case 'isLetterOrDigit': return Zb(/[\p{L}\p{Nd}]/u.test(ch));
          case 'isUpperCase': return Zb(/\p{Lu}/u.test(ch)); case 'isLowerCase': return Zb(/\p{Ll}/u.test(ch)); case 'isWhitespace': return Zb(/\s/.test(ch));
          case 'toUpperCase': return a[0].k === 'C' ? mkC(ch.toUpperCase().charCodeAt(0)) : mkI(ch.toUpperCase().charCodeAt(0));
          case 'toLowerCase': return a[0].k === 'C' ? mkC(ch.toLowerCase().charCodeAt(0)) : mkI(ch.toLowerCase().charCodeAt(0));
          case 'getNumericValue': return mkI(/[0-9]/.test(ch) ? +ch : /[a-zA-Z]/.test(ch) ? ch.toLowerCase().charCodeAt(0) - 87 : -1);
          case 'toString': case 'valueOf': return name === 'toString' ? mkS(ch) : a[0];
          default: throw bad();
        }
      }
      case 'String': switch (name) {
        case 'valueOf': case 'copyValueOf': return a[0].k === 'A' && a[0].t === 'char' ? mkS(a[0].v.map(c => String.fromCharCode(c.v)).join('')) : mkS(toStr(a[0]));
        case 'format': if (a[0].k === 'N') jthrow('NullPointerException', null); return mkS(jformat(a[0].v, a.slice(1)));
        case 'join': {
          const d = toStr(a[0]); let items = a.slice(1); if (items.length === 1 && items[0].k === 'A') items = items[0].v;
          return mkS(items.map(toStr).join(d));
        }
        default: throw bad();
      }
      case 'Objects': switch (name) {
        case 'equals': { const x = a[0], y = a[1]; if (x.k === 'N' || y.k === 'N') return Zb(x.k === y.k); if (x.k === 'S' && y.k === 'S') return Zb(x.v === y.v); if (isNum(x) && isNum(y)) return Zb(x.k === y.k && x.v === y.v); return Zb(x === y); }
        case 'isNull': return Zb(a[0].k === 'N'); case 'nonNull': return Zb(a[0].k !== 'N');
        case 'requireNonNull': if (a[0].k === 'N') jthrow('NullPointerException', a[1] ? toStr(a[1]) : null); return a[0];
        case 'toString': return mkS(toStr(a[0]));
        default: throw bad();
      }
      case 'Arrays': switch (name) {
        case 'toString': if (a[0].k === 'N') return mkS('null'); return mkS('[' + a[0].v.map(toStr).join(', ') + ']');
        case 'sort': a[0].v.sort((x, y) => x.k === 'S' ? (x.v < y.v ? -1 : x.v > y.v ? 1 : 0) : x.v - y.v); return NULL;
        case 'fill': a[0].v.fill(a[1]); return NULL;
        case 'copyOf': { const n = a[1].v; const r = a[0].v.slice(0, n); while (r.length < n) r.push(this.defaultOf(a[0].t)); return { k: 'A', t: a[0].t, v: r }; }
        case 'equals': return Zb(a[0].v.length === a[1].v.length && a[0].v.every((x, i) => toStr(x) === toStr(a[1].v[i])));
        default: throw bad();
      }
      case 'System': if (name === 'currentTimeMillis' || name === 'nanoTime') return mkL(Date.now()); if (name === 'exit') return NULL; throw bad();
      default: throw bad();
    }
  }

  /* --- phương thức của đối tượng --- */
  instCall(t, name, a, line) {
    switch (t.k) {
      case 'N': jthrow('NullPointerException', `Cannot invoke "${name}()" because the value is null`); break;
      case 'S': return this.strCall(t, name, a, line);
      case 'SB': return this.sbCall(t, name, a, line);
      case 'EX':
        switch (name) {
          case 'getMessage': case 'getLocalizedMessage': return t.msg === null ? NULL : mkS(t.msg);
          case 'toString': return mkS(toStr(t));
          case 'printStackTrace': this.print(toStr(t) + '\n'); return NULL;
          case 'getClass': return { k: 'CLASS', v: t.cls };
          default: throw cerr(`Ngoại lệ không có phương thức ${name}()`, line);
        }
      case 'CLASS': if (name === 'getSimpleName') return mkS(t.v); if (name === 'getName') return mkS(qualName(t.v)); break;
      case 'A': if (name === 'clone') return { k: 'A', t: t.t, v: t.v.slice() }; if (name === 'length') throw cerr("Mảng dùng .length (không có ngoặc)", line); break;
      default: throw cerr(`Kiểu ${tn(t)} là kiểu nguyên thủy nên không gọi được .${name}()`, line);
    }
    throw cerr(`Không tìm thấy phương thức ${name}() cho ${tn(t)}`, line);
  }
  strCall(t, name, a, line) {
    const s = t.v; const ci = i => { const v = a[i]; if (!v || !isIntegral(v)) throw cerr(`${name}: cần số nguyên ở tham số ${i + 1}`, line); return v.v; };
    const sv = i => { const v = a[i]; if (!v) throw cerr(`${name}: thiếu tham số`, line); if (v.k === 'N') jthrow('NullPointerException', null); return v.k === 'C' ? String.fromCharCode(v.v) : toStr(v); };
    const arg = n => { if (a.length !== n) throw cerr(`${name}() cần ${n} tham số`, line); };
    switch (name) {
      case 'length': return mkI(s.length);
      case 'charAt': { const i = ci(0); if (i < 0 || i >= s.length) jthrow('StringIndexOutOfBoundsException', `Index ${i} out of bounds for length ${s.length}`); return mkC(s.charCodeAt(i)); }
      case 'isEmpty': return Zb(s.length === 0);
      case 'isBlank': return Zb(s.trim().length === 0);
      case 'equals': return Zb(a[0].k === 'S' && a[0].v === s);
      case 'equalsIgnoreCase': return Zb(a[0].k === 'S' && a[0].v.toLowerCase() === s.toLowerCase());
      case 'contentEquals': return Zb(toStr(a[0]) === s);
      case 'compareTo': case 'compareToIgnoreCase': {
        let x = s, y = sv(0); if (name === 'compareToIgnoreCase') { x = x.toLowerCase(); y = y.toLowerCase(); }
        const n = Math.min(x.length, y.length); for (let i = 0; i < n; i++) if (x[i] !== y[i]) return mkI(x.charCodeAt(i) - y.charCodeAt(i));
        return mkI(x.length - y.length);
      }
      case 'contains': return Zb(s.includes(sv(0)));
      case 'startsWith': return Zb(a.length > 1 ? s.startsWith(sv(0), ci(1)) : s.startsWith(sv(0)));
      case 'endsWith': return Zb(s.endsWith(sv(0)));
      case 'indexOf': return mkI(a.length > 1 ? s.indexOf(sv(0), ci(1)) : s.indexOf(sv(0)));
      case 'lastIndexOf': return mkI(a.length > 1 ? s.lastIndexOf(sv(0), ci(1)) : s.lastIndexOf(sv(0)));
      case 'substring': {
        const b = ci(0), e = a.length > 1 ? ci(1) : s.length;
        if (b < 0 || e > s.length || b > e) jthrow('StringIndexOutOfBoundsException', `begin ${b}, end ${e}, length ${s.length}`);
        return mkS(s.slice(b, e));
      }
      case 'toUpperCase': return mkS(s.toUpperCase());
      case 'toLowerCase': return mkS(s.toLowerCase());
      case 'trim': return mkS(s.replace(/^[\u0000- ]+|[\u0000- ]+$/g, ''));
      case 'strip': return mkS(s.trim());
      case 'stripLeading': return mkS(s.trimStart());
      case 'stripTrailing': return mkS(s.trimEnd());
      case 'replace': return mkS(s.split(sv(0)).join(sv(1)));
      case 'replaceAll': case 'replaceFirst': { let rx; try { rx = new RegExp(sv(0), name === 'replaceAll' ? 'g' : ''); } catch (e) { jthrow('IllegalArgumentException', 'Regex không hợp lệ'); } return mkS(s.replace(rx, sv(1))); }
      case 'split': { arg(a.length); return { k: 'A', t: 'String', v: jsplit(s, sv(0), a[1] ? a[1].v : 0).map(x => mkS(x)) }; }
      case 'concat': return mkS(s + sv(0));
      case 'repeat': { const n = ci(0); if (n < 0) jthrow('IllegalArgumentException', 'count is negative: ' + n); return mkS(s.repeat(n)); }
      case 'toCharArray': return { k: 'A', t: 'char', v: [...s].map(c => mkC(c.charCodeAt(0))) };
      case 'matches': { let rx; try { rx = new RegExp('^(?:' + sv(0) + ')$'); } catch (e) { jthrow('IllegalArgumentException', 'Regex không hợp lệ'); } return Zb(rx.test(s)); }
      case 'hashCode': return mkI(hashStr(s));
      case 'intern': return this.intern(s);
      case 'toString': return t;
      case 'chars': throw cerr('chars() (Stream) chưa được hỗ trợ', line);
      case 'format': case 'formatted': return mkS(jformat(s, a));
      default: throw cerr(`String không có phương thức ${name}()`, line);
    }
  }
  sbCall(t, name, a, line) {
    const ci = i => { const v = a[i]; if (!v || !isIntegral(v)) throw cerr(`${name}: cần số nguyên`, line); return v.v; };
    const chk = (i, max) => { if (i < 0 || i > max) jthrow('StringIndexOutOfBoundsException', `index ${i},length ${t.v.length}`); };
    switch (name) {
      case 'append': t.v += (a[0].k === 'A' && a[0].t === 'char') ? a[0].v.map(c => String.fromCharCode(c.v)).join('') : toStr(a[0]); return t;
      case 'insert': { const i = ci(0); chk(i, t.v.length); t.v = t.v.slice(0, i) + toStr(a[1]) + t.v.slice(i); return t; }
      case 'reverse': t.v = [...t.v].reverse().join(''); return t;
      case 'deleteCharAt': { const i = ci(0); if (i < 0 || i >= t.v.length) jthrow('StringIndexOutOfBoundsException', `index ${i},length ${t.v.length}`); t.v = t.v.slice(0, i) + t.v.slice(i + 1); return t; }
      case 'delete': { const b = ci(0); let e = ci(1); if (e > t.v.length) e = t.v.length; if (b < 0 || b > e) jthrow('StringIndexOutOfBoundsException', `start ${b}, end ${e}, length ${t.v.length}`); t.v = t.v.slice(0, b) + t.v.slice(e); return t; }
      case 'replace': { const b = ci(0); let e = ci(1); if (e > t.v.length) e = t.v.length; if (b < 0 || b > t.v.length || b > e) jthrow('StringIndexOutOfBoundsException', `start ${b}, end ${e}, length ${t.v.length}`); t.v = t.v.slice(0, b) + toStr(a[2]) + t.v.slice(e); return t; }
      case 'setCharAt': { const i = ci(0); if (i < 0 || i >= t.v.length) jthrow('StringIndexOutOfBoundsException', `index ${i},length ${t.v.length}`); t.v = t.v.slice(0, i) + String.fromCharCode(a[1].v) + t.v.slice(i + 1); return NULL; }
      case 'setLength': { const n = ci(0); t.v = n <= t.v.length ? t.v.slice(0, n) : t.v + '\0'.repeat(n - t.v.length); return NULL; }
      case 'length': return mkI(t.v.length);
      case 'isEmpty': return Zb(t.v.length === 0);
      case 'charAt': { const i = ci(0); if (i < 0 || i >= t.v.length) jthrow('StringIndexOutOfBoundsException', `index ${i},length ${t.v.length}`); return mkC(t.v.charCodeAt(i)); }
      case 'indexOf': return mkI(t.v.indexOf(toStr(a[0])));
      case 'lastIndexOf': return mkI(t.v.lastIndexOf(toStr(a[0])));
      case 'substring': { const b = ci(0), e = a.length > 1 ? ci(1) : t.v.length; if (b < 0 || e > t.v.length || b > e) jthrow('StringIndexOutOfBoundsException', `start ${b}, end ${e}, length ${t.v.length}`); return mkS(t.v.slice(b, e)); }
      case 'toString': return mkS(t.v);
      case 'equals': return Zb(a[0] === t);
      case 'capacity': return mkI(Math.max(16, t.v.length));
      default: throw cerr(`StringBuilder không có phương thức ${name}()`, line);
    }
  }
}

/* ---------- API công khai ---------- */
function stripTrace(it, out) { out.out = it.out.join(''); out.trace = it.trace; out.truncated = it.truncated; return out; }
function failResult(it, e) {
  if (e instanceof JThrow) return stripTrace(it, { ex: { cls: e.ex.cls, msg: e.ex.msg } });
  if (e instanceof CompileError) return stripTrace(it, { err: 'compile', msg: e.message, line: e.line });
  if (e instanceof Timeout) return stripTrace(it, { err: 'timeout', msg: 'Chương trình chạy quá lâu (có thể bị lặp vô hạn).' });
  if (e instanceof RangeError) return stripTrace(it, { ex: { cls: 'StackOverflowError', msg: null } });
  return stripTrace(it, { err: 'internal', msg: String(e && e.message || e) });
}
function compile(src) {
  try { return { prog: new Parser(src).program() }; }
  catch (e) { if (e instanceof CompileError) return { err: 'compile', msg: e.message, line: e.line, out: '', trace: null }; throw e; }
}
function parseExprSrc(src) {
  const p = new Parser(src); const e = p.parseExpr();
  if (p.peek().t !== 'eof') throw cerr(`Biểu thức có phần thừa ở '${p.peek().v}'`, 1);
  return e;
}
function withInterp(src, opts, fn) {
  const c = compile(src); if (c.err) return c;
  const it = new Interp(c.prog, opts); const prev = CUR; CUR = it;
  try { it.initGlobals(); return fn(it); }
  catch (e) { return failResult(it, e); }
  finally { CUR = prev; }
}
/* gọi phương thức fn(args) – args là chuỗi mã Java */
function runCall(src, fn, argSrcs, opts) {
  return withInterp(src, opts, it => {
    const env = new Env(null);
    const args = argSrcs.map(a => it.ev(parseExprSrc(a), env));
    const m = it.findMethod(fn, args.length);
    if (!m) throw cerr(`Không tìm thấy phương thức ${fn} với ${args.length} tham số. Hãy giữ đúng tên và danh sách tham số.`, 1);
    const v = it.callUser(m, args, m.line);
    return stripTrace(it, { ok: true, value: v, ret: m.ret });
  });
}
/* tính một biểu thức, có thể gọi các phương thức trong src; vars: {tên: mã Java} */
function runExpr(src, exprSrc, vars, opts) {
  return withInterp(src || '', opts, it => {
    const env = new Env(null);
    for (const [k, v] of Object.entries(vars || {})) { const val = it.ev(parseExprSrc(v), env); env.declare(k, tn(val), val); }
    it.fn = 'main'; it.curEnv = env;
    const v = it.ev(parseExprSrc(exprSrc), env);
    return stripTrace(it, { ok: true, value: v });
  });
}
function literal(src) { return withInterp('', {}, it => ({ ok: true, value: it.ev(parseExprSrc(src), new Env(null)) })); }

function sameValue(got, exp) {
  if (got.k === 'D' || exp.k === 'D') return isNum(got) && isNum(exp) && Math.abs(got.v - exp.v) < 1e-6;
  if (isNum(got) && isNum(exp)) return got.v === exp.v;
  if (got.k !== exp.k) return false;
  if (got.k === 'S' || got.k === 'Z') return got.v === exp.v;
  return got.k === 'N';
}

G.JavaRunner = { runCall, runExpr, literal, compile, sameValue, show, toStr, tn, lex };
})(typeof window !== 'undefined' ? window : globalThis);
