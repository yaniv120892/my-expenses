export const categoryNameMap: Record<string, string> = {
  'אופניים וקורקינט': 'Bikes & Scooters',
  'אינטרנט וטלוויזיה': 'Internet & TV',
  'חשבון גז': 'Gas Bill',
  'חשבון מים': 'Water Bill',
  השקעות: 'Investments',
  'ועד בית': 'Building Committee',
  חשבונות: 'Bills',
  חשמל: 'Electricity',
  חתונה: 'Wedding',
  טלפון: 'Phone',
  מונית: 'Taxi',
  'מוצרים לבית': 'Home Products',
  משכנתא: 'Mortgage',
  קולנוע: 'Cinema',
  'קופ"ח': 'HMO/Health Fund',
  תינוקות: 'Babies',
  תרומה: 'Donation',
};

export function normalizeCategoryName(name: string): string {
  try {
    const trimmed = name.trim();
    return categoryNameMap[trimmed] || trimmed;
  } catch (error) {
    console.error(`Error normalizing category name: ${name}`, error);
    throw new Error(`Failed to normalize category name: ${name}, ${error}`);
  }
}
