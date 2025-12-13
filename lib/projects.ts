import type { Project } from "@/types/project";
import data from "@/data/projects.json";

export async function getAllProjects(): Promise<Project[]> {
  const { projects } = data as { projects: Project[] };
  return projects;
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const all = await getAllProjects();
  return all.find((p) => p.slug === slug);
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const all = await getAllProjects();
  return all.map((p) => p.slug);
}
