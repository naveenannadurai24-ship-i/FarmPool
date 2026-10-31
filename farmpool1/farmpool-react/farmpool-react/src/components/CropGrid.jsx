import { CROP_EMOJI } from "../i18n.js";
import { useAppData } from "../AppData.jsx";
import { useLang } from "../LangContext.jsx";

// Big picture tiles: choose a crop without having to read.
export default function CropGrid({ id, value, onChange }) {
  const { meta } = useAppData();
  const { cropName } = useLang();
  return (
    <div className="crop-grid" id={id}>
      {meta?.crops.map((c) => (
        <button
          key={c}
          type="button"
          className={`crop-tile${value === c ? " on" : ""}`}
          data-crop={c}
          aria-pressed={value === c}
          onClick={() => onChange(c)}
        >
          <span className="emo" aria-hidden="true">{CROP_EMOJI[c] || "🌱"}</span>
          <span className="nm">{cropName(c)}</span>
        </button>
      ))}
    </div>
  );
}
