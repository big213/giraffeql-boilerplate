import { Kenum } from "../core/helpers/enum";

export class actionTypeKenum extends Kenum {
  static readonly ECHO = new actionTypeKenum("ECHO", 1);
}
