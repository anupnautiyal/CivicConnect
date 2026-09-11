import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition, statuses, type IssueStatus } from "../src/index.ts";
test("the complete demonstration follows the approved lifecycle", () => {
  const path: IssueStatus[] = ["SUBMITTED", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  path.slice(1).forEach((next, index) => assert.ok(canTransition(path[index], next)));
});
test("reports cannot skip verification or close before resolution", () => {
  assert.equal(canTransition("SUBMITTED", "ASSIGNED"), false);
  assert.equal(canTransition("IN_PROGRESS", "CLOSED"), false);
});
test("reopening and reassignment are supported", () => {
  assert.ok(canTransition("RESOLVED", "REOPENED"));
  assert.ok(canTransition("REOPENED", "IN_PROGRESS"));
  assert.ok(canTransition("REOPENED", "RESOLVED"));
  assert.ok(canTransition("ASSIGNED", "VERIFIED"));
});
test("terminal states and self transitions are forbidden", () => {
  for (const status of statuses) {
    assert.equal(canTransition(status, status), false);
    assert.equal(canTransition("CLOSED", status), false);
    assert.equal(canTransition("REJECTED", status), false);
  }
});
