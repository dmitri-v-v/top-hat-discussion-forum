import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// Extend the NodeJS.Global interface to include the custom property:
declare global {
    var __MONGOINSTANCE: MongoMemoryReplSet | undefined
}

export default async function globalSetup() {
    // This is so transactions/sessions work in the unit tests:
    const mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
    const mongoUri = mongoServer.getUri()

    global.__MONGOINSTANCE = mongoServer // Store the MongoMemoryServer instance on the global object

    // Set the MONGO_URI environment variable, removing the database name from the end
    process.env.MONGO_URI = mongoUri.slice(0, mongoUri.lastIndexOf('/'))

    await mongoose.connect(`${process.env.MONGO_URI}/test`) // Connect to the in-memory database
}
