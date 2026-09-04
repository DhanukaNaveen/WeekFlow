import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  transaction: vi.fn(),
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  projectFindFirst: vi.fn(),
  projectFindUnique: vi.fn(),
  reportUpdateMany: vi.fn(),
  txReportFindUnique: vi.fn(),
  versionCount: vi.fn(),
  versionCreate: vi.fn(),
  reviewCreate: vi.fn(),
  activityCreate: vi.fn(),
  childDeleteMany: vi.fn(),
  reportUpdate: vi.fn(),
  assignmentDeleteMany: vi.fn(),
  assignmentCreateMany: vi.fn(),
}));
const askAi = vi.hoisted(() => vi.fn());
vi.mock("../src/config/prisma.js", () => ({
  prisma: {
    report: {
      findUnique: mocks.findUnique,
      findMany: mocks.findMany,
      count: mocks.count,
    },
    user: {
      findUnique: mocks.userFindUnique,
      findMany: mocks.userFindMany,
    },
    project: {
      findFirst: mocks.projectFindFirst,
      findUnique: mocks.projectFindUnique,
    },
    projectAssignment: {
      deleteMany: mocks.assignmentDeleteMany,
      createMany: mocks.assignmentCreateMany,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("../src/services/ai.service.js", () => ({
  askManagerAssistant: askAi,
}));
import { app } from "../src/app.js";
const secret = "test-secret-that-is-long-enough";
const token = (userId: string, role: string) =>
  jwt.sign({ userId, role }, secret);
describe("API authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.userFindUnique.mockImplementation(
      ({ where }: { where: { id: string } }) => ({
        id: where.id,
        role: where.id.includes("admin")
          ? "ADMIN"
          : where.id.includes("manager")
            ? "MANAGER"
            : "TEAM_MEMBER",
        isActive: true,
      }),
    );
  });
  it("prevents a team member from reviewing a report", async () => {
    const response = await request(app)
      .post("/api/reports/report-b/approve")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`)
      .send({});
    expect(response.status).toBe(403);
  });
  it("rejects unauthenticated protected requests", async () => {
    expect((await request(app).get("/api/reports/my")).status).toBe(401);
  });
  it("returns 400 for malformed JSON instead of an internal error", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Malformed JSON request body");
  });
  it("rejects an existing token after its account is deactivated", async () => {
    mocks.userFindUnique.mockResolvedValueOnce({
      id: "member-a",
      role: "TEAM_MEMBER",
      isActive: false,
    });
    const response = await request(app)
      .get("/api/reports/my")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`);
    expect(response.status).toBe(401);
  });
  it("prevents a member from accessing another member report", async () => {
    mocks.findUnique.mockResolvedValue({ id: "report-b", userId: "member-b" });
    const r = await request(app)
      .get("/api/reports/report-b")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`);
    expect(r.status).toBe(403);
  });
  it("allows a manager to access a member report", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "report-b",
      userId: "member-b",
      versions: [],
      reviews: [],
    });
    const r = await request(app)
      .get("/api/reports/report-b")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`);
    expect(r.status).toBe(200);
  });
  it("limits manager user listings to team members", async () => {
    mocks.userFindMany.mockResolvedValue([]);
    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`);
    expect(response.status).toBe(200);
    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "TEAM_MEMBER" } }),
    );
  });
  it("hides non-member profiles from managers", async () => {
    mocks.userFindUnique
      .mockResolvedValueOnce({ id: "manager", role: "MANAGER", isActive: true })
      .mockResolvedValueOnce({
        id: "admin-target",
        name: "Admin",
        email: "admin@example.com",
        role: "ADMIN",
        isActive: true,
      });
    const response = await request(app)
      .get("/api/users/admin-target")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`);
    expect(response.status).toBe(404);
  });
  it("prevents a member from accessing manager report listing", async () => {
    const r = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`);
    expect(r.status).toBe(403);
  });
  it("prevents a member from managing project assignments", async () => {
    const response = await request(app)
      .put("/api/projects/project-a/members")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`)
      .send({ memberIds: ["member-a"] });
    expect(response.status).toBe(403);
  });
  it("allows a manager to replace project assignments", async () => {
    mocks.projectFindUnique
      .mockResolvedValueOnce({ id: "project-a" })
      .mockResolvedValueOnce({ id: "project-a", memberAssignments: [] });
    mocks.userFindMany.mockResolvedValue([{ id: "member-a" }]);
    mocks.transaction.mockResolvedValue([]);
    const response = await request(app)
      .put("/api/projects/project-a/members")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`)
      .send({ memberIds: ["member-a"] });
    expect(response.status).toBe(200);
    expect(mocks.assignmentDeleteMany).toHaveBeenCalled();
    expect(mocks.assignmentCreateMany).toHaveBeenCalled();
  });
  it("rejects report creation for an unassigned project", async () => {
    mocks.projectFindFirst.mockResolvedValue(null);
    const response = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`)
      .send({
        projectId: "project-a",
        weekStartDate: "2026-08-31",
        weekEndDate: "2026-09-06",
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Select an assigned active project");
  });
  it("rejects a non-Monday report week", async () => {
    const response = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`)
      .send({
        projectId: "project-a",
        weekStartDate: "2026-09-01",
        weekEndDate: "2026-09-06",
      });
    expect(response.status).toBe(400);
    expect(mocks.projectFindFirst).not.toHaveBeenCalled();
  });
  it("rejects a week end that is not the following Sunday", async () => {
    const response = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`)
      .send({
        projectId: "project-a",
        weekStartDate: "2026-08-31",
        weekEndDate: "2026-09-05",
      });
    expect(response.status).toBe(400);
  });
  it("allows an unchanged legacy week to complete a correction", async () => {
    const updatedAt = new Date("2026-08-30T00:00:00.000Z");
    mocks.findUnique.mockResolvedValueOnce({
      id: "legacy-report",
      userId: "member-a",
      projectId: "project-a",
      weekStartDate: new Date("2026-08-23T00:00:00.000Z"),
      weekEndDate: new Date("2026-08-29T00:00:00.000Z"),
      status: "NEEDS_CORRECTION",
      updatedAt,
    });
    mocks.reportUpdateMany.mockResolvedValue({ count: 1 });
    mocks.childDeleteMany.mockResolvedValue({ count: 0 });
    mocks.reportUpdate.mockResolvedValue({
      id: "legacy-report",
      status: "NEEDS_CORRECTION",
    });
    mocks.transaction.mockImplementationOnce(async (callback) =>
      callback({
        report: {
          updateMany: mocks.reportUpdateMany,
          update: mocks.reportUpdate,
        },
        reportTask: { deleteMany: mocks.childDeleteMany },
        nextWeekTask: { deleteMany: mocks.childDeleteMany },
        blocker: { deleteMany: mocks.childDeleteMany },
        achievement: { deleteMany: mocks.childDeleteMany },
        workHour: { deleteMany: mocks.childDeleteMany },
      }),
    );
    const response = await request(app)
      .patch("/api/reports/legacy-report")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`)
      .send({
        projectId: "project-a",
        weekStartDate: "2026-08-23",
        weekEndDate: "2026-08-29",
        tasks: [{
          name: "Corrected legacy task",
          priority: "MEDIUM",
          plannedPercentage: 100,
          actualPercentage: 100,
          status: "COMPLETED",
          plannedTime: 8,
          actualTime: 8,
          deliverable: "Done",
        }],
      });
    expect(response.status).toBe(200);
  });
  it("uses the current database role instead of a stale JWT role", async () => {
    const response = await request(app)
      .get("/api/reports")
      .set("Authorization", `Bearer ${token("member-a", "MANAGER")}`);
    expect(response.status).toBe(403);
  });
  it("rejects invalid report filters", async () => {
    const response = await request(app)
      .get("/api/reports?status=INVALID")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`);
    expect(response.status).toBe(400);
  });
  it("accepts empty optional report filters from browser query strings", async () => {
    mocks.transaction.mockResolvedValue([[], 0]);
    const response = await request(app)
      .get(
        "/api/reports?status=&projectId=&userId=&startDate=&endDate=&page=1&limit=10",
      )
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`);
    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(0);
  });
  it("requires a correction comment", async () => {
    const response = await request(app)
      .post("/api/reports/report-b/request-changes")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`)
      .send({ comment: "" });
    expect(response.status).toBe(400);
  });
  it("validates an approval request body", async () => {
    const response = await request(app)
      .post("/api/reports/report-b/approve")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`)
      .send({ comment: { invalid: true } });
    expect(response.status).toBe(400);
  });
  it("rejects an invalid submission status transition", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "r1",
      userId: "member-a",
      status: "APPROVED",
      tasks: [],
      nextWeekTasks: [],
      blockers: [],
      achievements: [],
      workHours: [],
    });
    const r = await request(app)
      .post("/api/reports/r1/submit")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`);
    expect(r.status).toBe(409);
  });
  it("creates the next immutable version on submission and resubmission", async () => {
    const runSubmission = async (
      status: "DRAFT" | "NEEDS_CORRECTION",
      existingVersionCount: number,
    ) => {
      const updatedAt = new Date("2026-09-01T00:00:00.000Z");
      mocks.findUnique.mockResolvedValueOnce({
        id: `report-${existingVersionCount}`,
        userId: "member-a",
        projectId: "project-a",
        weekStartDate: new Date("2026-08-31T00:00:00.000Z"),
        weekEndDate: new Date("2026-09-06T00:00:00.000Z"),
        status,
        updatedAt,
        notes: null,
        links: [],
        tasks: [{ name: "Validated task" }],
        nextWeekTasks: [],
        blockers: [],
        achievements: [],
        workHours: [],
        project: { id: "project-a", name: "QA Project" },
        user: { name: "Member A" },
      });
      mocks.projectFindFirst.mockResolvedValue({ id: "project-a" });
      mocks.reportUpdateMany.mockResolvedValue({ count: 1 });
      mocks.versionCount.mockResolvedValue(existingVersionCount);
      mocks.versionCreate.mockResolvedValue({ id: "version" });
      mocks.activityCreate.mockResolvedValue({ id: "activity" });
      mocks.txReportFindUnique.mockResolvedValue({
        id: `report-${existingVersionCount}`,
        status: "SUBMITTED",
      });
      mocks.transaction.mockImplementationOnce(async (callback) =>
        callback({
          report: {
            updateMany: mocks.reportUpdateMany,
            findUnique: mocks.txReportFindUnique,
          },
          reportVersion: {
            count: mocks.versionCount,
            create: mocks.versionCreate,
          },
          activityLog: { create: mocks.activityCreate },
        }),
      );
      const response = await request(app)
        .post(`/api/reports/report-${existingVersionCount}/submit`)
        .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`);
      expect(response.status).toBe(200);
      expect(mocks.versionCreate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: existingVersionCount + 1,
            snapshot: expect.objectContaining({
              project: { id: "project-a", name: "QA Project" },
            }),
          }),
        }),
      );
    };
    await runSubmission("DRAFT", 0);
    await runSubmission("NEEDS_CORRECTION", 1);
  });
  it("rejects a duplicate concurrent submission claim", async () => {
    mocks.findUnique.mockResolvedValueOnce({
      id: "report-race",
      userId: "member-a",
      projectId: "project-a",
      weekStartDate: new Date("2026-08-31T00:00:00.000Z"),
      weekEndDate: new Date("2026-09-06T00:00:00.000Z"),
      status: "DRAFT",
      updatedAt: new Date("2026-09-01T00:00:00.000Z"),
      notes: null,
      links: [],
      tasks: [{ name: "Validated task" }],
      nextWeekTasks: [],
      blockers: [],
      achievements: [],
      workHours: [],
      user: { name: "Member A" },
    });
    mocks.projectFindFirst.mockResolvedValue({ id: "project-a" });
    mocks.reportUpdateMany.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementationOnce(async (callback) =>
      callback({ report: { updateMany: mocks.reportUpdateMany } }),
    );
    const response = await request(app)
      .post("/api/reports/report-race/submit")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`);
    expect(response.status).toBe(409);
    expect(mocks.versionCreate).not.toHaveBeenCalled();
  });
  it("prevents an admin from changing their own role", async () => {
    const response = await request(app)
      .patch("/api/users/admin-self/role")
      .set("Authorization", `Bearer ${token("admin-self", "ADMIN")}`)
      .send({ role: "TEAM_MEMBER" });
    expect(response.status).toBe(400);
  });
  it("prevents a team member from using the manager AI assistant", async () => {
    const response = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token("member-a", "TEAM_MEMBER")}`)
      .send({ message: "Summarize team blockers" });
    expect(response.status).toBe(403);
    expect(askAi).not.toHaveBeenCalled();
  });
  it("allows a manager to use the AI assistant", async () => {
    askAi.mockResolvedValue({
      answer: "No open blockers.",
      reportCount: 4,
      model: "test-model",
    });
    const response = await request(app)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${token("manager", "MANAGER")}`)
      .send({ message: "Summarize team blockers" });
    expect(response.status).toBe(200);
    expect(response.body.answer).toBe("No open blockers.");
  });
});
