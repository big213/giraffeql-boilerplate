import { BaseService, EnumPaginatorService } from ".";
import { ServiceFunctionInputs } from "../../../types";
import { generateEnumRootResolver } from "../helpers/rootResolver";
import { GiraffeqlRootResolverType } from "giraffeql";

export class EnumService extends BaseService {
  enum;
  paginator: EnumPaginatorService;
  rootResolvers: { [x: string]: GiraffeqlRootResolverType };

  constructor(currentEnum: any) {
    super(currentEnum.getName());

    this.enum = currentEnum;
    this.paginator = new EnumPaginatorService(this);

    this.rootResolvers = generateEnumRootResolver(this);
  }

  getAllRecords(inputs: ServiceFunctionInputs): (number | string)[] {
    return this.enum.values.map((ele) => ele.name);
  }
}
