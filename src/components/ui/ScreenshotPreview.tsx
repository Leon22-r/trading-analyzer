import type { ScreenshotAsset } from "@/lib/tradeTypes";

type Props = {
  label: string;
  asset: ScreenshotAsset | null;
};

export function ScreenshotPreview({ label, asset }: Props) {
  return (
    <div className="screenshot-preview">
      <span>{label}</span>
      {asset ? (
        <img src={asset.dataUrl} alt={`${label} trade screenshot`} />
      ) : (
        <em>No image</em>
      )}
    </div>
  );
}
