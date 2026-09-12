# Hosting

Engine site: `https://orysjncrksmdfabpuftd.supabase.co/functions/v1/www/`

WHOOP OAuth: Edge Functions. Redirect URI must stay  
`https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-callback`

Do **not** point a WHOOP **webhook** at `whoop-callback`. Webhooks go to  
`https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-webhook`  
(or leave only the Netlify `whoop-webhook`).
