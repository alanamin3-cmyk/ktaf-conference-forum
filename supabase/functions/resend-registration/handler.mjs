// The handler receives its services so authentication, concurrency, and failure paths
// can be tested without sending email or changing live registrations.
export function createResendHandler({ client, sendConfirmation, origins, now = () => new Date() }) {
  return async function handle(request) {
    const origin = (request.headers.get('origin') || '').replace(/\/+$/, '');
    const headers = {
      'Access-Control-Allow-Origin': origins.includes(origin) ? origin : origins[0],
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin',
    };
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply({ message: 'Method not allowed.' }, 405);
    if (!origins.includes(origin)) return reply({ message: 'Origin not allowed.' }, 403);
    const token = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) return reply({ message: 'Please sign in again.' }, 401);

    try {
      const { data: auth, error: authError } = await client.auth.getUser(token);
      if (authError || !auth?.user) return reply({ message: 'Please sign in again.' }, 401);
      const { data: admin, error: adminError } = await client.from('admin_users')
        .select('user_id').eq('user_id', auth.user.id).maybeSingle();
      if (adminError || !admin) return reply({ message: 'Only approved KTAF admins can resend emails.' }, 403);

      let input;
      try { input = await request.json(); } catch { return reply({ message: 'Invalid request.' }, 400); }
      if (input?.action === 'check') return reply({ ready: true });
      if (!input || typeof input.registrationId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.registrationId)) {
        return reply({ message: 'Choose an existing registration.' }, 400);
      }
      const { data: attendee, error: readError } = await client.from('registrations')
        .select('id,full_name,position,city,phone_number,email,registration_code,registration_status,email_status,email_sent_at,email_resend_requested_at')
        .eq('id', input.registrationId).maybeSingle();
      if (readError) throw readError;
      if (!attendee) return reply({ message: 'This registration was removed. Refresh the table.' }, 404);
      if (attendee.registration_status !== 'registered') {
        return reply({ message: 'Restore this cancelled registration before resending its confirmation.' }, 409);
      }
      const requestedAt = now().toISOString();
      const remaining = attendee.email_resend_requested_at
        ? Math.ceil((Date.parse(attendee.email_resend_requested_at) + 120_000 - Date.parse(requestedAt)) / 1000) : 0;
      if (remaining > 0) return reply({ message: 'An email was recently requested. Please wait two minutes before sending again.', retryAfter: remaining }, 429);

      // Compare and set the timestamp atomically: only one staff member/request wins.
      // Also reject a stale recipient or cancelled/deleted record before sending.
      let claim = client.from('registrations').update({ email_resend_requested_at: requestedAt })
        .eq('id', attendee.id).eq('registration_status', 'registered');
      for (const field of ['full_name', 'position', 'city', 'phone_number', 'email', 'email_resend_requested_at']) {
        claim = attendee[field] === null ? claim.is(field, null) : claim.eq(field, attendee[field]);
      }
      const { data: claimed, error: claimError } = await claim.select('id').maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) return reply({ message: 'This record changed or another team member is sending its email. Refresh and try again.' }, 409);

      let providerId;
      try {
        providerId = await sendConfirmation({
          fullName: attendee.full_name, position: attendee.position, city: attendee.city,
          phoneNumber: attendee.phone_number || '', email: attendee.email,
          registrationCode: attendee.registration_code,
        }, `ktaf-admin-resend/${attendee.id}/${requestedAt}`);
        if (!providerId) throw new Error('Email provider returned no confirmation.');
      } catch {
        // Preserve the status of any earlier successful email; this attempt failed.
        await client.from('registrations').update({ email_error: 'Admin resend could not be confirmed.' })
          .eq('id', attendee.id).eq('email_resend_requested_at', requestedAt);
        return reply({ message: 'Email sending could not be confirmed. Check the inbox and spam folder, then wait two minutes before retrying.', retryAfter: 120 }, 502);
      }
      const sentAt = now().toISOString();
      const { data: saved, error: saveError } = await client.from('registrations').update({
        email_status: 'sent', email_sent_at: sentAt, email_provider_id: providerId, email_error: null,
      }).eq('id', attendee.id).eq('email', attendee.email)
        .eq('email_resend_requested_at', requestedAt).select('id').maybeSingle();
      return reply({
        emailSent: true, email: attendee.email, registrationCode: attendee.registration_code,
        emailSentAt: sentAt, retryAfter: 120,
        message: saveError || !saved
          ? 'Email sent, but its table status could not be updated. Refresh the table; do not resend immediately.'
          : 'Email sent with the same registration code and QR pass.',
        statusSaved: !saveError && Boolean(saved),
      });
    } catch {
      return reply({ message: 'The email service could not complete this request. Refresh and try again.' }, 503);
    }
  };
}
