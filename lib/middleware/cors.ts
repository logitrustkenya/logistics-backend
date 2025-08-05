import Cors from 'cors'

// Initializing the cors middleware with enhanced FedCM support
const cors = Cors({
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://logisticske.vercel.app',
    'https://logistics-ke.vercel.app',
    process.env.APP_URL || '',
    process.env.FRONTEND_URL || '',
    'https://accounts.google.com',
    'https://oauth2.googleapis.com',
    'https://accounts.google.com/gsi/client',
    /\.vercel\.app$/
  ],
  credentials: true,
  allowedHeaders: [
    'Authorization', 
    'Content-Type', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-Requested-By',
    'X-Requested-With',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'Set-Cookie', 
    'X-Content-Type-Options',
    'X-Auth-Token',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
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
  // Add FedCM-specific headers for Google authentication
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
  res.setHeader('Permissions-Policy', 'identity-credentials-get')
  
  // Additional security headers for FedCM
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  
  await runMiddleware(req, res, cors)
}
