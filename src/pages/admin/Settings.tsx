import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { fetchSettingsMap } from "@/lib/settings";

const AdminSettings = () => {
  const [status, setStatus] = useState("open");
  const [momoCode, setMomoCode] = useState("");
  const [merchantName, setMerchantName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const mapObj = await fetchSettingsMap();
        setStatus((mapObj["service_status"] as string) || "open");
        setMomoCode(mapObj["momo_code"] || "");
        setMerchantName(mapObj["merchant_name"] || "");
      } catch (e: any) {
        toast({ title: "Could not load settings", description: e?.message || "", variant: "destructive" });
      }
    })();
  }, []);

  const save = async () => {
    const upserts = [
      { key: "service_status", value: status },
      { key: "momo_code", value: momoCode },
      { key: "merchant_name", value: merchantName },
    ];
    const { error } = await supabase.from("settings").upsert(upserts, { onConflict: "key" });
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Settings saved", description: "Your changes are live." });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium">Restaurant Status</div>
        <div className="mt-2 flex gap-2">
          <Button variant={status === "open" ? "default" : "outline"} onClick={() => setStatus("open")}>Open</Button>
          <Button variant={status === "closed" ? "default" : "outline"} onClick={() => setStatus("closed")}>Closed</Button>
        </div>
      </div>
      <div>
        <div className="text-sm font-medium">MoMo Code</div>
        <Input value={momoCode} onChange={(e) => setMomoCode(e.target.value)} placeholder="18281XXXXXX#" />
      </div>
      <div>
        <div className="text-sm font-medium">Merchant Name</div>
        <Input value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Merchant Ltd" />
      </div>
      <div>
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  );
};

export default AdminSettings;


