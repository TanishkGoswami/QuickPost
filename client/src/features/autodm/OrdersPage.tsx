import { AlertCircle, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Card, CardContent } from "@/components/ui/card";
import { listOrders } from "@/services/autodm/orders";
import { useAutoDM } from "./AutoDMContext";
import { AutoDMConnectionGate } from "./AutoDMConnectionGate";

export default function OrdersPage() {
  const { socialUser } = useAutoDM();
  const [orders, setOrders] = useState([]);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!socialUser?.userId) return;
    listOrders(socialUser.userId)
      .then((result) => {
        setOrders(result.data);
        setUnavailable(result.unavailable);
      })
      .catch((error) => toast.error(error.message || "Failed to load orders"));
  }, [socialUser?.userId]);

  return (
    <AutoDMConnectionGate requireBusinessConnection={false}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track purchases that come through your Auto DM flows.</p>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            {unavailable ? (
              <>
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
                <p className="font-medium text-slate-900">Orders backend not available yet</p>
                <p className="mt-2 max-w-xl mx-auto text-sm text-muted-foreground">
                  The current AutoDM Supabase schema does not include an `orders` table. The UI is wired and ready,
                  and a migration scaffold has been added as part of this merge.
                </p>
              </>
            ) : orders.length === 0 ? (
              <>
                <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p className="font-medium text-slate-900">No orders yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Orders will appear here once the commerce flow is live.</p>
              </>
            ) : (
              <pre className="overflow-auto rounded-lg bg-slate-900 p-4 text-left text-xs text-white">{JSON.stringify(orders, null, 2)}</pre>
            )}
          </CardContent>
        </Card>
      </div>
    </AutoDMConnectionGate>
  );
}
