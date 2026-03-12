import { Suspense } from "react";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const user = session.user;

  const userProjects = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.userId, user.id!));

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/signin" });
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", position: "fixed", top: 0, left: 0 }}>
      <Suspense>
        <Sidebar
          user={{ name: user.name, email: user.email, image: user.image }}
          projects={userProjects}
          signOutAction={handleSignOut}
        />
      </Suspense>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
