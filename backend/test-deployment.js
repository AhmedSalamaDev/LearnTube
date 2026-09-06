#!/usr/bin/env node

/**
 * Test your deployed API
 * Usage: node test-deployment.js https://your-app.onrender.com
 */

const API_URL = process.argv[2];

if (!API_URL) {
  console.error("❌ Please provide your API URL");
  console.log("Usage: node test-deployment.js https://your-app.onrender.com");
  process.exit(1);
}

async function testAPI() {
  console.log("🔍 Testing LearnTube API Deployment...\n");
  console.log(`📡 API URL: ${API_URL}\n`);

  const tests = [
    {
      name: "Health Check",
      endpoint: "/",
      method: "GET",
    },
    {
      name: "Auth - Google OAuth (should redirect)",
      endpoint: "/auth/google",
      method: "GET",
      expectRedirect: true,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      process.stdout.write(`Testing ${test.name}... `);

      const response = await fetch(`${API_URL}${test.endpoint}`, {
        method: test.method,
        redirect: "manual", // Don't follow redirects
      });

      if (
        test.expectRedirect &&
        (response.status === 301 || response.status === 302)
      ) {
        console.log("✅ PASS (redirect detected)");
        passed++;
      } else if (!test.expectRedirect && response.ok) {
        console.log("✅ PASS");
        passed++;
      } else {
        console.log(`❌ FAIL (status: ${response.status})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAIL (${error.message})`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));

  if (failed === 0) {
    console.log("\n🎉 All tests passed! Your API is live and working!");
    console.log("\n📝 Next steps:");
    console.log("1. Test OAuth flow in browser: " + API_URL + "/auth/google");
    console.log("2. Update frontend CLIENT_URL in Render dashboard");
    console.log("3. Deploy your frontend application");
  } else {
    console.log("\n⚠️  Some tests failed. Check your:");
    console.log("1. Environment variables in Render dashboard");
    console.log("2. Build logs for errors");
    console.log("3. Database connection (DATABASE_URL)");
  }
}

testAPI().catch(console.error);
