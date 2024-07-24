import mongoose from 'mongoose'
import { DiscussionModel, IDiscussion } from '../models/discussion'

describe('Discussion Model Test', () => {
    it('should create & save a discussion successfully', async () => {
        const userId = new mongoose.Types.ObjectId()
        const discussionData: Partial<IDiscussion> = {
            userId: userId,
            userName: 'Test User',
            subject: 'Test Subject',
            content: 'This is a test discussion content.',
            comments: [],
            commentCount: 0,
            isArchived: false,
        }

        const validDiscussion = new DiscussionModel(discussionData)
        const savedDiscussion = await validDiscussion.save()

        // Verify saved discussion
        expect(savedDiscussion._id).toBeDefined()
        expect(savedDiscussion.userId).toEqual(userId)
        expect(savedDiscussion.userName).toBe(discussionData.userName)
        expect(savedDiscussion.subject).toBe(discussionData.subject)
        expect(savedDiscussion.content).toBe(discussionData.content)
        expect(savedDiscussion.createdAt).toBeDefined()
        expect(savedDiscussion.updatedAt).toBeDefined()
        expect(savedDiscussion.comments).toEqual(expect.arrayContaining([]))
        expect(savedDiscussion.commentCount).toBe(0)
        expect(savedDiscussion.isArchived).toBe(false)

        // Verify that lastCommentAt is not set for a new discussion
        expect(savedDiscussion.lastCommentAt).toBeUndefined()
    })

    it('should fail to create a discussion without required fields', async () => {
        const invalidDiscussion = new DiscussionModel({})
        let error: unknown
        try {
            await invalidDiscussion.save()
        } catch (e) {
            error = e
        }

        expect(error).toBeDefined()
        expect(error).toBeInstanceOf(mongoose.Error.ValidationError)

        if (error instanceof mongoose.Error.ValidationError) {
            expect(error.errors.userId).toBeDefined()
            expect(error.errors.userName).toBeDefined()
            expect(error.errors.subject).toBeDefined()
            expect(error.errors.content).toBeDefined()
        } else {
            fail('Error is not a ValidationError')
        }
    })
})
