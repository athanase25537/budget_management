import { TransactionModel } from "./transaction-model";

export class TableTransactionModel {
    constructor(
        public transactions: TransactionModel[],
        public has_next_page: boolean,
        public has_previous_page: boolean,
        public current_page: number,
        public element_per_page: number,
        public total: number,
        public need_footer: boolean,
    ) { }
}