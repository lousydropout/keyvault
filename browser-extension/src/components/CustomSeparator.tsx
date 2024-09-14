export const CustomSeparator = ({ text }: { text: string }) => {
  return (
    <div className="flex items-center my-8">
      <div className="flex-grow h-px bg-gray-300"></div>
      <span className="mx-4 text-gray-500 text-xl">{text}</span>
      <div className="flex-grow h-px bg-gray-300"></div>
    </div>
  );
};
