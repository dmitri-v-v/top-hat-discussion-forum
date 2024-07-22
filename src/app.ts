import express, { Request, Response, NextFunction } from 'express'

import { userRoutes } from 'routes'
import { getHealthStatus } from 'services/healthService'

const app = express()

app.use(express.json())

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.message)
    console.error(err.stack) // Also log error stack for debugging

    res.status(500).send({ error: err.message })
})

app.get('/', (req, res) => {
    res.send('<h1>Discussion Forum app is running.</h1>')
})

/* --------------------- A database health check that uses an optional status query parameter. --------------------- */
app.get('/health', async (req, res) => {
    try {
        res.json(await getHealthStatus(req.query.status?.toString()))
    } catch (error) {
        res.status(500).json({ error: 'An error occurred connecting to the DB.' })
    }
})

/** -------------------------- User-related routes to aid with using the rest of the API. -------------------------- */
app.use('/users', userRoutes)

export default app
