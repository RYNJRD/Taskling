export type AchievementDefinition = {
  code: string;
  title: string;
  description: string;
  emoji: string;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    code: "first_steps",
    title: "First Steps",
    description: "Complete your first chore.",
    emoji: "🌟",
  },
  {
    code: "helper_10",
    title: "Helping Hand",
    description: "Complete 10 chores.",
    emoji: "🙌",
  },
  {
    code: "streak_7",
    title: "On A Roll",
    description: "Reach a 7-day streak.",
    emoji: "🔥",
  },
  {
    code: "streak_30",
    title: "Streak Superstar",
    description: "Reach a 30-day streak.",
    emoji: "🏆",
  },
  {
    code: "reward_redeemer",
    title: "Treat Time",
    description: "Claim your first reward.",
    emoji: "🎁",
  },
  {
    code: "team_player",
    title: "Team Player",
    description: "Finish three shared chores.",
    emoji: "🤝",
  },
];

export function getAchievementDefinition(code: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.code === code);
}
