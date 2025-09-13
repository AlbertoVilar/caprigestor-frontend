// Script para testar criação de cabra manualmente
// Execute no console do navegador após fazer login

const testGoatCreation = async () => {
  try {
    // Dados de teste para criar uma cabra
    const testGoatData = {
      registrationNumber: "TEST001",
      name: "Cabra Teste",
      gender: "FEMALE",
      breed: "Saanen",
      color: "Branca",
      birthDate: "2024-01-01",
      status: "ATIVO",
      tod: "001",
      toe: "001",
      category: "Reprodutora",
      fatherRegistrationNumber: "",
      motherRegistrationNumber: "",
      farmId: 1, // Substitua pelo ID da fazenda do usuário joao@test.com
      userId: 2  // Substitua pelo ID do usuário joao@test.com
    };

    console.log('🧪 Testando criação de cabra com dados:', testGoatData);

    // Fazer a requisição
    const response = await fetch('http://localhost:8080/goatfarms/goats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(testGoatData)
    });

    console.log('📡 Status da resposta:', response.status);
    console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na requisição:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return;
    }

    const result = await response.json();
    console.log('✅ Cabra criada com sucesso:', result);

  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
};

// Função para verificar token atual
const checkCurrentUser = () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('❌ Token não encontrado. Faça login primeiro.');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('👤 Usuário atual:', {
      userId: payload.userId,
      username: payload.sub,
      authorities: payload.authorities,
      exp: new Date(payload.exp * 1000)
    });
  } catch (error) {
    console.error('❌ Erro ao decodificar token:', error);
  }
};

console.log('🔧 Funções disponíveis:');
console.log('- checkCurrentUser(): Verifica dados do usuário logado');
console.log('- testGoatCreation(): Testa criação de cabra');
console.log('');
console.log('📋 Para usar:');
console.log('1. Execute checkCurrentUser() para ver seus dados');
console.log('2. Ajuste farmId e userId no testGoatCreation se necessário');
console.log('3. Execute testGoatCreation() para testar');

// Exportar funções para o console global
window.checkCurrentUser = checkCurrentUser;
window.testGoatCreation = testGoatCreation;