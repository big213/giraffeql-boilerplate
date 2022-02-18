import { AccessControlMap, ServiceFunctionInputs } from "../../../types";
import { BaseService } from "../../core/services";
import { permissionsCheck } from "../../core/helpers/permissions";

export class AdminService extends BaseService {
  accessControl: AccessControlMap = {};

  @permissionsCheck("admin")
  async executeAdminFunction({
    req,
    fieldPath,
    args,
    query,
    isAdmin = false,
  }: ServiceFunctionInputs) {
    const validatedArgs = <any>args;

    return "done";
  }
}
