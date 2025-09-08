import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">—</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">— RWF</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">—</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">—</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;


