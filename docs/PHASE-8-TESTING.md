# Phase 8 Testing Guide - Comments with Reactions & Mentions

## Prerequisites

Before testing, ensure your environment is set up:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
# Make sure .env.local has DATABASE_URL and NEXTAUTH_SECRET

# 3. Run migrations
npx prisma migrate dev

# 4. Start development server
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Quick Start Testing

### Step 1: Start Development Server
```bash
cd c:\flowforge\flowforge

# Terminal 1: Start Next.js dev server
npm run dev

# Should see:
# ✓ Ready in 2.5s
# ✓ Ready on http://localhost:3000
```

### Step 2: Login to the App
1. Open http://localhost:3000 in browser
2. Click "Sign In"
3. Create test account or use existing one
4. You'll be redirected to dashboard

---

## Feature Test Plan

### ✅ Feature 1: Basic Comments

**Test Scenario:** Create and read a comment

**Steps:**
1. Navigate to any task in a project
2. Scroll to Comments section
3. Type: `This is a test comment`
4. Click "Comment" button

**Expected Results:**
- ✅ Comment appears instantly (optimistic update)
- ✅ "Sending..." label shown while saving
- ✅ Your name and email displayed
- ✅ Timestamp shows current date/time
- ✅ Comment text renders (should see markdown detected if used)

**Test Data:**
```
Input: "This is a test comment"
Expected: Comment visible with user info and timestamp
```

---

### ✅ Feature 2: Edit Comment with "(edited)" Label

**Test Scenario:** Edit a comment and verify edit label

**Steps:**
1. Hover over your comment
2. Click "Edit" button
3. Change text to: `This is an edited test comment`
4. Click "Update" button

**Expected Results:**
- ✅ Comment updates
- ✅ "(edited)" label appears next to timestamp
- ✅ Original text replaced with new text
- ✅ Save feedback shown

**Test Data:**
```
Original: "This is a test comment"
Updated: "This is an edited test comment"
Expected: Shows "(edited)" label
```

---

### ✅ Feature 3: Soft Delete Comments

**Test Scenario:** Delete a comment and verify it shows placeholder

**Steps:**
1. Create a test comment: `Delete me please`
2. Click "Delete" button on the comment
3. Confirm deletion in dialog

**Expected Results:**
- ✅ Comment disappears from UI
- ✅ "This comment was deleted" placeholder shown
- ✅ Comment still in database (soft delete, not hard delete)
- ✅ Audit log records the deletion

**Database Check:**
```bash
# Check that comment has deletedAt set
npx prisma studio
# Navigate to Comment table
# Find the deleted comment
# See: deletedAt = [current timestamp]
# See: content = [original text] (preserved)
```

---

### ✅ Feature 4: Markdown Rendering

**Test Scenario:** Create comment with markdown and verify rendering

**Steps:**
1. Click "Comment" form
2. Type markdown content:
```
**Bold text** and *italic text*

# Heading 1
## Heading 2

- List item 1
- List item 2

> This is a blockquote

`inline code` and code block:
```
code block example
```
```

3. Click "Comment" button

**Expected Results:**
- ✅ **Bold** text is bold
- ✅ *Italic* text is italic
- ✅ Headings displayed with correct sizes
- ✅ Bullet list rendered
- ✅ Blockquote has left border and gray text
- ✅ Code highlighted with dark background
- ✅ Links are blue and clickable

**Test Data:**
```markdown
**bold** *italic* 
# H1 ## H2
- item1 - item2
> quote
`code`
```

**Expected:** All markdown renders correctly

---

### ✅ Feature 5: Markdown Preview

**Test Scenario:** Use preview tab to see markdown rendering before posting

**Steps:**
1. Click "Write" tab in comment form
2. Paste markdown content:
```
# Title

This is **bold** and this is *italics*

- Point 1
- Point 2

> Important quote
```

3. Click "Preview" tab
4. Verify rendering looks correct
5. Click back to "Write" tab

**Expected Results:**
- ✅ Write tab shows raw markdown
- ✅ Preview tab shows rendered output
- ✅ Can switch between tabs freely
- ✅ Content is preserved when switching tabs
- ✅ Preview matches final rendering

**Expected Preview:**
```
Title (large heading)

This is bold and this is italics

• Point 1
• Point 2

| Important quote (indented, gray)
```

---

