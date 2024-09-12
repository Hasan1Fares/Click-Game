// إعداد Firebase
var firebaseConfig = {
    apiKey: "AIzaSyCaJwlN6iLj1K2T1Lzwip69zlWndC3OFxk",
    authDomain: "klickname.firebaseapp.com",
    databaseURL: "https://klickname-default-rtdb.firebaseio.com/",
    projectId: "klickname",
    storageBucket: "klickname.appspot.com",
    messagingSenderId: "1063172664061",
    appId: "1:1063172664061:web:9762c858f9cf65c822ac94"
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
    var loginForm = document.getElementById('loginForm');
    var signupForm = document.getElementById('signupForm');
    var createAccountButton = document.getElementById('createAccountButton');
    var backToLoginButton = document.getElementById('backToLogin');
    var loginEmail = document.getElementById('loginEmail');
    var loginPassword = document.getElementById('loginPassword');
    var signupName = document.getElementById('signupName');
    var signupEmail = document.getElementById('signupEmail');
    var signupPassword = document.getElementById('signupPassword');
    var clickArea = document.getElementById('clickArea');
    var userDisplay = document.getElementById('userDisplay');
    var clickSound = document.getElementById('clickSound'); // عنصر الصوت

    // دالة لتبديل النماذج
    function toggleForms() {
        loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
        signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
    }

    // أحداث التبديل بين النماذج
    createAccountButton.addEventListener('click', function() {
        toggleForms();
    });

    backToLoginButton.addEventListener('click', function() {
        toggleForms();
    });

    // دالة للتحقق من وجود اسم مستخدم مشابه
    function checkUsernameExists(username) {
        return database.ref('users/' + username).once('value').then(function(snapshot) {
            return snapshot.exists();
        });
    }

    // تسجيل الدخول
    document.getElementById('loginButton').addEventListener('click', function() {
        var email = loginEmail.value.trim();
        var password = loginPassword.value.trim();

        if (!email || !password) {
            document.getElementById('loginError').textContent = "يرجى إدخال البريد الإلكتروني وكلمة المرور!";
            return;
        }

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                var user = userCredential.user;
                var email = user.email;
                
                // Retrieve the username from the database
                var userRef = database.ref('userEmails/' + email.replace('.', ','));
                userRef.once('value').then(function(snapshot) {
                    var username = snapshot.val();
                    localStorage.setItem('username', username);
                    document.getElementById('loginError').textContent = '';
                    document.getElementById('gameContainer').style.display = 'block';
                    loginForm.style.display = 'none';
                    updateLeaderboard();
                });
            })
            .catch(function(error) {
                document.getElementById('loginError').textContent = error.message;
            });
    });

    // إنشاء حساب
    document.getElementById('signupButton').addEventListener('click', function() {
        var name = signupName.value.trim();
        var email = signupEmail.value.trim();
        var password = signupPassword.value.trim();

        if (!name || !email || !password) {
            document.getElementById('signupError').textContent = "يرجى إدخال الاسم والبريد الإلكتروني وكلمة المرور!";
            return;
        }

        checkUsernameExists(name).then(function(exists) {
            if (exists) {
                document.getElementById('signupError').textContent = "اسم المستخدم موجود بالفعل! اختر اسمًا آخر.";
                document.getElementById('signupError').style.color = "red"; // تغيير لون الرسالة إلى الأحمر
                return;
            }

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(function(userCredential) {
                    var user = userCredential.user;
                    var username = name; // استخدم الاسم المدخل بدلاً من البريد الإلكتروني
                    localStorage.setItem('username', username);

                    // تحديث قاعدة البيانات لتخزين اسم المستخدم
                    var userRef = database.ref('users/' + username);
                    userRef.set(0);
                    
                    // Store email and username mapping
                    var userEmailRef = database.ref('userEmails/' + email.replace('.', ','));
                    userEmailRef.set(username);
                    
                    document.getElementById('signupError').textContent = '';
                    document.getElementById('gameContainer').style.display = 'block';
                    signupForm.style.display = 'none';
                    updateLeaderboard();
                })
                .catch(function(error) {
                    document.getElementById('signupError').textContent = error.message;
                });
        });
    });

    // تسجيل الخروج
    document.getElementById('logoutButton').addEventListener('click', function() {
        firebase.auth().signOut().then(function() {
            localStorage.removeItem('username');
            document.getElementById('gameContainer').style.display = 'none';
            loginForm.style.display = 'block';
        }).catch(function(error) {
            console.error("حدث خطأ أثناء تسجيل الخروج: ", error);
        });
    });

    // زيادة النقاط عند النقر على منطقة اللعبة
    clickArea.addEventListener('click', function() {
        var username = localStorage.getItem('username');
        if (!username) {
            alert("يرجى تسجيل الدخول أولاً!");
            return;
        }

        // إعادة تعيين موضع التشغيل للصوت إلى الصفر وتشغيله من البداية
        clickSound.currentTime = 0;
        clickSound.play();

        var userRef = database.ref('users/' + username);
        userRef.transaction(function(currentValue) {
            return (currentValue || 0) + 1;
        });
    });

    function updateLeaderboard() {
        var leaderboardRef = database.ref('users').orderByValue().limitToLast(10);
        leaderboardRef.on('value', function(snapshot) {
            var leaderboard = snapshot.val();
            var sortedEntries = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);
            var html = "<h2>🏆الترتيب الأعلى🏆</h2><ol>";
            sortedEntries.forEach((entry, index) => {
                var className = '';
                if (index === 0) {
                    className = 'gold';
                } else if (index === 1) {
                    className = 'silver';
                } else if (index === 2) {
                    className = 'bronze';
                }
                html += `<li class="${className}">${entry[0]}: ${entry[1]} نقرة</li>`;
            });
            html += "</ol>";
            document.getElementById('leaderboard').innerHTML = html;
        });
    }

    // عرض النماذج بناءً على حالة تسجيل الدخول
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            var username = localStorage.getItem('username');
            if (username) {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('gameContainer').style.display = 'block';
                updateLeaderboard();
            }
        } else {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('gameContainer').style.display = 'none';
        }
    });
});
