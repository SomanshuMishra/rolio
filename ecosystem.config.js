module.exports = {
  apps: [
    {
      name: 'rolio-backend',
      script: '/home/ubuntu/rolio/start-backend.sh',
      max_memory_restart: '1G',
      restart_delay: 3000,
    },
    {
      name: 'rolio-frontend',
      cwd: '/home/ubuntu/rolio/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        NEXT_PUBLIC_API_URL: 'https://api.rolio.in',
      },
      max_memory_restart: '512M',
    },
  ],
}