### ✅ Feature 6: Optimistic Updates

**Test Scenario:** See comment appear instantly before server confirms

**Steps:**
1. Type comment: `Testing optimistic updates`
2. Click "Comment"
3. **OBSERVE:** Comment appears IMMEDIATELY in faded state
4. After 1-2 seconds, it becomes normal opacity
5. Refresh page to confirm comment saved

**Expected Results:**
- ✅ Comment appears instantly (0.1s)
- ✅ Shows "Sending..." label
- ✅ Comment is in italic/faded state
- ✅ Edit/Delete buttons disabled while sending
- ✅ After server response: normal state, "Sending..." disappears
- ✅ On page refresh: comment still there (was saved)

**Performance Check:**
```
Comment appears: <100ms (optimistic)
Server saves: 1-2 seconds
Final confirmation: instant toggle
```

---

### ✅ Feature 7: Rejection Form UI

**Test Scenario:** Reject a task and see rejection form

**Steps:**
1. Navigate to a task with approval request
2. Find "Approve" / "Reject" buttons (in Approval section)
3. Click "Reject" button
4. Type rejection reason: `This needs more work because the design is incomplete`
5. Verify character counter shows
6. Click "Submit Rejection"

**Expected Results:**
- ✅ Rejection form appears with textarea
- ✅ Character counter shows (e.g., "45/1000")
- ✅ Minimum 10 characters required
- ✅ Maximum 1000 characters
- ✅ Error shown if less than 10 chars
- ✅ Submit button disabled if empty
- ✅ Form submitted and confirmation shown
- ✅ Task status changes to "IN_PROGRESS"

**Test Data:**
```
Short (invalid): "Too short" → Error shown
Valid: "This needs more work because the design is incomplete"
Long: "x" * 1000 → Allowed
Too long: "x" * 1001 → Blocked at 1000
```

---

### ✅ Feature 8: Reaction Emoji Toggle

**Test Scenario:** Add emoji reactions to comments

#### Test 8a: Add Your First Reaction
**Steps:**
1. Find a comment you created
2. Look for "+" button near bottom of comment
3. Click "+" button
4. Emoji picker appears
5. Click "👍" emoji (thumbs up)

**Expected Results:**
- ✅ Emoji picker popup appears
- ✅ Emoji picker has quick access emojis: 👍 ❤️ 😂 🔥 😮 😢 👏 🎉
- ✅ Can type emoji name/unicode to search
- ✅ After selecting: reaction button appears
- ✅ Shows: "👍 1" (emoji + count)
- ✅ Button is highlighted in blue (shows you reacted)

**Test Data:**
```
Click: + button
Select: 👍
Result: "👍 1" button appears (blue background)
```

#### Test 8b: Add Second Reaction
**Steps:**
1. Still on same comment
2. Click "+" button again
3. Select "❤️" emoji

**Expected Results:**
- ✅ Another reaction button appears
- ✅ Now shows: "👍 1" and "❤️ 1"
- ✅ Reactions sorted by count (highest first)
- ✅ Both can coexist on same comment
- ✅ Both show your button as blue (you reacted to both)

**Test Data:**
```
After: "👍 1" | "❤️ 1"
```

#### Test 8c: Multiple Users React
**Steps:**
1. (Have another user account or work with team member)
2. As User A: Add "👍" reaction
3. As User B: Add same "👍" reaction
4. As User B: Add "❤️" reaction

**Expected Results:**
- ✅ "👍" now shows "2" (both users reacted)
- ✅ "❤️" shows "1" (only User B)
- ✅ Your reactions stay blue
- ✅ Other user's reactions are gray
- ✅ Reactions don't group across comments

**Test Data:**
```
Comment 1:
User A → 👍
User B → 👍 ❤️

Display: 👍 2 (blue for A&B) | ❤️ 1 (blue for B)
```

#### Test 8d: Toggle Off Reaction
**Steps:**
1. Click the "👍 2" button you're on
2. Button should toggle and disappear if count goes to 0

**Expected Results:**
- ✅ Your reaction removed
- ✅ "👍" count decreases from 2 to 1
- ✅ Button loses blue highlight
- ✅ If you're last to react: button shows "👍 1" (no longer blue)
- ✅ If all users remove: button disappears completely

**Test Data:**
```
Before: "👍 2" (you reacted - blue)
After click: "👍 1" (you didn't - gray)
```

