interface ModalProps {
  isOpen: boolean;
  message: string;
}

const Modal = ({ isOpen, message }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="text-center mb-4">
          <span className="text-5xl" role="img" aria-label="success">
            😊
          </span>
        </div>
        <p className="text-center text-gray-800 dark:text-white text-lg">
          {message}
        </p>
      </div>
    </div>
  );
};

export default Modal; 