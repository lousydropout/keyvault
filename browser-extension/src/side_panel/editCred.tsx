import { View } from "@/components/header";
import { CopyIcon } from "@/components/icons/copy";
import { RepeatIcon } from "@/components/icons/repeat";
import { ViewIcon } from "@/components/icons/view";
import { ViewOffIcon } from "@/components/icons/viewOff";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CRED_TO_BE_EDITED,
  ENCRYPTEDS,
  MODIFIED_ENCRYPTEDS,
  VIEW,
} from "@/constants/hookVariables";
import { useBrowserStore, useBrowserStoreLocal } from "@/hooks/useBrowserStore";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import {
  basePasswordCred,
  updatePasswordCred,
  type PasswordAdditionCred,
} from "@/utils/credentials";
import { encrypt, type Encrypted } from "@/utils/encryption";
import generator from "generate-password-ts";
import { FormEvent, useEffect, useRef, useState } from "react";

const generatePassword = (
  length: number,
  lowercase: boolean,
  uppercase: boolean,
  numbers: boolean,
  includeSymbols: boolean,
  symbols?: string
): string => {
  if (length < 4) length = 4;
  return generator.generate({
    length,
    numbers,
    lowercase,
    uppercase,
    symbols: includeSymbols && symbols,
    strict: true,
  });
};

