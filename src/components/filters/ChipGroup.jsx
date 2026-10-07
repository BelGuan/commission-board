import { FilterChip } from '../ui/FilterChip'

export function ChipGroup({ options, selected = [], onToggle, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <FilterChip
          key={option.id}
          label={option.label}
          checked={selected.includes(option.id)}
          disabled={disabled}
          onChange={() => onToggle(option.id)}
        />
      ))}
    </div>
  )
}

export default ChipGroup
