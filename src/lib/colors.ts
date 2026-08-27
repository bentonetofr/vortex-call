const AVATAR_COLORS = ["#f2c94c", "#7b6fc9", "#c9a06f", "#5fb3a3", "#e0708c", "#6fa8dc"];

export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
