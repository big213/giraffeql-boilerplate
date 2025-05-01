/* Start Scaffolding */
export type GetQuery<K extends keyof Root> = K extends never
  ? Partial<Record<K, Queryize<Root[keyof Root]>>>
  : Record<K, Queryize<Root[K]>>;

export type GetResponse<K extends keyof Root> = Responseize<Root[K]>;

export type GetType<T> = Responseize<Field<T, undefined>>

type Primitive = string | number | boolean | undefined | null;

type Field<T, K> = {
  Type: T;
  Args: K;
};

type Responseize<T> = T extends Field<infer Type, infer Args>
  ? Type extends never
    ? never
    : Type extends (infer U)[]
    ? { [P in keyof U]: Responseize<U[P]> }[]
    : { [P in keyof Type]: Responseize<Type[P]> }
  : never;

type Queryize<T> = T extends Field<infer Type, infer Args>
  ? Type extends never
    ? never
    : Type extends Primitive
    ? Args extends undefined // Args is undefined
      ? LookupValue
      : Args extends [infer Arg]
      ? LookupValue | { __args: Arg } // Args is a tuple
      : { __args: Args }
    : Type extends (infer U)[]
    ? Queryize<Field<U, Args>>
    : Args extends undefined // Args is undefined
    ? { [P in keyof Type]?: Queryize<Type[P]> }
    : Args extends [infer Arg]
    ? { [P in keyof Type]?: Queryize<Type[P]> } & {
        __args?: Arg;
      }
    : { [P in keyof Type]?: Queryize<Type[P]> } & { __args: Args }
  : never;
  
type LookupValue = true
type Edge<T> = {
  node: Field<T, undefined>;
  cursor: Field<string, undefined>;
};

export type FilterByField<T> = {
  eq?: T
  neq?: T
  gt?: T
  lt?: T
  gtornull?: T
  gte?: T
  lte?: T
  in?: T[]
  nin?: T[]
  regex?: Scalars['regex']
}

export type SortByField<T> = {
  field: T
  desc: boolean
}
/* End Scaffolding */

