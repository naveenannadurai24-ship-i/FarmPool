const QUICK_ADD = [10, 50, 100, 500];

// A number box plus +10 / +50 / +100 / +500 buttons, to save typing on a phone.
export default function QuantityField({ id, label, value, onChange }) {
  return (
    <div className="field full">
      <label className="field-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        name="quantityKg"
        type="number"
        inputMode="decimal"
        min="1"
        step="0.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="chips">
        {QUICK_ADD.map((n) => (
          <button key={n} type="button" data-add={n} onClick={() => onChange(String((Number(value) || 0) + n))}>+{n}</button>
        ))}
      </div>
    </div>
  );
}
