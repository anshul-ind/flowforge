# Phase 8 Complete Test Summary

## Commands to Get Started Right Now

### Terminal 1: Run Development Server
```bash
cd c:\flowforge\flowforge
npm run dev

# Output should show:
# ✓ Ready on http://localhost:3000
```

### Browser: Open App
```
https://localhost:3000
Login → Project → Task → Comments Section
```

### Terminal 2: Check Database (optional)
```bash
cd c:\flowforge\flowforge
npx prisma studio

# Opens: http://localhost:5555
```

---

## Test Scenarios with Expected Results

### 1️⃣ BASIC COMMENTS

#### Create Comment
**Command:**
- Type: `"Hello world"`
- Click: "Comment" button

**Expected:**
| Aspect | Result |
|--------|--------|
| Appears | Instantly (optimistic) |
| State | FADED, "Sending..." label |
| After 2s | Normal state, saved |
| Visible | Your name, email, timestamp |
| Editable | Yes (Edit/Delete buttons) |

**Database:**
```sql
-- Check Comment table
SELECT * FROM "Comment" WHERE content = 'Hello world';
-- Should see: createdAt = NOW, deletedAt = NULL
```

---

#### Edit Comment  
**Command:**
- Click: "Edit" button
- Change text to: `"Hello world - EDITED"`
- Click: "Update" button

**Expected:**
| Aspect | Result |
|--------|--------|
| Text | Changes immediately |
| Label | "(edited)" appears |
| Timestamp | Original time shown |
| Edit again | Can edit multiple times |

**Database:**
```sql
SELECT editedAt FROM "Comment" WHERE content = 'Hello world - EDITED';
-- Should NOT be NULL (has timestamp)
```

---

#### Delete Comment
**Command:**
- Click: "Delete" button
- Confirm: "Yes, delete"

**Expected:**
| Aspect | Result |
|--------|--------|
| UI | Comment disappears |
| Placeholder | "This comment was deleted" |
| Editable | No (not in UI) |
| Data | Preserved in DB |

**Database:**
```sql
SELECT * FROM "Comment" WHERE content = 'Hello world - EDITED';
-- Should see: deletedAt = NOW (has timestamp)
-- Should see: content still there (not deleted)
```

---

### 2️⃣ MARKDOWN RENDERING

#### Test: Bold, Italic, Headings
**Command:**
```markdown
# Main Title
## Subtitle

This is **bold** and this is *italic*.

- First item
- Second item
```

**Expected Visual:**
```
MAIN TITLE (Large, Bold)
Subtitle (Medium, Bold)

This is bold (darker) and this is italic (slanted).

• First item
• Second item
```

---

#### Test: Code & Quotes
**Command:**
```markdown
Use the `npm install` command.

> This is an important note
```

**Expected Visual:**
```
Use the npm install command (gray background).

| This is an important note (left border, gray)
```

---

#### Test: Code Block
**Command:**
~~~markdown
```
npm run build
```
~~~

**Expected Visual:**
```
[DARK BACKGROUND]
npm run build
[/DARK BACKGROUND]
```

---

### 3️⃣ MARKDOWN PREVIEW

**Command:**
1. Click "Write" tab - see raw markdown
2. Click "Preview" tab - see rendered
3. Switch back to "Write"
4. Switch back to "Preview"

**Expected:**
| Action | Result |
|--------|--------|
| Write → Preview | Shows rendered output |
| Preview → Write | Shows raw markdown |
| Switch multiple times | Content preserved |
| Submit after preview | Saves markdown text |

---

### 4️⃣ OPTIMISTIC UPDATES

**Command:**
1. Type: `"Quick test"`
2. Click "Comment"
3. **OBSERVE:** Reaction time

**Expected Timeline:**
| Time | Event |
|------|-------|
| 0ms | You click "Comment" |
| <100ms | Comment appears (FADED) |
| 0-100ms | "Sending..." label visible |
| 1-3s | "Sending..." disappears |
| 1-3s | Comment becomes normal opacity |
| Refresh | Comment still there |

