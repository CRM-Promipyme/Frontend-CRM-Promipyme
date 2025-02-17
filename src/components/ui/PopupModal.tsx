import React, { ReactNode } from "react";
import "../../styles/components/popupModal.css";

interface ModalProps {
    show: boolean;
    onClose: () => void;
    children: ReactNode;
}

export const PopupModal: React.FC<ModalProps> = ({ show, onClose, children }) => {
    return (
        <div className={`modal-mask ${show ? "visible" : "hidden"}`} onClick={onClose}>
            <div className="modal-wrapper">
                <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
            </div>
        </div>
    );
};
