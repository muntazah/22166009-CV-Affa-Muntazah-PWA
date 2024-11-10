// Membuat atau membuka IndexedDB
const dbRequest = indexedDB.open("ContactDB", 1);
let lastFeedbackTime = 0; // Menyimpan waktu pengiriman feedback terakhir
let currentUser = { name: "Ahmad Reza Yuansyah Putra", email: "jago@gmail.com" }; // Ganti dengan informasi pengguna yang sesuai

// Menyiapkan store dan index saat pertama kali dibuka
dbRequest.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore("ContactStore", { keyPath: "id", autoIncrement: true });
};

// Memuat feedback saat database dibuka
dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    loadFeedback(db); // Tampilkan feedback yang ada saat halaman dimuat

    // Fungsi untuk menyimpan feedback
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.onsubmit = function(event) {
            event.preventDefault(); // Mencegah pengiriman form secara default

            const name = document.getElementById("cname").value;
            const email = document.getElementById("cemail").value;
            const message = document.getElementById("cmessage").value;

            // Validasi: pastikan feedback tidak kosong
            if (!name || !email || !message) {
                alert("Semua bidang harus diisi.");
                return;
            }

            // Validasi: cek waktu pengiriman feedback terakhir
            const currentTime = Date.now();
            if (currentTime - lastFeedbackTime < 30000) { // 30 detik
                alert("Anda hanya dapat mengirim feedback sekali setiap 30 detik.");
                return;
            }

            // Validasi: cek duplikat feedback
            const transaction = db.transaction("ContactStore", "readonly");
            const objectStore = transaction.objectStore("ContactStore");
            const getAllRequest = objectStore.getAll();

            getAllRequest.onsuccess = (event) => {
                const feedbacks = event.target.result;
                const isDuplicate = feedbacks.some(feedback => 
                    feedback.name === name && feedback.email === email && feedback.message === message
                );

                if (isDuplicate) {
                    alert("Feedback dengan nama dan email yang sama sudah ada.");
                    return;
                }

                // Jika tidak ada duplikat, simpan feedback
                const writeTransaction = db.transaction("ContactStore", "readwrite");
                const writeObjectStore = writeTransaction.objectStore("ContactStore");

                writeObjectStore.add({ name, email, message });

                writeTransaction.oncomplete = () => {
                    console.log("Feedback saved");
                    loadFeedback(db); // Memperbarui daftar feedback setelah menyimpan
                    lastFeedbackTime = Date.now(); // Perbarui waktu pengiriman feedback terakhir
                    contactForm.reset(); // Reset form setelah menyimpan
                };

                writeTransaction.onerror = (event) => {
                    console.error("Error saving feedback:", event.target.error);
                };
            };

            getAllRequest.onerror = (event) => {
                console.error("Error getting feedbacks:", event.target.error);
            };
        };
    } else {
        console.error("Form with ID 'contactForm' not found");
    }
};

  // Fungsi untuk memuat dan menampilkan feedback
  function loadFeedback(db) {
    const transaction = db.transaction("ContactStore", "readonly");
    const objectStore = transaction.objectStore("ContactStore");
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = (event) => {
        const feedbacks = event.target.result;
        const feedbackDisplay = document.getElementById("feedbackDisplay");

        if (feedbackDisplay) {
            feedbackDisplay.innerHTML = ""; // Bersihkan area tampilan sebelum menambah

            feedbacks.forEach(feedback => {
                const feedbackCard = document.createElement("div");
                feedbackCard.classList.add("feedback-card"); // Menambahkan kelas untuk gaya

                // Menambahkan HTML untuk menampilkan feedback dan tombol hapus
                feedbackCard.innerHTML = `
                    <div class="feedback-header">
                        <strong>${feedback.name} (${feedback.email})</strong>
                        <button class="delete-btn" data-id="${feedback.id}">Hapus</button>
                    </div>
                    <div class="feedback-message">${feedback.message}</div>
                `;

                // Menambahkan event listener untuk tombol hapus
                feedbackCard.querySelector('.delete-btn').addEventListener('click', function() {
                    // Cek apakah pengguna saat ini adalah pemilik feedback
                    if (feedback.name === currentUser.name && feedback.email === currentUser.email) {
                        deleteFeedback(db, feedback.id);
                    } else {
                        alert("Anda tidak memiliki hak untuk menghapus feedback ini.");
                    }
                });

                feedbackDisplay.appendChild(feedbackCard);
            });
        } else {
            console.error("Element with ID 'feedbackDisplay' not found");
        }
    };

    getAllRequest.onerror = (event) => {
        console.error("Error getting feedbacks:", event.target.error);
    };
}

// Fungsi untuk menghapus feedback dari IndexedDB
function deleteFeedback(db, id) {
    const transaction = db.transaction("ContactStore", "readwrite");
    const objectStore = transaction.objectStore("ContactStore");
    const deleteRequest = objectStore.delete(id);

    deleteRequest.onsuccess = () => {
        console.log("Feedback deleted");
        loadFeedback(db); // Memperbarui daftar feedback setelah menghapus
    };

    deleteRequest.onerror = (event) => {
        console.error("Error deleting feedback:", event.target.error);
    };
}