/* Start Types */
/**All Scalar values*/export type Scalars={/**String value*/"string":(string);/**Boolean value*/"boolean":(boolean);/**Numeric value*/"number":(number);/**Unknown value*/"unknown":(unknown);/**Numeric value >0*/"positiveNumber":(number);/**Numeric value <0*/"negativeNumber":(number);/**Numeric value >= 0*/"positiveNumberAndZero":(number);/**Numeric value <= 0*/"negativeNumberAndZero":(number);/**Image URL Field*/"imageUrl":(string);/**URL Field*/"url":(string);/**UNIX Timestamp (Seconds since Epoch Time)*/"unixTimestamp":(number);/**Date YYYY-MM-DD*/"date":(string);/**ID Field*/"id":(string);/**Regex Field*/"regex":(RegExp);/**Valid JSON*/"json":(unknown);/**Valid JSON as a string*/"jsonString":(string);/**Email Field*/"email":(string);/**Enum stored as a separate key value*/"userRole":("NONE"|"NORMAL"|"ADMIN"|"CUSTOM"|"MODERATOR");/**Enum stored as is*/"userPermission":("*"|"user/*"|"user/get"|"user/getPaginator"|"user/update"|"user/create"|"user/delete"|"file/getPaginator");"userSortByKey":("id"|"createdAt"|"updatedAt");"userGroupByKey":(undefined);"apiKeySortByKey":("id"|"createdAt"|"updatedAt");"apiKeyGroupByKey":(undefined);"fileSortByKey":("id"|"createdAt"|"updatedAt");"fileGroupByKey":(undefined);"userUserFollowLinkSortByKey":("createdAt");"userUserFollowLinkGroupByKey":(undefined);}
/**All Input types*/export type InputTypes={"user":{"id"?:(Scalars['id']);"email"?:(Scalars['string']);};"userSortByObject":(SortByField<Scalars['userSortByKey']>);"userFilterByField/id":(FilterByField<Scalars['id']>);"userFilterByField/createdBy.name":(FilterByField<Scalars['string']>);"userFilterByField/isPublic":(FilterByField<Scalars['boolean']>);"userFilterByField/role":(FilterByField<Scalars['userRole']>);"userFilterByObject":{"id"?:(InputTypes['userFilterByField/id']);"createdBy.name"?:(InputTypes['userFilterByField/createdBy.name']);"isPublic"?:(InputTypes['userFilterByField/isPublic']);"role"?:(InputTypes['userFilterByField/role']);};"userSearchObject":{"query":(Scalars['string']);};"userPaginatorInput":{"first"?:(Scalars['number']);"last"?:(Scalars['number']);"after"?:(Scalars['string']);"before"?:(Scalars['string']);"sortBy"?:(InputTypes['userSortByObject'])[];"filterBy"?:(InputTypes['userFilterByObject'])[];"groupBy"?:(Scalars['userGroupByKey'])[];"search"?:(InputTypes['userSearchObject']);};"createUserArgs":{"name":(Scalars['string']);"email":(Scalars['string']);"password":(Scalars['string']);"avatarUrl"?:(Scalars['imageUrl'])|null;"description"?:(Scalars['string'])|null;"role"?:(Scalars['userRole']);"permissions"?:(Scalars['userPermission'])[]|null;"isPublic"?:(Scalars['boolean']);"allowEmailNotifications"?:(Scalars['boolean']);};"updateUserArgs":{"name"?:(Scalars['string']);"email"?:(Scalars['string']);"password"?:(Scalars['string']);"avatarUrl"?:(Scalars['imageUrl'])|null;"description"?:(Scalars['string'])|null;"role"?:(Scalars['userRole']);"permissions"?:(Scalars['userPermission'])[]|null;"isPublic"?:(Scalars['boolean']);"allowEmailNotifications"?:(Scalars['boolean']);};"updateUser":{"item":(InputTypes['user']);"fields":(InputTypes['updateUserArgs']);};"userStatsInput":{"filterBy"?:(InputTypes['userFilterByObject'])[];"search"?:(InputTypes['userSearchObject']);};"apiKey":{"id"?:(Scalars['id']);};"apiKeySortByObject":(SortByField<Scalars['apiKeySortByKey']>);"apiKeyFilterByField/id":(FilterByField<Scalars['id']>);"apiKeyFilterByField/user.id":(FilterByField<Scalars['id']>);"apiKeyFilterByObject":{"id"?:(InputTypes['apiKeyFilterByField/id']);"user.id"?:(InputTypes['apiKeyFilterByField/user.id']);};"apiKeySearchObject":{"query":(Scalars['string']);};"apiKeyPaginatorInput":{"first"?:(Scalars['number']);"last"?:(Scalars['number']);"after"?:(Scalars['string']);"before"?:(Scalars['string']);"sortBy"?:(InputTypes['apiKeySortByObject'])[];"filterBy"?:(InputTypes['apiKeyFilterByObject'])[];"groupBy"?:(Scalars['apiKeyGroupByKey'])[];"search"?:(InputTypes['apiKeySearchObject']);};"createApiKeyArgs":{"name":(Scalars['string']);"user":(InputTypes['user']);"permissions"?:(Scalars['userPermission'])[]|null;};"updateApiKeyArgs":{"name"?:(Scalars['string']);"user"?:(InputTypes['user']);"permissions"?:(Scalars['userPermission'])[]|null;};"updateApiKey":{"item":(InputTypes['apiKey']);"fields":(InputTypes['updateApiKeyArgs']);};"file":{"id"?:(Scalars['id']);};"fileSortByObject":(SortByField<Scalars['fileSortByKey']>);"fileFilterByField/id":(FilterByField<Scalars['id']>);"fileFilterByField/createdBy.id":(FilterByField<Scalars['id']>);"fileFilterByField/parentKey":(FilterByField<Scalars['string']>);"fileFilterByObject":{"id"?:(InputTypes['fileFilterByField/id']);"createdBy.id"?:(InputTypes['fileFilterByField/createdBy.id']);"parentKey"?:(InputTypes['fileFilterByField/parentKey']);};"fileSearchObject":{"query":(Scalars['string']);};"filePaginatorInput":{"first"?:(Scalars['number']);"last"?:(Scalars['number']);"after"?:(Scalars['string']);"before"?:(Scalars['string']);"sortBy"?:(InputTypes['fileSortByObject'])[];"filterBy"?:(InputTypes['fileFilterByObject'])[];"groupBy"?:(Scalars['fileGroupByKey'])[];"search"?:(InputTypes['fileSearchObject']);};"createFileArgs":{"name":(Scalars['string']);"location":(Scalars['string']);"parentKey"?:(Scalars['string'])|null;};"updateFileArgs":{"name"?:(Scalars['string']);};"updateFile":{"item":(InputTypes['file']);"fields":(InputTypes['updateFileArgs']);};"fileStatsInput":{"filterBy"?:(InputTypes['fileFilterByObject'])[];"search"?:(InputTypes['fileSearchObject']);};"executeGoogleApiRequestInput":{"method":(Scalars['string']);"url":(Scalars['url']);"params"?:(Scalars['unknown'])|null;};/**Input object for getRepositoryReleases*/"getRepositoryReleases":{"first":(Scalars['positiveNumber']);};"userUserFollowLink":{"id"?:(Scalars['id']);};"userUserFollowLinkSortByObject":(SortByField<Scalars['userUserFollowLinkSortByKey']>);"userUserFollowLinkFilterByObject":{};"userUserFollowLinkPaginatorInput":{"first"?:(Scalars['number']);"last"?:(Scalars['number']);"after"?:(Scalars['string']);"before"?:(Scalars['string']);"sortBy"?:(InputTypes['userUserFollowLinkSortByObject'])[];"filterBy"?:(InputTypes['userUserFollowLinkFilterByObject'])[];"groupBy"?:(Scalars['userUserFollowLinkGroupByKey'])[];};"createUserUserFollowLinkArgs":{"user":(InputTypes['user']);"target":(InputTypes['user']);};"updateUserUserFollowLinkArgs":{"user"?:(InputTypes['user']);"target"?:(InputTypes['user']);};"updateUserUserFollowLink":{"item":(InputTypes['userUserFollowLink']);"fields":(InputTypes['updateUserUserFollowLinkArgs']);};}
/**All main types*/export type MainTypes={"userRole":{"Typename":("userRole");"Type":(GetType<UserRole>);};"userPermission":{"Typename":("userPermission");"Type":(GetType<UserPermission>);};"user":{"Typename":("user");"Type":(GetType<User>);};"apiKey":{"Typename":("apiKey");"Type":(GetType<ApiKey>);};"file":{"Typename":("file");"Type":(GetType<File>);};"userUserFollowLink":{"Typename":("userUserFollowLink");"Type":(GetType<UserUserFollowLink>);};"paginatorInfo":{"Typename":("paginatorInfo");"Type":(GetType<PaginatorInfo>);};"userEdge":{"Typename":("userEdge");"Type":(GetType<UserEdge>);};"userPaginator":{"Typename":("userPaginator");"Type":(GetType<UserPaginator>);};"StatsResponse":{"Typename":("StatsResponse");"Type":(GetType<StatsResponse>);};"apiKeyEdge":{"Typename":("apiKeyEdge");"Type":(GetType<ApiKeyEdge>);};"apiKeyPaginator":{"Typename":("apiKeyPaginator");"Type":(GetType<ApiKeyPaginator>);};"fileEdge":{"Typename":("fileEdge");"Type":(GetType<FileEdge>);};"filePaginator":{"Typename":("filePaginator");"Type":(GetType<FilePaginator>);};"userUserFollowLinkEdge":{"Typename":("userUserFollowLinkEdge");"Type":(GetType<UserUserFollowLinkEdge>);};"userUserFollowLinkPaginator":{"Typename":("userUserFollowLinkPaginator");"Type":(GetType<UserUserFollowLinkPaginator>);};}
/**EnumPaginator*/export type UserRole={"values":{"Type":(Scalars['userRole'])[];"Args":(undefined);};}
/**EnumPaginator*/export type UserPermission={"values":{"Type":(Scalars['userPermission'])[];"Args":(undefined);};}
/**User type*/export type User={/**The unique ID of the field*/"id":{"Type":(Scalars['id']);"Args":(undefined);};/**The typename of the record*/"__typename":{"Type":(Scalars['string']);"Args":(undefined);};"name":{"Type":(Scalars['string']);"Args":(undefined);};"firebaseUid":{"Type":(never);"Args":(undefined);};"email":{"Type":(Scalars['string']);"Args":(undefined);};"password":{"Type":(never);"Args":(undefined);};"avatarUrl":{"Type":(Scalars['imageUrl'])|null;"Args":(undefined);};"description":{"Type":(Scalars['string'])|null;"Args":(undefined);};"role":{"Type":(Scalars['userRole']);"Args":(undefined);};"permissions":{"Type":(Scalars['userPermission'])[]|null;"Args":(undefined);};"allPermissions":{"Type":(Scalars['userPermission'])[];"Args":(undefined);};"isPublic":{"Type":(Scalars['boolean']);"Args":(undefined);};"allowEmailNotifications":{"Type":(Scalars['boolean']);"Args":(undefined);};"currentUserFollowLink":{"Type":(UserUserFollowLink)|null;"Args":(undefined);};/**When the record was created*/"createdAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};/**When the record was last updated*/"updatedAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};"createdBy":{"Type":(User);"Args":(undefined);};}
/**Api key*/export type ApiKey={/**The unique ID of the field*/"id":{"Type":(Scalars['id']);"Args":(undefined);};/**The typename of the record*/"__typename":{"Type":(Scalars['string']);"Args":(undefined);};"name":{"Type":(Scalars['string']);"Args":(undefined);};"code":{"Type":(Scalars['string']);"Args":(undefined);};"user":{"Type":(User);"Args":(undefined);};"permissions":{"Type":(Scalars['userPermission'])[]|null;"Args":(undefined);};"allowedPermissions":{"Type":(Scalars['userPermission'])[];"Args":(undefined);};/**When the record was created*/"createdAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};/**When the record was last updated*/"updatedAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};"createdBy":{"Type":(User);"Args":(undefined);};}
/**File*/export type File={/**The unique ID of the field*/"id":{"Type":(Scalars['id']);"Args":(undefined);};/**The typename of the record*/"__typename":{"Type":(Scalars['string']);"Args":(undefined);};"name":{"Type":(Scalars['string']);"Args":(undefined);};"size":{"Type":(Scalars['number']);"Args":(undefined);};"location":{"Type":(Scalars['string']);"Args":(undefined);};"contentType":{"Type":(Scalars['string']);"Args":(undefined);};"servingUrl":{"Type":(Scalars['url']);"Args":(undefined);};"downloadUrl":{"Type":(Scalars['url']);"Args":(undefined);};"signedUrl":{"Type":(Scalars['url']);"Args":(undefined);};"parentKey":{"Type":(Scalars['string'])|null;"Args":(undefined);};/**When the record was created*/"createdAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};/**When the record was last updated*/"updatedAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};"createdBy":{"Type":(User);"Args":(undefined);};}
/**Link type*/export type UserUserFollowLink={/**The unique ID of the field*/"id":{"Type":(Scalars['id']);"Args":(undefined);};/**The typename of the record*/"__typename":{"Type":(Scalars['string']);"Args":(undefined);};"user":{"Type":(User);"Args":(undefined);};"target":{"Type":(User);"Args":(undefined);};/**When the record was created*/"createdAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};/**When the record was last updated*/"updatedAt":{"Type":(Scalars['unixTimestamp']);"Args":(undefined);};"createdBy":{"Type":(User);"Args":(undefined);};}
export type PaginatorInfo={"total":{"Type":(Scalars['number']);"Args":(undefined);};"count":{"Type":(Scalars['number']);"Args":(undefined);};"startCursor":{"Type":(Scalars['string'])|null;"Args":(undefined);};"endCursor":{"Type":(Scalars['string'])|null;"Args":(undefined);};}
export type UserEdge=(Edge<User>)
/**Paginator*/export type UserPaginator={"paginatorInfo":{"Type":(PaginatorInfo);"Args":(undefined);};"edges":{"Type":(UserEdge)[];"Args":(undefined);};}
export type StatsResponse={"count":{"Type":(Scalars['number']);"Args":(undefined);};}
export type ApiKeyEdge=(Edge<ApiKey>)
/**Paginator*/export type ApiKeyPaginator={"paginatorInfo":{"Type":(PaginatorInfo);"Args":(undefined);};"edges":{"Type":(ApiKeyEdge)[];"Args":(undefined);};}
export type FileEdge=(Edge<File>)
/**Paginator*/export type FilePaginator={"paginatorInfo":{"Type":(PaginatorInfo);"Args":(undefined);};"edges":{"Type":(FileEdge)[];"Args":(undefined);};}
export type UserUserFollowLinkEdge=(Edge<UserUserFollowLink>)
/**Paginator*/export type UserUserFollowLinkPaginator={"paginatorInfo":{"Type":(PaginatorInfo);"Args":(undefined);};"edges":{"Type":(UserUserFollowLinkEdge)[];"Args":(undefined);};}
/**All Root resolvers*/export type Root={"getUserRoleEnumPaginator":{"Type":(UserRole);"Args":(undefined);};"getUserPermissionEnumPaginator":{"Type":(UserPermission);"Args":(undefined);};"getCurrentUser":{"Type":(User);"Args":(undefined);};"syncCurrentUser":{"Type":(User);"Args":(undefined);};"getCurrentUserAvailablePermissions":{"Type":(Scalars['userPermission'])[];"Args":(undefined);};"getUser":{"Type":(User);"Args":(InputTypes['user']);};"getUserPaginator":{"Type":(UserPaginator);"Args":(InputTypes['userPaginatorInput']);};"deleteUser":{"Type":(User);"Args":(InputTypes['user']);};"createUser":{"Type":(User);"Args":(InputTypes['createUserArgs']);};"updateUser":{"Type":(User);"Args":(InputTypes['updateUser']);};"getUserStats":{"Type":(StatsResponse);"Args":(InputTypes['userStatsInput']);};"getApiKey":{"Type":(ApiKey);"Args":(InputTypes['apiKey']);};"getApiKeyPaginator":{"Type":(ApiKeyPaginator);"Args":(InputTypes['apiKeyPaginatorInput']);};"deleteApiKey":{"Type":(ApiKey);"Args":(InputTypes['apiKey']);};"createApiKey":{"Type":(ApiKey);"Args":(InputTypes['createApiKeyArgs']);};"updateApiKey":{"Type":(ApiKey);"Args":(InputTypes['updateApiKey']);};"getFile":{"Type":(File);"Args":(InputTypes['file']);};"getFilePaginator":{"Type":(FilePaginator);"Args":(InputTypes['filePaginatorInput']);};"deleteFile":{"Type":(File);"Args":(InputTypes['file']);};"createFile":{"Type":(File);"Args":(InputTypes['createFileArgs']);};"updateFile":{"Type":(File);"Args":(InputTypes['updateFile']);};"getFileStats":{"Type":(StatsResponse);"Args":(InputTypes['fileStatsInput']);};"executeGoogleApiRequest":{"Type":(Scalars['unknown'])|null;"Args":(InputTypes['executeGoogleApiRequestInput']);};"getRepositoryReleases":{"Type":(Scalars['unknown'])[];"Args":(InputTypes['getRepositoryReleases']);};"getRepositoryLatestVersion":{"Type":(Scalars['unknown'])|null;"Args":(undefined);};"getUserUserFollowLink":{"Type":(UserUserFollowLink);"Args":(InputTypes['userUserFollowLink']);};"getUserUserFollowLinkPaginator":{"Type":(UserUserFollowLinkPaginator);"Args":(InputTypes['userUserFollowLinkPaginatorInput']);};"deleteUserUserFollowLink":{"Type":(UserUserFollowLink);"Args":(InputTypes['userUserFollowLink']);};"createUserUserFollowLink":{"Type":(UserUserFollowLink);"Args":(InputTypes['createUserUserFollowLinkArgs']);};"updateUserUserFollowLink":{"Type":(UserUserFollowLink);"Args":(InputTypes['updateUserUserFollowLink']);};}

/* End Types */