import { createFileRoute } from '@tanstack/react-router'

// One entry for every /api/* path, like the original Express app.
async function dispatch({ request }: { request: Request }) {
  const { handleApi } = await import('@/features/picko/server/api.server')
  return handleApi(request)
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: dispatch,
      POST: dispatch,
    },
  },
})