**Key Points:**
- ✅ Appears before server response (optimistic)
- ✅ User sees instant feedback
- ✅ Faded state indicates pending
- ✅ Normal state confirms saved
- ✅ Survives page refresh

---

### 5️⃣ REJECTION FORM UI

**Command:**
1. Navigate to task with approval request
2. Click "Reject" button (in approval section)
3. Type: `"This design needs more iterations before approval"`
4. Observe character counter
5. Click "Submit Rejection"

**Expected:**
| Element | Result |
|---------|--------|
| Form appears | Textarea visible |
| Placeholder text | Guides user |
| Character counter | Shows "50/1000" |
| Minimum (10 chars) | Can't submit if less |
| Maximum (1000 chars) | Can't type more |
| Submit disabled | Until minimum met |
| On submit | Task status → IN_PROGRESS |
| Rejection reason | Stored in notes |

**Test Minimums:**
```
"Too short" (9 chars) → Error, can't submit
"Minimum ten" (11 chars) → Can submit
"x" × 1000 → Allowed
"x" × 1001 → Blocked (can't type)
```

---

### 6️⃣ EMOJI REACTIONS - ADD

#### First Reaction
**Command:**
1. Find any comment
2. Look at bottom - see "+" button
3. Click "+" 
4. Click "👍"

**Expected:**
| Step | Result |
|------|--------|
| Click + | Emoji picker opens |
| Shows emojis | 👍 ❤️ 😂 🔥 😮 😢 👏 🎉 |
| Click 👍 | Picker closes |
| Button appears | "👍 1" |
| Button color | BLUE (you reacted) |
| Persists | Still after refresh |

**Database:**
```sql
SELECT * FROM "CommentReaction" WHERE emoji = '👍';
-- Should see: userId, commentId, emoji='👍'
```

---

#### Multiple Reactions
**Command:**
1. Same comment from above
2. Click "+" again
3. Click "❤️"
4. Click "+" again
5. Click "😂"

**Expected:**
| Result | Details |
|--------|---------|
| All visible | "👍 1", "❤️ 1", "😂 1" |
| All blue | You reacted to each |
| Order | By count (highest first) |
| Independent | Remove 1 doesn't affect others |

---

#### Toggle Reaction Off
**Command:**
1. Click the "👍 1" button again

**Expected:**
| Scenario | Result |
|----------|--------|
| You're only one | Button disappears |
| Others reacted | "👍" count decreases |
| Button color | Becomes gray (not your reaction) |
| Click again | Can re-add |

---

#### Emoji Picker Features
**Command:**
1. Click "+"
2. Type "fire" in search box
3. See 🔥 appear
4. Type "party"
5. See 🎉 appear

**Expected:**
| Feature | Works |
|---------|-------|
| Quick access | 8 emojis shown by default |
| Search box | Filters as you type |
| Case insensitive | "FIRE" = "fire" |
| Partial match | "par" shows 🎉 |

---

#### Hover Tooltip
**Command:**
1. Hover over "👍 2" button
2. Wait ~300ms

**Expected:**
| Case | Tooltip |
|------|---------|
| 2 people reacted | "2 people reacted" |
| You reacted, 1 other | "You and 1 other reacted" |
| Only you | "You reacted" |

---

### 7️⃣ @MENTIONS - AUTOCOMPLETE

**Command:**
1. In comment form type: `"@john"`
2. Observe autocomplete

**Expected Autocomplete**
```
Search: "@"
Result: (closes - need more chars)

Search: "@j"
Result: 
  [J] John Smith
      john@company.com
  
  [J] Jane Doe  
      jane@company.com

Search: "@john"
Result:
  [J] John Smith
      john@company.com
```

**Features:**
| Feature | Expected |
|---------|----------|
| Closes on @ | Yes (need more) |
| Fuzzy match | Finds "john" in "john" |
| Email match | Finds "jo" in "johnson@..." |
| Case insensitive | "@JOHN" = "@john" |
| User circle | Shows avatar (first letter) |

