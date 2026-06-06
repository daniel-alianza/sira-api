import { stripFormalAddressFromViewerName } from './strip-formal-address-from-text.helper';

interface ViewerAddressInput {
  readonly fullName: string;
}

export interface ViewerAddress {
  readonly firstName: string;
  readonly greeting: string;
}

export function buildViewerAddress(input: ViewerAddressInput): ViewerAddress {
  const normalizedName = stripFormalAddressFromViewerName(input.fullName);
  const firstName =
    normalizedName.split(/\s+/)[0]?.trim() || normalizedName || input.fullName;

  return { firstName, greeting: firstName };
}
