/* Public Engine origin + data. Secrets never live here. */
(function (global) {
  global.ENGINE_CONFIG = {
    supabaseUrl: 'https://orysjncrksmdfabpuftd.supabase.co',
    supabaseAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeXNqbmNya3NtZGZhYnB1ZnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MTE4NzksImV4cCI6MjA5OTk4Nzg3OX0.GTMBfFtH5O6SikzHo75sXGIZoEhmuJ7TvXiACd7T078',
    publicOrigin: 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/www/',
    /**
     * Site is Supabase `www`. WHOOP tokens already live on Strength/Brain
     * Netlify under the same Supabase user (`u:<id>`). Use that backend so
     * Engine shows the existing link instead of an empty Engine-only store.
     */
    functionsProvider: 'netlify-legacy',
    netlifyLegacyOrigin: 'https://thehybridsystem.netlify.app'
  };
})(window);
