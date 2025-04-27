// Wait for the HTML document to be fully loaded and parsed
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    // Habit related
    const addHabitBtn = document.querySelector('.add-habit-btn'); // Tombol asli di header
    const habitModal = document.getElementById('habit-modal');
    const closeModalBtn = habitModal?.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const habitForm = document.getElementById('habit-form');
    const habitListContainer = document.getElementById('habit-list-container');
    const modalTitle = document.getElementById('modal-title');
    const habitIdInput = document.getElementById('habit-id');
    const habitNameInput = document.getElementById('habit-name');
    const habitIconInput = document.getElementById('habit-icon');
    const saveHabitBtn = document.getElementById('save-habit-btn');
    const addHabitHeaderBtn = document.getElementById('add-habit-header-btn'); // Tombol + di header

    // Global Stats Selectors
    const globalStreakElement = document.getElementById('global-streak');
    const globalFailedElement = document.getElementById('global-failed');
    const globalCompletedElement = document.getElementById('global-completed');

    // Calendar Selectors
    const calendarMonthYearElement = document.getElementById('calendar-month-year');
    const calendarGridContainer = document.getElementById('calendar-grid-container');
    const prevMonthBtn = document.getElementById('calendar-prev');
    const nextMonthBtn = document.getElementById('calendar-next');

    // Navigation Selectors
    const mainNav = document.getElementById('main-nav');
    const navLinks = mainNav?.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');
    const mainContentArea = document.querySelector('.main-content');
    const sidebarProfileTrigger = document.getElementById('sidebar-profile-trigger'); // Updated selector

    // History Selectors
    const historyListContainer = document.getElementById('history-list');

    // Profile Selectors
    const profileDetailsContainer = document.getElementById('profile-details');
    const profileImage = document.getElementById('profile-image');
    const editPictureBtn = document.querySelector('.edit-picture-btn');
    const imageUploadInput = document.getElementById('imageUpload');
    const profileUsernameInput = document.getElementById('profile-username');
    const profileFirstNameInput = document.getElementById('profile-first-name');
    const profileLastNameInput = document.getElementById('profile-last-name');
    const profileEmailInput = document.getElementById('profile-email');
    const profilePhoneInput = document.getElementById('profile-phone');
    const saveProfileBtn = profileDetailsContainer?.querySelector('.save-profile-btn');
    const saveStatusSpan = profileDetailsContainer?.querySelector('.save-status');
    const editFieldBtns = profileDetailsContainer?.querySelectorAll('.edit-field-btn');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarEmail = document.getElementById('sidebar-email');
    const changePasswordBtn = document.querySelector('.change-password-btn');
    const deleteAccountBtn = document.querySelector('.delete-account-btn');


    // --- Application State ---
    let habits = []; // Array of habit objects
    let userProfile = {}; // User profile object
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let currentDate = new Date(); // Today's actual date
    let currentDisplayYear = currentDate.getFullYear();
    let currentDisplayMonth = currentDate.getMonth(); // 0-indexed

    // --- Local Storage Keys ---
    const HABITS_KEY = 'habits_v2'; // Changed key to potentially reset old data structure
    const PROFILE_KEY = 'userProfile';
    const LAST_CHECK_KEY = 'lastCheckYMD_v2';

    // --- Helper Functions ---
    const getYMD = (date) => {
        if (!(date instanceof Date) || isNaN(date)) {
             console.error("Invalid date provided to getYMD:", date);
             return new Date().toISOString().split('T')[0]; // Fallback
         }
        return date.toISOString().split('T')[0];
    };

    const formatTimestamp = (ymdString) => {
        if (!ymdString) return '-';
        try {
            const date = new Date(ymdString + 'T00:00:00'); // Ensure it's parsed as local time
            const day = date.getDate();
            const month = monthNames[date.getMonth()].substring(0, 3); // Short month name
            const year = date.getFullYear();
            // Optional: Add time if you store it later
            // const hours = date.getHours().toString().padStart(2, '0');
            // const minutes = date.getMinutes().toString().padStart(2, '0');
            // return `${hours}:${minutes}<br>${day} ${month} ${year}`;
            return `${day} ${month} ${year}`;
        } catch (e) {
            console.error("Error formatting timestamp:", ymdString, e);
            return ymdString; // Fallback to raw string
        }
    };


    const getRandomCheckColor = () => {
        const colors = ['orange-check', 'grey-check', 'blue-check', 'green-check', 'red-check'];
        return colors[Math.floor(Math.random() * colors.length)];
     };

     const showSaveStatus = (message, isSuccess = true) => {
        if (!saveStatusSpan) return;
        saveStatusSpan.textContent = message;
        saveStatusSpan.className = `save-status ${isSuccess ? 'success' : 'error'}`;
        saveStatusSpan.style.display = 'inline';
        setTimeout(() => {
            saveStatusSpan.style.display = 'none';
        }, 3000); // Hide after 3 seconds
     };

    // --- CORE FUNCTIONS (PROFILE) ---
    const loadProfileData = () => {
        const storedProfile = localStorage.getItem(PROFILE_KEY);
        if (storedProfile) {
            try {
                userProfile = JSON.parse(storedProfile);
            } catch (error) {
                console.error("Error parsing profile data:", error);
                userProfile = getDefaultProfile();
            }
        } else {
            userProfile = getDefaultProfile();
        }
        // Ensure essential fields exist
        userProfile = { ...getDefaultProfile(), ...userProfile };
        saveProfileData(); // Save back to ensure structure is consistent
    };

    const getDefaultProfile = () => {
        return {
            username: "User123",
            firstName: "Nama",
            lastName: "User",
            email: "user@contoh.com",
            phone: "",
            profilePicture: null // Store as base64 Data URL
        };
    };

    const saveProfileData = () => {
        try {
            localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
            console.log("Profile data saved.");
            updateSidebarProfile(); // Update sidebar after saving
        } catch (error) {
            console.error("Error saving profile data:", error);
            showSaveStatus("Gagal menyimpan profil.", false);
        }
    };

    const renderProfile = () => {
        if (!profileDetailsContainer || !profileImage) return;

        profileUsernameInput.value = userProfile.username || '';
        profileFirstNameInput.value = userProfile.firstName || '';
        profileLastNameInput.value = userProfile.lastName || '';
        profileEmailInput.value = userProfile.email || '';
        profilePhoneInput.value = userProfile.phone || '';

        // Set profile picture
        profileImage.src = userProfile.profilePicture || 'assets/profile_placeholder.png';

        // Ensure all fields are initially readonly and buttons are not 'editing'
        profileDetailsContainer.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
            input.setAttribute('readonly', true);
            // For username, also disable it completely
            if (input.id === 'profile-username') {
                input.setAttribute('disabled', true);
            }
        });
        editFieldBtns?.forEach(btn => btn.classList.remove('editing'));
        saveProfileBtn.style.display = 'none'; // Hide save button initially
        saveProfileBtn.disabled = true; // Disable save button initially
    };

     const updateSidebarProfile = () => {
        if (!sidebarAvatar || !sidebarUsername || !sidebarEmail) return;
        sidebarAvatar.src = userProfile.profilePicture || 'assets/profile_placeholder.png';
        sidebarUsername.textContent = `${userProfile.firstName} ${userProfile.lastName}`.trim() || userProfile.username;
        sidebarEmail.textContent = userProfile.email;
    };

    const setupProfileInteractions = () => {
        if (!profileDetailsContainer) return;

        // Edit buttons for fields
        editFieldBtns?.forEach(button => {
            button.addEventListener('click', () => {
                const targetFieldIds = button.dataset.targetFields.split(',');
                let currentlyEditing = false;

                targetFieldIds.forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        if (input.hasAttribute('readonly')) {
                            input.removeAttribute('readonly');
                            currentlyEditing = true;
                        } else {
                            input.setAttribute('readonly', true);
                        }
                    }
                });

                button.classList.toggle('editing', currentlyEditing);

                // Show/hide Save button if any field is editable
                const anyEditable = Array.from(profileDetailsContainer.querySelectorAll('input:not([readonly])')).length > 0;
                saveProfileBtn.style.display = anyEditable ? 'inline-flex' : 'none';
                saveProfileBtn.disabled = !anyEditable;
            });
        });

        // Save Profile button
        saveProfileBtn?.addEventListener('click', () => {
            // Gather data
            const newProfileData = {
                username: profileUsernameInput.value, // Usually not editable, but read it just in case
                firstName: profileFirstNameInput.value.trim(),
                lastName: profileLastNameInput.value.trim(),
                email: profileEmailInput.value.trim(),
                phone: profilePhoneInput.value.trim(),
                profilePicture: userProfile.profilePicture // Keep existing picture unless changed by upload
            };

            // Basic email validation example
            if (newProfileData.email && !/\S+@\S+\.\S+/.test(newProfileData.email)) {
                 showSaveStatus("Format email tidak valid.", false);
                 profileEmailInput.focus();
                 return;
            }

            // Update state and save
            userProfile = { ...userProfile, ...newProfileData };
            saveProfileData();

            // Update UI: Set fields back to readonly, hide save button, show status
            profileDetailsContainer.querySelectorAll('input:not(#profile-username)').forEach(input => {
                input.setAttribute('readonly', true);
            });
            editFieldBtns?.forEach(btn => btn.classList.remove('editing'));
            saveProfileBtn.style.display = 'none';
            saveProfileBtn.disabled = true;
            showSaveStatus("Profil berhasil disimpan!", true);
        });

        // Profile Picture Upload
        editPictureBtn?.addEventListener('click', () => imageUploadInput?.click());

        imageUploadInput?.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageDataUrl = e.target?.result;
                    if (imageDataUrl) {
                        profileImage.src = imageDataUrl; // Preview
                        userProfile.profilePicture = imageDataUrl; // Update state
                        saveProfileData(); // Save immediately after selection
                        showSaveStatus("Foto profil diperbarui.", true);
                    } else {
                         showSaveStatus("Gagal membaca gambar.", false);
                    }
                }
                reader.onerror = () => {
                    showSaveStatus("Gagal memproses gambar.", false);
                };
                reader.readAsDataURL(file);
            }
        });

         // Placeholder listeners for other buttons
        changePasswordBtn?.addEventListener('click', () => {
             alert("Fungsi 'Ganti Password' belum diimplementasikan.");
         });
        deleteAccountBtn?.addEventListener('click', () => {
             if (confirm("Apakah Anda YAKIN ingin menghapus akun? Semua data habit dan profil akan hilang permanen.")) {
                 alert("Fungsi 'Hapus Akun' belum diimplementasikan. Data belum dihapus.");
                 // TODO: Implement account deletion logic (e.g., clear localStorage, call API)
             }
         });
    };


    // --- CORE FUNCTIONS (HISTORY) ---
    const loadAndRenderHistory = () => {
        if (!historyListContainer) return;

        historyListContainer.innerHTML = '<p class="loading-message">Memuat riwayat...</p>';

        // --- TEMPORARY: Use habit completion data for history ---
        // In a real app, history would likely be stored separately or fetched from an API.
        // We'll simulate history based on when habits were last marked complete.
        const historyEntries = [];
        habits.forEach(habit => {
            // Example: Add an entry for the last completion date
            if (habit.lastCompletedDate) {
                historyEntries.push({
                    date: habit.lastCompletedDate,
                    name: habit.name,
                    icon: habit.icon,
                    color: habit.color,
                    stats: { // We don't have historical stats per entry easily here
                        streak: '?', // This would require a more complex history structure
                        completions: '?',
                        failed: '?'
                    }
                });
            }
            // For a more complete history, you'd need to store each check/uncheck action:
            // habit.completionHistory = [ { date: '2023-01-15', checked: true }, { date: '2023-01-16', checked: true } ]
            // Then iterate through habit.completionHistory here.
        });

        // Sort entries by date, newest first
        historyEntries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        // Render
        if (historyEntries.length === 0) {
            historyListContainer.innerHTML = '<p class="no-history-message">Belum ada riwayat penyelesaian habit.</p>';
            return;
        }

        historyListContainer.innerHTML = ''; // Clear loading message
        historyEntries.forEach(entry => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-entry');

            // Note: Checkbox here is just visual representation of completion on that day.
            const checkColorClass = entry.color || 'orange-check'; // Use habit color
            const habitNameText = entry.name || 'Habit Tanpa Nama';
            const habitIconText = entry.icon || '🎯';

            historyItem.innerHTML = `
                <span class="icon" aria-hidden="true">${habitIconText}</span>
                <div class="habit-details">
                    <div class="habit-info">${habitNameText}</div>
                    </div>
                <div class="checkbox checked ${checkColorClass}" aria-hidden="true">✓</div> <div class="history-timestamp">${formatTimestamp(entry.date)}</div>
            `;
            historyListContainer.appendChild(historyItem);
        });
    };

    // --- CORE FUNCTIONS (HABITS - Updated) ---
    const loadHabits = () => {
        const storedHabits = localStorage.getItem(HABITS_KEY);
        if (storedHabits) {
            try {
                habits = JSON.parse(storedHabits);
                if (!Array.isArray(habits)) { habits = getDefaultHabits(); }
            } catch (error) { habits = getDefaultHabits(); }
        } else { habits = getDefaultHabits(); }

        const todayYMD = getYMD(new Date());
        // Ensure all habits have the required properties
        habits = habits.map(h => ({
            id: h.id || Date.now() + Math.random(), name: h.name || 'Unnamed Habit', icon: h.icon || '🎯',
            color: h.color || getRandomCheckColor(), checked: h.checked === true, // Ensure boolean
            totalCompletions: typeof h.totalCompletions === 'number' ? h.totalCompletions : 0,
            currentStreak: typeof h.currentStreak === 'number' ? h.currentStreak : 0,
            failedCount: typeof h.failedCount === 'number' ? h.failedCount : 0,
            lastCompletedDate: h.lastCompletedDate || null, createdAt: h.createdAt || todayYMD,
            completionHistory: Array.isArray(h.completionHistory) ? h.completionHistory : [] // Added for future use
        }));

        const dailyCheckPerformed = checkDailyResetAndMissedHabits();
        // Save back if defaults were set, structure was updated, or daily check modified habits
        if (dailyCheckPerformed || !storedHabits) { saveHabits(); }
    };

    const getDefaultHabits = () => {
        console.log("Setting default habits.");
        const now = Date.now(); const todayYMD = getYMD(new Date());
        return [
            { id: now + 1, name: 'Minum Air Putih', icon: '💧', color: 'blue-check', checked: false, totalCompletions: 0, currentStreak: 0, failedCount: 0, lastCompletedDate: null, createdAt: todayYMD, completionHistory: [] },
            { id: now + 2, name: 'Olahraga Ringan', icon: '🏃', color: 'green-check', checked: false, totalCompletions: 0, currentStreak: 0, failedCount: 0, lastCompletedDate: null, createdAt: todayYMD, completionHistory: [] },
        ];
    };

    const checkDailyResetAndMissedHabits = () => {
        const lastCheckYMD = localStorage.getItem(LAST_CHECK_KEY);
        const todayYMD = getYMD(new Date());
        if (lastCheckYMD === todayYMD) { return false; } // Already checked today

        console.log(`Performing daily check for ${todayYMD}. Last check: ${lastCheckYMD}.`);
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayYMD = getYMD(yesterday);
        let habitsModified = false;

        habits.forEach(habit => {
            // 1. Reset 'checked' status for the new day
            if(habit.checked) {
                habit.checked = false;
                habitsModified = true;
            }

            // 2. Check if the habit was missed yesterday (if it existed yesterday)
            // It's considered missed if it wasn't completed yesterday OR today (before this check)
            // and its last completion was *before* yesterday.
            if (habit.createdAt < todayYMD && habit.lastCompletedDate !== yesterdayYMD && habit.lastCompletedDate !== todayYMD) {
                 // Check if the last completion was *before* yesterday or never
                 if (habit.lastCompletedDate === null || habit.lastCompletedDate < yesterdayYMD) {
                    // Only increment failedCount and reset streak if it wasn't completed yesterday
                    if (habit.currentStreak > 0) {
                        console.log(`Habit "${habit.name}" streak broken.`);
                        habit.currentStreak = 0;
                        habitsModified = true;
                    }
                    // Increment failed count for the missed day (yesterday)
                    habit.failedCount++;
                    habitsModified = true;
                    console.log(`Habit "${habit.name}" failed count incremented to ${habit.failedCount} for missing ${yesterdayYMD}.`);

                     // Optionally record the failure in history
                     // habit.completionHistory.push({ date: yesterdayYMD, checked: false });
                }
            }
        });
        localStorage.setItem(LAST_CHECK_KEY, todayYMD);
        return habitsModified;
    };

    const saveHabits = () => {
        try { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); }
        catch (error) { console.error("Error saving habits:", error); }
    };

    const renderHabits = () => {
        if (!habitListContainer) return;
        habitListContainer.innerHTML = '';
        if (habits.length === 0) {
            habitListContainer.innerHTML = '<p class="no-habits-message">Belum ada habit. Tambahkan satu yuk!</p>'; return;
        }
        habits.forEach(habit => {
            const habitItem = document.createElement('div');
            habitItem.classList.add('habit-item');
            if (habit.checked) habitItem.classList.add('highlighted'); // Highlight if checked today
            habitItem.dataset.id = habit.id;
            const checkColorClass = habit.color || 'orange-check';
            const checkboxClass = habit.checked ? 'checked' : '';
            const habitNameId = `habit-name-${habit.id}`;
            const habitNameText = habit.name || 'Habit Tanpa Nama';
            const habitIconText = habit.icon || '🎯';

            habitItem.innerHTML = `
                <span class="icon" aria-hidden="true">${habitIconText}</span>
                <div class="habit-details">
                    <div class="habit-info" id="${habitNameId}">${habitNameText}</div>
                    <div class="habit-stats">
                        <span title="Runtutan"><span class="stat-icon" aria-hidden="true">🔥</span>${habit.currentStreak}</span>
                        <span title="Total Selesai"><span class="stat-icon" aria-hidden="true">⭐</span>${habit.totalCompletions}</span>
                        <span title="Gagal"><span class="stat-icon" aria-hidden="true">❗</span>${habit.failedCount}</span>
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="edit-btn" aria-label="Edit ${habitNameText}" tabindex="-1"><i class="fas fa-pencil-alt" aria-hidden="true"></i></button>
                    <button class="delete-btn" aria-label="Hapus ${habitNameText}" tabindex="-1"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>
                </div>
                <div class="checkbox ${checkboxClass} ${checkboxClass}" role="checkbox" aria-checked="${habit.checked}" aria-labelledby="${habitNameId}" tabindex="0">
                   ${habit.checked ? '✓' : ''}
                </div>`;
            habitListContainer.appendChild(habitItem);
        });
    };

    const openModal = (mode = 'add', habitData = null) => {
         if (!habitModal) return;
        habitForm.reset(); habitIdInput.value = '';
        if (mode === 'edit' && habitData) {
            modalTitle.textContent = 'Edit Habit'; habitIdInput.value = habitData.id;
            habitNameInput.value = habitData.name; habitIconInput.value = habitData.icon;
            saveHabitBtn.textContent = 'Update';
        } else {
            modalTitle.textContent = 'Tambah Habit Baru'; saveHabitBtn.textContent = 'Simpan';
        }
        habitModal.style.display = 'block'; habitModal.setAttribute('aria-hidden', 'false'); habitNameInput.focus();
     };

    const closeModal = () => {
        if (!habitModal) return;
        habitModal.style.display = 'none'; habitModal.setAttribute('aria-hidden', 'true');
     };

    const addHabit = (name, icon) => {
        const todayYMD = getYMD(new Date());
        const newHabit = {
            id: Date.now() + Math.random(), name: name, icon: icon || '🎯', color: getRandomCheckColor(),
            checked: false, totalCompletions: 0, currentStreak: 0, failedCount: 0, lastCompletedDate: null, createdAt: todayYMD,
            completionHistory: [] // Initialize history
        };
        habits.push(newHabit); saveHabits(); renderHabits(); updateGlobalStats();
    };

    const updateHabit = (id, name, icon) => {
        const habitIndex = habits.findIndex(h => h.id == id);
        if (habitIndex > -1) {
            habits[habitIndex].name = name; habits[habitIndex].icon = icon || '🎯';
            saveHabits(); renderHabits();
        } else { console.error("Habit not found for update:", id); }
    };

    const deleteHabit = (id) => {
        const habitToDelete = habits.find(h => h.id == id);
        const habitName = habitToDelete ? `"${habitToDelete.name}"` : "ini";
        if (confirm(`Yakin ingin menghapus habit ${habitName}? Riwayat dan statistiknya juga akan hilang.`)) {
            habits = habits.filter(h => h.id != id);
            saveHabits(); renderHabits(); updateGlobalStats();
            // If history page is active, refresh it
             if (document.getElementById('history-content')?.classList.contains('active')) {
                 loadAndRenderHistory();
            }
        }
     };

    const toggleHabitCheck = (id) => {
        const habitIndex = habits.findIndex(h => h.id == id);
        if (habitIndex === -1) return;
        const habit = habits[habitIndex]; const wasChecked = habit.checked;
        const todayYMD = getYMD(new Date());
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); const yesterdayYMD = getYMD(yesterday);
        let previousCompletion = habit.lastCompletedDate;

        // Toggle checked state for today
        habit.checked = !wasChecked;

        // Update stats based on the toggle action
        if (habit.checked) { // Just marked complete for today
            // Only update stats if it wasn't already marked complete today previously
            if (previousCompletion !== todayYMD) {
                habit.totalCompletions++;
                habit.lastCompletedDate = todayYMD;
                // Check if streak continues from yesterday
                habit.currentStreak = (previousCompletion === yesterdayYMD) ? habit.currentStreak + 1 : 1;
                 // Record completion in history
                 // habit.completionHistory = habit.completionHistory.filter(entry => entry.date !== todayYMD); // Remove previous entry for today if any
                 // habit.completionHistory.push({ date: todayYMD, checked: true });
            }
        } else { // Just marked incomplete for today
             // Only revert stats if it WAS marked complete earlier today
            if (previousCompletion === todayYMD) {
                 habit.totalCompletions--;
                 // Determine the last completion date *before* today
                 let lastCompletionBeforeToday = null;
                 if (habit.currentStreak > 1) { // If streak was > 1, it must have completed yesterday
                      lastCompletionBeforeToday = yesterdayYMD;
                      habit.currentStreak--; // Decrease streak back
                 } else if (habit.currentStreak === 1) { // If streak was 1, it means only completed today
                      habit.currentStreak = 0;
                 } else { // Streak was 0, no change needed to streak
                 }
                 habit.lastCompletedDate = lastCompletionBeforeToday; // Revert last completed date

                  // Record un-completion in history (or remove completion)
                  // habit.completionHistory = habit.completionHistory.filter(entry => entry.date !== todayYMD);
                  // habit.completionHistory.push({ date: todayYMD, checked: false }); // Optional: record failure
            }
        }
        saveHabits(); updateHabitItemDOM(id, habit); updateGlobalStats();
         // If history page is active, refresh it (as lastCompletedDate might change)
         if (document.getElementById('history-content')?.classList.contains('active')) {
             loadAndRenderHistory();
        }
    };

    const updateHabitItemDOM = (id, habitData) => {
        const habitItem = habitListContainer?.querySelector(`.habit-item[data-id="${id}"]`);
        if (!habitItem) return;
        habitItem.classList.toggle('highlighted', habitData.checked);
        const checkbox = habitItem.querySelector('.checkbox');
        if (checkbox) {
            const checkColorClass = habitData.color || 'orange-check';
            // Reset classes first
            checkbox.className = 'checkbox';
            checkbox.classList.add(checkColorClass); // Add color class
            if (habitData.checked) {
                checkbox.classList.add('checked'); // Add checked class if applicable
                checkbox.textContent = '✓';
            }
            else { checkbox.textContent = ''; }
            checkbox.setAttribute('aria-checked', String(habitData.checked));
        }
        const statsContainer = habitItem.querySelector('.habit-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <span title="Runtutan"><span class="stat-icon">🔥</span>${habitData.currentStreak}</span>
                <span title="Total Selesai"><span class="stat-icon">⭐</span>${habitData.totalCompletions}</span>
                <span title="Gagal"><span class="stat-icon">❗</span>${habitData.failedCount}</span>`;
        }
        // Update labels for accessibility/tooltips if name changed (via edit)
        const infoDiv = habitItem.querySelector('.habit-info'); if (infoDiv) { infoDiv.textContent = habitData.name; }
        const editBtn = habitItem.querySelector('.edit-btn'); if (editBtn) editBtn.setAttribute('aria-label', `Edit ${habitData.name}`);
        const deleteBtn = habitItem.querySelector('.delete-btn'); if (deleteBtn) deleteBtn.setAttribute('aria-label', `Hapus ${habitData.name}`);
    };


    const updateGlobalStats = () => {
        let totalCompletions = 0, totalFailed = 0, highestStreak = 0;
        habits.forEach(habit => {
            totalCompletions += habit.totalCompletions; totalFailed += habit.failedCount;
            if (habit.currentStreak > highestStreak) highestStreak = habit.currentStreak;
        });
        if (globalCompletedElement) globalCompletedElement.textContent = `${totalCompletions} Kali`;
        if (globalFailedElement) globalFailedElement.textContent = `${totalFailed} Hari`;
        if (globalStreakElement) globalStreakElement.textContent = `${highestStreak} Hari`;
    };

    // --- CORE FUNCTIONS (CALENDAR) ---
     const updateCalendarHeader = (year, month) => {
        if (calendarMonthYearElement) calendarMonthYearElement.textContent = `${monthNames[month]} ${year}`;
    };
     const renderCalendar = (year, month) => {
        if (!calendarGridContainer || !calendarMonthYearElement) return;
        calendarGridContainer.innerHTML = ''; calendarGridContainer.setAttribute('aria-label', `Kalender ${monthNames[month]} ${year}`);
        const firstDayOfMonthDate = new Date(year, month, 1); const firstDayOfMonth = firstDayOfMonthDate.getDay(); // 0=Sun, 1=Mon,...
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date(); const currentDay = today.getDate(); const currentActualMonth = today.getMonth(); const currentActualYear = today.getFullYear();

        // Calculate padding days (assuming Monday is the first day of the week)
        const paddingDays = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1; // If Sunday is 0, needs 6 padding days

        for (let i = 0; i < paddingDays; i++) { const emptySpan = document.createElement('span'); emptySpan.setAttribute('role', 'gridcell'); emptySpan.setAttribute('aria-hidden', 'true'); calendarGridContainer.appendChild(emptySpan); }

        for (let day = 1; day <= daysInMonth; day++) {
            const daySpan = document.createElement('span'); daySpan.textContent = day; daySpan.setAttribute('role', 'gridcell');
            if (day === currentDay && month === currentActualMonth && year === currentActualYear) { daySpan.classList.add('active-day'); daySpan.setAttribute('aria-current', 'date'); daySpan.setAttribute('title', 'Hari Ini'); }
            else { daySpan.setAttribute('aria-label', `${day} ${monthNames[month]} ${year}`); }
            // TODO: Add indicators for habit completion on this day (requires checking history)
            calendarGridContainer.appendChild(daySpan);
        }
    };

    // --- FUNCTIONS FOR SINGLE PAGE NAVIGATION ---
    const showContentSection = (targetId) => {
        if (!mainContentArea || !contentSections) return;
        const currentActiveClass = Array.from(mainContentArea.classList).find(c => c.startsWith('showing-'));
        if (currentActiveClass) mainContentArea.classList.remove(currentActiveClass);
        mainContentArea.classList.add(`showing-${targetId.replace('-content', '')}`);

        contentSections.forEach(section => {
            section.classList.toggle('active', section.id === targetId);
        });
        updateMainHeader(targetId);

        // Trigger specific actions when a section becomes active
        if (targetId === 'dashboard-content') {
            renderHabits(); updateGlobalStats(); // Refresh dashboard view
        } else if (targetId === 'history-content') {
            loadAndRenderHistory();
        } else if (targetId === 'profile-content') {
            loadProfileData(); // Load latest data
            renderProfile(); // Render the loaded data
            setupProfileInteractions(); // Re-attach listeners if needed (or ensure they delegate)
        }
    };

    const updateMainHeader = (activeSectionId) => {
        if (!mainTitle || !mainSubtitle) return;
        let title = 'Dashboard'; let subtitle = 'Habit hari ini';
        switch (activeSectionId) {
            case 'history-content': title = 'Riwayat'; subtitle = 'Lihat kembali progres habit Anda.'; break;
            case 'profile-content': title = 'Profil Akun'; subtitle = 'Kelola informasi akun Anda.'; break;
            // Removed 'tips-content' case
        }
        mainTitle.textContent = title; mainSubtitle.textContent = subtitle;
    };


    // --- EVENT LISTENERS SETUP ---
    // Modal Buttons
    closeModalBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === habitModal) closeModal(); });

    // Habit form submission
    habitForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = habitIdInput.value; const name = habitNameInput.value.trim(); const icon = habitIconInput.value.trim();
        if (!name) { alert('Nama habit tidak boleh kosong!'); habitNameInput.focus(); return; }
        if (id) { updateHabit(id, name, icon); } else { addHabit(name, icon); }
        closeModal();
    });

    // Habit list actions (delegation for check, edit, delete)
     if(habitListContainer) {
        habitListContainer.addEventListener('click', (event) => {
            const target = event.target;
            // Find the closest ancestor which is a button *inside* .habit-actions OR the checkbox itself OR the habit item
            const editButton = target.closest('.edit-btn');
            const deleteButton = target.closest('.delete-btn');
            const habitItem = target.closest('.habit-item'); // The main item container

            if (!habitItem) return; // Click outside any habit item

            const habitId = habitItem.dataset.id;

            if (editButton) { // Clicked Edit Button
                 const habitToEdit = habits.find(h => h.id == habitId);
                 if (habitToEdit) openModal('edit', habitToEdit);
            } else if (deleteButton) { // Clicked Delete Button
                 deleteHabit(habitId);
            } else if (target.closest('.checkbox') || target === habitItem || target.closest('.habit-details') || target.closest('.icon')) {
                // Clicked the checkbox, or anywhere else on the item that isn't edit/delete
                 toggleHabitCheck(habitId);
            }
        });
        // Keyboard accessibility for checkbox
        habitListContainer.addEventListener('keydown', (event) => {
            const target = event.target;
            if ((event.key === 'Enter' || event.key === ' ') && target.classList.contains('checkbox')) {
                event.preventDefault(); // Prevent page scroll on space
                const habitItem = target.closest('.habit-item');
                if (habitItem) toggleHabitCheck(habitItem.dataset.id);
            }
         });
     }

    // Calendar Navigation Listeners
     prevMonthBtn?.addEventListener('click', () => {
        currentDisplayMonth--; if (currentDisplayMonth < 0) { currentDisplayMonth = 11; currentDisplayYear--; }
        updateCalendarHeader(currentDisplayYear, currentDisplayMonth); renderCalendar(currentDisplayYear, currentDisplayMonth);
     });
     nextMonthBtn?.addEventListener('click', () => {
        currentDisplayMonth++; if (currentDisplayMonth > 11) { currentDisplayMonth = 0; currentDisplayYear++; }
        updateCalendarHeader(currentDisplayYear, currentDisplayMonth); renderCalendar(currentDisplayYear, currentDisplayMonth);
     });

     // Header Add Habit Button Listener
     addHabitHeaderBtn?.addEventListener('click', () => openModal('add'));

    // Sidebar Navigation Listener
    if (mainNav) {
        mainNav.addEventListener('click', (event) => {
            const link = event.target.closest('.nav-link');
            if (link?.dataset.target) {
                event.preventDefault();
                const targetId = link.dataset.target;
                if (navLinks) {
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    link.classList.add('active');
                }
                showContentSection(targetId);
                // Optional: Update URL hash
                // window.location.hash = link.getAttribute('href');
            }
        });
    }

    // Sidebar User Profile Area Listener - Navigate to Profile Section
    if (sidebarProfileTrigger) {
        sidebarProfileTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = 'profile-content';
            const profileNavLink = mainNav?.querySelector(`.nav-link[data-target="${targetId}"]`);

            // Update active link state in the main nav
            if (navLinks) {
                 navLinks.forEach(navLink => navLink.classList.remove('active'));
                 // Try to find the actual Profile link if it exists, otherwise just deactivate others
                 const actualProfileNavLink = mainNav?.querySelector(`.nav-link[data-target="profile-content"]`);
                 actualProfileNavLink?.classList.add('active');
            }

            showContentSection(targetId);
            // Optional: Update URL hash
            // const href = profileNavLink?.getAttribute('href') || '#profile';
            // window.location.hash = href;
        });
    }

    // --- INITIALIZATION ---
    console.log("Initializing HabitHub (Single Page)...");
    loadProfileData(); // Load profile first to update sidebar immediately
    updateSidebarProfile();
    loadHabits(); // Load habit data (includes daily check)

    // Determine initial section based on hash or default to dashboard
    const initialHash = window.location.hash.substring(1);
    let initialTargetId = 'dashboard-content'; // Default target
    let activeLinkFound = false;

    if (initialHash && navLinks) {
        const initialLink = mainNav?.querySelector(`.nav-link[href="#${initialHash}"]`);
        if (initialLink?.dataset.target && document.getElementById(initialLink.dataset.target)) { // Check if target exists
            initialTargetId = initialLink.dataset.target;
            navLinks.forEach(navLink => navLink.classList.remove('active')); // Deactivate all
            initialLink.classList.add('active'); // Activate the target link
            activeLinkFound = true;
        }
    }

    // If no valid hash or link found, ensure dashboard link is active
    if (!activeLinkFound && navLinks) {
         navLinks.forEach(navLink => navLink.classList.remove('active')); // Deactivate all
         mainNav?.querySelector('.nav-link[data-target="dashboard-content"]')?.classList.add('active'); // Activate dashboard link
    }

    showContentSection(initialTargetId); // Show the initial or default section

    // Initial render for elements always visible on dashboard (Calendar)
    updateCalendarHeader(currentDisplayYear, currentDisplayMonth);
    renderCalendar(currentDisplayYear, currentDisplayMonth);

    console.log("HabitHub Initialized.");

}); // End DOMContentLoaded