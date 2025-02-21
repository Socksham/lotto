"use client"

import { useState } from "react";
import { getContract } from "@/utils/contract";

export default function ContractInteraction() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const callFunction = async () => {
    try {
      setLoading(true);
      const contract = await getContract();

      // Replace 'yourFunction' with the actual function name from your contract
      const response = await contract.getCurrentRoundInfo();
      console.log("hello")
      console.log(contract)
      setMessage(response.toString());
    } catch (error) {
      console.error("Error calling contract function:", error);
      setMessage("Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={callFunction} disabled={loading}>
        {loading ? "Executing..." : "Call Function"}
      </button>
      <p>Response: {message}</p>
    </div>
  );
}
