import { Document, model, Schema, Types } from 'mongoose'

export interface IComment extends Document {
    _id: Types.ObjectId
    userId: Types.ObjectId
    userName: string
    content: string
    createdAt: Date
    discussionId: Types.ObjectId
    parentCommentId?: Types.ObjectId
    replies: Types.ObjectId[]
    isDeleted: boolean
}

const CommentSchema: Schema = new Schema(
    {
        // _id is automatically added by MongoDB
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        discussionId: { type: Types.ObjectId, ref: 'Discussion', required: true },
        parentCommentId: { type: Types.ObjectId, ref: 'Comment' },
        replies: [{ type: Types.ObjectId, ref: 'Comment' }],
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true, // To manage createdAt and updatedAt
    }
)

export const CommentModel = model<IComment>('Comment', CommentSchema)
