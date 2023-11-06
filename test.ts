import assert from "assert";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { parseJson } from "./parseJson.js";

const JSON_DIR = "./json";

function testFile(fileName: string) {
  test(fileName, () => {
    const text = fs.readFileSync(path.join(JSON_DIR, "null.json"), "utf-8");
    const reference = JSON.parse(text);
    const ours = parseJson(text);
    console.log(ours);
    assert.deepEqual(ours, reference);
  });
}

// testFile("null.json");

for (const dir of fs.readdirSync(JSON_DIR)) {
  testFile(dir);
}
