// resources/js/Components/Modal.tsx
import React, { type PropsWithChildren, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
}

export default function Modal({ show, onClose, title, children }: PropsWithChildren<ModalProps>) {
  // Empêche le défilement de la page en arrière-plan
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Nettoyage au démontage
    return () => { document.body.style.overflow = 'auto'; };
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    // Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose} // Ferme au clic sur le fond
    >
      {/* Conteneur de la modale */}
      <div 
        className="relative w-full max-w-2xl p-4 bg-white rounded-lg shadow-xl m-4"
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture au clic sur la modale
      >
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
            title="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="mt-4 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}