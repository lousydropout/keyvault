import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";
import { hexToU8a, isHex } from "@polkadot/util";
import { useState } from "react";
import { CustomButton } from "./CustomButton";
import { Text } from "@chakra-ui/react";
import { CustomInput } from "./CustomInput";

type PropsType = {
  beginsWith: string;
  setWalletAddress: React.Dispatch<React.SetStateAction<string>>;
};

const WalletAddressPrompt = ({ beginsWith, setWalletAddress }: PropsType) => {
  const [tmpAddress, setTmpAddress] = useState<string>();
  const [addressErrorMessage, setAddressErrorMessage] = useState<string>("");

  const isValidSubstrateAddress = () => {
    let isValid: boolean;
    try {
      encodeAddress(
        isHex(tmpAddress) ? hexToU8a(tmpAddress) : decodeAddress(tmpAddress)
      );

      isValid = tmpAddress?.startsWith(beginsWith) || false;
    } catch (error) {
      isValid = false;
    }

    if (tmpAddress) {
      const errorMessage =
        "Error: Invalid address" + !tmpAddress.startsWith("Y")
          ? ": should start with 'Y'."
          : "";
      if (!isValid && errorMessage !== addressErrorMessage) {
        setAddressErrorMessage(errorMessage);
      } else if (isValid && addressErrorMessage !== "") {
        setAddressErrorMessage("");
      }
    }

    return isValid;
  };

  return (
    <>
      <CustomInput
        hasLabel={false}
        onChange={(e) => setTmpAddress(e.target.value)}
      />
      {addressErrorMessage !== "" && (
        <Text color="red.300">{addressErrorMessage}</Text>
      )}
      <CustomButton
        colorScheme="primary"
        onClick={() => {
          if (tmpAddress && isValidSubstrateAddress())
            setWalletAddress(tmpAddress);
        }}
        isDisabled={!isValidSubstrateAddress()}
      >
        Update Wallet Address
      </CustomButton>
    </>
  );
};

export { WalletAddressPrompt };
