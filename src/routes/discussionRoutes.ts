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
                    $set: { lastCommentAt: new Date() },
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

export default router
