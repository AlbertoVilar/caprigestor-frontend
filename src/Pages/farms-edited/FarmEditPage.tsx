import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import FarmEditForm from "../../Components/farm/FarmEditForm";
import { getGoatFarmById } from "../../api/GoatFarmAPI/goatFarm";
// Removido fetch separado do proprietário; usar dados retornados pela fazenda

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
    owner: UserProfile;
    address: AddressRequest;
    phones: PhonesRequestDTO[];
    farm: GoatFarmRequest;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      try {
        const farmData: any = await getGoatFarmById(Number(id));

        // Suporta resposta em formato "plano" e "aninhado" (FullResponse)
        const ownerId = farmData.userId ?? farmData.user?.id;
        const ownerName = farmData.userName ?? farmData.user?.name ?? "";
        const ownerEmail = farmData.userEmail ?? farmData.user?.email ?? "";
        const ownerCpf = farmData.userCpf ?? farmData.user?.cpf ?? "";

        const addressId = farmData.addressId ?? farmData.address?.id;
        const street = farmData.street ?? farmData.address?.street ?? "";
        const neighborhood = farmData.district ?? farmData.address?.neighborhood ?? "";
        const city = farmData.city ?? farmData.address?.city ?? "";
        const state = farmData.state ?? farmData.address?.state ?? "";
        const zipCode = farmData.cep ?? farmData.address?.zipCode ?? "";

        const farmId = farmData.id ?? farmData.farm?.id;
        const farmName = farmData.name ?? farmData.farm?.name ?? "";
        const farmTod = farmData.tod ?? farmData.farm?.tod ?? "";
        const farmVersion = farmData.version ?? farmData.farm?.version;

        const phones = (farmData.phones ?? farmData.farm?.phones ?? []).map((p: any) => ({
          id: p.id,
          ddd: p.ddd,
          number: p.number,
        }));

        setInitialData({
          owner: {
            id: ownerId,
            name: ownerName,
            cpf: ownerCpf,
            email: ownerEmail,
          },
          address: {
            id: addressId,
            street,
            neighborhood,
            city,
            state,
            zipCode,
            country: "Brasil",
          },
          phones,
          farm: {
            id: farmId,
            name: farmName,
            tod: farmTod,
            userId: ownerId,
            addressId: addressId,
            phoneIds: phones.map((p) => p.id).filter((id) => id != null),
            version: farmVersion,
          },
        });
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar os dados da fazenda.");
      }
    }

    fetchData();
  }, [id, navigate]);

  return (
    <div className="form-page">
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
