import { useLang } from "../LangContext.jsx";
import { SEGMENTS } from "../segments.js";

// The one bold element: a sack filling up, one coloured segment per farmer.
// The hatched part is what is still missing.
export default function PoolMeter({ pool }) {
  const { fmt } = useLang();
  const s = pool.summary;
  if (s.demandKg <= 0) return null;
  return (
    <div className="pool-meter" role="img" aria-label={`${fmt.kg(s.filledKg)} / ${fmt.kg(s.demandKg)}`}>
      {pool.allocations.map((a, i) => {
        const pct = (a.qtyKg / s.demandKg) * 100;
        const color = SEGMENTS[i % SEGMENTS.length];
        return (
          <div
            key={a.listingId}
            className="seg"
            style={{ flex: `0 0 ${pct}%`, background: color.bg, color: color.fg }}
            title={`${a.farmerName}: ${fmt.kg(a.qtyKg)}`}
          >
            {pct >= 14 ? fmt.kg(a.qtyKg) : ""}
          </div>
        );
      })}
    </div>
  );
}
