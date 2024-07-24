import mongoose from 'mongoose'

beforeAll(async () => {
    // Ensure the connection is established:
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(`${process.env.MONGO_URI}/test`)
    }
})

afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
})

afterEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
})
