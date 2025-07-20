const formatPrice = (price: string | number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof price === "string" ? parseFloat(price) : price);
};

const formatPercent = (percent: string | number) => {
  const value = typeof percent === "string" ? parseFloat(percent) : percent;
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
};
