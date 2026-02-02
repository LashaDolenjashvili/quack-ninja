"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@/src/components/ui/modal";

type SaveQueryModalProps = {
  open: boolean;
  defaultName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
};

export function SaveQueryModal({
  open,
  defaultName,
  onCancel,
  onSave,
}: SaveQueryModalProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  if (!open) {
    return null;
  }

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader
          title="Save query"
          description="Name this query so you can reuse it later."
        />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-4 w-full rounded-lg border border-[#E6EEF7] bg-[#F7FAFC] px-3 py-2 text-sm"
          placeholder="Monthly revenue rollup"
        />
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave(name.trim())}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
