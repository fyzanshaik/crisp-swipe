import app from "./app";
import { waitForServices } from "./utils/health";

async function startServer() {  
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY'
  ];
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
    process.exit(1);
  }
  
  console.log("✅ Environment variables validated");
  
  const health = await waitForServices();
  
  if (!health.overall) {
    console.error("❌ Server startup failed due to service health issues");
    process.exit(1);
  }
  
  const port = process.env.PORT || 3000;
  
  Bun.serve({
    port: Number(port),
    fetch: app.fetch,
  });
  
  console.log(`🎉 Server started successfully on port ${port}`);
  console.log(`📡 API available at: http://localhost:${port}/api`);
  console.log(`🌐 Frontend available at: http://localhost:${port}`);
}

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

startServer().catch((error) => {
  console.error("💥 Failed to start server:", error);
  process.exit(1);
});
