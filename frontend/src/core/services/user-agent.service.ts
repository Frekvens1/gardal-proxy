import {Injectable} from "@angular/core";

@Injectable()
export class UserAgentService {

  constructor() {

  }

  sm(): boolean {
    return this.checkMinSize(640);
  }

  md(): boolean {
    return this.checkMinSize(768);
  }

  lg(): boolean {
    return this.checkMinSize(1024);
  }

  xl(): boolean {
    return this.checkMinSize(1280);
  }

  xl2(): boolean {
    return this.checkMinSize(1536);
  }

  private checkMinSize(size: number): boolean {
    return window.matchMedia(`(min-width: ${size}px)`).matches;
  }
}
