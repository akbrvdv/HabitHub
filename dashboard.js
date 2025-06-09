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
  const editPictureBtn = document.querySelector(
    ".profile-picture-container .edit-picture-btn"
  );
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
  const profileActionsSecondary = document.querySelector(
    ".profile-actions-secondary"
  );
  const changePasswordBtn = profileActionsSecondary?.querySelector(
    ".change-password-btn"
  );
  const deleteAccountBtn = profileActionsSecondary?.querySelector(
    ".delete-account-btn"
  );

  const notesContentSection = document.getElementById("notes-content");
  const userNoteTextarea = document.getElementById("user-note-textarea");
  const saveNoteBtn = document.getElementById("save-note-btn");
  const noteSaveStatusSpan = document.getElementById("note-save-status");

  const buddyContentSection = document.getElementById("buddy-content");
  const buddyTabLinks =
    buddyContentSection?.querySelectorAll(".buddy-tab-link");
  const buddyTabPanes =
    buddyContentSection?.querySelectorAll(".buddy-tab-pane");
  const myInviteCodeInput = document.getElementById("my-invite-code");
  const generateNewInviteCodeBtn = document.getElementById(
    "generate-new-invite-code"
  );
  const copyInviteCodeBtn = document.getElementById("copy-invite-code");
  const inviteCodeStatusMsg = document.getElementById("invite-code-status");
  const enterBuddyCodeInput = document.getElementById("enter-buddy-code");
  const acceptBuddyInviteBtn = document.getElementById("accept-buddy-invite");
  const acceptCodeStatusMsg = document.getElementById("accept-code-status");
  const buddyListContainer = document.getElementById("buddy-list");
  const sharedHabitsListContainer =
    document.getElementById("shared-habits-list");
  const initiateShareHabitBtn = document.getElementById(
    "initiate-share-habit-btn"
  );
  const buddyRequestsListContainer = document.getElementById(
    "buddy-requests-list"
  );
  const buddyRequestCountBadge = document.getElementById("buddy-request-count");

  const shareHabitModal = document.getElementById("share-habit-modal");
  const closeShareModalBtn = shareHabitModal?.querySelector(".close-btn");
  const cancelShareHabitBtn = document.getElementById("cancel-share-habit-btn");
  const shareHabitForm = document.getElementById("share-habit-form");
  const selectHabitToShare = document.getElementById("select-habit-to-share");
  const selectBuddyToShareWith = document.getElementById(
    "select-buddy-to-share-with"
  );
  const confirmShareHabitBtn = document.getElementById(
    "confirm-share-habit-btn"
  );
  const shareHabitStatusMsg = document.getElementById("share-habit-status");

  const habitCategoryFilterContainer = document.querySelector(
    ".habit-category-filter"
  );
  const habitCategoryInput = document.getElementById("habit-category");

  const habitStartDateInput = document.getElementById("habit-start-date");
  const isDurationUnlimitedCheckbox = document.getElementById(
    "is-duration-unlimited"
  );
  const durationSettingsDiv = document.querySelector(".duration-settings");
  const durationValueInput = document.getElementById("duration-value");
  const durationUnitSelect = document.getElementById("duration-unit");

  let habits = [];
  let userProfile = {};
  let originalNoteContent = "";
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
  let currentHabitFilter = "semua";
  let calendarDataCache = {};

  const API_BASE_URL = "dashboard.php";

  const getYMD = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error("Invalid date provided to getYMD:", date);
      return new Date().toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  };

  const formatTimestamp = (ymdStringOrDate, includeTime = false) => {
    if (!ymdStringOrDate) return "-";
    try {
      let date;
      if (typeof ymdStringOrDate === "string") {
        if (ymdStringOrDate.length === 10 && ymdStringOrDate.includes("-")) {
          date = new Date(ymdStringOrDate + "T00:00:00");
        } else {
          date = new Date(ymdStringOrDate);
        }
      } else if (ymdStringOrDate instanceof Date) {
        date = ymdStringOrDate;
      } else {
        return String(ymdStringOrDate);
      }

      if (isNaN(date.getTime())) {
        return String(ymdStringOrDate);
      }
      let formatted = `${date.getDate()} ${
        monthNames[date.getMonth()]
      } ${date.getFullYear()}`;
      if (includeTime) {
        formatted += ` ${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      }
      return formatted;
    } catch (e) {
      console.error("Error formatting timestamp:", ymdStringOrDate, e);
      return String(ymdStringOrDate);
    }
  };

  const getRandomCheckColor = () => {
    const colors = ["blue-check"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const showGeneralSaveStatus = (
    element,
    message,
    isSuccess = true,
    duration = 3000
  ) => {
    if (!element) return;
    element.textContent = message;
    element.className = `save-status ${isSuccess ? "success" : "error"}`;
    element.style.display = "inline";
    setTimeout(() => {
      element.style.display = "none";
    }, duration);
  };

  const showBuddyFormStatus = (
    element,
    message,
    isSuccess,
    duration = 4000
  ) => {
    if (!element) return;
    element.textContent = message;
    element.className = `form-status-message ${
      isSuccess ? "success" : "error"
    }`;
    element.style.display = "block";
    setTimeout(() => {
      element.style.display = "none";
    }, duration);
  };

  const loadProfileData = async () => {
    const defaultProfile = {
      username: "User",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      profilePicturePath: "assets/profile_placeholder.png",
      user_note_content: "",
    };

    try {
      const response = await fetch(`${API_BASE_URL}?action=load_profile`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      userProfile = {
        ...defaultProfile,
        username: data.username || defaultProfile.username,
        email: data.email || defaultProfile.email,
        firstName: data.first_name || defaultProfile.firstName,
        lastName: data.last_name || defaultProfile.lastName,
        phone: data.phone || defaultProfile.phone,
        profilePicturePath:
          data.profile_picture_path || defaultProfile.profilePicturePath,
        user_note_content:
          data.user_note_content || defaultProfile.user_note_content,
      };

      console.log("Profile picture path:", userProfile.profilePicturePath);

      renderProfile();
      updateSidebarProfile();

      if (userNoteTextarea) {
        originalNoteContent = userProfile.user_note_content || "";
        userNoteTextarea.value = originalNoteContent;
        userNoteTextarea.disabled = false;
        if (saveNoteBtn) saveNoteBtn.disabled = true;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      userProfile = { ...defaultProfile };
      renderProfile();
      updateSidebarProfile();
      if (saveStatusSpan) {
        showGeneralSaveStatus(saveStatusSpan, "Gagal memuat profil.", false);
      }
    }
  };

  const renderProfile = () => {
    if (!profileDetailsContainer || !profileImage) {
      console.warn(
        "renderProfile: profileDetailsContainer or profileImage not found."
      );
      return;
    }
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
        if (input.id === "profile-username")
          input.setAttribute("disabled", true);
      });
    editFieldBtns?.forEach((btn) => btn.classList.remove("editing"));
    if (saveProfileBtn) {
      saveProfileBtn.style.display = "none";
      saveProfileBtn.disabled = true;
    }
  };

  const updateSidebarProfile = () => {
    if (!sidebarAvatar || !sidebarUsername || !sidebarEmail) return;

    if (sidebarAvatar) {
      sidebarAvatar.src =
        userProfile.profilePicturePath || "assets/profile_placeholder.png";

      sidebarAvatar.onerror = function () {
        this.src = "assets/profile_placeholder.png";
        console.log("Fallback to placeholder image for sidebar");
      };
    }

    if (profileImage) {
      profileImage.src =
        userProfile.profilePicturePath || "assets/profile_placeholder.png";

      profileImage.onerror = function () {
        this.src = "assets/profile_placeholder.png";
        console.log("Fallback to placeholder image for main profile");
      };
    }

    if (sidebarUsername) {
      sidebarUsername.textContent =
        `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() ||
        userProfile.username ||
        "Nama User";
    }
    if (sidebarEmail) {
      sidebarEmail.textContent = userProfile.email || "email@contoh.com";
    }
  };

  const setupProfileInteractions = () => {
    if (!profileDetailsContainer) {
      console.warn(
        "setupProfileInteractions: profileDetailsContainer not found."
      );
    }

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
            } else input.setAttribute("readonly", true);
          }
        });
        button.classList.toggle("editing", currentlyEditing);
        const anyEditable =
          Array.from(
            profileDetailsContainer.querySelectorAll(
              "input:not([readonly]):not([disabled])"
            )
          ).length > 0;
        const imageSelected =
          imageUploadInput &&
          imageUploadInput.files &&
          imageUploadInput.files.length > 0;
        if (saveProfileBtn) {
          saveProfileBtn.style.display =
            anyEditable || imageSelected ? "inline-flex" : "none";
          saveProfileBtn.disabled = !(anyEditable || imageSelected);
        }
      });
    });

    saveProfileBtn?.addEventListener("click", async () => {
      const formData = new FormData();
      formData.append("action", "save_profile");
      formData.append("firstName", profileFirstNameInput.value.trim());
      formData.append("lastName", profileLastNameInput.value.trim());
      formData.append("email", profileEmailInput.value.trim());
      formData.append("phone", profilePhoneInput.value.trim());

      if (
        imageUploadInput &&
        imageUploadInput.files &&
        imageUploadInput.files[0]
      ) {
        formData.append("profilePictureFile", imageUploadInput.files[0]);
      } else {
        if (userProfile.profilePicturePath) {
          formData.append("profilePicturePath", userProfile.profilePicturePath);
        }
      }

      if (
        formData.get("email") &&
        !/\S+@\S+\.\S+/.test(formData.get("email"))
      ) {
        if (saveStatusSpan)
          showGeneralSaveStatus(
            saveStatusSpan,
            "Format email tidak valid.",
            false
          );
        profileEmailInput.focus();
        return;
      }

      try {
        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (result.success) {
          if (saveStatusSpan)
            showGeneralSaveStatus(
              saveStatusSpan,
              result.message || "Profil berhasil disimpan!",
              true
            );

          userProfile.firstName = formData.get("firstName");
          userProfile.lastName = formData.get("lastName");
          userProfile.email = formData.get("email");
          userProfile.phone = formData.get("phone");

          if (result.newProfilePicturePath) {
            userProfile.profilePicturePath = result.newProfilePicturePath;
          } else {
            userProfile.profilePicturePath =
              userProfile.profilePicturePath ||
              "assets/profile_placeholder.png";
          }

          if (imageUploadInput) imageUploadInput.value = "";
          renderProfile();
          updateSidebarProfile();
        } else {
          if (saveStatusSpan)
            showGeneralSaveStatus(
              saveStatusSpan,
              result.message || "Gagal menyimpan profil.",
              false
            );
        }
      } catch (error) {
        console.error("Error saving profile:", error);
        if (saveStatusSpan)
          showGeneralSaveStatus(
            saveStatusSpan,
            "Terjadi kesalahan koneksi saat menyimpan.",
            false
          );
      } finally {
        if (saveProfileBtn) {
          saveProfileBtn.disabled = false;
          saveProfileBtn.innerHTML =
            '<i class="fas fa-save"></i> Simpan Perubahan';
          const anyEditable =
            profileDetailsContainer &&
            Array.from(
              profileDetailsContainer.querySelectorAll(
                "input:not([readonly]):not([disabled])"
              )
            ).length > 0;
          const imageStillSelected =
            imageUploadInput &&
            imageUploadInput.files &&
            imageUploadInput.files.length > 0;
          if (!anyEditable && !imageStillSelected) {
            saveProfileBtn.style.display = "none";
            saveProfileBtn.disabled = true;
          } else {
            saveProfileBtn.style.display = "inline-flex";
            saveProfileBtn.disabled = false;
          }
        }
      }
    });

    if (editPictureBtn && imageUploadInput) {
      editPictureBtn.addEventListener("click", () => {
        imageUploadInput.click();
      });
    } else {
      if (!editPictureBtn)
        console.warn(
          "setupProfileInteractions: editPictureBtn not found with new selector."
        );
      if (!imageUploadInput)
        console.warn("setupProfileInteractions: imageUploadInput not found.");
    }

    imageUploadInput?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
          if (saveStatusSpan)
            showGeneralSaveStatus(
              saveStatusSpan,
              "Tipe file tidak diizinkan (hanya JPEG, PNG, GIF).",
              false
            );
          imageUploadInput.value = "";
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          if (saveStatusSpan)
            showGeneralSaveStatus(
              saveStatusSpan,
              "Ukuran file terlalu besar (maksimal 2MB).",
              false
            );
          imageUploadInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            if (profileImage) profileImage.src = e.target.result;
            if (saveProfileBtn) {
              saveProfileBtn.style.display = "inline-flex";
              saveProfileBtn.disabled = false;
            }
          } else if (saveStatusSpan)
            showGeneralSaveStatus(
              saveStatusSpan,
              "Gagal membaca gambar.",
              false
            );
        };
        reader.onerror = () => {
          if (saveStatusSpan)
            showGeneralSaveStatus(
              saveStatusSpan,
              "Gagal memproses gambar.",
              false
            );
        };
        reader.readAsDataURL(file);
      }
    });

    changePasswordBtn?.addEventListener("click", () => {
      window.location.href = "pw_email.php";
    });

    deleteAccountBtn?.addEventListener("click", async () => {
      if (
        confirm(
          "Apakah Anda YAKIN ingin menghapus akun Anda secara permanen? Tindakan ini tidak dapat diurungkan dan semua data Anda (habit, progres, buddy, catatan) akan hilang."
        )
      ) {
        if (deleteAccountBtn) {
          deleteAccountBtn.disabled = true;
          deleteAccountBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
        }

        const formData = new FormData();
        formData.append("action", "delete_account");

        try {
          const response = await fetch(API_BASE_URL, {
            method: "POST",
            body: formData,
          });
          const result = await response.json();

          if (result.success && result.action === "logout") {
            alert(
              result.message ||
                "Akun berhasil dihapus. Anda akan dialihkan ke halaman login."
            );
            window.location.href = "login.php";
          } else {
            alert(
              result.message ||
                "Gagal menghapus akun. Silakan coba lagi atau hubungi dukungan."
            );
            if (deleteAccountBtn) {
              deleteAccountBtn.disabled = false;
              deleteAccountBtn.innerHTML = "Hapus Akun";
            }
          }
        } catch (error) {
          console.error("Error deleting account:", error);
          alert("Terjadi kesalahan koneksi saat mencoba menghapus akun.");
          if (deleteAccountBtn) {
            deleteAccountBtn.disabled = false;
            deleteAccountBtn.innerHTML = "Hapus Akun";
          }
        }
      }
    });
  };

  const loadAndRenderHistory = async () => {
    if (!historyListContainer) return;
    historyListContainer.innerHTML =
      '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat riwayat...</p>';
    try {
      const response = await fetch(`${API_BASE_URL}?action=load_history`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const historyEntries = await response.json();
      if (!Array.isArray(historyEntries))
        throw new Error("Data riwayat tidak valid.");
      if (historyEntries.length === 0) {
        historyListContainer.innerHTML =
          '<p class="no-history-message">Belum ada riwayat penyelesaian habit.</p>';
        return;
      }
      historyListContainer.innerHTML = "";
      historyEntries.forEach((entry) => {
        const item = document.createElement("div");
        item.classList.add("history-entry");
        const checkColorClass = entry.color || "blue-check";
        item.innerHTML = `
        <span class="icon" aria-hidden="true">${entry.icon || "🎯"}</span>
        <div class="habit-details"> <div class="habit-info">${
          entry.name || "Habit Tanpa Nama"
        }</div> </div>
        <div class="checkbox checked ${checkColorClass}" aria-hidden="true">✓</div>
        <div class="history-timestamp">${formatTimestamp(entry.date)}</div>`;
        historyListContainer.appendChild(item);
      });
    } catch (error) {
      console.error("Error loading history:", error);
      historyListContainer.innerHTML = `<p class="no-history-message">Gagal memuat riwayat: ${error.message}</p>`;
    }
  };

  const loadHabits = async () => {
    if (!habitListContainer) return;
    habitListContainer.innerHTML =
      '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat habit...</p>';
    try {
      const response = await fetch(`${API_BASE_URL}?action=load_habits`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      habits = Array.isArray(data) ? data : [];
      sortAndRenderHabits();
      updateGlobalStats();
    } catch (error) {
      console.error("Error loading habits:", error);
      habits = [];
      sortAndRenderHabits();
      updateGlobalStats();
      habitListContainer.innerHTML = `<p class="no-habits-message">Gagal memuat habit: ${error.message}</p>`;
    }
  };

  const sortHabits = (habitsArray) => {
    return habitsArray.sort((a, b) => {
      if (a.checked !== b.checked) {
        return a.checked ? 1 : -1;
      }
      const categoryOrder = { pagi: 1, siang: 2, "sore-malam": 3, semua: 4 };
      const categoryA = categoryOrder[a.category] || 99;
      const categoryB = categoryOrder[b.category] || 99;
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      if (a.is_shared_instance !== b.is_shared_instance) {
        return a.is_shared_instance ? 1 : -1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const filterHabitsByCategory = (habitsArray, category) => {
    if (category === "semua") {
      return habitsArray;
    }
    return habitsArray.filter((habit) => habit.category === category);
  };

  const sortAndRenderHabits = () => {
    if (!habitListContainer) return;
    habitListContainer.innerHTML = "";

    const filteredHabits = filterHabitsByCategory(habits, currentHabitFilter);
    const sortedHabits = sortHabits([...filteredHabits]);

    if (sortedHabits.length === 0) {
      if (habits.length === 0 && currentHabitFilter === "semua") {
        habitListContainer.innerHTML =
          '<p class="no-habits-message">Belum ada habit. Tambahkan satu yuk!</p>';
      } else {
        habitListContainer.innerHTML = `<p class="no-habits-message">Tidak ada habit untuk kategori '${currentHabitFilter}'.</p>`;
      }
      return;
    }

    sortedHabits.forEach((habit) => {
      const item = document.createElement("div");
      item.classList.add("habit-item");
      if (habit.checked) item.classList.add("highlighted");
      if (habit.is_shared_instance) item.classList.add("shared-instance-item");
      item.dataset.id = habit.id;
      item.dataset.category = habit.category || "semua";
      const nameId = `habit-name-${habit.id}`;
      const habitNameText = habit.name || "Habit Tanpa Nama";

      let durationText = "Tak Terbatas";
      if (!habit.is_duration_unlimited && habit.calculated_end_date) {
        durationText = `Berakhir ${formatTimestamp(habit.calculated_end_date)}`;
      }

      item.innerHTML = `
      <span class="icon" aria-hidden="true">${habit.icon || "🎯"}</span>
      <div class="habit-details">
          <div class="habit-info" id="${nameId}">${habitNameText}</div>
          <div class="habit-stats">
              <span title="Runtutan"><span class="stat-icon">🔥</span>${
                habit.currentStreak || 0
              }</span>
              <span title="Total Selesai"><span class="stat-icon">⭐</span>${
                habit.totalCompletions || 0
              }</span>
              <span title="Gagal"><span class="stat-icon">❗</span>${
                habit.failedCount || 0
              }</span>
              <span title="Durasi"><span class="stat-icon">📅</span>${durationText}</span>
          </div>
      </div>
      <div class="habit-actions">
          <button class="edit-btn" aria-label="Edit ${habitNameText}" tabindex="-1"><i class="fas fa-pencil-alt"></i></button>
          <button class="delete-btn" aria-label="Hapus ${habitNameText}" tabindex="-1"><i class="fas fa-trash-alt"></i></button>
      </div>
      <div class="checkbox ${habit.checked ? "checked" : ""} ${
        habit.color || "blue-check"
      }" role="checkbox" aria-checked="${
        habit.checked
      }" aria-labelledby="${nameId}" tabindex="0">
         ${habit.checked ? "✓" : ""}
      </div>`;
      habitListContainer.appendChild(item);
    });
  };

  const openModal = (mode = "add", habitData = null) => {
    if (!habitModal || !habitForm || !habitCategoryInput) return;
    habitForm.reset();
    habitIdInput.value = "";
    habitCategoryInput.value = "semua";
    habitStartDateInput.value = getYMD(new Date());
    isDurationUnlimitedCheckbox.checked = true;
    durationSettingsDiv.classList.add("hidden");
    durationValueInput.value = 30;
    durationUnitSelect.value = "hari";

    if (mode === "edit" && habitData) {
      modalTitle.textContent = "Edit Habit";
      habitIdInput.value = habitData.id;
      habitNameInput.value = habitData.name;
      habitIconInput.value = habitData.icon;
      habitCategoryInput.value = habitData.category || "semua";
      habitStartDateInput.value =
        habitData.habit_start_date || getYMD(new Date());
      isDurationUnlimitedCheckbox.checked = habitData.is_duration_unlimited;
      if (habitData.is_duration_unlimited) {
        durationSettingsDiv.classList.add("hidden");
      } else {
        durationSettingsDiv.classList.remove("hidden");
        if (habitData.duration_in_days) {
          if (habitData.duration_in_days % 30 === 0) {
            durationValueInput.value = habitData.duration_in_days / 30;
            durationUnitSelect.value = "bulan";
          } else {
            durationValueInput.value = habitData.duration_in_days;
            durationUnitSelect.value = "hari";
          }
        }
      }
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
    if (habitModal) {
      habitModal.style.display = "none";
      habitModal.setAttribute("aria-hidden", "true");
    }
  };

  const addOrUpdateHabitOnServer = async (isUpdate, formData) => {
    const action = isUpdate ? "update_habit" : "add_habit";
    formData.append("action", action);
    if (!isUpdate && !formData.has("color"))
      formData.append("color", getRandomCheckColor());

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success && result.habit) {
        if (isUpdate) {
          const index = habits.findIndex(
            (h) => String(h.id) === String(result.habit.id)
          );
          if (index > -1) habits[index] = result.habit;
        } else {
          habits.unshift(result.habit);
        }
        sortAndRenderHabits();
        updateGlobalStats();
        fetchCalendarDataForCurrentMonth(true);
      } else {
        alert(`Gagal ${action}: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const deleteHabit = async (id) => {
    const habitToDelete = habits.find((h) => String(h.id) === String(id));
    const message = habitToDelete?.is_shared_instance
      ? `Yakin ingin menghapus habit bersama "${
          habitToDelete?.name || "ini"
        }" dari daftar Anda? Ini akan menghentikan Anda berbagi habit ini.`
      : `Yakin ingin menghapus habit "${
          habitToDelete?.name || "ini"
        }"? Ini juga akan menghapus data habit bersama yang terkait jika Anda pemiliknya.`;

    if (confirm(message)) {
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
          habits = habits.filter((h) => String(h.id) !== String(id));
          sortAndRenderHabits();
          updateGlobalStats();
          fetchCalendarDataForCurrentMonth(true);
          if (
            document
              .getElementById("history-content")
              ?.classList.contains("active")
          )
            loadAndRenderHistory();
          if (
            document
              .getElementById("buddy-content")
              ?.classList.contains("active")
          ) {
            loadUserSharedHabits();
            loadIncomingShareRequests();
          }
        } else {
          alert(`Gagal menghapus: ${result.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error deleting habit:", error);
        alert("Terjadi kesalahan koneksi.");
      }
    }
  };

  const toggleHabitCheck = async (id) => {
    const habitIndex = habits.findIndex((h) => String(h.id) === String(id));
    if (habitIndex === -1) return;

    const originalHabitState = { ...habits[habitIndex] };
    const newCheckedState = !habits[habitIndex].checked;

    habits[habitIndex].checked = newCheckedState;
    sortAndRenderHabits();

    const formData = new FormData();
    formData.append("action", "toggle_habit_check");
    formData.append("id", id);
    formData.append("checked", newCheckedState);

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success && result.habit) {
        habits[habitIndex] = result.habit;
        sortAndRenderHabits();
        updateGlobalStats();
        fetchCalendarDataForCurrentMonth(true);
        if (
          document
            .getElementById("history-content")
            ?.classList.contains("active")
        )
          loadAndRenderHistory();
      } else {
        alert(`Gagal mengubah status: ${result.message || "Unknown error"}`);
        habits[habitIndex] = originalHabitState;
        sortAndRenderHabits();
      }
    } catch (error) {
      console.error("Error toggling check:", error);
      alert("Terjadi kesalahan koneksi.");
      habits[habitIndex] = originalHabitState;
      sortAndRenderHabits();
    }
  };

  const updateHabitItemDOM = (id, habitData) => {
    const item = habitListContainer?.querySelector(
      `.habit-item[data-id="${id}"]`
    );
    if (!item) return;
    item.classList.toggle("highlighted", habitData.checked);
    item.classList.toggle("shared-instance-item", habitData.is_shared_instance);
    const checkbox = item.querySelector(".checkbox");
    if (checkbox) {
      checkbox.className = `checkbox ${habitData.checked ? "checked" : ""} ${
        habitData.color || "blue-check"
      }`;
      checkbox.textContent = habitData.checked ? "✓" : "";
      checkbox.setAttribute("aria-checked", String(habitData.checked));
    }
    const statsEl = item.querySelector(".habit-stats");
    if (statsEl)
      statsEl.innerHTML = `<span title="Runtutan"><span class="stat-icon">🔥</span>${
        habitData.currentStreak || 0
      }</span><span title="Total Selesai"><span class="stat-icon">⭐</span>${
        habitData.totalCompletions || 0
      }</span><span title="Gagal"><span class="stat-icon">❗</span>${
        habitData.failedCount || 0
      }</span>`;
    const infoEl = item.querySelector(".habit-info");
    if (infoEl) infoEl.textContent = habitData.name;
    item
      .querySelector(".edit-btn")
      ?.setAttribute("aria-label", `Edit ${habitData.name}`);
    item
      .querySelector(".delete-btn")
      ?.setAttribute("aria-label", `Hapus ${habitData.name}`);
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

  const updateCalendarHeader = (year, month) => {
    if (calendarMonthYearElement)
      calendarMonthYearElement.textContent = `${monthNames[month]} ${year}`;
  };

  const fetchCalendarDataForCurrentMonth = async (forceRefresh = false) => {
    const cacheKey = `${currentDisplayYear}-${currentDisplayMonth}`;
    if (!forceRefresh && calendarDataCache[cacheKey]) {
      return calendarDataCache[cacheKey];
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}?action=load_calendar_data&month=${currentDisplayMonth}&year=${currentDisplayYear}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      calendarDataCache[cacheKey] = data;
      return data;
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      calendarDataCache[cacheKey] = {};
      return {};
    }
  };

  const renderCalendar = async (year, month) => {
    if (!calendarGridContainer || !calendarMonthYearElement) return;
    updateCalendarHeader(year, month);
    calendarGridContainer.innerHTML =
      '<span class="loading-calendar">Memuat data kalender...</span>';
    calendarGridContainer.setAttribute(
      "aria-label",
      `Kalender ${monthNames[month]} ${year}`
    );

    const dailyData = await fetchCalendarDataForCurrentMonth();
    calendarGridContainer.innerHTML = "";

    const firstDayOfMonthDate = new Date(year, month, 1);
    const firstDay = (firstDayOfMonthDate.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayYMD = getYMD(today);

    for (let i = 0; i < firstDay; i++) {
      calendarGridContainer.appendChild(document.createElement("span"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const daySpan = document.createElement("span");
      const dayNumberSpan = document.createElement("span");
      dayNumberSpan.classList.add("day-number");
      dayNumberSpan.textContent = day;
      daySpan.appendChild(dayNumberSpan);

      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dataForDay = dailyData[dateStr];
      let dayTitle = `${day} ${monthNames[month]} ${year}`;

      if (dataForDay) {
        const indicatorsDiv = document.createElement("div");
        indicatorsDiv.classList.add("day-indicators");
        let indicatorTitles = [];

        if (dataForDay.completed > 0) {
          const completedIndicator = document.createElement("span");
          completedIndicator.classList.add("indicator", "completed");
          completedIndicator.textContent = dataForDay.completed;
          indicatorTitles.push(`${dataForDay.completed} selesai`);
          indicatorsDiv.appendChild(completedIndicator);
        }
        if (dataForDay.failed > 0) {
          const failedIndicator = document.createElement("span");
          failedIndicator.classList.add("indicator", "failed");
          failedIndicator.textContent = dataForDay.failed;
          indicatorTitles.push(`${dataForDay.failed} gagal`);
          indicatorsDiv.appendChild(failedIndicator);
        }
        daySpan.appendChild(indicatorsDiv);

        if (dataForDay.all_done) {
          daySpan.classList.add("all-done-marker");
          indicatorTitles.push("Semua habit tuntas!");
        }
        if (indicatorTitles.length > 0) {
          dayTitle += ` (${indicatorTitles.join(", ")})`;
        }
      }

      if (dateStr === todayYMD) {
        daySpan.classList.add("active-day");
        daySpan.setAttribute("aria-current", "date");
        dayTitle = `Hari Ini | ${dayTitle}`;
      }
      daySpan.setAttribute("title", dayTitle);
      daySpan.setAttribute("aria-label", dayTitle);
      calendarGridContainer.appendChild(daySpan);
    }
  };

  const saveUserNote = async () => {
    if (!userNoteTextarea || !saveNoteBtn || !noteSaveStatusSpan) return;
    const newNoteContent = userNoteTextarea.value;
    saveNoteBtn.disabled = true;
    saveNoteBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    const formData = new FormData();
    formData.append("action", "save_note");
    formData.append("note_content", newNoteContent);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        originalNoteContent = result.note_content;
        userProfile.user_note_content = result.note_content;
        userNoteTextarea.value = originalNoteContent;
        showGeneralSaveStatus(
          noteSaveStatusSpan,
          result.message || "Catatan berhasil disimpan!",
          true
        );
      } else {
        showGeneralSaveStatus(
          noteSaveStatusSpan,
          result.message || "Gagal menyimpan catatan.",
          false
        );
      }
    } catch (error) {
      console.error("Error saving note:", error);
      showGeneralSaveStatus(
        noteSaveStatusSpan,
        "Terjadi kesalahan koneksi saat menyimpan.",
        false
      );
    } finally {
      saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Catatan';
      saveNoteBtn.disabled = userNoteTextarea.value === originalNoteContent;
    }
  };

  const setActiveBuddyTab = (targetTabId) => {
    if (!buddyContentSection) return;
    buddyTabPanes?.forEach((pane) => pane.classList.remove("active"));
    buddyTabLinks?.forEach((link) => link.classList.remove("active"));
    const targetPane = document.getElementById(targetTabId);
    const targetLink = buddyContentSection.querySelector(
      `.buddy-tab-link[data-tab="${targetTabId}"]`
    );
    if (targetPane) targetPane.classList.add("active");
    if (targetLink) targetLink.classList.add("active");

    if (targetTabId === "my-buddies-tab") loadMyBuddiesList();
    else if (targetTabId === "invite-buddy-tab") loadMyCurrentInviteCode();
    else if (targetTabId === "shared-habits-tab") loadUserSharedHabits();
    else if (targetTabId === "buddy-requests-tab") loadIncomingShareRequests();
  };

  const loadMyCurrentInviteCode = async () => {
    if (!myInviteCodeInput) return;
    try {
      myInviteCodeInput.value = "Memuat...";
      const response = await fetch(`${API_BASE_URL}?action=get_my_invite_code`);
      const data = await response.json();
      myInviteCodeInput.value =
        data.success && data.invite_code
          ? data.invite_code
          : "Klik 'Buat Kode' untuk kode baru";
    } catch (error) {
      console.error("Error fetching invite code:", error);
      myInviteCodeInput.value = "Gagal memuat kode.";
    }
  };

  const loadMyBuddiesList = async () => {
    if (!buddyListContainer) return;
    buddyListContainer.innerHTML =
      '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat daftar buddy...</p>';
    try {
      const response = await fetch(`${API_BASE_URL}?action=list_my_buddies`);
      const buddies = await response.json();
      renderMyBuddies(buddies);
    } catch (error) {
      console.error("Error loading buddies:", error);
      buddyListContainer.innerHTML =
        '<p class="no-items-message">Gagal memuat daftar buddy.</p>';
    }
  };

  const renderMyBuddies = (buddies) => {
    if (!buddyListContainer) return;
    buddyListContainer.innerHTML = "";
    if (!buddies || !Array.isArray(buddies) || buddies.length === 0) {
      buddyListContainer.innerHTML =
        '<p class="no-items-message">Anda belum memiliki buddy. Undang teman!</p>';
      return;
    }
    buddies.forEach((buddy) => {
      const item = document.createElement("div");
      item.classList.add("buddy-item");
      item.innerHTML = `
        <div class="buddy-item-info">
            <img src="${
              buddy.profile_pic || "assets/profile_placeholder.png"
            }" alt="Foto ${buddy.username}">
            <div> <span class="name">${
              buddy.username
            }</span> <p class="status">Berteman sejak: ${
        buddy.friends_since || "-"
      }</p> </div>
        </div>
        <div class="buddy-item-actions">
            <button class="btn btn-sm btn-danger unfriend-buddy" data-relationship-id="${
              buddy.relationship_id
            }" data-buddy-name="${buddy.username}" title="Hapus Buddy ${
        buddy.username
      }"><i class="fas fa-user-times"></i> Hapus</button>
        </div>`;
      item
        .querySelector(".unfriend-buddy")
        ?.addEventListener("click", async (e) => {
          const relationshipId = e.currentTarget.dataset.relationshipId;
          const buddyName = e.currentTarget.dataset.buddyName;
          if (
            confirm(
              `Yakin ingin menghapus ${buddyName} dari daftar buddy? Ini juga akan menghapus semua habit yang dibagikan dengannya.`
            )
          ) {
            await unfriendBuddy(relationshipId);
          }
        });
      buddyListContainer.appendChild(item);
    });
  };

  const unfriendBuddy = async (relationshipId) => {
    const formData = new FormData();
    formData.append("action", "unfriend_buddy");
    formData.append("relationship_id", relationshipId);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      const statusMsgArea = document
        .getElementById("my-buddies-tab")
        .querySelector("h3");
      if (result.success) {
        const SiblingEl = statusMsgArea?.nextElementSibling?.classList.contains(
          "list-container"
        )
          ? statusMsgArea.nextElementSibling
          : statusMsgArea;
        if (SiblingEl) showBuddyFormStatus(SiblingEl, result.message, true);

        loadMyBuddiesList();
        loadUserSharedHabits();
        fetchCalendarDataForCurrentMonth(true);
      } else {
        const SiblingEl = statusMsgArea?.nextElementSibling?.classList.contains(
          "list-container"
        )
          ? statusMsgArea.nextElementSibling
          : statusMsgArea;
        if (SiblingEl)
          showBuddyFormStatus(
            SiblingEl,
            result.message || "Gagal menghapus buddy.",
            false
          );
      }
    } catch (error) {
      console.error("Error unfriending buddy:", error);
      const statusMsgArea = document
        .getElementById("my-buddies-tab")
        .querySelector("h3");
      const SiblingEl = statusMsgArea?.nextElementSibling?.classList.contains(
        "list-container"
      )
        ? statusMsgArea.nextElementSibling
        : statusMsgArea;
      if (SiblingEl)
        showBuddyFormStatus(SiblingEl, "Terjadi kesalahan koneksi.", false);
    }
  };

  const loadUserSharedHabits = async () => {
    if (!sharedHabitsListContainer) return;
    sharedHabitsListContainer.innerHTML =
      '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat habit bersama...</p>';
    try {
      const response = await fetch(
        `${API_BASE_URL}?action=list_user_shared_habits`
      );
      const sharedHabits = await response.json();
      renderSharedHabits(sharedHabits);
    } catch (error) {
      console.error("Error loading shared habits:", error);
      sharedHabitsListContainer.innerHTML =
        '<p class="no-items-message">Gagal memuat habit bersama.</p>';
    }
  };

  const renderSharedHabits = (sharedHabits) => {
    if (!sharedHabitsListContainer) return;
    sharedHabitsListContainer.innerHTML = "";
    if (
      !sharedHabits ||
      !Array.isArray(sharedHabits) ||
      sharedHabits.length === 0
    ) {
      sharedHabitsListContainer.innerHTML =
        '<p class="no-items-message">Belum ada habit bersama buddy. Klik "Bagikan Habit Baru".</p>';
      return;
    }
    sharedHabits.forEach((sh) => {
      const item = document.createElement("div");
      item.classList.add("shared-habit-item-display");
      const buddyName =
        userProfile.username === sh.owner_username
          ? sh.buddy_username
          : sh.owner_username;
      const bgColor = sh.habit_color.includes("-check")
        ? sh.habit_color.split("-check")[0]
        : sh.habit_color || "#e9ecef";
      item.innerHTML = `
        <div class="shared-habit-item-info">
            <span class="icon" style="background-color: ${bgColor}; color: white;">${
        sh.habit_icon || "🎯"
      }</span>
            <div> <span class="name">${
              sh.habit_name
            }</span> <p class="status">Dengan: <b>${buddyName}</b> (Pemilik: ${
        sh.owner_username
      })</p> </div>
        </div>
        <div class="shared-habit-item-actions">
            ${
              sh.is_owner
                ? `<button class="btn btn-sm btn-warning revoke-shared-habit" data-shared-id="${sh.shared_id}" data-habit-name="${sh.habit_name}" title="Batalkan Berbagi"><i class="fas fa-times-circle"></i> Batalkan</button>`
                : ""
            }
        </div>`;
      item
        .querySelector(".revoke-shared-habit")
        ?.addEventListener("click", async (e) => {
          const sharedId = e.currentTarget.dataset.sharedId;
          const habitName = e.currentTarget.dataset.habitName;
          if (
            confirm(
              `Yakin membatalkan berbagi habit "${habitName}"? Buddy tidak akan melihatnya lagi.`
            )
          ) {
            await revokeSharedHabit(sharedId);
          }
        });
      sharedHabitsListContainer.appendChild(item);
    });
  };

  const revokeSharedHabit = async (sharedId) => {
    const formData = new FormData();
    formData.append("action", "revoke_shared_habit");
    formData.append("shared_id", sharedId);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      const statusMsgElement = sharedHabitsListContainer.previousElementSibling;
      if (result.success) {
        if (
          statusMsgElement &&
          statusMsgElement.tagName === "H3" &&
          statusMsgElement.nextElementSibling?.classList.contains(
            "list-container"
          )
        ) {
          showBuddyFormStatus(
            statusMsgElement.nextElementSibling,
            result.message,
            true,
            2000
          );
        } else if (sharedHabitsListContainer.parentElement) {
          const tempStatus = document.createElement("p");
          sharedHabitsListContainer.parentElement.insertBefore(
            tempStatus,
            sharedHabitsListContainer
          );
          showBuddyFormStatus(tempStatus, result.message, true, 2000);
          setTimeout(() => tempStatus.remove(), 2500);
        }
        loadUserSharedHabits();
        loadHabits();
        fetchCalendarDataForCurrentMonth(true);
      } else {
        if (
          statusMsgElement &&
          statusMsgElement.tagName === "H3" &&
          statusMsgElement.nextElementSibling?.classList.contains(
            "list-container"
          )
        ) {
          showBuddyFormStatus(
            statusMsgElement.nextElementSibling,
            result.message || "Gagal membatalkan.",
            false
          );
        } else if (sharedHabitsListContainer.parentElement) {
          const tempStatus = document.createElement("p");
          sharedHabitsListContainer.parentElement.insertBefore(
            tempStatus,
            sharedHabitsListContainer
          );
          showBuddyFormStatus(
            tempStatus,
            result.message || "Gagal membatalkan.",
            false
          );
          setTimeout(() => tempStatus.remove(), 4500);
        }
      }
    } catch (error) {
      console.error("Error revoking shared habit:", error);
      const statusMsgElement = sharedHabitsListContainer.previousElementSibling;
      if (
        statusMsgElement &&
        statusMsgElement.tagName === "H3" &&
        statusMsgElement.nextElementSibling?.classList.contains(
          "list-container"
        )
      ) {
        showBuddyFormStatus(
          statusMsgElement.nextElementSibling,
          "Terjadi kesalahan koneksi.",
          false
        );
      } else if (sharedHabitsListContainer.parentElement) {
        const tempStatus = document.createElement("p");
        sharedHabitsListContainer.parentElement.insertBefore(
          tempStatus,
          sharedHabitsListContainer
        );
        showBuddyFormStatus(tempStatus, "Terjadi kesalahan koneksi.", false);
        setTimeout(() => tempStatus.remove(), 4500);
      }
    }
  };

  const loadIncomingShareRequests = async () => {
    if (!buddyRequestsListContainer || !buddyRequestCountBadge) return;
    buddyRequestsListContainer.innerHTML =
      '<p class="loading-message"><i class="fas fa-spinner fa-spin"></i> Memuat permintaan...</p>';
    try {
      const response = await fetch(
        `${API_BASE_URL}?action=list_incoming_share_requests`
      );
      const requests = await response.json();
      renderIncomingShareRequests(requests);
      const requestCount = Array.isArray(requests) ? requests.length : 0;
      buddyRequestCountBadge.textContent = requestCount > 0 ? requestCount : "";
      buddyRequestCountBadge.style.display =
        requestCount > 0 ? "inline-block" : "none";
    } catch (error) {
      console.error("Error loading incoming share requests:", error);
      buddyRequestsListContainer.innerHTML =
        '<p class="no-items-message">Gagal memuat permintaan.</p>';
      buddyRequestCountBadge.style.display = "none";
    }
  };

  const renderIncomingShareRequests = (requests) => {
    if (!buddyRequestsListContainer) return;
    buddyRequestsListContainer.innerHTML = "";
    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      buddyRequestsListContainer.innerHTML =
        '<p class="no-items-message">Tidak ada permintaan berbagi habit.</p>';
      return;
    }
    requests.forEach((req) => {
      const item = document.createElement("div");
      item.classList.add("request-item");
      item.innerHTML = `
          <div class="request-item-info">
              <img src="${
                req.sharer_profile_pic || "assets/profile_placeholder.png"
              }" alt="Foto ${req.sharer_username}">
              <div> <span class="name">${
                req.sharer_username
              }</span> <p class="status">Ingin berbagi habit:</p>
                    <p class="habit-details-request"><span class="icon">${
                      req.habit_icon
                    }</span> ${req.habit_name}</p>
                    <p class="status">Dikirim: ${formatTimestamp(
                      req.shared_at,
                      true
                    )}</p> </div>
          </div>
          <div class="request-item-actions">
              <button class="btn btn-sm btn-success accept-share-request" data-shared-id="${
                req.shared_id
              }"><i class="fas fa-check"></i> Terima</button>
              <button class="btn btn-sm btn-danger decline-share-request" data-shared-id="${
                req.shared_id
              }"><i class="fas fa-times"></i> Tolak</button>
          </div>`;
      item
        .querySelector(".accept-share-request")
        .addEventListener("click", () =>
          processShareRequest(req.shared_id, "accept_share_request")
        );
      item
        .querySelector(".decline-share-request")
        .addEventListener("click", () =>
          processShareRequest(req.shared_id, "decline_share_request")
        );
      buddyRequestsListContainer.appendChild(item);
    });
  };

  const processShareRequest = async (sharedId, requestAction) => {
    const formData = new FormData();
    formData.append("action", requestAction);
    formData.append("shared_id", sharedId);
    const requestItemElement = buddyRequestsListContainer
      .querySelector(
        `.request-item .accept-share-request[data-shared-id="${sharedId}"]`
      )
      ?.closest(".request-item");
    if (requestItemElement) {
      requestItemElement
        .querySelectorAll("button")
        .forEach((btn) => (btn.disabled = true));
    }
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      const statusMsgElement =
        buddyRequestsListContainer.previousElementSibling;
      if (
        statusMsgElement &&
        statusMsgElement.tagName === "H3" &&
        statusMsgElement.nextElementSibling?.classList.contains(
          "list-container"
        )
      ) {
        showBuddyFormStatus(
          statusMsgElement.nextElementSibling,
          result.message,
          result.success
        );
      } else if (buddyRequestsListContainer.parentElement) {
        const tempStatus = document.createElement("p");
        buddyRequestsListContainer.parentElement.insertBefore(
          tempStatus,
          buddyRequestsListContainer
        );
        showBuddyFormStatus(tempStatus, result.message, result.success);
        setTimeout(() => tempStatus.remove(), result.success ? 2500 : 4500);
      }

      if (result.success) {
        loadIncomingShareRequests();
        if (requestAction === "accept_share_request") {
          loadUserSharedHabits();
          if (
            document
              .getElementById("dashboard-content")
              ?.classList.contains("active")
          ) {
            loadHabits();
          }
          fetchCalendarDataForCurrentMonth(true);
        }
      } else {
        if (requestItemElement) {
          requestItemElement
            .querySelectorAll("button")
            .forEach((btn) => (btn.disabled = false));
        }
      }
    } catch (error) {
      console.error(
        `Error processing share request (${requestAction}):`,
        error
      );
      const statusMsgElement =
        buddyRequestsListContainer.previousElementSibling;
      if (
        statusMsgElement &&
        statusMsgElement.tagName === "H3" &&
        statusMsgElement.nextElementSibling?.classList.contains(
          "list-container"
        )
      ) {
        showBuddyFormStatus(
          statusMsgElement.nextElementSibling,
          "Terjadi kesalahan koneksi.",
          false
        );
      } else if (buddyRequestsListContainer.parentElement) {
        const tempStatus = document.createElement("p");
        buddyRequestsListContainer.parentElement.insertBefore(
          tempStatus,
          buddyRequestsListContainer
        );
        showBuddyFormStatus(tempStatus, "Terjadi kesalahan koneksi.", false);
        setTimeout(() => tempStatus.remove(), 4500);
      }
      if (requestItemElement) {
        requestItemElement
          .querySelectorAll("button")
          .forEach((btn) => (btn.disabled = false));
      }
    }
  };

  const openShareHabitModal = async () => {
    if (!shareHabitModal || !selectHabitToShare || !selectBuddyToShareWith)
      return;
    shareHabitForm.reset();
    selectHabitToShare.innerHTML = '<option value="">Memuat habit...</option>';
    selectBuddyToShareWith.innerHTML =
      '<option value="">Memuat buddy...</option>';
    if (shareHabitStatusMsg) shareHabitStatusMsg.style.display = "none";
    confirmShareHabitBtn.disabled = true;
    shareHabitModal.style.display = "block";
    shareHabitModal.setAttribute("aria-hidden", "false");
    try {
      const habitsResponse = await fetch(
        `${API_BASE_URL}?action=get_shareable_habits`
      );
      const shareableHabits = await habitsResponse.json();
      selectHabitToShare.innerHTML =
        '<option value="">-- Pilih Habit --</option>';
      if (Array.isArray(shareableHabits) && shareableHabits.length > 0) {
        shareableHabits.forEach((habit) => {
          const option = document.createElement("option");
          option.value = habit.id;
          option.textContent = `${habit.icon} ${habit.name}`;
          selectHabitToShare.appendChild(option);
        });
      } else
        selectHabitToShare.innerHTML =
          '<option value="">Tidak ada habit asli untuk dibagikan</option>';
    } catch (error) {
      console.error("Error loading shareable habits:", error);
      selectHabitToShare.innerHTML =
        '<option value="">Gagal memuat habit</option>';
    }
    try {
      const buddiesResponse = await fetch(
        `${API_BASE_URL}?action=get_buddies_for_sharing`
      );
      const buddies = await buddiesResponse.json();
      selectBuddyToShareWith.innerHTML =
        '<option value="">-- Pilih Buddy --</option>';
      if (Array.isArray(buddies) && buddies.length > 0) {
        buddies.forEach((buddy) => {
          const option = document.createElement("option");
          option.value = buddy.id;
          option.textContent = buddy.username;
          selectBuddyToShareWith.appendChild(option);
        });
      } else
        selectBuddyToShareWith.innerHTML =
          '<option value="">Tidak ada buddy untuk diajak</option>';
    } catch (error) {
      console.error("Error loading buddies for sharing:", error);
      selectBuddyToShareWith.innerHTML =
        '<option value="">Gagal memuat buddy</option>';
    }
    const checkSelections = () => {
      confirmShareHabitBtn.disabled = !(
        selectHabitToShare.value &&
        selectBuddyToShareWith.value &&
        selectHabitToShare.options.length > 1 &&
        selectBuddyToShareWith.options.length > 1
      );
    };
    selectHabitToShare.addEventListener("change", checkSelections);
    selectBuddyToShareWith.addEventListener("change", checkSelections);
    checkSelections();
  };

  const closeShareHabitModal = () => {
    if (shareHabitModal) {
      shareHabitModal.style.display = "none";
      shareHabitModal.setAttribute("aria-hidden", "true");
    }
  };

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
    contentSections.forEach((section) =>
      section.classList.toggle("active", section.id === targetId)
    );
    updateMainHeader(targetId);

    const aiCoachIframe = document.getElementById("ai-coach-iframe");
    if (targetId === "ai-coach-content") {
      if (aiCoachIframe && aiCoachIframe.src === "about:blank") {
        aiCoachIframe.src = "aicoach.html";
      }
    } else {
      if (aiCoachIframe) {
        aiCoachIframe.src = "about:blank";
      }
    }

    if (addHabitHeaderBtn)
      addHabitHeaderBtn.style.display =
        targetId === "dashboard-content" ? "inline-flex" : "none";
    if (habitCategoryFilterContainer)
      habitCategoryFilterContainer.style.display =
        targetId === "dashboard-content" ? "flex" : "none";

    if (targetId === "dashboard-content") {
      loadHabits();
    }
    if (targetId === "history-content") loadAndRenderHistory();
    else if (targetId === "profile-content") {
      setupProfileInteractions();
    } else if (targetId === "buddy-content") {
      const activeTabLink = buddyContentSection?.querySelector(
        ".buddy-tab-link.active"
      );
      setActiveBuddyTab(activeTabLink?.dataset.tab || "my-buddies-tab");
      loadIncomingShareRequests();
    }
  };

  const updateMainHeader = (activeSectionId) => {
    if (!mainTitle || !mainSubtitle) return;
    let title = "Dashboard";
    let subtitle = "Habit hari ini";
    if (activeSectionId === "history-content") {
      title = "Riwayat";
      subtitle = "Lihat kembali progres habit Anda.";
    } else if (activeSectionId === "profile-content") {
      title = "Profil Akun";
      subtitle = "Kelola informasi akun Anda.";
    } else if (activeSectionId === "notes-content") {
      title = "Catatan Pribadi";
      subtitle = "Tulis dan simpan catatan Anda.";
    } else if (activeSectionId === "buddy-content") {
      title = "Habit Buddy";
      subtitle = "Bangun kebiasaan bersama teman.";
    } else if (activeSectionId === "ai-coach-content") {
      title = "AI Coach";
      subtitle = "Asisten AI, yang dirancang untuk membantu habit kamu.";
    }
    mainTitle.textContent = title;
    mainSubtitle.textContent = subtitle;
  };

  closeModalBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  window.addEventListener("click", (event) => {
    if (event.target === habitModal) closeModal();
    if (event.target === shareHabitModal) closeShareHabitModal();
  });

  isDurationUnlimitedCheckbox?.addEventListener("change", () => {
    durationSettingsDiv.classList.toggle(
      "hidden",
      isDurationUnlimitedCheckbox.checked
    );
  });

  habitForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = habitIdInput.value;
    const name = habitNameInput.value.trim();
    const icon = habitIconInput.value.trim();
    const category = habitCategoryInput.value;
    const startDate = habitStartDateInput.value;
    const isUnlimited = isDurationUnlimitedCheckbox.checked;

    if (!name) {
      alert("Nama habit tidak boleh kosong!");
      habitNameInput.focus();
      return;
    }
    if (!startDate) {
      alert("Tanggal mulai habit tidak boleh kosong!");
      habitStartDateInput.focus();
      return;
    }

    saveHabitBtn.disabled = true;
    saveHabitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${
      id ? "Updating..." : "Saving..."
    }`;
    const formData = new FormData();
    formData.append("name", name);
    formData.append("icon", icon);
    formData.append("category", category);
    formData.append("habit_start_date", startDate);
    formData.append("is_unlimited", isUnlimited);
    if (!isUnlimited) {
      formData.append("duration_value", durationValueInput.value);
      formData.append("duration_unit", durationUnitSelect.value);
    }
    if (id) formData.append("id", id);

    await addOrUpdateHabitOnServer(!!id, formData);
    saveHabitBtn.disabled = false;
    saveHabitBtn.textContent = id ? "Update" : "Simpan";
    closeModal();
  });

  habitListContainer?.addEventListener("click", (event) => {
    const target = event.target;
    const habitItem = target.closest(".habit-item");
    if (!habitItem) return;
    const habitId = habitItem.dataset.id;
    if (target.closest(".edit-btn")) {
      const habitToEdit = habits.find((h) => String(h.id) === String(habitId));
      if (habitToEdit) openModal("edit", habitToEdit);
    } else if (target.closest(".delete-btn")) deleteHabit(habitId);
    else if (
      target.closest(".checkbox") ||
      target === habitItem ||
      target.closest(".habit-details") ||
      target.closest(".icon")
    ) {
      if (!target.closest(".habit-actions")) {
        toggleHabitCheck(habitId);
      }
    }
  });

  habitListContainer?.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target.classList.contains("checkbox")
    ) {
      event.preventDefault();
      const habitItem = event.target.closest(".habit-item");
      if (habitItem) toggleHabitCheck(habitItem.dataset.id);
    }
  });

  habitCategoryFilterContainer?.addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.dataset.category) {
      const category = event.target.dataset.category;
      currentHabitFilter = category;
      habitCategoryFilterContainer
        .querySelectorAll("button")
        .forEach((btn) => btn.classList.remove("active"));
      event.target.classList.add("active");
      sortAndRenderHabits();
    }
  });

  prevMonthBtn?.addEventListener("click", async () => {
    currentDisplayMonth--;
    if (currentDisplayMonth < 0) {
      currentDisplayMonth = 11;
      currentDisplayYear--;
    }
    await fetchCalendarDataForCurrentMonth(true);
    renderCalendar(currentDisplayYear, currentDisplayMonth);
  });

  nextMonthBtn?.addEventListener("click", async () => {
    currentDisplayMonth++;
    if (currentDisplayMonth > 11) {
      currentDisplayMonth = 0;
      currentDisplayYear++;
    }
    await fetchCalendarDataForCurrentMonth(true);
    renderCalendar(currentDisplayYear, currentDisplayMonth);
  });

  addHabitHeaderBtn?.addEventListener("click", () => openModal("add"));

  mainNav?.addEventListener("click", (event) => {
    const link = event.target.closest(".nav-link");
    if (!link?.dataset.target) return;
    event.preventDefault();
    const targetId = link.dataset.target;
    navLinks?.forEach((navLink) => navLink.classList.remove("active"));
    link.classList.add("active");
    showContentSection(targetId);
    window.location.hash = link.getAttribute("href").substring(1);
  });

  sidebarProfileTrigger?.addEventListener("click", (event) => {
    event.preventDefault();
    navLinks?.forEach((navLink) => navLink.classList.remove("active"));
    const profileNavLink = mainNav?.querySelector(
      '.nav-link[data-target="profile-content"]'
    );
    if (profileNavLink) profileNavLink.classList.add("active");
    showContentSection("profile-content");
    window.location.hash = "profile";
  });

  userNoteTextarea?.addEventListener("input", () => {
    if (saveNoteBtn) {
      saveNoteBtn.disabled = userNoteTextarea.value === originalNoteContent;
    }
  });
  saveNoteBtn?.addEventListener("click", saveUserNote);

  buddyTabLinks?.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetTabId = e.currentTarget.dataset.tab;
      if (targetTabId) setActiveBuddyTab(targetTabId);
    });
  });

  generateNewInviteCodeBtn?.addEventListener("click", async () => {
    if (!myInviteCodeInput || !inviteCodeStatusMsg) return;
    generateNewInviteCodeBtn.disabled = true;
    generateNewInviteCodeBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Membuat...';
    try {
      const response = await fetch(
        `${API_BASE_URL}?action=generate_invite_code`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success && data.invite_code) {
        myInviteCodeInput.value = data.invite_code;
        showBuddyFormStatus(
          inviteCodeStatusMsg,
          "Kode undangan baru berhasil dibuat!",
          true
        );
      } else
        showBuddyFormStatus(
          inviteCodeStatusMsg,
          data.message || "Gagal membuat kode undangan.",
          false
        );
    } catch (error) {
      console.error("Error generating invite code:", error);
      showBuddyFormStatus(
        inviteCodeStatusMsg,
        "Terjadi kesalahan koneksi.",
        false
      );
    } finally {
      generateNewInviteCodeBtn.disabled = false;
      generateNewInviteCodeBtn.innerHTML =
        '<i class="fas fa-sync-alt"></i> Buat Kode Undangan Baru';
    }
  });

  copyInviteCodeBtn?.addEventListener("click", () => {
    if (
      myInviteCodeInput &&
      myInviteCodeInput.value &&
      myInviteCodeInput.value.match(/^[A-Z0-9]{8}$/) &&
      inviteCodeStatusMsg
    ) {
      navigator.clipboard
        .writeText(myInviteCodeInput.value)
        .then(() =>
          showBuddyFormStatus(
            inviteCodeStatusMsg,
            "Kode disalin ke clipboard!",
            true
          )
        )
        .catch((err) => {
          console.error("Gagal menyalin: ", err);
          showBuddyFormStatus(
            inviteCodeStatusMsg,
            "Gagal menyalin. Salin manual.",
            false
          );
        });
    } else if (inviteCodeStatusMsg)
      showBuddyFormStatus(
        inviteCodeStatusMsg,
        "Tidak ada kode valid untuk disalin.",
        false
      );
  });

  acceptBuddyInviteBtn?.addEventListener("click", async () => {
    if (!enterBuddyCodeInput || !acceptCodeStatusMsg) return;
    const code = enterBuddyCodeInput.value.trim();
    if (!code) {
      showBuddyFormStatus(
        acceptCodeStatusMsg,
        "Masukkan kode undangan.",
        false
      );
      return;
    }
    acceptBuddyInviteBtn.disabled = true;
    acceptBuddyInviteBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    const formData = new FormData();
    formData.append("action", "accept_invite");
    formData.append("invite_code", code);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        showBuddyFormStatus(acceptCodeStatusMsg, data.message, true);
        enterBuddyCodeInput.value = "";
        loadMyBuddiesList();
      } else showBuddyFormStatus(acceptCodeStatusMsg, data.message, false);
    } catch (error) {
      console.error("Error accepting invite:", error);
      showBuddyFormStatus(
        acceptCodeStatusMsg,
        "Terjadi kesalahan koneksi.",
        false
      );
    } finally {
      acceptBuddyInviteBtn.disabled = false;
      acceptBuddyInviteBtn.innerHTML =
        '<i class="fas fa-user-plus"></i> Terima Undangan';
    }
  });

  initiateShareHabitBtn?.addEventListener("click", openShareHabitModal);
  closeShareModalBtn?.addEventListener("click", closeShareHabitModal);
  cancelShareHabitBtn?.addEventListener("click", closeShareHabitModal);

  shareHabitForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (
      !selectHabitToShare ||
      !selectBuddyToShareWith ||
      !confirmShareHabitBtn ||
      !shareHabitStatusMsg
    )
      return;
    const habitId = selectHabitToShare.value;
    const buddyId = selectBuddyToShareWith.value;
    if (!habitId) {
      showBuddyFormStatus(
        shareHabitStatusMsg,
        "Pilih habit yang ingin dibagikan.",
        false
      );
      return;
    }
    if (!buddyId) {
      showBuddyFormStatus(
        shareHabitStatusMsg,
        "Pilih buddy untuk diajak.",
        false
      );
      return;
    }
    confirmShareHabitBtn.disabled = true;
    confirmShareHabitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    const formData = new FormData();
    formData.append("action", "share_habit_request");
    formData.append("habit_id", habitId);
    formData.append("buddy_id", buddyId);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      showBuddyFormStatus(shareHabitStatusMsg, result.message, result.success);
      if (result.success) {
        setTimeout(closeShareHabitModal, result.success ? 2000 : 4000);
      }
    } catch (error) {
      console.error("Error sharing habit:", error);
      showBuddyFormStatus(
        shareHabitStatusMsg,
        "Terjadi kesalahan koneksi.",
        false
      );
    } finally {
      confirmShareHabitBtn.disabled = false;
      confirmShareHabitBtn.innerHTML = "Kirim Undangan Berbagi";
    }
  });

  const initializeApp = async () => {
    console.log("Initializing HabitHub App...");
    await loadProfileData();

    const initialHash = window.location.hash.substring(1);
    let initialTargetId = "dashboard-content";
    let activeLink = mainNav?.querySelector(
      '.nav-link[data-target="dashboard-content"]'
    );

    if (initialHash) {
      const potentialLink = mainNav?.querySelector(
        `.nav-link[href="#${initialHash}"]`
      );
      if (
        potentialLink?.dataset.target &&
        document.getElementById(potentialLink.dataset.target)
      ) {
        initialTargetId = potentialLink.dataset.target;
        activeLink = potentialLink;
      } else if (
        initialHash === "profile" &&
        document.getElementById("profile-content")
      ) {
        initialTargetId = "profile-content";
        activeLink = mainNav?.querySelector(
          '.nav-link[data-target="profile-content"]'
        );
      } else if (
        initialHash === "notes" &&
        document.getElementById("notes-content")
      ) {
        initialTargetId = "notes-content";
        activeLink = mainNav?.querySelector(
          '.nav-link[data-target="notes-content"]'
        );
      } else if (
        initialHash === "buddy" &&
        document.getElementById("buddy-content")
      ) {
        initialTargetId = "buddy-content";
        activeLink = mainNav?.querySelector(
          '.nav-link[data-target="buddy-content"]'
        );
      } else if (
        initialHash === "ai-coach" &&
        document.getElementById("ai-coach-content")
      ) {
        initialTargetId = "ai-coach-content";
        activeLink = mainNav?.querySelector(
          '.nav-link[data-target="ai-coach-content"]'
        );
      }
    }

    navLinks?.forEach((navLink) => navLink.classList.remove("active"));
    if (activeLink) activeLink.classList.add("active");
    else if (initialTargetId === "profile-content") {
      const profileNavLink = mainNav?.querySelector(
        '.nav-link[data-target="profile-content"]'
      );
      if (profileNavLink) profileNavLink.classList.add("active");
    }

    showContentSection(initialTargetId);

    await fetchCalendarDataForCurrentMonth(true);
    renderCalendar(currentDisplayYear, currentDisplayMonth);

    if (buddyRequestCountBadge) loadIncomingShareRequests();
    console.log("HabitHub App Initialized.");
  };

  initializeApp();
});
