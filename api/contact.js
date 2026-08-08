const CONTACT_EMAIL = 'waslha.app@gmail.com';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    }
  });
}

export async function OPTIONS() {
  return json({}, 204);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const role = String(body.role || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return json({ success: false, message: 'Missing required fields' }, 400);
    }

    const upstream = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        role,
        message,
        _replyto: email,
        _subject: `Waslha contact — ${role || 'General'}`,
        _template: 'table',
        _captcha: 'false'
      })
    });

    const data = await upstream.json().catch(() => ({}));
    const failed =
      !upstream.ok || data.success === 'false' || data.success === false;

    if (failed) {
      return json(
        {
          success: false,
          message: data.message || 'Email delivery failed'
        },
        502
      );
    }

    return json({ success: true });
  } catch {
    return json({ success: false, message: 'Server error' }, 500);
  }
}
