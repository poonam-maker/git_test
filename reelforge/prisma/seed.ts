import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Seeds a demo account so you can log in and see a fully-populated workspace.
//   email:    demo@reelforge.app
//   password: password123

const prisma = new PrismaClient();

async function main() {
  const email = "demo@reelforge.app";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo Creator", passwordHash, onboarded: true },
  });

  let workspace = await prisma.workspace.findFirst({
    where: { memberships: { some: { userId: user.id } } },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Demo Studio",
        slug: `demo-${Math.random().toString(36).slice(2, 7)}`,
        planTier: "CREATOR_PRO",
        memberships: { create: { userId: user.id, role: "OWNER" } },
        brandKits: {
          create: {
            name: "Demo Brand",
            isDefault: true,
            primaryColor: "#4f46e5",
            accentColor: "#f97316",
            toneOfVoice: "energetic",
            ctaTemplates: ["Follow for more", "Save this", "Link in bio"],
          },
        },
      },
    });
  }

  const brandKit = await prisma.brandKit.findFirst({
    where: { workspaceId: workspace.id, isDefault: true },
  });

  // A ready-made sample project with clips, captions, and social copy.
  const existing = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, title: "Sample: How to grow on TikTok" },
  });

  if (!existing) {
    const project = await prisma.project.create({
      data: {
        title: "Sample: How to grow on TikTok",
        status: "READY",
        templateKey: "talking-head",
        workspaceId: workspace.id,
        createdById: user.id,
        brandKitId: brandKit?.id ?? null,
      },
    });

    const clips = [
      { title: "The one habit that grows your account…", start: 0, end: 32, score: 0.92 },
      { title: "Why consistency beats perfection…", start: 40, end: 75, score: 0.81 },
      { title: "Turn one video into a week of content…", start: 90, end: 128, score: 0.88 },
    ];

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const clip = await prisma.clip.create({
        data: {
          projectId: project.id,
          title: c.title,
          startSec: c.start,
          endSec: c.end,
          score: c.score,
          order: i,
          captions: {
            create: [
              { startSec: c.start, endSec: c.start + 3, text: "Here's the one thing nobody tells you.", order: 0 },
              { startSec: c.start + 3, endSec: c.start + 6, text: "Consistency beats perfection every time.", order: 1 },
            ],
          },
          socialPost: {
            create: {
              title: c.title,
              hook: "Stop scrolling — you need to hear this 👇",
              description: "The habit that actually grows your account. Follow for more.",
              hashtags: ["#contentcreator", "#tiktoktips", "#growthtips", "#reels", "#smallbusiness"],
              cta: "Follow for more",
            },
          },
        },
      });

      await prisma.analyticsEvent.create({
        data: { workspaceId: workspace.id, type: "CLIP_CREATED", metadata: { clipId: clip.id } },
      });
    }

    await prisma.analyticsEvent.createMany({
      data: [
        { workspaceId: workspace.id, type: "PROJECT_CREATED", metadata: { templateKey: "talking-head" } },
        { workspaceId: workspace.id, type: "TEMPLATE_USED", metadata: { templateKey: "talking-head" } },
        { workspaceId: workspace.id, type: "PROCESSING_COMPLETED", metadata: { clips: clips.length } },
      ],
    });
  }

  console.log("✅ Seeded demo account:");
  console.log("   email:    demo@reelforge.app");
  console.log("   password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
