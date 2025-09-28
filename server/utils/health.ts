import { db } from "../db/db";
import { uploadFile, getFile } from "./r2";

export interface HealthStatus {
  database: {
    connected: boolean;
    error?: string;
  };
  r2: {
    connected: boolean;
    error?: string;
  };
  overall: boolean;
}

export async function checkDatabaseHealth(): Promise<{ connected: boolean; error?: string }> {
  try {
    await db.execute("SELECT 1");
    return { connected: true };
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : "Unknown database error" 
    };
  }
}

export async function checkR2Health(): Promise<{ connected: boolean; error?: string }> {
  try {
    const testKey = "health-check/test-connection.txt";
    const testContent = new TextEncoder().encode("health check");

    await uploadFile(testKey, testContent.buffer, "text/plain");
        const retrievedContent = await getFile(testKey);
    const retrievedText = new TextDecoder().decode(retrievedContent);
    
    if (retrievedText === "health check") {
      return { connected: true };
    } else {
      return { connected: false, error: "R2 test file content mismatch" };
    }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : "Unknown R2 error" 
    };
  }
}

export async function performHealthCheck(): Promise<HealthStatus> {
  console.log("🔍 Performing health checks...");
  
  const [dbHealth, r2Health] = await Promise.all([
    checkDatabaseHealth(),
    checkR2Health()
  ]);
  
  const overall = dbHealth.connected && r2Health.connected;
  
  const status: HealthStatus = {
    database: dbHealth,
    r2: r2Health,
    overall
  };
  
  console.log("📊 Health Check Results:");
  console.log(`  Database: ${dbHealth.connected ? "✅ Connected" : "❌ Failed"}`);
  if (dbHealth.error) console.log(`    Error: ${dbHealth.error}`);
  
  console.log(`  R2 Storage: ${r2Health.connected ? "✅ Connected" : "❌ Failed"}`);
  if (r2Health.error) console.log(`    Error: ${r2Health.error}`);
  
  console.log(`  Overall: ${overall ? "✅ All systems healthy" : "❌ Some systems failed"}`);
  
  return status;
}

export async function waitForServices(maxRetries = 5, delayMs = 2000): Promise<HealthStatus> {
  console.log("⏳ Waiting for services to be ready...");
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`  Attempt ${attempt}/${maxRetries}...`);
    
    const health = await performHealthCheck();
    
    if (health.overall) {
      console.log("🎉 All services are ready!");
      return health;
    }
    
    if (attempt < maxRetries) {
      console.log(`  ⏳ Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log("⚠️  Some services failed to start after maximum retries");
  return await performHealthCheck();
}
