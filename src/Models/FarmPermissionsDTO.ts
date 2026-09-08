export interface FarmPermissionsDTO {
  /** W3 @CanManageFarm capability for this specific farm. */
  canOperateFarm: boolean;
  /** W3 @FarmOwnerOnly capability for this specific farm. */
  canAdministerFarm: boolean;
}
