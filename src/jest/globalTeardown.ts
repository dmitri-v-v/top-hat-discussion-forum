import mongoose from 'mongoose'

export default async function globalTeardown() {
    try {
        // await new Promise((resolve) => setTimeout(resolve, 1000)) // Allow time for any pending operations to complete

        // Force close all mongoose connections
        await Promise.all(mongoose.connections.map((conn) => conn.close(false)))

        await mongoose.disconnect()

        // Stop the MongoDB instance:
        const instance: any = (global as any).__MONGOINSTANCE
        if (instance) await instance.stop({ force: true })
    } catch (error) {
        console.warn('An error occurred during the global teardown:', error)
    } finally {
        process.exit(0)
    }
}
