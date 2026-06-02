// --- BASIS DATA LOKAL (Ganti ke V5 untuk mereset gambar) ---
const DB_USERS = 'ketemu_users_v5';
const DB_LAPORAN = 'ketemu_laporan_v5';
const DB_KLAIM = 'ketemu_klaim_v5';
const DB_NOTIF = 'ketemu_notif_v5';
const SESSION = 'ketemu_session_v5';

let currentUser = null;
let aiModel = null;
let base64Foto = "";
let gpsLocation = "";

// Seeding Data Awal (Dengan Gambar Resolusi Tinggi yang AKURAT)
function seedDatabase() {
    if (!localStorage.getItem(DB_USERS)) {
        localStorage.setItem(DB_USERS, JSON.stringify([
            { id: 1, nama: 'Siti Fayza Kamila', email: 'fayza@student.ipb.ac.id', pass: 'password123', poin: 150 },
            { id: 2, nama: 'Irham Nurhakim', email: 'irham@student.ipb.ac.id', pass: 'password123', poin: 80 }
        ]));
    }
    if (!localStorage.getItem(DB_LAPORAN)) {
        localStorage.setItem(DB_LAPORAN, JSON.stringify([
            { id: 101, userId: 1, jenis: 'Hilang', judul: 'KTM atas nama Siti Fayza', kategori: 'Dokumen', tanggal: '2026-04-28', lokasi: 'Fakultas Ekonomi IPB', deskripsi: 'Hilang KTM warna biru di area Fakultas Ekonomi sekitar pukul 10 pagi....', foto: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80', status: 'Aktif', pelapor: 'Siti Fayza Kamila', gps: '' },
            { id: 102, userId: 2, jenis: 'Hilang', judul: 'Dompet', kategori: 'Lainnya', tanggal: '2026-04-29', lokasi: 'ccr', deskripsi: 'Dompet hitam jatuh di sekitar lorong.', foto: 'https://images.unsplash.com/photo-1605336040582-772c67dc8bb9?auto=format&fit=crop&w=400&q=80', status: 'Aktif', pelapor: 'Anonim', gps: '' },
            { id: 103, userId: 3, jenis: 'Temuan', judul: 'Botol Minum Hitam Merk Tupperware', kategori: 'Lainnya', tanggal: '2026-04-29', lokasi: 'Perpustakaan Lt.2', deskripsi: 'Ditemukan botol minum hitam tertinggal di meja baca.', foto: 'https://images.unsplash.com/photo-1614806687036-7c913eb06f88?auto=format&fit=crop&w=400&q=80', status: 'Aktif', pelapor: 'Irham Nurhakim', gps: '' },
            { id: 104, userId: 3, jenis: 'Temuan', judul: 'Dompet Cokelat Wanita', kategori: 'Dompet', tanggal: '2026-05-06', lokasi: 'Kantin Kampus', deskripsi: 'Menemukan dompet lipat warna cokelat tertinggal di meja Kantin. Bagi yang merasa kehilangan, silakan ajukan klaim dan sebutkan isi di dalam dompet ini sebagai bukti.', foto: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80', status: 'Aktif', pelapor: 'Irham Nurhakim', gps: '' }
        ]));
    }
    if (!localStorage.getItem(DB_KLAIM)) localStorage.setItem(DB_KLAIM, JSON.stringify([]));
    if (!localStorage.getItem(DB_NOTIF)) localStorage.setItem(DB_NOTIF, JSON.stringify([]));
}

window.onload = () => { seedDatabase(); checkSession(); initAI(); };

function navigate(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    window.scrollTo(0, 0);
    if (pageId === 'home') renderStats();
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'explore') renderExplore();
    if (pageId === 'notif') renderNotif();
}

// --- OTENTIKASI ---
function checkSession() {
    currentUser = JSON.parse(localStorage.getItem(SESSION));
    if (currentUser) {
        document.getElementById('nav-guest').style.display = 'none';
        document.getElementById('hero-guest').style.display = 'none';
        document.getElementById('nav-auth').style.display = 'flex';
        document.getElementById('hero-auth').style.display = 'flex';
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
        
        const users = JSON.parse(localStorage.getItem(DB_USERS));
        const updatedUser = users.find(u => u.id === currentUser.id);
        document.getElementById('nav-username').innerText = updatedUser.nama;
        document.getElementById('nav-poin').innerText = updatedUser.poin + " Poin";
        
        updateNotifBadge();
    } else {
        document.getElementById('nav-guest').style.display = 'flex';
        document.getElementById('hero-guest').style.display = 'flex';
        document.getElementById('nav-auth').style.display = 'none';
        document.getElementById('hero-auth').style.display = 'none';
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
    }
    renderStats();
}

function login() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const users = JSON.parse(localStorage.getItem(DB_USERS));
    const user = users.find(u => u.email === email && u.pass === pass);
    if (user) { localStorage.setItem(SESSION, JSON.stringify(user)); checkSession(); navigate('dashboard'); } 
    else { alert("Email atau Password salah!"); }
}

