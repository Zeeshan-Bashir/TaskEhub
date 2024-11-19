// DOM Elements
const taskList = document.getElementById("taskList");
const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const addTaskBtn = document.getElementById("addTaskBtn");
const filterButtons = document.querySelectorAll(".btn-filter");
const notificationArea = document.getElementById("notificationArea");
const darkModeToggle = document.getElementById("darkModeToggle");
const body = document.body;
const searchInput = document.getElementById("searchTask");
const logoutBtn = document.getElementById("logoutBtn");

// Task array to store all tasks
let tasks = [];

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  console.log(logoutBtn);
  
  const tkn = localStorage.getItem("authToken");
  if (!tkn) {
    window.location.href = "./login.html";
  }
  await fetchTasks();
  addTaskBtn.addEventListener("click", addTask);

  filterButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      filterTasks(event.target.dataset.filter);
    });
  });

  darkModeToggle.addEventListener("click", toggleDarkMode);
  searchInput.addEventListener("input", searchTasks);

  updateStats();
});

// Function to toggle dark mode
function toggleDarkMode() {
  body.classList.toggle("dark-mode");
  const isDarkMode = body.classList.contains("dark-mode");
  darkModeToggle.innerHTML = isDarkMode
    ? '<i class="fas fa-sun"></i>'
    : '<i class="fas fa-moon"></i>';
  localStorage.setItem("darkMode", isDarkMode);
}

// Check for user's dark mode preference on load
if (localStorage.getItem("darkMode") === "true") {
  body.classList.add("dark-mode");
  darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Fetch tasks from the backend


async function fetchTasks() {
  try {
    // Retrieve the token from localStorage
    const tkn = localStorage.getItem("authToken");
    if (!tkn) {
      console.error("No authentication token found.");
      return;
    }

    // Fetch tasks using a GET request
    const response = await fetch("http://localhost:5000/tasks", {
      method: "GET", // Correct method for fetching tasks
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tkn}`, // Include the token in Authorization header
      },
    });

    // Check if the response is okay
    if (!response.ok) {
      console.error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      return;
    }

    // Parse and store the tasks
    tasks = await response.json();
    renderTasks(); // Render tasks on the frontend
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
  }
}










// Function to add a new task
async function addTask() {
  const taskName = document.getElementById("taskName").value;
  const taskDate = document.getElementById("taskDate").value;
  const taskCategory = document.getElementById("taskCategory").value;
  const taskTime = document.getElementById("taskTime").value;
  const taskPriority = document.getElementById("taskPriority").value;
  const taskDescription = document.getElementById("taskDescription").value;
  const taskColor = document.getElementById("taskColor").value;

  if (taskName === "" || taskDate === "" || taskCategory === "" || taskTime === "" || taskPriority === "") {
    showNotification("Please fill out all required fields.", "error");
    return;
  }

  const task = {
    name: taskName,
    date: taskDate,
    category: taskCategory,
    time: taskTime,
    priority: taskPriority,
    description: taskDescription,
    color: taskColor,
    completed: false,
  };

  try {

    const tkn = localStorage.getItem("authToken");


    const response = await fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tkn}`, // Include token if required
      },
      body: JSON.stringify(task),
    });

    const newTask = await response.json();
    tasks.push(newTask);
    renderTasks();
    updateStats();
    resetForm();
    showNotification("Task added successfully!", "success");
  } catch (error) {
    console.error("Failed to add task:", error);
  }
}

