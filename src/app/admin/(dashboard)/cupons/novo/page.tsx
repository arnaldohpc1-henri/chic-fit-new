import { CouponForm } from "@/components/admin/CouponForm";

export default function NovoCupomPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Novo cupom</h1>
      <CouponForm mode="create" />
    </div>
  );
}
