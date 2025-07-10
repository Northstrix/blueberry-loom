"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

const cn = (...args: any[]) => twMerge(clsx(args));

export interface DraggableItemProps {
  id: string;
  content: React.JSX.Element;
}
export interface DraggableListProps {
  items: DraggableItemProps[];
  onChange?: (items: DraggableItemProps[]) => void;
  className?: string;
  gap?: string | number; // Accepts Tailwind gap class or px value
}

export const DraggableList: React.FC<DraggableListProps> = ({
  items,
  onChange,
  className,
  gap = "22px", // Default gap
}) => {
  const [draggedItem, setDraggedItem] = React.useState<DraggableItemProps | null>(null);
  const [dragOverItemId, setDragOverItemId] = React.useState<string | number | null>(null);

  // No local state for items: always use props.items for instant sync

  const handleDragStart = (item: DraggableItemProps) => setDraggedItem(item);
  const handleDragOver = (e: React.DragEvent, itemId: string | number) => {
    e.preventDefault();
    setDragOverItemId(itemId);
  };
  const handleDragEnd = () => {
    if (!draggedItem || dragOverItemId == null) {
      setDraggedItem(null);
      setDragOverItemId(null);
      return;
    }
    const fromIndex = items.findIndex((i) => i.id === draggedItem.id);
    const toIndex = items.findIndex((i) => i.id === dragOverItemId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      setDraggedItem(null);
      setDragOverItemId(null);
      return;
    }
    const newItems = [...items];
    newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, draggedItem);
    onChange?.(newItems);
    setDraggedItem(null);
    setDragOverItemId(null);
  };

  // Determine gap style: if tailwind class, use it; if px, use inline style
  let gapClass = "";
  let gapStyle: React.CSSProperties = {};
  if (typeof gap === "string" && gap.startsWith("gap-")) {
    gapClass = gap;
  } else if (typeof gap === "number" || (typeof gap === "string" && gap.endsWith("px"))) {
    gapStyle.gap = typeof gap === "number" ? `${gap}px` : gap;
  } else {
    gapStyle.gap = gap;
  }

  return (
    <div className={cn("flex flex-col", gapClass, className)} style={gapStyle}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            draggable
            onDragStart={() => handleDragStart(item)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "cursor-grab rounded-lg border bg-background border-[var(--lightened-background-adjacent-color)] transition-colors",
              dragOverItemId === item.id && "border-1 border-[var(--theme-color)]",
              draggedItem?.id === item.id && "border-1 border-[var(--subtle-color)] opacity-50"
            )}
            style={{
              borderRadius: "var(--general-rounding)",
              background:
                dragOverItemId === item.id
                  ? "var(--background)"
                  : "var(--card-background)",
              transition: "background 0.2s, border 0.2s",
              marginBottom: 0,
              padding: 0, // No extra padding, let child control
            }}
          >
            {item.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
