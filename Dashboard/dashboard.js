// Wait for the HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    const addHabitBtn = document.querySelector('.add-habit-btn');
    const habitModal = document.getElementById('habit-modal');
    const closeModalBtn = habitModal.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const habitForm = document.getElementById('habit-form');
    const habitListContainer = document.getElementById('habit-list-container');
    const modalTitle = document.getElementById('modal-title');
    const habitIdInput = document.getElementById('habit-id');
    const habitNameInput = document.getElementById('habit-name');
    const habitIconInput = document.getElementById('habit-icon');
    const saveHabitBtn = document.getElementById('save-habit-btn');
    const statsCompletedElement = document.querySelector('.stat-card.completed h2');
    // Add selectors for streak and failed if you implement them later
    // const statsStreakElement = document.querySelector('.stat-card.streak h2');
    // const statsFailedElement = document.querySelector('.stat-card.failed h2');

    // --- Application State ---
    let habits = []; // Array to hold habit objects

    // --- Core Functions ---

    /**
     * Loads habits from localStorage or sets default data.
     */
    const loadHabits = () => {
        const storedHabits = localStorage.getItem('habits');
        if (storedHabits) {
            try {
                habits = JSON.parse(storedHabits);
                // Basic validation: Ensure it's an array
                if (!Array.isArray(habits)) {
                    console.error("Stored habits data is not an array. Resetting.");
                    habits = getDefaultHabits();
                }
            } catch (error) {
                console.error("Error parsing habits from localStorage:", error);
                habits = getDefaultHabits(); // Reset to defaults if parsing fails
            }
        } else {
            habits = getDefaultHabits();
        }
        // Ensure all habits have necessary properties (for data added before updates)
        habits = habits.map(h => ({
            id: h.id || Date.now() + Math.random(), // Ensure ID exists
            name: h.name || 'Unnamed Habit',
            icon: h.icon || '🎯',
            checked: h.checked || false,
            color: h.color || getRandomCheckColor() // Assign color if missing
        }));
        saveHabits(); // Save potentially updated habits
    };

    /**
     * Returns a default set of habits.
     */
    const getDefaultHabits = () => {
        console.log("Setting default habits.");
        // Use unique IDs even for defaults
        const now = Date.now();
        return [
            { id: now + 1, name: 'Senam Pagi', icon: '😊', checked: false, color: 'orange-check' },
            { id: now + 2, name: 'Baca Buku 15 Menit', icon: '📚', checked: false, color: 'blue-check' },
            { id: now + 3, name: 'Minum 8 Gelas Air', icon: '💧', checked: false, color: 'grey-check' },
        ];
    };

    /**
     * Saves the current habits array to localStorage.
     */
    const saveHabits = () => {
        try {
            localStorage.setItem('habits', JSON.stringify(habits));
        } catch (error) {
            console.error("Error saving habits to localStorage:", error);
            alert("Gagal menyimpan data habit. Penyimpanan lokal mungkin penuh atau tidak didukung.");
        }
    };

    /**
     * Renders the list of habits into the HTML container.
     */
    const renderHabits = () => {
        habitListContainer.innerHTML = ''; // Clear the list first

        if (habits.length === 0) {
            habitListContainer.innerHTML = '<p class="no-habits-message">Belum ada habit. Klik "Tambah Habit +" untuk memulai!</p>';
            return;
        }

        habits.forEach(habit => {
            const habitItem = document.createElement('div');
            habitItem.classList.add('habit-item');
            if (habit.checked) {
                habitItem.classList.add('highlighted');
            }
            habitItem.dataset.id = habit.id; // Crucial for identifying the habit

            const checkboxClass = habit.checked ? 'checked' : '';
            const checkColorClass = habit.color || 'orange-check'; // Fallback color

            habitItem.innerHTML = `
                <span class="icon" aria-hidden="true">${habit.icon}</span>
                <div class="habit-info">
                    ${habit.name}
                </div>
                <div class="habit-actions">
                    <button class="edit-btn" title="Edit ${habit.name}">✏️</button>
                    <button class="delete-btn" title="Hapus ${habit.name}">🗑️</button>
                </div>
                <div class="checkbox ${checkboxClass} ${checkColorClass}" role="checkbox" aria-checked="${habit.checked}" aria-labelledby="habit-name-${habit.id}" tabindex="0">
                   ${habit.checked ? '✓' : ''}
                </div>
                <span id="habit-name-${habit.id}" class="visually-hidden">${habit.name}</span> `;
            habitListContainer.appendChild(habitItem);
        });
    };

    /**
     * Opens the Add/Edit Habit modal.
     * @param {string} mode - 'add' or 'edit'.
     * @param {object|null} habitData - The habit data if mode is 'edit'.
     */
    const openModal = (mode = 'add', habitData = null) => {
        habitForm.reset(); // Clear previous form data
        habitIdInput.value = ''; // Clear hidden ID field by default

        if (mode === 'edit' && habitData) {
            modalTitle.textContent = 'Edit Habit';
            habitIdInput.value = habitData.id;
            habitNameInput.value = habitData.name;
            habitIconInput.value = habitData.icon;
            saveHabitBtn.textContent = 'Update';
        } else {
            modalTitle.textContent = 'Tambah Habit Baru';
            saveHabitBtn.textContent = 'Simpan';
            // Optionally set a default icon for adding
            // habitIconInput.value = '🎯';
        }
        habitModal.style.display = 'block';
        habitNameInput.focus(); // Auto-focus the name field
    };

    /**
     * Closes the Add/Edit Habit modal.
     */
    const closeModal = () => {
        habitModal.style.display = 'none';
    };

    /**
     * Adds a new habit to the list.
     * @param {string} name - The name of the habit.
     * @param {string} icon - The emoji icon for the habit.
     */
    const addHabit = (name, icon) => {
        const newHabit = {
            id: Date.now(), // Simple unique ID
            name: name,
            icon: icon || '🎯', // Default icon if empty
            checked: false,
            color: getRandomCheckColor() // Assign a random color class
        };
        habits.push(newHabit);
        saveHabits();
        renderHabits();
        updateStats();
    };

    /**
     * Updates an existing habit.
     * @param {string|number} id - The ID of the habit to update.
     * @param {string} name - The updated name.
     * @param {string} icon - The updated icon.
     */
    const updateHabit = (id, name, icon) => {
        // Use '==' for comparison in case ID is stored as number but retrieved as string
        const habitIndex = habits.findIndex(h => h.id == id);
        if (habitIndex > -1) {
            habits[habitIndex].name = name;
            habits[habitIndex].icon = icon || '🎯';
            // Note: We don't reset 'checked' or 'color' status on update
            saveHabits();
            renderHabits();
            // No need to update stats here unless name/icon affects them
        } else {
            console.error("Habit not found for update with ID:", id);
        }
    };

    /**
     * Deletes a habit after confirmation.
     * @param {string|number} id - The ID of the habit to delete.
     */
    const deleteHabit = (id) => {
       // Find the habit name for the confirmation message
       const habitToDelete = habits.find(h => h.id == id);
       const habitName = habitToDelete ? `"${habitToDelete.name}"` : "ini";

       if (confirm(`Yakin ingin menghapus habit ${habitName}? Tindakan ini tidak bisa dibatalkan.`)) {
           habits = habits.filter(h => h.id != id);
           saveHabits();
           renderHabits();
           updateStats();
       }
    };

    /**
     * Toggles the 'checked' status of a habit.
     * @param {string|number} id - The ID of the habit to toggle.
     */
    const toggleHabitCheck = (id) => {
        const habitIndex = habits.findIndex(h => h.id == id);
        if (habitIndex > -1) {
            habits[habitIndex].checked = !habits[habitIndex].checked;
            saveHabits();
            // Optimization: Instead of full re-render, just update the specific item
            updateHabitItemDOM(id, habits[habitIndex]);
            updateStats();
        } else {
             console.error("Habit not found for toggle with ID:", id);
        }
    };

    /**
    * Updates a single habit item in the DOM directly.
    * More efficient than re-rendering the whole list for a simple toggle.
    * @param {string|number} id - The ID of the habit item to update.
    * @param {object} habitData - The updated habit data.
    */
    const updateHabitItemDOM = (id, habitData) => {
        const habitItem = habitListContainer.querySelector(`.habit-item[data-id="${id}"]`);
        if (!habitItem) return;

        const checkbox = habitItem.querySelector('.checkbox');
        const checkColorClass = habitData.color || 'orange-check';

        // Update highlight class
        habitItem.classList.toggle('highlighted', habitData.checked);

        // Update checkbox classes and content
        checkbox.className = `checkbox ${checkColorClass}`; // Reset classes first
        if (habitData.checked) {
            checkbox.classList.add('checked');
            checkbox.innerHTML = '✓';
        } else {
            checkbox.innerHTML = '';
        }
        checkbox.setAttribute('aria-checked', habitData.checked);
    };


    /**
     * Selects a random CSS class name for checkbox color.
     * @returns {string} A color class name (e.g., 'orange-check').
     */
    const getRandomCheckColor = () => {
        const colors = ['orange-check', 'grey-check', 'blue-check', 'green-check', 'red-check'];
        // Add more colors here if you defined them in CSS
        return colors[Math.floor(Math.random() * colors.length)];
    };

    /**
     * Updates the statistics display based on current habits.
     * (Simplified version - only updates 'Completed' count)
     */
    const updateStats = () => {
        const totalCompleted = habits.filter(h => h.checked).length;

        if (statsCompletedElement) {
             // Shows count of currently checked habits
            statsCompletedElement.textContent = `${totalCompleted} Selesai`;
        }

        // Placeholder for more complex stats (requires daily tracking)
        // if (statsStreakElement) statsStreakElement.textContent = `... Hari`;
        // if (statsFailedElement) statsFailedElement.textContent = `... Hari`;
    };

    // --- Event Listeners Setup ---

    // Open modal when 'Add Habit' button is clicked
    addHabitBtn.addEventListener('click', () => openModal('add'));

    // Close modal using the 'X' button
    closeModalBtn.addEventListener('click', closeModal);

    // Close modal using the 'Cancel' button
    cancelBtn.addEventListener('click', closeModal);

    // Close modal if user clicks outside the modal content area
    window.addEventListener('click', (event) => {
        if (event.target === habitModal) {
            closeModal();
        }
    });

    // Handle form submission for adding or updating habits
    habitForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent page refresh
        const id = habitIdInput.value; // Get ID (if editing)
        const name = habitNameInput.value.trim(); // Get name, remove whitespace
        const icon = habitIconInput.value.trim(); // Get icon, remove whitespace

        if (!name) {
            alert('Nama habit tidak boleh kosong!');
            habitNameInput.focus(); // Focus back on the name field
            return; // Stop submission if name is empty
        }

        if (id) {
            updateHabit(id, name, icon); // Update existing habit
        } else {
            addHabit(name, icon); // Add new habit
        }
        closeModal(); // Close modal after successful submission
    });

    // Event delegation for handling clicks within the habit list container
    habitListContainer.addEventListener('click', (event) => {
        const target = event.target;
        // Find the closest ancestor element that is a habit item
        const habitItem = target.closest('.habit-item');

        // If the click wasn't inside a habit item, do nothing
        if (!habitItem) return;

        const habitId = habitItem.dataset.id; // Get the ID from the data attribute

        // Check if the Edit button (or its icon) was clicked
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
             const habitToEdit = habits.find(h => h.id == habitId);
             if (habitToEdit) {
                 openModal('edit', habitToEdit);
             }
        }
        // Check if the Delete button (or its icon) was clicked
        else if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
             deleteHabit(habitId);
        }
        // Check if the Checkbox area was clicked
        else if (target.classList.contains('checkbox') || target.closest('.checkbox')) {
             toggleHabitCheck(habitId);
        }
    });

     // Accessibility: Allow toggling checkbox with Enter or Space key
    habitListContainer.addEventListener('keydown', (event) => {
        const target = event.target;
        // Check if the focused element is a checkbox and Enter/Space is pressed
        if ((event.key === 'Enter' || event.key === ' ') && target.classList.contains('checkbox')) {
            event.preventDefault(); // Prevent default spacebar scroll or enter submit
            const habitItem = target.closest('.habit-item');
            if (habitItem) {
                const habitId = habitItem.dataset.id;
                toggleHabitCheck(habitId);
            }
        }
    });

    // --- Initialization ---
    loadHabits();   // Load habits from storage when the page loads
    renderHabits(); // Display the loaded habits
    updateStats();  // Calculate and display initial statistics
});

// Add a helper class for screen readers if not already present globally
const style = document.createElement('style');
style.innerHTML = `
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap; /* added line */
  border: 0;
}`;
document.head.appendChild(style);