import { Types } from 'mongoose'

export type CommentObject = {
    _id: Types.ObjectId
    userName: string
    content: string
    createdAt: Date
    replies: CommentObject[]
    parentCommentId?: Types.ObjectId
}

export type DiscussionsResponse = {
    author: string
    subject: string
    lastCommentAt?: Date
    commentCount: number
    url?: string
}

export type DiscussionDetailsResponse = DiscussionsResponse & {
    _id: Types.ObjectId
    content: string
    comments: CommentObject[]
}
