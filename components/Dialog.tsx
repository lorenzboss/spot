'use client';

import { Modal, useOverlayState } from '@heroui/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  isOpen?: boolean;
}

export default function Dialog({ title, onClose, children, panelClassName, isOpen = true }: DialogProps) {
  const state = useOverlayState({
    isOpen,
    onOpenChange: (nextOpen) => {
      if (!nextOpen) onClose();
    },
  });

  return (
    <Modal state={state}>
      <Modal.Backdrop className="bg-black/40 backdrop-blur-sm" />
      <Modal.Container placement="center" className="p-4">
        <Modal.Dialog className={`w-full ${panelClassName ?? 'max-w-sm'}`}>
          <Modal.Header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <Modal.Heading className="text-base font-semibold">{title}</Modal.Heading>
            <Modal.CloseTrigger className="rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </Modal.CloseTrigger>
          </Modal.Header>
          <Modal.Body className="px-6 py-5">{children}</Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
