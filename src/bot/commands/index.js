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

import avatar from "./misc/avatar.js";
import serverinfo from "./misc/serverinfo.js";

import enquete from "./community/enquete.js";
import sugestao from "./community/sugestao.js";

import saldo from "./economy/saldo.js";
import diario from "./economy/diario.js";
import transferir from "./economy/transferir.js";

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
  avatar,
  serverinfo,
  enquete,
  sugestao,
  saldo,
  diario,
  transferir,
];