// Function to render tasks
function renderTasks() {
  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const taskItem = document.createElement("div");
    taskItem.classList.add("task-item");
    if (task.completed) {
      taskItem.classList.add("completed");
    }
    taskItem.dataset.category = task.category;
    taskItem.dataset.id = task._id;

    const rgb = hexToRgb(task.color);
    taskItem.style.setProperty("--task-color", task.color);
    taskItem.style.setProperty("--task-color-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    const truncatedDescription = truncateText(task.description, 40);
    const showMoreButton = task.description.length > 40 ? `<span class="btn-more">more</span>` : "";

    taskItem.innerHTML = `
      <h3>${task.name}</h3>
      <div class="task-meta">
        <span class="task-category">${task.category}</span>
        <span class="task-priority">${task.priority}</span>
      </div>
      <p><i class="far fa-calendar"></i> ${task.date}</p>
      <p><i class="far fa-clock"></i> ${task.time}</p>
      <p class="task-description">${truncatedDescription} ${showMoreButton}</p>
      <div class="task-actions">
        <button class="btn-complete">
          <i class="fas fa-check"></i> ${task.completed ? "Undo" : "Complete"}
        </button>
        <button class="btn-delete">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;

    const completeBtn = taskItem.querySelector(".btn-complete");
    completeBtn.addEventListener("click", () => toggleComplete(task._id));

    const deleteBtn = taskItem.querySelector(".btn-delete");
    deleteBtn.addEventListener("click", () => deleteTask(task._id));

    const moreBtn = taskItem.querySelector(".btn-more");
    if (moreBtn) {
      moreBtn.addEventListener("click", () => toggleTaskDetails(task._id));
    }

    taskList.appendChild(taskItem);
  });
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function truncateText(text, maxLength) {
  return text.length <= maxLength ? text : text.substr(0, maxLength) + "...";
}

async function toggleComplete(id) {
  const task = tasks.find((t) => t._id === id);
  if (task) {
    task.completed = !task.completed;
    try {
      await fetch(`http://localhost:5000/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: task.completed }),
      });
      renderTasks();
      updateStats();
      showNotification(`Task marked as ${task.completed ? "completed" : "incomplete"}.`, "info");
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }
}

async function deleteTask(id) {
  try {
    await fetch(`http://localhost:5000/tasks/${id}`, { method: "DELETE" });
    tasks = tasks.filter((t) => t._id !== id);
    renderTasks();
    updateStats();
    showNotification("Task deleted successfully.", "info");
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
}

// Function to filter tasks
function filterTasks(category) {
  filterButtons.forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  const taskItems = taskList.querySelectorAll(".task-item");
  taskItems.forEach((item) => {
    if (category === "All" || item.dataset.category === category) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

// Function to search tasks
function searchTasks() {
  const searchTerm = searchInput.value.toLowerCase();
  const taskItems = taskList.querySelectorAll(".task-item");
  taskItems.forEach((item) => {
    const taskName = item.querySelector("h3").textContent.toLowerCase();
    if (taskName.includes(searchTerm)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

function updateStats() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  totalTasksElement.textContent = `Total Tasks: ${totalTasks}`;
  completedTasksElement.textContent = `Completed Tasks: ${completedTasks}`;
}

function resetForm() {
  document.getElementById("taskName").value = "";
  document.getElementById("taskDate").value = "";
  document.getElementById("taskCategory").value = "";
  document.getElementById("taskTime").value = "";
  document.getElementById("taskPriority").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskColor").value = "#000000";
}

// Show notification function
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <i class="fas ${
          type === "success"
            ? "fa-check-circle"
            : type === "error"
            ? "fa-exclamation-circle"
            : "fa-info-circle"
        }"></i>
        <span>${message}</span>
    `;
  notificationArea.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notificationArea.removeChild(notification);
      }, 300);
    }, 3000);
  }, 100);
}

// Function to toggle task details
function toggleTaskDetails(id) {
  const task = tasks.find((t) => t._id === id);
  if (!task) return;

  const modal = document.createElement("div");
  modal.className = "task-modal";
  modal.innerHTML = `
        <div class="task-modal-content">
            <h2>${task.name}</h2>
            <div class="task-modal-body">
                <p><strong>Date:</strong> ${task.date}</p>
                <p><strong>Time:</strong> ${task.time}</p>
                <p><strong>Category:</strong> ${task.category}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Description:</strong></p>
                <p class="task-description">${task.description}</p>
            </div>
            <button class="btn-close-modal">Close</button>
        </div>
    `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".btn-close-modal");
  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}



// Footer Indicator
const li = document.querySelectorAll(".list");
const indicator = document.querySelector(".indicator");

function activeLink() {
  li.forEach((item) => {
    item.classList.remove("active");
  });
  this.classList.add("active");

  // Move the indicator to the correct position
  const index = Array.from(li).indexOf(this);
  indicator.style.transform = `translateX(${index * 50}px)`;
}

li.forEach((item) => item.addEventListener("mouseover", activeLink));

//Logout-btn functions
async function logout() {
  // Clear the token from localStorage
  localStorage.removeItem("authToken");

  // Optionally, you can clear other user-related data
  // localStorage.removeItem("userDetails");

  // Redirect to the login page or homepage
  window.location.href = "./login.html";

  // Optional: Show a logout confirmation message
  console.log("Logged out successfully.");
}
