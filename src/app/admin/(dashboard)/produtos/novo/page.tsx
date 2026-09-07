import { ProductForm } from "@/components/admin/ProductForm";

export default function NovoProdutoPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Nova peça</h1>
      <ProductForm mode="create" />
    </div>
  );
}
