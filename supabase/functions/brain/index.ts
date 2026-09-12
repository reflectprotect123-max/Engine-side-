import { servePublicBucket } from '../_shared/static-site.ts';

Deno.serve(servePublicBucket({ bucket: 'brain-web', functionName: 'brain' }));
