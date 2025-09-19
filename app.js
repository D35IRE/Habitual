// App State
let gameState = {
  points: 0,
  level: 1,
  longestStreak: 0,
  habitsCompleted: 0,
  carbonSaved: 0,
  activeHabits: [],
  weeklyProgress: 0,
  customHabitId: 1000 // Starting ID for custom habits
};

// Preset sustainable habits with carbon impact
const presetHabits = [
  {
    id: 1,
    name: "Use reusable water bottle",
    icon: "💧",
    impact: 0.5,
    description: "Avoid single-use plastic bottles",
    points: 10
  },
  {
    id: 2,
    name: "Walk or bike instead of driving",
    icon: "🚲",
    impact: 2.3,
    description: "For trips under 2km",
    points: 25
  },
  {
    id: 3,
    name: "Turn off lights when leaving room",
    icon: "💡",
    impact: 0.3,
    description: "Save electricity",
    points: 5
  },
  {
    id: 4,
    name: "Take shorter showers",
    icon: "🚿",
    impact: 1.2,
    description: "Reduce to 5 minutes",
    points: 15
  },
  {
    id: 5,
    name: "Use public transport",
    icon: "🚌",
    impact: 1.8,
    description: "Instead of private vehicle",
    points: 20
  },
  {
    id: 6,
    name: "Bring reusable bags shopping",
    icon: "🛍️",
    impact: 0.4,
    description: "Avoid plastic bags",
    points: 10
  },
  {
    id: 7,
    name: "Eat one plant-based meal",
    icon: "🥗",
    impact: 3.5,
    description: "Reduce meat consumption",
    points: 30
  },
  {
    id: 8,
    name: "Unplug electronics when not in use",
    icon: "🔌",
    impact: 0.8,
    description: "Stop phantom energy use",
    points: 12
  }
];

// Eco tips database
const ecoTips = [
  "Replace one car trip per week with walking or cycling to save 2.3kg CO₂ weekly!",
  "Using a reusable water bottle can prevent 156 plastic bottles from entering landfills annually.",
  "LED bulbs use 75% less energy than incandescent bulbs and last 25 times longer.",
  "Taking 5-minute showers instead of 10-minute ones saves 25 gallons of water daily.",
  "Eating one less meat meal per week saves the equivalent of driving 348 miles in CO₂ emissions.",
  "Unplugging electronics saves $100+ annually and reduces phantom energy consumption.",
  "Using reusable shopping bags can prevent 170 plastic bags from being used annually.",
  "Air-drying clothes instead of using a dryer saves 2.3kg CO₂ per load.",
  "Using both sides of paper reduces paper consumption by 50%.",
  "Keeping your car tires properly inflated improves fuel efficiency by up to 3%."
];

// Initialize app
function initApp() {
  loadGameState();
  updateDashboard();
}

// Render preset habits
function renderPresetHabits() {
  const container = document.getElementById('presetHabits');
  if (!container) return;
  
  container.innerHTML = presetHabits.map(habit => {
    const isActive = gameState.activeHabits.some(h => h.id === habit.id);
    return `
      <div class="habit-card ${isActive ? 'selected' : ''}" onclick="toggleHabit(${habit.id})">
        <span class="habit-icon">${habit.icon}</span>
        <h4>${habit.name}</h4>
        <p>${habit.description}</p>
        <div class="habit-impact">-${habit.impact} kg CO₂ | ${habit.points} points</div>
        <div style="margin-top: 1rem; font-weight: bold; color: ${isActive ? '#27ae60' : '#666'};">
          ${isActive ? '✅ Added to My Habits' : '➕ Click to Add'}
        </div>
      </div>
    `;
  }).join('');
}

// Toggle habit selection
function toggleHabit(habitId) {
  const habit = presetHabits.find(h => h.id === habitId);
  const existingIndex = gameState.activeHabits.findIndex(h => h.id === habitId);
  
  if (existingIndex === -1) {
    // Add habit
    gameState.activeHabits.push({
      ...habit,
      streak: 0,
      lastCompleted: null,
      completedToday: false,
      weeklyGoal: 7, // Default weekly goal
      weeklyProgress: 0,
      isCustom: false
    });
  } else {
    // Remove habit
    gameState.activeHabits.splice(existingIndex, 1);
  }
  
  renderActiveHabits();
  renderPresetHabits(); // Re-render to update visual states
  saveGameState();
}

