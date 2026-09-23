import React from "react";
import type { CustomerRequestDTO, CustomerResponseDTO } from "../../Models/CommercialDTOs";

export type CustomersTabProps = {
  customers: CustomerResponseDTO[];
  customerForm: CustomerRequestDTO;
  setCustomerForm: React.Dispatch<React.SetStateAction<CustomerRequestDTO>>;
  handleCreateCustomer: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: "customer" | "animalSale" | "milkSale" | null;
};

export default function CustomersTab({
  customers,
  customerForm,
  setCustomerForm,
  handleCreateCustomer,
  submitting,
}: CustomersTabProps) {
  return (
    <div className="commercial-customers-tab">
      <section className="commercial-grid commercial-grid--tables">
        <article className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <p className="commercial-card__eyebrow">Cadastro de compradores</p>
              <h2>Novo cliente</h2>
            </div>
            <span className="commercial-card__chip">{customers.length} cadastrados</span>
          </div>
          <p className="commercial-muted">
            Cadastre clientes para vincular a vendas de animais, remessas de leite e cobranças.
          </p>
          <form className="commercial-form" onSubmit={handleCreateCustomer}>
            <label>
              <span>Nome</span>
              <input
                value={customerForm.name}
                onChange={(event) => setCustomerForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Documento</span>
              <input
                value={customerForm.document}
                onChange={(event) => setCustomerForm((prev) => ({ ...prev, document: event.target.value }))}
              />
            </label>
            <label>
              <span>Telefone</span>
              <input
                value={customerForm.phone}
                onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={customerForm.email}
                onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
            <label className="commercial-form__full">
              <span>Observações</span>
              <textarea
                rows={3}
                value={customerForm.notes}
                onChange={(event) => setCustomerForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <button
              type="submit"
              className="commercial-btn commercial-btn--primary"
              disabled={submitting === "customer"}
            >
              {submitting === "customer" ? "Salvando..." : "Cadastrar cliente"}
            </button>
          </form>
        </article>

        <article className="commercial-card">
          <div className="commercial-card__header">
            <div>
              <p className="commercial-card__eyebrow">Diretório de clientes</p>
              <h2>Lista de compradores</h2>
            </div>
            <span className="commercial-card__chip">{customers.length}</span>
          </div>
          <div className="commercial-table-shell">
            <table className="commercial-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                      {customer.document ? <small>{customer.document}</small> : null}
                    </td>
                    <td>
                      <span>{customer.phone || "-"}</span>
                      <small>{customer.email || "-"}</small>
                    </td>
                    <td>{customer.active ? "Ativo" : "Inativo"}</td>
                  </tr>
                ))}
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={3}>Nenhum cliente cadastrado ainda.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
