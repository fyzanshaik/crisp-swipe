import "dotenv/config";

async function testServer() {
  console.log("🧪 Testing Crisp Server Setup...\n");
  
  console.log("1️⃣ Testing environment variables...");
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET', 
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY'
  ];
  
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.log("❌ Missing environment variables:", missing.join(', '));
    console.log("   Please create a .env file with required variables");
    return;
  }
  console.log("✅ All environment variables present");
  
  console.log("\n2️⃣ Testing database connection...");
  try {
    const { db } = await import("./server/db/db");
    await db.execute("SELECT 1");
    console.log("✅ Database connection successful");
  } catch (error) {
    console.log("❌ Database connection failed:", error);
    return;
  }
  
  console.log("\n3️⃣ Testing R2 storage connection...");
  try {
    const { checkR2Health } = await import("./server/utils/health");
    const r2Health = await checkR2Health();
    if (r2Health.connected) {
      console.log("✅ R2 storage connection successful");
    } else {
      console.log("❌ R2 storage connection failed:", r2Health.error);
      return;
    }
  } catch (error) {
    console.log("❌ R2 storage test failed:", error);
    return;
  }
  
  console.log("\n4️⃣ Testing server health endpoint...");
  try {
    const response = await fetch("http://localhost:3000/api/health");
    if (response.ok) {
      const health = await response.json();
      console.log("✅ Health endpoint responding:", health.overall ? "All systems healthy" : "Some issues detected");
    } else {
      console.log("❌ Health endpoint failed:", response.status);
    }
  } catch (error) {
    console.log("⚠️  Server not running - start with 'bun run dev' to test health endpoint");
  }
  
  console.log("\n🎉 Server setup test completed!");
  console.log("\nNext steps:");
  console.log("1. Run 'bun run db-push' to create database tables");
  console.log("2. Run 'bun run dev' to start the server");
  console.log("3. Visit http://localhost:3000/api/health to verify");
}

testServer().catch(console.error);
