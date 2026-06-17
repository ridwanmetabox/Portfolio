"use strict";

document.addEventListener("DOMContentLoaded", initializeAdmin);

let projectForm;
let projectIdInput;
let titleInput;
let shortDescriptionInput;
let fullDescriptionInput;
let technologiesInput;
let imageUrlInput;
let githubUrlInput;
let liveUrlInput;
let statusInput;
let displayOrderInput;
let formHeading;
let saveButton;
let cancelEditButton;
let logoutButton;
let formMessage;
let projectsContainer;

/**
 * Starts the administration page.
 */
async function initializeAdmin() {
  if (typeof supabaseClient === "undefined") {
    alert(
      "Supabase is not connected. Check supabase-config.js and the script order in admin.html."
    );
    return;
  }

  getPageElements();

  const elementsExist = checkRequiredElements();

  if (!elementsExist) {
    return;
  }

  const isAuthenticated = await requireAuthentication();

  if (!isAuthenticated) {
    return;
  }

  projectForm.addEventListener("submit", saveProject);
  cancelEditButton.addEventListener("click", resetProjectForm);
  logoutButton.addEventListener("click", logoutAdministrator);

  await loadProjects();
}

/**
 * Gets all HTML elements used by this script.
 */
function getPageElements() {
  projectForm = document.getElementById("project-form");
  projectIdInput = document.getElementById("project-id");
  titleInput = document.getElementById("title");
  shortDescriptionInput =
    document.getElementById("short-description");
  fullDescriptionInput =
    document.getElementById("full-description");
  technologiesInput = document.getElementById("technologies");
  imageUrlInput = document.getElementById("image-url");
  githubUrlInput = document.getElementById("github-url");
  liveUrlInput = document.getElementById("live-url");
  statusInput = document.getElementById("status");
  displayOrderInput = document.getElementById("display-order");
  formHeading = document.getElementById("form-heading");
  saveButton = document.getElementById("save-button");
  cancelEditButton =
    document.getElementById("cancel-edit-button");
  logoutButton = document.getElementById("logout-button");
  formMessage = document.getElementById("form-message");
  projectsContainer =
    document.getElementById("admin-projects-container");
}

/**
 * Confirms that admin.html contains the required elements.
 */
function checkRequiredElements() {
  const requiredElements = [
    projectForm,
    projectIdInput,
    titleInput,
    shortDescriptionInput,
    fullDescriptionInput,
    technologiesInput,
    imageUrlInput,
    githubUrlInput,
    liveUrlInput,
    statusInput,
    displayOrderInput,
    formHeading,
    saveButton,
    cancelEditButton,
    logoutButton,
    formMessage,
    projectsContainer
  ];

  const missingElement = requiredElements.some(
    (element) => element === null
  );

  if (missingElement) {
    console.error(
      "One or more required elements are missing from admin.html."
    );

    alert(
      "The administration page is missing an HTML element. Check that the IDs in admin.html match the IDs used in admin.js."
    );

    return false;
  }

  return true;
}

/**
 * Prevents unauthenticated users from opening admin.html.
 */
async function requireAuthentication() {
  try {
    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      window.location.replace("login.html");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Authentication check failed:", error);
    window.location.replace("login.html");
    return false;
  }
}

/**
 * Retrieves every project for the administration page.
 */
async function loadProjects() {
  projectsContainer.innerHTML = "<p>Loading projects...</p>";

  try {
    const { data: projects, error } = await supabaseClient
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    renderProjects(projects || []);
  } catch (error) {
    console.error("Unable to load projects:", error);

    projectsContainer.innerHTML = `
      <p>
        Unable to load projects. Check your Supabase table and
        Row Level Security policies.
      </p>
    `;
  }
}

/**
 * Displays all projects on the administration page.
 */
function renderProjects(projects) {
  projectsContainer.innerHTML = "";

  if (projects.length === 0) {
    projectsContainer.innerHTML = `
      <p>
        No projects have been created yet. Use the form to add
        your first project.
      </p>
    `;

    return;
  }

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "admin-project-card";

    if (project.image_url) {
      const image = document.createElement("img");

      image.src = project.image_url;
      image.alt = project.title;
      image.loading = "lazy";

      image.style.width = "100%";
      image.style.maxHeight = "200px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "10px";
      image.style.marginBottom = "12px";

      image.addEventListener("error", () => {
        image.remove();
      });

      card.appendChild(image);
    }

    const title = document.createElement("h3");
    title.textContent = project.title;

    const description = document.createElement("p");
    description.textContent = project.short_description;

    const technologies = document.createElement("p");

    const technologyText = Array.isArray(project.technologies)
      ? project.technologies.join(" · ")
      : project.technologies || "No technologies specified";

    technologies.textContent = `Technologies: ${technologyText}`;

    const status = document.createElement("p");
    status.textContent = `Status: ${project.status}`;

    const order = document.createElement("p");
    order.textContent =
      `Display order: ${project.display_order ?? 0}`;

    const actions = document.createElement("div");
    actions.className = "admin-project-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      startEditingProject(project);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      deleteProject(project.id, project.title, deleteButton);
    });

    actions.append(editButton, deleteButton);

    card.append(
      title,
      description,
      technologies,
      status,
      order,
      actions
    );

    projectsContainer.appendChild(card);
  });
}

