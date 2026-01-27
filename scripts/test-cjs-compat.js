#!/usr/bin/env node

/**
 * Tests that the built raygun package can be required from CommonJS
 * without --experimental-require-module enabled.
 *
 * This catches ESM-only dependencies that would break:
 * - Node.js < 22
 * - AWS Lambda (even on Node 22)
 * - Any CommonJS project without experimental flags
 *
 * Run with: node --no-experimental-require-module scripts/test-cjs-compat.js
 */

"use strict";

try {
  const raygun = require("../build/raygun.js");

  // Verify the client can be instantiated
  const client = new raygun.Client();

  console.log("✓ CommonJS require() works");
  console.log("✓ Client instantiation works");
  process.exit(0);
} catch (err) {
  console.error("✗ CommonJS compatibility test failed:");
  console.error(err.message);

  if (err.code === "ERR_REQUIRE_ESM") {
    console.error("\nThis indicates an ESM-only dependency is being used.");
    console.error(
      "The raygun package must remain CommonJS-compatible for Node < 22 and AWS Lambda."
    );
  }

  process.exit(1);
}
