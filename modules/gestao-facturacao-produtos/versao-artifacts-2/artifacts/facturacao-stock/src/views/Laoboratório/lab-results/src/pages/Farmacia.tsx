import { Session } from "../store/auth";
import FarmaciaSystem from "../farmsys/FarmaciaSystem";

interface Props {
  session: Session;
  onNav?: (tab: string) => void;
}

export default function Farmacia({ session }: Props) {
  return (
    <FarmaciaSystem session={session} />
  );
}
