import mongoose from 'mongoose'

import { CommentModel, IComment } from '../models/comment'
import { DiscussionModel } from '../models/discussion'
import { CommentObject } from '../models/response'
import { IUser, User, UserType } from '../models/user'
import { addComment, createDiscussion, getDiscussions, getDiscussionWithComments } from '../services/discussion'
import * as utils from '../utils'

beforeEach(async () => {
    await User.deleteMany({})
    await DiscussionModel.deleteMany({})
    await CommentModel.deleteMany({})
})

describe('createDiscussion', () => {
    it('should create a discussion for a valid professor', async () => {
        const professor: IUser = await User.create({
            userName: 'Prof',
            type: UserType.PROFESSOR,
            firstName: 'Bill',
            lastName: 'Bob',
        })

        const discussion = await createDiscussion(professor._id.toString(), 'Test Subject', 'Test Content')

        expect(discussion.userId.toString()).toBe(professor._id.toString())
        expect(discussion.subject).toBe('Test Subject')
        expect(discussion.content).toBe('Test Content')
        expect(discussion.userName).toBe('Prof')
    })

    it('should throw an error if user does not exist', async () => {
        await expect(
            createDiscussion(new mongoose.Types.ObjectId().toString(), 'Test Subject', 'Test Content')
        ).rejects.toThrow('Only active Users can create discussions.')
    })

    it('should throw an error if user is not a professor', async () => {
        const student = await User.create({
            userName: 'Student',
            type: UserType.STUDENT,
            firstName: 'John',
            lastName: 'Doe',
        })
        await expect(createDiscussion(student._id.toString(), 'Test Subject', 'Test Content')).rejects.toThrow(
            'Only professors can create discussions'
        )
    })
})

describe('getDiscussions', () => {
    it('should return active discussions sorted by updatedAt', async () => {
        const discussion1 = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User1',
            subject: 'Subject1',
            content: 'Content1',
            updatedAt: new Date('2023-01-01'),
            commentCount: 2,
        })
        const discussion2 = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User2',
            subject: 'Subject2',
            content: 'Content2',
            updatedAt: new Date('2023-01-02'),
            commentCount: 1,
            isArchived: true,
        })
        const discussion3 = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User3',
            subject: 'Subject3',
            content: 'Content3',
            updatedAt: new Date('2023-01-03'),
            commentCount: 0,
        })

        const discussions = await getDiscussions()

        expect(discussions).toHaveLength(2)
        expect(discussions[0].subject).toBe('Subject3')
        expect(discussions[1].subject).toBe('Subject1')
        expect(discussions.some((d) => d.subject === 'Subject2')).toBeFalsy()
    })
})

describe('addComment', () => {
    it('should add a top-level comment to a discussion', async () => {
        const discussion = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User1',
            subject: 'Test Subject',
            content: 'Test Content',
        })

        const comment = await addComment(
            discussion._id.toString(),
            new mongoose.Types.ObjectId().toString(),
            'Commenter',
            'Test Comment'
        )

        expect(comment.content).toBe('Test Comment')
        expect(comment.userName).toBe('Commenter')
        expect(comment.parentCommentId).toBeNull()

        const updatedDiscussion = await DiscussionModel.findById(discussion._id)
        expect(updatedDiscussion).not.toBeNull()
        expect(updatedDiscussion!.commentCount).toBe(1)
        expect(updatedDiscussion!.lastCommentAt).toBeDefined()
        expect(updatedDiscussion!.comments).toContainEqual(comment._id)
    })

    it('should add a reply to an existing comment', async () => {
        const discussion = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User1',
            subject: 'Test Subject',
            content: 'Test Content',
        })

        const parentComment = await CommentModel.create({
            discussionId: discussion._id,
            userId: new mongoose.Types.ObjectId(),
            userName: 'Parent Commenter',
            content: 'Parent Comment',
        })

        const reply = await addComment(
            discussion._id.toString(),
            new mongoose.Types.ObjectId().toString(),
            'Replier',
            'Test Reply',
            parentComment._id.toString()
        )

        expect(reply.content).toBe('Test Reply')
        expect(reply.userName).toBe('Replier')
        expect(reply.parentCommentId?.toString()).toBe(parentComment._id.toString())

        const updatedParentComment = await CommentModel.findById(parentComment._id)
        expect(updatedParentComment).not.toBeNull()
        expect(updatedParentComment!.replies).toContainEqual(reply._id)
    })

    it('should throw an error if parent comment does not exist', async () => {
        const discussion = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User1',
            subject: 'Test Subject',
            content: 'Test Content',
        })

        await expect(
            addComment(
                discussion._id.toString(),
                new mongoose.Types.ObjectId().toString(),
                'Replier',
                'Test Reply',
                new mongoose.Types.ObjectId().toString()
            )
        ).rejects.toThrow('Parent comment not found')
    })
})

describe('getDiscussionWithComments', () => {
    it('should return discussion with comments in tree structure', async () => {
        const discussion = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User1',
            subject: 'Test Subject',
            content: 'Test Content',
        })

        const comment1 = await CommentModel.create({
            discussionId: discussion._id,
            userId: new mongoose.Types.ObjectId(),
            userName: 'Commenter1',
            content: 'Comment 1',
        })

        const comment2 = await CommentModel.create({
            discussionId: discussion._id,
            userId: new mongoose.Types.ObjectId(),
            userName: 'Commenter2',
            content: 'Comment 2',
            parentCommentId: comment1._id,
        })

        await DiscussionModel.findByIdAndUpdate(discussion._id, {
            $push: { comments: [comment1._id, comment2._id] },
            $inc: { commentCount: 2 },
        })

        jest.spyOn(utils, 'buildCommentTree').mockImplementation((comments: IComment[]): CommentObject[] => {
            return comments.map((comment) => ({
                _id: comment._id,
                userName: comment.userName,
                content: comment.content,
                createdAt: comment.createdAt,
                replies: [],
            }))
        })

        const result = await getDiscussionWithComments(discussion._id.toString())

        expect(result.subject).toBe('Test Subject')
        expect(result.content).toBe('Test Content')
        expect(result.commentCount).toBe(2)
        expect(result.comments).toHaveLength(2)
        expect(utils.buildCommentTree).toHaveBeenCalled()
    })

    it('should throw an error if discussion is not found', async () => {
        await expect(getDiscussionWithComments(new mongoose.Types.ObjectId().toString())).rejects.toThrow(
            'Discussion not found.'
        )
    })

    it('should not return archived discussions', async () => {
        const discussion = await DiscussionModel.create({
            userId: new mongoose.Types.ObjectId(),
            userName: 'User1',
            subject: 'Test Subject',
            content: 'Test Content',
            isArchived: true,
        })

        await expect(getDiscussionWithComments(discussion._id.toString())).rejects.toThrow('Discussion not found.')
    })
})
