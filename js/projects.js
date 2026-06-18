"use strict";

document.addEventListener("DOMContentLoaded", loadProjects);

async function loadProjects() {
  console.log("projects.js loaded.");

  const container = document.getElementById("projects-container");

  if (!container) {
    console.error("The projects-container element was not found.");
    return;
  }

  if (!window.supabaseClient) {
    console.error("The Supabase client was not created.");

    container.innerHTML = `
      <p>Unable to connect to the project database.</p>
    `;

    return;
  }

  container.innerHTML = `
    <p>Loading projects from the database...</p>
  `;

  try {
    const { data: projects, error } =
      await window.supabaseClient
        .from("projects")
        .select("*")
        .eq("status", "published")
        .order("display_order", { ascending: true });

    console.log("Projects returned:", projects);
    console.log("Supabase error:", error);

    if (error) {
      throw error;
    }

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <p>No published projects are currently available.</p>
      `;

      return;
    }

    container.innerHTML = "";

    projects.forEach((project) => {
      const card = document.createElement("article");
      card.className = "project-card";

      const meta = document.createElement("div");
      meta.className = "project-meta";
      meta.textContent = "Portfolio Project";

      const title = document.createElement("h3");
      title.textContent = project.title;

      const description = document.createElement("p");
      description.textContent =
        project.short_description || "";

      const technologies = document.createElement("p");
      technologies.className = "project-tech";

      technologies.textContent =
        Array.isArray(project.technologies)
          ? project.technologies.join(" · ")
          : project.technologies || "";

      card.append(
        meta,
        title,
        description,
        technologies
      );

      if (project.github_url || project.live_url) {
        const links = document.createElement("div");
        links.className = "project-links";

        if (project.github_url) {
          const codeLink = document.createElement("a");

          codeLink.href = project.github_url;
          codeLink.textContent = "View Code";
          codeLink.target = "_blank";
          codeLink.rel = "noopener noreferrer";

          links.appendChild(codeLink);
        }

        if (project.live_url) {
          const liveLink = document.createElement("a");

          liveLink.href = project.live_url;
          liveLink.textContent = "Live Project";
          liveLink.target = "_blank";
          liveLink.rel = "noopener noreferrer";

          links.appendChild(liveLink);
        }

        card.appendChild(links);
      }

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Project loading failed:", error);

    container.innerHTML = `
      <p>
        Unable to load projects: ${error.message}
      </p>
    `;
  }
}