module.exports = {
  apps: [
    {
      name: 'rolio-backend',
      cwd: '/home/ubuntu/rolio/backend',
      interpreter: '/home/ubuntu/rolio/backend/venv/bin/python',
      script: '-m',
      args: 'uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4',
      max_memory_restart: '1G',
      restart_delay: 3000,
      env: {
        PYTHONPATH: '/home/ubuntu/rolio/backend',
      },
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