/**
 * Adds a new project or updates an existing project.
 */
async function saveProject(event) {
  event.preventDefault();

  if (!projectForm.checkValidity()) {
    projectForm.reportValidity();
    return;
  }

  const projectId = projectIdInput.value.trim();

  const projectData = {
    title: titleInput.value.trim(),
    short_description: shortDescriptionInput.value.trim(),
    full_description:
      emptyStringToNull(fullDescriptionInput.value),
    technologies: technologiesInput.value.trim(),
    image_url: emptyStringToNull(imageUrlInput.value),
    github_url: emptyStringToNull(githubUrlInput.value),
    live_url: emptyStringToNull(liveUrlInput.value),
    status: statusInput.value,
    display_order:
      Number.parseInt(displayOrderInput.value, 10) || 0
  };

  saveButton.disabled = true;

  setFormMessage(
    projectId ? "Updating project..." : "Adding project...",
    "normal"
  );

  try {
    if (projectId) {
      await updateProject(projectId, projectData);
      setFormMessage("Project updated successfully.", "success");
    } else {
      await createProject(projectData);
      setFormMessage("Project added successfully.", "success");
    }

    resetProjectForm(false);
    await loadProjects();
  } catch (error) {
    console.error("Unable to save project:", error);

    setFormMessage(
      error.message ||
        "Unable to save the project. Check your database policies.",
      "error"
    );
  } finally {
    saveButton.disabled = false;
  }
}

/**
 * Inserts a new project into Supabase.
 */
async function createProject(projectData) {
  const { data, error } = await supabaseClient
    .from("projects")
    .insert(projectData)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates an existing project in Supabase.
 */
async function updateProject(projectId, projectData) {
  const { data, error } = await supabaseClient
    .from("projects")
    .update(projectData)
    .eq("id", projectId)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Places an existing project's information into the form.
 */
function startEditingProject(project) {
  projectIdInput.value = project.id;
  titleInput.value = project.title || "";
  shortDescriptionInput.value =
    project.short_description || "";
  fullDescriptionInput.value =
    project.full_description || "";

  technologiesInput.value = Array.isArray(
    project.technologies
  )
    ? project.technologies.join(", ")
    : project.technologies || "";

  imageUrlInput.value = project.image_url || "";
  githubUrlInput.value = project.github_url || "";
  liveUrlInput.value = project.live_url || "";
  statusInput.value = project.status || "draft";
  displayOrderInput.value = project.display_order ?? 0;

  formHeading.textContent = "Edit Project";
  saveButton.textContent = "Update Project";
  cancelEditButton.hidden = false;

  setFormMessage(
    `You are editing "${project.title}".`,
    "normal"
  );

  document
    .querySelector(".admin-form-section")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
}

/**
 * Deletes a selected project.
 */
async function deleteProject(
  projectId,
  projectTitle,
  deleteButton
) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${projectTitle}"?`
  );

  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  deleteButton.textContent = "Deleting...";

  try {
    const { data, error } = await supabaseClient
      .from("projects")
      .delete()
      .eq("id", projectId)
      .select("id");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(
        "The project could not be deleted. Check your delete policy."
      );
    }

    if (String(projectIdInput.value) === String(projectId)) {
      resetProjectForm();
    }

    setFormMessage(
      `"${projectTitle}" was deleted successfully.`,
      "success"
    );

    await loadProjects();
  } catch (error) {
    console.error("Unable to delete project:", error);

    setFormMessage(
      error.message || "Unable to delete the project.",
      "error"
    );

    deleteButton.disabled = false;
    deleteButton.textContent = "Delete";
  }
}

/**
 * Clears the form and returns it to Add Project mode.
 */
function resetProjectForm(clearMessage = true) {
  projectForm.reset();

  projectIdInput.value = "";
  statusInput.value = "draft";
  displayOrderInput.value = "0";

  formHeading.textContent = "Add Project";
  saveButton.textContent = "Save Project";
  cancelEditButton.hidden = true;

  if (clearMessage) {
    setFormMessage("", "normal");
  }
}

/**
 * Logs the administrator out.
 */
async function logoutAdministrator() {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    const { error } = await supabaseClient.auth.signOut({
      scope: "local"
    });

    if (error) {
      throw error;
    }

    window.location.replace("login.html");
  } catch (error) {
    console.error("Unable to log out:", error);

    alert(
      "Unable to log out. Please refresh the page and try again."
    );

    logoutButton.disabled = false;
    logoutButton.textContent = "Logout";
  }
}

/**
 * Changes an empty form value into null for the database.
 */
function emptyStringToNull(value) {
  const cleanedValue = value.trim();
  return cleanedValue === "" ? null : cleanedValue;
}

/**
 * Displays messages below the project form.
 */
function setFormMessage(message, type) {
  formMessage.textContent = message;

  if (type === "success") {
    formMessage.style.color = "#15803d";
    return;
  }

  if (type === "error") {
    formMessage.style.color = "#dc2626";
    return;
  }

  formMessage.style.color = "#374151";
}