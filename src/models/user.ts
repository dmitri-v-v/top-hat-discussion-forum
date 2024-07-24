import { Document, model, Schema } from 'mongoose'

export enum UserType {
    PROFESSOR = 1,
    STUDENT = 2,
}

export interface IUser extends Document {
    _id: Schema.Types.ObjectId
    userName: string
    firstName: string
    lastName: string
    type: UserType
}

const UserSchema: Schema = new Schema({
    // _id is automatically added by MongoDB
    userName: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    type: { type: Number, enum: UserType, required: true },
})

// Explicitly creates the unique index on userName field:
UserSchema.index({ userName: 1 }, { unique: true })

export const User = model<IUser>('User', UserSchema)