function register() {
    const nama = document.getElementById('reg-nama').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    if (pass.length < 6) return alert("Password minimal 6 karakter!");
    const users = JSON.parse(localStorage.getItem(DB_USERS));
    if (users.find(u => u.email === email)) return alert("Email sudah terdaftar!");
    users.push({ id: Date.now(), nama, email, pass, poin: 0 });
    localStorage.setItem(DB_USERS, JSON.stringify(users));
    alert("Pendaftaran berhasil!"); navigate('login');
}

function logout() { localStorage.removeItem(SESSION); checkSession(); navigate('home'); }

// --- FITUR GPS LOKASI ---
function getLocationGPS() {
    const statusText = document.getElementById('gps-status');
    statusText.innerText = "Mencari koordinat satelit...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            gpsLocation = `http://maps.google.com/maps?q=${lat},${long}`;
            statusText.innerText = "✅ GPS Terkunci!";
            document.getElementById('lap-lokasi').value += " (Verified GPS)";
        }, () => {
            statusText.innerText = "❌ Izin GPS ditolak atau tidak tersedia.";
        });
    } else {
        statusText.innerText = "Browser tidak mendukung GPS.";
    }
}

// --- AI MODERATION ---
async function initAI() {
    const status = document.getElementById('ai-status');
    const btn = document.getElementById('btn-submit-laporan');
    try {
        aiModel = await mobilenet.load();
        status.innerHTML = "✅ AI CNN Model Ready"; status.className = "text-green"; btn.innerText = "Kirim Laporan";
    } catch(e) { status.innerHTML = "❌ AI Gagal dimuat"; status.className = "text-red"; }
}

document.getElementById('lap-foto').addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    const preview = document.getElementById('previewFoto');
    const status = document.getElementById('ai-status');
    const btn = document.getElementById('btn-submit-laporan');
    btn.disabled = true;
    const reader = new FileReader();
    reader.onload = function(event) {
        preview.src = event.target.result; preview.style.display = 'block';
        preview.onload = async function() {
            if (!aiModel) return;
            status.innerHTML = "🔍 CNN Menganalisis Gambar..."; status.className = "text-gray";
            const predictions = await aiModel.classify(preview);
            const badObjects = ['person', 'face', 'dog', 'cat', 'plant'];
            let isBanned = false;
            predictions.forEach(p => { badObjects.forEach(w => { if(p.className.toLowerCase().includes(w)) isBanned = true; }); });
            
            if (isBanned) { status.innerHTML = "❌ Ditolak: Deteksi Wajah/Makhluk Hidup!"; status.className = "text-red"; btn.disabled = true; base64Foto = ""; } 
            else { status.innerHTML = `✅ Gambar Valid (${predictions[0].className})`; status.className = "text-green"; btn.disabled = false; base64Foto = event.target.result; }
        };
    };
    reader.readAsDataURL(file);
});

function validateTextNLP(text) {
    const badWords = ['bodoh', 'kasar', 'jancok'];
    let isValid = true;
    badWords.forEach(word => { if(text.toLowerCase().includes(word)) isValid = false; });
    return isValid;
}

// --- LOGIKA UTAMA (CRUD) ---
function renderStats() {
    const laporan = JSON.parse(localStorage.getItem(DB_LAPORAN));
    const users = JSON.parse(localStorage.getItem(DB_USERS));
    document.getElementById('stat-hilang').innerText = laporan.filter(l => l.jenis === 'Hilang' && l.status === 'Aktif').length;
    document.getElementById('stat-temuan').innerText = laporan.filter(l => l.jenis === 'Temuan' && l.status === 'Aktif').length;
    document.getElementById('stat-user').innerText = users.length;
}

