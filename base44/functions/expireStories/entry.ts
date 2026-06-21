import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    // Fetch all stories
    const stories = await base44.asServiceRole.entities.Story.list('-created_date', 500);

    // Find expired ones
    const expired = stories.filter(s => s.expires_at && s.expires_at < now);

    // Delete each expired story
    const results = await Promise.all(
      expired.map(s => base44.asServiceRole.entities.Story.delete(s.id))
    );

    return Response.json({ deleted: expired.length, status: 'ok' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});