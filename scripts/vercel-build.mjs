import { spawnSync } from 'node:child_process'

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  })
  if (res.status !== 0) {
    process.exit(res.status ?? 1)
  }
}

const dbUrl = (process.env.DATABASE_URL || '').trim()

// Vercel runs `npm run build` during build step.
// Prisma migrate deploy requires datasource.url to exist. If DATABASE_URL isn't set in Vercel env,
// Prisma throws: "datasource.url property is required".
if (dbUrl) {
  run('npx', ['prisma', 'migrate', 'deploy'])
} else {
  console.warn(
    '[flowforge] DATABASE_URL is not set for build. Skipping `prisma migrate deploy`.\n' +
      'Set DATABASE_URL in Vercel Project Settings → Environment Variables (Preview + Production) to enable migrations.'
  )
}

run('npx', ['prisma', 'generate'])
run('npx', ['next', 'build'])

