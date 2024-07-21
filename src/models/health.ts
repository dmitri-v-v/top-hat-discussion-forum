import mongoose from 'mongoose'

interface IHealth {
    status: string
}

const healthSchema = new mongoose.Schema<IHealth>({
    status: { type: String, required: true },
})

export default mongoose.model<IHealth>('Health', healthSchema)