// Render active habits
function renderActiveHabits() {
  const container = document.getElementById('activeHabits');
  if (!container) return;
  
  if (gameState.activeHabits.length === 0) {
    container.innerHTML = `
      <p style="text-align: center; color: #666; padding: 2rem;">
        No habits yet! Select some eco-friendly habits above or add your own custom habits.
      </p>
    `;
    return;
  }

  container.innerHTML = gameState.activeHabits.map(habit => `
    <div class="habit-item ${habit.isCustom ? 'custom-habit' : ''}">
      <div class="habit-info" style="flex: 1;">
        <h4>${habit.icon || '🌱'} ${habit.name}</h4>
        <p>Impact: -${habit.impact} kg CO₂ | Points: ${habit.points} ${habit.isCustom ? '| Custom Habit' : ''}</p>
        
        <!-- Weekly Progress Bar -->
        <div class="habit-progress">
          <div class="habit-progress-fill" style="width: ${(habit.weeklyProgress / habit.weeklyGoal) * 100}%"></div>
        </div>
        <div class="habit-progress-text">
          Weekly Progress: ${habit.weeklyProgress}/${habit.weeklyGoal} 
          (${Math.round((habit.weeklyProgress / habit.weeklyGoal) * 100)}%)
        </div>
      </div>
      
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="habit-streak">🔥 ${habit.streak}</span>
        <button class="btn ${habit.completedToday ? 'btn-success' : ''}" 
                onclick="completeHabit(${habit.id})"
                ${habit.completedToday ? 'disabled' : ''}>
          ${habit.completedToday ? '✅ Done Today' : 'Complete'}
        </button>
        <button class="btn btn-danger" onclick="removeHabit(${habit.id})">
          Remove
        </button>
      </div>
    </div>
  `).join('');
}

// Complete habit
function completeHabit(habitId) {
  const habit = gameState.activeHabits.find(h => h.id === habitId);
  if (!habit || habit.completedToday) return;

  habit.completedToday = true;
  habit.streak++;
  habit.weeklyProgress = Math.min(habit.weeklyProgress + 1, habit.weeklyGoal);
  habit.lastCompleted = new Date().toDateString();
  
  gameState.points += habit.points;
  gameState.habitsCompleted++;
  gameState.carbonSaved += habit.impact;
  gameState.weeklyProgress = Math.min(gameState.weeklyProgress + 1, 7);
  
  if (habit.streak > gameState.longestStreak) {
    gameState.longestStreak = habit.streak;
  }

  updateLevel();
  updateDashboard();
  renderActiveHabits();
  updateCarbonCalculator();
  saveGameState();

  // Show success message with progress
  const progressPercent = Math.round((habit.weeklyProgress / habit.weeklyGoal) * 100);
  showNotification(`Great job! You earned ${habit.points} eco points! 🌱\nWeekly progress: ${progressPercent}% complete!`);
}

// Remove habit
function removeHabit(habitId) {
  gameState.activeHabits = gameState.activeHabits.filter(h => h.id !== habitId);
  renderActiveHabits();
  renderPresetHabits(); // Update preset habits visual state
  saveGameState();
}

// Add custom habit
function addCustomHabit() {
  const name = document.getElementById('customHabitName').value.trim();
  const impact = parseFloat(document.getElementById('customHabitImpact').value) || 1.0;
  const points = parseInt(document.getElementById('customHabitPoints').value) || 15;

  if (!name) {
    showNotification('Please enter a habit name!');
    return;
  }

  const customHabit = {
    id: gameState.customHabitId++,
    name: name,
    icon: '🌱', // Default icon for custom habits
    impact: impact,
    description: 'Custom eco-friendly habit',
    points: points,
    isCustom: true
  };

  // Add to active habits
  gameState.activeHabits.push({
    ...customHabit,
    streak: 0,
    lastCompleted: null,
    completedToday: false,
    weeklyGoal: 7,
    weeklyProgress: 0,
    isCustom: true
  });

  // Clear form
  document.getElementById('customHabitName').value = '';
  document.getElementById('customHabitImpact').value = '';
  document.getElementById('customHabitPoints').value = '';

  renderActiveHabits();
  saveGameState();
  showNotification('Custom habit added successfully! 🎉');
}

// Update user level
function updateLevel() {
  const newLevel = Math.floor(gameState.points / 100) + 1;
  if (newLevel > gameState.level) {
    gameState.level = newLevel;
    showNotification(`Level up! You're now a ${getLevelName(newLevel)}! 🏆`);
  }
}

