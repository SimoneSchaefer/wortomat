import path from 'node:path';

export const port = Number(process.env['E2E_PORT'] ?? 3101);

/** Mirrors server.mjs: the backend's throwaway folder for this port. */
const tmp = path.join(__dirname, '..', '.tmp', String(port));

/** Stands in for ~/Downloads, where notes files from the phone arrive. */
export const downloadsDir = path.join(tmp, 'downloads');