#### Test 8e: Emoji Picker Search
**Steps:**
1. Click "+" to open emoji picker
2. Type in search box: "fire"
3. See 🔥 appear

**Expected Results:**
- ✅ Search box works
- ✅ Filters emojis by name
- ✅ Can type emoji directly: "🎉" pastes in
- ✅ Autocomplete suggestions appear
- ✅ Can select any emoji (not just quick access)

**Test Data:**
```
Search: "fire" → Shows 🔥
Search: "party" → Shows 🎉
Custom: "🌟" → Can paste custom emoji
```

#### Test 8f: Reaction Hover Tooltip
**Steps:**
1. Hover over a reaction button showing "👍 2"
2. Wait 300ms

**Expected Results:**
- ✅ Tooltip appears above button
- ✅ Shows: "2 people reacted" or "You reacted"
- ✅ Tooltip disappears on mouse leave

**Test Data:**
```
Hover: "👍 2" → Tooltip: "2 people reacted"
Hover: "❤️ 1" (yours) → Tooltip: "You reacted"
```

---

### ✅ Feature 9: @Mentions

**Test Scenario:** Mention other workspace members

#### Test 9a: Type Mention in Comment
**Steps:**
1. In comment form, start typing: "@"
2. After @, type a user's name: "@john"
3. See autocomplete dropdown

**Expected Results:**
- ✅ When you type "@", nothing happens
- ✅ As you type "@jo", autocomplete shows matching users
- ✅ Shows users whose name contains "jo"
- ✅ Also matches email (e.g., "@jo" matches "john@company.com")
- ✅ Shows user avatar (first letter in circle)
- ✅ Shows full name and email
- ✅ Can click to select or press Enter

**Test Data:**
```
Type: "@"
Autocomplete: (empty - type more)

Type: "@john"
Autocomplete shows:
┌─────────────────┐
│ [J] John Smith  │
│     john@co.com │
└─────────────────┘

Type: "@rol"
Autocomplete shows: Roland, Robert, etc.
```

#### Test 9b: Select from Autocomplete
**Steps:**
1. Type: "@john" in comment
2. See "John Smith" in dropdown
3. Click on user or press Enter
4. Name should be inserted: "@John Smith"

**Expected Results:**
- ✅ Mention inserted after @
- ✅ Text is: "... @John Smith ..."
- ✅ Cursor moves after the mention
- ✅ Can continue typing after mention
- ✅ Multiple mentions in one comment: "@John and @jane agree"

**Test Data:**
```
Typed: "@john"
Dropdown: [John Smith - john@company.com]
Click: John Smith
Result: "Hey @John Smith, can you review this?"
```

#### Test 9c: Mention Display
**Steps:**
1. Create comment: "@John Smith please review this"
2. Submit the comment
3. Look at the comment

**Expected Results:**
- ✅ Comment shows: "@John Smith please review this"
- ✅ @mention appears as blue badge/pill
- ✅ Below comment, shows who was mentioned:
   ```
   [@John Smith] [@Jane Doe]
   ```
- ✅ Mentions clickable (optional: could navigate to user profile)
- ✅ Mentioned user receives notification

**Test Data:**
```
Comment text: "@John Smith and @Jane Doe check this"
Display:
  @John Smith and @Jane Doe check this
  
  Mentions: [@John Smith] [@Jane Doe]
```

#### Test 9d: Invalid Mentions Ignored
**Steps:**
1. Type comment: "The @nonexistent user"
2. Character "@non" doesn't match any user
3. Submit comment

**Expected Results:**
- ✅ If user doesn't exist, autocomplete stays closed
- ✅ @nonexistent is just treated as text
- ✅ Comment saves without error
- ✅ No mention created if user not found

**Test Data:**
```
Typed: "@xyz123notauser"
Autocomplete: (closed - no matches)
Saved: Text stays as "@xyz123notauser"
Mentions: None created
```

#### Test 9e: Self-Mention Prevention
**Steps:**
1. Your name is "John Smith"
2. Try to mention yourself: "@John Smith"
3. Autocomplete shows John Smith

**Expected Results:**
- ✅ Can see yourself in search results
- ✅ When clicking own name, ignore it
- ✅ Own mention not created
- ✅ Comment saves without self-mention

