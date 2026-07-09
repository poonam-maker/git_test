import { createProject } from "@/server/actions";
import { TEMPLATE_LIST } from "@/lib/templates";
import { TemplatePicker } from "@/components/template-picker";

// Server component form. The template picker is a small client island so the
// selected radio is visually highlighted; submission uses the server action.

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold text-white">New project</h1>
      <p className="mt-1 text-sm text-ink-400">
        Name it and pick a template. You&apos;ll upload your video next.
      </p>

      <form action={createProject} className="mt-8 space-y-6">
        <div>
          <label className="label" htmlFor="title">Project title</label>
          <input
            id="title"
            name="title"
            className="input"
            placeholder="e.g. March podcast episode"
            required
          />
        </div>

        <div>
          <span className="label">Choose a template</span>
          <TemplatePicker templates={TEMPLATE_LIST} />
        </div>

        <button type="submit" className="btn-primary w-full py-3">
          Create project
        </button>
      </form>
    </div>
  );
}
