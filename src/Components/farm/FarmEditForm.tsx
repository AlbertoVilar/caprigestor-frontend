import { useState } from "react";
import { toast } from "react-toastify";

import { updateGoatFarmFull } from "@/api/GoatFarmAPI/goatFarm";
import type { AddressRequest } from "@/Models/AddressRequestDTO";
import type { GoatFarmRequest } from "@/Models/GoatFarmRequestDTO";
import type { UserUpdateRequest } from "@/Models/UserUpdateRequestDTO";
import type { OwnerRequest } from "@/Models/OwnerRequestDTO";
import type { PhonesRequestDTO } from "@/Models/PhoneRequestDTO";
import { FarmDataConverter } from "../../utils/FarmDataConverter";

import "../../styles/forms.css";
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
  const [user, setUser] = useState<UserUpdateRequest>({
    id: initialData.owner.id || 1, // ID obrigatório
    name: initialData.owner.name,
    email: initialData.owner.email,
    cpf: FarmDataConverter.formatCPF(initialData.owner.cpf || ''), // Formatar CPF no carregamento
    roles: ['ROLE_OPERATOR', 'ROLE_ADMIN']
  });
  const [address, setAddress] = useState({
    ...initialData.address,
    zipCode: FarmDataConverter.formatCEP(initialData.address.zipCode)
  });
  const [phones, setPhones] = useState(initialData.phones);
  const [farm, setFarm] = useState(initialData.farm);

  const handleUpdate = async () => {
    try {
      console.log("Enviando atualização completa:", {
        user,
        address,
        phones,
        farm,
      });

      // Validações antes do envio
      if (!user.id || !farm.id) {
        throw new Error('IDs de usuário e fazenda são obrigatórios');
      }
      
      if (!user.roles || user.roles.length === 0) {
        throw new Error('Roles do usuário são obrigatórias');
      }

      // Validações de formato
      // CPF pode estar com ou sem formatação
      const cpfRegex = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/;
      if (user.cpf && !cpfRegex.test(user.cpf)) {
        throw new Error('CPF deve ter 11 dígitos ou estar no formato XXX.XXX.XXX-XX');
      }

      const cepRegex = /^\d{5}-\d{3}$/;
      if (!cepRegex.test(address.zipCode)) {
        throw new Error('CEP deve estar no formato XXXXX-XXX');
      }

      // Validar telefones
      for (const phone of phones) {
        // Validar DDD apenas se não estiver vazio
        if (phone.ddd && phone.ddd.trim() !== '') {
          const cleanDdd = phone.ddd.replace(/\D/g, '');
          if (cleanDdd.length !== 2) {
            throw new Error('DDD deve ter exatamente 2 dígitos');
          }
        }
        // Validar número apenas se não estiver vazio
        if (phone.number && phone.number.trim() !== '') {
          const cleanNumber = phone.number.replace(/\D/g, '');
          if (cleanNumber.length < 8 || cleanNumber.length > 9) {
            throw new Error(`Número do telefone deve ter 8 ou 9 dígitos. Número fornecido: ${phone.number} (${cleanNumber.length} dígitos)`);
          }
        }
      }

      // Estrutura correta do payload conforme documentação
        const { id, ...addressWithoutId } = address;
        const payload = {
          farm: {
            id: farm.id,
            name: farm.name,
            tod: farm.tod.substring(0, 5),
            addressId: initialData.address.id || 1,
            userId: user.id,
            phoneIds: phones.map(p => p.id || 1)
          },
          user: {
            name: user.name,
            email: user.email,
            cpf: user.cpf.replace(/\D/g, ''), // Apenas números
            password: "senha123", // Campo obrigatório
            confirmPassword: "senha123", // Campo obrigatório
            roles: user.roles || ["ROLE_OPERATOR"]
          },
          address: addressWithoutId,
          phones: phones.map(phone => ({
            id: phone.id || 1,
            ddd: phone.ddd,
            number: phone.number.replace(/\D/g, '') // Apenas números
          }))
        };

      console.log('Payload sendo enviado:', JSON.stringify(payload, null, 2));
      console.log('Address object:', addressWithoutId);
      await updateGoatFarmFull(farm.id, payload);

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
      <div className="form-header">
        <h2>Editar Capril</h2>
      </div>
      <div className="form-body">
        <div className="form-section">
          <div className="section-header">
            <h3>Proprietário</h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="owner-name">Nome</label>
              <input
                id="owner-name"
                type="text"
                placeholder="Nome"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="owner-cpf">CPF</label>
              <input
                id="owner-cpf"
                type="text"
                placeholder="CPF"
                value={user.cpf}
                onChange={(e) => {
                  const formattedCpf = FarmDataConverter.formatCPF(e.target.value);
                  setUser({ ...user, cpf: formattedCpf });
                }}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="owner-email">Email</label>
              <input
                id="owner-email"
                type="email"
                placeholder="Email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Endereço</h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address-street">Rua</label>
              <input
                id="address-street"
                type="text"
                placeholder="Rua"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address-neighborhood">Bairro</label>
              <input
                id="address-neighborhood"
                type="text"
                placeholder="Bairro"
                value={address.neighborhood}
                onChange={(e) =>
                  setAddress({ ...address, neighborhood: e.target.value })
                }
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address-city">Cidade</label>
              <input
                id="address-city"
                type="text"
                placeholder="Cidade"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address-state">Estado</label>
              <input
                id="address-state"
                type="text"
                placeholder="Estado"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address-cep">CEP</label>
              <input
                id="address-cep"
                type="text"
                placeholder="CEP"
                value={address.zipCode}
                onChange={(e) => {
                  const formattedCep = FarmDataConverter.formatCEP(e.target.value);
                  setAddress({ ...address, zipCode: formattedCep });
                }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address-country">País</label>
              <input
                id="address-country"
                type="text"
                placeholder="País"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Telefones</h3>
          </div>
          {phones.map((p, i) => (
            <div className="form-row" key={p.id || i}>
              <div className="form-group">
                <label htmlFor={`phone-ddd-${i}`}>DDD</label>
                <input
                  id={`phone-ddd-${i}`}
                  type="text"
                  placeholder="DDD"
                  value={p.ddd}
                  onChange={(e) => {
                    const updated = [...phones];
                    updated[i] = { ...updated[i], ddd: e.target.value };
                    setPhones(updated);
                  }}
                />
              </div>
              <div className="form-group">
                <label htmlFor={`phone-number-${i}`}>Número</label>
                <input
                  id={`phone-number-${i}`}
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
            </div>
          ))}
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Dados da Fazenda</h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="farm-name">Nome da Fazenda</label>
              <input
                id="farm-name"
                type="text"
                placeholder="Nome da Fazenda"
                value={farm.name}
                onChange={(e) => setFarm({ ...farm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="farm-tod">TOD</label>
              <input
                id="farm-tod"
                type="text"
                placeholder="TOD"
                value={farm.tod}
                onChange={(e) => setFarm({ ...farm, tod: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="form-actions">
        <FormStepButton label="Salvar Alterações" onClick={handleUpdate} />
      </div>
    </div>
  );
}
