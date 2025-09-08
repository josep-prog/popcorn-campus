import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AdminClients = () => {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .order("full_name");
      setRows(data || []);
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Clients</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4">{r.full_name || "—"}</td>
                <td className="py-2 pr-4">{r.phone || "—"}</td>
                <td className="py-2 pr-4">{"active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminClients;


