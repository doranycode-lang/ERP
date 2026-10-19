import { useGetSettings } from "@workspace/api-client-react";

export function useFormatCurrency() {
  const { data: settings } = useGetSettings();
  const currency = settings?.currency ?? "AOA";
  return (val: number) =>
    new Intl.NumberFormat("pt-AO", { style: "currency", currency }).format(val);
}
