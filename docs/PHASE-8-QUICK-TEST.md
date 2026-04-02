# Phase 8 Quick Test Commands

## Start Development Server (Terminal 1)

```bash
cd c:\flowforge\flowforge
npm run dev
```

**Expected Output:**
```
✓ Ready in 2.5s
✓ Ready on http://localhost:3000
✓ Local:        http://localhost:3000
```

---

## Open in Browser

```
http://localhost:3000
```

1. Sign In
2. Go to any workspace
3. Click on a project
4. Click on a task
5. Scroll down to "Comments" section

---

## Test 1: Create a Comment (30 seconds)

1. In comment form, type:
   ```
   This is my first test comment
   ```

2. Click "Comment" button

**What You'll See:**
- ✅ Comment appears instantly in FADED state
- ✅ "Sending..." label shown
- ✅ After ~2 seconds, fades in normally
- ✅ Your name and timestamp displayed

---

## Test 2: Edit Comment with Label (30 seconds)

1. Hover over your comment
2. Click "Edit"
3. Change text to:
   ```
   This is my edited test comment
   ```
4. Click "Update"

**What You'll See:**
- ✅ Comment text changes
- ✅ "(edited)" label appears next to timestamp
- ✅ Edit/Delete buttons still available

---

## Test 3: Test Markdown (1 minute)

1. Create new comment with:
   ```
   # Heading 1
   **Bold text** and *italic text*
   - Item 1
   - Item 2
   > Quote
   `code`
   ```

2. Click "Comment"

**What You'll See:**
- ✅ "Heading 1" displays as large heading
- ✅ **Bold** word is bold
- ✅ *Italic* word is italicized
- ✅ List items show as bullet points
- ✅ > Quote has left border, gray background
- ✅ `code` has gray background

---

## Test 4: Markdown Preview (1 minute)

1. In comment form, type markdown (same as Test 3)
2. Click "Preview" tab
3. See rendered output
4. Click "Write" tab to go back

**What You'll See:**
- ✅ Write tab: raw markdown text
- ✅ Preview tab: formatted output
- ✅ Can switch freely between tabs
- ✅ Content preserved when switching

---

## Test 5: Add Emoji Reactions (2 minutes)

