# 🚀 Phase 8 Testing - Start Here NOW

## STEP 1: Start Development Server (2 minutes)

Open **PowerShell** and run:

```powershell
cd c:\flowforge\flowforge
npm run dev
```

**Wait for:**
```
✓ Ready on http://localhost:3000
```

Keep this terminal open - don't close it during testing!

---

## STEP 2: Open Browser

Click or copy-paste in browser:
```
http://localhost:3000
```

**What you'll see:**
1. Flowforge landing page
2. Click "Sign In" 
3. Login with your credentials
4. Click on any Project
5. Click on any Task
6. Scroll down to "Comments" section

---

## STEP 3: Start Testing (Follow Order)

### Test A: Basic Comment (2 min)
```
1. Type in comment form: "Test comment"
2. Click "Comment" button
3. ✅ WATCH: Comment appears immediately (FADED)
4. ✅ WATCH: "Sending..." label shown
5. ✅ WAIT 2 seconds: Comment becomes normal (SAVED)
6. ✅ See: Your name and timestamp
```

**Expected Result:**
```
John Smith       2:30 PM
Test comment
[Edit] [Delete] (+)
```

---

### Test B: Edit Comment (2 min)
```
1. Hover over "Test comment"
2. Click "Edit"
3. Change to: "Updated test comment"
4. Click "Update"
5. ✅ See: "(edited)" label next to timestamp
```

**Expected Result:**
```
John Smith       2:30 PM (edited)
Updated test comment
[Edit] [Delete] (+)
```

---

### Test C: Markdown - Bold & Lists (2 min)
```
1. Type in comment form:

**This is bold**
*This is italic*

- Item one
- Item two

2. Click "Comment"
3. ✅ See: Bold text is BOLD
4. ✅ See: Italic text is slanted
5. ✅ See: Items as bullet points (•)
```

**Expected Result:**
```
This is bold (DARKER/HEAVIER)
This is italic (SLANTED)

• Item one
• Item two
```

---

### Test D: Markdown - Code (1 min)
```
1. Type in comment form:

Use the `npm install` command

Code block:
```
npm run build
```

2. Click "Comment"
3. ✅ See: `npm install` with gray background
4. ✅ See: Code block with DARK background
```

**Expected Result:**
```
Use the npm install command (gray bg)

npm run build (dark bg)
```

---

### Test E: Markdown - Quote (1 min)
```
1. Type in comment form:

> This is important!

2. Click "Comment"
3. ✅ See: Left border line
4. ✅ See: Gray background
5. ✅ See: Indented text
```

**Expected Result:**
```
| This is important!  (left border, gray bg)
```

---

### Test F: Markdown Preview (2 min)
```
1. Type markdown:

# Big Heading
**Bold text**
- List

2. Click "Preview" tab (next to "Write" tab)
3. ✅ See: Rendered markdown
4. Click "Write" tab
5. ✅ See: Raw markdown again
6. Switch back and forth a few times
```

**Works if:** Can switch tabs without losing content

---

### Test G: Optimistic Updates (Confirm) (2 min)
```
1. Type: "Fast comment"
2. Click "Comment"
3. ⏱️ TIME IT: Comment appears in <100ms
4. ✅ See: Comment is FADED
5. ✅ See: "Sending..." label
6. ⏱️ TIME IT: After 1-3 seconds becomes normal
7. Refresh page (Ctrl+F5)
8. ✅ Comment still there (saved!)
```

**Expected:**
- Appears: Instantly (<100ms)
- Saves: 1-3 seconds
- Persists: After refresh, still there

---

### Test H: Delete Comment & Soft Delete (2 min)
```
1. Create comment: "Delete me"
2. Click "Delete" button
3. Confirm in dialog
4. ✅ Comment disappears from view
5. ✅ See: "This comment was deleted" placeholder
6. Data NOT lost:
   - Open Prisma Studio: npx prisma studio
   - Go to Comment table
   - Find deleted comment
   - ✅ See: deletedAt = [timestamp]
   - ✅ See: content = [original text]
```

**Expected:**
```
| This comment was deleted
```

---

### Test I: Emoji Reactions - Add (3 min)
```
1. Find a comment (any comment)
2. Look for "+" button at bottom
3. Click "+"
4. Emoji picker appears!
   [👍] [❤️] [😂] [🔥] [😮] [😢] [👏] [🎉]
5. Click "👍"
6. ✅ See: "👍 1" button appears
7. ✅ See: Button is BLUE (you reacted)
8. ✅ Close page and come back
9. ✅ Reaction still there!
```

**Expected:**
```
"👍 1" (blue background)
```

---

### Test J: Emoji Reactions - Multiple (2 min)
```
1. Same comment from Test I
2. Click "+" again
3. Click "❤️"
4. ✅ See: Both "👍 1" and "❤️ 1"
5. ✅ See: Both are BLUE
6. Click "+" again
7. Click "😂"
8. ✅ See: "👍 1", "❤️ 1", "😂 1"
9. All BLUE (you reacted to all)
```

**Expected:**
```
👍 1 | ❤️ 1 | 😂 1 (all blue)
```

---

### Test K: Emoji Reactions - Toggle Off (1 min)
```
1. Click the "👍 1" button
2. ✅ Count decreases (if others reacted)
3. ✅ Button loses BLUE color
4. ✅ Or button disappears if count is 0
```

**Expected:**
```
Before: "👍 1" (blue)
After:  "👍" gone or gray
```

---

### Test L: Emoji Picker Search (2 min)
```
1. Click "+" button
2. Type in search box: "fire"
3. ✅ See: 🔥 appears
4. Clear and type: "party"
5. ✅ See: 🎉 appears
6. Can select any emoji from results
```

