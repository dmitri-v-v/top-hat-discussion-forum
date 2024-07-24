declare global {
    var __MONGO_URI__: string
    var __MONGOD__: import('mongodb-memory-server').MongoMemoryServer
}

export {}
