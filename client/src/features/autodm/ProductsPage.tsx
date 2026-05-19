import { Edit, Link as LinkIcon, MoreVertical, Package, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, deleteProduct, listProducts, updateProduct } from "@/services/autodm/products";
import { useAutoDM } from "./AutoDMContext";
import { AutoDMConnectionGate } from "./AutoDMConnectionGate";

export default function ProductsPage() {
  const { socialUser } = useAutoDM();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: "", link: "", image_url: "" });

  const loadData = async () => {
    if (!socialUser?.userId) return;
    setProducts(await listProducts(socialUser.userId));
  };

  useEffect(() => {
    loadData().catch((error) => toast.error(error.message || "Failed to load products"));
  }, [socialUser?.userId]);

  const filteredProducts = useMemo(
    () => products.filter((product) => product.name?.toLowerCase().includes(searchQuery.toLowerCase()) || product.description?.toLowerCase().includes(searchQuery.toLowerCase())),
    [products, searchQuery]
  );

  return (
    <AutoDMConnectionGate requireBusinessConnection={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Products</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sell products or lead magnets directly from your automation flows.</p>
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: "", description: "", price: "", link: "", image_url: "" });
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products..." className="pl-10" />
        </div>

        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-sm text-muted-foreground">{searchQuery ? "No products match your search." : "No products yet."}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.image_url ? (
                  <div className="aspect-video overflow-hidden bg-slate-100">
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
                    <Package className="h-10 w-10 text-orange-300" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{product.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingProduct(product);
                            setFormData({
                              name: product.name,
                              description: product.description || "",
                              price: String(product.price || ""),
                              link: product.external_url || "",
                              image_url: product.image_url || "",
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {product.external_url ? (
                          <DropdownMenuItem onClick={() => window.open(product.external_url, "_blank")}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Open Link
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(product.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-slate-900">${product.price}</span>
                    <Badge variant={product.is_active ? "success" : "secondary"}>{product.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
              <DialogDescription>{editingProduct ? "Update product details." : "Create a new product for your flows."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price (USD)</Label>
                <Input type="number" value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Product Link</Label>
                <Input value={formData.link} onChange={(event) => setFormData({ ...formData, link: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={formData.image_url} onChange={(event) => setFormData({ ...formData, image_url: event.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    const payload = {
                      user_id: socialUser.userId,
                      name: formData.name,
                      description: formData.description || null,
                      price: Number(formData.price),
                      currency: "USD",
                      image_url: formData.image_url || null,
                      external_url: formData.link || null,
                      is_active: true,
                    };
                    if (editingProduct) {
                      await updateProduct(editingProduct.id, socialUser.userId, payload);
                    } else {
                      await createProduct(payload);
                    }
                    await loadData();
                    setDialogOpen(false);
                    toast.success(editingProduct ? "Product updated" : "Product created");
                  } catch (error) {
                    toast.error(error.message || "Failed to save product");
                  }
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete product</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteProduct(deleteId, socialUser.userId);
                  await loadData();
                  toast.success("Product deleted");
                  setDeleteId(null);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AutoDMConnectionGate>
  );
}
