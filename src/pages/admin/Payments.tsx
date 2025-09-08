import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AdminPayments = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, txid, payer_name, phone_number, received_at")
        .order("received_at", { ascending: false })
        .limit(200);
      setRows(data || []);
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Payments (SMS confirmations)</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">TxID</th>
              <th className="py-2 pr-4">Payer Name</th>
              <th className="py-2 pr-4">Phone Number</th>
              <th className="py-2 pr-4">Received At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4">{r.txid}</td>
                <td className="py-2 pr-4">{r.payer_name}</td>
                <td className="py-2 pr-4">{r.phone_number}</td>
                <td className="py-2 pr-4">{new Date(r.received_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;


