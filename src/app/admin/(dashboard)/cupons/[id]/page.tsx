"use client";

import { useParams } from "next/navigation";
import { CouponForm } from "@/components/admin/CouponForm";

export default function EditarCupomPage() {
  const params = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Editar cupom</h1>
      <CouponForm mode="edit" couponId={params.id} />
    </div>
  );
}
