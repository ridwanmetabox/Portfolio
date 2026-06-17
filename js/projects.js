async function loadProjects() {
  const container = document.getElementById("projects-container");

  if (!container) {
    return;
  }

  const { data: projects, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Unable to load projects:", error);

    container.innerHTML =
      "<p>Unable to load projects at the moment.</p>";

    return;
  }

  if (!projects || projects.length === 0) {
    container.innerHTML = "<p>No projects are available.</p>";
    return;
  }

  container.innerHTML = "";

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";

    const image = document.createElement("img");
    image.src = project.image_url || "images/project-placeholder.png";
    image.alt = project.title;

    const title = document.createElement("h3");
    title.textContent = project.title;

    const description = document.createElement("p");
    description.textContent = project.short_description;

    const technologies = document.createElement("span");
    technologies.textContent = project.technologies;

    card.append(image, title, description, technologies);

    if (project.github_url) {
      const githubLink = document.createElement("a");
      githubLink.href = project.github_url;
      githubLink.target = "_blank";
      githubLink.rel = "noopener noreferrer";
      githubLink.textContent = "View code";
      card.appendChild(githubLink);
    }

    if (project.live_url) {
      const liveLink = document.createElement("a");
      liveLink.href = project.live_url;
      liveLink.target = "_blank";
      liveLink.rel = "noopener noreferrer";
      liveLink.textContent = "View project";
      card.appendChild(liveLink);
    }

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadProjects);