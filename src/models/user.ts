import { Document, model, Schema } from 'mongoose'

export enum UserType {
    PROFESSOR = 1,
    STUDENT = 2,
}

interface IUser extends Document {
    id: string
    userName: string
    firstName: string
    lastName: string
    type: UserType
}

const UserSchema: Schema = new Schema(
    {
        // _id is automatically added by MongoDB
        userName: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        type: { type: Number, enum: UserType, required: true },
    },
    {
        // Ensure that when converting the document to/from JSON, virtuals (_id) are included:
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

export const User = model<IUser>('User', UserSchema)
