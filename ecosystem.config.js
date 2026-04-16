// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'zografa-sop',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/var/www/zografa-sop',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
  }],
}
