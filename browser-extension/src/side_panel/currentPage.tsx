import { View } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useCurrentTab } from "@/hooks/useCurrentTab";
import { Dispatch, SetStateAction } from "react";

export const CurrentPage = ({
  setView,
}: {
  setView: Dispatch<SetStateAction<View>>;
}) => {
  const [_, currentUrl] = useCurrentTab();
  return (
    <>
      <h1>Current Page: {currentUrl}</h1>
      <Button onClick={() => setView("All Credentials")}>
        See all credentials
      </Button>
    </>
  );
};
