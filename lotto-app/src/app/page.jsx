import ContractInteraction from "@/components/ContractInteraction";
import MintTicket from "@/components/MintTicket"

export default function Home() {
  return (
    <div>
      <h1>Blockchain Interaction</h1>
      <MintTicket />
      <ContractInteraction />
    </div>
  );
}