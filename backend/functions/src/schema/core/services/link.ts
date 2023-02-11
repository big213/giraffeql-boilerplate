import { linkDefs } from "../../links";
import { ServicesObjectMap } from "../generators/link";
import { PaginatedService } from "./paginated";

export class LinkService extends PaginatedService {
  // must be set via generateLinkTypeDef
  servicesObjectMap!: ServicesObjectMap;

  constructor(name?: string) {
    super(name);

    // register linkDef
    linkDefs.set(this.typename, this);
  }
}
