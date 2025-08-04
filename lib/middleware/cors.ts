import Cors from 'cors'

// Initializing the cors middleware
const cors = Cors({
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: [
    'http://localhost:3000',
    'https://logisticske.vercel.app',
    process.env.APP_URL || ''
  ],
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type']
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

export default async function corsMiddleware(req: any, res: any) {
  await runMiddleware(req, res, cors)
}
