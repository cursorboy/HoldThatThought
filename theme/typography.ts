import { TextStyle } from 'react-native';

export const typography = {
  appTitle: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 4,
  } as TextStyle,
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2,
  } as TextStyle,
  claim: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } as TextStyle,
  claimLarge: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  } as TextStyle,
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  } as TextStyle,
  statusHint: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  button: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  } as TextStyle,
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,
} as const;
