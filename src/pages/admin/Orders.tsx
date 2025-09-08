import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AdminOrders = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, user_id, portions, location, total_price, status, created_at, payments:payments(txid)")
        .order("created_at", { ascending: false });
      setRows(data || []);
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Orders</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Order ID</th>
              <th className="py-2 pr-4">Client ID</th>
              <th className="py-2 pr-4">Portions</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Payment Status</th>
              <th className="py-2 pr-4">Order Status</th>
              <th className="py-2 pr-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4">#{r.id}</td>
                <td className="py-2 pr-4">{r.user_id}</td>
                <td className="py-2 pr-4">{r.portions}</td>
                <td className="py-2 pr-4">{r.location}</td>
                <td className="py-2 pr-4">{r.payments?.[0]?.txid ? "Confirmed" : "Pending"}</td>
                <td className="py-2 pr-4">{r.status || "pending"}</td>
                <td className="py-2 pr-4">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;


