import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Triggered by entity automation when a UserProfile is created.
 * Sends a welcome notification + quick-start guide to the new user.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const profile = payload.data;
    if (!profile?.user_email) {
      console.log('No user_email in payload, skipping');
      return Response.json({ skipped: true });
    }

    const quickStartGuide = `👋 Welcome to StudentOS! Here's how to get started:

1. 📚 **Explore the Feed** — Share posts, discover what peers are learning, and join discussions.
2. 🛒 **Marketplace** — Buy and sell textbooks, notes, and study materials.
3. 👥 **Communities** — Join subject groups and campus clubs that match your interests.
4. 🤖 **AI Tutor** — Get instant homework help and study plans powered by AI.
5. 📅 **Planner** — Track exams, study sessions, and daily goals.
6. 💬 **Messages** — Chat with classmates and course mates directly.

Complete your profile to unlock the full experience. Good luck! 🎓`;

    // Welcome notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: profile.user_email,
      type: 'announcement',
      content: `🎉 Welcome to StudentOS, ${profile.username || 'Student'}! Your profile is set up and ready to go.`,
      is_read: false,
    });

    // Quick-start guide notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: profile.user_email,
      type: 'announcement',
      content: quickStartGuide,
      is_read: false,
    });

    // Also send a welcome email
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: profile.user_email,
        subject: '🎓 Welcome to StudentOS — Your Quick Start Guide',
        body: `Hi ${profile.username || 'there'},\n\nWelcome to StudentOS! We're excited to have you on board.\n\n${quickStartGuide.replace(/\*\*/g, '')}\n\nSee you inside!\n— The StudentOS Team`,
      });
    } catch (emailErr) {
      console.log('Email send failed (non-fatal):', emailErr.message);
    }

    console.log(`Welcome messages sent to ${profile.user_email}`);
    return Response.json({ ok: true, user_email: profile.user_email });
  } catch (error) {
    console.error('welcomeNewUser error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});