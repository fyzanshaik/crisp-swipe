import { db } from '../server/db/db';
import { sql } from 'drizzle-orm';

async function cleanupSessions() {
  try {
    console.log('🧹 Cleaning up interview sessions and answers...');

    await db.execute(sql`TRUNCATE TABLE answers CASCADE`);
    console.log(`✅ Truncated answers table`);

    await db.execute(sql`TRUNCATE TABLE interview_sessions CASCADE`);
    console.log(`✅ Truncated interview_sessions table`);

    console.log('🎉 Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupSessions();