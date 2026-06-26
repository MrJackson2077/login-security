document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    const btn = document.getElementById('loginBtn');
    
    // Reset messages
    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    errorEl.textContent = '';
    
    // Loading state
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            successEl.textContent = 'Login successful! Redirecting...';
            successEl.style.display = 'block';
            
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
            errorEl.textContent = data.error || 'Login failed. Please try again.';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.textContent = 'Network error. Cannot reach server.';
        errorEl.style.display = 'block';
    } finally {
        btn.textContent = 'Log In';
        btn.disabled = false;
    }
});
