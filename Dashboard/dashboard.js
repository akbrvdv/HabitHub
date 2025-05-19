document.addEventListener("DOMContentLoaded", () => {
  const addHabitBtn = document.querySelector(".add-habit-btn");
  const habitModal = document.getElementById("habit-modal");
  const closeModalBtn = habitModal?.querySelector(".close-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const habitForm = document.getElementById("habit-form");
  const habitListContainer = document.getElementById("habit-list-container");
  const modalTitle = document.getElementById("modal-title");
  const habitIdInput = document.getElementById("habit-id");
  const habitNameInput = document.getElementById("habit-name");
  const habitIconInput = document.getElementById("habit-icon");
  const saveHabitBtn = document.getElementById("save-habit-btn");
  const addHabitHeaderBtn = document.getElementById("add-habit-header-btn");

  const globalStreakElement = document.getElementById("global-streak");
  const globalFailedElement = document.getElementById("global-failed");
  const globalCompletedElement = document.getElementById("global-completed");

  const calendarMonthYearElement = document.getElementById(
    "calendar-month-year"
  );
  const calendarGridContainer = document.getElementById(
    "calendar-grid-container"
  );
  const prevMonthBtn = document.getElementById("calendar-prev");
  const nextMonthBtn = document.getElementById("calendar-next");

  const mainNav = document.getElementById("main-nav");
  const navLinks = mainNav?.querySelectorAll(".nav-link");
  const contentSections = document.querySelectorAll(".content-section");
  const mainTitle = document.getElementById("main-title");
  const mainSubtitle = document.getElementById("main-subtitle");
  const mainContentArea = document.querySelector(".main-content");
  const sidebarProfileTrigger = document.getElementById(
    "sidebar-profile-trigger"
  );

  const historyListContainer = document.getElementById("history-list");

  const profileDetailsContainer = document.getElementById("profile-details");
  const profileImage = document.getElementById("profile-image");
  const editPictureBtn = document.querySelector(".edit-picture-btn");
  const imageUploadInput = document.getElementById("imageUpload");
  const profileUsernameInput = document.getElementById("profile-username");
  const profileFirstNameInput = document.getElementById("profile-first-name");
  const profileLastNameInput = document.getElementById("profile-last-name");
  const profileEmailInput = document.getElementById("profile-email");
  const profilePhoneInput = document.getElementById("profile-phone");
  const saveProfileBtn =
    profileDetailsContainer?.querySelector(".save-profile-btn");
  const saveStatusSpan = profileDetailsContainer?.querySelector(".save-status");
  const editFieldBtns =
    profileDetailsContainer?.querySelectorAll(".edit-field-btn");
  const sidebarAvatar = document.getElementById("sidebar-avatar");
  const sidebarUsername = document.getElementById("sidebar-username");
  const sidebarEmail = document.getElementById("sidebar-email");
  const changePasswordBtn = document.querySelector(".change-password-btn");
  const deleteAccountBtn = document.querySelector(".delete-account-btn");

  let habits = []; // Array of habit objects, will be fetched from server
  let userProfile = {}; // User profile object, will be fetched from server
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  let currentDate = new Date();
  let currentDisplayYear = currentDate.getFullYear();
  let currentDisplayMonth = currentDate.getMonth();

  const API_BASE_URL = "dashboard.php";

  const getYMD = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error("Invalid date provided to getYMD:", date);
      return new Date().toISOString().split("T")[0]; // Fallback
    }
    return date.toISOString().split("T")[0];
  };

  const formatTimestamp = (ymdStringOrDate) => {
    if (!ymdStringOrDate) return "-";
    try {
      let date;
      if (typeof ymdStringOrDate === "string") {
        if (ymdStringOrDate.length === 10) {
          date = new Date(ymdStringOrDate + "T00:00:00");
        } else {
          date = new Date(ymdStringOrDate); // Assume it's a full ISO string or parsable
        }
      } else if (ymdStringOrDate instanceof Date) {
        date = ymdStringOrDate;
      } else {
        return String(ymdStringOrDate); // Fallback
      }

      if (isNaN(date.getTime())) {
        console.error("Invalid date for formatting:", ymdStringOrDate);
        return String(ymdStringOrDate); // Fallback
      }

      const day = date.getDate();
      const month = monthNames[date.getMonth()].substring(0, 3);
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      console.error("Error formatting timestamp:", ymdStringOrDate, e);
      return String(ymdStringOrDate); // Fallback
    }
  };

  const getRandomCheckColor = () => {
    const colors = [
      "orange-check",
      "grey-check",
      "blue-check",
      "green-check",
      "red-check",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const showSaveStatus = (message, isSuccess = true) => {
    if (!saveStatusSpan) return;
    saveStatusSpan.textContent = message;
    saveStatusSpan.className = `save-status ${isSuccess ? "success" : "error"}`;
    saveStatusSpan.style.display = "inline";
    setTimeout(() => {
      saveStatusSpan.style.display = "none";
    }, 3000);
  };

  // --- CORE FUNCTIONS (PROFILE) ---
  const loadProfileData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}?action=load_profile`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      userProfile = data || getDefaultProfile(); // Use fetched data or default
      renderProfile();
      updateSidebarProfile();
    } catch (error) {
      console.error("Error loading profile data:", error);
      userProfile = getDefaultProfile(); // Fallback to default on error
      renderProfile();
      updateSidebarProfile();
      showSaveStatus("Gagal memuat profil.", false);
    }
  };

  const getDefaultProfile = () => {
    return {
      username: "User123",
      firstName: "Nama",
      lastName: "User",
      email: "user@contoh.com",
      phone: "",
      profilePicturePath: "assets/profile_placeholder.png", // Default path
    };
  };

  // No saveProfileData() on client, all saves go through server
  // renderProfile and updateSidebarProfile remain similar but use profilePicturePath

  const renderProfile = () => {
    if (!profileDetailsContainer || !profileImage) return;

    profileUsernameInput.value = userProfile.username || "";
    profileFirstNameInput.value = userProfile.firstName || "";
    profileLastNameInput.value = userProfile.lastName || "";
    profileEmailInput.value = userProfile.email || "";
    profilePhoneInput.value = userProfile.phone || "";
    profileImage.src =
      userProfile.profilePicturePath || "assets/profile_placeholder.png";

    profileDetailsContainer
      .querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"]'
      )
      .forEach((input) => {
        input.setAttribute("readonly", true);
        if (input.id === "profile-username") {
          input.setAttribute("disabled", true);
        }
      });
    editFieldBtns?.forEach((btn) => btn.classList.remove("editing"));
    saveProfileBtn.style.display = "none";
    saveProfileBtn.disabled = true;
  };

  const updateSidebarProfile = () => {
    if (!sidebarAvatar || !sidebarUsername || !sidebarEmail) return;
    sidebarAvatar.src =
      userProfile.profilePicturePath || "assets/profile_placeholder.png";
    sidebarUsername.textContent =
      `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() ||
      userProfile.username ||
      "Nama User";
    sidebarEmail.textContent = userProfile.email || "email@contoh.com";
  };

  const setupProfileInteractions = () => {
    if (!profileDetailsContainer) return;

    editFieldBtns?.forEach((button) => {
      button.addEventListener("click", () => {
        const targetFieldIds = button.dataset.targetFields.split(",");
        let currentlyEditing = false;
        targetFieldIds.forEach((id) => {
          const input = document.getElementById(id);
          if (input) {
            if (input.hasAttribute("readonly")) {
              input.removeAttribute("readonly");
              currentlyEditing = true;
            } else {
              input.setAttribute("readonly", true);
            }
          }
        });
        button.classList.toggle("editing", currentlyEditing);
        const anyEditable =
          Array.from(
            profileDetailsContainer.querySelectorAll("input:not([readonly])")
          ).length > 0;
        saveProfileBtn.style.display = anyEditable ? "inline-flex" : "none";
        saveProfileBtn.disabled = !anyEditable;
      });
    });

    saveProfileBtn?.addEventListener("click", async () => {
      const formData = new FormData();
      formData.append("action", "save_profile");
      formData.append("firstName", profileFirstNameInput.value.trim());
      formData.append("lastName", profileLastNameInput.value.trim());
      formData.append("email", profileEmailInput.value.trim());
      formData.append("phone", profilePhoneInput.value.trim());

      // If a new image was selected using the file input
      if (imageUploadInput.files && imageUploadInput.files[0]) {
        formData.append("profilePictureFile", imageUploadInput.files[0]);
      } else if (userProfile.newProfilePictureBase64) {
        // If a base64 image was prepared (e.g., from a cropper, not fully implemented here but placeholder for logic)
        formData.append(
          "profilePictureBase64",
          userProfile.newProfilePictureBase64
        );
      } else {
        // Keep existing picture if no new one is uploaded explicitly
        // The server side needs to know not to overwrite path if no file/base64 is sent
        // Or send current path to indicate "no change" if that's how backend handles it
        if (userProfile.profilePicturePath)
          formData.append("profilePicturePath", userProfile.profilePicturePath);
      }

      // Basic email validation
      if (
        formData.get("email") &&
        !/\S+@\S+\.\S+/.test(formData.get("email"))
      ) {
        showSaveStatus("Format email tidak valid.", false);
        profileEmailInput.focus();
        return;
      }

      try {
        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

        const response = await fetch(API_BASE_URL, {
          method: "POST",
          body: formData, // FormData handles multipart/form-data for file uploads
        });
        const result = await response.json();

        if (result.success) {
          showSaveStatus(result.message || "Profil berhasil disimpan!", true);
          userProfile.firstName = formData.get("firstName");
          userProfile.lastName = formData.get("lastName");
          userProfile.email = formData.get("email");
          userProfile.phone = formData.get("phone");
          if (result.newProfilePicturePath) {
            userProfile.profilePicturePath = result.newProfilePicturePath;
          }
          delete userProfile.newProfilePictureBase64; // Clear temp base64
          imageUploadInput.value = ""; // Clear file input

          renderProfile(); // Re-render to set fields to readonly and update image
          updateSidebarProfile(); // Update sidebar too
        } else {
          showSaveStatus(result.message || "Gagal menyimpan profil.", false);
        }
      } catch (error) {
        console.error("Error saving profile:", error);
        showSaveStatus(
          "Terjadi kesalahan koneksi saat menyimpan profil.",
          false
        );
      } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.innerHTML =
          '<i class="fas fa-save"></i> Simpan Perubahan';
        // Hide save button and reset editing state
        profileDetailsContainer
          .querySelectorAll("input:not(#profile-username)")
          .forEach((input) => {
            input.setAttribute("readonly", true);
          });
        editFieldBtns?.forEach((btn) => btn.classList.remove("editing"));
        saveProfileBtn.style.display = "none";
      }
    });

    editPictureBtn?.addEventListener("click", () => imageUploadInput?.click());
    imageUploadInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDataUrl = e.target?.result;
          if (imageDataUrl) {
            profileImage.src = imageDataUrl; // Preview
            saveProfileBtn.style.display = "inline-flex";
            saveProfileBtn.disabled = false;
          } else {
            showSaveStatus("Gagal membaca gambar.", false);
          }
        };
        reader.onerror = () => {
          showSaveStatus("Gagal memproses gambar.", false);
        };
        reader.readAsDataURL(file);
      }
    });

    changePasswordBtn?.addEventListener("click", () => {
      alert("Fungsi 'Ganti Password' belum diimplementasikan.");
    });
    deleteAccountBtn?.addEventListener("click", () => {
      if (
        confirm(
          "Apakah Anda YAKIN ingin menghapus akun? Semua data habit dan profil akan hilang permanen."
        )
      ) {
        alert(
          "Fungsi 'Hapus Akun' belum diimplementasikan. Data belum dihapus."
        );
      }
    });
  };

  // --- CORE FUNCTIONS (HISTORY) ---
  const loadAndRenderHistory = async () => {
    if (!historyListContainer) return;
    historyListContainer.innerHTML =
      '<p class="loading-message">Memuat riwayat...</p>';

    try {
      const response = await fetch(`${API_BASE_URL}?action=load_history`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const historyEntries = await response.json();

      if (!Array.isArray(historyEntries)) {
        throw new Error("Data riwayat tidak valid.");
      }

      if (historyEntries.length === 0) {
        historyListContainer.innerHTML =
          '<p class="no-history-message">Belum ada riwayat penyelesaian habit.</p>';
        return;
      }

      historyListContainer.innerHTML = ""; // Clear loading message
      historyEntries.forEach((entry) => {
        const historyItem = document.createElement("div");
        historyItem.classList.add("history-entry");
        const checkColorClass = entry.color || "orange-check";
        const habitNameText = entry.name || "Habit Tanpa Nama";
        const habitIconText = entry.icon || "🎯";

        const formattedDate = formatTimestamp(entry.date);

        historyItem.innerHTML = `
            <span class="icon" aria-hidden="true">${habitIconText}</span>
            <div class="habit-details">
                <div class="habit-info">${habitNameText}</div>
            </div>
            <div class="checkbox checked ${checkColorClass}" aria-hidden="true">✓</div>
            <div class="history-timestamp">${formattedDate}</div>`;
        historyListContainer.appendChild(historyItem);
      });
    } catch (error) {
      console.error("Error loading history:", error);
      historyListContainer.innerHTML = `<p class="no-history-message">Gagal memuat riwayat: ${error.message}</p>`;
    }
  };

  // --- CORE FUNCTIONS (HABITS) ---
  const loadHabits = async () => {
    if (!habitListContainer) return;
    habitListContainer.innerHTML =
      '<p class="no-habits-message">Memuat habit...</p>';
    try {
      const response = await fetch(`${API_BASE_URL}?action=load_habits`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      habits = Array.isArray(data) ? data : []; // Ensure habits is an array
      renderHabits();
      updateGlobalStats(); // Fetch global stats after habits are loaded
    } catch (error) {
      console.error("Error loading habits:", error);
      habits = []; // Reset habits on error
      renderHabits(); // Render empty state
      updateGlobalStats(); // Update stats to show 0 or error
      habitListContainer.innerHTML = `<p class="no-habits-message">Gagal memuat habit: ${error.message}</p>`;
    }
  };

  const renderHabits = () => {
    if (!habitListContainer) return;
    habitListContainer.innerHTML = "";
    if (habits.length === 0) {
      habitListContainer.innerHTML =
        '<p class="no-habits-message">Belum ada habit. Tambahkan satu yuk!</p>';
      return;
    }
    habits.forEach((habit) => {
      const habitItem = document.createElement("div");
      habitItem.classList.add("habit-item");
      if (habit.checked) habitItem.classList.add("highlighted");
      habitItem.dataset.id = habit.id;
      const checkColorClass = habit.color || "orange-check";
      const checkboxClass = habit.checked ? "checked" : "";
      const habitNameId = `habit-name-${habit.id}`;
      const habitNameText = habit.name || "Habit Tanpa Nama";
      const habitIconText = habit.icon || "🎯";

      habitItem.innerHTML = `
          <span class="icon" aria-hidden="true">${habitIconText}</span>
          <div class="habit-details">
              <div class="habit-info" id="${habitNameId}">${habitNameText}</div>
              <div class="habit-stats">
                  <span title="Runtutan"><span class="stat-icon" aria-hidden="true">🔥</span>${
                    habit.currentStreak || 0
                  }</span>
                  <span title="Total Selesai"><span class="stat-icon" aria-hidden="true">⭐</span>${
                    habit.totalCompletions || 0
                  }</span>
                  <span title="Gagal"><span class="stat-icon" aria-hidden="true">❗</span>${
                    habit.failedCount || 0
                  }</span>
              </div>
          </div>
          <div class="habit-actions">
              <button class="edit-btn" aria-label="Edit ${habitNameText}" tabindex="-1"><i class="fas fa-pencil-alt" aria-hidden="true"></i></button>
              <button class="delete-btn" aria-label="Hapus ${habitNameText}" tabindex="-1"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>
          </div>
          <div class="checkbox ${checkboxClass} ${checkColorClass}" role="checkbox" aria-checked="${
        habit.checked
      }" aria-labelledby="${habitNameId}" tabindex="0">
             ${habit.checked ? "✓" : ""}
          </div>`;
      habitListContainer.appendChild(habitItem);
    });
  };

  const openModal = (mode = "add", habitData = null) => {
    if (!habitModal) return;
    habitForm.reset();
    habitIdInput.value = "";
    if (mode === "edit" && habitData) {
      modalTitle.textContent = "Edit Habit";
      habitIdInput.value = habitData.id;
      habitNameInput.value = habitData.name;
      habitIconInput.value = habitData.icon;
      saveHabitBtn.textContent = "Update";
    } else {
      modalTitle.textContent = "Tambah Habit Baru";
      saveHabitBtn.textContent = "Simpan";
    }
    habitModal.style.display = "block";
    habitModal.setAttribute("aria-hidden", "false");
    habitNameInput.focus();
  };

  const closeModal = () => {
    if (!habitModal) return;
    habitModal.style.display = "none";
    habitModal.setAttribute("aria-hidden", "true");
  };

  const addHabit = async (name, icon) => {
    const formData = new FormData();
    formData.append("action", "add_habit");
    formData.append("name", name);
    formData.append("icon", icon || "🎯");
    formData.append("color", getRandomCheckColor()); // Server can also assign default

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success && result.habit) {
        habits.push(result.habit); // Add new habit with server-assigned ID and full data
        renderHabits();
        updateGlobalStats();
      } else {
        alert(`Gagal menambahkan habit: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding habit:", error);
      alert("Terjadi kesalahan koneksi saat menambahkan habit.");
    }
  };

  const updateHabit = async (id, name, icon) => {
    const formData = new FormData();
    formData.append("action", "update_habit");
    formData.append("id", id);
    formData.append("name", name);
    formData.append("icon", icon || "🎯");

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success && result.habit) {
        const habitIndex = habits.findIndex((h) => h.id == id); // Use == for potential string/number comparison
        if (habitIndex > -1) {
          habits[habitIndex] = result.habit; // Update with full data from server
          renderHabits();
        }
      } else {
        alert(`Gagal memperbarui habit: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating habit:", error);
      alert("Terjadi kesalahan koneksi saat memperbarui habit.");
    }
  };

  const deleteHabit = async (id) => {
    const habitToDelete = habits.find((h) => h.id == id);
    const habitName = habitToDelete ? `"${habitToDelete.name}"` : "ini";
    if (
      confirm(
        `Yakin ingin menghapus habit ${habitName}? Riwayat dan statistiknya juga akan hilang.`
      )
    ) {
      const formData = new FormData();
      formData.append("action", "delete_habit");
      formData.append("id", id);

      try {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          habits = habits.filter((h) => h.id != id);
          renderHabits();
          updateGlobalStats();
          if (
            document
              .getElementById("history-content")
              ?.classList.contains("active")
          ) {
            loadAndRenderHistory();
          }
        } else {
          alert(`Gagal menghapus habit: ${result.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error deleting habit:", error);
        alert("Terjadi kesalahan koneksi saat menghapus habit.");
      }
    }
  };

  const toggleHabitCheck = async (id) => {
    const habitIndex = habits.findIndex((h) => h.id == id);
    if (habitIndex === -1) return;

    const habit = habits[habitIndex];
    const newCheckedState = !habit.checked; // The state we want to achieve

    const formData = new FormData();
    formData.append("action", "toggle_habit_check");
    formData.append("id", id);
    formData.append("checked", newCheckedState); // Send the desired state

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success && result.habit) {
        habits[habitIndex] = result.habit; // Update habit with fresh data from server
        updateHabitItemDOM(id, result.habit); // Update only the specific item for smoother UI
        updateGlobalStats();
        if (
          document
            .getElementById("history-content")
            ?.classList.contains("active")
        ) {
          loadAndRenderHistory(); // Refresh history if it's active
        }
      } else {
        alert(
          `Gagal mengubah status habit: ${result.message || "Unknown error"}`
        );
        updateHabitItemDOM(id, habit); // Revert to original state on fail
      }
    } catch (error) {
      console.error("Error toggling habit check:", error);
      alert("Terjadi kesalahan koneksi saat mengubah status habit.");
      updateHabitItemDOM(id, habit); // Revert to original state on fail
    }
  };

  const updateHabitItemDOM = (id, habitData) => {
    const habitItem = habitListContainer?.querySelector(
      `.habit-item[data-id="${id}"]`
    );
    if (!habitItem) return;
    habitItem.classList.toggle("highlighted", habitData.checked);
    const checkbox = habitItem.querySelector(".checkbox");
    if (checkbox) {
      const checkColorClass = habitData.color || "orange-check";
      checkbox.className = "checkbox"; // Reset classes
      checkbox.classList.add(checkColorClass);
      if (habitData.checked) {
        checkbox.classList.add("checked");
        checkbox.textContent = "✓";
      } else {
        checkbox.textContent = "";
      }
      checkbox.setAttribute("aria-checked", String(habitData.checked));
    }
    const statsContainer = habitItem.querySelector(".habit-stats");
    if (statsContainer) {
      statsContainer.innerHTML = `
          <span title="Runtutan"><span class="stat-icon">🔥</span>${
            habitData.currentStreak || 0
          }</span>
          <span title="Total Selesai"><span class="stat-icon">⭐</span>${
            habitData.totalCompletions || 0
          }</span>
          <span title="Gagal"><span class="stat-icon">❗</span>${
            habitData.failedCount || 0
          }</span>`;
    }
    const infoDiv = habitItem.querySelector(".habit-info");
    if (infoDiv) infoDiv.textContent = habitData.name;
    const editBtn = habitItem.querySelector(".edit-btn");
    if (editBtn) editBtn.setAttribute("aria-label", `Edit ${habitData.name}`);
    const deleteBtn = habitItem.querySelector(".delete-btn");
    if (deleteBtn)
      deleteBtn.setAttribute("aria-label", `Hapus ${habitData.name}`);
  };

  const updateGlobalStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}?action=load_global_stats`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const stats = await response.json();

      if (globalCompletedElement)
        globalCompletedElement.textContent = `${
          stats.globalCompleted || 0
        } Kali`;
      if (globalFailedElement)
        globalFailedElement.textContent = `${stats.globalFailed || 0} Hari`;
      if (globalStreakElement)
        globalStreakElement.textContent = `${stats.globalStreak || 0} Hari`;
    } catch (error) {
      console.error("Error loading global stats:", error);
      if (globalCompletedElement) globalCompletedElement.textContent = `- Kali`;
      if (globalFailedElement) globalFailedElement.textContent = `- Hari`;
      if (globalStreakElement) globalStreakElement.textContent = `- Hari`;
    }
  };

  // --- CORE FUNCTIONS (CALENDAR) ---
  const updateCalendarHeader = (year, month) => {
    if (calendarMonthYearElement)
      calendarMonthYearElement.textContent = `${monthNames[month]} ${year}`;
  };
  const renderCalendar = (year, month) => {
    if (!calendarGridContainer || !calendarMonthYearElement) return;
    calendarGridContainer.innerHTML = "";
    calendarGridContainer.setAttribute(
      "aria-label",
      `Kalender ${monthNames[month]} ${year}`
    );
    const firstDayOfMonthDate = new Date(year, month, 1);
    const firstDayOfMonth = firstDayOfMonthDate.getDay(); // 0=Sun, 1=Mon,...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const currentDay = today.getDate();
    const currentActualMonth = today.getMonth();
    const currentActualYear = today.getFullYear();
    const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let i = 0; i < paddingDays; i++) {
      const emptySpan = document.createElement("span");
      emptySpan.setAttribute("role", "gridcell");
      emptySpan.setAttribute("aria-hidden", "true");
      calendarGridContainer.appendChild(emptySpan);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const daySpan = document.createElement("span");
      daySpan.textContent = day;
      daySpan.setAttribute("role", "gridcell");
      if (
        day === currentDay &&
        month === currentActualMonth &&
        year === currentActualYear
      ) {
        daySpan.classList.add("active-day");
        daySpan.setAttribute("aria-current", "date");
        daySpan.setAttribute("title", "Hari Ini");
      } else {
        daySpan.setAttribute(
          "aria-label",
          `${day} ${monthNames[month]} ${year}`
        );
      }
      calendarGridContainer.appendChild(daySpan);
    }
  };

  // --- FUNCTIONS FOR SINGLE PAGE NAVIGATION ---
  const showContentSection = (targetId) => {
    if (!mainContentArea || !contentSections) return;
    const currentActiveClass = Array.from(mainContentArea.classList).find((c) =>
      c.startsWith("showing-")
    );
    if (currentActiveClass)
      mainContentArea.classList.remove(currentActiveClass);
    mainContentArea.classList.add(
      `showing-${targetId.replace("-content", "")}`
    );

    contentSections.forEach((section) => {
      section.classList.toggle("active", section.id === targetId);
    });
    updateMainHeader(targetId);

    if (targetId === "dashboard-content") {
      loadHabits(); // This will also call renderHabits and updateGlobalStats
    } else if (targetId === "history-content") {
      loadAndRenderHistory();
    } else if (targetId === "profile-content") {
      loadProfileData(); // This will also call renderProfile and updateSidebarProfile
      setupProfileInteractions(); // Re-attach if necessary, or ensure delegation
    }
  };

  const updateMainHeader = (activeSectionId) => {
    if (!mainTitle || !mainSubtitle) return;
    let title = "Dashboard";
    let subtitle = "Habit hari ini";
    switch (activeSectionId) {
      case "history-content":
        title = "Riwayat";
        subtitle = "Lihat kembali progres habit Anda.";
        break;
      case "profile-content":
        title = "Profil Akun";
        subtitle = "Kelola informasi akun Anda.";
        break;
    }
    mainTitle.textContent = title;
    mainSubtitle.textContent = subtitle;
  };

  // --- EVENT LISTENERS SETUP ---
  closeModalBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  window.addEventListener("click", (event) => {
    if (event.target === habitModal) closeModal();
  });

  habitForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = habitIdInput.value;
    const name = habitNameInput.value.trim();
    const icon = habitIconInput.value.trim();
    if (!name) {
      alert("Nama habit tidak boleh kosong!");
      habitNameInput.focus();
      return;
    }
    saveHabitBtn.disabled = true;
    saveHabitBtn.textContent = id ? "Updating..." : "Saving...";

    if (id) {
      await updateHabit(id, name, icon);
    } else {
      await addHabit(name, icon);
    }

    saveHabitBtn.disabled = false;
    saveHabitBtn.textContent = id ? "Update" : "Simpan";
    closeModal();
  });

  if (habitListContainer) {
    habitListContainer.addEventListener("click", (event) => {
      const target = event.target;
      const editButton = target.closest(".edit-btn");
      const deleteButton = target.closest(".delete-btn");
      const habitItem = target.closest(".habit-item");
      if (!habitItem) return;
      const habitId = habitItem.dataset.id;

      if (editButton) {
        const habitToEdit = habits.find((h) => h.id == habitId);
        if (habitToEdit) openModal("edit", habitToEdit);
      } else if (deleteButton) {
        deleteHabit(habitId);
      } else if (
        target.closest(".checkbox") ||
        target === habitItem ||
        target.closest(".habit-details") ||
        target.closest(".icon")
      ) {
        toggleHabitCheck(habitId);
      }
    });
    habitListContainer.addEventListener("keydown", (event) => {
      const target = event.target;
      if (
        (event.key === "Enter" || event.key === " ") &&
        target.classList.contains("checkbox")
      ) {
        event.preventDefault();
        const habitItem = target.closest(".habit-item");
        if (habitItem) toggleHabitCheck(habitItem.dataset.id);
      }
    });
  }

  prevMonthBtn?.addEventListener("click", () => {
    currentDisplayMonth--;
    if (currentDisplayMonth < 0) {
      currentDisplayMonth = 11;
      currentDisplayYear--;
    }
    updateCalendarHeader(currentDisplayYear, currentDisplayMonth);
    renderCalendar(currentDisplayYear, currentDisplayMonth);
  });
  nextMonthBtn?.addEventListener("click", () => {
    currentDisplayMonth++;
    if (currentDisplayMonth > 11) {
      currentDisplayMonth = 0;
      currentDisplayYear++;
    }
    updateCalendarHeader(currentDisplayYear, currentDisplayMonth);
    renderCalendar(currentDisplayYear, currentDisplayMonth);
  });

  addHabitHeaderBtn?.addEventListener("click", () => openModal("add"));

  if (mainNav) {
    mainNav.addEventListener("click", (event) => {
      const link = event.target.closest(".nav-link");
      if (link?.dataset.target) {
        event.preventDefault();
        const targetId = link.dataset.target;
        if (navLinks) {
          navLinks.forEach((navLink) => navLink.classList.remove("active"));
          link.classList.add("active");
        }
        showContentSection(targetId);
      }
    });
  }

  if (sidebarProfileTrigger) {
    sidebarProfileTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = "profile-content";
      if (navLinks) {
        navLinks.forEach((navLink) => navLink.classList.remove("active"));
        const actualProfileNavLink = mainNav?.querySelector(
          `.nav-link[data-target="profile-content"]`
        ); // Check if explicit nav link exists
        actualProfileNavLink?.classList.add("active");
      }
      showContentSection(targetId);
    });
  }

  // --- INITIALIZATION ---
  const initializeApp = async () => {
    console.log("Initializing HabitHub (PHP Version)...");

    await loadProfileData();

    const initialHash = window.location.hash.substring(1);
    let initialTargetId = "dashboard-content";
    let activeLinkFound = false;

    if (initialHash && navLinks) {
      const initialLink = mainNav?.querySelector(
        `.nav-link[href="#${initialHash}"]`
      );
      if (
        initialLink?.dataset.target &&
        document.getElementById(initialLink.dataset.target)
      ) {
        initialTargetId = initialLink.dataset.target;
        navLinks.forEach((navLink) => navLink.classList.remove("active"));
        initialLink.classList.add("active");
        activeLinkFound = true;
      }
    }

    if (!activeLinkFound && navLinks) {
      navLinks.forEach((navLink) => navLink.classList.remove("active"));
      mainNav
        ?.querySelector('.nav-link[data-target="dashboard-content"]')
        ?.classList.add("active");
    }

    showContentSection(initialTargetId);

    updateCalendarHeader(currentDisplayYear, currentDisplayMonth);
    renderCalendar(currentDisplayYear, currentDisplayMonth);

    console.log("HabitHub Initialized.");
  };

  initializeApp();
}); // End DOMContentLoaded
