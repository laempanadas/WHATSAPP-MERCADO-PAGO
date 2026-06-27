export function calcularTotal(items) {
    let total = 0;
  
    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || item.item_price || 0);
      total += quantity * unitPrice;
    }
  
    return Number(total.toFixed(2));
  }