# Accessibility Implementation Guide

**Goal**: WCAG 2.1 Level AA compliance for all UI components.

**Framework**: Next.js + React + Tailwind CSS

---

## 1. Semantic HTML Foundation

### ✅ DO

```typescript
// ✅ Good: Semantic structure
<nav role="navigation">
  <ul role="menubar">
    <li role="none"><a href="/projects">Projects</a></li>
    <li role="none"><a href="/tasks">Tasks</a></li>
  </ul>
</nav>

<main role="main">
  <article>
    <h1>Project Title</h1>
    <p>Description</p>
  </article>
</main>

<footer role="contentinfo">
  © 2026 FlowForge
</footer>
```

### ❌ DON'T

```typescript
// ❌ Bad: Generic divs only
<div>
  <div>
    <div><a href="/projects">Projects</a></div>
    <div><a href="/tasks">Tasks</a></div>
  </div>
</div>
```

---

## 2. Keyboard Navigation

### ✅ DO

```typescript
// ✅ Good: Tab order and focus management
export function TaskCard({ task, onEdit, onDelete }) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <article
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEdit(task.id);
        if (e.key === 'Delete') onDelete(task.id);
      }}
      className={isFocused ? 'ring-2 ring-blue-500' : ''}
    >
      <h3>{task.title}</h3>
      
      <div className="flex gap-2" role="toolbar">
        <button
          onClick={() => onEdit(task.id)}
          aria-label={`Edit task: ${task.title}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task: ${task.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
```

### ❌ DON'T

```typescript
// ❌ Bad: Click-only interaction
<div onClick={() => edit(task.id)}>
  {task.title}
</div>
```

---

## 3. ARIA Labels & Roles

### ✅ DO

```typescript
// ✅ Good: Clear ARIA labels
<button aria-label="Close dialog" onClick={close}>
  ✕
</button>

<input
  type="search"
  placeholder="Search tasks..."
  aria-label="Search tasks in current project"
/>

<div role="alert" aria-live="polite">
  Task created successfully!
</div>

<form aria-labelledby="form-title">
  <h2 id="form-title">Create New Project</h2>
  <label htmlFor="name">Project Name</label>
  <input id="name" type="text" required />
</form>
```

### ❌ DON'T

```typescript
// ❌ Bad: Unlabeled or vague labels
<button onClick={close}>×</button>

<input placeholder="Search" />

<div>Task created!</div> {/* No live region */}

<form>
  <label>Name</label> {/* Not associated with input */}
  <input type="text" />
</form>
```

---

## 4. Color & Contrast

### ✅ DO (WCAG AA - 4.5:1 ratio)

```typescript
// ✅ Good: Sufficient contrast ratios
<p className="text-gray-900"> {/* #111827 on white = 18.8:1 */}
  Primary text
</p>

<p className="text-gray-600"> {/* #4B5563 on white = 7.4:1 */}
  Secondary text
</p>

<button className="bg-blue-600 text-white"> {/* 8.6:1 */}
  Action Button
</button>

<a href="#" className="text-blue-600 underline"> {/* 6.2:1 */}
  Link
</a>
```

### Test Tools
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Axe DevTools browser extension
- Wave browser extension

---

## 5. Form Accessibility

### ✅ DO

```typescript
export function TaskForm({ onSubmit }) {
  const [errors, setErrors] = useState({});
  
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const result = await onSubmit(new FormData(e.target));
        if (result.errors) setErrors(result.errors);
      }}
    >
      {/* Explicit label-input association */}
      <div className="form-group">
        <label htmlFor="title" className="block font-semibold">
          Task Title
          <span aria-label="required field">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" role="alert" className="error-message">
            {errors.title}
          </p>
        )}
      </div>

      {/* Meaningful error summary */}
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="error-summary">
          <h3>Please fix errors:</h3>
          <ul>
            {Object.entries(errors).map(([field, msg]) => (
              <li key={field}>
                <a href={`#${field}`}>{msg}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit">Create Task</button>
    </form>
  );
}
```

### ❌ DON'T

```typescript
// ❌ Bad: Inaccessible form
<input placeholder="Title" /> {/* No label */}
<input placeholder="Due Date" /> {/* No type indicator */}
<button>Submit</button> {/* No feedback on validation */}
```

---

## 6. Focus Management & Navigation

### ✅ DO

```typescript
'use client';

import { useRef, useEffect } from 'react';

export function Modal({ isOpen, onClose, children }) {
  const focusTrapRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first interactive element in modal
    const focusable = focusTrapRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Trap focus within modal
      if (e.key === 'Tab') {
        const first = focusable?.[0];
        const last = focusable?.[focusable.length - 1];
        
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          (last as HTMLElement)?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          (first as HTMLElement)?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus(); // Restore focus
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

---

## 7. Skip Links (Important for Keyboard Users)

### ✅ DO

```typescript
export function Layout({ children }) {
  return (
    <>
      {/* Skip link - hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-2"
      >
        Skip to main content
      </a>

      <nav>Navigation</nav>
      
      <main id="main-content">{children}</main>
    </>
  );
}

// Tailwind utility for sr-only (screen reader only)
// In globals.css or component:
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## 8. Live Regions for Dynamic Content

### ✅ DO

```typescript
export function TaskList({ tasks, isLoading }) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-busy={isLoading}
      aria-label="Tasks"
    >
      {isLoading && <p>Loading tasks...</p>}
      
      {tasks.length === 0 && !isLoading && (
        <p role="status">No tasks found. Create one to get started.</p>
      )}
      
      <ul>
        {tasks.map((task) => (
          <li key={task.id} role="status">
            {task.title} <span aria-label={`Status: ${task.status}`}>
              ({task.status})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 9. Image & Icon Accessibility

### ✅ DO

```typescript
// ✅ Good: Descriptive alt text for images
<img
  src="/project-banner.jpg"
  alt="Team collaborating on project planning board"
/>

// ✅ Good: Icon + visible label
<button>
  <BookmarkIcon aria-hidden="true" />
  Save Project
</button>

// ✅ Good: Icon button with label
<button aria-label="Close notification">
  <XIcon aria-hidden="true" />
</button>

// ✅ Good: Decorative icon can be hidden
<span aria-hidden="true">→</span>
<span className="sr-only">Next page</span>
```

### ❌ DON'T

```typescript
// ❌ Bad: Empty alt text
<img src="/icon.png" alt="" />

// ❌ Bad: Missing icons from a11y tree
<button>
  <SaveIcon />
</button>

// ❌ Bad: "Image of" redunancy
<img src="/badge.png" alt="Image of achievement badge" />
```

---

## 10. Testing for Accessibility

### Automated Testing

```bash
# Install axe-core testing library
npm install --save-dev @axe-core/react axe-playwright

# Add to vitest
npm run test -- --coverage
```

### Manual Testing Checklist

```typescript
// tests/accessibility.manual.test.ts (document, don't automate)

/**
 * Manual Accessibility Testing Checklist (Phase 12 TIER 5)
 * 
 * Test each item with actual assistive technology:
 * 
 * Keyboard Navigation:
 * - [ ] Tab through entire site - logical order
 * - [ ] All buttons/links keyboard accessible
 * - [ ] Focus ring visible on all interactive elements
 * - [ ] Can close all dialogs with Escape
 * - [ ] Can submit forms with Enter key
 * 
 * Screen Reader (NVDA/JAWS/VoiceOver):
 * - [ ] Page structure announced correctly
 * - [ ] Form labels associated with inputs
 * - [ ] Error messages read aloud
 * - [ ] Success messages announced
 * - [ ] All buttons have accessible names
 * - [ ] Links destination clear (not "click here")
 * - [ ] Dynamic content changes announced
 * 
 * Vision & Color:
 * - [ ] All text has 4.5:1 contrast (normal text)
 * - [ ] All UI elements have 3:1 contrast
 * - [ ] Content not relying solely on color
 * - [ ] Magnified 200% still works
 * - [ ] Works in high contrast mode
 * 
 * Cognitive & Motor:
 * - [ ] No time-based content (unless stoppable)
 * - [ ] No flashing (no more than 3x/sec)
 * - [ ] Large click targets (44x44px minimum)
 * - [ ] Consistent navigation
 * - [ ] Clear language
 */
```

### Browser Extensions (Manual)

1. **axe DevTools** (Chrome/Firefox)
   - Free accessibility checker
   - Reports violations and severity
   - Click on violations to see fix suggestions

2. **WAVE** (Chrome/Firefox)
   - WebAIM Accessibility Evaluation Tool
   - Visual indicators of issues
   - Useful for structure review

3. **Lighthouse** (Chrome built-in)
   - Accessibility audit
   - Scores accessibility metrics
   - Run in DevTools → Lighthouse tab

4. **NVDA** (Windows, Free)
   - Most common screen reader
   - Test with keyboard + reader combo
   - Download: https://www.nvaccess.org/

5. **JAWS** (Windows, Paid)
   - Industry-standard screen reader
   - More features than NVDA
   - Free 40-minute test mode

---

## 11. Common Accessibility Issues & Fixes

| Issue | Fix |
|-------|-----|
| ❌ Unlabeled form inputs | ✅ Add `<label htmlFor="id">` or `aria-label` |
| ❌ Buttons without text | ✅ Add `aria-label` to icon buttons |
| ❌ Poor color contrast | ✅ Use contrast checker, aim for 4.5:1 |
| ❌ No keyboard access | ✅ Use semantic HTML, add keyboard handlers |
| ❌ Missing focus indicators | ✅ Add `:focus-visible` styles |
| ❌ Images without alt text | ✅ Write descriptive alt attributes |
| ❌ Dialogs without focus trap | ✅ Manage focus, trap within modal |
| ❌ Ambiguous link text | ✅ Make link purpose clear ("Contact us" not "Click here") |
| ❌ Static alert messages | ✅ Add `role="alert"` and `aria-live="polite"` |
| ❌ No error messages | ✅ Associate errors with `aria-describedby` |

---

## 12. Component-Specific Guidelines

### Buttons

```typescript
// ✅ Good
<button
  onClick={handleClick}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
  aria-label="Save project"
>
  Save
</button>

// ❌ Bad
<div onClick={handleClick} className="cursor-pointer">
  Click
</div>
```

### Forms

```typescript
// ✅ Good
<form>
  <div className="form-group">
    <label htmlFor="email">Email Address</label>
    <input
      id="email"
      type="email"
      required
      aria-required="true"
    />
    <p className="helper-text">We'll never share your email</p>
  </div>
</form>

// ❌ Bad
<form>
  <input placeholder="Email" /> {/* No label */}
</form>
```

### Modals/Dialogs

```typescript
// ✅ Good
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Confirm Delete</h2>
  <p id="dialog-desc">This action cannot be undone.</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

### Lists

```typescript
// ✅ Good - Semantic structure
<ul role="list">
  <li><a href="/tasks">Tasks</a></li>
  <li><a href="/projects">Projects</a></li>
</ul>

// ❌ Bad - Lost list semantics
<div role="list">
  <div role="listitem"><a href="/tasks">Tasks</a></div>
</div>
```

---

## 13. WCAG 2.1 AA Checklist

| Criterion | Level | Status |
|-----------|-------|--------|
| 1.1.1 - Non-text content has alt | A | ✅ Required |
| 1.4.3 - Text contrast 4.5:1 (normal) | AA | ✅ Required |
| 1.4.11 - UI components 3:1 contrast | AA | ✅ Required |
| 2.1.1 - All functionality keyboard accessible | A | ✅ Critical |
| 2.1.2 - No keyboard trap (unless intentional) | A | ✅ Required |
| 2.4.3 - Focus order logical | A | ✅ Required |
| 2.4.7 - Focus visible | AA | ✅ Required |
| 3.2.4 - Consistent navigation | AA | ✅ Required |
| 3.3.3 - Error suggestions | AA | ✅ Required |
| 4.1.2 - Name, role, value for components | A | ✅ Critical |
| 4.1.3 - Status messages announced | AA | ✅ Required |

---

## 14. Timeline & Responsibility (Phase 12 TIER 5)

**Total**: 25 hours

**Phase**:
- Week 1: Automated testing setup (5 hours)
- Week 2: Component audit with axe-core (10 hours)
- Week 3: Manual testing with screen readers (5 hours)
- Week 4: Fixes and verification (5 hours)

**Owner**: QA + Frontend Team

**Deadline**: End of Week 4 (May 8, 2026)

---

**Last Updated**: April 2, 2026  
**Status**: ✅ Accessibility Guide Complete | TIER 5 Framework
