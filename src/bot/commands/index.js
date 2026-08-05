import ban from "./moderation/ban.js";
import kick from "./moderation/kick.js";
import mute from "./moderation/mute.js";
import warn from "./moderation/warn.js";
import warnings from "./moderation/warnings.js";

import eightball from "./fun/8ball.js";
import coinflip from "./fun/coinflip.js";
import piada from "./fun/piada.js";
import escolher from "./fun/escolher.js";

import rank from "./xp/rank.js";
import leaderboard from "./xp/leaderboard.js";

import custom from "./custom.js";
import setguild from "./setguild.js";

export const commands = [
  ban,
  kick,
  mute,
  warn,
  warnings,
  eightball,
  coinflip,
  piada,
  escolher,
  rank,
  leaderboard,
  custom,
  setguild,
];
