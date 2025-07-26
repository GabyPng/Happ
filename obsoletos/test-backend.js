// Prueba de conectividad frontend-backend
async function testBackendConnection() {
    console.log('🧪 Probando conexión con backend');
    
    try {
        // Probar login
        const loginResponse = await fetch('http://localhost:3000/loginUsuario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@happiety.com',
                password: '123456'
            })
        });
        
        console.log('📄 Status de login:', loginResponse.status);
        
        if (loginResponse.ok) {
            const loginResult = await loginResponse.json();
            console.log('✅ Login exitoso:', loginResult);
            
            // Probar crear jardín
            if (loginResult.token) {
                const jardinResponse = await fetch('http://localhost:3000/newJardin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${loginResult.token}`
                    },
                    body: JSON.stringify({
                        owner: loginResult.user.id,
                        name: 'Test Garden Frontend',
                        description: 'Jardín de prueba desde frontend'
                    })
                });
                
                console.log('📄 Status de jardín:', jardinResponse.status);
                const jardinResult = await jardinResponse.json();
                console.log('🌻 Resultado jardín:', jardinResult);
            }
        } else {
            const errorResult = await loginResponse.text();
            console.error('❌ Error login:', errorResult);
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error);
    }
}

// Ejecutar test
testBackendConnection();
