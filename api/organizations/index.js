const { app } = require('@azure/functions');
const { neon } = require('@neondatabase/serverless');

app.http('organizations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'organizations',
  handler: async (request, context) => {
    try {
      const sql = neon(process.env.DATABASE_URL);
      
      const organizations = await sql`
        SELECT 
          id, name, type, tier, status, created_at,
          address, phone, email, website
        FROM organizations
        WHERE status = 'active'
        ORDER BY name ASC
      `;
      
      return {
        status: 200,
        jsonBody: organizations,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } catch (error) {
      context.log.error('Organizations fetch failed:', error);
      return {
        status: 500,
        jsonBody: { error: 'Failed to fetch organizations' }
      };
    }
  }
});