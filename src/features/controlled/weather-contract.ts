import { z } from "zod";

export const weatherInputSchema = z.object({
  city: z.string().trim().min(1),
  unit: z.enum(["celsius", "fahrenheit"]),
});

export const weatherOutputSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  unit: z.enum(["celsius", "fahrenheit"]),
  condition: z.string(),
  humidity: z.number().int().min(0).max(100),
  windKph: z.number().nonnegative(),
  riding: z.object({
    rating: z.enum(["good", "fair", "poor"]),
    summary: z.string(),
  }),
});

export type WeatherInput = z.infer<typeof weatherInputSchema>;
export type WeatherOutput = z.infer<typeof weatherOutputSchema>;
