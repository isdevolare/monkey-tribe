import {
  FESTIVAL_PROFILE_SKINS,
  getCosmeticAppearance,
  getProfileMonkey
} from "../../game/config/profileMonkeys";
import { t } from "../../game/i18n";
import { useGameStore } from "../../game/state/gameStore";
import type { Lang } from "../../game/types/game";
import { CosmeticChestOpeningModal } from "./CosmeticChestOpeningModal";
import { RARITY_THEME } from "./MonkeyCollectionModal";

/**
 * Global Festival Chest opening/claim flow. Rendered once at screen level so
 * the reveal animation, chest sound and pending-transaction recovery work no
 * matter where the chest was purchased (Shop hub) or whether the Profile is
 * open. Presentation-only: state changes go through the existing store
 * actions (claimFestivalChest / equipProfileSkin).
 */
export function FestivalChestFlow({ lang }: { lang: Lang }) {
  const pendingFestivalChest = useGameStore((state) => state.pendingFestivalChest);
  const unlocked = useGameStore((state) => state.unlockedProfileMonkeys);
  const equipSkin = useGameStore((state) => state.equipProfileSkin);
  const claimFestivalChest = useGameStore((state) => state.claimFestivalChest);

  const pendingFestivalSkin = pendingFestivalChest
    ? FESTIVAL_PROFILE_SKINS.find((skin) => skin.id === pendingFestivalChest.skinId)
    : undefined;
  const pendingFestivalParent = pendingFestivalSkin
    ? getProfileMonkey(pendingFestivalSkin.monkeyId)
    : undefined;
  const presentation = pendingFestivalChest && pendingFestivalSkin
    ? {
        id: pendingFestivalChest.id,
        title: t("festival.chest.name", lang),
        rewardName: t(pendingFestivalSkin.nameKey, lang),
        rewardAsset: getCosmeticAppearance(pendingFestivalSkin.monkeyId, pendingFestivalSkin.id).portraitAsset,
        rarity: pendingFestivalSkin.rarity,
        accent: RARITY_THEME[pendingFestivalSkin.rarity].border,
        glow: pendingFestivalSkin.presentationGlow ?? RARITY_THEME[pendingFestivalSkin.rarity].glow,
        fragments: pendingFestivalChest.fragments,
        previousFragments: pendingFestivalChest.previousFragments,
        nextFragments: pendingFestivalChest.nextFragments,
        requiredFragments: pendingFestivalChest.requiredFragments,
        unlocked: pendingFestivalChest.unlocked,
        parentName: pendingFestivalParent ? t(pendingFestivalParent.nameKey, lang) : "",
        parentOwned: pendingFestivalSkin ? unlocked.includes(pendingFestivalSkin.monkeyId) : false
      }
    : null;

  return (
    <CosmeticChestOpeningModal
      presentation={presentation}
      lang={lang}
      onEquip={() => {
        if (!pendingFestivalChest || !pendingFestivalSkin) return;
        equipSkin(pendingFestivalSkin.id);
        claimFestivalChest(pendingFestivalChest.id);
      }}
      onClose={() => {
        if (pendingFestivalChest) claimFestivalChest(pendingFestivalChest.id);
      }}
    />
  );
}
