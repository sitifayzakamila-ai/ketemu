// ==========================================
// 1. KONFIGURASI SUPABASE (DATABASE ASLI)
// ==========================================
const { createClient } = supabase;
const SUPABASE_URL = 'https://ohzdsumocunqlszjaese.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oemRzdW1vY3VucWxzemphZXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzODg2NzEsImV4cCI6MjA5NTk2NDY3MX0.GIJafCPQgK7bC5xNsHqTdaEDPv4kGiyw3DEOUZoGsRk';
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentUser = null;
let aiModel = null;
let nsfwModel = null;
let base64Foto = "";
let gpsLocation = "";

window.onload = () => { checkSession(); initAI(); };

function navigate(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    window.scrollTo(0, 0);
    if (pageId === 'home') renderStats();
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'explore') renderExplore();
    if (pageId === 'notif') renderNotif();
}

async function checkSession() {
    currentUser = JSON.parse(localStorage.getItem('ketemu_session'));
    if (currentUser) {
        document.getElementById('nav-guest').style.display = 'none';
        document.getElementById('hero-guest').style.display = 'none';
        document.getElementById('nav-auth').style.display = 'flex';
        document.getElementById('hero-auth').style.display = 'flex';
        document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
        const { data } = await db.from('users').select('poin, nama').eq('id', currentUser.id).single();
        if(data) {
            document.getElementById('nav-username').innerText = data.nama;
            document.getElementById('nav-poin').innerText = data.poin + " Poin";
        }
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

async function login() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const { data, error } = await db.from('users').select('*').eq('email', email).eq('password', pass).single();
    if (data) { 
        localStorage.setItem('ketemu_session', JSON.stringify(data)); 
        checkSession(); navigate('dashboard'); 
    } else { alert("Email atau Password salah!"); }
}

async function register() {
    const nama = document.getElementById('reg-nama').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    if (pass.length < 6) return alert("Password minimal 6 karakter!");
    if (!email.endsWith('.ac.id') && !email.endsWith('.edu')) {
        alert("❌ Pendaftaran Ditolak! Harap gunakan email resmi universitas (.ac.id atau .edu).");
        return; 
    }
    const { error } = await db.from('users').insert([{ nama: nama, email: email, password: pass, poin: 0 }]);
    if (error) { alert("Gagal daftar! Email mungkin sudah digunakan."); } 
    else { alert("Pendaftaran berhasil! Silakan masuk."); navigate('login'); }
}

function logout() { localStorage.removeItem('ketemu_session'); checkSession(); navigate('home'); }

function getLocationGPS() {
    const statusText = document.getElementById('gps-status');
    statusText.innerText = "Mencari koordinat satelit...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            gpsLocation = `http://maps.google.com/maps?q=$${position.coords.latitude},${position.coords.longitude}`;
            statusText.innerText = "✅ GPS Terkunci!";
            document.getElementById('lap-lokasi').value += " (Verified GPS)";
        }, () => { statusText.innerText = "❌ Izin GPS ditolak."; });
    } else { statusText.innerText = "Browser tidak mendukung GPS."; }
}

async function initAI() {
    const status = document.getElementById('ai-status');
    const btn = document.getElementById('btn-submit-laporan');
    try {
        status.innerHTML = "🔄 Memuat AI Ganda...";
        aiModel = await mobilenet.load();
        nsfwModel = await nsfwjs.load(); 
        status.innerHTML = "✅ AI Moderation (Ganda) Ready"; 
        status.className = "text-green"; 
        btn.innerText = "Kirim Laporan";
    } catch(e) { 
        // JIKA AI GAGAL, UBAH JADI MODE MANUAL UNTUK PRESENTASI
        status.innerHTML = "⚠️ Jaringan Lemah: Beralih ke Mode Manual (AI Bypass)"; 
        status.className = "text-orange"; 
        btn.innerText = "Kirim Laporan (Manual)";
        btn.disabled = false; // PASTIKAN TOMBOL TERBUKA
    }
}

