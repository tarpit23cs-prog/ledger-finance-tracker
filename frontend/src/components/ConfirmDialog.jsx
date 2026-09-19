import Modal from "./Modal";

export default function ConfirmDialog({ title = "Are you sure?", message, onConfirm, onCancel, danger }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width="380px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm}>
            Confirm
          </button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}