**Test Data:**
```
You: John Smith
Type: "@John Smith"
Select: John Smith
Result: Mention not created (self mention blocked)
Comment: "@John Smith" treated as text
```

---

## Database Verification

### Check Data Was Saved

```bash
# 1. Start Prisma Studio
npx prisma studio

# 2. Check these tables:

## Table: Comment
- Verify: id, content, createdAt, editedAt, deletedAt, userId, taskId
- Check: Deleted comments have deletedAt timestamp
- Check: Edited comments have editedAt timestamp

## Table: CommentReaction
- Verify: id, commentId, userId, emoji, createdAt
- Check: Multiple users can have different emojis on same comment
- Check: Unique constraint (commentId, userId, emoji) prevents duplicates

## Table: Mention
- Verify: id, commentId, mentionedUserId, createdAt
- Check: All mentioned users saved
- Check: Each user only mentioned once per comment
```

---

## API Testing (Advanced)

### Test Comment Creation API

```bash
# Create a comment with cURL
curl -X POST http://localhost:3000/api/comments/create \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-123",
    "content": "Test comment"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "id": "comment-xyz",
    "content": "Test comment",
    "createdAt": "2026-04-01T10:30:00.000Z",
    "userId": "user-abc"
  }
}
```

### Test Reaction Toggle API

```bash
# Toggle reaction
curl -X POST http://localhost:3000/api/reactions/toggle \
  -H "Content-Type: application/json" \
  -d '{
    "commentId": "comment-123",
    "emoji": "👍"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "added": true  // or false if removed
  }
}
```

---

## Common Issues & Fixes

### Issue: Comments not saving
**Solution:**
```bash
# Check database connection
npx prisma db push

# Check logs
npm run dev
# Look for errors in terminal
```

### Issue: Autocomplete not showing
**Solution:**
1. Make sure workspace has multiple users
2. Check user email format
3. Clear browser cache
4. Reload page

### Issue: Emoji not displaying
**Solution:**
- Browser support: Use modern browser (Chrome, Firefox, Safari, Edge)
- Emoji font: System emoji font should render it
- Try different emoji

### Issue: Reactions not persisting
**Solution:**
```bash
# Check unique constraint
npx prisma studio
# CommentReaction table
# Verify: (commentId, userId, emoji) is unique
```

---

## Test Checklist

Run through this before marking Phase 8 complete:

```
BASIC COMMENTS:
- [ ] Create comment
- [ ] See optimistic appearing
- [ ] Server confirmation received
- [ ] Edit comment
- [ ] See "(edited)" label
- [ ] Delete comment
- [ ] See placeholder

MARKDOWN:
- [ ] Bold, italic text renders
- [ ] Headings display correct size
- [ ] Lists render properly
- [ ] Blockquotes show border
- [ ] Code blocks have dark background
- [ ] Links are blue and clickable
- [ ] Preview tab works

REACTIONS:
- [ ] Add emoji reaction
- [ ] See count update
- [ ] Multiple emojis coexist
- [ ] Toggle off reaction
- [ ] Emoji picker opens
- [ ] Search emojis
- [ ] Hover tooltip works

MENTIONS:
- [ ] Type @ shows autocomplete
- [ ] Select user from dropdown
- [ ] Mention saved to database
- [ ] Mention displays as badge
- [ ] Multiple mentions work
- [ ] Invalid mentions ignored
- [ ] Self-mention prevented

REFERENCE:
- [ ] Deleted comments in DB have deletedAt
- [ ] Edited comments have editedAt
- [ ] Reactions table has unique constraint
- [ ] Mentions table has all members
- [ ] Audit logs record changes
```

---

## Performance Testing

Check browser DevTools:

```
METRICS:
- Comment appear time: <100ms (optimistic)
- Full save time: 1-3 seconds
- Reaction toggle: <500ms
- Emoji picker open: <300ms
- Mention autocomplete: <200ms

NETWORK:
- POST /api/comments/create: 1-2 KB
- POST /api/reactions/toggle: <500 B
- POST /api/mentions/add: <1 KB

MEMORY:
- No memory leaks on repeated actions
- Autocomplete cleanup on unmount
- Event listener cleanup
```

---

## Done! 🎉

After running through all these tests:
- Document any issues found
- Create GitHub issues for bugs
- Plan fixes for next iteration
- Update Phase 8 completion status

