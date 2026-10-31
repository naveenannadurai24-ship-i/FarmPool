import { useLang } from "../LangContext.jsx";
import { SEGMENTS } from "../segments.js";

export default function AllocationTable({ pool }) {
  const { t, fmt, townName } = useLang();
  const s = pool.summary;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("th.farmer")}</th>
            <th className="num">{t("th.distance")}</th>
            <th className="num">{t("th.sells")}</th>
            <th className="num">{t("th.lot")}</th>
            <th className="num">{t("th.payout")}</th>
          </tr>
        </thead>
        <tbody>
          {pool.allocations.map((a, i) => {
            const ofLot = a.listingRemainingKg > 0 ? Math.round((a.qtyKg / a.listingRemainingKg) * 100) : 0;
            return (
              <tr key={a.listingId}>
                <td>
                  <span className="dot" style={{ background: SEGMENTS[i % SEGMENTS.length].bg }} />
                  {a.farmerName}
                  <span className="sub">{townName(a.village)}</span>
                </td>
                <td className="num">{fmt.num(a.distanceKm)} {t("unit.km")}</td>
                <td className="num">{fmt.kg(a.qtyKg)}</td>
                <td className="num">{t("td.ofLot", { pct: ofLot })}</td>
                <td className="num">{fmt.inr(a.payout)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>{t("tf.farmers", { n: s.farmersCount })}</td>
            <td className="num">{t("tf.avg", { km: fmt.num(s.avgDistanceKm) })}</td>
            <td className="num">{fmt.kg(s.filledKg)}</td>
            <td />
            <td className="num">{fmt.inr(s.totalValue)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
