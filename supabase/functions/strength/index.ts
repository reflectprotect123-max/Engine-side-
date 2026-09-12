import { servePublicBucket } from '../_shared/static-site.ts';

Deno.serve(servePublicBucket({ bucket: 'strength-web', functionName: 'strength' }));
