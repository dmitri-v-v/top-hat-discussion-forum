import Health from 'models/health'

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
