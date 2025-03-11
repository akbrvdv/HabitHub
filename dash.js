document.addEventListener('DOMContentLoaded', function () {
    // Sidebar functionality (sama seperti sebelumnya)
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        item.addEventListener('click', function (event) {
            // Hapus kelas 'active' dari semua item menu
            menuItems.forEach(item => item.classList.remove('active'));

            // Tambahkan kelas 'active' ke item yang diklik
            this.classList.add('active');

            // Tambahkan logika untuk memuat konten yang berbeda di sini berdasarkan menu yang diklik
            // Contoh (perlu disesuaikan):
            if (this.textContent.includes('Beranda')) {
                // loadHomePageContent();
                console.log("Halaman Beranda dipilih");
            } else if (this.textContent.includes('Kalender')) {
                // loadCalendarPageContent();
                console.log("Halaman Kalender dipilih");
            }
             else if (this.textContent.includes('Progress')) {
                // loadCalendarPageContent();
                console.log("Halaman Progress dipilih");
            }
            else if (this.textContent.includes('Settings')) {
                // loadCalendarPageContent();
                console.log("Halaman Settings dipilih");
            }
        });
    });


    // Habit tracking functionality
    const habitItems = document.querySelectorAll('.habit-item');

    habitItems.forEach(habitItem => {
        const checkButton = habitItem.querySelector('.btn-check');
        const progress = habitItem.querySelector('.progress');
        const progressPercentage = habitItem.querySelector('.progress-percentage');

        checkButton.addEventListener('click', function () {
            checkButton.classList.toggle('complete'); // Toggle complete class

            const isComplete = checkButton.classList.contains('complete');

            // Simulate updating progress (replace with actual logic)
            if (isComplete) {
                progress.style.width = '100%';
                progressPercentage.textContent = '100%';
            } else {
                progress.style.width = '0%';
                progressPercentage.textContent = '0%';
            }
        });
    });

    // Animasikan progress bar saat halaman dimuat (untuk tujuan demo)
    document.querySelectorAll('.progress').forEach(bar => {
        bar.style.width = bar.parentNode.dataset.progress + '%';
    });
});