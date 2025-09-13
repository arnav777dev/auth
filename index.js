<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeetMindr - Sign In</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .auth-container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 30px;
        }
        
        .btn-google {
            background: #4285f4;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            margin-bottom: 20px;
            transition: background 0.3s;
        }
        
        .btn-google:hover {
            background: #3367d6;
        }
        
        .status {
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 14px;
        }
        
        .success {
            background: #e8f5e8;
            color: #2d5016;
            border: 1px solid #4caf50;
        }
        
        .error {
            background: #ffeaea;
            color: #721c24;
            border: 1px solid #f44336;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="logo">🎙️ MeetMindr</div>
        
        <h3>Sign in to continue</h3>
        <p>Authenticate with Google to access your MeetMindr recordings and settings.</p>
        
        <button id="googleSignIn" class="btn-google">
            <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
        </button>
        
        <div id="status" style="display: none;"></div>
    </div>

    <!-- Firebase SDK v9 (modular) -->
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
        import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
        import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyBux6IaOc3f5MkWtoqSuVHSbG4UVanJ7Qk",
            authDomain: "meetmindr-24559.firebaseapp.com",
            projectId: "meetmindr-24559",
            storageBucket: "meetmindr-24559.firebasestorage.app",
            messagingSenderId: "202482079292",
            appId: "1:202482079292:web:ea0db9affd42f104829539",
            measurementId: "G-RHM7YTW9H9"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const provider = new GoogleAuthProvider();

        const statusDiv = document.getElementById('status');
        const googleBtn = document.getElementById('googleSignIn');

        function showStatus(message, type = 'success') {
            statusDiv.textContent = message;
            statusDiv.className = `status ${type}`;
            statusDiv.style.display = 'block';
        }

        // Handle Google Sign-In button click
        googleBtn.addEventListener('click', async () => {
            try {
                googleBtn.disabled = true;
                googleBtn.textContent = 'Opening Google Sign-In...';
                
                provider.setCustomParameters({
                    prompt: 'select_account'
                });
                
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                console.log('Popup authentication successful:', user.email);
                
                // Save user to Firestore
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        provider: 'google',
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                    });
                } else {
                    await setDoc(userDocRef, {
                        lastLogin: serverTimestamp(),
                    }, { merge: true });
                }
                
                showStatus('✅ Successfully signed in! Authentication complete.', 'success');
                
                // Send success message to extension
                const urlParams = new URLSearchParams(window.location.search);
                const extensionId = urlParams.get('extension_id');
                
                if (extensionId) {
                    console.log('Storing authentication result in Chrome storage for extension:', extensionId);
                    try {
                        // Store the authentication result in Chrome storage
                        const authResult = {
                            type: 'meetmindr-auth-success',
                            timestamp: Date.now(),
                            user: {
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName,
                                photoURL: user.photoURL
                            }
                        };
                        
                        console.log('🏪 About to store auth result:', authResult);
                        console.log('🔧 Switching to Firestore for extension communication');
                        
                        try {
                            // Import Firestore modules
                            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
                            const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
                            
                            const firebaseConfig = {
                                apiKey: "AIzaSyBux6IaOc3f5MkWtoqSuVHSbG4UVanJ7Qk",
                                authDomain: "meetmindr-24559.firebaseapp.com",
                                projectId: "meetmindr-24559",
                                storageBucket: "meetmindr-24559.firebasestorage.app",
                                messagingSenderId: "202482079292",
                                appId: "1:202482079292:web:ea0db9affd42f104829539",
                                measurementId: "G-RHM7YTW9H9"
                            };
                            
                            console.log('🔄 Initializing Firestore connection...');
                            const app = initializeApp(firebaseConfig);
                            const firestoreDb = getFirestore(app);
                            
                            // Store auth result in Firestore with extension ID as document ID
                            const authDocRef = doc(firestoreDb, 'extension_auth', extensionId);
                            await setDoc(authDocRef, {
                                ...authResult,
                                createdAt: new Date(),
                                ttl: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes TTL
                            });
                            
                            console.log('✅ Authentication result stored in Firestore successfully!');
                            console.log('🔑 Document ID:', extensionId);
                            console.log('🔍 Stored document data:', authResult);
                            
                            // Show success message in UI as well
                            showStatus('✅ Successfully signed in! Check your extension.', 'success');
                            
                        } catch (storageError) {
                            console.error('❌ localStorage error:', storageError);
                        }
                        
                        console.log('✅ Authentication process completed successfully!');
                        
                    } catch (e) {
                        console.log('Authentication error:', e);
                    }
                } else {
                    console.log('No extension ID found in URL parameters');
                }

                setTimeout(() => {
                    window.close();
                }, 3000);
            
                
            } catch (error) {
                console.error('Sign-in popup error:', error);
                showStatus(`❌ Failed to sign in: ${error.message}`, 'error');
                googleBtn.disabled = false;
                googleBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Try Again
                `;
            }
        });
    </script>
</body>
</html>
