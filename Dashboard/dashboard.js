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
    // Global Stats Selectors (if used)
    const globalStreakElement = document.getElementById('global-streak');
    const globalFailedElement = document.getElementById('global-failed');
    const globalCompletedElement = document.getElementById('global-completed');

    // Calendar Selectors
    const calendarMonthYearElement = document.getElementById('calendar-month-year');
    const calendarGridContainer = document.getElementById('calendar-grid-container');
    const prevMonthBtn = document.getElementById('calendar-prev');
    const nextMonthBtn = document.getElementById('calendar-next');

    // --- Application State ---
    let habits = []; // Array of habit objects
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let currentDate = new Date(); // Today's actual date
    let currentDisplayYear = currentDate.getFullYear();
    let currentDisplayMonth = currentDate.getMonth(); // 0-indexed (January = 0)

    // --- Helper Functions ---

    /**
     * Formats a Date object into YYYY-MM-DD string.
     * @param {Date} date - The date object.
     * @returns {string} Formatted date string.
     */
    const getYMD = (date) => {
        // Ensure input is a Date object
        if (!(date instanceof Date) || isNaN(date)) {
             console.error("Invalid date provided to getYMD:", date);
             // Return today's date as a fallback or handle appropriately
             return new Date().toISOString().split('T')[0];
         }
        return date.toISOString().split('T')[0];
    };

    // --- CORE FUNCTIONS (HABITS) ---

    /**
     * Loads habits, initializes missing stats, and performs daily check.
     */
    const loadHabits = () => {
        const storedHabits = localStorage.getItem('habits');
        if (storedHabits) {
            try {
                habits = JSON.parse(storedHabits);
                if (!Array.isArray(habits)) {
                    console.warn("Stored habits data is not an array. Resetting.");
                    habits = getDefaultHabits();
                }
            } catch (error) {
                console.error("Error parsing habits from localStorage:", error);
                habits = getDefaultHabits();
            }
        } else {
            habits = getDefaultHabits();
        }

        const todayYMD = getYMD(new Date()); // Get today's date for initialization

        // Initialize missing properties for older data or ensure types
        habits = habits.map(h => ({
            id: h.id || Date.now() + Math.random(),
            name: h.name || 'Unnamed Habit',
            icon: h.icon || '🎯',
            color: h.color || getRandomCheckColor(),
            checked: h.checked === true, // Ensure boolean, default false
            totalCompletions: typeof h.totalCompletions === 'number' ? h.totalCompletions : 0,
            currentStreak: typeof h.currentStreak === 'number' ? h.currentStreak : 0,
            failedCount: typeof h.failedCount === 'number' ? h.failedCount : 0,
            lastCompletedDate: h.lastCompletedDate || null, // YYYY-MM-DD or null
            createdAt: h.createdAt || todayYMD // YYYY-MM-DD
        }));

        // Perform daily check and reset BEFORE rendering
        const dailyCheckPerformed = checkDailyResetAndMissedHabits();

        // Save habits only if initialization or daily check modified them
        // This avoids unnecessary writes on every page load if it's the same day
        if (dailyCheckPerformed || !storedHabits) {
            saveHabits();
        }
    };

    /**
     * Returns a default set of habits with full stats structure.
     */
    const getDefaultHabits = () => {
        console.log("Setting default habits with stats.");
        const now = Date.now();
        const todayYMD = getYMD(new Date());
        return [
            { id: now + 1, name: 'Minum Air Putih', icon: '💧', color: 'blue-check', checked: false, totalCompletions: 0, currentStreak: 0, failedCount: 0, lastCompletedDate: null, createdAt: todayYMD },
            { id: now + 2, name: 'Olahraga Ringan', icon: '🏃', color: 'green-check', checked: false, totalCompletions: 0, currentStreak: 0, failedCount: 0, lastCompletedDate: null, createdAt: todayYMD },
        ];
    };

    /**
     * Checks if a new day has started, resets 'checked' status,
     * and updates streak/failed counts for missed habits.
     * @returns {boolean} True if a new day check was performed, false otherwise.
     */
    const checkDailyResetAndMissedHabits = () => {
        const lastCheckYMD = localStorage.getItem('lastCheckYMD');
        const todayYMD = getYMD(new Date());

        if (lastCheckYMD === todayYMD) {
            // console.log("Daily check already performed today.");
            return false; // Already checked today
        }

        console.log(`Performing daily check for ${todayYMD}. Last check: ${lastCheckYMD}.`);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayYMD = getYMD(yesterday);
        let habitsModified = false;

        habits.forEach(habit => {
            // 1. Reset 'checked' status for the new day
            if(habit.checked) {
                habit.checked = false;
                habitsModified = true;
            }

            // 2. Check if the habit was missed yesterday (only if it existed before yesterday)
            //    And ensure it wasn't actually completed yesterday or today (edge case)
            if (habit.createdAt < todayYMD &&
                habit.lastCompletedDate !== yesterdayYMD &&
                habit.lastCompletedDate !== todayYMD)
            {
                 // Check more carefully: if lastCompletedDate is null or before yesterday
                 if (habit.lastCompletedDate === null || habit.lastCompletedDate < yesterdayYMD) {
                    if (habit.currentStreak > 0) {
                        console.log(`Habit "${habit.name}" missed streak. Last completed: ${habit.lastCompletedDate}. Resetting streak.`);
                        habit.currentStreak = 0; // Reset streak only if it was > 0
                        habitsModified = true;
                    }
                    // Increment failed count regardless of streak
                    habit.failedCount++;
                    habitsModified = true;
                    console.log(`Habit "${habit.name}" failed count incremented to ${habit.failedCount}.`);
                }
            }
        });

        // Update the last check date in localStorage AFTER processing all habits
        localStorage.setItem('lastCheckYMD', todayYMD);

        return habitsModified; // Return true because check was performed
    };


    /** Saves habits to localStorage. */
    const saveHabits = () => {
        try {
            localStorage.setItem('habits', JSON.stringify(habits));
        } catch (error) {
            console.error("Error saving habits to localStorage:", error);
            // Consider a user-friendly notification
        }
    };

    /**
     * Renders the list of habits including their individual stats.
     */
    const renderHabits = () => {
        if (!habitListContainer) return;
        habitListContainer.innerHTML = '';

        if (habits.length === 0) {
            habitListContainer.innerHTML = '<p class="no-habits-message">Belum ada habit. Tambahkan satu yuk!</p>';
            return;
        }

        habits.forEach(habit => {
            const habitItem = document.createElement('div');
            habitItem.classList.add('habit-item');
            if (habit.checked) {
                habitItem.classList.add('highlighted');
            }
            habitItem.dataset.id = habit.id; // Store habit ID

            const checkColorClass = habit.color || 'orange-check';
            const checkboxClass = habit.checked ? 'checked' : '';
            const habitNameId = `habit-name-${habit.id}`; // Unique ID for aria-labelledby

            // Use textContent for safety
            const habitNameText = habit.name || 'Habit Tanpa Nama';
            const habitIconText = habit.icon || '🎯';

            habitItem.innerHTML = `
                <span class="icon" aria-hidden="true">${habitIconText}</span>
                <div class="habit-details">
                    <div class="habit-info" id="${habitNameId}">${habitNameText}</div>
                    <div class="habit-stats">
                        <span title="Runtutan Saat Ini">
                            <span class="stat-icon" aria-hidden="true">🔥</span>
                            ${habit.currentStreak}
                        </span>
                        <span title="Total Selesai">
                            <span class="stat-icon" aria-hidden="true">⭐</span>
                            ${habit.totalCompletions}
                        </span>
                        <span title="Gagal">
                            <span class="stat-icon" aria-hidden="true">❗</span>
                             ${habit.failedCount}
                         </span>
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="edit-btn" aria-label="Edit ${habitNameText}">✏️</button>
                    <button class="delete-btn" aria-label="Hapus ${habitNameText}">🗑️</button>
                </div>
                <div class="checkbox ${checkboxClass} ${checkColorClass}" role="checkbox" aria-checked="${habit.checked}" aria-labelledby="${habitNameId}" tabindex="0">
                   ${habit.checked ? '✓' : ''}
                </div>
            `;
            // Set tabindex -1 on action buttons to prevent them being focused when clicking the item
            habitItem.querySelectorAll('.edit-btn, .delete-btn').forEach(btn => btn.setAttribute('tabindex', '-1'));
            habitListContainer.appendChild(habitItem);
        });
    };

    /** Opens modal. */
    const openModal = (mode = 'add', habitData = null) => {
         if (!habitModal) return;
        habitForm.reset();
        habitIdInput.value = '';
        if (mode === 'edit' && habitData) {
            modalTitle.textContent = 'Edit Habit';
            habitIdInput.value = habitData.id;
            habitNameInput.value = habitData.name;
            habitIconInput.value = habitData.icon;
            saveHabitBtn.textContent = 'Update';
        } else {
            modalTitle.textContent = 'Tambah Habit Baru';
            saveHabitBtn.textContent = 'Simpan';
        }
        habitModal.style.display = 'block';
        habitModal.setAttribute('aria-hidden', 'false');
        habitNameInput.focus();
     };

    /** Closes modal. */
    const closeModal = () => {
        if (!habitModal) return;
        habitModal.style.display = 'none';
        habitModal.setAttribute('aria-hidden', 'true');
     };

    /**
     * Adds a new habit with initial stats.
     */
    const addHabit = (name, icon) => {
        const todayYMD = getYMD(new Date());
        const newHabit = {
            id: Date.now() + Math.random(), // Unique ID
            name: name,
            icon: icon || '🎯',
            color: getRandomCheckColor(),
            checked: false,
            totalCompletions: 0,
            currentStreak: 0,
            failedCount: 0,
            lastCompletedDate: null,
            createdAt: todayYMD
        };
        habits.push(newHabit);
        saveHabits();
        renderHabits();
        updateGlobalStats();
    };

    /**
     * Updates habit name/icon only.
     */
    const updateHabit = (id, name, icon) => {
        const habitIndex = habits.findIndex(h => h.id == id); // Use == for potential string/number ID comparison
        if (habitIndex > -1) {
            habits[habitIndex].name = name;
            habits[habitIndex].icon = icon || '🎯';
            saveHabits();
            renderHabits(); // Re-render to show name/icon change
        } else {
            console.error("Habit not found for update:", id);
        }
    };

    /** Deletes a habit. */
    const deleteHabit = (id) => {
        const habitToDelete = habits.find(h => h.id == id);
        const habitName = habitToDelete ? `"${habitToDelete.name}"` : "ini";
        if (confirm(`Yakin ingin menghapus habit ${habitName}? Statistiknya juga akan hilang.`)) {
            habits = habits.filter(h => h.id != id);
            saveHabits();
            renderHabits();
            updateGlobalStats();
        }
     };

    /**
     * Toggles the 'checked' status and updates relevant stats FOR TODAY.
     * Streak decreases are handled by the daily check.
     */
    const toggleHabitCheck = (id) => {
        const habitIndex = habits.findIndex(h => h.id == id);
        if (habitIndex === -1) {
            console.error("Habit not found for toggle:", id);
            return;
        }

        const habit = habits[habitIndex];
        const wasChecked = habit.checked;
        const todayYMD = getYMD(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayYMD = getYMD(yesterday);
        let previousCompletion = habit.lastCompletedDate; // Store state *before* toggle

        // Toggle the checked state for today
        habit.checked = !wasChecked;

        if (habit.checked) {
            // --- JUST MARKED AS COMPLETE ---
            // Only increment total/update date if it wasn't already marked complete today
            if (previousCompletion !== todayYMD) {
                habit.totalCompletions++;
                habit.lastCompletedDate = todayYMD;

                // Calculate streak
                if (previousCompletion === yesterdayYMD) {
                    habit.currentStreak++; // Continued streak
                } else {
                    habit.currentStreak = 1; // Started a new streak today
                }
                console.log(`Habit "${habit.name}" COMPLETE. Streak: ${habit.currentStreak}, Total: ${habit.totalCompletions}`);
            } else {
                 console.log(`Habit "${habit.name}" was already marked complete today. State unchanged.`);
            }


        } else {
            // --- JUST MARKED AS INCOMPLETE (Unchecked today) ---
            // Only revert changes if it *was* marked complete *today*
            if (previousCompletion === todayYMD) {
                 habit.totalCompletions--; // Decrement total safely

                 // Find the actual last completion date before today
                 // This is tricky without full history. Approximate based on streak:
                 let lastCompletionBeforeToday = null;
                 if (habit.currentStreak > 1) { // If streak was > 1, it must include yesterday
                     lastCompletionBeforeToday = yesterdayYMD;
                     habit.currentStreak--; // Revert the increment from today
                 } else if (habit.currentStreak === 1) { // If streak just started today
                     habit.currentStreak = 0; // Reset streak
                     // Keep lastCompletionBeforeToday as null (or find actual if possible)
                 }
                 // If streak was 0, it remains 0

                 habit.lastCompletedDate = lastCompletionBeforeToday;

                 console.log(`Habit "${habit.name}" UNCHECKED today. Total: ${habit.totalCompletions}, Streak: ${habit.currentStreak}, LastComp: ${habit.lastCompletedDate}`);
            } else {
                 console.log(`Habit "${habit.name}" was not marked complete today. State unchanged upon unchecking.`);
            }
             // If it wasn't completed today (lastCompletedDate !== todayYMD), unchecking does nothing to stats.
        }

        saveHabits();
        updateHabitItemDOM(id, habit); // Update specific item view
        updateGlobalStats(); // Update global stats if used
    };


    /**
     * Updates a single habit item in the DOM including stats.
     */
    const updateHabitItemDOM = (id, habitData) => {
        const habitItem = habitListContainer?.querySelector(`.habit-item[data-id="${id}"]`);
        if (!habitItem) return;

        // Update highlight
        habitItem.classList.toggle('highlighted', habitData.checked);

        // Update Checkbox
        const checkbox = habitItem.querySelector('.checkbox');
        if (checkbox) {
            const checkColorClass = habitData.color || 'orange-check';
            checkbox.className = `checkbox ${checkColorClass}`; // Base classes + specific color
            if (habitData.checked) {
                checkbox.classList.add('checked');
                checkbox.textContent = '✓';
            } else {
                checkbox.textContent = '';
            }
            checkbox.setAttribute('aria-checked', String(habitData.checked));
        }

        // Update Stats Display
        const statsContainer = habitItem.querySelector('.habit-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <span title="Runtutan Saat Ini">
                    <span class="stat-icon" aria-hidden="true">🔥</span>
                    ${habitData.currentStreak}
                </span>
                <span title="Total Selesai">
                    <span class="stat-icon" aria-hidden="true">⭐</span>
                     ${habitData.totalCompletions}
                 </span>
                <span title="Gagal">
                    <span class="stat-icon" aria-hidden="true">❗</span>
                    ${habitData.failedCount}
                </span>
            `;
        }

        // Update name in info div
        const infoDiv = habitItem.querySelector('.habit-info');
        if (infoDiv) {
            infoDiv.textContent = habitData.name;
        }

        // Update aria-labels on buttons
        const editBtn = habitItem.querySelector('.edit-btn');
        const deleteBtn = habitItem.querySelector('.delete-btn');
        if (editBtn) editBtn.setAttribute('aria-label', `Edit ${habitData.name}`);
        if (deleteBtn) deleteBtn.setAttribute('aria-label', `Hapus ${habitData.name}`);
    };


    /** Gets random color class. */
    const getRandomCheckColor = () => {
        const colors = ['orange-check', 'grey-check', 'blue-check', 'green-check', 'red-check'];
        return colors[Math.floor(Math.random() * colors.length)];
     };

    /** Updates GLOBAL statistics display. */
    const updateGlobalStats = () => {
        let totalCompletions = 0;
        let totalFailed = 0;
        let highestStreak = 0;

        habits.forEach(habit => {
            totalCompletions += habit.totalCompletions;
            totalFailed += habit.failedCount;
            if (habit.currentStreak > highestStreak) {
                highestStreak = habit.currentStreak;
            }
        });

        if (globalCompletedElement) globalCompletedElement.textContent = `${totalCompletions} Kali`;
        if (globalFailedElement) globalFailedElement.textContent = `${totalFailed} Hari`;
        if (globalStreakElement) globalStreakElement.textContent = `${highestStreak} Hari`;
    };

    // --- CORE FUNCTIONS (CALENDAR) ---
     const updateCalendarHeader = (year, month) => {
        if (calendarMonthYearElement) {
            calendarMonthYearElement.textContent = `${monthNames[month]} ${year}`;
        }
    };
     const renderCalendar = (year, month) => {
        if (!calendarGridContainer || !calendarMonthYearElement) return;
        calendarGridContainer.innerHTML = '';
        calendarGridContainer.setAttribute('aria-label', `Kalender untuk ${monthNames[month]} ${year}`);
        const firstDayOfMonthDate = new Date(year, month, 1);
        const firstDayOfMonth = firstDayOfMonthDate.getDay(); // Sunday = 0, Monday = 1, etc.
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const currentDay = today.getDate();
        const currentActualMonth = today.getMonth();
        const currentActualYear = today.getFullYear();

        // Adjust firstDayOfMonth: 0 (Sun) becomes 6, 1 (Mon) stays 0, etc. for SEN start
        const paddingDays = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        // Add padding days (empty cells before the 1st)
        for (let i = 0; i < paddingDays; i++) {
            const emptySpan = document.createElement('span');
            emptySpan.setAttribute('role', 'gridcell'); emptySpan.setAttribute('aria-hidden', 'true');
            calendarGridContainer.appendChild(emptySpan);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const daySpan = document.createElement('span');
            daySpan.textContent = day; daySpan.setAttribute('role', 'gridcell');
            if (day === currentDay && month === currentActualMonth && year === currentActualYear) {
                daySpan.classList.add('active-day'); daySpan.setAttribute('aria-current', 'date'); daySpan.setAttribute('title', 'Hari Ini');
            } else {
                 daySpan.setAttribute('aria-label', `${day} ${monthNames[month]} ${year}`);
            }
            calendarGridContainer.appendChild(daySpan);
        }
    };


    // --- EVENT LISTENERS SETUP ---
    // Add Habit Button
    addHabitBtn?.addEventListener('click', () => openModal('add'));
    // Modal Buttons
    closeModalBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    // Close modal on outside click
    window.addEventListener('click', (event) => { if (event.target === habitModal) closeModal(); });
    // Habit form submission
    habitForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = habitIdInput.value; const name = habitNameInput.value.trim(); const icon = habitIconInput.value.trim();
        if (!name) { alert('Nama habit tidak boleh kosong!'); habitNameInput.focus(); return; }
        if (id) { updateHabit(id, name, icon); } else { addHabit(name, icon); }
        closeModal();
    });


    // --- MODIFIKASI EVENT LISTENER KLIK HABIT ---
    // Habit list actions (delegation)
     if(habitListContainer) {
        habitListContainer.addEventListener('click', (event) => {
            const target = event.target;
            // Find the closest parent habit item
            const habitItem = target.closest('.habit-item');
            if (!habitItem) return; // Exit if click wasn't on an item or its descendant

            const habitId = habitItem.dataset.id; // Get ID from the habit item

            // Check if the click was specifically on the edit button
            if (target.closest('.edit-btn')) {
                 const habitToEdit = habits.find(h => h.id == habitId);
                 if (habitToEdit) openModal('edit', habitToEdit);
            // Check if the click was specifically on the delete button
            } else if (target.closest('.delete-btn')) {
                 deleteHabit(habitId);
            // Otherwise, treat the click as a toggle action for the habit
            } else {
                 toggleHabitCheck(habitId);
            }
        });

        // Keyboard accessibility for checkbox (TETAP SAMA, FOKUS PADA CHECKBOX)
        habitListContainer.addEventListener('keydown', (event) => {
            const target = event.target;
            // Only trigger if Enter or Space is pressed *while focusing the checkbox*
            if ((event.key === 'Enter' || event.key === ' ') && target.classList.contains('checkbox')) {
                event.preventDefault(); // Prevent default spacebar scroll or enter submit
                const habitItem = target.closest('.habit-item');
                if (habitItem) {
                    const habitId = habitItem.dataset.id;
                    toggleHabitCheck(habitId);
                }
            }
         });
     }
    // --- AKHIR MODIFIKASI EVENT LISTENER KLIK HABIT ---


    // Calendar Navigation Listeners
     prevMonthBtn?.addEventListener('click', () => {
        currentDisplayMonth--; if (currentDisplayMonth < 0) { currentDisplayMonth = 11; currentDisplayYear--; }
        updateCalendarHeader(currentDisplayYear, currentDisplayMonth); renderCalendar(currentDisplayYear, currentDisplayMonth);
     });
     nextMonthBtn?.addEventListener('click', () => {
        currentDisplayMonth++; if (currentDisplayMonth > 11) { currentDisplayMonth = 0; currentDisplayYear++; }
        updateCalendarHeader(currentDisplayYear, currentDisplayMonth); renderCalendar(currentDisplayYear, currentDisplayMonth);
     });

    // --- INITIALIZATION ---
    console.log("Initializing HabitHub...");
    loadHabits();         // Load habits & Run daily check if needed
    renderHabits();       // Display habits with stats
    updateGlobalStats();  // Update global stats display

    // Initialize Calendar
    updateCalendarHeader(currentDisplayYear, currentDisplayMonth);
    renderCalendar(currentDisplayYear, currentDisplayMonth);
    console.log("HabitHub Initialized.");

}); // End DOMContentLoaded