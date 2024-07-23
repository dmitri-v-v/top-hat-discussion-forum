import { Router } from 'express'
import mongoose from 'mongoose'

import Comment from 'models/comment'
import Discussion from 'models/discussion'
import { User, UserType } from 'models/user'

const router = Router()

/** -------------------------------- POSTs a new Discussion from the specified User. -------------------------------- */
router.post('/', async (req, res) => {
    try {
        const userId: string = req.body.userId
        const subject: string = req.body.subject
        const content: string = req.body.content

        // Check if the user exists and is a professor:
        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ message: 'Only active Users can create discussions.' })
        }

        if (user.type !== UserType.PROFESSOR) {
            return res.status(403).json({ message: 'Only professors can create discussions' })
        }

        const discussion = new Discussion({
            userId,
            subject,
            content,
            userName: user.userName,
        })

        await discussion.save()

        res.status(201).json(discussion)
    } catch (error) {
        console.error('Error creating discussion:', error)
        res.status(500).json({ error: 'Unexpected error while posting discussion.' })
    }
})

/** --------- GETs a list of all the current Discussions ordered by last comment time in descending order. --------- */
router.get('/', async (req, res) => {
    try {
        const discussions = await Discussion.find({ isArchived: { $ne: true } })
            .select('_id subject userName lastCommentAt updatedAt commentCount')
            .sort({ lastCommentAt: -1, updatedAt: -1 })
            .lean()
            .exec()

        const discussionsResponse = discussions.map((discussion) => ({
            subject: discussion.subject,
            author: discussion.userName,
            lastCommentAt: discussion.lastCommentAt,
            commentCount: discussion.commentCount,
            url: `http://localhost:8080/discussions/${discussion._id.toString()}`,
        }))

        res.status(200).json(discussionsResponse)
    } catch (error) {
        console.error('Error fetching Discussions:', error)
        res.status(500).json({ error: 'Failed to get Discussions.' })
    }
})

/** ---------------------- Adds a new comment to a discussion. ---------------------- */
router.post('/:discussionId/comments', async (req, res) => {
    try {
        const { discussionId } = req.params
        const { content, parentCommentId, userId } = req.body

        // Validate Discussion exists and is active:
        const discussion = await Discussion.findById(discussionId).lean().exec()

        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found.' })
        }

        if (discussion?.isArchived) {
            return res.status(403).json({ message: 'Cannot comment on an archived Discussion.' })
        }

        // Check the User exists:
        const user = await User.findById(userId)

        if (!user) {
            return res.status(403).json({ message: 'Only active Users can comment.' })
        }

        // Start a new session to make sure everything gets updated in one transaction:
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const newComment = new Comment({
                discussionId,
                userId,
                content,
                parentCommentId: parentCommentId || null,
                userName: user.userName,
            })

            await newComment.save({ session })

            // Update discussion's lastCommentAt, commentCount, and comments array:
            await Discussion.findByIdAndUpdate(
                discussionId,
                {
                    $inc: { commentCount: 1 },
                    $set: { lastCommentAt: newComment.createdAt },
                    $push: { comments: newComment._id },
                },
                { session }
            )

            // If this is a reply to another comment, update that comment's replies array
            if (parentCommentId) {
                await Comment.findByIdAndUpdate(
                    parentCommentId,
                    {
                        $push: { replies: newComment._id },
                    },
                    { session }
                )
            }

            await session.commitTransaction()
            res.status(201).json(newComment)
        } catch (error) {
            await session.abortTransaction()
            throw error // Re-throw to be caught by outer catch block
        } finally {
            session.endSession()
        }
    } catch (error) {
        console.error('Failed to add comment:', error)
        res.status(500).json({ error: 'Failed to add comment.' })
    }
})

/** ---------------------- Gets all the comments for a discussion as a tree. ---------------------- */
router.get('/:discussionId/comments', async (req, res) => {
    const { discussionId } = req.params

    // Fetch the discussion (ensuring it's not archived) and all its comments:
    const discussion = await Discussion.findOne({ _id: discussionId, isArchived: false })
        .select('userName subject content comments commentCount')
        .populate({
            path: 'comments',
            match: { isDeleted: false },
            select: 'userName content createdAt parentCommentId',
            options: { sort: { createdAt: 1 } }, // Sort comments by createdAt
        })
        .lean()
        .exec()

    if (!discussion) {
        return res.status(404).json({ message: 'Discussion not found.' })
    }

    const buildCommentTree = (comments: any[]): any[] => {
        const commentMap = new Map<string, any>()
        const rootComments = []

        for (const comment of comments) {
            commentMap.set(comment._id.toString(), comment)
            comment.replies = []

            if (!comment.parentCommentId) {
                rootComments.push(comment)
            } else {
                const parentComment = commentMap.get(comment.parentCommentId.toString())

                if (!parentComment) {
                    // Only possible if parent comment has been deleted, since fetched comments were ordered by
                    // createdAt, and it's impossible for a child comment to have a createdAt before its parent's
                    // (i.e. the parent would have been in the commentMap already). Since there's no "delete comment"
                    // functionality yet, we can ignore this case, but the way this would be solved is:
                    // 1) Add a secondary "seenReplyIds" Map of childId->parentCommentId that, as we iterate through
                    //    each comment, we populate by also iterating through its replies array. This will enable us to
                    //    find where the deleted comment should be attached because we'll know its id from this
                    //    comment's parentCommentId value.
                    // 2) Create a new IComment instance with "deleted" as userName and content, and id set to this
                    //    comment's parentCommentId. And set its replies array to have this comment in it.
                    // 3) Since we know the deleted comment's parent must have been processed already, we can find its
                    //    parent via the seenReplyIds map value.
                    // 4) Grab the parent comment from the commentMap, and push the new IComment instance to its
                    //    replies array.
                } else {
                    parentComment.replies.push(comment)
                }
            }
        }

        return rootComments
    }

    const commentTree = buildCommentTree(discussion.comments)
    discussion.comments = commentTree

    res.status(200).json(discussion)
})

export default router
