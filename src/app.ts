import express, { Request, Response, NextFunction } from 'express'

export const app = express()

app.use(express.json())

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.message)
    console.error(err.stack) // Also log error stack for debugging

    res.status(500).send({ error: err.message })
})