function submitLaporan(e) {
    e.preventDefault();
    const deskripsi = document.getElementById('lap-deskripsi').value;
    if (!validateTextNLP(deskripsi)) return alert("Sistem NLP menolak laporan: Mengandung kata kasar!");
    
    const db = JSON.parse(localStorage.getItem(DB_LAPORAN));
    db.push({
        id: Date.now(), userId: currentUser.id, pelapor: currentUser.nama,
        jenis: document.querySelector('input[name="jenis"]:checked').value,
        judul: document.getElementById('lap-judul').value,
        kategori: document.getElementById('lap-kategori').value,
        tanggal: document.getElementById('lap-tanggal').value,
        lokasi: document.getElementById('lap-lokasi').value,
        gps: gpsLocation, deskripsi: deskripsi, foto: base64Foto, status: 'Aktif'
    });
    localStorage.setItem(DB_LAPORAN, JSON.stringify(db));
    alert("Laporan berhasil dikirim!");
    e.target.reset(); gpsLocation = ""; document.getElementById('gps-status').innerText = "";
    document.getElementById('previewFoto').style.display = 'none'; navigate('explore');
}

function renderDashboard() {
    if (!currentUser) return;
    const users = JSON.parse(localStorage.getItem(DB_USERS));
    const updatedUser = users.find(u => u.id === currentUser.id);
    
    document.getElementById('dash-nama').innerText = updatedUser.nama;
    document.getElementById('dash-email').innerText = updatedUser.email;
    document.getElementById('dash-poin').innerText = updatedUser.poin;
    
    const db = JSON.parse(localStorage.getItem(DB_LAPORAN));
    const myReports = db.filter(l => l.userId === currentUser.id).reverse();
    const container = document.getElementById('my-reports');
    container.innerHTML = myReports.length ? '' : '<p>Belum ada laporan.</p>';
    
    myReports.forEach(item => {
        let badgeStatusClass = 'badge-aktif';
        if(item.status === 'Selesai') badgeStatusClass = 'badge-selesai';
        if(item.status === 'Menunggu Serah Terima') badgeStatusClass = 'badge-serah-terima';
        
        container.innerHTML += `
            <div class="card" style="flex-direction:row; height:150px;">
                <div class="card-img-placeholder" style="width:200px;"><img src="${item.foto}"></div>
                <div class="card-body">
                    <span class="badge ${item.jenis === 'Hilang' ? 'badge-hilang' : 'badge-temuan'}">${item.jenis.toUpperCase()}</span>
                    <span class="badge ${badgeStatusClass}">${item.status.toUpperCase()}</span>
                    <h3 class="card-title">${item.judul}</h3>
                    <p class="card-meta">📍 ${item.lokasi}</p>
                    <button class="btn-card" onclick="openDetail(${item.id})">Kelola Laporan</button>
                </div>
            </div>
        `;
    });
}

function renderExplore() {
    const db = JSON.parse(localStorage.getItem(DB_LAPORAN)).reverse();
    const container = document.getElementById('explore-gallery');
    container.innerHTML = '';
    const results = db.filter(item => item.status === 'Aktif'); 
    
    if(results.length === 0){
        container.innerHTML = '<p>Belum ada laporan aktif.</p>';
        return;
    }
    
    results.forEach(item => {
        container.innerHTML += `
            <div class="card">
                <div class="card-img-placeholder"><img src="${item.foto}"></div>
                <div class="card-body">
                    <span class="badge ${item.jenis === 'Hilang' ? 'badge-hilang' : 'badge-temuan'}">${item.jenis.toUpperCase()}</span>
                    <h3 class="card-title">${item.judul}</h3>
                    <p class="card-meta">📍 ${item.lokasi}</p>
                    <button class="btn-card" onclick="openDetail(${item.id})">Lihat Detail</button>
                </div>
            </div>
        `;
    });
}

