import { useEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";

type SelectProps = {
  items: string[];
  label: string;
  emptyMessage: string;
  onSelect: (item: string) => void;
  onCancel: () => void;
};

export function Select({
  items,
  label,
  emptyMessage,
  onSelect,
  onCancel,
}: SelectProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);

  const selectIndex = (nextIndex: number) => {
    selectedIndexRef.current = nextIndex;
    setSelectedIndex(nextIndex);
  };

  useEffect(() => {
    if (items.length === 0) {
      selectIndex(0);
      return;
    }

    if (selectedIndexRef.current >= items.length) {
      selectIndex(items.length - 1);
    }
  }, [items.length]);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      onCancel();
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (key.upArrow) {
      const nextIndex =
        selectedIndexRef.current === 0
          ? items.length - 1
          : selectedIndexRef.current - 1;
      selectIndex(nextIndex);
      return;
    }

    if (key.downArrow) {
      const nextIndex =
        selectedIndexRef.current === items.length - 1
          ? 0
          : selectedIndexRef.current + 1;
      selectIndex(nextIndex);
      return;
    }

    if (key.return) {
      const selectedItem = items[selectedIndexRef.current];

      if (selectedItem !== undefined) {
        onSelect(selectedItem);
      }
    }
  });

  if (items.length === 0) {
    return <Text>{emptyMessage}</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text dimColor>{label}</Text>
      {items.map((item, index) => {
        const selected = index === selectedIndex;

        return (
          <Text key={item} color={selected ? "green" : undefined}>
            {selected ? "> " : "  "}
            {item}
          </Text>
        );
      })}
    </Box>
  );
}
