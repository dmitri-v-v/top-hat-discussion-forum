import { Router } from 'express'

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
            return res.status(404).json({ message: 'No such user found.' })
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

export default router
