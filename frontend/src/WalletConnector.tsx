import { Button } from "@/components/ui/button";
import { type Connector } from "wagmi";

const ImageComponent = ({ connector }: { connector: Connector }) => {
  if (!connector.icon) return <p className="h-6 w-6 p-0 m-0"></p>;
  return (
    <img
      className="h-6 w-6 p-0 m-0"
      src={connector.icon}
      alt={`${connector.name} icon`}
    />
  );
};

// Metamask, WalletConnect, etc.
export const WalletConnector = ({
  connector,
  onClick,
}: {
  connector: Connector;
  onClick: () => void;
}) => {
  return (
    <Button
      className="flex items-center justify-center gap-2"
      key={connector.uid}
      onClick={onClick}
    >
      <ImageComponent connector={connector} />
      <span className="pe-4">{connector.name}</span>
    </Button>
  );
};
