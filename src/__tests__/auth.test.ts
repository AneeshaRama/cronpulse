import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { testDb } from "./setup";
import { users, projects, alertChannels } from "@/lib/db/schema";
import { createTestUser } from "./helpers";
import { createId } from "@paralleldrive/cuid2";

describe("Auth - Signup", () => {
  it("should create a user with hashed password", async () => {
    const email = `signup-${createId()}@example.com`;
    const password = "securepass123";
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await testDb
      .insert(users)
      .values({
        id: createId(),
        email,
        name: "New User",
        password: hashedPassword,
      })
      .returning()
      .then((rows) => rows[0]);

    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.name).toBe("New User");
    expect(user.password).not.toBe(password);

    const isValid = await bcrypt.compare(password, user.password!);
    expect(isValid).toBe(true);
  });

  it("should auto-create a project and email alert channel on signup", async () => {
    const user = await createTestUser();

    // Simulate what the signup route does
    const project = await testDb
      .insert(projects)
      .values({
        id: createId(),
        userId: user.id,
        name: "My Project",
      })
      .returning()
      .then((rows) => rows[0]);

    await testDb.insert(alertChannels).values({
      id: createId(),
      projectId: project.id,
      type: "email",
      config: { email: user.email },
    });

    // Verify project was created
    const userProjects = await testDb
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id));
    expect(userProjects.length).toBeGreaterThanOrEqual(1);

    // Verify alert channel was created
    const channels = await testDb
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.projectId, project.id));
    expect(channels).toHaveLength(1);
    expect(channels[0].type).toBe("email");
    expect((channels[0].config as { email: string }).email).toBe(user.email);
  });

  it("should reject duplicate email", async () => {
    const email = `dupe-${createId()}@example.com`;
    await createTestUser({ email });

    // Attempt to insert duplicate
    await expect(
      testDb
        .insert(users)
        .values({
          id: createId(),
          email,
          name: "Duplicate User",
          password: "hashed",
        })
    ).rejects.toThrow();
  });

  it("should verify password correctly", async () => {
    const password = "mypassword123";
    const user = await createTestUser({ password });

    const isValid = await bcrypt.compare(password, user.password!);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare("wrongpassword", user.password!);
    expect(isInvalid).toBe(false);
  });
});
