import { goatsData } from "../../Data/goatsData";
import type { Goat } from "../../Models/goat";
import './goatInfo.css';

interface Props {
  registrationNumber: string | null;
}

export default function GoatInfoCard({ registrationNumber }: Props) {
  const goat: Goat | undefined = goatsData.find(
    (g) => g.registrationNumber === registrationNumber
  );

  if (!goat) {
    return <div className="goat-card">🐐 Nenhuma cabra encontrada.</div>;
  }

  return (
    <div className="goat-card">
      <div className="goat-info">
        <h3>{goat.name}</h3>
        <p><strong>Registro:</strong> {goat.registrationNumber}</p>
        <p><strong>Sexo:</strong> {goat.gender}</p>
        <p><strong>Raça:</strong> {goat.breed}</p>
        <p><strong>Pelagem:</strong> {goat.color}</p>
        <p><strong>Data de Nascimento:</strong> {goat.birthDate}</p>
        <p><strong>Status:</strong> {goat.status}</p>
        <p><strong>Categoria:</strong> {goat.category}</p>
        <p><strong>TOD:</strong> {goat.tod}</p>
        <p><strong>TOE:</strong> {goat.toe}</p>
        <p><strong>Pai:</strong> {goat.fatherName}</p>
        <p><strong>Mãe:</strong> {goat.motherName}</p>
        <p><strong>Proprietário:</strong> {goat.ownerName}</p>
        <p><strong>Fazenda:</strong> {goat.farmName}</p>
      </div>
    </div>
  );
}
