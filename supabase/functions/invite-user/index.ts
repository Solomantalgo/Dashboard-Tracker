import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

const generateTempPassword = (prefix: string) => {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes, byte => (byte % 36).toString(36)).join('');
  return `${prefix}#${random}A7`;
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Invite service is not configured.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required.' }, 401);

  // Verify the caller's JWT independently of any role value supplied by the client.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } }
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Invalid authentication.' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminRole, error: roleError } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (roleError) return json({ error: 'Unable to verify administrator access.' }, 500);
  if (!adminRole) return json({ error: 'Administrator access required.' }, 403);

  let body: { action?: string; email?: string; targetType?: string; targetId?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const action = body.action || 'invite';
  const email = body.email?.trim().toLowerCase();
  const targetType = body.targetType;
  const targetId = body.targetId;
  if (!targetId || (targetType !== 'client' && targetType !== 'coach') || (action !== 'invite' && action !== 'reset')) {
    return json({ error: 'targetType, targetId, and a valid action are required.' }, 400);
  }

  const table = targetType === 'client' ? 'clients' : 'coaches';
  const role = targetType === 'client' ? 'client' : 'coach';
  const password = generateTempPassword(targetType === 'client' ? 'Pffi' : 'Coach');

  if (action === 'reset') {
    const { data: target, error: targetError } = await adminClient
      .from(table)
      .select('user_id')
      .eq('id', targetId)
      .maybeSingle();
    if (targetError) return json({ error: 'Unable to look up portal access.' }, 500);
    if (!target) return json({ error: 'The target record was not found.' }, 404);
    if (!target.user_id) return json({ error: 'This person has no portal access yet. Invite them first.' }, 400);

    const { error: resetError } = await adminClient.auth.admin.updateUserById(target.user_id, {
      password
    });
    if (resetError) return json({ error: resetError.message }, resetError.status || 400);
    return json({ success: true, tempPassword: password });
  }

  if (!email || !email.includes('@')) {
    return json({ error: 'email is required for an invite.' }, 400);
  }

  const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (createError || !authData.user) {
    return json({ error: createError?.message || 'Unable to create the login.' }, createError?.status || 400);
  }

  const userId = authData.user.id;
  const { error: roleInsertError } = await adminClient
    .from('user_roles')
    .insert({ user_id: userId, role });
  if (roleInsertError) {
    await adminClient.auth.admin.deleteUser(userId);
    return json({ error: 'Login created but role linking failed.' }, 500);
  }

  const { data: linkedRows, error: linkError } = await adminClient
    .from(table)
    .update({ user_id: userId })
    .eq('id', targetId)
    .is('user_id', null)
    .select('id');
  if (linkError || !linkedRows?.length) {
    await adminClient.from('user_roles').delete().eq('user_id', userId);
    await adminClient.auth.admin.deleteUser(userId);
    return json({ error: linkError?.message || 'Target record was not found or already has portal access.' }, 400);
  }

  return json({ success: true, tempPassword: password });
});
