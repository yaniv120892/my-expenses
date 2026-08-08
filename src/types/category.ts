export type Category = {
  id: string;
  name: string;
  /**
   * Present when the category was loaded with its hierarchy — getAllCategories
   * selects it. Optional because getTopLevelCategories does not.
   */
  parentId?: string | null;
};