---

### 8️⃣ @MENTIONS - SELECT & SAVE

**Command:**
1. Type: `"@john can you review?"`
2. See dropdown with John Smith
3. Click "John Smith"
4. Text becomes: `"@John Smith can you review?"`
5. Click "Comment"

**Expected:**
| Step | Result |
|------|--------|
| Click user | Name inserted at @ |
| Can type after | Text continues normally |
| Comment saves | Mention stored |
| Display | "@John Smith" shows as BADGE |
| Badge color | BLUE background |

**Display Format:**
```
@John Smith can you review?

Mentions: [@John Smith]
```

---

### 9️⃣ @MENTIONS - MULTIPLE & INVALID

#### Multiple Mentions
**Command:**
1. Type: `"@john and @jane please review"`
2. Select both users from autocomplete
3. Click "Comment"

**Expected:**
```
@John Smith and @Jane Doe please review

Mentions: [@John Smith] [@Jane Doe]
```

---

#### Invalid/Nonexistent User
**Command:**
1. Type: `"@xyz123notauser"`
2. Try to complete text

**Expected:**
| Behavior | Result |
|----------|--------|
| Autocomplete | Closes (no matches) |
| Text entry | Allowed as normal text |
| On submit | Saves as plain text |
| Mention created | NO (user doesn't exist) |
| Error | None |

---

#### Self-Mention Prevention
**Command:**
1. You are "John Smith"
2. Type: `"@john"`
3. See "John Smith" in dropdown
4. Click yourself
5. Submit

**Expected:**
| Result |
|--------|
| Not inserted (rejected) |
| Text stays: `"@john"` |
| No mention created |
| No error shown |

---

## DATABASE VERIFICATION

### Check Everything Saved

```bash
cd c:\flowforge\flowforge
npx prisma studio
```

**Visit: http://localhost:5555**

---

### Comment Table Verification
```
✅ Column: id (unique ID)
✅ Column: content (your text)
✅ Column: createdAt (creation time)
✅ Column: editedAt (NULL if never edited, TIME if edited)
✅ Column: deletedAt (NULL if active, TIME if deleted)
✅ Column: userId (who wrote it)
✅ Column: taskId (which task)

For your test data:
- Created comments: createdAt = NOW, deletedAt = NULL
- Edited comments: editedAt = NOW
- Deleted comments: deletedAt = NOW, content still there
```

---

### CommentReaction Table Verification
```
✅ Column: id (unique ID)
✅ Column: commentId (which comment)
✅ Column: userId (who reacted)
✅ Column: emoji (the emoji: "👍", "❤️", etc)
✅ Column: createdAt (reaction time)

Unique Constraint: (commentId, userId, emoji)
- One emoji per user per comment allowed
- Duplicate attempt: ignored or replaces

For your test data:
- "👍" reaction: emoji='👍'
- "❤️" reaction: emoji='❤️'
- Multiple users: multiple rows, same emoji
```

---

### Mention Table Verification
```
✅ Column: id (unique ID)
✅ Column: commentId (which comment)
✅ Column: mentionedUserId (who was mentioned)
✅ Column: createdAt (mention time)

For your test data:
- "@John Smith": mentionedUserId=john-id
- "@Jane Doe": mentionedUserId=jane-id
- Multiple mentions: multiple rows
- Self-mention prevented: won't appear in table
```

---

## Performance Benchmarks

### Expected Timings

```
COMMENT CREATE:
  - Optimistic appear: <100ms
  - "Sending..." label: Shown
  - Server save: 1-3 seconds
  - Confirmation: Instant UI update

REACTION TOGGLE:
  - Click to update: <500ms
  - Database save: 1-2 seconds
  - UI refresh: Instant

MENTION AUTOCOMPLETE:
  - Type @ to show: <200ms
  - Filter on each char: <150ms
  - Click to select: Instant
  - Insert in textarea: <50ms

MARKDOWN PREVIEW:
  - Switch to preview: <300ms
  - Render markdown: <200ms
  - Switch back to write: <100ms

PAGE LOAD:
  - Initial load: 2-4 seconds
  - Comments section: <2 seconds
  - All reactions/mentions: <1 second
```

### Browser DevTools Verification

**F12 → Network Tab:**

```
POST /api/comments/create
  Size: ~1-2 KB
  Time: 1-3 seconds

POST /api/reactions/toggle
  Size: <500 B
  Time: <1 second

POST /api/mentions/add
  Size: <1 KB
  Time: 1-2 seconds
```

---

## Troubleshooting

### Issue: Comments not appearing

**Check:**
```bash
# 1. Dev server running?
npm run dev

# 2. Database connected?
npx prisma studio

# 3. See errors in console?
# F12 > Console tab
```

**Solution:**
```bash
# Restart everything
npm run dev
# Ctrl+C to stop
# npm run dev to restart
```

---

### Issue: Autocomplete not showing

**Check:**
- Multiple users in workspace? (Need 2+)
- Email format correct? (user@domain.com)
- Typing "@"? (Not just text)

**Solution:**
```bash
# Clear browser cache and reload
Ctrl+Shift+Delete (cache)
Ctrl+F5 (hard refresh)
```

---

### Issue: Reactions not saving

**Check:**
```bash
npx prisma studio
# Go to CommentReaction table
# Reaction there after you click it?
```

**Database constraint issue?**
```
Error: Unique constraint violation
Solution: 
  - You already reacted that emoji
  - Try different emoji
  - Toggle off first, then re-add
```

---

### Issue: Mention not appearing

**Check:**
- User exists in workspace?
- Name spelled correctly?
- Email valid?
- User has account?

**Solution:**
```bash
# Check users in workspace
npx prisma studio
# Go to User or WorkspaceMember table
# Verify user exists there
```

---

## Final Sign-Off Checklist

When all tests pass, mark complete:

```
FEATURES (9 total):
☐ 1. Basic Comments (create/read/edit/delete)
☐ 2. Edit Label "(edited)"
☐ 3. Soft Delete (placeholder shown)
☐ 4. Markdown (bold/italic/code/lists/quotes)
☐ 5. Markdown Preview (write/preview tabs)
☐ 6. Optimistic Updates (instant appear + save)
☐ 7. Rejection Form UI (validation + submit)
☐ 8. Emoji Reactions (add/toggle/multiple)
☐ 9. @Mentions (type/autocomplete/display)

DATABASE:
☐ Comments table populated
☐ CommentReaction table populated
☐ Mention table populated
☐ deletedAt working (soft delete)
☐ editedAt working (edit tracking)

PERFORMANCE:
☐ Comments appear instantly
☐ Reactions toggle <500ms
☐ Autocomplete <200ms
☐ Preview renders <300ms
☐ No lag on rapid clicks

ERRORS:
☐ Browser console clean (no red errors)
☐ Network tab no failed requests
☐ Server logs no 500 errors
☐ Database migrations all applied

EDGE CASES:
☐ Self-mention blocked
☐ Duplicate reactions blocked
☐ Can edit multiple times
☐ Can delete then add new comment
☐ Multiple mentions work
☐ Invalid users ignored
```

---

## Summary

**Total Tests:** 16 core scenarios
**Estimated Time:** 1.5 - 2 hours
**Platform:** http://localhost:3000
**Database UI:** http://localhost:5555 (npx prisma studio)

**When Complete:**
- All tests pass
- No errors in console
- Data verified in database
- Ready for Phase 9

---

## Questions?

Check these files:
- [PHASE-8-QUICK-TEST.md](./PHASE-8-QUICK-TEST.md) - Quick reference
- [PHASE-8-TESTING.md](./PHASE-8-TESTING.md) - Detailed guide
- [PHASE-8-TEST-WALKTHROUGH.md](./PHASE-8-TEST-WALKTHROUGH.md) - Step-by-step

Code location:
- Components: `components/comment/`
- Backend: `modules/comment/`
- Database: `prisma/schema.prisma`

Good luck! 🎉
