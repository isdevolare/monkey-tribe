export const theme = {
  colors: {
    jungle: "#234d35",
    canopy: "#2f7d42",
    grass: "#78c850",
    grassDark: "#5fac45",
    empty: "#9fd36a",
    banana: "#ffd95a",
    stone: "#9aa1a6",
    player: "#2fa866",
    playerDark: "#1f7047",
    enemy: "#c84a3a",
    enemyDark: "#7f2d25",
    ink: "#173022",
    paper: "#fff8d9",
    panel: "#f4e8b7",
    panelDark: "#dcc87d",
    white: "#ffffff"
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  fonts: {
    regular: "Baloo2_500Medium",
    bold: "Baloo2_700Bold",
    heavy: "Baloo2_800ExtraBold"
  },
  // Single type scale so numbers/labels feel consistent across the HUD.
  type: {
    display: 42,
    h1: 20,
    h2: 16,
    title: 15,
    body: 13,
    label: 12,
    small: 11,
    tiny: 10
  }
} as const;
