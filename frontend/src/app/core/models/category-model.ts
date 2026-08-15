export class CategoryModel {
    constructor(
        public id: number,
        public name: string,
        public user_id: number,
        public color: string,
        public type: "income" | "outcome",
        public budget_amount: number | null = null,
        public spent_amount: number = 0,
        public remaining_amount: number | null = null,
    ) { }
}
