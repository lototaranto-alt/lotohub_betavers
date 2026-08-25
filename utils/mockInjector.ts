// utils/mockInjector.ts

/**
 * MOCK INJECTOR DISATTIVATO - Zero Debito Tecnico
 * Questa funzione ora fa da semplice pass-through.
 */

export const injectPoisMock = (poiData: any[]) => {
  if (!poiData || !Array.isArray(poiData)) return [];
  return poiData;
};
