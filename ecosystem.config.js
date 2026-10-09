// PM2 process file for the production server:
//   npm ci && npm run db:init && npm run build && pm2 start ecosystem.config.js && pm2 save
// Secrets (DB_*, JWT_SECRET, ZOHO_*) stay in the server's .env, which Next
// reads at startup; nothing secret belongs in this file.
module.exports = {
  apps: [
    {
      name: "gharaasra",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "800M",
      time: true,
    },
  ],
};
