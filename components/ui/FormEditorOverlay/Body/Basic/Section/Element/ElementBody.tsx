"use client";
import React from "react";
import type { SectionElement } from "@/types/formBuilder";
import { DraggableList } from "@/components/ui/DraggableList/DraggableList";
import TextElementContainer from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Container/Text/ElementContainer";
import InputElementContainer from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Container/Input/ElementContainer";
import TextareaElementContainer from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Container/Textarea/ElementContainer";
import CheckboxesElementContainer from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Container/Checkboxes/ElementContainer";
import RadioElementContainer from "@/components/ui/FormEditorOverlay/Body/Basic/Section/Element/Container/Radio/ElementContainer";

interface Props {
  section: { elements: SectionElement[] };
  sectionIdx: number;
  onElementChange: (newElements: SectionElement[]) => void;
  onRemoveElement: (eIdx: number) => void;
  generateUniqueOptionId: () => string;
}

function getElementId(el: SectionElement, idx: number) {
  return "key" in el && el.key ? el.key : `el${idx}`;
}

export default function ElementBody({
  section,
  sectionIdx,
  onElementChange,
  onRemoveElement,
  generateUniqueOptionId,
}: Props) {
  const elementDraggableItems = section.elements.map((el, eIdx) => ({
    id: getElementId(el, eIdx),
    content: (() => {
      switch (el.type) {
        case "text":
          return (
            <div className="m-[16px]">
              <TextElementContainer
                element={el}
                onChange={(newEl) => {
                  const newElements = section.elements.slice();
                  newElements[eIdx] = newEl;
                  onElementChange(newElements);
                }}
                onRemove={() => onRemoveElement(eIdx)}
              />
            </div>
          );
        case "input":
          return (
            <InputElementContainer
              element={el}
              onChange={(newEl) => {
                const newElements = section.elements.slice();
                newElements[eIdx] = newEl;
                onElementChange(newElements);
              }}
              onRemove={() => onRemoveElement(eIdx)}
            />
          );
        case "textarea":
          return (
            <TextareaElementContainer
              element={el}
              onChange={(newEl) => {
                const newElements = section.elements.slice();
                newElements[eIdx] = newEl;
                onElementChange(newElements);
              }}
              onRemove={() => onRemoveElement(eIdx)}
            />
          );
        case "checkboxes":
          return (
            <CheckboxesElementContainer
              element={el}
              onChange={(newEl) => {
                const newElements = section.elements.slice();
                newElements[eIdx] = newEl;
                onElementChange(newElements);
              }}
              onRemove={() => onRemoveElement(eIdx)}
              generateUniqueOptionId={generateUniqueOptionId}
            />
          );
        case "radio":
          return (
            <RadioElementContainer
              element={el}
              onChange={(newEl) => {
                const newElements = section.elements.slice();
                newElements[eIdx] = newEl;
                onElementChange(newElements);
              }}
              onRemove={() => onRemoveElement(eIdx)}
              generateUniqueOptionId={generateUniqueOptionId}
            />
          );
        default:
          return null;
      }
    })(),
  }));

  return (
    <DraggableList
      items={elementDraggableItems}
      gap={16}
      onChange={(newItems) => {
        const idToElement = new Map(
          section.elements.map((el, idx) => [getElementId(el, idx), el])
        );
        const newElements = newItems.map((item) => idToElement.get(item.id)!);
        onElementChange(newElements);
      }}
    />
  );
}
