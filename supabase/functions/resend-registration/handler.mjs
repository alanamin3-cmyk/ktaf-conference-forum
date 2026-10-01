import { normalizeRegistrationInput } from '../_shared/registration-validation.mjs';

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

    let createdRegistrationId;
    try {
      const { data: auth, error: authError } = await client.auth.getUser(token);
      if (authError || !auth?.user) return reply({ message: 'Please sign in again.' }, 401);
      const { data: admin, error: adminError } = await client.from('admin_users')
        .select('user_id').eq('user_id', auth.user.id).maybeSingle();
      if (adminError) throw adminError;
      let restricted = false;
      if (!admin) {
        const { data: editor, error: editorError } = await client.from('attendee_editor_users')
          .select('user_id').eq('user_id', auth.user.id).maybeSingle();
        if (editorError || !editor) return reply({ message: 'Only approved KTAF team members can register attendees or send emails.' }, 403);
        restricted = true;
      }

      let input;
      try { input = await request.json(); } catch { return reply({ message: 'Invalid request.' }, 400); }
      if (input?.action === 'check') return reply({ ready: true });
      let registrationSaved = false;
      if (input?.action === 'register') {
        const normalized = normalizeRegistrationInput(input.attendee, now().getTime());
        if (!normalized.ok) return reply({ message: normalized.message }, 400);
        const values = normalized.value;
        // New registrations only: never update or disclose an existing email match.
        const { data: existing, error: lookupError } = await client.from('registrations')
          .select('id').eq('email', values.email).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing) return reply({ message: 'This email is already registered. Find the attendee in the list to send their confirmation.' }, 409);
        let created;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const bytes = crypto.getRandomValues(new Uint32Array(1));
          const registrationCode = `KTAF-${now().getFullYear()}-${String(bytes[0] % 1_000_000).padStart(6, '0')}`;
          const result = await client.from('registrations').insert({
            full_name: values.fullName, position: values.position, city: values.city,
            phone_number: values.phoneNumber, email: values.email,
            registration_code: registrationCode, created_by: auth.user.id,
          }).select('id').single();
          if (!result.error) { created = result.data; break; }
          if (result.error.message?.includes('KTAF_CAPACITY_FULL')) {
            return reply({ message: 'All attendee places are reserved. A place must become available before registering another attendee.' }, 409);
          }
          if (result.error.code !== '23505') throw result.error;
        }
        if (!created) return reply({ message: 'Registration could not be created. It may already exist; refresh the attendee list before retrying.' }, 409);
        input = { registrationId: created.id };
        createdRegistrationId = created.id;
        registrationSaved = true;
      }
      const outcome = registrationSaved ? { registrationSaved: true, registrationId: input.registrationId } : {};
      const resultReply = (body, status = 200) => reply({ ...outcome, ...body }, status);
      if (!input || typeof input.registrationId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.registrationId)) {
        return reply({ message: 'Choose an existing registration.' }, 400);
      }
      const { data: attendee, error: readError } = await client.from('registrations')
        .select('id,full_name,position,city,phone_number,email,registration_code,registration_status,is_test,email_status,email_sent_at,email_resend_requested_at')
        .eq('id', input.registrationId).maybeSingle();
      if (readError) return resultReply({ message: 'The attendee list could not be read. Refresh the list before retrying.' }, 503);
      if (!attendee || (restricted && attendee.is_test)) return resultReply({ message: 'This registration is unavailable. Refresh the table.' }, 404);
      if (attendee.registration_status !== 'registered') {
        return resultReply({ message: 'This registration is cancelled. Contact an administrator.' }, 409);
      }
      const requestedAt = now().toISOString();
      const remaining = attendee.email_resend_requested_at
        ? Math.ceil((Date.parse(attendee.email_resend_requested_at) + 120_000 - Date.parse(requestedAt)) / 1000) : 0;
      if (remaining > 0) return resultReply({ message: 'An email was recently requested. Please wait two minutes before sending again.', retryAfter: remaining }, 429);

      // Compare and set the timestamp atomically: only one staff member/request wins.
      // Also reject a stale recipient or cancelled/deleted record before sending.
      let claim = client.from('registrations').update({ email_resend_requested_at: requestedAt })
        .eq('id', attendee.id).eq('registration_status', 'registered');
      for (const field of ['full_name', 'position', 'city', 'phone_number', 'email', 'email_resend_requested_at']) {
        claim = attendee[field] === null ? claim.is(field, null) : claim.eq(field, attendee[field]);
      }
      const { data: claimed, error: claimError } = await claim.select('id').maybeSingle();
      if (claimError) return resultReply({ message: 'Email sending could not start. Refresh the attendee list and try Send registration email.' }, 503);
      if (!claimed) return resultReply({ message: 'This record changed or another team member is sending its email. Refresh and try again.' }, 409);

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
        return resultReply({ message: 'Email sending could not be confirmed. Check the inbox and spam folder, then wait two minutes before retrying.', retryAfter: 120 }, 502);
      }
      const sentAt = now().toISOString();
      const { data: saved, error: saveError } = await client.from('registrations').update({
        email_status: 'sent', email_sent_at: sentAt, email_provider_id: providerId, email_error: null,
      }).eq('id', attendee.id).eq('email', attendee.email)
        .eq('email_resend_requested_at', requestedAt).select('id').maybeSingle();
      return resultReply({
        emailSent: true,
        ...(!restricted ? { email: attendee.email, registrationCode: attendee.registration_code } : {}),
        emailSentAt: sentAt, retryAfter: 120,
        message: saveError || !saved
          ? 'Email sent, but its table status could not be updated. Refresh the table; do not resend immediately.'
          : 'Email sent with the same registration code and QR pass.',
        statusSaved: !saveError && Boolean(saved),
      });
    } catch {
      return reply({
        ...(createdRegistrationId ? { registrationSaved: true, registrationId: createdRegistrationId } : {}),
        message: createdRegistrationId
          ? 'The attendee was registered, but email sending could not be confirmed. Refresh the list and use Send registration email after two minutes.'
          : 'The email service could not complete this request. Refresh and try again.',
      }, 503);
    }
  };
}
