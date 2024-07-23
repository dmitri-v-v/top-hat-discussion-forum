import { Router } from 'express'

import { AppError } from 'errorHandler'
import { DiscussionModel } from 'models/discussion'
import { User } from 'models/user'
import { addComment, createDiscussion, getDiscussions, getDiscussionWithComments } from 'services/discussion'

const router = Router()

/**
 * @swagger
 * /discussions:
 *   post:
 *     summary: Create a new discussion.
 *     description: Creates a new discussion initiated by a specified professor.
 *     tags: [Discussions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the professor creating the discussion.
 *                 example: 60c72b2f9b1d8c1a4e5e4b44
 *               subject:
 *                 type: string
 *                 description: The subject of the discussion.
 *                 example: What is your favorite programming language?
 *               content:
 *                 type: string
 *                 description: The content of the discussion.
 *                 example: Let's discuss why we love certain programming languages.
 *     responses:
 *       201:
 *         description: The newly created discussion.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the discussion.
 *                   example: 60c72b2f9b1d8c1a4e5e4b45
 *                 userId:
 *                   type: string
 *                   description: The ID of the user who created the discussion.
 *                   example: 60c72b2f9b1d8c1a4e5e4b44
 *                 userName:
 *                   type: string
 *                   description: The username of the user who created the discussion.
 *                 subject:
 *                   type: string
 *                   description: The subject of the discussion.
 *                   example: What is your favorite programming language?
 *                 content:
 *                   type: string
 *                   description: The content of the discussion.
 *                   example: Let's discuss why we love certain programming languages.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The date and time when the discussion was created.
 *                   example: 2021-06-13T14:30:00Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: The date and time when the discussion was last updated.
 *                   example: 2021-06-13T14:30:00Z
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: The list of comment IDs associated with the discussion.
 *                   example: []
 *                 commentCount:
 *                   type: number
 *                   description: The number of comments on the discussion.
 *                   example: 0
 *                 lastCommentAt:
 *                   type: string
 *                   format: date-time
 *                   description: The date and time when the last comment was made.
 *                   example: 2021-06-13T14:30:00Z
 *                 isArchived:
 *                   type: boolean
 *                   description: Whether the discussion is archived.
 *                   example: false
 *       400:
 *         description: Bad request. The user is not a professor or the request body is invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: Validation error
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: User is not a professor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: Only professors can create discussions.
 */
router.post('/', async (req, res, next) => {
    try {
        const { userId, subject, content } = req.body

        const discussion = await createDiscussion(userId, subject, content)

        res.status(201).json(discussion)
    } catch (error) {
        next(error)
    }
})

/**
 * @swagger
 * /discussions:
 *   get:
 *     summary: Retrieve a list of all active discussions.
 *     description: Fetches all active discussions, sorted by the last comment date in descending order. Each discussion includes the subject, author, last comment date, comment count, and a URL to the comments.
 *     tags: [Discussions]
 *     responses:
 *       200:
 *         description: A list of discussions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   subject:
 *                     type: string
 *                     description: The subject of the discussion.
 *                     example: What is your favorite programming language?
 *                   author:
 *                     type: string
 *                     description: The username of the discussion's author.
 *                     example: johndoe
 *                   lastCommentAt:
 *                     type: string
 *                     format: date-time
 *                     description: The date and time when the last comment was made.
 *                     example: 2021-06-13T14:30:00Z
 *                   commentCount:
 *                     type: number
 *                     description: The number of comments on the discussion.
 *                     example: 3
 *                   url:
 *                     type: string
 *                     description: URL to access the comments of the discussion.
 *                     example: http://localhost:8080/discussions/60c72b2f9b1d8c1a4e5e4b45/comments
 */
router.get('/', async (req, res, next) => {
    try {
        const discussions = await getDiscussions()
        res.status(200).json(discussions)
    } catch (error) {
        next(error)
    }
})

