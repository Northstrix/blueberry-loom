'use client'
import React, { useState } from 'react'
import { LucideIcon } from 'lucide-react'
import { useIsRtl } from '@/hooks/useIsRtl'

export interface RadioOption {
  value: string
  label: string
  icon: LucideIcon
}
export interface RadioButtonProps {
  options: RadioOption[]
  onChange?: (value: string) => void
  value?: string
  defaultValue?: string
  gap?: string
  borderRadius?: string
}

export default function RadioButton({
  options,
  onChange,
  value,
  defaultValue = options[0]?.value,
  gap = '14px',
  borderRadius = 'var(--general-rounding)',
}: RadioButtonProps) {
  const isRTL = useIsRtl()
  const [internalValue, setInternalValue] = useState(defaultValue)
  const activeTab = value !== undefined ? value : internalValue
  const [hovered, setHovered] = useState<string | null>(null)
  const handleChange = (newValue: string) => {
    if (value === undefined) setInternalValue(newValue)
    onChange?.(newValue)
  }
  const getButtonStyle = (optionValue: string): React.CSSProperties => {
    const isActive = activeTab === optionValue
    const isHovered = hovered === optionValue
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 12px',
      height: '39px',
      border: isActive
        ? 'none'
        : `1px solid var(--lightened-background-adjacent-color)`,
      borderRadius: borderRadius,
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer',
      outline: 'none',
      userSelect: 'none' as React.CSSProperties['userSelect'],
      margin: 0,
      background: isActive
        ? 'var(--theme-color)'
        : isHovered
        ? 'var(--lightened-background-adjacent-color)'
        : 'transparent',
      color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
      flex: 1,
      justifyContent: 'center',
      transition: 'background 0.2s, color 0.2s, border 0.2s'
    }
  }
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginBottom: 0,
      marginTop: '18px',
      gap: gap
    }}>
      {options.map((option) => {
        const isActive = activeTab === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            onClick={() => handleChange(option.value)}
            onMouseEnter={() => setHovered(option.value)}
            onMouseLeave={() => setHovered(null)}
            style={getButtonStyle(option.value)}
          >
            {isRTL ? (
              <>
                <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>{option.label}</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent'
                }}>
                  <option.icon
                    color={isActive ? 'var(--foreground)' : 'var(--muted-foreground)'}
                    size={18}
                    strokeWidth={2}
                  />
                </span>
              </>
            ) : (
              <>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent'
                }}>
                  <option.icon
                    color={isActive ? 'var(--foreground)' : 'var(--muted-foreground)'}
                    size={18}
                    strokeWidth={2}
                  />
                </span>
                <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>{option.label}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
