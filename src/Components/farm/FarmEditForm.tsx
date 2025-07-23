import { useState } from "react";
import { toast } from "react-toastify";

import { updateGoatFarmFull } from "@/api/GoatFarmAPI/goatFarm";
import type { AddressRequest } from "@/Models/AddressRequestDTO";
import type { GoatFarmRequest } from "@/Models/GoatFarmRequestDTO";
import type { OwnerRequest } from "@/Models/OwnerRequestDTO";
import type { PhonesRequestDTO } from "@/Models/PhoneRequestDTO";

import "./farmEditFom.css";
import FormStepButton from "../buttons/FormStepButton";

interface Props {
  initialData: {
    owner: OwnerRequest;
    address: AddressRequest;
    phones: PhonesRequestDTO[];
    farm: GoatFarmRequest;
  };
  onUpdateSuccess?: () => void;
}

export default function FarmEditForm({ initialData, onUpdateSuccess }: Props) {
  const [owner, setOwner] = useState(initialData.owner);
  const [address, setAddress] = useState(initialData.address);
  const [phones, setPhones] = useState(initialData.phones);
  const [farm, setFarm] = useState(initialData.farm);

  const handleUpdate = async () => {
    try {
      console.log("Enviando atualização completa:", {
        owner,
        address,
        phones,
        farm,
      });

      await updateGoatFarmFull(farm.id!, {
        owner,
        address,
        phones,
        farm,
      });

      toast.success("Fazenda atualizada com sucesso!");
      onUpdateSuccess?.();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao atualizar a fazenda.");
      }
    }
  };

  return (
    <div className="form-container">
      <h2>Editar Fazenda</h2>

      <h3>Proprietário</h3>
      <input
        type="text"
        placeholder="Nome"
        value={owner.name}
        onChange={(e) => setOwner({ ...owner, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="CPF"
        value={owner.cpf || ""}
        onChange={(e) => setOwner({ ...owner, cpf: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={owner.email}
        onChange={(e) => setOwner({ ...owner, email: e.target.value })}
      />

      <h3>Endereço</h3>
      <input
        type="text"
        placeholder="Rua"
        value={address.street}
        onChange={(e) => setAddress({ ...address, street: e.target.value })}
      />
      <input
        type="text"
        placeholder="Bairro"
        value={address.neighborhood}
        onChange={(e) =>
          setAddress({ ...address, neighborhood: e.target.value })
        }
      />
      <input
        type="text"
        placeholder="Cidade"
        value={address.city}
        onChange={(e) => setAddress({ ...address, city: e.target.value })}
      />
      <input
        type="text"
        placeholder="Estado"
        value={address.state}
        onChange={(e) => setAddress({ ...address, state: e.target.value })}
      />
      <input
        type="text"
        placeholder="CEP"
        value={address.postalCode}
        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
      />
      <input
        type="text"
        placeholder="País"
        value={address.country}
        onChange={(e) => setAddress({ ...address, country: e.target.value })}
      />

      <h3>Telefones</h3>
      {phones.map((p, i) => (
        <div key={p.id || i}>
          <input
            type="text"
            placeholder="DDD"
            value={p.ddd}
            onChange={(e) => {
              const updated = [...phones];
              updated[i] = { ...updated[i], ddd: e.target.value };
              setPhones(updated);
            }}
          />
          <input
            type="text"
            placeholder="Número"
            value={p.number}
            onChange={(e) => {
              const updated = [...phones];
              updated[i] = { ...updated[i], number: e.target.value };
              setPhones(updated);
            }}
          />
        </div>
      ))}

      <h3>Dados da Fazenda</h3>
      <input
        type="text"
        placeholder="Nome da Fazenda"
        value={farm.name}
        onChange={(e) => setFarm({ ...farm, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="TOD"
        value={farm.tod}
        onChange={(e) => setFarm({ ...farm, tod: e.target.value })}
      />

      <FormStepButton label="Salvar Alterações" onClick={handleUpdate} />
    </div>
  );
}
