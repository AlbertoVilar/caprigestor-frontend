// Script de debug para testar autenticação e permissões

// 1. Verificar tokens no localStorage
console.log('=== TOKENS NO LOCALSTORAGE ===');
console.log('authToken:', localStorage.getItem('authToken'));
console.log('refresh_token:', localStorage.getItem('refresh_token'));
console.log('accessToken:', localStorage.getItem('accessToken'));
console.log('refreshToken:', localStorage.getItem('refreshToken'));

// 2. Verificar se o usuário está logado
async function checkAuth() {
  console.log('\n=== VERIFICANDO AUTENTICAÇÃO ===');
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.error('❌ Nenhum token encontrado!');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status da verificação de auth:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ Usuário autenticado:', userData);
      return userData;
    } else {
      console.error('❌ Falha na autenticação:', await response.text());
    }
  } catch (error) {
    console.error('❌ Erro na verificação de auth:', error);
  }
}

// 3. Testar criação de cabra
async function testGoatCreation() {
  console.log('\n=== TESTANDO CRIAÇÃO DE CABRA ===');
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.error('❌ Token não encontrado para teste de criação!');
    return;
  }
  
  const goatData = {
    registrationNumber: 'TEST-' + Date.now(),
    name: 'Cabra Teste',
    breed: 'SRD',
    color: 'Branca',
    gender: 'FEMALE',
    birthDate: '2024-01-01',
    status: 'ATIVO',
    category: 'Reprodutora',
    toe: 'TOE-001',
    tod: 'TOD-001',
    farmId: 1,
    userId: 1
  };
  
  console.log('Dados da cabra:', goatData);
  
  try {
    const response = await fetch('/api/goatfarms/goats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(goatData)
    });
    
    console.log('Status da criação:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cabra criada com sucesso:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Erro na criação:', errorText);
      
      if (response.status === 403) {
        console.error('🚫 ERRO 403: Sem permissão para criar cabra');
      } else if (response.status === 401) {
        console.error('🔐 ERRO 401: Não autenticado');
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// 4. Verificar fazenda específica
async function checkFarm(farmId = 1) {
  console.log(`\n=== VERIFICANDO FAZENDA ${farmId} ===`);
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`/api/goatfarms/${farmId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const farm = await response.json();
      console.log('✅ Dados da fazenda:', farm);
      console.log('userId da fazenda:', farm.userId);
      return farm;
    } else {
      console.error('❌ Erro ao buscar fazenda:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro na requisição da fazenda:', error);
  }
}

// Executar todos os testes
async function runAllTests() {
  await checkAuth();
  await checkFarm(1);
  await testGoatCreation();
}

// Executar automaticamente
runAllTests();

console.log('\n=== INSTRUÇÕES ===');
console.log('1. Copie e cole este script no console do navegador');
console.log('2. Verifique os resultados acima');
console.log('3. Se houver erro 403, o problema é de permissão');
console.log('4. Se houver erro 401, o problema é de autenticação');
console.log('5. Para executar novamente: runAllTests()');