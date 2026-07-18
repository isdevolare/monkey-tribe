import type { GameAssetKey } from "./gameAssets";

const decodedAssets = new Set<GameAssetKey>();
const failedAssets = new Set<GameAssetKey>();

export function markGameAssetDecoded(assetKey: GameAssetKey) {
  decodedAssets.add(assetKey);
  failedAssets.delete(assetKey);
}

export function markGameAssetFailed(assetKey: GameAssetKey) {
  if (!decodedAssets.has(assetKey)) failedAssets.add(assetKey);
}

export function isGameAssetDecoded(assetKey: GameAssetKey) {
  return decodedAssets.has(assetKey);
}

export function isGameAssetFailed(assetKey: GameAssetKey) {
  return failedAssets.has(assetKey);
}

export function areGameAssetsSettled(assetKeys: readonly GameAssetKey[]) {
  return assetKeys.every((assetKey) => decodedAssets.has(assetKey) || failedAssets.has(assetKey));
}
