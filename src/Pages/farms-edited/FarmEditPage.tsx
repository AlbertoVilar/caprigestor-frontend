import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import FarmEditForm from "../../Components/farm/FarmEditForm";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import type { UserProfile } from "../../Models/UserProfileDTO";
import type { AddressRequest } from "../../Models/AddressRequestDTO";
import type { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import type { GoatFarmRequest } from "../../Models/GoatFarmRequestDTO";
import type { GoatFarmResponse } from "../../Models/GoatFarmResponseDTO";

import "./farmEditPage.css";

export default function FarmEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<{
    owner: UserProfile;
    address: AddressRequest;
    phones: PhonesRequestDTO[];
    farm: GoatFarmRequest;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      try {
        const farmData: GoatFarmResponse = await getGoatFarmById(Number(id));

        setInitialData({
          owner: {
            id: farmData.user.id,
            name: farmData.user.name,
            email: "", // Não disponível na resposta da fazenda
            cpf: "", // Não disponível na resposta da fazenda
            roles: [], // Não disponível na resposta da fazenda
            createdAt: "",
            updatedAt: "",
          },
          address: {
            id: farmData.addressId,
            street: farmData.street,
            neighborhood: farmData.district,
            city: farmData.city,
            state: farmData.state,
            postalCode: farmData.cep,
            country: "Brasil",
          },
          phones: farmData.phones.map((p) => ({
            id: p.id,
            ddd: p.ddd,
            number: p.number,
          })),
          farm: {
            id: farmData.id,
            name: farmData.name,
            tod: farmData.tod,
            userId: farmData.userId,
            addressId: farmData.addressId,
            phoneIds: farmData.phones.map((p) => p.id),
            ownerId: farmData.userId, // Compatibilidade
          },
        });
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar os dados da fazenda.");
        navigate("/fazendas");
      }
    }

    fetchData();
  }, [id, navigate]);

  return (
    <div className="form-page">
      <h2 className="form-title">Editar Fazenda</h2>
      <div className="form-wrapper">
        {initialData ? (
          <FarmEditForm
            initialData={initialData}
            onUpdateSuccess={() => navigate("/fazendas")}
          />
        ) : (
          <p>Carregando dados...</p>
        )}
      </div>
    </div>
  );
}
