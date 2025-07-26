import { useState } from "react";
import { toast } from "react-toastify";

import { createFarm } from "../../api/GoatFarmAPI/goatFarm";
import { OwnerRequest } from "../../Models/OwnerRequestDTO";
import { AddressRequest } from "../../Models/AddressRequestDTO";
import { PhonesRequestDTO } from "../../Models/PhoneRequestDTO";
import { FarmCreateRequest } from "@/Models/FarmCreateRequestDTO";

import "./FarmCreateForm.css";
import FormStepButton from "../buttons/FormStepButton";

export default function FarmCreateForm() {
  const [step, setStep] = useState(1);

  const [owner, setOwner] = useState<OwnerRequest>({
    name: "",
    cpf: "",
    email: "",
  });

  const [address, setAddress] = useState<AddressRequest>({
    street: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const [phone, setPhone] = useState<PhonesRequestDTO>({ ddd: "", number: "" });
  const [phones, setPhones] = useState<PhonesRequestDTO[]>([]);

  const [farm, setFarm] = useState<{ name: string; tod: string }>({
    name: "",
    tod: "",
  });

  function nextStep() {
    setStep((prev) => Math.min(prev + 1, 4));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleAddPhone() {
    if (!phone.ddd || !phone.number) {
      toast.error("Preencha o DDD e o número.");
      return;
    }

    const isDuplicate = phones.some(
      (p) => p.ddd === phone.ddd && p.number === phone.number
    );

    if (isDuplicate) {
      toast.warn("Este telefone já foi adicionado.");
      return;
    }

    setPhones((prev) => [...prev, phone]);
    setPhone({ ddd: "", number: "" });
    toast.success("Telefone adicionado!");
  }

  async function handleSaveFarm() {
    try {
      if (
        !owner.name ||
        !owner.cpf ||
        !owner.email ||
        !address.street ||
        !address.city ||
        !address.state ||
        !farm.name ||
        !farm.tod ||
        phones.length === 0
      ) {
        toast.error("Preencha todos os campos obrigatórios antes de cadastrar a fazenda.");
        return;
      }

      const farmPayload: FarmCreateRequest = {
        farm: {
          name: farm.name,
          tod: farm.tod,
        },
        owner,
        address,
        phones,
      };

      await createFarm(farmPayload);

      toast.success("Fazenda cadastrada com sucesso!");

      // Resetar estados
      setStep(1);
      setOwner({ name: "", cpf: "", email: "" });
      setAddress({
        street: "",
        neighborhood: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      });
      setPhone({ ddd: "", number: "" });
      setPhones([]);
      setFarm({ name: "", tod: "" });
    } catch (error) {
      console.error("Erro ao cadastrar fazenda:", error);
      toast.error("Erro ao cadastrar a fazenda.");
    }
  }

  return (
    <div className="form-container">
      <h2>Cadastro de Fazenda - Etapa {step}/4</h2>

      {step === 1 && (
        <>
          <h3>1. Proprietário</h3>
          <input
            type="text"
            placeholder="Nome"
            value={owner.name}
            onChange={(e) => setOwner({ ...owner, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="CPF"
            value={owner.cpf}
            onChange={(e) => setOwner({ ...owner, cpf: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            value={owner.email}
            onChange={(e) => setOwner({ ...owner, email: e.target.value })}
          />
          <FormStepButton
            label="Continuar"
            onClick={() => {
              if (!owner.name || !owner.cpf || !owner.email) {
                toast.error("Preencha todos os campos do proprietário.");
                return;
              }
              toast.success("Proprietário preenchido!");
              nextStep();
            }}
          />
        </>
      )}

      {step === 2 && (
        <>
          <h3>2. Endereço</h3>
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
            onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
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
          <div>
            <FormStepButton
              label="Continuar"
              onClick={() => {
                if (!address.street || !address.city || !address.state) {
                  toast.error("Preencha os campos obrigatórios do endereço.");
                  return;
                }
                toast.success("Endereço preenchido!");
                nextStep();
              }}
            />
            <FormStepButton label="Voltar" onClick={prevStep} className="secondary" />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h3>3. Telefones</h3>
          <input
            type="text"
            placeholder="DDD"
            value={phone.ddd}
            onChange={(e) => setPhone({ ...phone, ddd: e.target.value })}
          />
          <input
            type="text"
            placeholder="Número"
            value={phone.number}
            onChange={(e) => setPhone({ ...phone, number: e.target.value })}
          />
          <FormStepButton label="Adicionar Telefone" onClick={handleAddPhone} />
          <ul>
            {phones.map((p, i) => (
              <li key={i}>({p.ddd}) {p.number}</li>
            ))}
          </ul>
          <div>
            <FormStepButton label="Continuar" onClick={nextStep} />
            <FormStepButton label="Voltar" onClick={prevStep} className="secondary" />
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h3>4. Fazenda</h3>
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
          <div>
            <FormStepButton label="Cadastrar Fazenda" onClick={handleSaveFarm} />
            <FormStepButton label="Voltar" onClick={prevStep} className="secondary" />
          </div>
        </>
      )}
    </div>
  );
}
