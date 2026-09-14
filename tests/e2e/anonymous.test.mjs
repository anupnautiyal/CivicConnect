import { test } from "node:test";
import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3000";
test("public account pages render and protected routes reject anonymous visitors", async () => {
  for (const path of ["/", "/login", "/register", "/forgot-password", "/demo"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
  }
  for (const path of ["/account", "/staff/issues/10000000-0000-0000-0000-000000000001", "/citizen", "/citizen/report", "/citizen/complaints/10000000-0000-0000-0000-000000000001", "/officer", "/department", "/admin", "/update-password"]) {
    const response = await fetch(origin + path, { redirect: "manual" });
    const destination = path === "/update-password" ? "/forgot-password" : "/login";
    const html = await response.text();
    const location = response.headers.get("location");
    assert.ok(location?.endsWith(destination) || html.includes("NEXT_REDIRECT;replace;" + destination + ";"), path);
    assert.ok(!html.includes("Account connected"), path + " leaked workspace");
  }
  const callback = await fetch(origin + "/auth/callback?next=https://example.com", { redirect: "manual" });
  assert.equal(callback.status, 307);
  assert.equal(callback.headers.get("location"), origin + "/login?error=confirmation");
});

test("private report photos reject anonymous requests without caching", async () => {
  const response = await fetch(origin + "/citizen/complaints/10000000-0000-0000-0000-000000000001/photo", { redirect: "manual" });
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(await response.text(), "Sign in required");
});
