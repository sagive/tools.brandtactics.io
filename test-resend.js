const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  const d = new Date();
  d.setHours(d.getHours() + 2); // 2 hours from now
  const scheduledAt = d.toISOString();
  console.log('Attempting to schedule for:', scheduledAt);

  const payload = {
    from: 'BrandTactics <updates@tools.brandtactics.io>',
    to: ['test@example.com'], // using a dummy testing email
    subject: 'Resend Schedule Test',
    html: '<p>Testing scheduling</p>',
    scheduled_at: scheduledAt
  };

  const response = await resend.emails.send(payload);
  console.log('Response:', JSON.stringify(response, null, 2));
}

test();
