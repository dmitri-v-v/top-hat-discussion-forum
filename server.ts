import dotenv from 'dotenv'
import mongoose from 'mongoose'

import { app } from 'app'

dotenv.config()

const PORT = process.env.PORT || 8080

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!)
        console.log('Connected to MongoDB Atlas')

          app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
          });
    } catch (error) {
        console.error('Error starting server:', error)
        process.exit(1)
    }
}

startServer()
