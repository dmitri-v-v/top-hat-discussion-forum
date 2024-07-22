import { Document, model, Schema } from 'mongoose'

interface IDiscussion extends Document {
    id: string
    userId: Schema.Types.ObjectId
    userName: string
    subject: string
    content: string
    createdAt: Date
    updatedAt: Date
    comments: Schema.Types.ObjectId[]
    lastCommentAt: Date
    commentCount: number
    isArchived: boolean
}

const DiscussionSchema: Schema = new Schema(
    {
        // _id is automatically added by MongoDB
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        subject: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
        lastCommentAt: { type: Date },
        commentCount: { type: Number, default: 0 },
        isArchived: { type: Boolean, default: false },
    },
    {
        timestamps: true, // To manage createdAt and updatedAt
    }
)

export default model<IDiscussion>('Discussion', DiscussionSchema)
