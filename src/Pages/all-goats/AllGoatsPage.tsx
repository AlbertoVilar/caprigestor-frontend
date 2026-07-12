import { useEffect, useMemo, useState } from "react";
import { getAllGoats } from "../../api/GoatAPI/goat";
import type { GoatResponseDTO } from "../../Models/goatResponseDTO";
import type { GoatHerdSummaryDTO } from "../../Models/GoatHerdSummaryDTO";

import PageHeader from "../../Components/pages-headers/PageHeader";
import GoatCardList from "../../Components/goat-card-list/GoatCardList";
import ButtonSeeMore from "../../Components/buttons/ButtonSeeMore";
import SearchInputBox from "../../Components/searchs/SearchInputBox";
import GoatDashboardSummary from "../../Components/dash-animal-info/GoatDashboardSummary";

import "../../index.css";

export default function AllGoatsPage() {
  const [allGoats, setAllGoats] = useState<GoatResponseDTO[]>([]);
  const [filteredGoats, setFilteredGoats] = useState<GoatResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const herdSummary = useMemo<GoatHerdSummaryDTO>(() => {
    const breedCounts = new Map<string, number>();
    allGoats.forEach((goat) => {
      const breed = String(goat.breed || "Não informada");
      breedCounts.set(breed, (breedCounts.get(breed) ?? 0) + 1);
    });
    const statusOf = (goat: GoatResponseDTO) => String(goat.status ?? "").toUpperCase();
    const genderOf = (goat: GoatResponseDTO) => String(goat.gender ?? "").toUpperCase();
    return {
      total: allGoats.length,
      males: allGoats.filter((goat) => ["MACHO", "MALE"].includes(genderOf(goat))).length,
      females: allGoats.filter((goat) => ["FEMEA", "FEMALE"].includes(genderOf(goat))).length,
      active: allGoats.filter((goat) => ["ATIVO", "ACTIVE"].includes(statusOf(goat))).length,
      inactive: allGoats.filter((goat) => ["INATIVO", "INACTIVE"].includes(statusOf(goat))).length,
      sold: allGoats.filter((goat) => ["VENDIDO", "SOLD"].includes(statusOf(goat))).length,
      deceased: allGoats.filter((goat) => ["MORTO", "DECEASED"].includes(statusOf(goat))).length,
      breeds: [...breedCounts].map(([breed, count]) => ({ breed, count })),
    };
  }, [allGoats]);

  useEffect(() => {
    loadGoatsPage(0);
  }, []);

  function loadGoatsPage(pageToLoad: number) {
    setLoading(true);
    setPage(pageToLoad);
    getAllGoats()
      .then((data) => {
        setAllGoats(data);
        setFilteredGoats(data);
        setHasMore(false); // Sem paginação
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao buscar capris:", err);
        if (err.response?.status === 401 || err.message.includes('401')) {
          console.log("Usuário não autenticado - capris não carregados");
          setError("🔒 Para visualizar os capris cadastrados, você precisa fazer login no sistema.");
        } else {
          setError("❌ Erro ao carregar capris. Tente novamente mais tarde.");
        }
        if (pageToLoad === 0) {
          setAllGoats([]);
          setFilteredGoats([]);
          setHasMore(false);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleSearch(searchTerm: string) {
    if (!searchTerm.trim()) {
      setFilteredGoats(allGoats);
      return;
    }

    const filtered = allGoats.filter((goat) =>
      goat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goat.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goat.farmName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGoats(filtered);
  }

  function handleSeeMore() {
    loadGoatsPage(page + 1);
  }

  if (loading && page === 0) {
    return (
      <div className="content-in">
        <PageHeader title="Todos os Capris" />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando capris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-in">
      <PageHeader title="Todos os Capris Cadastrados" />

      <div className="goat-section">
        <SearchInputBox
          onSearch={handleSearch}
          placeholder="🔍 Buscar por nome, registro ou fazenda..."
        />

        {error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            margin: '1rem 0'
          }}>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1rem' }}>{error}</p>
            {error.includes('🔒') && (
              <div>
                <a href="/login" style={{ 
                  color: '#28a745', 
                  textDecoration: 'none', 
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem',
                  border: '2px solid #28a745',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginRight: '1rem'
                }}>🔑 Fazer Login</a>
                <a href="/signup" style={{ 
                  color: '#007bff', 
                  textDecoration: 'none', 
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem',
                  border: '2px solid #007bff',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>📝 Criar Conta</a>
              </div>
            )}
          </div>
        ) : (
          <>
            <GoatDashboardSummary summary={herdSummary} visibleCount={filteredGoats.length} />
            
            <GoatCardList 
              goats={filteredGoats} 
              onEdit={() => {}} // Não permite edição na visualização geral
            />

            {hasMore && !loading && (
              <ButtonSeeMore onClick={handleSeeMore} />
            )}

            {loading && page > 0 && (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p>Carregando mais capris...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
