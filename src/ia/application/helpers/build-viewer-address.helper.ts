interface ViewerAddressInput {
  readonly fullName: string;
}

export interface ViewerAddress {
  readonly firstName: string;
  readonly treatment: 'Señor' | 'Señorita';
  readonly greeting: string;
}

export function buildViewerAddress(input: ViewerAddressInput): ViewerAddress {
  const firstName = input.fullName.trim().split(/\s+/)[0] ?? input.fullName;
  const treatment = resolveTreatment(firstName);
  const greeting = `${treatment} ${firstName}`;

  return { firstName, treatment, greeting };
}

function resolveTreatment(firstName: string): 'Señor' | 'Señorita' {
  const normalized = firstName.trim().toLowerCase();
  const feminineNames = new Set([
    'maria',
    'maría',
    'ana',
    'lucia',
    'lucía',
    'gabriela',
    'patricia',
    'claudia',
    'fernanda',
    'daniela',
    'andrea',
    'paola',
    'sandra',
    'lorena',
    'veronica',
    'verónica',
    'monica',
    'mónica',
  ]);

  if (feminineNames.has(normalized) || normalized.endsWith('a')) {
    return 'Señorita';
  }

  return 'Señor';
}
