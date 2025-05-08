// Authentication State
const authState = {
  isAuthenticated: false,
  currentUser: null
};

// Game State
const state = {
  level: 1,
  xp: 0,
  coins: 50,
  streak: 0,
  longestStreak: 0,
  lastActive: new Date().toDateString(),
  tasks: [],
  inventory: [],
  decorations: [],
  completedDates: []
};

// Shop Items
const shopItems = [
  { id: 1, name: 'Desk Plant', price: 30, emoji: '🌱' },
  { id: 2, name: 'Pixel Lamp', price: 40, emoji: '💡' },
  { id: 3, name: 'Notebook', price: 25, emoji: '📓' },
  { id: 4, name: 'Coffee Mug', price: 35, emoji: '☕' },
  { id: 5, name: 'Rainbow', price: 50, emoji: '🌈' },
  { id: 6, name: 'Cat', price: 60, emoji: '🐱' }
];

// DOM Elements
const views = {
  tasks: document.getElementById('tasks-view'),
  calendar: document.getElementById('calendar-view'),
  shop: document.getElementById('shop-view'),
  decoration: document.getElementById('decoration-view')
};
const menuButtons = document.querySelectorAll('.menu-btn');
const taskList = document.getElementById('task-list');
const newTaskInput = document.getElementById('new-task');
const taskDifficulty = document.getElementById('task-difficulty');
const taskDueDate = document.getElementById('task-due-date');
const taskDueTime = document.getElementById('task-due-time');
const addTaskButton = document.getElementById('add-task');
const xpBar = document.getElementById('xp-bar');
const levelDisplay = document.getElementById('level');
const xpDisplay = document.getElementById('xp');
const nextLevelDisplay = document.getElementById('next-level');
const coinsDisplay = document.getElementById('coins');
const shopCoinsDisplay = document.getElementById('shop-coins');
const shopItemsContainer = document.getElementById('shop-items');
const inventoryItems = document.getElementById('inventory-items');
const currentStreakDisplay = document.getElementById('current-streak');
const longestStreakDisplay = document.getElementById('longest-streak');
const calendarGrid = document.querySelector('.calendar-grid');
const calendarMonthDisplay = document.getElementById('calendar-month');
const prevMonthButton = document.querySelector('.prev-month');
const nextMonthButton = document.querySelector('.next-month');
const plannerBg = document.getElementById('planner-background');
const avatarLevel = document.getElementById('avatar-level');
const avatarXp = document.getElementById('avatar-xp');
const loginContainer = document.getElementById('login-container');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const registerBtn = document.getElementById('register-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Current calendar month tracking
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

let decorationDnDInitialized = false;

function setupDecorationAreaDnD() {
  if (decorationDnDInitialized) return;
  if (!plannerBg) return;
  plannerBg.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  plannerBg.addEventListener('drop', (e) => {
    e.preventDefault();
    const emoji = e.dataTransfer.getData('text/plain');
    const shopItem = shopItems.find(item => item.emoji === emoji);
    if (shopItem) {
      placeDecoration(shopItem, e.clientX, e.clientY);
    }
  });
  decorationDnDInitialized = true;
}

// Authentication Functions
function initAuth() {
  // Check if user is already logged in
  const savedUser = localStorage.getItem('pixelPlannerUser');
  if (savedUser) {
    authState.isAuthenticated = true;
    authState.currentUser = JSON.parse(savedUser);
    showMainApp();
    loadUserData(authState.currentUser.username);
  }

  // Set up login form handler
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (registerBtn) {
    registerBtn.addEventListener('click', handleRegister);
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError('Please fill in all fields');
    return;
  }

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem('pixelPlannerUsers') || '{}');
  
  if (users[username] && users[username].password === password) {
    authState.isAuthenticated = true;
    authState.currentUser = { username };
    localStorage.setItem('pixelPlannerUser', JSON.stringify({ username }));
    showMainApp();
    loadUserData(username);
  } else {
    showError('Invalid username or password');
  }
}

function handleRegister() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError('Please fill in all fields');
    return;
  }

  // Get existing users
  const users = JSON.parse(localStorage.getItem('pixelPlannerUsers') || '{}');
  
  if (users[username]) {
    showError('Username already exists');
    return;
  }

  // Create new user
  users[username] = { password };
  localStorage.setItem('pixelPlannerUsers', JSON.stringify(users));
  
  // Auto login after registration
  authState.isAuthenticated = true;
  authState.currentUser = { username };
  localStorage.setItem('pixelPlannerUser', JSON.stringify({ username }));
  showMainApp();
  initializeUserData(username);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  // Remove any existing error message
  const existingError = loginForm.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  loginForm.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

