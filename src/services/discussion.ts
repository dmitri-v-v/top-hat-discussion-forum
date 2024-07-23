import mongoose from 'mongoose'

import { AppError } from 'errorHandler'
import { CommentModel, IComment } from 'models/comment'
import { DiscussionModel, IDiscussion, IDiscussionWithComments } from 'models/discussion'
import { DiscussionDetailsResponse, DiscussionsResponse } from 'models/response'
import { User, UserType } from 'models/user'
import { buildCommentTree } from 'utils'

/**
 * Creates a new discussion.  If the user is valid and a professor, it creates and saves a new discussion with the given
 * subject and content.
 *
 *
 * @param userId The ID of the professor creating the discussion.
 * @param subject The subject of the discussion.
 * @param content The content of the discussion.
 * @returns The created discussion document.
 */
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

/**
 * Retrieves all active discussions.
 *
 * @returns Active discussions sorted by last updated date (which would include the last time a comment was made). Each
 * discussion item contains the subject, author, last comment date, comment count, and a URL to the comments.
 */
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

/**
 * Adds a comment to a discussion or as a reply to another comment, and updates the associated Discussion and Comment
 * entries as necessary. Everything is done in one transaction, so either all inserts & updates succeed, or none do. It
 * also:
 * - Verifies the existence of the parent comment if specified.
 * - Updates the discussion's lastCommentAt, commentCount, and comments array.
 * - Updates the parent comment's replies array if this is a reply.
 *
 * @param discussionId The ID of the discussion to which the comment is being added.
 * @param userId The ID of the user adding the comment.
 * @param userName  The user name of the user adding the comment.
 * @param content The comment message itself.
 * @param parentCommentId (Optional) The ID of the parent comment if this is a reply. Omit when adding a top-level
 * comment.
 * @returns The newly added Comment.
 * @throws Throws an error if the parent comment does not exist, if the discussion update fails, or if the
 *         parent comment update fails.
 */
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

/**
 * Retrieves a discussion along with its comments, structured in a tree format. Specifically, it performs the following
 * operations:
 * - Finds the Discussion document and selects specific fields (userName, subject, content, comments, commentCount).
 * - Populates the comments, excluding deleted comments, and sorts them by comment date in ascending order.
 * - Builds a comment tree from the retrieved comments.
 *
 * @param discussionId The ID of the discussion to retrieve.
 * @returns
 * @throws Throws an error if the discussion is not found or is archived.
 */
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
