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

/**
 * Error handling middleware for handling custom application errors as well as generic errors:
 * - If the status code is less than 500, it sends a JSON response with the external message and the status code.
 * - If the status code is 500 or higher, it logs the internal message and sends a JSON response with the external
 * message.
 * - For generic errors, it logs a generic message and sends a JSON response with a 500 status code.
 *
 *
 * @param err The error object, which can be a custom AppError or a generic Error.
 * @param req
 * @param res
 * @param next
 * @returns
 */
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
