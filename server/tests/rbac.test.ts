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
        role: where.id.includes("manager") ? "MANAGER" : "TEAM_MEMBER",
        isActive: true,
      }),
    );
  });
  it("rejects unauthenticated protected requests", async () => {
    expect((await request(app).get("/api/reports/my")).status).toBe(401);
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
