import { CategoryModel } from "./category-model";

export class TableCategoryModel {
    constructor(
        public categories: CategoryModel[],
        public has_next_page: boolean,
        public has_previous_page: boolean,
        public current_page: number,
        public element_per_page: number,
        public total: number,
    ) { }
}