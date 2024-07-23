import { Router } from 'express'

import { AppError } from 'errorHandler'
import { DiscussionModel } from 'models/discussion'
import { User } from 'models/user'
import { addComment, createDiscussion, getDiscussions, getDiscussionWithComments } from 'services/discussion'

const router = Router()

/** -------------------------------- POSTs a new Discussion from the specified User. -------------------------------- */
router.post('/', async (req, res, next) => {
    try {
        const { userId, subject, content } = req.body

        const discussion = await createDiscussion(userId, subject, content)

        res.status(201).json(discussion)
    } catch (error) {
        next(error)
    }
})

/** --------- GETs a list of all the current Discussions ordered by last comment time in descending order. --------- */
router.get('/', async (req, res, next) => {
    try {
        const discussions = await getDiscussions()
        res.status(200).json(discussions)
    } catch (error) {
        next(error)
    }
})

/** ---------------------- Adds a new comment to a discussion. ---------------------- */
router.post('/:discussionId/comments', async (req, res, next) => {
    try {
        const { discussionId } = req.params
        const { content, parentCommentId, userId } = req.body

        // Validate Discussion exists and is active:
        const discussion = await DiscussionModel.findById(discussionId).select('_id isArchived').lean().exec()

        if (!discussion) throw new AppError(404, 'Discussion not found.')

        if (discussion.isArchived) throw new AppError(403, 'Cannot comment on an archived Discussion.')

        // Check the User exists:
        const user = await User.findById(userId).select('userName').lean().exec()
        if (!user) throw new AppError(403, 'Only active Users can comment.')

        const newComment = await addComment(discussionId, userId, user.userName, content, parentCommentId)
        res.status(201).json(newComment)
    } catch (error) {
        next(error)
    }
})

/** ---------------------- Gets all the comments for a discussion as a tree. ---------------------- */
router.get('/:discussionId/comments', async (req, res, next) => {
    try {
        const { discussionId } = req.params
        const discussion = await getDiscussionWithComments(discussionId)
        res.status(200).json(discussion)
    } catch (error) {
        next(error)
    }
})

export default router
