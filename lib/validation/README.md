# Validation & Server Actions Guide

This guide explains how to use ActionResult types and validation helpers in FlowForge.

---

## Quick Start

### 1. Import the utilities

```typescript
import { parseFormData } from '@/lib/validation/parse';
import { successResult, errorResult, ActionResult } from '@/types/action-result';
import { z } from 'zod';
```

### 2. Define your validation schema

```typescript
const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});
```

### 3. Create a server action

```typescript
'use server';

export async function createProject(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Project>> {
  // Validate
  const result = parseFormData(createProjectSchema, formData);
  if (!result.success) return result;

  // Create
  const project = await db.project.create({
    data: { ...result.data, workspaceId }
  });

  // Return
  return successResult(project, 'Created!');
}
```

---

## ActionResult Type

### Structure

```typescript
type ActionResult<T = void> =
  | { success: true; message?: string; data?: T }
  | { success: false; message?: string; formError?: string; fieldErrors?: Record<string, string[]> };
```

### Helper Functions

#### `successResult(data?, message?)`
```typescript
return successResult({ id: '123', name: 'Project' }, 'Project created!');
// { success: true, data: {...}, message: 'Project created!' }
```

#### `errorResult(message)`
```typescript
return errorResult('Something went wrong');
// { success: false, message: 'Something went wrong' }
```

#### `fieldErrorsResult(fieldErrors, message?)`
```typescript
return fieldErrorsResult({
  name: ['Name is required'],
  email: ['Invalid email format']
}, 'Validation failed');
```

#### `formErrorResult(formError)`
```typescript
return formErrorResult('Project already exists');
// { success: false, formError: 'Project already exists' }
```

---

## Validation Helpers

### `parseFormData(schema, data)`

Validates data and returns ActionResult with field errors.

```typescript
const result = parseFormData(createProjectSchema, formData);

if (!result.success) {
  // result.fieldErrors = { name: ['Name is required'], ... }
  return result;
}

// result.data is now fully typed and validated
const project = await db.project.create({ data: result.data });
```

### `safeParse(schema, data)`

Lower-level helper that returns ParseResult (not ActionResult).

```typescript
const parseResult = safeParse(schema, data);

if (parseResult.success) {
  console.log(parseResult.data); // Typed data
} else {
  console.log(parseResult.fieldErrors); // Validation errors
}
```

### `parseFormDataAsync(schema, data)`

For schemas with async refinements (e.g., database checks).

```typescript
const schema = z.object({
  email: z.string().email().refine(async (email) => {
    const exists = await db.user.findUnique({ where: { email } });
    return !exists;
  }, 'Email already taken'),
});

const result = await parseFormDataAsync(schema, formData);
if (!result.success) return result;
```

---

## Complete Example

### Server Action

```typescript
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { parseFormData } from '@/lib/validation/parse';
import { successResult, errorResult, ActionResult } from '@/types/action-result';

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional(),
});

export async function createTask(
  workspaceId: string,
  projectId: string,
  formData: FormData
): Promise<ActionResult<{ id: string; title: string }>> {
  try {
    // 1. Validate input
    const result = parseFormData(createTaskSchema, {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority'),
      assigneeId: formData.get('assigneeId'),
    });

    if (!result.success) return result;

    // 2. Verify project belongs to workspace
    const project = await db.project.findUnique({
      where: { id: projectId, workspaceId },
    });

    if (!project) {
      return errorResult('Project not found');
    }

    // 3. Create task
    const task = await db.task.create({
      data: {
        ...result.data,
        workspaceId,
        projectId,
        status: 'TODO',
      },
      select: { id: true, title: true },
    });

    // 4. Success response
    return successResult(task, 'Task created successfully');
    
  } catch (error) {
    console.error('Failed to create task:', error);
    return errorResult('Failed to create task');
  }
}
```

### Client Component

```typescript
'use client';

import { createTask } from './actions';
import { useState } from 'react';

export function CreateTaskForm({ 
  workspaceId, 
  projectId 
}: { 
  workspaceId: string; 
  projectId: string; 
}) {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    
    const result = await createTask(workspaceId, projectId, formData);

    if (result.success) {
      setMessage(result.message || 'Task created!');
      setErrors({});
      // Reset form or redirect
    } else {
      setErrors(result.fieldErrors || {});
      setMessage(result.formError || result.message || 'Failed');
    }
    
    setLoading(false);
  }

  return (
    <form action={handleSubmit}>
      <div>
        <label>Title</label>
        <input name="title" disabled={loading} />
        {errors.title && <p className="error">{errors.title[0]}</p>}
      </div>

      <div>
        <label>Description</label>
        <textarea name="description" disabled={loading} />
        {errors.description && <p className="error">{errors.description[0]}</p>}
      </div>

      <div>
        <label>Priority</label>
        <select name="priority" disabled={loading}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        {errors.priority && <p className="error">{errors.priority[0]}</p>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Task'}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
```

---

## Best Practices

### ✅ DO

1. **Always validate user input**
   ```typescript
   const result = parseFormData(schema, formData);
   if (!result.success) return result;
   ```

2. **Include workspace context**
   ```typescript
   export async function createProject(workspaceId: string, formData: FormData)
   ```

3. **Return ActionResult**
   ```typescript
   return successResult(data, 'Success!');
   ```

4. **Handle errors gracefully**
   ```typescript
   try {
     // ...
   } catch (error) {
     console.error(error);
     return errorResult('User-friendly message');
   }
   ```

### ❌ DON'T

1. **Don't skip validation**
   ```typescript
   // ❌ BAD
   const name = formData.get('name') as string;
   await db.project.create({ data: { name } });
   ```

2. **Don't forget tenant isolation**
   ```typescript
   // ❌ BAD
   await db.project.findUnique({ where: { id: projectId } });
   
   // ✅ GOOD
   await db.project.findUnique({ 
     where: { id: projectId, workspaceId } 
   });
   ```

3. **Don't expose raw errors**
   ```typescript
   // ❌ BAD
   return errorResult(error.message);
   
   // ✅ GOOD
   console.error(error);
   return errorResult('Something went wrong');
   ```

---

## References

- [Zod Documentation](https://zod.dev/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Architecture Docs](../docs/architecture.md)
- [Example Actions](./example-actions.ts)
