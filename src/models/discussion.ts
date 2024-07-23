import { Document, model, Schema, Types } from 'mongoose'

import { IComment } from 'models/comment'

export interface IDiscussion extends Document {
    _id: Types.ObjectId
    userId: Types.ObjectId
    userName: string
    subject: string
    content: string
    createdAt: Date
    updatedAt: Date
    comments: Types.ObjectId[]
    lastCommentAt: Date
    commentCount: number
    isArchived: boolean
}

export interface IDiscussionWithComments extends Omit<IDiscussion, 'comments'> {
    comments: IComment[]
}

const DiscussionSchema: Schema = new Schema(
    {
        // _id is automatically added by MongoDB
        userId: { type: Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        subject: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
        comments: [{ type: Types.ObjectId, ref: 'Comment' }],
        lastCommentAt: { type: Date },
        commentCount: { type: Number, default: 0 },
        isArchived: { type: Boolean, default: false },
    },
    {
        timestamps: true, // To manage createdAt and updatedAt
    }
)

export const DiscussionModel = model<IDiscussion>('Discussion', DiscussionSchema)
