import { describe, expect, it } from "vitest";
import { parseJUnit } from "../src/core/junit.ts";

function suite(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites name="vitest">\n<testsuite name="test/a.test.ts" tests="1">\n${inner}\n</testsuite>\n</testsuites>\n`;
}

describe("parseJUnit", () => {
  it("US-023#1 reads name, classname, and time from paired and self-closing testcases", () => {
    const results = parseJUnit(
      suite(
        `<testcase classname="test/a.test.ts" name="adds two numbers" time="0.125"></testcase>
<testcase classname="test/b.test.ts" name="subtracts" time="2" />`,
      ),
    );
    expect(results).toEqual([
      { classname: "test/a.test.ts", name: "adds two numbers", status: "pass", time: 0.125 },
      { classname: "test/b.test.ts", name: "subtracts", status: "pass", time: 2 },
    ]);
  });

  it("US-023#1 derives fail, error, and skipped from child elements", () => {
    const results = parseJUnit(
      suite(
        `<testcase classname="c" name="broken" time="0.1"><failure message="nope">at x</failure></testcase>
<testcase classname="c" name="threw" time="0.1"><error message="boom"/></testcase>
<testcase classname="c" name="todo" time="0"><skipped/></testcase>
<testcase classname="c" name="fine" time="0"></testcase>`,
      ),
    );
    expect(results.map((r) => r.status)).toEqual(["fail", "error", "skipped", "pass"]);
  });

  it("US-023#1 unescapes XML entities in attribute values", () => {
    const results = parseJUnit(
      suite(
        `<testcase classname="a &amp; b" name="&lt;x&gt; &quot;y&quot; &apos;z&apos;" time="0"/>`,
      ),
    );
    expect(results[0]?.classname).toBe("a & b");
    expect(results[0]?.name).toBe(`<x> "y" 'z'`);
  });

  it("US-023#1 ignores markup inside CDATA so a failure message cannot desync the scan", () => {
    const results = parseJUnit(
      suite(
        `<testcase classname="c" name="first" time="0"><failure><![CDATA[expected <testcase name="ghost" /> here]]></failure></testcase>
<testcase classname="c" name="second" time="0"/>`,
      ),
    );
    expect(results.map((r) => [r.name, r.status])).toEqual([
      ["first", "fail"],
      ["second", "pass"],
    ]);
  });

  it("US-023#1 keeps attribute values containing angle brackets intact", () => {
    const results = parseJUnit(suite(`<testcase classname="c" name="a > b" time="0"/>`));
    expect(results).toEqual([{ classname: "c", name: "a > b", status: "pass", time: 0 }]);
  });

  it("US-023#1 returns an empty array for reports with no testcases", () => {
    expect(parseJUnit("")).toEqual([]);
    expect(parseJUnit(suite("<testsuite-level-noise/>"))).toEqual([]);
  });

  it("US-023#1 returns an empty array for malformed XML instead of throwing", () => {
    expect(parseJUnit(`<testsuite><testcase classname="c" name="truncated"`)).toEqual([]);
    expect(parseJUnit(`<testsuite><testcase classname="c" name="unclosed">`)).toEqual([]);
  });

  it("US-023#1 defaults a missing or unparsable time to zero", () => {
    const results = parseJUnit(suite(`<testcase classname="c" name="no time"/>`));
    expect(results[0]?.time).toBe(0);
  });
});