1. Find a comment (yours or another's)
2. Scroll to bottom of comment
3. Click "+" button

**Emoji Picker Opens:**
```
Quick Access: 👍 ❤️ 😂 🔥 😮 😢 👏 🎉
Search Box: (type to search)
```

4. Click "👍" emoji

**What You'll See:**
- ✅ Popup appears with emoji options
- ✅ After clicking: "👍 1" button appears
- ✅ Button is BLUE (shows you reacted)
- ✅ Reaction persists after refresh

**Add Another Emoji:**
1. Click "+" again
2. Click "❤️"

**What You'll See:**
- ✅ "👍 1" and "❤️ 1" both visible
- ✅ Both are BLUE (you reacted to both)
- ✅ Reactions sorted by count

**Toggle Off:**
1. Click the "👍" button

**What You'll See:**
- ✅ "👍" count decreases
- ✅ Button loses blue color
- ✅ When count reaches 0, button disappears

---

## Test 6: Mention Someone (2 minutes)

**Prerequisites:** Your workspace has multiple users

1. In comment form, start typing:
   ```
   @
   ```

2. Type after @:
   ```
   @john
   ```

**Autocomplete Appears:**
```
[J] John Smith
    john@company.com

[Jo] Joseph Brown
     joseph@company.com
```

3. Click "John Smith"

**What You'll See:**
- ✅ Autocomplete dropdown appeared
- ✅ Shows matching users
- ✅ Shows name and email
- ✅ After clicking: "@John Smith" inserted
- ✅ Can continue typing after mention

4. Complete comment:
   ```
   @John Smith can you review this?
   ```

5. Click "Comment"

**What You'll See:**
- ✅ Comment saved
- ✅ "@John Smith" shows as BLUE BADGE
- ✅ Below comment, shows:
      ```
      [@John Smith]
      ```
- ✅ Both user and mentioned person notified

---

## Test 7: Soft Delete Comment (1 minute)

1. Create test comment:
   ```
   Delete this comment
   ```

2. Click "Delete" button
3. Confirm in dialog

**What You'll See:**
- ✅ Comment disappears from UI
- ✅ Placeholder shows:
      ```
      This comment was deleted
      ```
- ✅ No longer editable
- ✅ Original content preserved in database (check Prisma Studio)

---

## Test 8: Check Database (Database Verification)

```bash
# Terminal 2 (new terminal)
cd c:\flowforge\flowforge
npx prisma studio
```

**Opens:** http://localhost:5555

**Check These Tables:**

### 1. Comment Table
- ✅ See your created comments
- ✅ "content" field has text
- ✅ "createdAt" has timestamp
- ✅ "editedAt" populated only if edited
- ✅ "deletedAt" populated only if deleted
- ✅ Deleted comments still in table (soft delete confirmed)

### 2. CommentReaction Table
- ✅ One row per user + emoji combo
- ✅ Format: `{ commentId, userId, emoji }`
- ✅ "👍" reactions from this comment

### 3. Mention Table
- ✅ One row per mention
- ✅ Format: `{ commentId, mentionedUserId }`
- ✅ All mentioned users listed

---

## Test 9: Performance Check (Browser DevTools)

1. Press `F12` to open DevTools
2. Go to "Network" tab
3. Create a new comment
4. Watch network requests

**Expected Performance:**
```
✅ Comment appears: <100ms (optimistic)
✅ POST request sent: 1-2 KB payload
✅ Server responds: 1-3 seconds
✅ No errors in Console tab
```

---

## Quick Troubleshooting

### Comments not appearing?
```bash
# Check if database is running
npx prisma studio

# Check if migrations ran
npx prisma migrate status

# Restart dev server
npm run dev
```

### Autocomplete not showing mentions?
1. Make sure you have 2+ users in workspace
2. Clear browser cache (Ctrl+Shift+Delete)
3. Reload page (Ctrl+F5)

### Emoji not displaying?
- Use modern browser (Chrome, Firefox, Safari, Edge)
- Some emojis might not render on older systems
- Try different emoji

### Reactions not saving?
```bash
# Check database
npx prisma studio
# Navigate to CommentReaction table
# Verify data is there after clicking reaction
```

---

## Final Verification Checklist

Before moving to next phase, verify:

```
COMMENTS:        [ ] Create [ ] Edit [ ] Delete [ ] View
MARKDOWN:        [ ] Bold [ ] Lists [ ] Quotes [ ] Code [ ] Preview
OPTIMISTIC:      [ ] Instant [ ] Sending Label [ ] Confirmation
REACTIONS:       [ ] Add [ ] Multiple [ ] Toggle [ ] Persist
MENTIONS:        [ ] Type [ ] Autocomplete [ ] Display [ ] Save
DATABASE:        [ ] Comments [ ] Reactions [ ] Mentions saved
ERRORS:          [ ] Console clean [ ] No red errors
```

---

## Reference: File Locations for Debugging

If you need to check code:

```
Components:
- c:\flowforge\flowforge\components\comment\comment-form.tsx
- c:\flowforge\flowforge\components\comment\comment-item.tsx
- c:\flowforge\flowforge\components\comment\reaction-list.tsx
- c:\flowforge\flowforge\components\comment\mention-autocomplete.tsx

Backend:
- c:\flowforge\flowforge\modules\comment\reaction-service.ts
- c:\flowforge\flowforge\modules\comment\mention-service.ts
- c:\flowforge\flowforge\modules\comment\mention-parser.ts

Database:
- c:\flowforge\flowforge\prisma\schema.prisma
```

---

## Commands Summary

```bash
# Start dev server
npm run dev

# Open database UI
npx prisma studio

# Check migrations
npx prisma migrate status

# Run migrations
npx prisma migrate dev

# Regenerate Prisma client
npx prisma generate

# Run linting
npm run lint

# Run type check
npx tsc --noEmit
```

Good luck with testing! 🎉
