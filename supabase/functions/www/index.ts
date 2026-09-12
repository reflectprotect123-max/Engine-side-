import { servePublicBucket } from '../_shared/static-site.ts';

Deno.serve(servePublicBucket({ bucket: 'engine-web', functionName: 'www' }));
