import { CategoryModel } from "./category-model";

export interface CategorySummary {
    total_categories: number;
    created_this_month: number;
    most_used: {
        id: number;
        name: string;
        color: string;
        transaction_count: number;
    } | null;
}

export class TableCategoryModel {
    constructor(
        public categories: CategoryModel[],
        public has_next_page: boolean,
        public has_previous_page: boolean,
        public current_page: number,
        public element_per_page: number,
        public total: number,
        public summary: CategorySummary,
    ) { }
}
