module.exports = {
  apps: [
    {
      name: 'geneaia-backend',
      script: './backend/src/index.js',
      cwd: '.',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: './deploy/logs/backend-error.log',
      out_file: './deploy/logs/backend-out.log',
      log_file: './deploy/logs/backend-combined.log',
      time: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'geneaia-frontend',
      script: 'serve',
      cwd: './frontend',
      args: 'dist -l 8080 -s',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './deploy/logs/frontend-error.log',
      out_file: './deploy/logs/frontend-out.log',
      log_file: './deploy/logs/frontend-combined.log',
      time: true,
      watch: false,
      restart_delay: 1000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-vps-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/geneaia.git',
      path: '/var/www/geneaia',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && cd backend && npm install && npx prisma migrate deploy && cd ../frontend && npm install && npm run build && cd .. && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'post-setup': 'ls -la'
    }
  }
};