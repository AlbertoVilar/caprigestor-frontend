import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import FarmEditForm from "../../Components/farm/FarmEditForm";
import { getGoatFarmForManagement } from "../../api/GoatFarmAPI/goatFarm";
import { useFarmPermissions } from "../../Hooks/useFarmPermissions";
// Removido fetch separado do proprietário; usar dados retornados pela fazenda

import type { OwnerCompatibility } from "../../Models/UserProfileDTO";
import type { AddressRequest } from "../../Models/AddressRequestDTO";
import type { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import type { GoatFarmRequest } from "../../Models/GoatFarmRequestDTO";

import "./farmEditPage.css";

export default function FarmEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const farmId = id != null && /^\d+$/.test(id) ? Number(id) : undefined;
  const { canAdministerFarm, loading: loadingFarmPermissions } = useFarmPermissions(farmId);

  const [initialData, setInitialData] = useState<{
    owner: OwnerCompatibility;
    address: AddressRequest;
    phones: PhonesRequestDTO[];
    farm: GoatFarmRequest;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (farmId == null || loadingFarmPermissions) return;

      if (!canAdministerFarm) {
        navigate("/403", { replace: true });
        return;
      }

      try {
        const farmData = await getGoatFarmForManagement(farmId);
        if (cancelled) return;

        const phones = (farmData.phones ?? []).map((phone) => ({
          id: phone.id ? Number(phone.id) : undefined,
          ddd: phone.ddd ?? "",
          number: phone.number ?? "",
        }));

        setInitialData({
          owner: {
            id: farmData.userId,
            name: farmData.userName ?? "",
            cpf: farmData.userCpf ?? "",
            email: farmData.userEmail ?? "",
          },
          address: {
            id: farmData.addressId,
            street: farmData.street ?? "",
            neighborhood: farmData.district ?? "",
            city: farmData.city ?? "",
            state: farmData.state ?? "",
            zipCode: farmData.cep ?? "",
            country: farmData.country ?? "",
          },
          phones,
          farm: {
            id: farmData.id,
            name: farmData.name ?? "",
            tod: farmData.tod ?? "",
            logoUrl: farmData.logoUrl,
            userId: farmData.userId,
            addressId: farmData.addressId,
            phoneIds: phones
              .map((phone: PhonesRequestDTO) => phone.id)
              .filter((phoneId: number | undefined): phoneId is number => phoneId != null),
            version: farmData.version,
          },
        });
      } catch (error) {
        if (cancelled) return;
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          navigate("/403", { replace: true });
          return;
        }
        console.error("Erro ao buscar dados:", error);
        toast.error("Erro ao carregar os dados da fazenda.");
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [farmId, canAdministerFarm, loadingFarmPermissions, navigate]);

  return (
    <div className="form-page">
      <div className="form-wrapper">
        {initialData ? (
          <FarmEditForm
            initialData={initialData}
            onUpdateSuccess={() => navigate("/fazendas")}
          />
        ) : loadingFarmPermissions ? (
          <p>Verificando permissões...</p>
        ) : (
          <p>Carregando dados...</p>
        )}
      </div>
    </div>
  );
}
