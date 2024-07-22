import { Document, model, Schema } from 'mongoose'

interface IComment extends Document {
    id: string
    userId: Schema.Types.ObjectId
    userName: string
    content: string
    createdAt: Date
    discussionId: Schema.Types.ObjectId
    parentCommentId?: Schema.Types.ObjectId
    replies: Schema.Types.ObjectId[]
    isDeleted: boolean
}

const CommentSchema: Schema = new Schema(
    {
        // _id is automatically added by MongoDB
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        discussionId: { type: Schema.Types.ObjectId, ref: 'Discussion', required: true },
        parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
        replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true, // To manage createdAt and updatedAt
    }
)

export default model<IComment>('Comment', CommentSchema)