document.getElementById('lap-foto').addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    const preview = document.getElementById('previewFoto');
    const status = document.getElementById('ai-status');
    const btn = document.getElementById('btn-submit-laporan');
    
    const reader = new FileReader();
    reader.onload = function(event) {
        preview.src = event.target.result; preview.style.display = 'block';
        base64Foto = event.target.result; // Langsung simpan fotonya
        
        preview.onload = async function() {
            // BYPASS: Jika AI belum dimuat, langsung loloskan saja untuk demo!
            if (!aiModel || !nsfwModel) {
                status.innerHTML = "✅ Foto diterima (Mode Manual Aktif)";
                status.className = "text-green";
                btn.disabled = false;
                return;
            }

            status.innerHTML = "🔍 AI Sedang Memindai Gambar..."; 
            status.className = "text-gray";
            btn.disabled = true;
            
            const nsfwPredictions = await nsfwModel.classify(preview);
            let isNSFW = false;
            nsfwPredictions.forEach(p => { 
                if (['Porn', 'Hentai', 'Sexy'].includes(p.className) && p.probability > 0.6) isNSFW = true; 
            });

            if (isNSFW) {
                status.innerHTML = "❌ DITOLAK: Terdeteksi Konten Tidak Senonoh!"; 
                status.className = "text-red"; 
                btn.disabled = true; base64Foto = "";
                return; 
            }

            const predictions = await aiModel.classify(preview);
            const badObjects = [ 'person', 'face', 'dog', 'cat', 'plant', 'tree', 'car', 'bus', 'truck', 'tractor', 'motorcycle', 'mountain', 'beach', 'ocean', 'cliff', 'food', 'pizza', 'burger', 'fruit', 'vegetable', 'toilet', 'building', 'house' ];
            
            let isBanned = false;
            predictions.forEach(p => { badObjects.forEach(w => { if(p.className.toLowerCase().includes(w)) isBanned = true; }); });
            
            if (isBanned) { 
                status.innerHTML = "❌ DITOLAK: Objek bukan barang hilang/temuan kampus!"; 
                status.className = "text-red"; 
                btn.disabled = true; base64Foto = ""; 
            } else { 
                status.innerHTML = `✅ Gambar Valid (${predictions[0].className})`; 
                status.className = "text-green"; 
                btn.disabled = false; 
            }
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

async function renderStats() {
    const { count: hilang } = await db.from('laporan').select('*', { count: 'exact' }).eq('jenis', 'Hilang').eq('status', 'Aktif');
    const { count: temuan } = await db.from('laporan').select('*', { count: 'exact' }).eq('jenis', 'Temuan').eq('status', 'Aktif');
    const { count: users } = await db.from('users').select('*', { count: 'exact' });
    document.getElementById('stat-hilang').innerText = hilang || 0;
    document.getElementById('stat-temuan').innerText = temuan || 0;
    document.getElementById('stat-user').innerText = users || 0;
}

async function submitLaporan(e) {
    e.preventDefault();
    const deskripsi = document.getElementById('lap-deskripsi').value;
    if (!validateTextNLP(deskripsi)) return alert("Sistem NLP menolak laporan: Mengandung kata kasar!");
    
    const btn = document.getElementById('btn-submit-laporan');
    btn.innerText = "Mengunggah ke Database..."; btn.disabled = true;

    const { error } = await db.from('laporan').insert([{
        user_id: currentUser.id, pelapor: currentUser.nama,
        jenis: document.querySelector('input[name="jenis"]:checked').value,
        judul: document.getElementById('lap-judul').value, kategori: document.getElementById('lap-kategori').value,
        tanggal: document.getElementById('lap-tanggal').value, lokasi: document.getElementById('lap-lokasi').value,
        gps: gpsLocation, deskripsi: deskripsi, foto: base64Foto, status: 'Aktif'
    }]);

    if(error) { alert("Gagal mengirim laporan!"); console.log(error); }
    else {
        alert("Laporan berhasil diterbitkan!");
        e.target.reset(); gpsLocation = ""; document.getElementById('gps-status').innerText = "";
        document.getElementById('previewFoto').style.display = 'none'; navigate('explore');
    }
    btn.innerText = "Kirim Laporan"; btn.disabled = false;
}

async function renderDashboard() {
    if (!currentUser) return;
    const { data: userData } = await db.from('users').select('nama, email, poin').eq('id', currentUser.id).single();
    document.getElementById('dash-nama').innerText = userData.nama;
    document.getElementById('dash-email').innerText = userData.email;
    document.getElementById('dash-poin').innerText = userData.poin;
    
    const { data: myReports } = await db.from('laporan').select('*').eq('user_id', currentUser.id).order('id', { ascending: false });
    const container = document.getElementById('my-reports');
    container.innerHTML = (myReports && myReports.length) ? '' : '<p>Belum ada laporan.</p>';
    
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
            </div>`;
    });
}

async function renderExplore() {
    const container = document.getElementById('explore-gallery');
    container.innerHTML = '<p>Memuat database...</p>';
    
    const { data: results } = await db.from('laporan').select('*').eq('status', 'Aktif').order('id', { ascending: false });
    if(!results || results.length === 0){ container.innerHTML = '<p>Belum ada laporan aktif.</p>'; return; }
    
    container.innerHTML = '';
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
            </div>`;
    });
}

