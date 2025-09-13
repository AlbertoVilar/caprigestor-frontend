import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TestGoatRegistration from '../Pages/test-goat-registration/TestGoatRegistration';

/**
 * Componente de rotas para páginas de teste
 * 
 * Para usar este componente, adicione-o ao seu sistema de rotas principal:
 * 
 * Em App.tsx ou seu arquivo de rotas principal:
 * import TestRoutes from './routes/TestRoutes';
 * 
 * function App() {
 *   return (
 *     <Router>
 *       <Routes>
 *         <Route path="/login" element={<LoginPage />} />
 *         <Route path="/fazendas" element={<FarmsPage />} />
 *         <Route path="/test/*" element={<TestRoutes />} />
 *       </Routes>
 *     </Router>
 *   );
 * }
 * 
 * Isso permitirá acessar:
 * - http://localhost:5173/test/goat-registration
 */
const TestRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="goat-registration" element={<TestGoatRegistration />} />
    </Routes>
  );
};

export default TestRoutes;

/**
 * Exemplo de como adicionar ao menu de navegação:
 * 
 * Em seu componente de navegação:
 * const navigationItems = [
 *   { path: '/fazendas', label: 'Fazendas' },
 *   { path: '/cabras', label: 'Cabras' },
 *   
 *   // Apenas em desenvolvimento
 *   ...(process.env.NODE_ENV === 'development' ? [
 *     { path: '/test/goat-registration', label: 'Teste Cadastro' }
 *   ] : [])
 * ];
 */