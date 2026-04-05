import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 1. CẤU HÌNH FIREBASE (Giữ nguyên của bạn) ---
const firebaseConfig = {
  apiKey: "AIzaSy...", // THAY BẰNG API KEY CỦA BẠN
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Email của Admin (Bạn thay đúng email của bạn vào đây)
const ADMIN_EMAIL = "haomechatronics@gmail.com";

// --- 2. XỬ LÝ ĐĂNG NHẬP ---
const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleLogoutBtn = document.getElementById('googleLogoutBtn');
const authStatus = document.getElementById('authStatus');

if (googleLoginBtn) {
  googleLoginBtn.onclick = () => signInWithPopup(auth, provider);
}
if (googleLogoutBtn) {
  googleLogoutBtn.onclick = () => signOut(auth);
}

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
  
  // --- NÂNG CẤP CHẶN TRANG PHỤ TẠI ĐÂY ---
  // Ép ẩn toàn bộ nội dung ngay lập tức trước khi tải dữ liệu từ hệ thống
  if (document.getElementById('adminPanel')) document.getElementById('adminPanel').hidden = true;
  if (document.getElementById('portalContent')) document.getElementById('portalContent').hidden = true;

  if (user) {
    const userEmail = user.email;
    authStatus.innerText = `Đang kiểm tra quyền truy cập...`;
    
    // Kiểm tra xem là Admin hay Học viên có quyền
    const hasAccess = await checkUserAccess(userEmail);

    if (userEmail === ADMIN_EMAIL) {
      // Nếu là Admin: Mở toàn bộ bảng điều khiển
      authStatus.innerText = `Đang đăng nhập (Admin): ${userEmail}`;
      if (document.getElementById('adminPanel')) document.getElementById('adminPanel').hidden = false;
      if (document.getElementById('portalContent')) document.getElementById('portalContent').hidden = false;
      loadAllLessons();
      loadAllowedUsers();
    } else if (hasAccess) {
      // Nếu là Học viên được cấp quyền: Chỉ mở bài học
      authStatus.innerText = `Đang đăng nhập (Học viên): ${userEmail}`;
      if (document.getElementById('portalContent')) document.getElementById('portalContent').hidden = false;
      loadAllLessons(); 
    } else {
      // KHÔNG CÓ QUYỀN - Báo lỗi và giữ nguyên trạng thái ẩn mọi trang phụ
      alert("Tài khoản chưa được đăng ký, vui lòng liên hệ Admin để đăng ký.");
      signOut(auth);
    }
  } else {
    authStatus.innerText = "Chưa đăng nhập.";
    if (document.getElementById('portalContent')) document.getElementById('portalContent').hidden = true;
    if (document.getElementById('adminPanel')) document.getElementById('adminPanel').hidden = true;
  }
});

// Hàm kiểm tra quyền học viên trong Database
async function checkUserAccess(email) {
  if (email === ADMIN_EMAIL) return true;
  const docRef = doc(db, "allowedUsers", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

// --- 3. QUẢN LÝ BÀI HỌC (LƯU VĨNH VIỄN) ---
const lessonForm = document.getElementById('lessonForm');
if (lessonForm) {
  lessonForm.onsubmit = async (e) => {
    e.preventDefault();
    const lessonData = {
      course: document.getElementById('lessonCourseType').value,
      title: document.getElementById('lessonTitle').value,
      url: document.getElementById('lessonUrl').value,
      desc: document.getElementById('lessonDescription').value,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, "lessons"), lessonData);
      alert("Đã lưu bài học lên hệ thống!");
      lessonForm.reset();
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
    }
  };
}

// Tải bài học từ Firebase và hiển thị
function loadAllLessons() {
  onSnapshot(collection(db, "lessons"), (snapshot) => {
    const lists = {
      basic: document.getElementById('lessonListBasic'),
      practical: document.getElementById('lessonListPractical'),
      advanced: document.getElementById('lessonListAdvanced')
    };

    // Xóa danh sách cũ để nạp mới
    Object.values(lists).forEach(list => { if(list) list.innerHTML = ''; });

    snapshot.forEach((doc) => {
      const item = doc.data();
      const id = doc.id;
      const html = `
        <div class="lesson-card">
          <h4>${item.title}</h4>
          <a href="${item.url}" target="_blank" class="youtube-link">Xem Video bài học</a>
          <p>${item.desc}</p>
          ${auth.currentUser?.email === ADMIN_EMAIL ? `<button onclick="deleteData('lessons', '${id}')" style="color:red">Xóa</button>` : ''}
        </div>
      `;
      if (lists[item.course]) lists[item.course].innerHTML += html;
    });
  });
}

// --- 4. QUẢN LÝ HỌC VIÊN (LƯU VĨNH VIỄN) ---
const userForm = document.getElementById('subuserForm');
if (userForm) {
  userForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('subuserEmail').value.trim();
    if (email) {
      await setDoc(doc(db, "allowedUsers", email), {
        email: email,
        addedAt: Date.now()
      });
      alert("Đã cấp quyền cho học viên: " + email);
      userForm.reset();
    }
  };
}

// Tải danh sách học viên cho Admin thấy
function loadAllowedUsers() {
  const userListWrap = document.getElementById('subuserList');
  if (!userListWrap) return;

  onSnapshot(collection(db, "allowedUsers"), (snapshot) => {
    userListWrap.innerHTML = '';
    snapshot.forEach((doc) => {
      const user = doc.data();
      userListWrap.innerHTML += `
        <div class="subuser-card">
          <span>${user.email}</span>
          <button onclick="deleteData('allowedUsers', '${doc.id}')" style="color:red; margin-left:10px">Thu hồi quyền</button>
        </div>
      `;
    });
  });
}

// Hàm dùng chung để xóa dữ liệu
window.deleteData = async (coll, id) => {
  if (confirm("Bạn có chắc chắn muốn xóa không?")) {
    await deleteDoc(doc(db, coll, id));
  }
};
