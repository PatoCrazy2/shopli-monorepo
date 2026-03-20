"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/card";
import { Progress } from "@repo/ui/progress";

interface BranchSale {
  name: string;
  total: number;
}

export function BranchSales({ data }: { data: BranchSale[] }) {
  const maxSale = Math.max(...data.map(d => d.total), 1);

  return (
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Ventas por Sucursal</CardTitle>
        <CardDescription>
          Proporción de ventas de hoy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              No hay ventas registradas hoy.
            </p>
          ) : (
            data.map((item, index) => {
              const percentage = (item.total / maxSale) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground font-medium">${item.total.toFixed(2)}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
