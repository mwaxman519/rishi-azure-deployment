const { app } = require('@azure/functions');
const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');

app.http('authSession', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/session',
  handler: async (request, context) => {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          status: 401,
          jsonBody: { error: 'No valid authorization header' }
        };
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'dev-secret');
      
      const sql = neon(process.env.DATABASE_URL);
      const user = await sql`
        SELECT 
          u.id, u.username, u.email, u.role, u.active,
          o.id as organization_id, o.name as organization_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = ${decoded.userId}
        LIMIT 1
      `;

      if (!user.length) {
        return {
          status: 404,
          jsonBody: { error: 'User not found' }
        };
      }

      return {
        status: 200,
        jsonBody: {
          user: user[0],
          expires: decoded.exp
        },
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      };
    } catch (error) {
      context.log.error('Session validation failed:', error);
      return {
        status: 401,
        jsonBody: { error: 'Invalid session' }
      };
    }
  }
});