// --- LOGIKA CERDAS: DETAIL & SERAH TERIMA ---
function openDetail(id) {
    const item = JSON.parse(localStorage.getItem(DB_LAPORAN)).find(l => l.id === id);
    const container = document.getElementById('page-detail');
    let actionBox = '';
    
    if (currentUser) {
        const klaimList = JSON.parse(localStorage.getItem(DB_KLAIM)).filter(k => k.laporanId === id);
        const isPembuatPos = currentUser.id === item.userId;
        
        if (item.status === 'Aktif') {
            if (isPembuatPos) {
                let listHTML = '';
                klaimList.filter(k => k.status === 'PENDING').forEach(k => {
                    listHTML += `
                        <div class="action-box">
                            <h4>Tanggapan dari: ${k.claimerNama}</h4>
                            <p>"${k.pesan}"</p>
                            <button class="btn-green-full" style="margin-top:10px;" onclick="terimaKlaim(${k.id}, ${item.id})">Terima & Atur Drop Point</button>
                        </div>
                    `;
                });
                actionBox = listHTML ? `<div class="detail-box"><h3>Verifikasi Masuk</h3>${listHTML}</div>` : `<div class="detail-box"><p>Belum ada tanggapan masuk.</p></div>`;
            } else {
                const btnText = item.jenis === 'Hilang' ? 'Saya Menemukan Barang Ini' : 'Ini Barang Milik Saya (Klaim)';
                actionBox = `
                    <div class="detail-box">
                        <h3>Beri Tanggapan</h3>
                        <textarea id="klaim-pesan" class="claim-input" placeholder="Sebutkan detail barang / tempat kamu menemukannya..."></textarea>
                        <button class="btn-blue-full" onclick="ajukanKlaim(${item.id})">${btnText}</button>
                    </div>
                `;
            }
        } 
        else if (item.status === 'Menunggu Serah Terima') {
            const klaimDiterima = klaimList.find(k => k.status === 'DITERIMA');
            let isPemilikAsli = false;
            let idPenemu = 0;
            
            if (item.jenis === 'Hilang') {
                isPemilikAsli = isPembuatPos; 
                idPenemu = klaimDiterima.claimerId;
            } else {
                isPemilikAsli = currentUser.id === klaimDiterima.claimerId;
                idPenemu = item.userId;
            }

            actionBox = `
                <div class="detail-box" style="border-color: var(--yellow);">
                    <h3>🤝 Status: Menunggu Serah Terima</h3>
                    <p>Barang dititipkan / Bertemu di: <strong>${klaimDiterima.dropPoint}</strong></p>
                    ${isPemilikAsli ? `<button class="btn-yellow-full" onclick="selesaikanLaporan(${item.id}, ${idPenemu})">Konfirmasi Barang Diterima & Beri Poin Kejujuran</button>` : `<p style="margin-top:10px; color:var(--green);">Menunggu pemilik asli mengambil barang dan mengonfirmasi.</p>`}
                </div>
            `;
        }
        else if (item.status === 'Selesai') {
             actionBox = `<div class="detail-box" style="border-color: var(--green);"><h3>✅ Laporan Selesai</h3><p>Barang telah berhasil dikembalikan.</p></div>`;
        }
    } else {
        actionBox = `<div class="detail-box"><p><a href="#" onclick="navigate('login')">Masuk</a> untuk berinteraksi dengan laporan ini.</p></div>`;
    }

    const gpsBadge = item.gps ? `<br><a href="${item.gps}" target="_blank" class="gps-link">🗺️ Lihat di Google Maps</a>` : '';

    container.innerHTML = `
        <div class="detail-header">
            <span class="badge ${item.jenis === 'Hilang' ? 'badge-hilang' : 'badge-temuan'}">${item.jenis.toUpperCase()}</span>
            <span style="float:right; font-weight:bold; color:var(--navy);">STATUS: ${item.status.toUpperCase()}</span>
            <h2>${item.judul}</h2>
            <p class="detail-meta">📍 Lokasi: ${item.lokasi} ${gpsBadge} <br>👤 Pelapor: ${item.pelapor}</p>
            <label>Keterangan:</label><p>${item.deskripsi}</p>
        </div>
        ${actionBox}
    `;
    navigate('detail');
}

function ajukanKlaim(laporanId) {
    const pesan = document.getElementById('klaim-pesan').value;
    if (!pesan) return alert("Pesan tidak boleh kosong!");
    const db = JSON.parse(localStorage.getItem(DB_KLAIM));
    db.push({ id: Date.now(), laporanId, claimerId: currentUser.id, claimerNama: currentUser.nama, pesan, status: 'PENDING', dropPoint: '' });
    localStorage.setItem(DB_KLAIM, JSON.stringify(db));
    
    const laporan = JSON.parse(localStorage.getItem(DB_LAPORAN)).find(l => l.id === laporanId);
    kirimNotif(laporan.userId, `Ada tanggapan baru untuk: ${laporan.judul}`, laporanId);
    alert("Pesan terkirim! Silakan tunggu konfirmasi."); navigate('explore');
}

