import { User, UserType } from 'models/user'
import sampleUsers from 'data/users.json'

export async function seedUsers() {
    const count = await User.countDocuments()

    if (count === 0) {
        // Users have not been seeded yet
        for (const userData of sampleUsers) {
            const user = new User({
                ...userData,
            })

            await user.save()
        }

        console.log('Users seeded successfully.')
    } else {
        console.log('Users collection is not empty. Skipping seeding.')
    }
}
