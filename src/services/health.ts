import Health from 'models/health'

/**
 * Performs a health check on the database by creating, retrieving, and deleting a temporary document.
 *
 * @param statusOverride Optional status to override the default 'healthy' status.
 * @returns The status of the health check, either 'healthy' or the overridden status.
 */
export const getHealthStatus = async (statusOverride?: string) => {
    const status = statusOverride ?? 'healthy'
    try {
        // Create a new temp document:
        const healthCheck = new Health({ status })
        await healthCheck.save()

        // Retrieve the document
        const retrievedHealth = await Health.findById(healthCheck._id)

        // Clean up - remove the document
        await Health.findByIdAndDelete(healthCheck._id)

        if (retrievedHealth) {
            return retrievedHealth.status
        }
    } catch (error) {
        console.error('Health check error:', error)
        throw new Error()
    }
}