async function openDetail(id) {
    const container = document.getElementById('page-detail');
    container.innerHTML = '<p>Memuat detail barang...</p>';
    navigate('detail');

    const { data: item } = await db.from('laporan').select('*').eq('id', id).single();
    const { data: klaimList } = await db.from('klaim').select('*').eq('laporan_id', id);
    
    let actionBox = '';
    if (currentUser) {
        const isPembuatPos = currentUser.id === item.user_id;
        if (item.status === 'Aktif') {
            if (isPembuatPos) {
                let listHTML = '';
                klaimList.filter(k => k.status === 'PENDING').forEach(k => {
                    listHTML += `<div class="action-box"><h4>Tanggapan dari: ${k.claimer_nama}</h4><p>"${k.pesan}"</p><button class="btn-green-full" style="margin-top:10px;" onclick="terimaKlaim(${k.id}, ${item.id})">Terima & Atur Drop Point</button></div>`;
                });
                actionBox = listHTML ? `<div class="detail-box"><h3>Verifikasi Masuk</h3>${listHTML}</div>` : `<div class="detail-box"><p>Belum ada tanggapan masuk.</p></div>`;
            } else {
                const btnText = item.jenis === 'Hilang' ? 'Saya Menemukan Barang Ini' : 'Ini Barang Milik Saya (Klaim)';
                actionBox = `<div class="detail-box"><h3>Beri Tanggapan</h3><textarea id="klaim-pesan" class="claim-input" placeholder="Sebutkan detail barang..."></textarea><button class="btn-blue-full" onclick="ajukanKlaim(${item.id}, ${item.user_id}, '${item.judul}')">${btnText}</button></div>`;
            }
        } 
        else if (item.status === 'Menunggu Serah Terima') {
            const klaimDiterima = klaimList.find(k => k.status === 'DITERIMA');
            let isPemilikAsli = (item.jenis === 'Hilang') ? isPembuatPos : (currentUser.id === klaimDiterima.claimer_id);
            let idPenemu = (item.jenis === 'Hilang') ? klaimDiterima.claimer_id : item.user_id;
            actionBox = `<div class="detail-box" style="border-color: var(--yellow);"><h3>🤝 Status: Menunggu Serah Terima</h3><p>Dititipkan di: <strong>${klaimDiterima.drop_point}</strong></p>${isPemilikAsli ? `<button class="btn-yellow-full" onclick="selesaikanLaporan(${item.id}, ${idPenemu})">Konfirmasi Barang Diterima & Beri Poin Kejujuran</button>` : `<p style="margin-top:10px; color:var(--green);">Menunggu pemilik asli mengambil barang.</p>`}</div>`;
        }
        else if (item.status === 'Selesai') {
             actionBox = `<div class="detail-box" style="border-color: var(--green);"><h3>✅ Laporan Selesai</h3><p>Barang telah berhasil dikembalikan.</p></div>`;
        }
    } else { actionBox = `<div class="detail-box"><p><a href="#" onclick="navigate('login')">Masuk</a> untuk berinteraksi.</p></div>`; }

    const gpsBadge = item.gps ? `<br><a href="${item.gps}" target="_blank" class="gps-link">🗺️ Lihat di Google Maps</a>` : '';
    container.innerHTML = `<div class="detail-header"><span class="badge ${item.jenis === 'Hilang' ? 'badge-hilang' : 'badge-temuan'}">${item.jenis.toUpperCase()}</span><span style="float:right; font-weight:bold; color:var(--navy);">STATUS: ${item.status.toUpperCase()}</span><h2>${item.judul}</h2><p class="detail-meta">📍 Lokasi: ${item.lokasi} ${gpsBadge} <br>👤 Pelapor: ${item.pelapor}</p><label>Keterangan:</label><p>${item.deskripsi}</p></div>${actionBox}`;
}