export const EditCred = () => {
  const [cred] = useBrowserStore<PasswordAdditionCred>(
    CRED_TO_BE_EDITED,
    basePasswordCred
  );
  const [_view, setView] = useBrowserStore<View>(VIEW, "Current Page");
  const [_jwk, _setJwk, cryptoKey] = useCryptoKeyManager();
  const [encrypteds, setEncrypteds] = useBrowserStoreLocal<Encrypted[]>(
    ENCRYPTEDS,
    []
  );
  const [_modifiedEncrypteds, setModifiedEncrypteds] =
    useBrowserStoreLocal<boolean>(MODIFIED_ENCRYPTEDS, false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState<string>(cred.username);
  const [url, setUrl] = useState<string>(cred.url);
  const [description, setDescription] = useState<string>(cred.description);
  const [password, setPassword] = useState<string>(cred.password);
  const [lowercase, setLowercase] = useState<boolean>(true);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [numbers, setNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [symbols, setSymbols] = useState<string>("!@#$%^&*()-+_?");
  const [length, setLength] = useState<number>(16);
  const [modifyingPw, setModifyingPw] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const genPw = () =>
    generatePassword(
      length,
      lowercase,
      uppercase,
      numbers,
      includeSymbols,
      symbols
    );

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1000);
  };

  const getNonces = () => encrypteds.map(({ iv }: Encrypted) => iv);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const newCred = updatePasswordCred(cred, {
      url,
      username,
      password,
      description,
      curr: encrypteds.length,
    });

    // Ensure that the nonce (IV) is unique
    const nonces = getNonces();
    let encrypted: Encrypted;
    while (true) {
      encrypted = await encrypt(cryptoKey as CryptoKey, newCred);
      if (!nonces.includes(encrypted.iv)) break;
    }
    setEncrypteds((values) => [...values, encrypted]);
    setModifiedEncrypteds(true);
    setView("Current Page");
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    setUsername(cred.username);
    setUrl(cred.url);
    setDescription(cred.description);
    setPassword(cred.password);
  }, [cred]);

  useEffect(() => {
    if (!modifyingPw) setPassword(genPw());
  }, [length, lowercase, uppercase, numbers, symbols]);

  const handleDivClick = () => {
    // Programmatically focus the input when div is clicked
    inputRef.current?.focus();
  };

  if (cred.id === "base")
    return <h1 className="text-2xl text-center mt-12">Loading...</h1>;

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col w-[340px] mx-auto align-top justify-start gap-5">
        <div className="flex flex-col gap-2 pt-8">
          <Label htmlFor="URL" className="block text-xl">
            URL
          </Label>
          <Input
            type="text"
            id="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            required
            className="bg-transparent text-white text-opacity-50 active:text-white focus:text-white text-lg"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="username" className="block text-xl">
            Username
          </Label>
          <Input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            className="bg-transparent text-white text-opacity-50 active:text-white focus:text-white text-lg"
          />
        </div>
        <div>
          <div className="flex justify-between items-end mb-2">
            <Label htmlFor="password-input" className="block text-xl">
              Password
            </Label>
            <button
              type="button"
              onClick={() => setPassword(genPw())}
              className="bg-transparent hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
            >
              <RepeatIcon className="w-6 h-6 hover:text-slate-300 hover:text-opacity-90 active:text-opacity-80 active:text-slate-400" />
            </button>
          </div>
          <div
            className={`relative border border-input flex items-center justify-between border-gray-300 rounded-md 
              focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:outline-none
              px-3 py-2 h-10 cursor-text
              `}
            tabIndex={-1}
            onClick={handleDivClick}
          >
            <input
              id="password-input"
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onFocus={() => setModifyingPw(true)}
              onBlur={() => setModifyingPw(false)}
              onChange={(e) => {
                const newPassword = e.target.value;
                setNumbers(/[0-9]/.test(newPassword));
                setLowercase(/[a-z]/.test(newPassword));
                setUppercase(/[A-Z]/.test(newPassword));
                setIncludeSymbols(/[${symbols}]/.test(newPassword));
                setLength(newPassword.length);
                setPassword(newPassword);
              }}
              placeholder="Enter password"
              required
              className="px-2 py-1 bg-transparent rounded focus:outline-none text-lg"
            />
            <div className="flex justify-end items-center gap-1">
              <button
                type="button"
                onClick={handleTogglePassword}
                className="bg-transparent hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
              >
                {showPassword ? (
                  <ViewIcon className="w-6 h-6 hover:text-slate-300 hover:text-opacity-90 active:text-opacity-80 active:text-slate-400" />
                ) : (
                  <ViewOffIcon className="w-6 h-6 hover:text-slate-300 hover:text-opacity-90 active:text-opacity-80 active:text-slate-400" />
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="bg-transparent hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
              >
                <CopyIcon className="w-6 h-6 hover:text-slate-300 hover:text-opacity-90 active:text-opacity-80 active:text-slate-400" />
              </button>
            </div>
            {showTooltip && (
              <div className="absolute -top-8 right-0 bg-purple-700 opacity-80 text-white p-2 rounded-md text-sm">
                Copied!
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="space-y-2">
            <div className="flex gap-2 items-center justify-start">
              <Checkbox
                tabIndex={-1}
                className="visibility-hidden ring-none outline-none border-none cursor-default h-5 w-5"
              />
              <Label htmlFor="set-length" className="block text-lg font-normal">
                length:
              </Label>
              <input
                id="set-length"
                type="number"
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
                className="w-16 px-2 py-0 border-b ring-0 bg-transparent focus:outline-none text-lg"
              />
            </div>
            <div className="flex gap-2 items-center justify-between">
              <Checkbox
                id="include-lowercase"
                checked={lowercase}
                onCheckedChange={(checked) => setLowercase(checked as boolean)}
                className={`
                bg-slate-500 checked:bg-blue-300 checked:text-slate-800 checked:bg-visible
                peer h-5 w-5 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              <Label
                htmlFor="include-lowercase"
                className="w-full text-lg font-normal"
              >
                lowercase
              </Label>
            </div>
            <div className="flex gap-2 items-center justify-between">
              <Checkbox
                id="include-uppercase"
                checked={uppercase}
                onCheckedChange={(checked) => setUppercase(checked as boolean)}
                className={`
                bg-slate-500 checked:bg-blue-300 checked:text-slate-800 checked:bg-visible
                peer h-5 w-5 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              <Label
                htmlFor="include-uppercase"
                className="w-full text-lg font-normal"
              >
                uppercase
              </Label>
            </div>
            <div className="flex gap-2 items-center justify-between">
              <Checkbox
                id="include-numbers"
                checked={numbers}
                onCheckedChange={(checked) => setNumbers(checked as boolean)}
                className={`
                bg-slate-500 checked:bg-blue-300 checked:text-slate-800 checked:bg-visible
                peer h-5 w-5 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              <Label
                htmlFor="include-numbers"
                className="w-full text-lg font-normal"
              >
                numbers
              </Label>
            </div>
            <div className="flex gap-4 items-center justify-start">
              <div className="flex gap-2 items-center justify-between">
                <Checkbox
                  id="include-symbols"
                  checked={includeSymbols}
                  onCheckedChange={(checked) =>
                    setIncludeSymbols(checked as boolean)
                  }
                  className={`
                bg-slate-500 checked:bg-blue-300 checked:text-slate-800 checked:bg-visible
                peer h-5 w-5 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                />
                <Label
                  htmlFor="include-symbols"
                  className="w-full text-lg font-normal"
                >
                  symbols:
                </Label>
              </div>
              <input
                type="text"
                value={symbols}
                onChange={(e) => {
                  let _symbols = e.target.value;
                  if (_symbols.length == 0) setIncludeSymbols(false);
                  setSymbols(_symbols);
                }}
                className="w-40 p-0 bg-transparent ring-0 border-b focus:outline-none focus-visible:outline-none text-lg"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="block text-xl">
            Description
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (optional)"
            className="border border-gray-300 px-3 py-2 rounded bg-transparent text-lg"
          />
        </div>
        <div className="flex flex-col gap-4 mt-8">
          <Button
            type="submit"
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            disabled={!username || !password || !url}
          >
            Update credential
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="bg-opacity-80 hover:bg-opacity-80 text-white hover:text-white px-4 py-3 rounded disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
            onClick={() => setView("Current Page")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};
