import { linkDefs } from "../../links";
import { PaginatedService } from "./paginated";

export class LinkService extends PaginatedService {
  constructor(name?: string) {
    super(name);

    // register linkDef
    linkDefs.set(this.typename, this);
  }
}
