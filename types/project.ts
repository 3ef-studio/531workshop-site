export type ProjectLinks = {
  repo?: string;
  docs?: string;
  live?: string;
  ddenewsletter?: string;
};

export type Project = {
  slug: string;
  name: string;
  summary?: string;
  status: "active" | "paused" | "archived";
  badges?: string[];
  links?: ProjectLinks;
  highlights?: string[];   // short bullets
  details?: string;        // short paragraph
};
