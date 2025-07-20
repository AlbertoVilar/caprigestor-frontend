import { useRef } from "react";
import "./modalEventDetails.css";
import type { EventResponseDTO } from "../../../Models/eventDTO";
import html2pdf from "html2pdf.js"; // ✅ Importação correta

interface Props {
  event: EventResponseDTO;
  onClose: () => void;
}

export default function ModalEventDetails({ event, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    if (printRef.current) {
      const element = printRef.current;

      const opt = {
        margin: 0.5,
        filename: `evento_${event.date}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      html2pdf().set(opt).from(element).save();
    } else {
      console.error("Elemento para exportação não encontrado.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content event-details-modal">
        <button className="modal-close-btn" onClick={onClose}>
          &#x2715;
        </button>

        <div ref={printRef} className="scrollable-content event-pdf-content">
          <h2 className="modal-title">Detalhes do Evento</h2>
          <div className="event-detail-line"><strong>Data:</strong> {event.date}</div>
          <div className="event-detail-line"><strong>Tipo:</strong> {event.eventType}</div>
          <div className="event-detail-line"><strong>Descrição:</strong> {event.description}</div>
          <div className="event-detail-line"><strong>Local:</strong> {event.location}</div>
          <div className="event-detail-line"><strong>Veterinário:</strong> {event.veterinarian}</div>
          <div className="event-detail-line"><strong>Resultado:</strong> {event.outcome}</div>
        </div>

        <div className="modal-footer">
          <button onClick={handleDownloadPDF} className="modal-save-btn">
            💾 Salvar como PDF
          </button>
        </div>
      </div>
    </div>
  );
}
