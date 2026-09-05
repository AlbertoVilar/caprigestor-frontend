const BIRTH_REGISTRATION_PATTERN = /^(?=.{10,12}$)[0-9]+[A-Z]?$/;

export const normalizeBirthRegistration = (registrationNumber: string): string =>
  registrationNumber.trim().toUpperCase();

export const hasValidBirthRegistrationFormat = (registrationNumber: string): boolean =>
  BIRTH_REGISTRATION_PATTERN.test(normalizeBirthRegistration(registrationNumber));

export const isValidBirthRegistrationForFarm = (
  registrationNumber: string,
  farmTod: string
): boolean => {
  const normalizedRegistration = normalizeBirthRegistration(registrationNumber);
  const normalizedTod = farmTod.trim();

  return /^\d{5}$/.test(normalizedTod)
    && hasValidBirthRegistrationFormat(normalizedRegistration)
    && normalizedRegistration.startsWith(normalizedTod);
};