/**
 * @swagger
 * /discussions/{discussionId}/comments:
 *   post:
 *     summary: Add a new comment to a discussion.
 *     description: Adds a new comment to the specified discussion. Supports adding comments as replies to other comments.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: discussionId
 *         required: true
 *         description: The ID of the discussion to which the comment will be added.
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1d8c1a4e5e4b45
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user making the comment.
 *                 example: 60c72b2f9b1d8c1a4e5e4b44
 *               content:
 *                 type: string
 *                 description: The content of the comment.
 *                 example: I agree, it's a great language for web development!
 *               parentCommentId:
 *                 type: string
 *                 description: The ID of the parent comment if this is a reply.
 *                 example: 60c72b2f9b1d8c1a4e5e4b46
 *     responses:
 *       201:
 *         description: The newly added comment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the comment.
 *                   example: 60c72b2f9b1d8c1a4e5e4b47
 *                 userId:
 *                   type: string
 *                   description: The ID of the user who made the comment.
 *                   example: 60c72b2f9b1d8c1a4e5e4b44
 *                 userName:
 *                   type: string
 *                   description: The username of the commenter.
 *                   example: johndoe
 *                 content:
 *                   type: string
 *                   description: The content of the comment.
 *                   example: I agree, it's a great language for web development!
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The date and time when the comment was created.
 *                   example: 2021-06-13T14:30:00Z
 *                 discussionId:
 *                   type: string
 *                   description: The ID of the discussion to which the comment was added.
 *                   example: 60c72b2f9b1d8c1a4e5e4b45
 *                 parentCommentId:
 *                   type: string
 *                   description: The ID of the parent comment if this is a reply.
 *                   example: 60c72b2f9b1d8c1a4e5e4b46
 *                 replies:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: The list of reply IDs associated with the comment.
 *                   example: []
 *                 isDeleted:
 *                   type: boolean
 *                   description: Whether the comment is deleted.
 *                   example: false
 *       404:
 *         description: Discussion or user not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: Discussion not found.
 *       403:
 *         description: Commenting is not allowed (e.g., discussion is archived or user is inactive).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: Cannot comment on an archived Discussion.
 */
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

/**
 * @swagger
 * /discussions/{discussionId}/comments:
 *   get:
 *     summary: Retrieve all comments for a discussion in a tree format.
 *     description: Fetches all comments for the specified discussion, structured as a comment tree. Excludes deleted comments and sorts by comment creation date.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: discussionId
 *         required: true
 *         description: The ID of the discussion whose comments are to be retrieved.
 *         schema:
 *           type: string
 *           example: 60c72b2f9b1d8c1a4e5e4b45
 *     responses:
 *       200:
 *         description: The discussion along with its comments in a tree structure.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the discussion.
 *                   example: 60c72b2f9b1d8c1a4e5e4b45
 *                 author:
 *                   type: string
 *                   description: The username of the discussion's author.
 *                   example: johndoe
 *                 subject:
 *                   type: string
 *                   description: The subject of the discussion.
 *                   example: What is your favorite programming language?
 *                 content:
 *                   type: string
 *                   description: The content of the discussion.
 *                   example: Let's discuss the pros and cons of different programming languages.
 *                 commentCount:
 *                   type: number
 *                   description: The total number of comments on the discussion.
 *                   example: 3
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: The ID of the comment.
 *                         example: 60c72b2f9b1d8c1a4e5e4b46
 *                       userName:
 *                         type: string
 *                         description: The username of the commenter.
 *                         example: janedoe
 *                       content:
 *                         type: string
 *                         description: The content of the comment.
 *                         example: I prefer Python for its simplicity.
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time when the comment was created.
 *                         example: 2021-06-13T14:30:00Z
 *                       parentCommentId:
 *                         type: string
 *                         description: The ID of the parent comment if this comment is a reply.
 *                         example: 60c72b2f9b1d8c1a4e5e4b47
 *                       replies:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                               description: The ID of the reply comment.
 *                               example: 60c72b2f9b1d8c1a4e5e4b48
 *                             userName:
 *                               type: string
 *                               description: The username of the reply commenter.
 *                               example: johndoe
 *                             content:
 *                               type: string
 *                               description: The content of the reply.
 *                               example: I agree, Python is quite readable!
 *                             createdAt:
 *                               type: string
 *                               format: date-time
 *                               description: The date and time when the reply was created.
 *                               example: 2021-06-13T15:00:00Z
 *                             parentCommentId:
 *                               type: string
 *                               description: The ID of the parent comment if this is a reply.
 *                               example: 60c72b2f9b1d8c1a4e5e4b46
 *                             replies:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   _id:
 *                                     type: string
 *                                     description: The ID of the nested reply.
 *                                     example: 60c72b2f9b1d8c1a4e5e4b49
 *                                   userName:
 *                                     type: string
 *                                     description: The username of the nested reply commenter.
 *                                     example: janedoe
 *                                   content:
 *                                     type: string
 *                                     description: The content of the nested reply.
 *                                     example: Yes, readability is one of Python's strengths.
 *                                   createdAt:
 *                                     type: string
 *                                     format: date-time
 *                                     description: The date and time when the nested reply was created.
 *                                     example: 2021-06-13T15:30:00Z
 *                                   parentCommentId:
 *                                     type: string
 *                                     description: The ID of the parent comment if this is a reply.
 *                                     example: 60c72b2f9b1d8c1a4e5e4b48
 *       404:
 *         description: Discussion not found or is archived.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: Discussion not found.
 */
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
