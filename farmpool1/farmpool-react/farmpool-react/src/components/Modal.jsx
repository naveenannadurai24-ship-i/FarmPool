import { useEffect, useRef } from "react";

// A native <dialog>: it gives us the dimmed backdrop, focus trapping and the
// Escape key for free. `open` is the React state; we keep the element in sync.
export default function Modal({ id, open, onClose, labelledBy, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      id={id}
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose} // fires when the user presses Escape
      onClick={(e) => { if (e.target === ref.current) onClose(); }} // click on the backdrop
    >
      {children}
    </dialog>
  );
}
