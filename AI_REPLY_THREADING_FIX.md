# Fix: AI Reply Outside of Thread

## Problem

When users reply to AI comments on code (review comments), the AI's response appears as a separate comment outside the thread instead of being part of the same threaded conversation.

## Root Cause

The issue was in the logic that determines how to post AI replies:

**Before:**
```typescript
if (commentData.parentCommentId && commentData.filePath) {
  // Reply to review comment thread
  await this.postReplyToComment(
    project,
    commentData.pullRequestNumber.toString(),
    commentData.parentCommentId,  // ❌ Using parent ID incorrectly
    aiReply,
    ...
  );
}
```

The problem was:
1. When a user replies to an AI comment, `commentData.parentCommentId` contains the original AI comment ID
2. But we need to reply to the **current user's comment** to create a proper thread
3. The logic was passing the wrong comment ID to the reply function

## Solution

### 1. Fixed Threading Logic

**After:**
```typescript
const isReviewComment = commentData.filePath && commentData.lineNumber;

if (isReviewComment) {
  // This is a review comment (inline on code)
  // Use the current commentId as the parent for the reply thread
  await this.postReplyToComment(
    project,
    commentData.pullRequestNumber.toString(),
    commentData.commentId,  // ✅ Reply to THIS comment
    aiReply,
    commentData.filePath,
    commentData.lineNumber || 0,
    source,
  );
}
```

### 2. Improved General Comment Handling

For non-review comments (general PR comments), GitHub doesn't support threading. Added @mention for context:

```typescript
const replyWithMention = `@${authorUsername}\n\n${reply}`;
```

## How It Works Now

### Review Comment Flow (Inline on Code)

```
1. AI posts inline comment on line 42
   ├─ User replies: "Is this really necessary?"
   │  └─ AI replies: "Yes, because..." ✅ (stays in thread)
   └─ User replies: "Can we optimize this?"
      └─ AI replies: "Good idea..." ✅ (stays in thread)
```

### General Comment Flow (PR-level)

```
1. User posts: "@ai-reviewer can you explain?"
   └─ AI replies: "@username Sure! Here's..." ✅ (with mention)
```

## GitHub API Details

The fix properly uses:

- **`createReplyForReviewComment`** for threaded replies on review comments
  - Requires: `comment_id` (the comment to reply to)
  - Result: Reply appears in the same thread
  
- **`createComment`** for general PR comments
  - GitHub doesn't support threading for issue comments
  - Added `@mention` for context

## Testing

To verify the fix:

1. **Test inline comment threading:**
   - Create a PR
   - Wait for AI to comment on a specific line
   - Reply to that AI comment
   - AI's response should appear **in the same thread** (indented)

2. **Test general comment:**
   - Post a comment like "@ai-reviewer please review"
   - AI should reply with `@yourusername` at the start

## Expected Logs

When working correctly, you'll see:

```
Replying to review comment thread on src/file.ts:42 (comment: 123456)
✅ Posted reply to comment 123456
```

Or for general comments:

```
Replying to general PR comment 789012
✅ Posted reply to general comment 789012
```

## Files Changed

- `backend/src/modules/webhook/webhook.service.ts`
  - Updated reply logic in `handleCommentEvent` (line ~338-365)
  - Updated `postReplyToGeneralComment` signature to include author for @mention (line ~1069-1110)