function showMainApp() {
  if (loginContainer) loginContainer.style.display = 'none';
  if (mainApp) mainApp.style.display = 'block';
  setupEventListeners();
  updateUI();
}

function loadUserData(username) {
  const userData = localStorage.getItem(`pixelPlannerData_${username}`);
  if (userData) {
    const parsed = JSON.parse(userData);
    Object.assign(state, parsed);
    state.lastActive = new Date(parsed.lastActive);
    if (parsed.completedDates) {
      state.completedDates = parsed.completedDates;
    }
  }
  updateUI();
}

function initializeUserData(username) {
  // Initialize with default state
  const defaultState = {
    level: 1,
    xp: 0,
    coins: 50,
    streak: 0,
    longestStreak: 0,
    lastActive: new Date().toDateString(),
    tasks: [],
    inventory: [],
    decorations: [],
    completedDates: []
  };
  
  Object.assign(state, defaultState);
  saveUserData(username);
  updateUI();
}

function saveUserData(username) {
  const stateToSave = {
    ...state,
    lastActive: new Date().toString(),
    completedDates: state.completedDates
  };
  localStorage.setItem(`pixelPlannerData_${username}`, JSON.stringify(stateToSave));
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

// Update all UI elements
function updateUI() {
  renderTasks();
  renderShop();
  updateProgress();
  checkStreak();
  renderCalendar();
  enableInventoryItems();
  renderDecorations();
  updateView('tasks');
  updateAvatarStats();
}

// Set up event listeners
function setupEventListeners() {
  // Menu navigation
  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      updateView(button.dataset.view);
    });
  });

  // Add new task
  if (addTaskButton) {
    addTaskButton.addEventListener('click', addTask);
  }
  if (newTaskInput) {
    newTaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTask();
    });
  }

  // Calendar navigation
  if (prevMonthButton) {
    prevMonthButton.addEventListener('click', () => {
      currentCalendarMonth--;
      if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      renderCalendar();
    });
  }

  if (nextMonthButton) {
    nextMonthButton.addEventListener('click', () => {
      currentCalendarMonth++;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      }
      renderCalendar();
    });
  }
}

// Switch between views
function updateView(view) {
  // Update menu buttons
  menuButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.view === view);
  });

  // Update views
  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].classList.toggle('hidden', key !== view);
    }
  });

  // Special view handling
  if (view === 'shop' && shopCoinsDisplay) {
    shopCoinsDisplay.textContent = state.coins;
  } else if (view === 'calendar') {
    renderCalendar();
  } else if (view === 'decoration') {
    setupDecorationAreaDnD();
  }

  // Always update inventory and enable drag-and-drop for the active view
  renderInventory();
  enableInventoryItems();
}

// Add a new task
function addTask() {
  if (!newTaskInput || !taskDifficulty || !taskDueDate) return;

  const taskText = newTaskInput.value.trim();
  const xpValue = parseInt(taskDifficulty.value);
  const dueDate = taskDueDate.value;
  const dueTime = taskDueTime ? taskDueTime.value : null;

  if (taskText) {
    const task = {
      id: Date.now(),
      text: taskText,
      xpValue: xpValue,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      completed: false,
      difficulty: getDifficultyText(xpValue),
      createdAt: new Date()
    };
    
    state.tasks.push(task);
    saveState();
    renderTasks();
    newTaskInput.value = '';
    taskDifficulty.value = '20';
    taskDueDate.value = '';
    if (taskDueTime) taskDueTime.value = '';
  }
}

// Helper function to get difficulty text
function getDifficultyText(xp) {
  xp = parseInt(xp);
  if (xp === 10) return 'easy';
  if (xp === 20) return 'medium';
  if (xp === 30) return 'hard';
  return 'medium';
}

