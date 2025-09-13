import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import FarmEditForm from "../../Components/farm/FarmEditForm";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
import { getOwnerById } from "../../api/OwnerAPI/owners";

import type { OwnerRequest } from "../../Models/OwnerRequestDTO";
import type { AddressRequest } from "../../Models/AddressRequestDTO";
import type { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import type { GoatFarmRequest } from "../../Models/GoatFarmRequestDTO";
import type { GoatFarmResponse } from "../../Models/GoatFarmResponseDTO";

import "./farmEditPage.css";

export default function FarmEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState<{
    owner: OwnerRequest;
    address: AddressRequest;
    phones: PhonesRequestDTO[];
    farm: GoatFarmRequest;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      try {
        const farmData: GoatFarmResponse = await getGoatFarmById(Number(id));
        const ownerData: OwnerRequest = await getOwnerById(farmData.userId);

        setInitialData({
          owner: {
            id: ownerData.id!,
            name: ownerData.name,
            cpf: ownerData.cpf ?? "",
            email: ownerData.email ?? "",
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
            ownerId: farmData.userId,
            addressId: farmData.addressId,
            phoneIds: farmData.phones.map((p) => p.id),
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
