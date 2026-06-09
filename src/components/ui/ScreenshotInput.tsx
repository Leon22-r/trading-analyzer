import type { ChangeEvent } from "react";
import type { ScreenshotAsset } from "@/lib/tradeTypes";

type Props = {
  label: string;
  asset: ScreenshotAsset | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function ScreenshotInput({ label, asset, onChange }: Props) {
  return (
    <label className="screenshot-input">
      {label}
      <input type="file" accept="image/*" onChange={onChange} />
      {asset ? (
        <img src={asset.dataUrl} alt={`${label} preview`} />
      ) : (
        <span>No image</span>
      )}
    </label>
  );
}
