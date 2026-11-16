// Integration point for volunteer invitation emails.
// Sends nothing yet: no email provider is configured in this deployment.
// Wire an SMTP/Resend/SendGrid client here, then organizer UI "Resend"
// becomes real email delivery. Invitation state itself is server-side
// (volunteer_invitations) — see supabase/migrations/0005.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { invitation_id: invitationId } = await req.json();
    if (!invitationId) throw new Error('invitation_id is required');

    const { data: invitation, error } = await supabase
      .from('volunteer_invitations')
      .select('id, email, status, event:events(name)')
      .eq('id', invitationId)
      .single();
    if (error) throw error;
    if (!invitation) throw new Error('Invitation not found');

    // EMAIL_PROVIDER_API_KEY is intentionally required here — set it when a
    // provider is chosen. Until then we report the truth: nothing was sent.
    const providerKey = Deno.env.get('EMAIL_PROVIDER_API_KEY');
    if (!providerKey) {
      return new Response(
        JSON.stringify({
          sent: false,
          reason: 'EMAIL_PROVIDER_NOT_CONFIGURED',
          detail:
            'Invitation is recorded in the database. The volunteer activates it by signing in to the mobile app with the invited email.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // TODO: send the actual email via the configured provider.
    return new Response(
      JSON.stringify({ sent: false, reason: 'SEND_NOT_IMPLEMENTED' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