async function ajukanKlaim(laporanId, pemilikPosId, judulBarang) {
    const pesan = document.getElementById('klaim-pesan').value;
    if (!pesan) return alert("Pesan tidak boleh kosong!");
    await db.from('klaim').insert([{ laporan_id: laporanId, claimer_id: currentUser.id, claimer_nama: currentUser.nama, pesan: pesan, status: 'PENDING' }]);
    kirimNotif(pemilikPosId, `Ada tanggapan baru untuk: ${judulBarang}`, laporanId);
    alert("Pesan terkirim! Silakan tunggu konfirmasi."); navigate('explore');
}

async function terimaKlaim(klaimId, laporanId) {
    const dropPoint = prompt("Verifikasi cocok! Dimana barang akan diserahkan/dititipkan?");
    if (!dropPoint) return;
    await db.from('klaim').update({ status: 'DITERIMA', drop_point: dropPoint }).eq('id', klaimId);
    await db.from('laporan').update({ status: 'Menunggu Serah Terima' }).eq('id', laporanId);
    const { data: klm } = await db.from('klaim').select('claimer_id').eq('id', klaimId).single();
    kirimNotif(klm.claimer_id, `Laporan disetujui! Barang diserahkan di: ${dropPoint}`, laporanId);
    alert("Status diubah ke Serah Terima!"); navigate('dashboard');
}

async function selesaikanLaporan(laporanId, idPenemu) {
    const poinInput = prompt("Beri apresiasi! Berapa Poin Kejujuran yang ingin kamu berikan ke penemu? (Ketik angka 10-100)");
    const poinGived = parseInt(poinInput);
    if (!poinGived || isNaN(poinGived)) return alert("Penilaian dibatalkan.");
    await db.from('laporan').update({ status: 'Selesai' }).eq('id', laporanId);
    const { data: userPenemu } = await db.from('users').select('poin').eq('id', idPenemu).single();
    await db.from('users').update({ poin: userPenemu.poin + poinGived }).eq('id', idPenemu);
    kirimNotif(idPenemu, `Selamat! Pemilik barang mengonfirmasi dan memberimu +${poinGived} Honesty Points!`, laporanId);
    alert("Laporan selesai! Terima kasih telah berkontribusi.");
    checkSession(); navigate('dashboard');
}

async function kirimNotif(userIdTarget, pesan, laporanId) {
    await db.from('notifikasi').insert([{ user_id: userIdTarget, pesan: pesan, laporan_id: laporanId, dibaca: false }]);
}

async function updateNotifBadge() {
    if (!currentUser) return;
    const { count } = await db.from('notifikasi').select('*', { count: 'exact' }).eq('user_id', currentUser.id).eq('dibaca', false);
    document.getElementById('notif-badge').style.display = count > 0 ? 'inline-block' : 'none';
}

async function renderNotif() {
    if (!currentUser) return;
    const container = document.getElementById('notif-list');
    container.innerHTML = '<p>Memuat notifikasi...</p>';
    const { data: myNotif } = await db.from('notifikasi').select('*').eq('user_id', currentUser.id).order('id', { ascending: false });
    container.innerHTML = (myNotif && myNotif.length) ? '' : '<p>Belum ada notifikasi.</p>';
    myNotif.forEach(n => { container.innerHTML += `<div class="notif-card"><div><p>${n.pesan}</p><a class="notif-link" onclick="openDetail(${n.laporan_id})">Lihat Detail →</a></div></div>`; });
    await db.from('notifikasi').update({ dibaca: true }).eq('user_id', currentUser.id);
    updateNotifBadge();
}
// ==========================================
// FUNGSI TOGGLE HAMBURGER MENU MOBILE
// ==========================================
function toggleMobileMenu() {
    const menu = document.getElementById('nav-menu-container');
    menu.classList.toggle('show');
}

// Modifikasi fungsi navigate bawaanmu agar otomatis menutup menu setelah diklik
const originalNavigate = navigate;
navigate = function(pageId) {
    originalNavigate(pageId);
    // Otomatis tutup kembali menu hamburger setelah link diklik
    const menu = document.getElementById('nav-menu-container');
    if (menu) menu.classList.remove('show');
}