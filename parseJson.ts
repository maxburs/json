import assert from "node:assert";

function parseObject(json: string, index: number): [unknown, number] {
  assert(json[index] === "{");
  const result: Record<string, unknown> = {};
  let end = index + 1;
  while (true) {
    end = advanceWhitespace(json, end);
    switch (json[end]) {
      case "}":
        return [result, end + 1];
      case ",": {
        end++;
        end = advanceWhitespace(json, end);
        const [key, keyEnd] = parseString(json, end);
        end = keyEnd;
        end = advanceWhitespace(json, end);
        assert(json[end] === ":");
        end++;
        end = advanceWhitespace(json, end);
        const [value, newEnd] = _parseJson(json, end);
        result[key] = value;
        end = newEnd;
      }
    }
  }
}

function parseArray(json: string, index: number): [unknown, number] {
  assert(json[index] === "[");
  const result = [];
  let end = index + 1;
  while (true) {
    end = advanceWhitespace(json, end);
    switch (json[end]) {
      case "]":
        return [result, end + 1];
      case ",":
        {
          end++;
          end = advanceWhitespace(json, end);
          const [value, newEnd] = _parseJson(json, end);
          result.push(value);
          end = newEnd;
        }
        break;
    }
  }
}

function parseString(json: string, index: number): [string, number] {
  assert(json[index] === '"');
  let end = index + 1;
  while (json[end] !== '"') {
    if (json[end] === "\\") {
      // TODO: Parse escape sequences
      end++;
      end++;
    }
    end++;
  }
  return [json.slice(index + 1, end), end + 1];
}

// TODO: Parse scientific notation, signs, and decimals
function parseNumber(json: string, index: number): [number, number] {
  const start = index;
  let end = index;
  while (
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(json[end])
  ) {
    end++;
  }
  return [Number(json.slice(start, end)), end];
}

function parseLiteral<T>(
  json: string,
  index: number,
  literal: string,
  value: T
): [T, number] {
  if (json.slice(index, index + literal.length) === literal) {
    return [value, index + literal.length];
  }
  throw new Error(`Unexpected character ${json[index]} at index ${index}`);
}

function advanceWhitespace(json: string, index: number): number {
  while ([" ", "\t", "\n", "\r"].includes(json[index])) {
    index++;
  }
  return index;
}

function _parseJson(json: string, index: number): [unknown, number] {
  index = advanceWhitespace(json, index);

  const char = json[index];
  switch (char) {
    case "{":
      return parseObject(json, index);
    case "[":
      return parseArray(json, index);
    case '"':
      return parseString(json, index);
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
      return parseNumber(json, index);
    case "t":
      return parseLiteral(json, index, "true", true);
    case "f":
      return parseLiteral(json, index, "false", false);
    case "n":
      return parseLiteral(json, index, "null", null);
    default:
      throw new Error(`Unexpected character ${char} at index ${index}`);
  }
}

export function parseJson(json: string): unknown {
  let [result, end] = _parseJson(json, 0);
  end = advanceWhitespace(json, end);
  console.log(end, json.length);
  assert(end === json.length);
  return result;
}
