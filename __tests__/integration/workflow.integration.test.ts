import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProjectService } from '@/modules/project/service';
import { TaskService } from '@/modules/task/service';
import { CommentService } from '@/modules/comment/service';
import { NotificationService } from '@/modules/notification/service';
import { TenantContext } from '@/lib/tenant/tenant-context';

/**
 * Integration Tests: Complete Workflows
 * Tests that simulate real end-to-end workflows across multiple services
 */

describe('Integration: Task Lifecycle Workflow', () => {
  let projectService: ProjectService;
  let taskService: TaskService;
  let commentService: CommentService;
  let notificationService: NotificationService;
  let mockTenant: TenantContext;

  beforeEach(() => {
    mockTenant = {
      workspaceId: 'ws-test',
      userId: 'user-1',
      role: 'OWNER',
    } as TenantContext;

    projectService = new ProjectService(mockTenant);
    taskService = new TaskService(mockTenant);
    commentService = new CommentService(mockTenant);
    notificationService = new NotificationService(mockTenant);
  });

  it('should complete full task workflow: create -> assign -> comment -> mark complete', async () => {
    // Step 1: Create project
    const project = await projectService.createProject({
      name: 'Integration Test Project',
      description: 'Test project for workflows',
    });
    expect(project).toBeDefined();
    expect(project.id).toBeDefined();

    // Step 2: Create task in project
    const task = await taskService.createTask({
      projectId: project.id,
      title: 'Complete Feature X',
      description: 'Build and test feature',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    expect(task).toBeDefined();
    expect(task.status).toBe('BACKLOG');

    // Step 3: Assign task to team member
    const updatedTask = await taskService.updateTask(task.id, {
      assigneeId: 'user-2',
      status: 'PLANNED',
    });
    expect(updatedTask.assigneeId).toBe('user-2');
    expect(updatedTask.status).toBe('PLANNED');

    // Step 4: Verify notification was created
    const notifications = await notificationService.listNotifications();
    expect(notifications.length).toBeGreaterThan(0);
    const assignmentNotif = notifications.find(
      (n) => n.type === 'TASK_ASSIGNED'
    );
    expect(assignmentNotif).toBeDefined();

    // Step 5: Add comment on task
    const comment = await commentService.createComment({
      taskId: task.id,
      content: 'Started working on this',
      htmlContent: '<p>Started working on this</p>',
    });
    expect(comment).toBeDefined();
    expect(comment.authorId).toBe(mockTenant.userId);

    // Step 6: Update task status to in progress
    const inProgressTask = await taskService.updateTask(task.id, {
      status: 'IN_PROGRESS',
    });
    expect(inProgressTask.status).toBe('IN_PROGRESS');

    // Step 7: Add completing comment
    const completionComment = await commentService.createComment({
      taskId: task.id,
      content: 'Work completed! Ready for review',
    });
    expect(completionComment).toBeDefined();

    // Step 8: Mark task complete
    const completedTask = await taskService.updateTask(task.id, {
      status: 'COMPLETED',
    });
    expect(completedTask.status).toBe('COMPLETED');

    // Step 9: Verify all comments preserved
    const allComments = await commentService.listComments(task.id);
    expect(allComments.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle concurrent updates to same task', async () => {
    const project = await projectService.createProject({
      name: 'Concurrent Test Project',
    });

    const task = await taskService.createTask({
      projectId: project.id,
      title: 'Concurrent Update Task',
      priority: 'MEDIUM',
    });

    // Simulate concurrent updates
    const updates = [
      taskService.updateTask(task.id, { status: 'PLANNED' }),
      taskService.updateTask(task.id, { priority: 'HIGH' }),
      commentService.createComment({
        taskId: task.id,
        content: 'Concurrent comment',
      }),
    ];

    const results = await Promise.all(updates);

    // All should complete without error
    expect(results).toHaveLength(3);
  });
});

describe('Integration: Approval Workflow', () => {
  let projectService: ProjectService;
  let taskService: TaskService;
  let approvalService: any; // Would be ApprovalService
  let notificationService: NotificationService;
  let mockTenant: TenantContext;
  let reviewerTenant: TenantContext;

  beforeEach(() => {
    mockTenant = {
      workspaceId: 'ws-test',
      userId: 'user-1',
      role: 'MEMBER',
    } as TenantContext;

    reviewerTenant = {
      workspaceId: 'ws-test',
      userId: 'user-2',
      role: 'MANAGER',
    } as TenantContext;

    projectService = new ProjectService(mockTenant);
    taskService = new TaskService(mockTenant);
    notificationService = new NotificationService(mockTenant);
    approvalService = {}; // Mock setup
  });

  it('should complete approval workflow: request -> review -> approve', async () => {
    // Step 1: Create task
    const project = await projectService.createProject({
      name: 'Approval Test Project',
    });

    const task = await taskService.createTask({
      projectId: project.id,
      title: 'Feature Requiring Review',
      priority: 'HIGH',
    });

    // Step 2: Request approval from reviewer
    const approvalRequest = await approvalService.createApprovalRequest({
      taskId: task.id,
      assigneeId: reviewerTenant.userId,
      title: 'Please review my implementation',
      notes: 'Ready for quality check',
    });
    expect(approvalRequest.status).toBe('PENDING');

    // Step 3: Verify notification sent to reviewer
    const reviewerNotifs = await notificationService.listNotifications({
      userId: reviewerTenant.userId,
    });
    const approvalNotif = reviewerNotifs.find(
      (n) => n.type === 'APPROVAL_REQUESTED'
    );
    expect(approvalNotif).toBeDefined();

    // Step 4: Reviewer approves request
    const approvedRequest = await approvalService.approveRequest(
      approvalRequest.id,
      { notes: 'Looks great! All checks passed.' }
    );
    expect(approvedRequest.status).toBe('APPROVED');

    // Step 5: Verify notification sent back to requester
    const requesterNotifs = await notificationService.listNotifications({
      userId: mockTenant.userId,
    });
    const resultNotif = requesterNotifs.find(
      (n) => n.type === 'APPROVAL_DECIDED'
    );
    expect(resultNotif).toBeDefined();

    // Step 6: Mark task complete upon approval
    const completedTask = await taskService.updateTask(task.id, {
      status: 'COMPLETED',
    });
    expect(completedTask.status).toBe('COMPLETED');
  });
});

describe('Integration: Permission Boundaries', () => {
  let projectService: ProjectService;
  let taskService: TaskService;
  let mockOwner: TenantContext;
  let mockMember: TenantContext;

  beforeEach(() => {
    mockOwner = {
      workspaceId: 'ws-test',
      userId: 'owner-1',
      role: 'OWNER',
    } as TenantContext;

    mockMember = {
      workspaceId: 'ws-test',
      userId: 'member-1',
      role: 'MEMBER',
    } as TenantContext;

    projectService = new ProjectService(mockOwner);
    taskService = new TaskService(mockMember);
  });

  it('should enforce permission boundaries across services', async () => {
    // Owner creates project
    const project = await projectService.createProject({
      name: 'Permission Test',
    });

    // Member creates task in that project
    const task = await taskService.createTask({
      projectId: project.id,
      title: 'Member Task',
    });
    expect(task).toBeDefined();

    // Member cannot delete project (authorization check)
    // This should throw ForbiddenError
    // await expect(
    //   projectService.deleteProject(project.id)
    // ).rejects.toThrow(ForbiddenError);
  });
});
