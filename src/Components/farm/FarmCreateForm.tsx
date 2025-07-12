import { useState } from "react";
import { OwnerRequest } from "../../Models/OwnerRequestDTO";
import { AddressRequest } from "../../Models/AddressRequestDTO";
import { PhoneRequest } from "../../Models/PhoneRequestDTO";
import { GoatFarmRequest } from "../../Models/GoatFarmRequestDTO";
import { toast } from "react-toastify";

import { createOwner } from "../../api/OwnerAPI/owners";
import { createAddress } from "../../api/AddressAPI/addresses";
import { createPhone } from "../../api/PhoneAPI/phones";
import { createFarm } from "../../api/GoatFarmAPI/goatFarm";

import "./FarmCreateForm.css";

export default function FarmCreateForm() {
  const [step, setStep] = useState(1);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [phoneIds, setPhoneIds] = useState<number[]>([]);

  const [owner, setOwner] = useState<OwnerRequest>({ name: "", cpf: "", email: "" });
  const [address, setAddress] = useState<AddressRequest>({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  });
  const [phone, setPhone] = useState<PhoneRequest>({ ddd: "", numero: "" });
  const [farm, setFarm] = useState<{ name: string; tod: string }>({ name: "", tod: "" });

  function nextStep() {
    setStep((prev) => Math.min(prev + 1, 4));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleSaveOwner() {
    try {
      const id = await createOwner(owner);
      setOwnerId(id);
      toast.success("Proprietário salvo com sucesso!");
      nextStep();
    } catch {
      toast.error("Erro ao salvar proprietário");
    }
  }

  async function handleSaveAddress() {
    try {
      const id = await createAddress(address);
      setAddressId(id);
      toast.success("Endereço salvo com sucesso!");
      nextStep();
    } catch {
      toast.error("Erro ao salvar endereço");
    }
  }

  async function handleAddPhone() {
    try {
      const id = await createPhone(phone);
      setPhoneIds((prev) => [...prev, id]);
      toast.success("Telefone adicionado!");
      setPhone({ ddd: "", numero: "" });
    } catch {
      toast.error("Erro ao adicionar telefone");
    }
  }

  async function handleSaveFarm() {
    if (!ownerId || !addressId) {
      toast.error("Cadastre o proprietário e o endereço primeiro.");
      return;
    }

    const payload: GoatFarmRequest = {
      name: farm.name,
      tod: farm.tod,
      ownerId,
      addressId,
      phoneIds
    };

    try {
      await createFarm(payload);
      toast.success("Fazenda cadastrada com sucesso!");
      setFarm({ name: "", tod: "" });
      setPhoneIds([]);
    } catch {
      toast.error("Erro ao cadastrar fazenda");
    }
  }

  return (
    <div className="form-container">
      <h2>Cadastro de Fazenda - Etapa {step}/4</h2>

      {step === 1 && (
        <>
          <h3>1. Proprietário</h3>
          <input type="text" placeholder="Nome" value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} />
          <input type="text" placeholder="CPF" value={owner.cpf} onChange={(e) => setOwner({ ...owner, cpf: e.target.value })} />
          <input type="email" placeholder="Email" value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} />
          <button onClick={handleSaveOwner}>Salvar e continuar</button>
        </>
      )}

      {step === 2 && (
        <>
          <h3>2. Endereço</h3>
          <input type="text" placeholder="Rua" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
          <input type="text" placeholder="Bairro" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
          <input type="text" placeholder="Cidade" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <input type="text" placeholder="Estado" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
          <input type="text" placeholder="CEP" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
          <input type="text" placeholder="País" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
          <button onClick={handleSaveAddress}>Salvar e continuar</button>
          <button onClick={prevStep}>Voltar</button>
        </>
      )}

      {step === 3 && (
        <>
          <h3>3. Telefones</h3>
          <input type="text" placeholder="DDD" value={phone.ddd} onChange={(e) => setPhone({ ...phone, ddd: e.target.value })} />
          <input type="text" placeholder="Número" value={phone.numero} onChange={(e) => setPhone({ ...phone, numero: e.target.value })} />
          <button onClick={handleAddPhone}>Adicionar Telefone</button>
          <ul>
            {phoneIds.map((id, index) => (
              <li key={id}>Telefone {index + 1} - ID: {id}</li>
            ))}
          </ul>
          <button onClick={nextStep}>Próxima etapa</button>
          <button onClick={prevStep}>Voltar</button>
        </>
      )}

      {step === 4 && (
        <>
          <h3>4. Fazenda</h3>
          <input type="text" placeholder="Nome da Fazenda" value={farm.name} onChange={(e) => setFarm({ ...farm, name: e.target.value })} />
          <input type="text" placeholder="TOD" value={farm.tod} onChange={(e) => setFarm({ ...farm, tod: e.target.value })} />
          <button onClick={handleSaveFarm}>Cadastrar Fazenda</button>
          <button onClick={prevStep}>Voltar</button>
        </>
      )}
    </div>
  );
}
