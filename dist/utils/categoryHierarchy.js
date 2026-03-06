"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCategoryParentMap = buildCategoryParentMap;
const categoryRepository_1 = __importDefault(require("../repositories/categoryRepository"));
async function buildCategoryParentMap() {
    const allCategories = await categoryRepository_1.default.getAllCategories();
    const parentMap = new Map();
    // First pass: Create a map of category ID to its parent ID
    const categoryToParentMap = new Map();
    for (const category of allCategories) {
        if ('parentId' in category && category.parentId !== null) {
            categoryToParentMap.set(category.id, category.parentId);
        }
    }
    // Second pass: For each category, traverse up to find top-level parent
    for (const category of allCategories) {
        let currentId = category.id;
        let parentId = categoryToParentMap.get(currentId);
        // If we've already processed this category, skip it
        if (parentMap.has(currentId))
            continue;
        // Keep going up the chain until we find a category with no parent
        while (parentId) {
            const nextParentId = categoryToParentMap.get(parentId);
            if (!nextParentId) {
                // We found the top-level parent
                parentMap.set(currentId, parentId);
                break;
            }
            currentId = parentId;
            parentId = nextParentId;
        }
        // If we didn't find a parent, this category is itself a top-level category
        if (!parentMap.has(category.id)) {
            parentMap.set(category.id, category.id);
        }
    }
    return parentMap;
}
