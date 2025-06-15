/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет прибыли от операции
  // purchase — это одна из записей в поле items из чека в data.purchase_records
  // _product — это продукт из коллекции data.products
  const { discount, sale_price, quantity } = purchase;
  const discountAmount = sale_price * (discount / 100);
  const finalPrice = sale_price - discountAmount;
  return finalPrice * quantity;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  if (index === 0) {
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  const { calculateRevenue, calculateBonus } = options;

  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records)
  ) {
    throw new Error("Некорректные входные данные");
  }
  // @TODO: Проверка наличия опций
  if (
    typeof options?.calculateRevenue !== "function" ||
    typeof options?.calculateBonus !== "function"
  ) {
    throw new Error("Не переданы обязательные функции для расчетов");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellersStats = {};
  data.sellers.forEach((seller) => {
    sellersStats[seller.id] = {
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {},
    };
  });

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = {};
  data.sellers.forEach((seller) => {
    sellerIndex[seller.id] = seller;
  });
  const productIndex = {};
  data.products.forEach((product) => {
    productIndex[product.sku] = product;
  });

  // @TODO: Расчет выручки и прибыли для каждого продавца

  // @TODO: Подготовка итоговой коллекции с нужными полями

  data.purchase_records.forEach((record) => {
    // Чек
    // Продавец
    const sellerStat = sellersStats[record.seller_id];
    // Увеличить количество продаж
    sellerStat.sales_count += 1;
    // Увеличить общую сумму всех продаж
    sellerStat.revenue += record.total_amount;

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const itemCost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const itemRevenue = options.calculateRevenue(item, product);
      // Посчитать прибыль: выручка минус себестоимость
      const itemProfit = itemRevenue - itemCost;
      // Увеличить общую накопленную прибыль (profit) у продавца
      sellerStat.profit += itemProfit;
      // Учёт количества проданных товаров
      if (!sellerStat.products_sold[item.sku]) {
        sellerStat.products_sold[item.sku] = 0;
      }
      // По артикулу товара увеличить его проданное количество у продавца
      sellerStat.products_sold[item.sku] += item.quantity;
    });
  });
  // @TODO: Сортировка продавцов по прибыли
  const sortedSellers = Object.values(sellersStats).sort(
    (a, b) => b.profit - a.profit
  );
  const totalSellers = sortedSellers.length;

  // @TODO: Назначение премий на основе ранжирования
  sortedSellers.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, totalSellers, seller);
  // Формируем топ-10 товаров
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({
        sku,
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });
  return sortedSellers.map((seller) => ({
    seller_id: seller.seller_id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Целое число, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
  }));
}
