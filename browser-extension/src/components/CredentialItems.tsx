import { FC } from "react";

interface CredentialItemProps {
  url: string;
  username: string;
  password: string; // Note: This would be shown decrypted
  description: string;
  onUpdate: () => void;
  onDelete: () => void;
}

const CredentialItem: FC<CredentialItemProps> = ({
  url,
  username,
  password,
  description,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="p-4 border rounded">
      <p>URL: {url}</p>
      <p>Username: {username}</p>
      <p>Password: {password}</p>
      <p>Description: {description}</p>
      <button onClick={onUpdate} className="p-2 bg-blue-500 text-white rounded">
        Update
      </button>
      <button onClick={onDelete} className="p-2 bg-red-500 text-white rounded">
        Delete
      </button>
    </div>
  );
};

export { CredentialItem };
