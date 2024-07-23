import { IComment } from 'models/comment'
import { CommentObject } from 'models/response'

/**
 * Builds a tree structure from a flat array of comments. Each comment can have a parent comment and an array of
 * replies.
 *
 * @param comments The array of comments to build the tree from.
 * @returns The root comment array with their nested replies.
 */
export function buildCommentTree(comments: IComment[]): CommentObject[] {
    const commentMap = new Map<string, CommentObject>()
    const rootComments: CommentObject[] = []

    for (const comment of comments) {
        const commentObj: CommentObject = {
            _id: comment._id,
            userName: comment.userName,
            content: comment.content,
            createdAt: comment.createdAt,
            parentCommentId: comment.parentCommentId,
            replies: [],
        }

        commentMap.set(comment._id.toString(), commentObj)

        if (!comment.parentCommentId) {
            rootComments.push(commentObj)
        } else {
            const parentComment = commentMap.get(comment.parentCommentId.toString())

            if (parentComment) {
                parentComment.replies.push(commentObj)
            } else {
                // Only possible if parent comment has been deleted, since fetched comments were ordered by createdAt,
                // and it's impossible for a child comment to have a createdAt before its parent's (i.e. the parent
                // would have been in the commentMap already). Since there's no "delete comment functionality yet, we
                // can ignore this case, but the way this would be solved is:
                // 1) Add a secondary "seenReplyIds" Map of childId->parentCommentId that, as we iterate through each
                //    comment, we populate by also iterating through its replies array. This will enable us to find
                //    where the deleted comment should be attached because we'll know its id from this comment's
                //    parentCommentId value.
                // 2) Create a new IComment instance with "deleted" as userName and content, and id set to this
                //    comment's parentCommentId. And set its replies array to have this comment in it.
                // 3) Since we know the deleted comment's parent must have been processed already, we can find its
                //    parent via the seenReplyIds map value.
                // 4) Grab the parent comment from the commentMap, and push the new IComment instance to its replies.
                rootComments.push(commentObj)
            }
        }
    }

    return rootComments
}
