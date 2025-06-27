const { app } = require('@azure/functions');
const { neon } = require('@neondatabase/serverless');

app.http('bookings', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'bookings',
  handler: async (request, context) => {
    try {
      const sql = neon(process.env.DATABASE_URL);
      
      if (request.method === 'GET') {
        const bookings = await sql`
          SELECT 
            b.*,
            c.name as client_name,
            l.name as location_name,
            o.name as organization_name
          FROM bookings b
          LEFT JOIN clients c ON b.client_id = c.id
          LEFT JOIN locations l ON b.location_id = l.id
          LEFT JOIN organizations o ON b.organization_id = o.id
          ORDER BY b.created_at DESC
        `;
        
        return { 
          status: 200,
          jsonBody: bookings,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        };
      }
      
      if (request.method === 'POST') {
        const booking = await request.json();
        const bookingId = crypto.randomUUID();
        
        const result = await sql`
          INSERT INTO bookings (
            id, title, description, client_id, location_id, 
            organization_id, start_time, end_time, status
          )
          VALUES (
            ${bookingId}, ${booking.title}, ${booking.description},
            ${booking.clientId}, ${booking.locationId}, ${booking.organizationId},
            ${booking.startTime}, ${booking.endTime}, 'pending'
          )
          RETURNING *
        `;
        
        return { 
          status: 201,
          jsonBody: result[0],
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        };
      }
    } catch (error) {
      context.log.error('Booking operation failed:', error);
      return { 
        status: 500,
        jsonBody: { error: 'Internal server error', details: error.message }
      };
    }
  }
});