import { test } from "node:test";
import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3000";
test("public account pages render and protected routes reject anonymous visitors", async () => {
  for (const path of ["/", "/login", "/register", "/forgot-password", "/demo"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
  }
  for (const path of ["/account", "/citizen", "/officer", "/department", "/admin", "/update-password"]) {
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

