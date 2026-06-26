let currentMode = 'login'; // login, register, reset

const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const passwordLabel = document.getElementById('passwordLabel');
const mainBtn = document.getElementById('mainBtn');

const toggleRegister = document.getElementById('toggleRegister');
const toggleReset = document.getElementById('toggleReset');
const toggleLogin = document.getElementById('toggleLogin');

const errorEl = document.getElementById('errorMessage');
const successEl = document.getElementById('successMessage');

function updateUI() {
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    
    if (currentMode === 'login') {
        formTitle.textContent = 'Welcome Back';
        formSubtitle.textContent = 'Log in to access your secure dashboard.';
        passwordLabel.textContent = 'Password';
        mainBtn.textContent = 'Log In';
        toggleRegister.style.display = 'inline-block';
        toggleReset.style.display = 'inline-block';
        toggleLogin.style.display = 'none';
    } else if (currentMode === 'register') {
        formTitle.textContent = 'Create Account';
        formSubtitle.textContent = 'Sign up for a new secure account.';
        passwordLabel.textContent = 'Choose Password';
        mainBtn.textContent = 'Register';
        toggleRegister.style.display = 'none';
        toggleReset.style.display = 'none';
        toggleLogin.style.display = 'inline-block';
    } else if (currentMode === 'reset') {
        formTitle.textContent = 'Reset Password';
        formSubtitle.textContent = 'Enter your username and a new password.';
        passwordLabel.textContent = 'New Password';
        mainBtn.textContent = 'Reset Password';
        toggleRegister.style.display = 'none';
        toggleReset.style.display = 'none';
        toggleLogin.style.display = 'inline-block';
    }
}

toggleRegister.addEventListener('click', (e) => { e.preventDefault(); currentMode = 'register'; updateUI(); });
toggleReset.addEventListener('click', (e) => { e.preventDefault(); currentMode = 'reset'; updateUI(); });
toggleLogin.addEventListener('click', (e) => { e.preventDefault(); currentMode = 'login'; updateUI(); });

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    errorEl.textContent = '';
    
    let endpoint = '/api/login';
    if (currentMode === 'register') endpoint = '/api/register';
    if (currentMode === 'reset') endpoint = '/api/reset-password';
    
    mainBtn.textContent = 'Processing...';
    mainBtn.disabled = true;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status} ${response.statusText}`);
            }
            throw new Error("Invalid response from server");
        }
        
        if (response.ok) {
            successEl.textContent = data.message || 'Login successful! Redirecting...';
            successEl.style.display = 'block';
            
            if (currentMode === 'login') {
                localStorage.setItem('token', data.token);
                // Test protected route
                try {
                    const testResponse = await fetch('/api/protected', {
                        headers: { 'Authorization': `Bearer ${data.token}` }
                    });
                    const testData = await testResponse.json();
                    setTimeout(() => {
                        successEl.textContent = `Dashboard Access Granted: ${testData.message || 'Welcome'}`;
                    }, 1000);
                } catch (err) {
                    console.error("Error accessing protected route", err);
                }
            } else {
                // If registered or reset, prompt to login
                setTimeout(() => {
                    currentMode = 'login';
                    updateUI();
                    successEl.textContent = 'Please log in with your credentials.';
                    successEl.style.display = 'block';
                }, 1500);
            }
        } else {
            errorEl.textContent = data.error || 'Action failed. Please try again.';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        errorEl.textContent = err.message.includes('Server returned') 
            ? err.message + '. Please ensure the server is restarted to load the latest code.' 
            : 'Network error. Cannot reach server.';
        errorEl.style.display = 'block';
    } finally {
        if (currentMode === 'login') mainBtn.textContent = 'Log In';
        if (currentMode === 'register') mainBtn.textContent = 'Register';
        if (currentMode === 'reset') mainBtn.textContent = 'Reset Password';
        mainBtn.disabled = false;
    }
});