function terimaKlaim(klaimId, laporanId) {
    const dropPoint = prompt("Verifikasi cocok! Dimana barang akan diserahkan/dititipkan? (Misal: Titip di Pos Satpam GKB)");
    if (!dropPoint) return;

    let klaimDb = JSON.parse(localStorage.getItem(DB_KLAIM));
    const kIndex = klaimDb.findIndex(k => k.id === klaimId);
    klaimDb[kIndex].status = 'DITERIMA';
    klaimDb[kIndex].dropPoint = dropPoint;
    localStorage.setItem(DB_KLAIM, JSON.stringify(klaimDb));
    
    let lapDb = JSON.parse(localStorage.getItem(DB_LAPORAN));
    const lIndex = lapDb.findIndex(l => l.id === laporanId);
    lapDb[lIndex].status = 'Menunggu Serah Terima';
    localStorage.setItem(DB_LAPORAN, JSON.stringify(lapDb));
    
    kirimNotif(klaimDb[kIndex].claimerId, `Laporan disetujui! Barang diserahkan di: ${dropPoint}`, laporanId);
    alert("Status diubah ke Serah Terima!"); navigate('dashboard');
}

function selesaikanLaporan(laporanId, idPenemu) {
    const poinInput = prompt("Beri apresiasi! Berapa Poin Kejujuran yang ingin kamu berikan ke penemu? (Ketik angka 10 sampai 100)");
    const poinGived = parseInt(poinInput);
    if (!poinGived || isNaN(poinGived)) return alert("Penilaian dibatalkan.");

    let lapDb = JSON.parse(localStorage.getItem(DB_LAPORAN));
    const lIndex = lapDb.findIndex(l => l.id === laporanId);
    lapDb[lIndex].status = 'Selesai';
    localStorage.setItem(DB_LAPORAN, JSON.stringify(lapDb));

    let userDb = JSON.parse(localStorage.getItem(DB_USERS));
    const uIndex = userDb.findIndex(u => u.id === idPenemu);
    if (uIndex !== -1) {
        userDb[uIndex].poin += poinGived;
        localStorage.setItem(DB_USERS, JSON.stringify(userDb));
    }
    
    kirimNotif(idPenemu, `Selamat! Pemilik barang telah mengonfirmasi dan memberimu +${poinGived} Honesty Points!`, laporanId);
    alert("Laporan selesai! Terima kasih telah berkontribusi menciptakan kampus yang jujur.");
    checkSession(); 
    navigate('dashboard');
}

// --- NOTIFIKASI ---
function kirimNotif(userId, pesan, laporanId) {
    const notifDb = JSON.parse(localStorage.getItem(DB_NOTIF));
    notifDb.push({ id: Date.now(), userId, pesan, laporanId, tanggal: new Date().toLocaleString('id-ID'), dibaca: false });
    localStorage.setItem(DB_NOTIF, JSON.stringify(notifDb));
    updateNotifBadge();
}

function updateNotifBadge() {
    if (!currentUser) return;
    const notifDb = JSON.parse(localStorage.getItem(DB_NOTIF));
    const unread = notifDb.filter(n => n.userId === currentUser.id && !n.dibaca).length;
    document.getElementById('notif-badge').style.display = unread > 0 ? 'inline-block' : 'none';
}

function renderNotif() {
    if (!currentUser) return;
    let notifDb = JSON.parse(localStorage.getItem(DB_NOTIF));
    const myNotif = notifDb.filter(n => n.userId === currentUser.id).reverse();
    const container = document.getElementById('notif-list');
    container.innerHTML = myNotif.length ? '' : '<p>Belum ada notifikasi.</p>';
    myNotif.forEach(n => {
        container.innerHTML += `<div class="notif-card"><div><p>${n.pesan}</p><a class="notif-link" onclick="openDetail(${n.laporanId})">Lihat Detail →</a></div><span>${n.tanggal}</span></div>`;
        n.dibaca = true; 
    });
    localStorage.setItem(DB_NOTIF, JSON.stringify(notifDb));
    updateNotifBadge();
}