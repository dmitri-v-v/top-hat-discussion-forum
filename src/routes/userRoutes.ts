import { Router } from 'express'

import { User, UserType } from 'models/user'

const router = Router()

/** -------------- Endpoint to list all existing users (userName, firstName, lastName, and type only). -------------- */
router.get('/', async (req, res) => {
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
        console.error('Error fetching Users:', error)
        res.status(500).json({ error: 'Failed to get Users.' })
    }
})

/** ------------------------------- Endpoint to get a User's id given their userName. -------------------------------*/
router.get('/:userName', async (req, res) => {
    try {
        const userName = req.params.userName
        const user = await User.findOne({ userName }).lean().exec()

        if (!user) {
            return res.status(404).json({ message: `No User with userName ${userName}` })
        }

        const userResponse = {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            type: UserType[user.type],
        }

        res.status(200).json(userResponse)
    } catch (error) {
        console.error('Error getting User data:', error)
        res.status(500).json({ error: 'Failed to get User data.' })
    }
})

export default router
