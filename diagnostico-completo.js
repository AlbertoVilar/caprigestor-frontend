// ===== DIAGNÓSTICO COMPLETO DO PROBLEMA DE CRIAÇÃO DE CABRAS =====
// Execute este script no console do navegador (F12) após fazer login

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO...');

// 1. Verificar autenticação
async function verificarAutenticacao() {
  console.log('\n=== 1. VERIFICANDO AUTENTICAÇÃO ===');
  
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('❌ Token não encontrado no localStorage');
    return false;
  }
  
  console.log('✅ Token encontrado:', token.substring(0, 50) + '...');
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('✅ Usuário autenticado:', user);
      return user;
    } else {
      console.error('❌ Erro na verificação:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return false;
  }
}

// 2. Verificar fazendas disponíveis
async function verificarFazendas() {
  console.log('\n=== 2. VERIFICANDO FAZENDAS ===');
  
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('/api/goatfarms', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fazendas encontradas:', data.content.length);
      data.content.forEach(farm => {
        console.log(`- ID: ${farm.id} | Nome: ${farm.name} | Owner: ${farm.userId}`);
      });
      return data.content;
    } else {
      console.error('❌ Erro ao buscar fazendas:', response.status);
      return [];
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return [];
  }
}

// 3. Testar criação de cabra
async function testarCriacaoCabra(farmId, userId) {
  console.log(`\n=== 3. TESTANDO CRIAÇÃO DE CABRA (Fazenda: ${farmId}) ===`);
  
  const token = localStorage.getItem('authToken');
  
  const goatData = {
    registrationNumber: 'TEST-' + Date.now(),
    name: 'Cabra Teste Diagnóstico',
    breed: 'Saanen',
    color: 'Branca',
    gender: 'FEMALE',
    birthDate: '2024-01-01',
    status: 'ATIVO',
    category: 'Reprodutora',
    toe: '001',
    tod: '16425',
    fatherRegistrationNumber: '',
    motherRegistrationNumber: '',
    farmId: farmId,
    userId: userId
  };
  
  console.log('📤 Dados enviados:', goatData);
  
  try {
    const response = await fetch('/api/goatfarms/goats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(goatData)
    });
    
    console.log('📡 Status da resposta:', response.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('🎉 SUCESSO! Cabra criada:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ ERRO na criação:');
      console.error('Status:', response.status);
      console.error('Resposta:', errorText);
      
      if (response.status === 403) {
        console.error('🚫 ERRO 403: Problema de permissão no BACKEND');
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return false;
  }
}

// 4. Executar diagnóstico completo
async function executarDiagnostico() {
  console.log('🚀 EXECUTANDO DIAGNÓSTICO COMPLETO...');
  
  // Verificar autenticação
  const user = await verificarAutenticacao();
  if (!user) {
    console.error('❌ Falha na autenticação. Faça login primeiro.');
    return;
  }
  
  // Verificar fazendas
  const farms = await verificarFazendas();
  if (farms.length === 0) {
    console.error('❌ Nenhuma fazenda encontrada.');
    return;
  }
  
  // Encontrar fazenda do usuário
  const userFarm = farms.find(farm => farm.userId === user.userId);
  if (!userFarm) {
    console.error('❌ Usuário não possui fazenda associada.');
    console.log('Fazendas disponíveis:', farms.map(f => `ID: ${f.id}, Owner: ${f.userId}`));
    return;
  }
  
  console.log(`✅ Fazenda do usuário encontrada: ${userFarm.name} (ID: ${userFarm.id})`);
  
  // Testar criação de cabra
  const success = await testarCriacaoCabra(userFarm.id, user.userId);
  
  // Resultado final
  console.log('\n=== 📊 RESULTADO DO DIAGNÓSTICO ===');
  if (success) {
    console.log('🎉 PROBLEMA RESOLVIDO! Cabra criada com sucesso.');
  } else {
    console.log('❌ PROBLEMA CONFIRMADO: Erro 403 no backend.');
    console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
    console.log('1. Verificar logs do backend para detalhes do erro');
    console.log('2. Confirmar se ROLE_OPERATOR pode criar cabras');
    console.log('3. Verificar anotações de segurança no controller');
    console.log('4. Testar com usuário ROLE_ADMIN');
    console.log('\n📋 CONCLUSÃO: O problema está no BACKEND, não no frontend.');
  }
}

// Executar automaticamente
executarDiagnostico();

// Instruções
console.log('\n=== 📖 INSTRUÇÕES ===');
console.log('1. Este script foi executado automaticamente');
console.log('2. Verifique os resultados acima');
console.log('3. Para executar novamente: executarDiagnostico()');
console.log('4. Para testar apenas criação: testarCriacaoCabra(farmId, userId)');