import { View } from "@/components/header";
import { CopyIcon } from "@/components/icons/copy";
import { RepeatIcon } from "@/components/icons/repeat";
import { ViewIcon } from "@/components/icons/view";
import { ViewOffIcon } from "@/components/icons/viewOff";
import { useChromeStorageLocal } from "@/hooks/useChromeLocalStorage";
import { useCryptoKeyManager } from "@/hooks/useCryptoKey";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { createBarePasswordCred } from "@/utils/credentials";
import { encrypt, Encrypted } from "@/utils/encryption";
import generator from "generate-password-ts";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";

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

export const AddCred = ({
  setView,
}: {
  setView: Dispatch<SetStateAction<View>>;
}) => {
  const [_jwk, _setJwk, cryptoKey] = useCryptoKeyManager();
  const [encrypteds, setEncrypteds] = useChromeStorageLocal<Encrypted[]>(
    `encrypteds`,
    []
  );

  const [username, setUsername] = useState<string>("");
  const [_, currentUrl] = useCurrentTab();
  const [url, setUrl] = useState<string>(currentUrl || "");
  const [description, setDescription] = useState<string>("");
  const [lowercase, setLowercase] = useState<boolean>(true);
  const [uppercase, setUppercase] = useState<boolean>(true);
  const [numbers, setNumbers] = useState<boolean>(true);
  const [symbols, setSymbols] = useState<boolean>(true);
  const [length, setLength] = useState<number>(12);
  const [password, setPassword] = useState<string>("");
  const [modifyingPw, setModifyingPw] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (currentUrl) setUrl(currentUrl);
  }, [currentUrl]);

  const genPw = () =>
    generatePassword(length, lowercase, uppercase, numbers, symbols);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const bareCred = createBarePasswordCred({
      url,
      username,
      password,
      description,
      prev: -1,
      curr: encrypteds.length,
    });
    const encrypted = await encrypt(cryptoKey as CryptoKey, bareCred);

    setEncrypteds((values) => [...values, encrypted]);
    setView("Current Page");
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (!modifyingPw) setPassword(genPw());
  }, [length, lowercase, uppercase, numbers, symbols]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            required
            className="border border-gray-300 px-2 py-1 rounded bg-transparent"
          />
        </div>
        <div>
          <label className="block">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
            className="border border-gray-300 px-2 py-1 rounded bg-transparent"
          />
        </div>
        <div>
          <div className="flex justify-between items-end">
            <label className="block">Password</label>
            <button
              type="button"
              onClick={() => setPassword(genPw())}
              className="bg-transparent hover:bg-transparent focus:bg-purple-600 focus:outline-none"
            >
              <RepeatIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
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
              className="border border-gray-300 px-2 py-1 bg-transparent rounded focus:outline-none"
            />
            <div className="flex justify-end items-center gap-1">
              <button
                type="button"
                onClick={handleTogglePassword}
                className="bg-transparent hover:bg-transparent focus:bg-purple-600 focus:outline-none"
              >
                {showPassword ? (
                  <ViewIcon className="w-6 h-6" />
                ) : (
                  <ViewOffIcon className="w-6 h-6" />
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="bg-transparent hover:bg-transparent focus:bg-purple-600 focus:outline-none"
              >
                <CopyIcon className="w-6 h-6" />
              </button>
            </div>
            {showTooltip && (
              <div className="absolute top-0 right-0 bg-purple-800 text-white p-2 rounded-md text-sm">
                Copied!
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="space-y-2">
            <label className="block">
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => setLowercase(e.target.checked)}
              />
              lowercase
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              uppercase
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={numbers}
                onChange={(e) => setNumbers(e.target.checked)}
              />
              number
            </label>
            <label className="block">
              <input
                type="checkbox"
                checked={symbols}
                onChange={(e) => setSymbols(e.target.checked)}
              />
              symbols
            </label>
          </div>
        </div>
        <div>
          <div className="flex justify-start items-end">
            <label className="block">length</label>
            <input
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
              className="border border-gray-300 px-2 py-1 rounded focus:outline-none bg-transparent"
            />
          </div>
        </div>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description (optional)"
          className="border border-gray-300 px-2 py-1 rounded bg-transparent"
        />
        <button
          type="submit"
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!username || !password || !url}
        >
          Add credential
        </button>
      </div>
    </form>
  );
};
