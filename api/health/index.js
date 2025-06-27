const { app } = require('@azure/functions');
const { neon } = require('@neondatabase/serverless');

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request, context) => {
    try {
      const sql = neon(process.env.DATABASE_URL);
      
      // Test database connection
      const dbTest = await sql`SELECT 1 as test`;
      const dbStatus = dbTest.length > 0 ? 'connected' : 'disconnected';
      
      return {
        status: 200,
        jsonBody: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: dbStatus,
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'production'
        },
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } catch (error) {
      context.log.error('Health check failed:', error);
      return {
        status: 503,
        jsonBody: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error.message
        }
      };
    }
  }
});