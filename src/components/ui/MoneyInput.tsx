type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function MoneyInput({ label, value, onChange }: Props) {
  return (
    <label>
      {label}
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </label>
  );
}
