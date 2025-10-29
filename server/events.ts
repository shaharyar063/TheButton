import { EventEmitter } from "events";
import type { Link, Click } from "@shared/schema";

class AppEventEmitter extends EventEmitter {
  emitLinkCreated(link: Link) {
    this.emit("link:created", link);
  }

  emitClickCreated(click: Click) {
    this.emit("click:created", click);
  }
}

export const appEvents = new AppEventEmitter();
