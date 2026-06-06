const LEADING_FORMAL_ADDRESS_PATTERN =
  /^(?:(?:estimad[oa]\s+)?(?:señoría|señor|señora|señorita)(?:\s+[a-záéíóúñ]+)?[,:\s-]+)+/iu;

const INLINE_FORMAL_ADDRESS_PATTERN =
  /\b(?:señoría|señor|señora|señorita)\s+[a-záéíóúñ]+[,]?\s*/giu;

function capitalizeFirstLetter(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

export function stripFormalAddressFromText(text: string): string {
  let result = text.trim().replace(INLINE_FORMAL_ADDRESS_PATTERN, '');

  while (LEADING_FORMAL_ADDRESS_PATTERN.test(result)) {
    result = result.replace(LEADING_FORMAL_ADDRESS_PATTERN, '').trim();
  }

  result = result.replace(/\s{2,}/g, ' ').trim();

  if (result.length === 0) {
    return text.trim();
  }

  return capitalizeFirstLetter(result);
}

export function stripFormalAddressFromViewerName(fullName: string): string {
  return fullName
    .trim()
    .replace(/^(?:señoría|señor|señora|señorita)\s+/iu, '')
    .trim();
}
