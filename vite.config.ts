import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      // Add simple dev-time API endpoints for backing up/restoring app data to disk
      configureServer: (server) => {
        const dataDir = path.resolve(__dirname, 'data');
        const backupFile = path.join(dataDir, 'coop_backup.json');

        // ensure data directory exists
        try {
          if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
        } catch (e) {
          // ignore
        }

        // POST /api/backup -> write JSON body to backup file
        server.middlewares.use('/api/backup', async (req, res, next) => {
          if (req.method === 'POST') {
            try {
              let body = '';
              for await (const chunk of req) body += chunk;
              fs.writeFileSync(backupFile, body, 'utf8');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
              return;
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: String(err) }));
              return;
            }
          }
          // GET /api/backup -> read and return file
          if (req.method === 'GET') {
            try {
              if (!fs.existsSync(backupFile)) {
                res.statusCode = 404;
                res.end(JSON.stringify({ ok: false, error: 'No backup present' }));
                return;
              }
              const data = fs.readFileSync(backupFile, 'utf8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(data);
              return;
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ ok: false, error: String(err) }));
              return;
            }
          }
          return next();
        });

        // Serve a small client-side restore page at /__restore that will fetch /api/backup
        server.middlewares.use('/__restore', (req, res, next) => {
          if (req.method !== 'GET') return next();
          const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Restore Coop Backup</title>
  </head>
  <body>
    <div style="font-family: Inter, sans-serif; padding: 24px;">
      <h2>Restore Coop Backup</h2>
      <p>This page will attempt to fetch the workspace backup and populate browser localStorage, then reload the app.</p>
      <pre id="status" style="background:#f3f4f6;padding:12px;border-radius:6px;">Starting...</pre>
    </div>
    <script>
      (async function(){
        const status = msg => document.getElementById('status').textContent += '\n' + msg;
        try {
          status('Fetching /api/backup...');
          const res = await fetch('/api/backup');
          if (!res.ok) { status('No backup available (HTTP ' + res.status + ')'); return; }
          const text = await res.text();
          status('Parsing JSON...');
          const data = JSON.parse(text || '{}');
          if (!data) { status('Invalid backup data'); return; }
          const keys = {
            members: 'coop_members',
            contributions: 'coop_contributions',
            loans: 'coop_loans',
            investments: 'coop_investments',
            activities: 'coop_activities',
            notifications: 'coop_notifications',
            settings: 'coop_settings'
          };
          Object.keys(keys).forEach(k => {
            if (data[k]) {
              localStorage.setItem(keys[k], JSON.stringify(data[k]));
              status('Restored ' + keys[k]);
            }
          });
          status('Completed. Reloading app...');
          setTimeout(() => location.href = '/', 900);
        } catch (e) {
          status('Error: ' + e.message);
        }
      })();
    </script>
  </body>
</html>`;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
          return;
        });
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
