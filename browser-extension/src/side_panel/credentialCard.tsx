import { PasswordAdditionCred } from "@/utils/credentials";
import { useState } from "react";

const CredentialCard = ({
  cred,
  onSave,
  onModify,
  onDelete,
}: {
  cred: PasswordAdditionCred;
  onSave: (data: PasswordAdditionCred) => Promise<void>;
  onModify: (data: PasswordAdditionCred) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
}) => {
  const [credState, setCredState] = useState<PasswordAdditionCred>(cred);
  const [mode, setMode] = useState<"latest" | "edit">("latest");
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="border-1 rounded-md p-4 my-4 flex flex-col items-end">
        <input
          type="text"
          readOnly={mode === "latest"}
          value={credState.username}
          onChange={(e) => setCredState({ ...cred, username: e.target.value })}
          className="border rounded-md p-2 mb-2"
        />
        <input
          type="password"
          readOnly={mode === "latest"}
          value={credState.password}
          onChange={(e) => setCredState({ ...cred, password: e.target.value })}
          className="border rounded-md p-2 mb-2"
        />
        <textarea
          value={credState?.description}
          onChange={(e) =>
            setCredState({ ...cred, description: e.target.value })
          }
          className="border rounded-md p-2 mb-2"
        />
        <div className="my-2">
          {mode === "latest" && (
            <>
              <button
                className="bg-blue-500 text-white rounded-md px-4 py-2 mr-2"
                onClick={() => setMode("edit")}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white rounded-md px-4 py-2"
                onClick={openModal}
              >
                Delete
              </button>
            </>
          )}
          {mode === "edit" && (
            <>
              <button
                className="bg-blue-500 text-white rounded-md px-4 py-2"
                onClick={(event) => {
                  event.preventDefault();
                  if (credState.encrypted.onChain) {
                    onSave({ ...credState, prev: credState.curr as number });
                  } else {
                    onModify(credState);
                  }
                  setMode("latest");
                }}
              >
                Save
              </button>
              <button
                className="bg-red-500 text-white rounded-md px-4 py-2"
                onClick={() => {
                  setCredState(cred); // undoes changes
                  setMode("latest");
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-gray-900 bg-opacity-75 p-8 rounded-md">
            <h2 className="text-2xl text-center mb-4">
              Are you sure you want to delete this credential?
            </h2>
            <div className="flex flex-col">
              <button
                className="bg-red-500 text-white rounded-md px-4 py-2 mb-2"
                onClick={() => {
                  onDelete(cred.curr as number);
                  closeModal();
                }}
              >
                Yes, delete this credential.
              </button>
              <button
                className="bg-blue-500 text-white rounded-md px-4 py-2"
                onClick={() => {
                  setCredState(cred); // undoes changes
                  setMode("latest");
                  closeModal();
                }}
              >
                No, don't delete.
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { CredentialCard };
