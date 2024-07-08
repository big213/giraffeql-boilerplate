export type PriceObject = {
  price: number; // 100
  quantity?: number; // 2
  discount?: number; // 5
  discountPercent?: number; // 5
};

// 2_5,5_10,10_15
export function parseDiscountScheme(discountScheme: string | null | undefined) {
  if (!discountScheme) return [];

  const parts = discountScheme.split(",");

  return parts.map((part) => {
    const subPart = part.split("_");
    return {
      quantity: Number(subPart[0]),
      discount: Number(subPart[1]),
    };
  });
}

export function getPriceObjectFromDiscountScheme({
  discountScheme,
  quantity,
  unitPrice,
}: {
  discountScheme?: string | null | undefined;
  quantity: number;
  unitPrice: number;
}): PriceObject {
  const discountSchemeArray = parseDiscountScheme(discountScheme);

  const fullPrice = unitPrice * quantity;

  for (const ele of discountSchemeArray.reverse()) {
    if (quantity >= ele.quantity) {
      return {
        price: fullPrice,
        discount: Math.round(100 * fullPrice * (ele.discount / 100)) / 100,
        discountPercent: ele.discount,
        quantity,
      };
    }
  }

  // if still not returned, just return the price * quantity
  return {
    price: fullPrice,
    quantity,
  };
}