// Get level name
function getLevelName(level) {
  const levels = [
    "Eco Beginner", "Green Warrior", "Sustainability Hero", 
    "Earth Guardian", "Climate Champion", "Eco Legend"
  ];
  return levels[Math.min(level - 1, levels.length - 1)];
}

// Update dashboard
function updateDashboard() {
  const elements = {
    totalPoints: document.getElementById('totalPoints'),
    longestStreak: document.getElementById('longestStreak'),
    habitsCompleted: document.getElementById('habitsCompleted'),
    carbonSaved: document.getElementById('carbonSaved'),
    userLevel: document.getElementById('userLevel'),
    weeklyProgress: document.getElementById('weeklyProgress'),
    progressText: document.getElementById('progressText')
  };

  if (elements.totalPoints) elements.totalPoints.textContent = gameState.points;
  if (elements.longestStreak) elements.longestStreak.textContent = gameState.longestStreak;
  if (elements.habitsCompleted) elements.habitsCompleted.textContent = gameState.habitsCompleted;
  if (elements.carbonSaved) elements.carbonSaved.textContent = gameState.carbonSaved.toFixed(1);
  if (elements.userLevel) elements.userLevel.textContent = getLevelName(gameState.level);
  
  const progressPercent = (gameState.weeklyProgress / 7) * 100;
  if (elements.weeklyProgress) elements.weeklyProgress.style.width = `${progressPercent}%`;
  if (elements.progressText) elements.progressText.textContent = `${gameState.weeklyProgress}/7 days`;
}

// Update carbon calculator
function updateCarbonCalculator() {
  const todayImpact = gameState.activeHabits
    .filter(h => h.completedToday)
    .reduce((sum, h) => sum + h.impact, 0);
  
  const monthlyProjection = todayImpact * 30;
  
  const todayImpactEl = document.getElementById('todayImpact');
  const monthlyProjectionEl = document.getElementById('monthlyProjection');
  const impactComparisonEl = document.getElementById('impactComparison');
  
  if (todayImpactEl) todayImpactEl.textContent = `${todayImpact.toFixed(1)} kg CO₂ saved`;
  if (monthlyProjectionEl) monthlyProjectionEl.textContent = `${monthlyProjection.toFixed(1)} kg CO₂ saved`;
  
  // Impact comparison
  let comparison = "Start completing habits to see your environmental impact!";
  if (monthlyProjection > 0) {
    const treesEquivalent = Math.floor(monthlyProjection / 21.8);
    const milesEquivalent = Math.floor(monthlyProjection * 2.4);
    comparison = `That's like planting ${treesEquivalent} trees or not driving ${milesEquivalent} miles! 🌳🚗`;
  }
  
  if (impactComparisonEl) impactComparisonEl.textContent = comparison;
}

// Display daily tip
function displayDailyTip() {
  const today = new Date().getDay();
  const tip = ecoTips[today];
  const dailyTipEl = document.getElementById('dailyTip');
  if (dailyTipEl) dailyTipEl.textContent = tip;
}

// Get new tip
function getNewTip() {
  const randomTip = ecoTips[Math.floor(Math.random() * ecoTips.length)];
  const dailyTipEl = document.getElementById('dailyTip');
  if (dailyTipEl) dailyTipEl.textContent = randomTip;
}

// Show notification
function showNotification(message) {
  alert(message); // Simple alert for now - could be enhanced with toast notifications
}

// Save game state
function saveGameState() {
  // In a real app, this would sync with Firebase
  // For now, using localStorage as fallback
  localStorage.setItem('ecoHabitGameState', JSON.stringify(gameState));
}

// Load game state
function loadGameState() {
  const saved = localStorage.getItem('ecoHabitGameState');
  if (saved) {
    gameState = { ...gameState, ...JSON.parse(saved) };
    
    // Reset daily completion status if it's a new day
    const today = new Date().toDateString();
    gameState.activeHabits.forEach(habit => {
      if (habit.lastCompleted !== today) {
        habit.completedToday = false;
      }
      // Initialize weekly progress if not present
      if (habit.weeklyProgress === undefined) habit.weeklyProgress = 0;
      if (habit.weeklyGoal === undefined) habit.weeklyGoal = 7;
      if (habit.isCustom === undefined) habit.isCustom = false;
    });
  }
}

// Reset weekly progress for all habits (call this weekly)
function resetAllWeeklyProgress() {
  gameState.activeHabits.forEach(habit => {
    habit.weeklyProgress = 0;
    habit.completedToday = false;
  });
  gameState.weeklyProgress = 0;
  saveGameState();
  updateDashboard();
  renderActiveHabits();
}