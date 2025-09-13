// Teste simples - execute linha por linha no console

// 1. Verificar token
console.log('Token:', localStorage.getItem('authToken'));

// 2. Se houver token, testar auth
if (localStorage.getItem('authToken')) {
  fetch('/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') }
  })
  .then(r => {
    console.log('Auth Status:', r.status);
    return r.json();
  })
  .then(data => console.log('User Data:', data))
  .catch(err => console.error('Auth Error:', err));
}

// 3. Testar criação de cabra
if (localStorage.getItem('authToken')) {
  fetch('/api/goatfarms/goats', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    },
    body: JSON.stringify({
      registrationNumber: 'TEST123',
      name: 'Teste',
      breed: 'SRD',
      color: 'Branca',
      gender: 'FEMALE',
      birthDate: '2024-01-01',
      status: 'ATIVO',
      category: 'Reprodutora',
      toe: 'TOE001',
      tod: 'TOD001',
      farmId: 1,
      userId: 1
    })
  })
  .then(r => {
    console.log('Goat Creation Status:', r.status);
    if (r.status === 403) console.log('ERRO 403: Sem permissão');
    if (r.status === 401) console.log('ERRO 401: Não autenticado');
    return r.text();
  })
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Creation Error:', err));
}