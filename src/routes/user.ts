import { Router } from 'express'

import { AppError } from 'errorHandler'
import { User, UserType } from 'models/user'

const router = Router()

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of all users.
 *     description: Fetches a list of all users, including userName, firstName, lastName, and type.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userName:
 *                     type: string
 *                     description: The username of the user.
 *                     example: johndoe
 *                   firstName:
 *                     type: string
 *                     description: The first name of the user.
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     description: The last name of the user.
 *                     example: Doe
 *                   type:
 *                     type: string
 *                     description: The type of the user.
 *                     example: PROFESSOR
 */
router.get('/', async (req, res, next) => {
    try {
        const users = await User.find({}, 'userName firstName lastName type').lean().exec()

        const usersResponse = users.map((user) => ({
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            type: UserType[user.type],
        }))

        res.status(200).json(usersResponse)
    } catch (error) {
        next(new AppError(500, 'Error fetching Users:', 'Failed to get Users'))
    }
})

/**
 * @swagger
 * /users/{userName}:
 *   get:
 *     summary: Retrieve a user's ID by their username.
 *     description: Fetches a user's ID, firstName, lastName, and type given their username.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *         description: The username of the user.
 *     responses:
 *       200:
 *         description: A user's details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the user.
 *                   example: 60c72b2f9b1d8c1a4e5e4b44
 *                 firstName:
 *                   type: string
 *                   description: The first name of the user.
 *                   example: John
 *                 lastName:
 *                   type: string
 *                   description: The last name of the user.
 *                   example: Doe
 *                 type:
 *                   type: string
 *                   description: The type of the user.
 *                   example: PROFESSOR
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                   example: No User with userName johndoe
 */
router.get('/:userName', async (req, res, next) => {
    try {
        const userName = req.params.userName
        const user = await User.findOne({ userName }).lean().exec()

        if (!user) throw new AppError(404, `No User with userName ${userName}`)

        const userResponse = {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            type: UserType[user.type],
        }

        res.status(200).json(userResponse)
    } catch (err) {
        next(err instanceof AppError ? err : new AppError(500, 'Error getting User data:', 'Failed to get User data.'))
    }
})

export default router
