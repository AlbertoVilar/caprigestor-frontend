import { useState } from "react";
import { toast } from "react-toastify";

import { createOwner } from "../../api/OwnerAPI/owners";
import { createAddress } from "../../api/AddressAPI/addresses";
import { createPhone } from "../../api/PhoneAPI/phones";
// Importe CustomAPIError do novo caminho
import { CustomAPIError } from "../../api/CustomError/CustomAPIError"; // Caminho de importação ATUALIZADO
import { createFarm } from "../../api/GoatFarmAPI/goatFarm";

import { OwnerRequest } from "../../Models/OwnerRequestDTO";
import { AddressRequest } from "../../Models/AddressRequestDTO";
import { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import { GoatFarmRequest } from "../../Models/GoatFarmRequestDTO";

import "./FarmCreateForm.css";

export default function FarmCreateForm() {
  const [step, setStep] = useState(1);

  const [owner, setOwner] = useState<OwnerRequest>({ name: "", cpf: "", email: "" });
  const [ownerId, setOwnerId] = useState<number | null>(null);

  const [address, setAddress] = useState<AddressRequest>({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [addressId, setAddressId] = useState<number | null>(null);

  const [phone, setPhone] = useState<PhonesRequestDTO>({ ddd: "", number: "" });
  const [phones, setPhones] = useState<PhonesRequestDTO[]>([]);
  const [phoneIds, setPhoneIds] = useState<number[]>([]);

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
      toast.success("Proprietário cadastrado!");
      nextStep();
    } catch (error: unknown) { // AJUSTADO: Usando 'error: unknown'
      console.error("Erro ao cadastrar proprietário:", error); // Opcional: logar o erro para depuração
      toast.error("Erro ao cadastrar proprietário.");
    }
  }

  async function handleSaveAddress() {
    try {
      const id = await createAddress(address);
      setAddressId(id);
      toast.success("Endereço cadastrado!");
      nextStep();
    } catch (error: unknown) { // AJUSTADO: Usando 'error: unknown'
      console.error("Erro ao cadastrar endereço:", error); // Opcional: logar o erro para depuração
      toast.error("Erro ao cadastrar endereço.");
    }
  }

  async function handleAddPhone() {
    if (!phone.ddd || !phone.number) {
      toast.error("Preencha o DDD e o número.");
      return;
    }
    const isDuplicateLocal = phones.some(
      (p) => p.ddd === phone.ddd && p.number === phone.number
    );
    if (isDuplicateLocal) {
        toast.warn("Este telefone já foi adicionado para esta fazenda.!");
        return;
    }

    try {
      const id = await createPhone(phone);
      setPhoneIds((prev) => [...prev, id]);
      setPhones((prev) => [...prev, phone]);
      setPhone({ ddd: "", number: "" });
      toast.success("Telefone cadastrado!");
    } catch (error: unknown) {
      console.error("Erro ao cadastrar telefone:", error);

      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        const apiError = error as CustomAPIError;
        if (apiError.status === 409) {
          toast.error("Erro: Este telefone (DDD e Número) já existe no sistema.");
        } else {
          toast.error(`Erro ao cadastrar telefone: ${apiError.message || 'Tente novamente.'}`);
        }
      } else {
        toast.error("Ocorreu um erro inesperado ao cadastrar telefone. Verifique sua conexão ou tente novamente.");
      }
    }
  }

  async function handleSaveFarm() {
    try {
      if (!ownerId || !addressId || phoneIds.length === 0) {
        toast.error("Todos os dados devem ser cadastrados antes da fazenda.");
        return;
      }

      const farmPayload: GoatFarmRequest = {
        name: farm.name,
        tod: farm.tod,
        ownerId,
        addressId,
        phoneIds,
      };

      await createFarm(farmPayload);

      toast.success("Fazenda cadastrada com sucesso!");

      // Resetar estados
      setStep(1);
      setOwner({ name: "", cpf: "", email: "" });
      setAddress({ street: "", neighborhood: "", city: "", state: "", postalCode: "", country: "" });
      setPhone({ ddd: "", number: "" });
      setPhones([]);
      setPhoneIds([]);
      setFarm({ name: "", tod: "" });
      setOwnerId(null);
      setAddressId(null);
    } catch (error: unknown) { // AJUSTADO: Usando 'error: unknown'
      console.error("Erro ao cadastrar a fazenda:", error); // Opcional: logar o erro para depuração
      toast.error("Erro ao cadastrar a fazenda.");
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
          <button onClick={handleSaveOwner}>Continuar</button>
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
          <button onClick={handleSaveAddress}>Continuar</button>
          <button onClick={prevStep}>Voltar</button>
        </>
      )}

      {step === 3 && (
        <>
          <h3>3. Telefones</h3>
          <input type="text" placeholder="DDD" value={phone.ddd} onChange={(e) => setPhone({ ...phone, ddd: e.target.value })} />
          <input type="text" placeholder="Número" value={phone.number} onChange={(e) => setPhone({ ...phone, number: e.target.value })} />
          <button onClick={handleAddPhone}>Adicionar Telefone</button>
          <ul>
            {phones.map((p, i) => (
              <li key={i}>({p.ddd}) {p.number}</li>
            ))}
          </ul>
          <button onClick={nextStep}>Continuar</button>
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