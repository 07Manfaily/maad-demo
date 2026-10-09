// Palette baoulé de la démo MAAD (identique au back-office).
export const C = {
  ebene: '#1B1612',
  ebene2: '#2A221C',
  iroko: '#6B3F1F',
  irokoLight: '#9A6236',
  or: '#C9962B',
  orLight: '#E2B85A',
  orSoft: '#F6EAD0',
  terre: '#B5532A',
  terreSoft: '#F8E3D8',
  indigo: '#1F3A5F',
  indigoSoft: '#E1E8F1',
  vert: '#4E7A3A',
  vertSoft: '#E3EEDB',
  kaolin: '#F5EFE4',
  bg: '#F7F2EA',
  surface: '#FFFDF9',
  line: '#ECE3D4',
  text: '#1B1612',
  muted: '#7A6C5D',
}

export const R = 18

export const shadow = {
  shadowColor: '#2B1C0F',
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
}

// Opérateurs Mobile Money (paiement simulé dans la démo).
export const OPERATORS = [
  {
    id: 'wave',
    name: 'Wave',
    label: 'Wave',
    color: '#1DC8FF',
    ink: '#06283D',
    short: 'W',
    hint: 'Confirmation dans l’application Wave',
    usesPin: false,
  },
  {
    id: 'orange',
    name: 'Orange Money',
    label: 'Orange',
    color: '#FF7900',
    ink: '#FFFFFF',
    short: 'OM',
    hint: 'Validation avec votre code secret Orange Money',
    usesPin: true,
    prefix: '07',
  },
  {
    id: 'mtn',
    name: 'MTN MoMo',
    label: 'MTN',
    color: '#FFCC00',
    ink: '#1B1612',
    short: 'MoMo',
    hint: 'Validation avec votre code secret MoMo',
    usesPin: true,
    prefix: '05',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    label: 'Moov',
    color: '#0066B3',
    ink: '#FFFFFF',
    short: 'Moov',
    hint: 'Validation avec votre code secret Moov Money',
    usesPin: true,
    prefix: '01',
  },
]

export const GUICHET = { id: 'guichet', name: 'Guichet MAAD', color: C.iroko, ink: '#FFFFFF', short: 'MAAD' }

export const operatorById = (id) => OPERATORS.find((o) => o.id === id) || GUICHET