// Render all tasks
function renderTasks() {
  if (!taskList) return;
  
  taskList.innerHTML = '';
  
  state.tasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-item';
    taskElement.dataset.id = task.id;
    
    // Format deadline if exists
    let deadlineDisplay = '';
    if (task.dueDate) {
      const dateObj = new Date(task.dueDate);
      deadlineDisplay = dateObj.toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric'
      });
      if (task.dueTime) {
        deadlineDisplay += ` ${task.dueTime}`;
      }
    }
    
    taskElement.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <span class="task-text">${task.text}</span>
      <span class="task-difficulty task-difficulty-${task.difficulty}">
        ${task.difficulty}
      </span>
      ${deadlineDisplay ? `<span class="task-deadline">${deadlineDisplay}</span>` : ''}
      <span class="xp-value">+${task.xpValue}XP</span>
      <button class="delete-task pixel-button">X</button>
      <button class="edit-task pixel-button">✎</button>
    `;
    
    // Add checkbox event listener
    const checkbox = taskElement.querySelector('.task-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          setTimeout(() => completeTask(task.id), 300);
        }
      });
    }
    
    // Add delete event listener
    const deleteBtn = taskElement.querySelector('.delete-task');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        deleteTask(task.id);
      });
    }
    
    // Add edit event listener
    const editBtn = taskElement.querySelector('.edit-task');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        editTask(task.id);
      });
    }
    
    taskList.appendChild(taskElement);
  });
}

// Delete task
function deleteTask(taskId) {
  state.tasks = state.tasks.filter(task => task.id !== taskId);
  saveState();
  renderTasks();
  showPixelNotification('Task deleted!');
}

// Complete task
function completeTask(taskId) {
  const taskIndex = state.tasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    const task = state.tasks[taskIndex];
    
    // Add XP and coins based on difficulty
    state.xp += task.xpValue;
    
    // Give coins based on difficulty
    if (task.difficulty === 'easy') {
      state.coins += 10;
    } else if (task.difficulty === 'medium') {
      state.coins += 20;
    } else if (task.difficulty === 'hard') {
      state.coins += 30;
    }
    
    // Check for level up
    const xpNeeded = state.level * 100;
    if (state.xp >= xpNeeded) {
      state.level++;
      state.xp = state.xp - xpNeeded;
      state.coins += 25;
      triggerSuperSaiyan(true);
    } else {
      triggerSuperSaiyan(false);
    }
    
    // Update streak
    updateStreak();
    
    // Remove completed task
    state.tasks.splice(taskIndex, 1);
    
    // Update UI
    renderTasks();
    updateProgress();
    updateAvatarStats();
    saveState();
  }
}

// Update progress
function updateProgress() {
  if (!xpBar || !levelDisplay || !xpDisplay || !nextLevelDisplay || !coinsDisplay) return;

  const xpNeeded = state.level * 100;
  const xpPercentage = Math.min((state.xp / xpNeeded) * 100, 100);
  
  xpBar.style.width = `${xpPercentage}%`;
  levelDisplay.textContent = state.level;
  xpDisplay.textContent = state.xp;
  nextLevelDisplay.textContent = xpNeeded;
  coinsDisplay.textContent = state.coins;
}

// Update avatar stats
function updateAvatarStats() {
  if (!avatarLevel || !avatarXp) return;
  
  avatarLevel.textContent = state.level;
  avatarXp.textContent = state.xp;
}

// Save state
function saveState() {
  if (authState.currentUser) {
    saveUserData(authState.currentUser.username);
  }
}

// Trigger super saiyan animation
function triggerSuperSaiyan(isLevelUp) {
  const aura = document.getElementById('aura');
  aura.classList.remove('super-saiyan', 'super-saiyan-level-up');
  
  // Trigger reflow
  void aura.offsetWidth;
  
  // Add appropriate class
  aura.classList.add(isLevelUp ? 'super-saiyan-level-up' : 'super-saiyan');
  
  // Remove after animation
  setTimeout(() => {
    aura.classList.remove('super-saiyan', 'super-saiyan-level-up');
  }, isLevelUp ? 1500 : 1000);
}

// Trigger pixel-style confetti
function triggerPixelConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1000';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#FF5252', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'];
  
  // Create particles
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: canvas.height + 100,
      size: Math.floor(Math.random() * 10 + 5),
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2
    });
  }
  
  // Animation
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let stillAlive = false;
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += Math.sin(p.angle) * 1.5;
      p.angle += 0.1;
      
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      
      if (p.y > -10) stillAlive = true;
    });
    
    if (stillAlive) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };
  
  animate();
}

// Show pixel notification
function showPixelNotification(message, duration = 3000) {
  const notification = document.createElement('div');
  notification.className = 'pixel-notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, duration);
}

// Streak tracking
function checkStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (state.lastActive === yesterday.toDateString()) {
    state.streak++;
    if (state.streak > state.longestStreak) {
      state.longestStreak = state.streak;
    }
  } else if (state.lastActive !== today) {
    state.streak = 1;
  }
  
  state.lastActive = today;
  updateStreakDisplay();
  saveState();
}

function updateStreak() {
  state.streak++;
  if (state.streak > state.longestStreak) {
    state.longestStreak = state.streak;
  }
  updateStreakDisplay();
  saveState();
}

function updateStreakDisplay() {
  currentStreakDisplay.textContent = state.streak;
  longestStreakDisplay.textContent = state.longestStreak;
}

// Calendar rendering
function renderCalendar() {
  const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
  const today = new Date();
  
  // Update month display
  calendarMonthDisplay.textContent = new Date(currentCalendarYear, currentCalendarMonth).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });
  
  calendarGrid.innerHTML = '';
  
  // Empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    calendarGrid.appendChild(emptyCell);
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.textContent = day;
    
    const dateStr = `${currentCalendarYear}-${currentCalendarMonth + 1}-${day}`;
    
    // Highlight today
    if (currentCalendarMonth === today.getMonth() && 
        currentCalendarYear === today.getFullYear() && 
        day === today.getDate()) {
      dayCell.classList.add('active');
    }
    
    // Highlight streak days
    if (state.completedDates.includes(dateStr)) {
      dayCell.innerHTML = '✓';
      dayCell.style.color = '#FFD700';
      dayCell.style.textShadow = '1px 1px 0 #000';
    }
    
    calendarGrid.appendChild(dayCell);
  }
}

// Shop functionality
function renderShop() {
  shopItemsContainer.innerHTML = '';
  shopItems.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'shop-item';
    itemElement.innerHTML = `
      <div class="item-image">${item.emoji}</div>
      <h3>${item.name}</h3>
      <p>${item.price} coins</p>
      <button class="pixel-button" data-id="${item.id}">Buy</button>
    `;
    
    const buyButton = itemElement.querySelector('button');
    buyButton.addEventListener('click', () => purchaseItem(item));
    buyButton.disabled = state.coins < item.price;
    
    shopItemsContainer.appendChild(itemElement);
  });
  
  renderInventory();
}

function purchaseItem(item) {
  if (state.coins >= item.price) {
    state.coins -= item.price;
    state.inventory.push(item);
    
    updateProgress();
    shopCoinsDisplay.textContent = state.coins;
    renderInventory();
    enableInventoryItems();
    saveState();
    
    showPixelNotification(`Purchased ${item.name}!`);
    
    // Disable buy button if can't afford another
    const buttons = document.querySelectorAll(`[data-id="${item.id}"]`);
    buttons.forEach(button => {
      button.disabled = state.coins < item.price;
    });
  } else {
    showPixelNotification('Not enough coins!', 2000);
  }
}

function renderInventory() {
  // Render inventory in all containers
  const containers = [
    document.getElementById('inventory-items-shop'),
    document.getElementById('inventory-items-calendar'),
    document.getElementById('inventory-items-decoration')
  ];
  containers.forEach(container => {
    if (!container) return;
    container.innerHTML = '';
    state.inventory.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'inventory-item';
      itemElement.textContent = item.emoji;
      itemElement.title = item.name;
      container.appendChild(itemElement);
    });
  });
}

function enableInventoryItems() {
  // Only enable drag-and-drop for inventory items in the currently visible container
  const containers = [
    document.getElementById('inventory-items-shop'),
    document.getElementById('inventory-items-calendar'),
    document.getElementById('inventory-items-decoration')
  ];
  const visibleContainer = containers.find(container => {
    if (!container) return false;
    let parent = container;
    while (parent && !parent.classList.contains('view')) {
      parent = parent.parentElement;
    }
    return parent && !parent.classList.contains('hidden');
  });
  if (!visibleContainer) return;
  const inventoryItems = visibleContainer.querySelectorAll('.inventory-item');
  inventoryItems.forEach(item => {
    item.draggable = true;
    // Remove previous listeners to avoid stacking
    item.replaceWith(item.cloneNode(true));
  });
  // Re-select after replaceWith
  const freshItems = visibleContainer.querySelectorAll('.inventory-item');
  freshItems.forEach(item => {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.textContent);
      setTimeout(() => item.classList.add('dragging'), 0);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
  });
}

// Decoration system
function placeDecoration(item, clientX, clientY) {
  const rect = plannerBg.getBoundingClientRect();
  const x = clientX - rect.left - 15; // 15 is half the item size for centering
  const y = clientY - rect.top - 15;
  
  const decoration = {
    id: Date.now(),
    itemId: item.id,
    emoji: item.emoji,
    x: x,
    y: y,
    date: new Date()
  };
  
  state.decorations.push(decoration);
  renderDecorations();
  saveState();
}

function renderDecorations() {
  plannerBg.innerHTML = '';
  
  state.decorations.forEach(decoration => {
    const decorElement = document.createElement('div');
    decorElement.className = 'decoration-item';
    decorElement.textContent = decoration.emoji;
    decorElement.style.left = `${decoration.x}px`;
    decorElement.style.top = `${decoration.y}px`;
    decorElement.draggable = true;
    
    decorElement.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', decoration.id.toString());
      setTimeout(() => decorElement.classList.add('dragging'), 0);
    });
    
    decorElement.addEventListener('dragend', (e) => {
      decorElement.classList.remove('dragging');
      const rect = plannerBg.getBoundingClientRect();
      const decorationIndex = state.decorations.findIndex(d => d.id === decoration.id);
      
      if (decorationIndex !== -1) {
        state.decorations[decorationIndex].x = e.clientX - rect.left - 15;
        state.decorations[decorationIndex].y = e.clientY - rect.top - 15;
        saveState();
      }
    });
    
    decorElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showDecorationControls(e, decoration.id);
    });
    
    plannerBg.appendChild(decorElement);
  });
}

function showDecorationControls(e, decorationId) {
  const existingControls = document.querySelector('.decoration-controls');
  if (existingControls) existingControls.remove();
  
  const controls = document.createElement('div');
  controls.className = 'decoration-controls';
  controls.style.left = `${e.clientX}px`;
  controls.style.top = `${e.clientY}px`;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn pixel-button';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => {
    state.decorations = state.decorations.filter(d => d.id !== decorationId);
    renderDecorations();
    saveState();
    controls.remove();
  });
  
  controls.appendChild(deleteBtn);
  document.body.appendChild(controls);
  
  const closeControls = (e) => {
    if (!controls.contains(e.target)) {
      controls.remove();
      document.removeEventListener('click', closeControls);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeControls);
  }, 100);
}

// Add to your existing code
function editTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  // Create edit form
  const editForm = document.createElement('div');
  editForm.className = 'edit-form';
  editForm.innerHTML = `
    <input type="text" class="pixel-input edit-task-text" value="${task.text}">
    <select class="pixel-select edit-task-difficulty">
      <option value="10" ${task.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
      <option value="20" ${task.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
      <option value="30" ${task.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
    </select>
    <input type="date" class="pixel-input edit-task-date" value="${task.dueDate || ''}">
    <input type="time" class="pixel-input edit-task-time" value="${task.dueTime || ''}">
    <button class="pixel-button save-edit">Save</button>
    <button class="pixel-button cancel-edit">Cancel</button>
  `;

  // Replace task with edit form
  const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
  taskElement.innerHTML = '';
  taskElement.appendChild(editForm);

  // Add event listeners for edit form
  editForm.querySelector('.save-edit').addEventListener('click', () => {
    saveEditedTask(taskId);
  });

  editForm.querySelector('.cancel-edit').addEventListener('click', () => {
    renderTasks(); // Just re-render to cancel
  });
}

function saveEditedTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const editForm = document.querySelector(`.task-item[data-id="${taskId}"] .edit-form`);
  
  // Update task properties
  task.text = editForm.querySelector('.edit-task-text').value.trim();
  
  const difficultyValue = editForm.querySelector('.edit-task-difficulty').value;
  task.xpValue = parseInt(difficultyValue);
  task.difficulty = getDifficultyText(difficultyValue);
  
  task.dueDate = editForm.querySelector('.edit-task-date').value || null;
  task.dueTime = editForm.querySelector('.edit-task-time').value || null;

  saveState();
  renderTasks();
  showPixelNotification('Task updated!');
}