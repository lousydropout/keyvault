import { FC, useEffect, useState } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  InputGroup,
  InputRightElement,
  Checkbox,
  HStack,
  Box,
} from "@chakra-ui/react";
import { CopyIcon, RepeatIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import generator from "generate-password-ts";

import { colors } from "../utils/colors";
import { CustomInput } from "./CustomInput";
import { CustomTextArea } from "./CustomTextArea";
import { CustomButton } from "./CustomButton";
import { Cred } from "../utils/credentials";

interface NewCredsFormProps {
  currentUrl: string | null;
  onSave: (settings: Cred) => void;
  toggleShow: () => void;
}

const generatePassword = (
  length: number,
  lowercase: boolean,
  uppercase: boolean,
  numbers: boolean,
  symbols: boolean
): string => {
  if (length < 4) length = 4;
  return generator.generate({
    length,
    numbers,
    lowercase,
    uppercase,
    symbols,
    strict: true,
  });
};

const NewCredsForm: FC<NewCredsFormProps> = ({
  currentUrl,
  onSave,
  toggleShow,
}) => {
  const [username, setUsername] = useState<string>("");
  const [url, setUrl] = useState<string>(currentUrl || "");
  const [description, setDescription] = useState<string>("");
  const [lowercase, setLowercase] = useState<boolean>(true);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [numbers, setNumbers] = useState<boolean>(true);
  const [symbols, setSymbols] = useState<boolean>(true);
  const [length, setLength] = useState<number>(12);
  const genPw = () =>
    generatePassword(length, lowercase, uppercase, numbers, symbols);
  const [password, setPassword] = useState<string>(genPw());
  const [modifyingPw, setModifyingPw] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1000);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ url, username, password, description, prev: -1 });
    toggleShow();
  };

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (!modifyingPw) setPassword(genPw());
  }, [length, lowercase, uppercase, numbers, symbols]);

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>URL</FormLabel>
          <CustomInput
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            required
          />
        </FormControl>
        <FormControl>
          <FormLabel>Username</FormLabel>
          <CustomInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
        </FormControl>
        <FormControl>
          <HStack
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"end"}
          >
            <FormLabel>Password</FormLabel>
            <CustomButton
              colorScheme="secondary"
              backgroundColor={"transparent"}
              onClick={() => setPassword(genPw())}
              _hover={{ backgroundColor: "transparent" }}
              _focus={{ outline: "none" }}
              _focusVisible={{
                outline: "none",
                backgroundColor: "purple.600",
              }}
              px={0}
            >
              <RepeatIcon color="purple.200" />
            </CustomButton>
          </HStack>
          <InputGroup>
            <Input
              type={showPassword ? "text" : "password"}
              ringColor={colors.secondary.bg}
              borderColor={colors.secondary.bg}
              focusBorderColor={colors.primary.bg}
              pl={2}
              value={password}
              onFocus={() => setModifyingPw(true)}
              onBlur={() => setModifyingPw(false)}
              onChange={(e) => {
                const newPassword = e.target.value;
                setNumbers(/[0-9]/.test(newPassword));
                setLowercase(/[a-z]/.test(newPassword));
                setUppercase(/[A-Z]/.test(newPassword));
                setSymbols(/[!@#$%^&*()-_]/.test(newPassword));
                setLength(newPassword.length);
                setPassword(newPassword);
              }}
              placeholder="Enter password"
              required
              _focus={{ outline: "none" }}
            />
            <InputRightElement
              display={"flex"}
              justifyContent={"flex-end"}
              alignItems={"center"}
              gap={1}
            >
              <Button
                size="md"
                backgroundColor={"transparent"}
                onClick={handleTogglePassword}
                _hover={{ backgroundColor: "transparent" }}
                _focus={{ outline: "none" }}
                _focusVisible={{
                  outline: "none",
                  backgroundColor: "purple.600",
                }}
              >
                {showPassword ? (
                  <ViewIcon color={"purple.200"} />
                ) : (
                  <ViewOffIcon color={"purple.200"} />
                )}
              </Button>
              <Button
                size="md"
                backgroundColor={"transparent"}
                onClick={handleCopyPassword}
                _hover={{ backgroundColor: "transparent" }}
                _focus={{ outline: "none" }}
                _focusVisible={{
                  outline: "none",
                  backgroundColor: "purple.600",
                }}
              >
                <CopyIcon color={"purple.200"} />
              </Button>
            </InputRightElement>
            {showTooltip && (
              <Box
                position="absolute"
                top="-40%"
                right="0"
                bg="purple.800"
                color="white"
                p={2}
                borderRadius="md"
                fontSize="sm"
              >
                Copied!
              </Box>
            )}
          </InputGroup>
        </FormControl>
        <FormControl>
          <VStack spacing={2} align={"start"}>
            <Checkbox
              isChecked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
              colorScheme="purple"
            >
              lowercase
            </Checkbox>
            <Checkbox
              isChecked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              colorScheme="purple"
            >
              uppercase
            </Checkbox>
            <Checkbox
              isChecked={numbers}
              onChange={(e) => setNumbers(e.target.checked)}
              colorScheme="purple"
            >
              number
            </Checkbox>
            <Checkbox
              isChecked={symbols}
              onChange={(e) => setSymbols(e.target.checked)}
              colorScheme="purple"
            >
              symbols
            </Checkbox>
          </VStack>
        </FormControl>
        <FormControl>
          <HStack display={"flex"} justifyContent={"start"} alignItems={"end"}>
            <FormLabel>length</FormLabel>
            <Input
              variant={"filled"}
              width={"4rem"}
              type={"number"}
              bgColor={"transparent"}
              _hover={{ bgColor: "transparent" }}
              _active={{ bgColor: "transparent" }}
              ringColor={colors.secondary.bg}
              borderColor={colors.secondary.bg}
              focusBorderColor={colors.primary.bg}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              onBlur={(e) => {
                const _length = Number(e.target.value);
                if (_length < 4) {
                  setLength(4);
                } else {
                  setLength(_length);
                }
              }}
              placeholder="Enter password length"
              required
            />
          </HStack>
        </FormControl>
        <CustomTextArea
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description (optional)"
          label="Description"
        />

        <CustomButton
          type="submit"
          colorScheme="accent"
          size="md"
          width="full"
          isDisabled={!username || !password || !url}
        >
          Add credential
        </CustomButton>
      </VStack>
    </form>
  );
};

export { NewCredsForm };
