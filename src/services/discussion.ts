import mongoose from 'mongoose'

import { AppError } from 'errorHandler'
import { CommentModel, IComment } from 'models/comment'
import { DiscussionModel, IDiscussion, IDiscussionWithComments } from 'models/discussion'
import { DiscussionDetailsResponse, DiscussionsResponse } from 'models/response'
import { User, UserType } from 'models/user'
import { buildCommentTree } from 'utils'

export async function createDiscussion(userId: string, subject: string, content: string): Promise<IDiscussion> {
    // Check if the user exists and is a professor:
    const user = await User.findById(userId).select('_id userName type')

    if (!user) throw new AppError(404, 'Only active Users can create discussions.')

    if (user.type !== UserType.PROFESSOR) throw new AppError(403, 'Only professors can create discussions')

    const discussion = new DiscussionModel({
        userId,
        subject,
        content,
        userName: user.userName,
    })

    await discussion.save()

    return discussion
}

export async function getDiscussions(): Promise<DiscussionsResponse[]> {
    const discussions = await DiscussionModel.find({ isArchived: { $ne: true } })
        .select('_id subject userName lastCommentAt updatedAt commentCount')
        .sort({ updatedAt: -1 })
        .lean()
        .exec()

    return discussions.map((discussion) => ({
        subject: discussion.subject,
        author: discussion.userName,
        lastCommentAt: discussion.lastCommentAt,
        commentCount: discussion.commentCount,
        url: `http://localhost:8080/discussions/${discussion._id.toString()}/comments`,
    }))
}

export async function addComment(
    discussionId: string,
    userId: string,
    userName: string,
    content: string,
    parentCommentId?: string
): Promise<IComment> {
    // Start a new session to make sure everything gets updated in one transaction:
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        // If parentCommentId is specified, check if it actually exists:
        if (parentCommentId) {
            const parentCommentExists = await CommentModel.exists({ _id: parentCommentId }).session(session)
            if (!parentCommentExists) throw new AppError(403, 'Parent comment not found')
        }

        const newComment = new CommentModel({
            discussionId,
            userId,
            content,
            parentCommentId: parentCommentId || null,
            userName: userName,
        })

        await newComment.save({ session })

        // Update discussion's lastCommentAt, commentCount, and comments array:
        const updatedDiscussion = await DiscussionModel.findByIdAndUpdate(
            discussionId,
            {
                $inc: { commentCount: 1 },
                $set: { lastCommentAt: newComment.createdAt },
                $push: { comments: newComment._id },
            },
            { session, new: true } // new: true returns the updated document
        )

        if (!updatedDiscussion) throw new AppError(500, 'Failed to update Discussion')

        // If this is a reply to another comment, update that comment's replies array:
        if (parentCommentId) {
            const updatedParent = await CommentModel.findByIdAndUpdate(
                parentCommentId,
                {
                    $push: { replies: newComment._id },
                },
                { session, new: true } // new: true returns the updated comment
            )

            if (!updatedParent) throw new AppError(500, 'Failed to update parent comment')
        }

        await session.commitTransaction()
        return newComment
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

export async function getDiscussionWithComments(discussionId: string): Promise<DiscussionDetailsResponse> {
    const discussion = await DiscussionModel.findOne({ _id: discussionId, isArchived: false })
        .select('userName subject content comments commentCount')
        .populate<IDiscussionWithComments>({
            path: 'comments',
            match: { isDeleted: false },
            select: 'userName content createdAt parentCommentId',
            options: { sort: { createdAt: 1 } },
        })
        .lean()
        .exec()

    if (!discussion) {
        throw new AppError(404, 'Discussion not found.')
    }

    const commentTree = buildCommentTree(discussion.comments)

    return {
        _id: discussion._id,
        author: discussion.userName,
        subject: discussion.subject,
        content: discussion.content,
        commentCount: discussion.commentCount,
        comments: commentTree,
    }
}
