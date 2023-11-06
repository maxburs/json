import assert from "node:assert";

interface Ctx {
  readonly json: string;
  pos: number;
}

function unexpectedChar(ctx: Ctx): never {
  throw new Error(
    `Unexpected character ${ctx.json[ctx.pos]} at index ${ctx.pos}`
  );
}

function parseObject(ctx: Ctx): unknown {
  assert.equal(ctx.json[ctx.pos], "{");
  ctx.pos++;
  const result: Record<string, unknown> = {};
  while (true) {
    skipWhitespace(ctx);
    if (ctx.json[ctx.pos] === "}") {
      ctx.pos++;
      return result;
    }
    const key = parseString(ctx);
    skipWhitespace(ctx);
    assert(ctx.json[ctx.pos] === ":");
    ctx.pos++;
    skipWhitespace(ctx);
    const value = _parseJson(ctx);
    result[key] = value;
  }
}

function parseArray(ctx: Ctx): unknown {
  assert.equal(ctx.json[ctx.pos], "[");
  const result = [];

  while (true) {
    skipWhitespace(ctx);
    switch (ctx.json[ctx.pos]) {
      case "]":
        ctx.pos++;
        return result;
      case ",":
        ctx.pos++;
        skipWhitespace(ctx);
        result.push(_parseJson(ctx));
        break;
      default:
        unexpectedChar(ctx);
    }
  }
}

function parseString(ctx: Ctx): string {
  assert.equal(ctx.json[ctx.pos], '"');
  const start = ctx.pos + 1;
  ctx.pos++;
  while (ctx.json[ctx.pos] !== '"') {
    if (ctx.json[ctx.pos] === "\\") {
      // TODO: Parse escape sequences
      ctx.pos++;
      ctx.pos++;
    }
    ctx.pos++;
  }
  const str = ctx.json.slice(start, ctx.pos);
  ctx.pos++;
  return str;
}

// TODO: Parse scientific notation, signs, and decimals
function parseNumber(ctx: Ctx): number {
  const start = ctx.pos;
  while (
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(
      ctx.json[ctx.pos]
    )
  ) {
    ctx.pos++;
  }
  const num = Number(ctx.json.slice(start, ctx.pos));
  ctx.pos++;
  return num;
}

function parseLiteral<T>(ctx: Ctx, literal: string, value: T): T {
  if (ctx.json.slice(ctx.pos, ctx.pos + literal.length) === literal) {
    ctx.pos += literal.length;
    return value;
  }
  unexpectedChar(ctx);
}

function skipWhitespace(ctx: Ctx) {
  while ([" ", "\t", "\n", "\r"].includes(ctx.json[ctx.pos])) {
    ctx.pos++;
  }
}

function _parseJson(ctx: Ctx): unknown {
  skipWhitespace(ctx);

  const char = ctx.json[ctx.pos];
  switch (char) {
    case "{":
      return parseObject(ctx);
    case "[":
      return parseArray(ctx);
    case '"':
      return parseString(ctx);
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      return parseNumber(ctx);
    case "t":
      return parseLiteral(ctx, "true", true);
    case "f":
      return parseLiteral(ctx, "false", false);
    case "n":
      return parseLiteral(ctx, "null", null);
    default:
      unexpectedChar(ctx);
  }
}

export function parseJson(json: string): unknown {
  const ctx: Ctx = { json, pos: 0 };
  const result = _parseJson(ctx);
  skipWhitespace(ctx);
  assert.equal(ctx.pos, json.length);
  return result;
}
