import { Router } from 'express'

import { AppError } from 'errorHandler'
import { User, UserType } from 'models/user'

const router = Router()

/** -------------- Endpoint to list all existing users (userName, firstName, lastName, and type only). -------------- */
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

/** ------------------------------- Endpoint to get a User's id given their userName. -------------------------------*/
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
