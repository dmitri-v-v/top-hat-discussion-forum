import { Request, Response, NextFunction } from 'express'

/**
 * Custom error class for application-specific errors.
 *
 * @class AppError
 * @extends {Error}
 */
export class AppError extends Error {
    statusCode: number
    internalMessage: string
    externalMessage?: string

    /**
     * If externalMessage is not provided it is assumed to use the internalMessage in its place.
     *
     * @param statusCode The HTTP status code to be used for the response.
     * @param internalMessage The error message to log to the console.
     * @param externalMessage The error message to be sent with the response.
     */
    constructor(statusCode: number, internalMessage: string, externalMessage?: string) {
        super(internalMessage)
        this.statusCode = statusCode
        this.internalMessage = internalMessage
        this.externalMessage = externalMessage || internalMessage

        Error.captureStackTrace(this, this.constructor)
    }
}

export const errorHandler = (err: AppError | Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        if (err.statusCode < 500) {
            return res.status(err.statusCode).json({ message: err.externalMessage })
        }

        console.error(err.internalMessage, err)
        return res.status(err.statusCode).json({ error: err.externalMessage })
    }

    const message = 'Unexpected server error'
    console.error(message, err)
    res.status(500).json({ error: message })
}
