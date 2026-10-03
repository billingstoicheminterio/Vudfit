import { Project, Task, CRMDeal } from "./types";
import { formatCurrency } from "./utils";

export async function generateDepartmentReviewPPT({
  projects,
  tasks,
  deals,
  brandName,
  user,
}: {
  projects: Project[];
  tasks: Task[];
  deals: CRMDeal[];
  brandName: string;
  user: string;
}) {
  // @ts-ignore
  const pptxgenModule = await import("pptxgenjs");
  const pptxgen = pptxgenModule.default || pptxgenModule;
  const pptx = new pptxgen();

  // Define Layout
  pptx.layout = "LAYOUT_16x9";
  pptx.author = user;
  pptx.company = brandName;
  pptx.title = `${brandName} All-Department Review Presentation`;

  // Color Palette
  const COLOR_DARK = "0F172A";
  const COLOR_GOLD = "F59E0B";
  const COLOR_WHITE = "FFFFFF";
  const COLOR_BLUE = "2563EB";
  const COLOR_SLATE = "475569";
  const COLOR_LIGHT_BG = "F8FAFC";

  // --------------------------------------------------------------------------
  // SLIDE 1: Title Slide (Executive Dark Theme)
  // --------------------------------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: COLOR_DARK };

  // Decorative Accent bar
  slide1.addShape("rect", {
    x: 0.8,
    y: 1.2,
    w: 0.15,
    h: 4.2,
    fill: { color: COLOR_GOLD },
  });

  slide1.addText(brandName.toUpperCase(), {
    x: 1.2,
    y: 1.4,
    fontSize: 40,
    bold: true,
    color: COLOR_GOLD,
    fontFace: "Arial",
  });

  slide1.addText("All-Department Performance & Operations Review", {
    x: 1.2,
    y: 2.3,
    fontSize: 28,
    bold: true,
    color: COLOR_WHITE,
    fontFace: "Arial",
  });

  slide1.addText("Executive Project Progress, Task Ratios, CRM Pipeline & Site Operations", {
    x: 1.2,
    y: 3.2,
    fontSize: 16,
    color: "CBD5E1",
    fontFace: "Arial",
  });

  slide1.addText(`Review Date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}  |  Presenter: ${user}`, {
    x: 1.2,
    y: 4.5,
    fontSize: 13,
    color: "94A3B8",
    fontFace: "Arial",
  });

  // --------------------------------------------------------------------------
  // SLIDE 2: Executive Summary & Overall KPIs
  // --------------------------------------------------------------------------
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_LIGHT_BG };

  slide2.addText("1. Executive Summary — All Departments Overview", {
    x: 0.6,
    y: 0.5,
    fontSize: 22,
    bold: true,
    color: COLOR_DARK,
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "closed").length;
  const taskCompletionRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalPipelineVal = deals.reduce((acc, d) => acc + (d.value || 0), 0);

  // KPI Card 1: Total Projects
  slide2.addShape("rect", { x: 0.6, y: 1.4, w: 2.8, h: 1.8, fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 } });
  slide2.addText("Active Departments", { x: 0.8, y: 1.6, fontSize: 12, color: COLOR_SLATE });
  slide2.addText(`${projects.length}`, { x: 0.8, y: 2.2, fontSize: 36, bold: true, color: COLOR_BLUE });

  // KPI Card 2: Total Tasks & Ratio
  slide2.addShape("rect", { x: 3.6, y: 1.4, w: 2.8, h: 1.8, fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 } });
  slide2.addText("Work Completion Ratio", { x: 3.8, y: 1.6, fontSize: 12, color: COLOR_SLATE });
  slide2.addText(`${taskCompletionRatio}%`, { x: 3.8, y: 2.2, fontSize: 36, bold: true, color: "10B981" });
  slide2.addText(`${completedTasks} of ${totalTasks} tasks completed`, { x: 3.8, y: 2.8, fontSize: 10, color: COLOR_SLATE });

  // KPI Card 3: CRM Value
  slide2.addShape("rect", { x: 6.6, y: 1.4, w: 2.8, h: 1.8, fill: { color: "FFFFFF" }, line: { color: "E2E8F0", width: 1 } });
  slide2.addText("Total CRM Pipeline", { x: 6.8, y: 1.6, fontSize: 12, color: COLOR_SLATE });
  slide2.addText(formatCurrency(totalPipelineVal), { x: 6.8, y: 2.2, fontSize: 24, bold: true, color: COLOR_GOLD });

  // Summary Table of Departments
  const deptTableRows: any[] = [
    [
      { text: "Department Name", options: { bold: true, fill: { color: COLOR_DARK }, color: COLOR_WHITE } },
      { text: "Active Tasks", options: { bold: true, fill: { color: COLOR_DARK }, color: COLOR_WHITE } },
      { text: "Completed", options: { bold: true, fill: { color: COLOR_DARK }, color: COLOR_WHITE } },
      { text: "Work Ratio", options: { bold: true, fill: { color: COLOR_DARK }, color: COLOR_WHITE } },
    ],
  ];

  projects.forEach((proj) => {
    const projTasks = tasks.filter((t) => t.projectId === proj.id);
    const done = projTasks.filter((t) => t.status === "done" || t.status === "closed").length;
    const ratio = projTasks.length > 0 ? `${Math.round((done / projTasks.length) * 100)}%` : "0%";

    deptTableRows.push([
      { text: proj.name },
      { text: `${projTasks.length}` },
      { text: `${done}` },
      { text: ratio },
    ]);
  });

  slide2.addTable(deptTableRows, {
    x: 0.6,
    y: 3.6,
    w: 8.8,
    colW: [3.2, 1.8, 1.8, 2.0],
    border: { pt: 1, color: "CBD5E1" },
    fontSize: 11,
  });

  // --------------------------------------------------------------------------
  // SLIDES 3+: Individual Department Deep-Dive Slides
  // --------------------------------------------------------------------------
  projects.forEach((dept, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: COLOR_WHITE };

    // Slide Header
    slide.addText(`${index + 2}. Department Review: ${dept.name}`, {
      x: 0.6,
      y: 0.5,
      fontSize: 20,
      bold: true,
      color: COLOR_DARK,
    });

    const deptTasks = tasks.filter((t) => t.projectId === dept.id);
    const doneCount = deptTasks.filter((t) => t.status === "done" || t.status === "closed").length;
    const pendingCount = deptTasks.length - doneCount;

    // Overview Stats
    slide.addText(`Total Tasks: ${deptTasks.length}  |  Completed: ${doneCount}  |  Pending: ${pendingCount}`, {
      x: 0.6,
      y: 1.1,
      fontSize: 13,
      color: COLOR_SLATE,
    });

    // Task List Table for this Department
    const taskRows: any[] = [
      [
        { text: "Task Title", options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } },
        { text: "Status", options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } },
        { text: "Priority", options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } },
        { text: "Attachments", options: { bold: true, fill: { color: "1E293B" }, color: "FFFFFF" } },
      ],
    ];

    if (deptTasks.length === 0) {
      taskRows.push([
        { text: "No active tasks recorded for this department." },
        { text: "—" },
        { text: "—" },
        { text: "—" },
      ]);
    } else {
      deptTasks.slice(0, 5).forEach((t) => {
        const attCount = (t.attachments || []).length;
        taskRows.push([
          { text: t.title },
          { text: t.status.replace("_", " ").toUpperCase() },
          { text: t.priority.toUpperCase() },
          { text: `${attCount} File(s)` },
        ]);
      });
    }

    slide.addTable(taskRows, {
      x: 0.6,
      y: 1.6,
      w: 8.8,
      colW: [4.2, 1.6, 1.4, 1.6],
      border: { pt: 1, color: "E2E8F0" },
      fontSize: 10,
    });

    // Department Key Milestones & Notes Box
    slide.addShape("rect", {
      x: 0.6,
      y: 4.2,
      w: 8.8,
      h: 1.2,
      fill: { color: "F1F5F9" },
      line: { color: "CBD5E1", width: 1 },
    });

    slide.addText("Department Status & Next Action Items:", {
      x: 0.8,
      y: 4.35,
      fontSize: 11,
      bold: true,
      color: COLOR_DARK,
    });

    slide.addText(
      `• Site measurement maps & 2D/3D renders verified for active clients.\n• Team Leader review scheduled for weekly progress sign-off.`,
      {
        x: 0.8,
        y: 4.65,
        fontSize: 10,
        color: COLOR_SLATE,
      }
    );
  });

  // --------------------------------------------------------------------------
  // FINAL SLIDE: Conclusion & Action Items
  // --------------------------------------------------------------------------
  const finalSlide = pptx.addSlide();
  finalSlide.background = { color: COLOR_DARK };

  finalSlide.addText("Action Plan & Executive Next Steps", {
    x: 0.8,
    y: 1.2,
    fontSize: 26,
    bold: true,
    color: COLOR_GOLD,
  });

  const actionPoints = [
    "1. Review pending 2D design layouts & 3D renders for immediate client sign-off.",
    "2. Accelerated CNC cutting & material procurement for high-priority production tasks.",
    "3. On-site installation quality check for completed kitchen & wardrobe projects.",
    "4. Next weekly all-department sync scheduled with Directors and Team Leaders.",
  ];

  actionPoints.forEach((point, index) => {
    finalSlide.addText(point, {
      x: 0.8,
      y: 2.2 + index * 0.7,
      fontSize: 15,
      color: COLOR_WHITE,
    });
  });

  // Write PPT File
  const filename = `${brandName.replace(/\s+/g, "_")}_All_Department_Review_${Date.now()}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
