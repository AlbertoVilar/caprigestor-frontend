import { getApiErrorMessage, type ParsedApiError } from "../../utils/apiError";

const CANONICAL_OWNERSHIP_DENIAL = "ownership canônico inequívoco";

const LACTATION_OWNERSHIP_ERROR_MESSAGE =
  "Não é possível realizar esta operação nessa data porque a fazenda não possui ownership canônico inequívoco durante todo o dia informado.";

export const getLactationErrorMessage = (parsed: ParsedApiError): string => {
  const isCanonicalOwnershipDenial =
    parsed.status === 403 &&
    parsed.fieldErrors?.some(
      ({ fieldName, message }) =>
        fieldName === "auth" &&
        message.toLocaleLowerCase().includes(CANONICAL_OWNERSHIP_DENIAL)
    );

  return isCanonicalOwnershipDenial
    ? LACTATION_OWNERSHIP_ERROR_MESSAGE
    : getApiErrorMessage(parsed);
};
