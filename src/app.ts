import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'

import { errorHandler } from './errorHandler'
import { setupSwagger } from './swagger'
import { discussionRoutes, userRoutes } from 'routes'
import { getHealthStatus } from 'services/health'

const app = express()

app.use(bodyParser.json())

setupSwagger(app)

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

/** --------------------------- Discussion-related routes to create and list Discussions. --------------------------- */
app.use('/discussions', discussionRoutes)

// Error handling middleware:
app.use(errorHandler)

export default app
