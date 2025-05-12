"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryNameMap = void 0;
exports.normalizeCategoryName = normalizeCategoryName;
exports.categoryNameMap = {
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
function normalizeCategoryName(name) {
    try {
        const trimmed = name.trim();
        return exports.categoryNameMap[trimmed] || trimmed;
    }
    catch (error) {
        console.error(`Error normalizing category name: ${name}`, error);
        throw new Error(`Failed to normalize category name: ${name}, ${error}`);
    }
}