**Expected:**
```
Search: "fire" → [🔥]
Search: "party" → [🎉]
```

---

### Test M: Emoji Hover Tooltip (1 min)
```
1. Hover mouse over "👍 1" button
2. Wait 300ms
3. ✅ Tooltip appears above
4. ✅ Shows: "1 person reacted"
5. Move mouse away
6. ✅ Tooltip disappears
```

**Expected:**
```
👍 1 → (hover) → tooltip: "1 person reacted"
```

---

### Test N: @Mentions - Autocomplete (3 min)
```
1. In comment form, type: "@"
2. Nothing happens (need more chars)
3. Type: "@j"
4. ✅ See: Autocomplete dropdown!
   [J] John Smith
       john@company.com
   
   [J] Jane Doe
       jane@company.com
5. Type: "@jo"
6. ✅ Filtered to just "John"
```

**Expected:**
```
Type: "@"
Result: Nothing (need more)

Type: "@j"
Result: [J] John Smith
        [J] Jane Doe
        [J] Joseph Brown

Type: "@jo"
Result: [J] John Smith
        [Jo] Joseph Brown
```

---

### Test O: @Mentions - Select User (2 min)
```
1. Type in comment: "@john"
2. See dropdown with "John Smith"
3. Click "John Smith"
4. ✅ See: "@John Smith" inserted
5. Continue typing: "@John Smith please review"
6. ✅ Can add more text after mention
7. Click "Comment"
8. ✅ Comment saved with mention
```

**Expected Display:**
```
@John Smith please review

Mentions: [@John Smith]
```

---

### Test P: @Mentions - Multiple Mentions (2 min)
```
1. Type: "@john and @jane please check"
2. Type first @john
3. Select John Smith
4. Type @jane
5. Select Jane Doe
6. Click "Comment"
7. ✅ Both names mentioned:
   "[@John Smith] [@Jane Doe]"
```

**Expected:**
```
@John Smith and @Jane Doe please check

Mentions: [@John Smith] [@Jane Doe]
```

---

### Test Q: @Mentions - Invalid User (1 min)
```
1. Type: "@nonexistent"
2. ✅ Autocomplete CLOSES (no matches)
3. Type as normal text
4. Click "Comment"
5. Saves as text (no mention created)
6. ✅ No error
```

**Expected:**
```
Text saved as-is, no mention created
```

---

## STEP 4: Database Verification (5 min)

Open new PowerShell terminal:

```powershell
cd c:\flowforge\flowforge
npx prisma studio
```

Opens: http://localhost:5555

**Check these tables:**

### Comments Table
```
✅ Find your comment
✅ See: content = "Test comment"
✅ See: createdAt = [timestamp]
✅ Edited comments have: editedAt = [timestamp]
✅ Deleted comments have: deletedAt = [timestamp]
```

### CommentReaction Table
```
✅ Find reaction you added
✅ See: emoji = "👍"
✅ See: commentId = [matching comment]
✅ See: userId = [your user id]
✅ See: createdAt = [timestamp]
```

### Mention Table
```
✅ Find mention you created
✅ See: commentId = [matching comment]
✅ See: mentionedUserId = [the person mentioned]
✅ See: createdAt = [timestamp]
```

---

## FINAL CHECKLIST ✅

Print this and check off:

```
COMMENTS:
  [ ] Create comment
  [ ] Edit comment  
  [ ] See "(edited)" label
  [ ] Delete comment
  [ ] See deleted placeholder

MARKDOWN:
  [ ] Bold text renders bold
  [ ] Italic text renders italic
  [ ] Headings display correctly
  [ ] Lists show bullets
  [ ] Blockquotes indent + gray
  [ ] Code blocks dark background
  [ ] Preview tab works

OPTIMISTIC:
  [ ] Comment appears instantly
  [ ] "Sending..." label shown
  [ ] Server saves after 1-3 seconds
  [ ] Persists after refresh

REACTIONS:
  [ ] Add emoji reaction
  [ ] Reaction count shows
  [ ] Multiple emojis coexist
  [ ] Toggle reaction off
  [ ] Emoji picker opens
  [ ] Search emojis works
  [ ] Hover shows tooltip

MENTIONS:
  [ ] Type @ shows autocomplete
  [ ] Autocomplete filters users
  [ ] Select user inserts name
  [ ] Mention saves to database
  [ ] Mention displays as badge
  [ ] Multiple mentions work
  [ ] Invalid mentions ignored

DATABASE:
  [ ] Comments in Comment table
  [ ] Reactions in CommentReaction table
  [ ] Mentions in Mention table
  [ ] Deleted comments have deletedAt
  [ ] Edited comments have editedAt

ERRORS:
  [ ] Browser console clean
  [ ] No red errors shown
  [ ] No warnings about missing data
```

---

## Issues Found?

If something doesn't work:

1. **Check Console** (Ctrl+Shift+J in browser)
   - Any red errors?
   - Copy and search error in codebase

2. **Check Server Logs** (your npm run dev terminal)
   - Any errors there?
   - Usually shows API errors

3. **Restart Everything**
   ```powershell
   # Kill dev server: Ctrl+C
   # Restart:
   npm run dev
   ```

4. **Check Database**
   ```powershell
   npx prisma studio
   ```
   - Is data actually saved?

5. **Clear Cache**
   - Browser: Ctrl+Shift+Delete
   - Then reload: Ctrl+F5

---

## Success Criteria

Phase 8 is **DONE** when:

✅ All 9 features work as expected
✅ No errors in browser console
✅ Data persists in database
✅ All tests pass
✅ Performance acceptable (<500ms for actions)

---

**Good luck! Report any issues found! 🎉**

Go to: http://localhost:3000 and start testing!
