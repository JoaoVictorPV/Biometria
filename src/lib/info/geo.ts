export type PlaceKey = "curitiba" | "pontal" | "ilha_do_mel" | "brava_itajai" | "rosa";

export const PLACES: Record<PlaceKey, { name: string; lat: number; lon: number }> = {
  curitiba: { name: "Curitiba", lat: -25.4284, lon: -49.2733 },
  pontal: { name: "Pontal do Paraná", lat: -25.6747, lon: -48.5116 },
  ilha_do_mel: { name: "Ilha do Mel", lat: -25.544, lon: -48.326 },
  brava_itajai: { name: "Praia Brava (Itajaí)", lat: -26.9203, lon: -48.6309 },
  rosa: { name: "Praia do Rosa", lat: -28.1306, lon: -48.6426 },
};
